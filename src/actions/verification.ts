"use server";

// =============================================================================
// KAZA - Identity Verifications (Server Actions)
// Wave 2 - Aminata Traoré
//
// Tunnel d'identité en 3 étapes :
//   1) requestPhoneOtp  → génère et envoie un OTP SMS via Twilio
//   2) verifyPhoneOtp   → vérifie le code (max 5 tentatives, expire après 10 min)
//   3) submitIdentityVerification → insère la vérification en statut PENDING
//                                    après upload des pièces dans Storage.
//
// Convention de retour homogène avec les autres actions du projet :
//   ActionResult<T> = { success: true; data?: T } | { success: false; error: string }
// =============================================================================

import "server-only";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { generateOtp, hashOtp, sendSms } from "@/lib/sms/twilio";

import type { ActionResult } from "./notifications";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// TODO: même limitation que les autres actions (cf. aminata_wave1.md §3.1) —
// le type `Database` ne déclare pas `Relationships`, ce qui fait collapser
// Insert/Update vers `never`. On utilise un client "loose-typed" en attendant
// la régénération via la Supabase CLI.
async function getLooseClient(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

/** Bucket Supabase Storage pour les pièces d'identité (doit être privé). */
const IDENTITY_BUCKET = "identity-documents";

/** Validité du code OTP en minutes. */
const OTP_TTL_MINUTES = 10;

/** Nombre maximum de tentatives de saisie d'un OTP avant blocage. */
const OTP_MAX_ATTEMPTS = 5;

/** Validation minimale d'un numéro de téléphone (format international). */
function isValidPhone(phone: string): boolean {
  // E.164 : '+' suivi de 8 à 15 chiffres. On tolère les espaces qui seront strippés.
  const cleaned = phone.replace(/\s+/g, "");
  return /^\+[1-9]\d{7,14}$/.test(cleaned);
}

function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, "");
}

// ---------------------------------------------------------------------------
// 1. Demande d'OTP SMS
// ---------------------------------------------------------------------------

/**
 * Génère un OTP à 6 chiffres, le hash en DB (`phone_otps`) avec une TTL de
 * 10 minutes, et envoie le code par SMS via Twilio.
 *
 * Le code en clair n'est jamais persisté — seul le hash SHA-256.
 */
export async function requestPhoneOtp(
  phone: string
): Promise<ActionResult> {
  if (!phone || !isValidPhone(phone)) {
    return {
      success: false,
      error: "Numéro de téléphone invalide. Format attendu : +229XXXXXXXX.",
    };
  }

  const normalizedPhone = normalizePhone(phone);
  const supabase = await getLooseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Vous devez être connecté." };
  }

  // Génère un code à 6 chiffres + hash SHA-256.
  const { code, hash } = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000).toISOString();

  const { error: insertError } = await supabase.from("phone_otps").insert({
    user_id: user.id,
    phone_number: normalizedPhone,
    code_hash: hash,
    expires_at: expiresAt,
  });

  if (insertError) {
    return {
      success: false,
      error: "Impossible d'enregistrer le code de vérification.",
    };
  }

  // Envoi du SMS (mode DEV log si Twilio non configuré).
  const sms = await sendSms(
    normalizedPhone,
    `KAZA : votre code de vérification est ${code}. Valable ${OTP_TTL_MINUTES} minutes.`
  );

  if (!sms.success) {
    return {
      success: false,
      error: sms.error ?? "L'envoi du SMS a échoué. Réessayez dans un instant.",
    };
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// 2. Vérification du code OTP
// ---------------------------------------------------------------------------

/**
 * Vérifie le code OTP saisi par l'utilisateur. Incrémente le compteur de
 * tentatives à chaque essai (max 5) et marque l'OTP comme consommé en cas
 * de succès.
 */
export async function verifyPhoneOtp(
  phone: string,
  code: string
): Promise<ActionResult> {
  if (!code || !/^\d{6}$/.test(code)) {
    return { success: false, error: "Le code doit contenir 6 chiffres." };
  }

  const normalizedPhone = normalizePhone(phone);
  const supabase = await getLooseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Vous devez être connecté." };
  }

  // Récupère le dernier OTP non consommé pour ce user/phone.
  const { data: otp, error } = await supabase
    .from("phone_otps")
    .select("id, code_hash, attempts, expires_at, consumed_at")
    .eq("user_id", user.id)
    .eq("phone_number", normalizedPhone)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !otp) {
    return {
      success: false,
      error: "Aucun code en attente. Demandez un nouveau code.",
    };
  }

  // Expiration.
  if (new Date(otp.expires_at).getTime() < Date.now()) {
    return {
      success: false,
      error: "Le code a expiré. Demandez un nouveau code.",
    };
  }

  // Compteur de tentatives.
  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    return {
      success: false,
      error:
        "Trop de tentatives. Veuillez demander un nouveau code de vérification.",
    };
  }

  // Comparaison hash.
  const submittedHash = hashOtp(code);
  if (submittedHash !== otp.code_hash) {
    // Incrémente attempts et retourne erreur.
    await supabase
      .from("phone_otps")
      .update({ attempts: otp.attempts + 1 })
      .eq("id", otp.id);
    const remaining = OTP_MAX_ATTEMPTS - (otp.attempts + 1);
    return {
      success: false,
      error:
        remaining > 0
          ? `Code incorrect. Il vous reste ${remaining} tentative${remaining > 1 ? "s" : ""}.`
          : "Code incorrect. Veuillez demander un nouveau code.",
    };
  }

  // Succès : marque l'OTP comme consommé.
  await supabase
    .from("phone_otps")
    .update({
      consumed_at: new Date().toISOString(),
      attempts: otp.attempts + 1,
    })
    .eq("id", otp.id);

  return { success: true };
}

// ---------------------------------------------------------------------------
// 3. Upload d'un fichier dans le bucket privé `identity-documents`
// ---------------------------------------------------------------------------

/**
 * Upload un fichier (image) dans Supabase Storage. Le path est scopé par
 * userId pour faciliter les policies Storage côté Supabase. Retourne le path
 * relatif au bucket (à passer ensuite à `submitIdentityVerification`).
 *
 * Limitations validées côté serveur : type image, taille max 5 MB.
 */
export async function uploadIdentityFile(
  file: File,
  kind: "front" | "back" | "selfie"
): Promise<ActionResult<{ path: string }>> {
  if (!file) {
    return { success: false, error: "Aucun fichier fourni." };
  }
  if (!file.type.startsWith("image/")) {
    return {
      success: false,
      error: "Format invalide. Images JPG ou PNG uniquement.",
    };
  }
  if (file.size > 5 * 1024 * 1024) {
    return {
      success: false,
      error: "Fichier trop volumineux. Taille maximale : 5 Mo.",
    };
  }

  const supabase = await getLooseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Vous devez être connecté." };
  }

  // Extension à partir du mime-type (sécurise contre file.name malicieux).
  const ext = file.type.split("/")[1] ?? "jpg";
  const path = `${user.id}/${kind}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(IDENTITY_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    return {
      success: false,
      error: "Échec de l'upload du fichier. Réessayez.",
    };
  }

  return { success: true, data: { path } };
}

// ---------------------------------------------------------------------------
// 4. Soumission de la vérification d'identité
// ---------------------------------------------------------------------------

export interface SubmitVerificationInput {
  documentType: "national_id" | "passport" | "driver_license" | "voter_card";
  documentNumber?: string;
  documentFrontPath: string;
  documentBackPath?: string;
  selfiePath: string;
  phone: string;
}

/**
 * Crée la ligne `identity_verifications` en statut PENDING, en mode "submit
 * after upload" : les fichiers sont déjà dans le bucket, on persiste leurs
 * paths. Vérifie au passage que le téléphone a bien été validé par OTP.
 */
export async function submitIdentityVerification(
  input: SubmitVerificationInput
): Promise<ActionResult<{ id: string }>> {
  // Validation minimale.
  if (
    !input.documentType ||
    !input.documentFrontPath ||
    !input.selfiePath ||
    !input.phone
  ) {
    return { success: false, error: "Informations incomplètes." };
  }
  if (!isValidPhone(input.phone)) {
    return { success: false, error: "Numéro de téléphone invalide." };
  }
  // Le verso est obligatoire sauf pour le passeport.
  if (input.documentType !== "passport" && !input.documentBackPath) {
    return {
      success: false,
      error: "Le verso de la pièce d'identité est requis.",
    };
  }

  const normalizedPhone = normalizePhone(input.phone);
  const supabase = await getLooseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Vous devez être connecté." };
  }

  // Vérifie qu'un OTP a bien été consommé récemment pour ce phone.
  // On considère le téléphone "vérifié" si un OTP `consumed_at` existe dans
  // la dernière heure pour ce couple (user, phone).
  const oneHourAgo = new Date(Date.now() - 60 * 60_000).toISOString();
  const { data: validOtp } = await supabase
    .from("phone_otps")
    .select("id")
    .eq("user_id", user.id)
    .eq("phone_number", normalizedPhone)
    .not("consumed_at", "is", null)
    .gte("consumed_at", oneHourAgo)
    .limit(1)
    .maybeSingle();

  if (!validOtp) {
    return {
      success: false,
      error:
        "Numéro de téléphone non vérifié. Veuillez recommencer la vérification SMS.",
    };
  }

  // Empêche les soumissions multiples (one_verif_per_user).
  const { data: existing } = await supabase
    .from("identity_verifications")
    .select("id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing && (existing.status === "PENDING" || existing.status === "APPROVED")) {
    return {
      success: false,
      error:
        existing.status === "APPROVED"
          ? "Votre identité est déjà vérifiée."
          : "Une demande est déjà en cours de traitement.",
    };
  }

  const payload = {
    user_id: user.id,
    document_type: input.documentType,
    document_number: input.documentNumber || null,
    document_front_url: input.documentFrontPath,
    document_back_url: input.documentBackPath || null,
    selfie_url: input.selfiePath,
    phone_number: normalizedPhone,
    phone_verified: true,
    status: "PENDING",
  };

  // Insert si pas de ligne existante, sinon update (cas REJECTED → ré-essai).
  let verificationId: string;
  if (existing) {
    const { data, error } = await supabase
      .from("identity_verifications")
      .update({
        ...payload,
        submitted_at: new Date().toISOString(),
        rejection_reason: null,
        reviewed_by: null,
        reviewed_at: null,
      })
      .eq("id", existing.id)
      .select("id")
      .single();
    if (error || !data) {
      return {
        success: false,
        error: "Impossible de soumettre la demande. Réessayez.",
      };
    }
    verificationId = data.id as string;
  } else {
    const { data, error } = await supabase
      .from("identity_verifications")
      .insert(payload)
      .select("id")
      .single();
    if (error || !data) {
      return {
        success: false,
        error: "Impossible de soumettre la demande. Réessayez.",
      };
    }
    verificationId = data.id as string;
  }

  // Met à jour le statut côté `users` pour qu'il soit visible dans le badge.
  await supabase
    .from("users")
    .update({ verification_status: "PENDING", phone: normalizedPhone })
    .eq("id", user.id);

  revalidatePath("/verify-identity");
  revalidatePath("/profile");
  revalidatePath("/admin/verifications");

  return { success: true, data: { id: verificationId } };
}

// ---------------------------------------------------------------------------
// 5. Lecture de la vérification courante
// ---------------------------------------------------------------------------

export interface MyVerification {
  id: string;
  status: "UNVERIFIED" | "PENDING" | "APPROVED" | "REJECTED";
  document_type: string;
  phone_number: string;
  rejection_reason: string | null;
  submitted_at: string;
}

/** Retourne la vérification courante de l'utilisateur connecté, ou null. */
export async function getMyVerification(): Promise<MyVerification | null> {
  const supabase = await getLooseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("identity_verifications")
    .select(
      "id, status, document_type, phone_number, rejection_reason, submitted_at"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  return (data as MyVerification | null) ?? null;
}
