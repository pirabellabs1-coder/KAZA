"use server";

// =============================================================================
// Kaabo - Photos de profil colocataire (Server Actions)
//
// Upload REEL des photos du profil de colocation (photo de profil + photos
// "lifestyle") dans le bucket public `avatars`, sous le prefixe
// `coloc-photos/{userId}/{uuid}.{ext}`.
//
// Le bucket `avatars` est REUTILISE (cf. migration 00014) : il est public en
// lecture et provisionne. Le prefixe `coloc-photos/` isole ces photos de
// l'avatar principal stocke a la racine `{userId}/...`.
//
// L'upload passe par le client service-role (chemin fiable, contourne les
// soucis de session/policies Storage cote navigateur), avec validation
// type MIME + taille cote serveur.
//
// Convention de retour homogene avec les autres actions du projet :
//   { success: true; url; path } | { success: false; error }
// =============================================================================

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function getLooseClient(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

/** Bucket Supabase Storage public reutilise (cf. migration 00014). */
const COLOC_BUCKET = "avatars";

/** Prefixe de chemin dedie aux photos du profil colocataire. */
const COLOC_PREFIX = "coloc-photos";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];
// Le bucket `avatars` est plafonné à 2 Mo côté Storage (cf. migration 00014).
// On valide la même limite ici pour renvoyer une erreur claire avant l'upload.
const MAX_BYTES = 2 * 1024 * 1024; // 2 Mo (limite du bucket avatars)

function extFromType(type: string): string {
  switch (type) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

export type UploadColocPhotoResult =
  | { success: true; url: string; path: string }
  | { success: false; error: string };

/**
 * Upload une photo du profil colocataire dans le bucket public `avatars`
 * sous `coloc-photos/{userId}/{uuid}.{ext}` et retourne l'URL publique.
 *
 * `formData` doit contenir :
 *   - `file` : le fichier image (JPEG, PNG ou WEBP, <= 5 Mo)
 */
export async function uploadColocPhoto(
  formData: FormData,
): Promise<UploadColocPhotoResult> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, error: "Aucun fichier reçu." };
  }

  const type = file.type || "image/jpeg";
  if (!ALLOWED_MIME.includes(type)) {
    return {
      success: false,
      error: "Format non supporté (JPEG, PNG ou WEBP).",
    };
  }
  if (file.size > MAX_BYTES) {
    return { success: false, error: "Fichier trop volumineux (max 2 Mo)." };
  }

  const supabase = await getLooseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Vous devez être connecté." };
  }

  const ext = extFromType(type);
  const path = `${COLOC_PREFIX}/${user.id}/${crypto.randomUUID()}.${ext}`;

  const admin = createAdminClient();
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from(COLOC_BUCKET)
    .upload(path, bytes, {
      cacheControl: "3600",
      upsert: false,
      contentType: type,
    });

  if (uploadError) {
    console.error("[coloc-photos] upload:", uploadError.message);
    return { success: false, error: "Échec de l'upload du fichier. Réessayez." };
  }

  const { data: pub } = admin.storage.from(COLOC_BUCKET).getPublicUrl(path);

  return { success: true, url: pub.publicUrl, path };
}
