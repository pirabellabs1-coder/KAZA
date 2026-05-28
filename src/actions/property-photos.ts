"use server";

// =============================================================================
// KAZA - Property photos (Server Actions)
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

async function getLooseClient(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
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
