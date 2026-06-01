"use server";

import "server-only";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/notifications/resend";
import { buildEmail } from "@/lib/notifications/email-template";
import { createEmailOtp, verifyEmailOtp, type OtpPurpose } from "@/lib/auth/otp";
import { track } from "@/lib/analytics/track";
import { DEMO_SESSION_COOKIE } from "@/lib/auth/demo-session";
import type { LoginFormData, SignupFormData } from "@/validators/auth";

type AuthResult = {
  error?: string;
  success?: boolean;
  message?: string;
  redirectTo?: string;
  /** true si un second facteur (TOTP) est requis pour finaliser la connexion. */
  mfaRequired?: boolean;
  /**
   * false = inscription finalisée sans code (le domaine email n'est pas encore
   * vérifié → on crée le compte directement). true = un code email est attendu.
   */
  codeRequired?: boolean;
};

/**
 * Vérification par CODE email activée ? Tant que le domaine d'envoi (Resend)
 * n'est pas vérifié, les emails ne partent pas : on bascule sur l'inscription
 * directe (sans code). Mettre EMAIL_OTP_ENABLED=true dans Vercel une fois le
 * domaine vérifié pour réactiver les codes email — sans changer le code.
 */
const EMAIL_OTP_ENABLED = process.env.EMAIL_OTP_ENABLED === "true";

/**
 * Rôles supportés par l'auth KAZA. AGENCY est conservé pour la sélection à
 * l'inscription (le profil agence partage les droits OWNER côté RBAC) même
 * si la colonne `users.role` ne le matérialise pas encore en base.
 */
type AuthRole =
  | "OWNER"
  | "TENANT"
  | "STUDENT"
  | "AGENCY"
  | "BUYER"
  | "ADMIN";

const ROLE_LABELS: Record<AuthRole, string> = {
  OWNER: "Propriétaire",
  TENANT: "Locataire",
  STUDENT: "Étudiant",
  AGENCY: "Agence immobilière",
  BUYER: "Acheteur",
  ADMIN: "Administrateur",
};

const ROLE_LANDING: Record<AuthRole, string> = {
  OWNER: "/owner/properties",
  TENANT: "/tenant/saved",
  STUDENT: "/student/colocations",
  AGENCY: "/agency",
  BUYER: "/buyer",
  ADMIN: "/admin",
};

function adminClient(): SupabaseClient {
  return createAdminClient() as unknown as SupabaseClient;
}

/**
 * Best-effort clear du cookie démo legacy pour les utilisateurs qui avaient
 * encore une session avant la bascule prod. Ne fait rien si déjà absent.
 */
async function clearDemoSessionCookie() {
  const store = await cookies();
  store.delete(DEMO_SESSION_COOKIE);
}

/** Retourne l'id du compte associé à un email (ou null s'il n'existe pas). */
async function findUserIdByEmail(email: string): Promise<string | null> {
  const { data } = await adminClient()
    .from("users")
    .select("id")
    .ilike("email", email.trim())
    .maybeSingle();
  return (data as { id?: string } | null)?.id ?? null;
}

// ---------------------------------------------------------------------------
// Email — code de vérification (gabarit KAZA)
// ---------------------------------------------------------------------------

function otpCodeBlock(code: string): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 18px;">
    <tr>
      <td align="center" style="background:#F4F7FB;border:1px solid #E5E7EB;border-radius:12px;padding:22px;">
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#6B7280;margin-bottom:10px;">Votre code de vérification</div>
        <div style="font-family:'Courier New',Courier,monospace;font-size:38px;font-weight:800;letter-spacing:10px;color:#1A3A52;">${code}</div>
      </td>
    </tr>
  </table>
  <p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#6B7280;text-align:center;">
    Ce code expire dans 10 minutes. Ne le partagez avec personne — l'équipe KAZA ne vous le demandera jamais.
  </p>`;
}

async function sendOtpEmail(
  email: string,
  code: string,
  purpose: OtpPurpose,
  firstName?: string,
): Promise<void> {
  const isSignup = purpose === "SIGNUP";
  const html = buildEmail({
    preheader: `Votre code de vérification KAZA : ${code}`,
    heading: isSignup
      ? "Confirmez votre inscription"
      : "Réinitialisation de votre mot de passe",
    intro: firstName ? `Bonjour ${firstName},` : "Bonjour,",
    paragraphs: [
      isSignup
        ? "Bienvenue sur KAZA ! Saisissez le code ci-dessous dans la page d'inscription pour activer votre compte."
        : "Vous avez demandé à réinitialiser votre mot de passe. Saisissez le code ci-dessous, puis choisissez un nouveau mot de passe.",
    ],
    rawHtml: otpCodeBlock(code),
    outro:
      "Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.\n— L'équipe KAZA",
  });
  await sendEmail(
    email,
    isSignup
      ? "Votre code de confirmation KAZA"
      : "Votre code de réinitialisation KAZA",
    html,
  );
}

/**
 * Notification interne (best-effort) à l'équipe KAZA pour chaque inscription.
 */
async function notifyTeamOfSignup(data: SignupFormData) {
  const recipient = process.env.NOTIFICATIONS_CONTACT_EMAIL;
  if (!recipient) return;
  try {
    const html = buildEmail({
      preheader: `Nouvelle inscription : ${data.firstName} ${data.lastName}`,
      heading: "Nouvelle inscription KAZA",
      rows: [
        { label: "Nom", value: `${data.firstName} ${data.lastName}` },
        { label: "Email", value: data.email },
        { label: "Téléphone", value: data.phone },
        { label: "Profil", value: ROLE_LABELS[data.role as AuthRole] },
      ],
      outro: "Compte confirmé par code email.",
    });
    await sendEmail(
      recipient,
      `[KAZA] Nouvelle inscription : ${data.firstName} ${data.lastName}`,
      html,
    );
  } catch (err) {
    console.error("[auth] notify team failed:", err);
  }
}

// =============================================================================
// PARRAINAGE
// =============================================================================

const REFERRED_SIGNUP_BONUS = 500;

async function applyReferralBonus(
  supabase: SupabaseClient,
  referredUserId: string,
  rawCode: string,
): Promise<void> {
  const code = rawCode.trim().toUpperCase();
  if (code.length === 0) return;

  try {
    const { data: codeRow } = await supabase
      .from("referral_codes")
      .select("user_id, code")
      .eq("code", code)
      .maybeSingle();

    const referrerId = (codeRow as { user_id?: string } | null)?.user_id;
    if (!referrerId) {
      console.warn("[auth] referral code unknown:", code);
      return;
    }
    if (referrerId === referredUserId) {
      console.warn("[auth] user used their own referral code");
      return;
    }

    const { error: refErr } = await supabase.from("referrals").insert({
      referrer_id: referrerId,
      referred_id: referredUserId,
      code,
      status: "PENDING",
      points_awarded: 0,
    });
    if (refErr && (refErr as { code?: string }).code !== "23505") {
      console.error("[auth] referrals insert failed:", refErr);
      return;
    }

    const { error: txErr } = await supabase
      .from("kaza_points_transactions")
      .insert({
        user_id: referredUserId,
        type: "SIGNUP_BONUS",
        amount: REFERRED_SIGNUP_BONUS,
        description: `Bonus de bienvenue — parrainage ${code}`,
        metadata: { referral_code: code, referrer_id: referrerId },
      });
    if (txErr) {
      console.error("[auth] referral signup bonus failed:", txErr);
    }
  } catch (err) {
    console.error("[auth] applyReferralBonus error:", err);
  }
}

// =============================================================================
// SIGNUP — Étape 1 : envoi d'un code de vérification par email
// =============================================================================

export async function requestSignupCode(
  data: SignupFormData,
): Promise<AuthResult> {
  const email = data.email?.trim().toLowerCase();
  if (!email) return { error: "Adresse email requise." };

  // Compte déjà existant ?
  const existingId = await findUserIdByEmail(email);
  if (existingId) {
    return {
      error:
        "Un compte avec cette adresse email existe déjà. Connectez-vous ou utilisez « Mot de passe oublié ».",
    };
  }

  // Domaine email pas encore vérifié → inscription DIRECTE (sans code).
  if (!EMAIL_OTP_ENABLED) {
    const res = await createAndSignIn(data);
    return { ...res, codeRequired: false };
  }

  const otp = await createEmailOtp(email, "SIGNUP");
  if (!otp.ok) return { error: otp.error };

  try {
    await sendOtpEmail(email, otp.code, "SIGNUP", data.firstName);
  } catch (err) {
    console.error("[auth] sendOtpEmail signup failed:", err);
    return {
      error: "Impossible d'envoyer le code par email. Réessayez dans un instant.",
    };
  }

  return { success: true, codeRequired: true, message: "Code envoyé." };
}

// =============================================================================
// SIGNUP — Étape 2 : vérification du code + création définitive du compte
// =============================================================================

export async function verifySignupCode(
  data: SignupFormData,
  code: string,
): Promise<AuthResult> {
  const email = data.email?.trim().toLowerCase();
  if (!email) return { error: "Adresse email requise." };

  const check = await verifyEmailOtp(email, "SIGNUP", code);
  if (!check.ok) return { error: check.error };

  return createAndSignIn(data);
}

/**
 * Crée le compte (email confirmé) + parrainage/notif + connexion immédiate.
 * Partagé par l'inscription par code et l'inscription directe.
 */
async function createAndSignIn(data: SignupFormData): Promise<AuthResult> {
  const email = (data.email ?? "").trim().toLowerCase();
  const role = data.role as AuthRole;
  const admin = adminClient();

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: data.password,
    email_confirm: true,
    user_metadata: {
      first_name: data.firstName,
      last_name: data.lastName,
      role: data.role,
      phone: data.phone,
      country: data.country,
    },
  });

  if (createErr) {
    if (/already|exist|registered/i.test(createErr.message)) {
      return {
        error:
          "Un compte avec cette adresse email existe déjà. Connectez-vous.",
      };
    }
    return { error: createErr.message };
  }

  const newUserId = created.user?.id;

  const referralCode = data.referralCode?.trim();
  if (referralCode && newUserId) {
    void applyReferralBonus(admin, newUserId, referralCode);
  }
  void notifyTeamOfSignup(data);

  const supabase = await createClient();
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email,
    password: data.password,
  });
  if (signInErr) {
    return {
      success: true,
      redirectTo: "/login",
      message: "Compte créé. Connectez-vous.",
    };
  }

  await track({ eventType: "SIGNUP_COMPLETED", metadata: { role: data.role } });

  return { success: true, redirectTo: ROLE_LANDING[role] ?? "/dashboard" };
}

// =============================================================================
// LOGIN — Supabase Auth
// =============================================================================
export async function login(data: LoginFormData): Promise<AuthResult> {
  const supabase = await createClient();
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    return {
      error:
        error.message === "Invalid login credentials"
          ? "Email ou mot de passe incorrect."
          : error.message,
    };
  }

  // 2FA : si l'utilisateur a un facteur TOTP vérifié, sa connexion n'est pas
  // finalisée tant que le code n'est pas saisi.
  try {
    const { data: aal } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (
      aal &&
      aal.nextLevel === "aal2" &&
      aal.nextLevel !== aal.currentLevel
    ) {
      return { success: true, mfaRequired: true };
    }
  } catch {
    // En cas d'indisponibilité de l'API MFA, on ne bloque pas la connexion.
  }

  const role =
    (authData.user?.user_metadata?.role as AuthRole | undefined) ?? "TENANT";

  await track({ eventType: "LOGIN" });

  return {
    success: true,
    redirectTo: ROLE_LANDING[role] ?? "/dashboard",
  };
}

// =============================================================================
// LOGIN — Vérification du second facteur (TOTP / 2FA)
// =============================================================================
export async function verifyMfaLogin(code: string): Promise<AuthResult> {
  const cleaned = (code ?? "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(cleaned)) {
    return { error: "Entrez le code à 6 chiffres." };
  }

  const supabase = await createClient();

  const { data: factors, error: fErr } = await supabase.auth.mfa.listFactors();
  if (fErr) return { error: fErr.message };

  const totp = factors?.totp?.[0];
  if (!totp) return { error: "Aucun facteur 2FA actif sur ce compte." };

  const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({
    factorId: totp.id,
  });
  if (cErr || !challenge) {
    return { error: cErr?.message ?? "Échec de la vérification." };
  }

  const { error: vErr } = await supabase.auth.mfa.verify({
    factorId: totp.id,
    challengeId: challenge.id,
    code: cleaned,
  });
  if (vErr) return { error: "Code incorrect ou expiré. Réessayez." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role =
    (user?.user_metadata?.role as AuthRole | undefined) ?? "TENANT";

  await track({ eventType: "LOGIN" });

  return { success: true, redirectTo: ROLE_LANDING[role] ?? "/dashboard" };
}

// =============================================================================
// LOGOUT
// =============================================================================
export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  await clearDemoSessionCookie();
  redirect("/");
}

// =============================================================================
// MOT DE PASSE OUBLIÉ — Étape 1 : envoi d'un code par email
// =============================================================================
export async function requestPasswordResetCode(
  rawEmail: string,
): Promise<AuthResult> {
  const email = rawEmail?.trim().toLowerCase();
  if (!email) return { error: "Adresse email requise." };

  // Domaine email pas encore vérifié → pas d'envoi de code possible.
  if (!EMAIL_OTP_ENABLED) {
    return {
      error:
        "La réinitialisation par email sera bientôt disponible. En attendant, écrivez à immobilierkaza@gmail.com pour réinitialiser votre mot de passe.",
    };
  }

  const userId = await findUserIdByEmail(email);
  // Anti-énumération : on renvoie toujours un succès, mais on n'envoie le code
  // que si le compte existe réellement.
  if (!userId) {
    return { success: true };
  }

  const otp = await createEmailOtp(email, "RESET");
  if (!otp.ok) return { error: otp.error };

  try {
    await sendOtpEmail(email, otp.code, "RESET");
  } catch (err) {
    console.error("[auth] sendOtpEmail reset failed:", err);
    return {
      error: "Impossible d'envoyer le code par email. Réessayez dans un instant.",
    };
  }

  return { success: true };
}

// =============================================================================
// MOT DE PASSE OUBLIÉ — Étape 2 : vérification du code + nouveau mot de passe
// =============================================================================
export async function verifyPasswordResetCode(
  rawEmail: string,
  code: string,
  newPassword: string,
): Promise<AuthResult> {
  const email = rawEmail?.trim().toLowerCase();
  if (!email) return { error: "Adresse email requise." };
  if (!newPassword || newPassword.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }

  const check = await verifyEmailOtp(email, "RESET", code);
  if (!check.ok) return { error: check.error };

  const userId = await findUserIdByEmail(email);
  if (!userId) return { error: "Compte introuvable." };

  const admin = adminClient();
  const { error: updErr } = await admin.auth.admin.updateUserById(userId, {
    password: newPassword,
  });
  if (updErr) return { error: updErr.message };

  // Connexion immédiate avec le nouveau mot de passe.
  const supabase = await createClient();
  const { data: authData, error: signInErr } =
    await supabase.auth.signInWithPassword({ email, password: newPassword });
  if (signInErr) {
    return { success: true, redirectTo: "/login" };
  }

  const role =
    (authData.user?.user_metadata?.role as AuthRole | undefined) ?? "TENANT";
  return { success: true, redirectTo: ROLE_LANDING[role] ?? "/dashboard" };
}
