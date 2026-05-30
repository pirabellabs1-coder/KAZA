"use server";

// =============================================================================
// KAZA - Documents du dossier locatif (Server Actions)
//
// Persistance REELLE des pieces du dossier locatif (bulletins de salaire,
// justificatifs de domicile, documents de garant, etc.) :
//   - upload des fichiers dans le bucket prive `identity-documents`
//     (chemin `tenant-docs/{userId}/{uuid}.{ext}`) via le client admin
//     (service role) pour contourner les soucis de session/RLS Storage ;
//   - une ligne `tenant_documents` est inseree par fichier (RLS: all own) ;
//   - lecture via des Signed URLs courtes (10 min) pour affichage/telechargement.
//
// Le bucket `identity-documents` est REUTILISE (cf. src/actions/verification.ts)
// car il est deja prive et provisionne. Le prefixe `tenant-docs/` isole ces
// pieces des documents KYC stockes a la racine `{userId}/...`.
//
// Convention de retour homogene avec les autres actions du projet :
//   ActionResult<T> = { success: true; data?: T } | { success: false; error: string }
// =============================================================================

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

import type { ActionResult } from "./notifications";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Meme limitation de typage que les autres actions : le type `Database` ne
// declare pas `Relationships`, ce qui fait collapser Insert/Update vers `never`.
// On utilise un client "loose-typed" en attendant la regeneration via la CLI.
async function getLooseClient(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

/** Bucket Supabase Storage prive reutilise (cf. verification.ts). */
const TENANT_BUCKET = "identity-documents";

/** Prefixe de chemin dedie aux pieces du dossier locatif. */
const TENANT_PREFIX = "tenant-docs";

/** Types de documents acceptes (colonne `doc_type`). */
export type TenantDocType =
  | "payslip"
  | "id"
  | "address_proof"
  | "guarantor"
  | "other";

const VALID_DOC_TYPES: TenantDocType[] = [
  "payslip",
  "id",
  "address_proof",
  "guarantor",
  "other",
];

/** Types MIME acceptes : images (JPEG/PNG) + PDF. */
const ALLOWED_MIME = ["image/jpeg", "image/png", "application/pdf"];
const MAX_BYTES = 10 * 1024 * 1024; // 10 Mo

/** Document tel que renvoye au client (avec Signed URL courte). */
export interface TenantDocumentView {
  id: string;
  docType: TenantDocType;
  label: string;
  amount: string | null;
  status: string;
  uploadedAt: string;
  /** Chemin relatif au bucket (jamais expose tel quel pour l'affichage). */
  filePath: string | null;
  /** Signed URL courte (10 min) pour telecharger/afficher, ou null. */
  signedUrl: string | null;
}

function extFromType(type: string): string {
  switch (type) {
    case "application/pdf":
      return "pdf";
    case "image/png":
      return "png";
    default:
      return "jpg";
  }
}

// ---------------------------------------------------------------------------
// 1. Upload d'une piece du dossier locatif
// ---------------------------------------------------------------------------

/**
 * Upload un fichier (image ou PDF) dans le bucket prive `identity-documents`
 * sous `tenant-docs/{userId}/{uuid}.{ext}` puis insere la ligne correspondante
 * dans `tenant_documents`.
 *
 * `formData` doit contenir :
 *   - `file`     : le fichier (image/jpeg, image/png ou application/pdf, <= 10 Mo)
 *   - `docType`  : l'une des valeurs de TenantDocType (defaut: "other")
 *   - `label`    : libelle lisible (defaut: nom du fichier)
 *   - `amount`   : montant facultatif (TEXT, ex. "750 000 FCFA")
 *
 * Validation cote serveur : type MIME + taille. L'upload passe par le client
 * service-role (chemin fiable, contourne les policies Storage cote navigateur),
 * l'insert passe par le client de session (RLS `auth.uid() = user_id`).
 */
export async function uploadTenantDocument(
  formData: FormData,
): Promise<ActionResult<{ doc: TenantDocumentView }>> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, error: "Aucun fichier reçu." };
  }

  const type = file.type || "application/octet-stream";
  if (!ALLOWED_MIME.includes(type)) {
    return {
      success: false,
      error: "Format invalide. Images (JPG, PNG) ou PDF uniquement.",
    };
  }
  if (file.size > MAX_BYTES) {
    return {
      success: false,
      error: "Fichier trop volumineux. Taille maximale : 10 Mo.",
    };
  }

  const rawDocType = String(formData.get("docType") ?? "other");
  const docType: TenantDocType = VALID_DOC_TYPES.includes(
    rawDocType as TenantDocType,
  )
    ? (rawDocType as TenantDocType)
    : "other";

  const rawLabel = String(formData.get("label") ?? "").trim();
  const label = (rawLabel || file.name || "Document").slice(0, 160);

  const rawAmount = formData.get("amount");
  const amount =
    typeof rawAmount === "string" && rawAmount.trim()
      ? rawAmount.trim().slice(0, 60)
      : null;

  const supabase = await getLooseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Vous devez être connecté." };
  }

  // Extension derivee du mime-type (securise contre un file.name malicieux).
  const ext = extFromType(type);
  const path = `${TENANT_PREFIX}/${user.id}/${crypto.randomUUID()}.${ext}`;

  const admin = createAdminClient();
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from(TENANT_BUCKET)
    .upload(path, bytes, {
      cacheControl: "3600",
      upsert: false,
      contentType: type,
    });

  if (uploadError) {
    console.error("[tenant-documents] upload:", uploadError.message);
    return { success: false, error: "Échec de l'upload du fichier. Réessayez." };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("tenant_documents")
    .insert({
      user_id: user.id,
      doc_type: docType,
      label,
      file_url: path,
      amount,
      status: "UPLOADED",
    })
    .select("id, doc_type, label, file_url, amount, status, uploaded_at")
    .single();

  if (insertError || !inserted) {
    // Best-effort : on retire le fichier orphelin si l'insert echoue.
    await admin.storage.from(TENANT_BUCKET).remove([path]);
    console.error("[tenant-documents] insert:", insertError?.message);
    return {
      success: false,
      error: "Impossible d'enregistrer le document. Réessayez.",
    };
  }

  const row = inserted as {
    id: string;
    doc_type: TenantDocType;
    label: string;
    file_url: string | null;
    amount: string | null;
    status: string;
    uploaded_at: string;
  };

  // Signed URL immediate pour permettre l'affichage/telechargement.
  let signedUrl: string | null = null;
  const { data: signed } = await admin.storage
    .from(TENANT_BUCKET)
    .createSignedUrl(path, 60 * 10);
  signedUrl = signed?.signedUrl ?? null;

  return {
    success: true,
    data: {
      doc: {
        id: row.id,
        docType: row.doc_type,
        label: row.label,
        amount: row.amount,
        status: row.status,
        uploadedAt: row.uploaded_at,
        filePath: row.file_url,
        signedUrl,
      },
    },
  };
}

// ---------------------------------------------------------------------------
// 2. Liste des documents de l'utilisateur
// ---------------------------------------------------------------------------

/**
 * Retourne les documents du dossier locatif de l'utilisateur connecte, tries
 * du plus recent au plus ancien, chacun accompagne d'une Signed URL courte
 * (10 min) pour l'affichage / le telechargement.
 */
export async function listTenantDocuments(): Promise<TenantDocumentView[]> {
  const supabase = await getLooseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("tenant_documents")
    .select("id, doc_type, label, file_url, amount, status, uploaded_at")
    .eq("user_id", user.id)
    .order("uploaded_at", { ascending: false });

  if (error || !data) {
    if (error) console.error("[tenant-documents] list:", error.message);
    return [];
  }

  const rows = data as Array<{
    id: string;
    doc_type: TenantDocType;
    label: string;
    file_url: string | null;
    amount: string | null;
    status: string;
    uploaded_at: string;
  }>;

  // Signe les paths en une passe via le client admin (bucket prive).
  const admin = createAdminClient();

  const docs = await Promise.all(
    rows.map(async (row): Promise<TenantDocumentView> => {
      let signedUrl: string | null = null;
      if (row.file_url) {
        const { data: signed } = await admin.storage
          .from(TENANT_BUCKET)
          .createSignedUrl(row.file_url, 60 * 10);
        signedUrl = signed?.signedUrl ?? null;
      }
      return {
        id: row.id,
        docType: row.doc_type,
        label: row.label,
        amount: row.amount,
        status: row.status,
        uploadedAt: row.uploaded_at,
        filePath: row.file_url,
        signedUrl,
      };
    }),
  );

  return docs;
}

// ---------------------------------------------------------------------------
// 3. Suppression d'un document
// ---------------------------------------------------------------------------

/**
 * Supprime la ligne `tenant_documents` (RLS `auth.uid() = user_id` garantit
 * que l'utilisateur ne peut effacer que ses propres pieces) puis retire le
 * fichier sous-jacent du bucket en best-effort.
 */
export async function deleteTenantDocument(
  id: string,
): Promise<ActionResult> {
  if (!id) {
    return { success: false, error: "Identifiant manquant." };
  }

  const supabase = await getLooseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Vous devez être connecté." };
  }

  // Recupere le path AVANT suppression (et confirme l'ownership via RLS).
  const { data: existing } = await supabase
    .from("tenant_documents")
    .select("file_url")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    return { success: false, error: "Document introuvable." };
  }

  const { error: deleteError } = await supabase
    .from("tenant_documents")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (deleteError) {
    console.error("[tenant-documents] delete:", deleteError.message);
    return { success: false, error: "Impossible de supprimer le document." };
  }

  // Best-effort : retire le fichier du bucket prive.
  const filePath = (existing as { file_url: string | null }).file_url;
  if (filePath) {
    const admin = createAdminClient();
    const { error: removeError } = await admin.storage
      .from(TENANT_BUCKET)
      .remove([filePath]);
    if (removeError) {
      console.warn("[tenant-documents] storage remove:", removeError.message);
    }
  }

  return { success: true };
}
