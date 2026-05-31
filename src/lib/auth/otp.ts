import "server-only";

import { createHmac, timingSafeEqual, randomInt } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";

// =============================================================================
// KAZA — Codes de vérification email (OTP) : génération + vérification.
// Codes à 6 chiffres, valables 10 minutes, 5 tentatives max. Stockés hachés
// (HMAC-SHA256) dans `email_otps`. Accès via service role uniquement.
// =============================================================================

export type OtpPurpose = "SIGNUP" | "RESET";

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 45 * 1000; // anti-spam : 1 envoi / 45 s

function secret(): string {
  // SUPABASE_SERVICE_ROLE_KEY est toujours présent côté serveur ; sert de clé
  // de hachage si OTP_SECRET n'est pas défini.
  return (
    process.env.OTP_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "kaza-otp-fallback-secret"
  );
}

function hashCode(code: string): string {
  return createHmac("sha256", secret()).update(code, "utf8").digest("hex");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function admin(): SupabaseClient {
  return createAdminClient() as unknown as SupabaseClient;
}

export type CreateOtpResult =
  | { ok: true; code: string }
  | { ok: false; error: string };

/**
 * Génère et stocke un nouveau code pour (email, purpose), invalide les codes
 * précédents non consommés, et renvoie le code en clair (à envoyer par email).
 * Applique un délai anti-spam entre deux envois.
 */
export async function createEmailOtp(
  rawEmail: string,
  purpose: OtpPurpose,
): Promise<CreateOtpResult> {
  const email = normalizeEmail(rawEmail);
  const db = admin();

  // Anti-spam : refuse si un code a été émis il y a moins de RESEND_COOLDOWN_MS.
  const { data: recent } = await db
    .from("email_otps")
    .select("created_at")
    .eq("email", email)
    .eq("purpose", purpose)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const last = (recent as { created_at?: string } | null)?.created_at;
  if (last && Date.now() - new Date(last).getTime() < RESEND_COOLDOWN_MS) {
    return {
      ok: false,
      error: "Un code vient d'être envoyé. Patientez avant de redemander.",
    };
  }

  // Invalide les anciens codes non consommés (un seul code actif à la fois).
  await db
    .from("email_otps")
    .update({ consumed_at: new Date().toISOString() })
    .eq("email", email)
    .eq("purpose", purpose)
    .is("consumed_at", null);

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const { error } = await db.from("email_otps").insert({
    email,
    code_hash: hashCode(code),
    purpose,
    expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
  });
  if (error) {
    console.error("[otp] insert failed:", error.message);
    return { ok: false, error: "Impossible de générer le code. Réessayez." };
  }

  return { ok: true, code };
}

export type VerifyOtpResult = { ok: true } | { ok: false; error: string };

/**
 * Vérifie un code pour (email, purpose). Consomme le code en cas de succès,
 * incrémente le compteur de tentatives en cas d'échec.
 */
export async function verifyEmailOtp(
  rawEmail: string,
  purpose: OtpPurpose,
  rawCode: string,
): Promise<VerifyOtpResult> {
  const email = normalizeEmail(rawEmail);
  const code = (rawCode ?? "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(code)) {
    return { ok: false, error: "Entrez le code à 6 chiffres reçu par email." };
  }

  const db = admin();
  const { data } = await db
    .from("email_otps")
    .select("id, code_hash, expires_at, attempts, consumed_at")
    .eq("email", email)
    .eq("purpose", purpose)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const row = data as {
    id: string;
    code_hash: string;
    expires_at: string;
    attempts: number;
  } | null;

  if (!row) {
    return { ok: false, error: "Aucun code valide. Demandez un nouveau code." };
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false, error: "Code expiré. Demandez un nouveau code." };
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    await db
      .from("email_otps")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", row.id);
    return {
      ok: false,
      error: "Trop de tentatives. Demandez un nouveau code.",
    };
  }

  let match = false;
  try {
    const a = Buffer.from(row.code_hash, "hex");
    const b = Buffer.from(hashCode(code), "hex");
    match = a.length === b.length && timingSafeEqual(a, b);
  } catch {
    match = false;
  }

  if (!match) {
    await db
      .from("email_otps")
      .update({ attempts: row.attempts + 1 })
      .eq("id", row.id);
    const left = MAX_ATTEMPTS - (row.attempts + 1);
    return {
      ok: false,
      error:
        left > 0
          ? `Code incorrect. ${left} tentative${left > 1 ? "s" : ""} restante${left > 1 ? "s" : ""}.`
          : "Code incorrect. Demandez un nouveau code.",
    };
  }

  // Succès → consomme le code.
  await db
    .from("email_otps")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", row.id);
  return { ok: true };
}
