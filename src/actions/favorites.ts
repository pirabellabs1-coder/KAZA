"use server";

// =============================================================================
// Kaabo - Favorites (Server Actions)
//
// Gestion des annonces favorites (`saved_properties`). La contrainte UNIQUE
// (user_id, property_id) garantit qu'il n'y a pas de doublon.
// =============================================================================

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { track } from "@/lib/analytics/track";
import type {
  SavedProperty,
  SavedPropertyWithDetails,
} from "@/types/properties";

import type { ActionResult } from "./notifications";

// TODO: type manquant - voir note dans `properties.ts`.
async function getLooseClient(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

interface ToggleResult {
  favorited: boolean;
  saved?: SavedProperty;
}

/**
 * Ajoute ou retire une annonce des favoris de l'utilisateur courant.
 * Retourne `{ favorited: true }` si l'annonce vient d'etre ajoutee.
 */
export async function toggleFavorite(
  propertyId: string
): Promise<ActionResult<ToggleResult>> {
  const supabase = await getLooseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Vous devez etre connecte." };
  }

  const { data: existing, error: fetchError } = await supabase
    .from("saved_properties")
    .select("id")
    .eq("user_id", user.id)
    .eq("property_id", propertyId)
    .maybeSingle();

  if (fetchError) {
    return {
      success: false,
      error: "Impossible de verifier l'etat des favoris.",
    };
  }

  if (existing) {
    const { error: deleteError } = await supabase
      .from("saved_properties")
      .delete()
      .eq("id", existing.id);

    if (deleteError) {
      return {
        success: false,
        error: "Impossible de retirer l'annonce des favoris.",
      };
    }

    revalidatePath("/tenant/favorites");
    revalidatePath(`/properties/${propertyId}`);
    return { success: true, data: { favorited: false } };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("saved_properties")
    .insert({ user_id: user.id, property_id: propertyId })
    .select()
    .single();

  if (insertError || !inserted) {
    return {
      success: false,
      error: "Impossible d'ajouter l'annonce aux favoris.",
    };
  }

  // Tracking analytics — best-effort.
  await track({
    eventType: "PROPERTY_FAVORITE",
    metadata: { property_id: propertyId },
  });

  revalidatePath("/tenant/favorites");
  revalidatePath("/tenant/saved");
  revalidatePath(`/properties/${propertyId}`);
  return {
    success: true,
    data: { favorited: true, saved: inserted as unknown as SavedProperty },
  };
}

/**
 * Alias public — meme comportement que `toggleFavorite` mais avec une
 * convention de nommage "save" (utilisee par le dashboard locataire).
 */
export async function toggleSaveProperty(
  propertyId: string,
): Promise<ActionResult<ToggleResult>> {
  const result = await toggleFavorite(propertyId);
  // Revalider aussi la page saved pour rafraichir l'affichage.
  revalidatePath("/tenant/saved");
  return result;
}

/**
 * Indique si la propriete est sauvegardee par l'utilisateur courant.
 * Retourne `false` si non connecte ou en cas d'erreur.
 */
export async function isSaved(propertyId: string): Promise<boolean> {
  const supabase = await getLooseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("saved_properties")
    .select("id")
    .eq("user_id", user.id)
    .eq("property_id", propertyId)
    .maybeSingle();
  if (error) return false;
  return Boolean(data);
}

/**
 * Retourne tous les favoris de l'utilisateur courant, avec les annonces
 * jointes (photos comprises).
 */
export async function getFavorites(): Promise<
  ActionResult<SavedPropertyWithDetails[]>
> {
  const supabase = await getLooseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Vous devez etre connecte." };
  }

  const { data, error } = await supabase
    .from("saved_properties")
    .select(
      `
      id,
      user_id,
      property_id,
      created_at,
      property:properties (
        *,
        photos:property_photos (*)
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return {
      success: false,
      error: "Impossible de charger vos favoris.",
    };
  }

  return {
    success: true,
    data: (data ?? []) as unknown as SavedPropertyWithDetails[],
  };
}
