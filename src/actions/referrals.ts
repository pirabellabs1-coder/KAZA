"use server";

// =============================================================================
// KAZA - Referrals (Server Actions)
//
// `referral_codes(user_id PK, code unique)` : 1 code par utilisateur.
// `referrals(referrer_id, referred_id, code, status, points_awarded, ...)`.
//
// Cette action garantit qu'un user a toujours un code utilisable : si
// la ligne n'existe pas encore elle est creee en testant plusieurs codes
// aleatoires en cas de collision (code unique vol 23505).
// =============================================================================

import "server-only";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/notifications/resend";
import { referralInviteTemplate } from "@/lib/notifications/templates";

interface CodeResult {
  code: string | null;
  error?: string;
}

export interface InviteResult {
  success: boolean;
  error?: string;
}

function genCode(name: string): string {
  const clean = name.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);
  const prefix = clean.length > 0 ? clean : "KAZ";
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}${suffix}`;
}

/**
 * Logique interne (sans auth ni revalidate) : garantit qu'un code de
 * parrainage existe pour `userId` et le retourne. Reutilisee par
 * `getOrCreateReferralCode` et `inviteByEmail`.
 */
async function ensureReferralCode(
  supabase: SupabaseClient,
  userId: string,
): Promise<CodeResult> {
  // 1) Existe deja ?
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase.from as any)("referral_codes")
    .select("code")
    .eq("user_id", userId)
    .maybeSingle();
  const existingCode = (existing as { code?: string } | null)?.code;
  if (existingCode) return { code: existingCode };

  // 2) Prepare un seed lisible (initiales du prenom).
  const { data: profile } = await supabase
    .from("users")
    .select("first_name")
    .eq("id", userId)
    .maybeSingle();
  const seed = (profile as { first_name?: string } | null)?.first_name ?? "KAZA";

  // 3) Tente 5 codes — collision -> retry.
  for (let i = 0; i < 5; i++) {
    const code = genCode(seed);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inserted, error } = await (supabase.from as any)(
      "referral_codes",
    )
      .insert({ user_id: userId, code })
      .select("code")
      .single();

    if (inserted && (inserted as { code?: string }).code) {
      return { code: (inserted as { code: string }).code };
    }
    // 23505 = unique_violation Postgres. Sinon on remonte l'erreur.
    if (error && (error as { code?: string }).code !== "23505") {
      return { code: null, error: error.message ?? "Erreur Supabase" };
    }
  }

  return { code: null, error: "Impossible de generer un code unique." };
}

/**
 * Recupere le code de parrainage du user courant ; le cree s'il n'existe
 * pas. Reessaie jusqu'a 5 fois en cas de collision sur la contrainte
 * unique `code` (code Postgres 23505).
 */
export async function getOrCreateReferralCode(): Promise<CodeResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { code: null, error: "Vous devez etre connecte." };

  const result = await ensureReferralCode(supabase, user.id);
  if (result.code) revalidatePath("/referral");
  return result;
}

const inviteSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Adresse email invalide.");

/**
 * Envoie une invitation de parrainage par email :
 *   1. garantit le code de parrainage du user courant ;
 *   2. envoie un VRAI email (Resend) avec un lien d'inscription porteur du code ;
 *   3. journalise l'invitation dans `referral_invitations` (dedup par email).
 *
 * Le destinataire est l'email saisi par l'utilisateur. L'expediteur est
 * `process.env.NOTIFICATIONS_FROM_EMAIL` (gere par `sendEmail`).
 */
export async function inviteByEmail(email: string): Promise<InviteResult> {
  const parsed = inviteSchema.safeParse(email);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Adresse email invalide.",
    };
  }
  const toEmail = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Vous devez etre connecte." };

  // On n'invite pas son propre email.
  if (user.email && user.email.toLowerCase() === toEmail) {
    return {
      success: false,
      error: "Vous ne pouvez pas vous inviter vous-meme.",
    };
  }

  // 1) Code de parrainage (cree a la volee si besoin).
  const codeResult = await ensureReferralCode(supabase, user.id);
  if (!codeResult.code) {
    return {
      success: false,
      error: codeResult.error ?? "Impossible de generer votre code.",
    };
  }
  const code = codeResult.code;

  // 2) Nom affiche de l'inviteur (pour l'email).
  const { data: profile } = await supabase
    .from("users")
    .select("first_name, last_name")
    .eq("id", user.id)
    .maybeSingle();
  const p = profile as { first_name?: string; last_name?: string } | null;
  const inviterName =
    [p?.first_name, p?.last_name].filter(Boolean).join(" ").trim() ||
    "Un membre KAZA";

  // 3) Lien d'inscription porteur du code.
  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL ?? "https://kaza-jade.vercel.app"
  ).replace(/\/$/, "");
  const signupUrl = `${appUrl}/signup?ref=${encodeURIComponent(code)}`;

  // 4) Email reel via Resend.
  const template = referralInviteTemplate({ inviterName, code, signupUrl });
  const emailRes = await sendEmail(toEmail, template.subject, template.html);
  if (!emailRes.success) {
    return {
      success: false,
      error: "Impossible d'envoyer l'email d'invitation. Reessayez.",
    };
  }

  // 5) Journalisation (best-effort : un echec d'upsert ne casse pas l'envoi).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: logError } = await (supabase.from as any)(
    "referral_invitations",
  ).upsert(
    {
      inviter_id: user.id,
      email: toEmail,
      code,
      status: "PENDING",
    },
    { onConflict: "inviter_id,email" },
  );
  if (logError) {
    console.error("[referrals] inviteByEmail log:", logError.message);
  }

  revalidatePath("/referral");
  return { success: true };
}
