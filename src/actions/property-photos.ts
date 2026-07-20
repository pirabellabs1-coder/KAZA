"use server";

// =============================================================================
// Kaabo - Property photos (Server Actions)
//
// Persistance des URLs des photos uploadées vers Supabase Storage dans la
// table `property_photos`. L'upload réel des fichiers se fait côté client
// via `PhotoUploader` (composant qui appelle directement Supabase Storage
// avec le path `temp/{userId}/{uuid}.{ext}`).
//
// Ces actions vérifient l'ownership de la propriété avant toute mutation.
// =============================================================================

import "server-only";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function getLooseClient(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

const ALLOWED_PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 Mo

function extFromType(type: string): string {
  switch (type) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

/**
 * Upload d'une photo via le SERVEUR (client admin / service role).
 *
 * Pourquoi côté serveur plutôt qu'en direct depuis le navigateur :
 * l'upload client dépend d'une session Supabase auth valide ET de policies RLS
 * sur `storage.objects` ; en cas de session démo/cookie ou de mismatch, Supabase
 * renvoyait l'erreur opaque « The database schema is invalid or incompatible ».
 * En passant par le service role on a un chemin stable, et on contrôle la
 * validation (type/taille). Le path reste `temp/{userId}/{uuid}.{ext}`.
 */
export async function uploadPropertyPhotoViaServer(
  formData: FormData,
): Promise<
  | { success: true; url: string; path: string }
  | { success: false; error: string }
> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, error: "Aucun fichier reçu." };
  }

  const supabase = await getLooseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Non authentifié." };
  }

  const type = file.type || "image/jpeg";
  if (!ALLOWED_PHOTO_TYPES.includes(type)) {
    return {
      success: false,
      error: "Format non supporté (JPEG, PNG, WEBP ou GIF).",
    };
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return { success: false, error: "Fichier trop volumineux (max 10 Mo)." };
  }

  const ext = extFromType(type);
  const path = `temp/${user.id}/${crypto.randomUUID()}.${ext}`;

  const admin = createAdminClient();
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error } = await admin.storage
    .from("property-photos")
    .upload(path, bytes, { contentType: type, upsert: false });

  if (error) {
    console.error("[property-photos] upload serveur:", error.message);
    return { success: false, error: error.message };
  }

  const { data: pub } = admin.storage
    .from("property-photos")
    .getPublicUrl(path);

  return { success: true, url: pub.publicUrl, path };
}

/**
 * Persiste les URLs publiques des photos uploadées dans `property_photos`.
 * La première URL devient la photo principale (display_order = 0).
 *
 * @param propertyId  UUID de la propriété (déjà créée en base)
 * @param photoUrls   URLs publiques retournées par Supabase Storage
 */
export async function saveUploadedPhotoUrls(
  propertyId: string,
  photoUrls: string[],
): Promise<{ success: boolean; error?: string }> {
  if (!propertyId || photoUrls.length === 0) {
    return { success: true };
  }

  const supabase = await getLooseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non authentifié" };
  }

  // Vérifie ownership de la propriété
  const { data: prop } = await supabase
    .from("properties")
    .select("owner_id")
    .eq("id", propertyId)
    .maybeSingle();

  if (!prop || prop.owner_id !== user.id) {
    return { success: false, error: "Bien introuvable ou non autorisé" };
  }

  const rows = photoUrls.map((url, i) => ({
    property_id: propertyId,
    photo_url: url,
    display_order: i,
  }));

  const { error } = await supabase.from("property_photos").insert(rows);
  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/properties/${propertyId}`);
  revalidatePath("/owner/properties");
  return { success: true };
}

/**
 * Supprime une photo de la table `property_photos`. N'efface PAS le fichier
 * sous-jacent dans Storage (qui peut être nettoyé périodiquement).
 */
export async function deletePropertyPhoto(
  propertyId: string,
  photoId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await getLooseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non authentifié" };
  }

  // Vérifie ownership avant suppression
  const { data: prop } = await supabase
    .from("properties")
    .select("owner_id")
    .eq("id", propertyId)
    .maybeSingle();

  if (!prop || prop.owner_id !== user.id) {
    return { success: false, error: "Bien introuvable ou non autorisé" };
  }

  const { error } = await supabase
    .from("property_photos")
    .delete()
    .eq("id", photoId)
    .eq("property_id", propertyId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/properties/${propertyId}`);
  revalidatePath("/owner/properties");
  return { success: true };
}
