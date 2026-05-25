// =============================================================================
// KAZA - Properties Queries (Server Components)
//
// Helpers de lecture utilisables dans les Server Components (PAS de
// `'use server'`). Aucun side-effect, retour direct ou throw en cas d'erreur.
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import type {
  PropertyWithOwner,
  PropertyWithPhotos,
} from "@/types/properties";

// TODO: type manquant - voir note dans `queries/users.ts`.
async function getLooseClient(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

// ---------------------------------------------------------------------------
// Types publics
// ---------------------------------------------------------------------------

export interface SearchPropertiesParams {
  q?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  type?: string;
  bedrooms?: number;
  page?: number;
  perPage?: number;
}

export interface PaginatedProperties {
  items: PropertyWithPhotos[];
  total: number;
  page: number;
  perPage: number;
}

// ---------------------------------------------------------------------------
// searchProperties
// ---------------------------------------------------------------------------

/**
 * Recherche paginee d'annonces publiques (statut AVAILABLE).
 * Combine recherche texte (titre/description), ville (address), fourchette
 * de prix, type de bien et nombre de chambres.
 */
export async function searchProperties(
  params: SearchPropertiesParams = {}
): Promise<PaginatedProperties> {
  const supabase = await getLooseClient();
  const page = params.page && params.page > 0 ? params.page : 1;
  const perPage =
    params.perPage && params.perPage > 0 && params.perPage <= 50
      ? params.perPage
      : 12;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from("properties")
    .select(
      `
      *,
      photos:property_photos (*)
    `,
      { count: "exact" }
    )
    .eq("status", "AVAILABLE");

  if (params.q && params.q.trim().length > 0) {
    const q = params.q.trim();
    query = query.or(
      `title.ilike.%${q}%,description.ilike.%${q}%,address.ilike.%${q}%`
    );
  }

  if (params.city && params.city.trim().length > 0) {
    query = query.ilike("address", `%${params.city.trim()}%`);
  }

  if (typeof params.minPrice === "number") {
    query = query.gte("price", params.minPrice);
  }
  if (typeof params.maxPrice === "number") {
    query = query.lte("price", params.maxPrice);
  }

  if (params.type) {
    // TODO: type manquant - `PropertyType` (types/properties.ts) ne couvre pas
    // VILLA, SHARED_ROOM, COMMERCIAL, LAND alors que la DB les supporte.
    query = query.eq("property_type", params.type);
  }

  if (typeof params.bedrooms === "number") {
    query = query.gte("bedrooms", params.bedrooms);
  }

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`Recherche d'annonces impossible : ${error.message}`);
  }

  return {
    items: (data ?? []) as unknown as PropertyWithPhotos[],
    total: count ?? 0,
    page,
    perPage,
  };
}

// ---------------------------------------------------------------------------
// getPropertyById
// ---------------------------------------------------------------------------

/**
 * Recupere une annonce avec ses photos et le profil public du proprietaire.
 * Retourne `null` si introuvable.
 */
export async function getPropertyById(
  id: string
): Promise<PropertyWithOwner | null> {
  const supabase = await getLooseClient();

  const { data, error } = await supabase
    .from("properties")
    .select(
      `
      *,
      photos:property_photos (*),
      owner:users!properties_owner_id_fkey (
        id,
        first_name,
        last_name,
        profile_photo_url,
        role,
        is_verified,
        verification_status,
        bio,
        rating_average,
        created_at
      )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Lecture de l'annonce impossible : ${error.message}`);
  }

  if (!data) return null;
  return data as unknown as PropertyWithOwner;
}

// ---------------------------------------------------------------------------
// getFeaturedProperties
// ---------------------------------------------------------------------------

/**
 * Retourne les annonces "en vedette" : statut AVAILABLE, triees par
 * nombre de vues decroissant.
 */
export async function getFeaturedProperties(
  limit = 4
): Promise<PropertyWithPhotos[]> {
  const supabase = await getLooseClient();

  const { data, error } = await supabase
    .from("properties")
    .select(
      `
      *,
      photos:property_photos (*)
    `
    )
    .eq("status", "AVAILABLE")
    .order("views_count", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Lecture des annonces vedettes impossible : ${error.message}`);
  }

  return (data ?? []) as unknown as PropertyWithPhotos[];
}

// ---------------------------------------------------------------------------
// getPropertiesByOwner
// ---------------------------------------------------------------------------

/** Retourne toutes les annonces d'un proprietaire (tous statuts). */
export async function getPropertiesByOwner(
  ownerId: string
): Promise<PropertyWithPhotos[]> {
  const supabase = await getLooseClient();

  const { data, error } = await supabase
    .from("properties")
    .select(
      `
      *,
      photos:property_photos (*)
    `
    )
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(
      `Lecture des annonces du proprietaire impossible : ${error.message}`
    );
  }

  return (data ?? []) as unknown as PropertyWithPhotos[];
}
