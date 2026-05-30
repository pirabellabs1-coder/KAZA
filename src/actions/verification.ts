"use server";

// =============================================================================
// KAZA - Identity Verifications (Server Actions)
// Wave 2 - Aminata Traoré
//
// Tunnel d'identité (refonte KYC) :
//   1) Étape EMAIL → l'email du compte fait foi. S'il n'est pas confirmé,
//      `resendEmailConfirmation()` renvoie l'email de confirmation Supabase.
//   2) Documents officiels (pièce d'identité) → upload depuis galerie/appareil.
//   3) Selfie + documents administratifs selon le rôle (justificatif étudiant
//      OBLIGATOIRE pour les étudiants, etc.).
//   4) submitIdentityVerification → insère la vérification en statut PENDING
//      après upload des pièces dans Storage.
//
// Les actions OTP SMS (requestPhoneOtp / verifyPhoneOtp) restent disponibles
// pour rétro-compatibilité mais ne sont plus exigées dans le tunnel.
//
// Convention de retour homogène avec les autres actions du projet :
//   ActionResult<T> = { success: true; data?: T } | { success: false; error: string }
// =============================================================================

import "server-only";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateOtp, hashOtp, sendSms } from "@/lib/sms/twilio";
import { writeAuditLog } from "@/lib/audit/write-log";

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

/** Nombre maximum d'OTP qu'un utilisateur peut demander sur 24h (anti-abus). */
const OTP_MAX_PER_DAY = 5;

/** Fenêtre de throttling en millisecondes (24h). */
const OTP_THROTTLE_WINDOW_MS = 24 * 60 * 60 * 1000;

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
      error:
        "Numéro de téléphone invalide. Format international : +[indicatif pays][numéro] (ex: +229, +221, +225, +234).",
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

  // Throttle anti-abus : max OTP_MAX_PER_DAY OTP par utilisateur sur 24h.
  // On compte les lignes `phone_otps` déjà émises par ce user sur la fenêtre
  // glissante (chaque demande insère une ligne avec `created_at`).
  const sinceIso = new Date(Date.now() - OTP_THROTTLE_WINDOW_MS).toISOString();
  const { count: recentCount, error: countError } = await supabase
    .from("phone_otps")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", sinceIso);

  if (countError) {
    return {
      success: false,
      error: "Impossible de vérifier les demandes récentes. Réessayez.",
    };
  }

  if ((recentCount ?? 0) >= OTP_MAX_PER_DAY) {
    return {
      success: false,
      error: `Limite atteinte : ${OTP_MAX_PER_DAY} codes maximum par 24 heures. Réessayez plus tard.`,
    };
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
// 2bis. Renvoi de l'email de confirmation (vérification par email)
// ---------------------------------------------------------------------------

/**
 * Renvoie l'email de confirmation Supabase à l'utilisateur connecté.
 *
 * Utilise `supabase.auth.resend({ type: 'signup', email })`. Si l'email est
 * déjà confirmé, ou si la méthode `resend` n'est pas disponible sur la version
 * du client Supabase, on retourne un message explicite (fallback gracieux)
 * plutôt que de planter le tunnel.
 */
export async function resendEmailConfirmation(): Promise<ActionResult> {
  const supabase = await getLooseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Vous devez être connecté." };
  }

  const email = user.email;
  if (!email) {
    return {
      success: false,
      error: "Aucune adresse email associée à votre compte.",
    };
  }

  // Email déjà confirmé : rien à renvoyer.
  if (user.email_confirmed_at) {
    return {
      success: false,
      error: "Votre email est déjà confirmé.",
    };
  }

  // Fallback gracieux si la méthode n'existe pas (anciennes versions du SDK).
  const auth = supabase.auth as unknown as {
    resend?: (params: {
      type: "signup";
      email: string;
    }) => Promise<{ error: { message: string } | null }>;
  };

  if (typeof auth.resend !== "function") {
    return {
      success: false,
      error:
        "Le renvoi automatique n'est pas disponible. Veuillez vérifier votre boîte de réception ou contacter le support.",
    };
  }

  try {
    const { error } = await auth.resend({ type: "signup", email });
    if (error) {
      return {
        success: false,
        error:
          "Impossible d'envoyer l'email de confirmation pour le moment. Réessayez dans un instant.",
      };
    }
  } catch {
    return {
      success: false,
      error:
        "Le renvoi de l'email a échoué. Veuillez vérifier votre boîte de réception ou réessayer plus tard.",
    };
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// 3. Upload d'un fichier dans le bucket privé `identity-documents`
// ---------------------------------------------------------------------------

/** Catégories de documents administratifs additionnels (par rôle). */
export type ExtraDocumentKind =
  | "address_proof"
  | "student_proof"
  | "property_title"
  | "business_doc"
  | "other";

/** Document administratif additionnel persisté dans `extra_documents`. */
export interface ExtraDocument {
  kind: ExtraDocumentKind;
  label: string;
  url: string;
}

/** Types de fichiers acceptés : images + PDF (justificatifs administratifs). */
const ACCEPTED_MIME_PREFIXES = ["image/"];
const ACCEPTED_MIME_EXACT = ["application/pdf"];

function isAcceptedFileType(type: string): boolean {
  return (
    ACCEPTED_MIME_PREFIXES.some((p) => type.startsWith(p)) ||
    ACCEPTED_MIME_EXACT.includes(type)
  );
}

/**
 * Upload un fichier (image ou PDF) dans Supabase Storage. Le path est scopé par
 * userId pour faciliter les policies Storage côté Supabase. Retourne le path
 * relatif au bucket (à passer ensuite à `submitIdentityVerification`).
 *
 * `kind` sert uniquement à nommer le fichier de façon lisible (front/back/
 * selfie ou catégorie de justificatif administratif).
 *
 * Limitations validées côté serveur : image ou PDF, taille max 5 MB.
 */
export async function uploadIdentityFile(
  file: File,
  kind: "front" | "back" | "selfie" | ExtraDocumentKind
): Promise<ActionResult<{ path: string }>> {
  if (!file) {
    return { success: false, error: "Aucun fichier fourni." };
  }
  if (!isAcceptedFileType(file.type)) {
    return {
      success: false,
      error: "Format invalide. Images (JPG, PNG) ou PDF uniquement.",
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
  const ext =
    file.type === "application/pdf" ? "pdf" : file.type.split("/")[1] ?? "jpg";
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
  /** Téléphone facultatif désormais (la vérification se fait par email). */
  phone?: string;
  /** Email confirmé (user.email_confirmed_at != null) au moment de la soumission. */
  emailVerified?: boolean;
  /** Documents administratifs additionnels selon le rôle. */
  extraDocuments?: ExtraDocument[];
}

const VALID_EXTRA_KINDS: ExtraDocumentKind[] = [
  "address_proof",
  "student_proof",
  "property_title",
  "business_doc",
  "other",
];

/** Nettoie/valide les documents additionnels avant persistance JSONB. */
function sanitizeExtraDocuments(docs?: ExtraDocument[]): ExtraDocument[] {
  if (!Array.isArray(docs)) return [];
  return docs
    .filter(
      (d) =>
        d &&
        typeof d.url === "string" &&
        d.url.length > 0 &&
        VALID_EXTRA_KINDS.includes(d.kind),
    )
    .map((d) => ({
      kind: d.kind,
      label: typeof d.label === "string" ? d.label.slice(0, 120) : d.kind,
      url: d.url,
    }));
}

/**
 * Crée la ligne `identity_verifications` en statut PENDING, en mode "submit
 * after upload" : les fichiers sont déjà dans le bucket, on persiste leurs
 * paths. La vérification se fait désormais par EMAIL (email_verified) ; le
 * téléphone est facultatif et conservé pour rétro-compatibilité.
 */
export async function submitIdentityVerification(
  input: SubmitVerificationInput
): Promise<ActionResult<{ id: string }>> {
  // Validation minimale.
  if (
    !input.documentType ||
    !input.documentFrontPath ||
    !input.selfiePath
  ) {
    return { success: false, error: "Informations incomplètes." };
  }
  // Le verso est obligatoire sauf pour le passeport.
  if (input.documentType !== "passport" && !input.documentBackPath) {
    return {
      success: false,
      error: "Le verso de la pièce d'identité est requis.",
    };
  }

  // Téléphone facultatif : s'il est fourni, on valide son format.
  const hasPhone = Boolean(input.phone && input.phone.trim());
  if (hasPhone && !isValidPhone(input.phone!)) {
    return { success: false, error: "Numéro de téléphone invalide." };
  }
  const normalizedPhone = hasPhone ? normalizePhone(input.phone!) : null;

  const supabase = await getLooseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Vous devez être connecté." };
  }

  // L'email confirmé fait foi : on se base sur la source de vérité Supabase
  // (email_confirmed_at) plutôt que sur la valeur transmise par le client.
  const emailVerified = Boolean(user.email_confirmed_at);

  const extraDocuments = sanitizeExtraDocuments(input.extraDocuments);

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
    phone_verified: hasPhone,
    email_verified: emailVerified,
    extra_documents: extraDocuments,
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
  // On ne met à jour le téléphone que s'il a été fourni (sinon on ne l'écrase pas).
  const userUpdate: Record<string, unknown> = { verification_status: "PENDING" };
  if (normalizedPhone) {
    userUpdate.phone = normalizedPhone;
  }
  await supabase.from("users").update(userUpdate).eq("id", user.id);

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

// ===========================================================================
// 6. Actions admin — approve / reject / signed URLs
// ===========================================================================
//
// Le bucket `identity-documents` est privé. Pour permettre à l'admin de
// visualiser les pièces, on génère des Signed URLs côté serveur via le
// client service_role (bypass RLS). Les URLs sont à durée de vie courte
// (10 min) pour limiter la fuite éventuelle dans l'historique navigateur.
// ===========================================================================

/** Vérifie que le caller est admin. Renvoie l'auth user en cas de succès. */
async function assertAdmin(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const supabase = await getLooseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Non authentifié" };

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if ((profile as { role?: string } | null)?.role !== "ADMIN") {
    return { ok: false, error: "Accès réservé aux administrateurs" };
  }

  return { ok: true, userId: user.id };
}

/** Approuve une vérification d'identité (admin) et crédite +500 KAZA Points. */
export async function approveVerification(
  verificationId: string
): Promise<ActionResult> {
  if (!verificationId) {
    return { success: false, error: "Identifiant manquant." };
  }

  const guard = await assertAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  // Service-role pour bypass RLS et exécuter les updates atomiquement
  // sans dépendre du contexte cookie (utile pour le crédit kaza_points).
  const admin = createAdminClient() as unknown as SupabaseClient;

  // Récupère le user_id ciblé.
  const { data: verif, error: verifError } = await admin
    .from("identity_verifications")
    .select("user_id, status")
    .eq("id", verificationId)
    .maybeSingle();

  if (verifError || !verif) {
    return { success: false, error: "Vérification introuvable." };
  }

  const targetUserId = (verif as { user_id: string }).user_id;
  const currentStatus = (verif as { status: string }).status;

  if (currentStatus === "APPROVED") {
    return { success: false, error: "Cette demande est déjà approuvée." };
  }

  // Update verif.
  const { error: updateVerifError } = await admin
    .from("identity_verifications")
    .update({
      status: "APPROVED",
      reviewed_at: new Date().toISOString(),
      reviewed_by: guard.userId,
      rejection_reason: null,
    })
    .eq("id", verificationId);

  if (updateVerifError) {
    return { success: false, error: "Impossible de mettre à jour la vérification." };
  }

  // Update user : badge vérifié.
  await admin
    .from("users")
    .update({
      is_verified: true,
      verification_status: "APPROVED",
    })
    .eq("id", targetUserId);

  // Bonus KAZA Points : +500 (table kaza_points_transactions, trigger met
  // à jour la balance automatiquement). Best-effort, on n'échoue pas le
  // workflow si cette table n'existe pas encore en environnement.
  try {
    await admin.from("kaza_points_transactions").insert({
      user_id: targetUserId,
      type: "KYC_APPROVED",
      amount: 500,
      description: "Identité vérifiée — bonus de confiance",
    });
  } catch (err) {
    console.warn("[verification.approve] points credit skipped:", err);
  }

  // Crée une notification in-app pour l'utilisateur.
  try {
    await admin.from("notifications").insert({
      user_id: targetUserId,
      type: "identity_approved",
      title: "Identité vérifiée",
      body: "Votre pièce d'identité a été validée. Badge activé.",
      link: "/profile",
    });
  } catch (err) {
    console.warn("[verification.approve] notification skipped:", err);
  }

  // Audit trail (best-effort).
  await writeAuditLog({
    action: "KYC_APPROVED",
    targetType: "USER",
    targetId: targetUserId,
    targetLabel: "Vérification identité approuvée",
    metadata: { verificationId },
  });

  revalidatePath("/admin/verifications");
  revalidatePath("/admin/audit-log");
  revalidatePath("/verify-identity");
  revalidatePath("/profile");

  return { success: true };
}

/** Rejette une vérification d'identité (admin) avec un motif obligatoire. */
export async function rejectVerification(
  verificationId: string,
  reason: string
): Promise<ActionResult> {
  if (!verificationId) {
    return { success: false, error: "Identifiant manquant." };
  }
  const trimmed = reason?.trim() ?? "";
  if (trimmed.length < 10) {
    return {
      success: false,
      error: "Le motif doit comporter au moins 10 caractères.",
    };
  }

  const guard = await assertAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  const admin = createAdminClient() as unknown as SupabaseClient;

  const { data: verif, error: verifError } = await admin
    .from("identity_verifications")
    .select("user_id")
    .eq("id", verificationId)
    .maybeSingle();

  if (verifError || !verif) {
    return { success: false, error: "Vérification introuvable." };
  }

  const targetUserId = (verif as { user_id: string }).user_id;

  const { error: updateError } = await admin
    .from("identity_verifications")
    .update({
      status: "REJECTED",
      reviewed_at: new Date().toISOString(),
      reviewed_by: guard.userId,
      rejection_reason: trimmed,
    })
    .eq("id", verificationId);

  if (updateError) {
    return { success: false, error: "Impossible de rejeter la vérification." };
  }

  await admin
    .from("users")
    .update({
      verification_status: "REJECTED",
      is_verified: false,
    })
    .eq("id", targetUserId);

  try {
    await admin.from("notifications").insert({
      user_id: targetUserId,
      type: "identity_rejected",
      title: "Pièce d'identité non conforme",
      body: trimmed,
      link: "/verify-identity",
    });
  } catch (err) {
    console.warn("[verification.reject] notification skipped:", err);
  }

  // Audit trail (best-effort).
  await writeAuditLog({
    action: "KYC_REJECTED",
    targetType: "USER",
    targetId: targetUserId,
    targetLabel: "Vérification identité rejetée",
    reason: trimmed,
    metadata: { verificationId },
  });

  revalidatePath("/admin/verifications");
  revalidatePath("/admin/audit-log");
  revalidatePath("/verify-identity");

  return { success: true };
}

// ---------------------------------------------------------------------------
// 7. Signed URLs pour visualisation admin
// ---------------------------------------------------------------------------

export interface VerificationFiles {
  documentType: "national_id" | "passport" | "driver_license" | "voter_card";
  documentNumber: string | null;
  phoneNumber: string;
  documentFrontUrl: string | null;
  documentBackUrl: string | null;
  selfieUrl: string | null;
}

/**
 * Génère des Signed URLs (TTL court) pour le recto, le verso et le selfie
 * d'une vérification donnée. Réservé aux admins — utilise le service_role
 * pour bypass les policies du bucket privé.
 */
export async function getVerificationFiles(
  verificationId: string
): Promise<ActionResult<VerificationFiles>> {
  const guard = await assertAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  const admin = createAdminClient() as unknown as SupabaseClient;

  const { data: verif, error } = await admin
    .from("identity_verifications")
    .select(
      "document_type, document_number, phone_number, document_front_url, document_back_url, selfie_url"
    )
    .eq("id", verificationId)
    .maybeSingle();

  if (error || !verif) {
    return { success: false, error: "Vérification introuvable." };
  }

  const row = verif as {
    document_type: VerificationFiles["documentType"];
    document_number: string | null;
    phone_number: string;
    document_front_url: string | null;
    document_back_url: string | null;
    selfie_url: string | null;
  };

  const sign = async (path: string | null): Promise<string | null> => {
    if (!path) return null;
    const { data, error: signError } = await admin.storage
      .from(IDENTITY_BUCKET)
      .createSignedUrl(path, 60 * 10); // 10 min
    if (signError || !data?.signedUrl) {
      console.error("[verification] signedUrl error:", signError?.message);
      return null;
    }
    return data.signedUrl;
  };

  const [frontUrl, backUrl, selfieUrl] = await Promise.all([
    sign(row.document_front_url),
    sign(row.document_back_url),
    sign(row.selfie_url),
  ]);

  return {
    success: true,
    data: {
      documentType: row.document_type,
      documentNumber: row.document_number,
      phoneNumber: row.phone_number,
      documentFrontUrl: frontUrl,
      documentBackUrl: backUrl,
      selfieUrl,
    },
  };
}
