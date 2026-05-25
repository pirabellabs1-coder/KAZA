"use server";

// =============================================================================
// KAZA - Properties (Server Actions)
//
// Convention de retour : `{ success: true; data?: T } | { success: false; error }`.
// Toutes les mutations valident l'entree avec Zod, recuperent le user via
// `createClient()` (Supabase SSR), verifient l'ownership puis revalident
// `/owner/properties`.
// =============================================================================

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import type { Property } from "@/types/properties";
import {
  createPropertySchema,
  updatePropertySchema,
  type CreatePropertyFormData,
  type UpdatePropertyFormData,
} from "@/validators/property";

import type { ActionResult } from "./notifications";

// TODO: type manquant - `Database` (src/types/supabase.ts) ne declare pas
// `Relationships: []` sur chaque table, ce qui fait collapser Insert/Update
// vers `never` avec postgrest-js v2.99. Tant que Yaw n'a pas regenere les
// types via la Supabase CLI, on utilise un client "loose-typed" pour les
// mutations. Les lectures sont typees a l'arrivee via des casts cibles.
async function getLooseClient(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

// ---------------------------------------------------------------------------
// Helpers internes
// ---------------------------------------------------------------------------

/**
 * Convertit lat/lng en WKT POINT EPSG:4326 attendu par PostGIS.
 * Retourne `null` si les coordonnees sont incompletes.
 */
function toGeographyPoint(
  lat?: number,
  lng?: number
): string | null {
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  return `SRID=4326;POINT(${lng} ${lat})`;
}

/**
 * Verifie que l'utilisateur courant est bien le proprietaire de l'annonce.
 * Retourne le couple `{ user, property }` si OK, sinon un `ActionResult` d'erreur.
 */
async function assertOwnership(propertyId: string) {
  const supabase = await getLooseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false as const,
      result: { success: false as const, error: "Vous devez etre connecte." },
    };
  }

  const { data: property, error } = await supabase
    .from("properties")
    .select("id, owner_id, status")
    .eq("id", propertyId)
    .maybeSingle();

  if (error || !property) {
    return {
      ok: false as const,
      result: { success: false as const, error: "Annonce introuvable." },
    };
  }

  if (property.owner_id !== user.id) {
    return {
      ok: false as const,
      result: {
        success: false as const,
        error: "Vous n'etes pas autorise a modifier cette annonce.",
      },
    };
  }

  return { ok: true as const, supabase, user, property };
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

/**
 * Cree une nouvelle annonce immobiliere en statut DRAFT.
 * Le proprietaire doit etre authentifie et avoir le role OWNER.
 */
export async function createProperty(
  formData: CreatePropertyFormData
): Promise<ActionResult<Property>> {
  const parsed = createPropertySchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Donnees invalides.",
    };
  }

  const supabase = await getLooseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Vous devez etre connecte." };
  }

  const payload = {
    owner_id: user.id,
    title: parsed.data.title,
    description: parsed.data.description,
    price: parsed.data.price,
    bedrooms: parsed.data.bedrooms,
    bathrooms: parsed.data.bathrooms,
    square_meters: parsed.data.squareMeters,
    property_type: parsed.data.propertyType,
    address: parsed.data.address,
    amenities: parsed.data.amenities,
    location: toGeographyPoint(
      parsed.data.locationLatitude,
      parsed.data.locationLongitude
    ),
    status: "DRAFT",
  };

  const { data, error } = await supabase
    .from("properties")
    .insert(payload)
    .select()
    .single();

  if (error || !data) {
    return {
      success: false,
      error: error?.message ?? "Impossible de creer l'annonce.",
    };
  }

  revalidatePath("/owner/properties");
  // TODO: type manquant - `Property` (src/types/properties.ts) n'inclut pas
  // tous les statuts/types de la DB. On cast pour rester pragmatique.
  return { success: true, data: data as unknown as Property };
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

/**
 * Met a jour une annonce existante. Seuls les champs presents dans `formData`
 * sont modifies. L'appelant doit etre proprietaire de l'annonce.
 */
export async function updateProperty(
  id: string,
  formData: Partial<UpdatePropertyFormData>
): Promise<ActionResult<Property>> {
  const parsed = updatePropertySchema.safeParse({ ...formData, id });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Donnees invalides.",
    };
  }

  const check = await assertOwnership(id);
  if (!check.ok) return check.result;

  const { supabase } = check;
  const { id: _id, ...rest } = parsed.data;

  const update: Record<string, unknown> = {};
  if (rest.title !== undefined) update.title = rest.title;
  if (rest.description !== undefined) update.description = rest.description;
  if (rest.price !== undefined) update.price = rest.price;
  if (rest.bedrooms !== undefined) update.bedrooms = rest.bedrooms;
  if (rest.bathrooms !== undefined) update.bathrooms = rest.bathrooms;
  if (rest.squareMeters !== undefined) update.square_meters = rest.squareMeters;
  if (rest.propertyType !== undefined) update.property_type = rest.propertyType;
  if (rest.address !== undefined) update.address = rest.address;
  if (rest.amenities !== undefined) update.amenities = rest.amenities;
  if (rest.locationLatitude !== undefined || rest.locationLongitude !== undefined) {
    update.location = toGeographyPoint(
      rest.locationLatitude,
      rest.locationLongitude
    );
  }

  const { data, error } = await supabase
    .from("properties")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    return {
      success: false,
      error: error?.message ?? "Impossible de mettre a jour l'annonce.",
    };
  }

  revalidatePath("/owner/properties");
  revalidatePath(`/properties/${id}`);
  return { success: true, data: data as unknown as Property };
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

/** Supprime definitivement une annonce (cascade SQL sur photos, favoris, etc.). */
export async function deleteProperty(id: string): Promise<ActionResult> {
  const check = await assertOwnership(id);
  if (!check.ok) return check.result;

  const { supabase } = check;
  const { error } = await supabase.from("properties").delete().eq("id", id);

  if (error) {
    return {
      success: false,
      error: "Impossible de supprimer l'annonce.",
    };
  }

  revalidatePath("/owner/properties");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Publish / Unpublish
// ---------------------------------------------------------------------------

/**
 * Publie une annonce (statut -> AVAILABLE). L'annonce devient visible
 * dans la recherche publique.
 */
export async function publishProperty(id: string): Promise<ActionResult<Property>> {
  const check = await assertOwnership(id);
  if (!check.ok) return check.result;

  const { supabase } = check;
  const { data, error } = await supabase
    .from("properties")
    .update({ status: "AVAILABLE" })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    return {
      success: false,
      error: "Impossible de publier l'annonce.",
    };
  }

  revalidatePath("/owner/properties");
  revalidatePath("/properties");
  return { success: true, data: data as unknown as Property };
}

/** Retire une annonce de la recherche publique (statut -> UNAVAILABLE). */
export async function unpublishProperty(id: string): Promise<ActionResult<Property>> {
  const check = await assertOwnership(id);
  if (!check.ok) return check.result;

  const { supabase } = check;
  const { data, error } = await supabase
    .from("properties")
    .update({ status: "UNAVAILABLE" })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    return {
      success: false,
      error: "Impossible de retirer l'annonce.",
    };
  }

  revalidatePath("/owner/properties");
  revalidatePath("/properties");
  return { success: true, data: data as unknown as Property };
}
