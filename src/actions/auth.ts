"use server";

import "server-only";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/notifications/resend";
import { track } from "@/lib/analytics/track";
import { DEMO_SESSION_COOKIE } from "@/lib/auth/demo-session";
import type {
  LoginFormData,
  SignupFormData,
  ForgotPasswordFormData,
} from "@/validators/auth";

type AuthResult = {
  error?: string;
  success?: boolean;
  message?: string;
  redirectTo?: string;
  /** true si un second facteur (TOTP) est requis pour finaliser la connexion. */
  mfaRequired?: boolean;
};

/**
 * Rôles supportés par l'auth KAZA. AGENCY est conservé pour la sélection à
 * l'inscription (le profil agence partage les droits OWNER côté RBAC) même
 * si la colonne `users.role` ne le matérialise pas encore en base.
 */
type AuthRole = "OWNER" | "TENANT" | "STUDENT" | "AGENCY" | "ADMIN";

const ROLE_LABELS: Record<AuthRole, string> = {
  OWNER: "Propriétaire",
  TENANT: "Locataire",
  STUDENT: "Étudiant",
  AGENCY: "Agence immobilière",
  ADMIN: "Administrateur",
};

const ROLE_LANDING: Record<AuthRole, string> = {
  OWNER: "/owner/properties",
  TENANT: "/tenant/saved",
  STUDENT: "/student/colocations",
  AGENCY: "/agency",
  ADMIN: "/admin",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Best-effort clear du cookie démo legacy pour les utilisateurs qui avaient
 * encore une session avant la bascule prod. Ne fait rien si déjà absent.
 */
async function clearDemoSessionCookie() {
  const store = await cookies();
  store.delete(DEMO_SESSION_COOKIE);
}

/**
 * Notification interne (best-effort) à l'équipe KAZA pour chaque inscription.
 * N'attend pas la réponse pour ne pas bloquer la redirection.
 */
async function notifyTeamOfSignup(data: SignupFormData) {
  const recipient = process.env.NOTIFICATIONS_CONTACT_EMAIL;
  if (!recipient) return;
  try {
    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;color:#1A3A52;">
        <div style="background:#1A3A52;color:white;padding:24px;border-radius:8px 8px 0 0;">
          <h1 style="margin:0;font-size:20px;">Nouvelle inscription KAZA</h1>
        </div>
        <div style="background:white;padding:24px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 8px 8px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#6b7280;width:120px;">Nom :</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Email :</td><td style="padding:6px 0;"><a href="mailto:${escapeHtml(data.email)}" style="color:#1976D2;">${escapeHtml(data.email)}</a></td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Téléphone :</td><td style="padding:6px 0;">${escapeHtml(data.phone)}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Profil :</td><td style="padding:6px 0;">${ROLE_LABELS[data.role as AuthRole]}</td></tr>
          </table>
          <p style="margin-top:16px;font-size:12px;color:#9ca3af;">Compte créé via Supabase Auth.</p>
        </div>
      </div>
    `;
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
// SIGNUP — Supabase Auth (autoconfirm activé côté projet)
// =============================================================================

const REFERRED_SIGNUP_BONUS = 500;

/**
 * Best-effort : si l'inscription contient un `referralCode` valide,
 *   1) cree la ligne `referrals(referrer, referred, code, PENDING)`,
 *   2) credite 500 pts SIGNUP_BONUS supplementaires au filleul.
 *
 * Le credit de 1000 pts REFERRAL au parrain sera fait plus tard (quand
 * le filleul aura signe son premier contrat — workflow contracts).
 *
 * En cas d'erreur, on logge et on continue : on ne veut pas casser un
 * signup pour un bonus.
 */
async function applyReferralBonus(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
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

    // Lien parrain ↔ filleul (idempotent grace au unique (referred_id))
    const { error: refErr } = await supabase.from("referrals").insert({
      referrer_id: referrerId,
      referred_id: referredUserId,
      code,
      status: "PENDING",
      points_awarded: 0,
    });
    if (refErr && refErr.code !== "23505") {
      console.error("[auth] referrals insert failed:", refErr);
      return;
    }

    // Bonus filleul (500 pts en plus des 100 du trigger d'inscription)
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

export async function signup(data: SignupFormData): Promise<AuthResult> {
  const role = data.role as AuthRole;

  const supabase = await createClient();
  const { data: signupData, error: signupError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        first_name: data.firstName,
        last_name: data.lastName,
        role: data.role,
        phone: data.phone,
      },
    },
  });

  if (signupError) {
    if (
      signupError.message.includes("already registered") ||
      signupError.message.toLowerCase().includes("already exists")
    ) {
      return {
        error:
          "Un compte avec cette adresse email existe déjà. Connectez-vous ou utilisez « Mot de passe oublié ».",
      };
    }
    return { error: signupError.message };
  }

  // Notification interne best-effort
  void notifyTeamOfSignup(data);

  // Bonus parrainage best-effort (n'interrompt pas la redirection)
  const referralCode = data.referralCode?.trim();
  const newUserId = signupData.user?.id;
  if (referralCode && newUserId) {
    void applyReferralBonus(supabase, newUserId, referralCode);
  }

  // Tracking analytics — best-effort.
  await track({
    eventType: "SIGNUP_COMPLETED",
    metadata: { role: data.role },
  });

  // Redirection vers l'espace métier du rôle (ou /dashboard par défaut)
  return {
    success: true,
    redirectTo: ROLE_LANDING[role] ?? "/dashboard",
  };
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
  // finalisée tant que le code n'est pas saisi. On ne redirige pas : le
  // formulaire affichera l'étape de vérification (verifyMfaLogin).
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

  // Récupère le rôle pour rediriger vers le bon espace
  const role =
    (authData.user?.user_metadata?.role as AuthRole | undefined) ?? "TENANT";

  // Tracking analytics — best-effort.
  await track({ eventType: "LOGIN" });

  return {
    success: true,
    redirectTo: ROLE_LANDING[role] ?? "/dashboard",
  };
}

// =============================================================================
// LOGIN — Vérification du second facteur (TOTP / 2FA)
// =============================================================================
/**
 * Finalise une connexion en attente de 2FA : relève le niveau d'assurance à
 * AAL2 en validant le code TOTP de l'application d'authentification.
 */
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
  // Clear cookie démo legacy au cas où des utilisateurs ont encore
  // un vieux cookie de session avant la bascule prod.
  await clearDemoSessionCookie();
  redirect("/");
}

// =============================================================================
// FORGOT PASSWORD — Supabase Auth
// =============================================================================
export async function forgotPassword(
  data: ForgotPasswordFormData,
): Promise<AuthResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
  });
  if (error) return { error: error.message };
  return { success: true };
}
