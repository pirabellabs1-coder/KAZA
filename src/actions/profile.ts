"use server";

// =============================================================================
// KAZA - Profile (Server Actions)
//
// Mise a jour du profil utilisateur dans `public.users`. Les regles RLS
// (`users_update_own`) imposent `auth.uid() = id`, donc nul besoin de
// re-verifier cote applicatif au-dela de `getUser()`.
// =============================================================================

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

import type { ActionResult } from "./notifications";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const updateProfileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "Le prenom doit faire au moins 2 caracteres.")
    .max(50, "Prenom trop long."),
  lastName: z
    .string()
    .trim()
    .min(2, "Le nom doit faire au moins 2 caracteres.")
    .max(50, "Nom trop long."),
  phone: z
    .string()
    .trim()
    .max(30, "Numero de telephone trop long.")
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .trim()
    .max(255, "Adresse trop longue.")
    .optional()
    .or(z.literal("")),
  idNumber: z
    .string()
    .trim()
    .max(60, "Numero de piece trop long.")
    .optional()
    .or(z.literal("")),
  profession: z
    .string()
    .trim()
    .max(120, "Profession trop longue.")
    .optional()
    .or(z.literal("")),
  employer: z
    .string()
    .trim()
    .max(120, "Employeur trop long.")
    .optional()
    .or(z.literal("")),
  bio: z
    .string()
    .max(500, "Bio limitee a 500 caracteres.")
    .optional()
    .or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ---------------------------------------------------------------------------
// updateProfile
// ---------------------------------------------------------------------------

/**
 * Met a jour le profil de l'utilisateur courant (prenom, nom, telephone,
 * adresse, bio). Le champ `updated_at` est rafraichi par le trigger
 * `set_users_updated_at`, mais on l'ecrit explicitement par defense.
 */
export async function updateProfile(
  input: UpdateProfileInput,
): Promise<ActionResult> {
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Donnees invalides.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Vous devez etre connecte." };
  }

  const normalize = (value: string | undefined): string | null => {
    if (value === undefined) return null;
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  };

  const { error } = await supabase
    .from("users")
    .update({
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      phone: normalize(parsed.data.phone),
      address: normalize(parsed.data.address),
      id_number: normalize(parsed.data.idNumber),
      profession: normalize(parsed.data.profession),
      employer: normalize(parsed.data.employer),
      bio: normalize(parsed.data.bio),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return {
      success: false,
      error: "Impossible de mettre a jour le profil. " + error.message,
    };
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { success: true };
}

// ---------------------------------------------------------------------------
// updateProfilePhoto
// ---------------------------------------------------------------------------

const photoSchema = z
  .string()
  .url("URL de photo invalide.")
  .max(1024, "URL trop longue.");

/**
 * Met a jour l'URL de la photo de profil. L'upload du fichier est
 * realise cote client via Supabase Storage ; cette action ne fait
 * que persister l'URL publique dans `users.profile_photo_url`.
 * Passer `null` pour supprimer la photo.
 */
export async function updateProfilePhoto(
  photoUrl: string | null,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Vous devez etre connecte." };
  }

  let value: string | null = null;
  if (photoUrl !== null) {
    const parsed = photoSchema.safeParse(photoUrl);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Donnees invalides.",
      };
    }
    value = parsed.data;
  }

  const { error } = await supabase
    .from("users")
    .update({
      profile_photo_url: value,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return {
      success: false,
      error: "Impossible de mettre a jour la photo. " + error.message,
    };
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { success: true };
}
