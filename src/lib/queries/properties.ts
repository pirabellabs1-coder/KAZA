import "server-only";

import { createClient } from "@/lib/supabase/server";

// =============================================================================
// KAZA — Queries propriétés Supabase (server-side)
// Toutes les fonctions retournent des données prêtes à afficher.
// Empty array si aucune donnée — pas d'erreur.
// =============================================================================

export interface PublicProperty {
  id: string;
  title: string;
  description: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqm: number;
  type: string;
  status: string;
  address: string;
  amenities: string[];
  viewsCount: number;
  createdAt: string;
  primaryPhotoUrl: string | null;
  photos: string[];
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    isVerified: boolean;
  } | null;
}

const DEFAULT_PHOTO =
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80";

/**
 * Liste les propriétés publiquement visibles (AVAILABLE), avec leur 1ère photo.
 * Tri : plus récentes d'abord.
 * @param limit — nb max (défaut 24)
 */
export async function listPublicProperties(
  options: {
    limit?: number;
    type?: string;
    minPrice?: number;
    maxPrice?: number;
    minBedrooms?: number;
    city?: string;
  } = {},
): Promise<PublicProperty[]> {
  const supabase = await createClient();
  let q = supabase
    .from("properties")
    .select(
      `
      id, title, description, price, bedrooms, bathrooms,
      square_meters, property_type, status, address, amenities,
      views_count, created_at,
      photos:property_photos(photo_url, display_order),
      owner:users!owner_id(id, first_name, last_name, role, is_verified)
    `,
    )
    .eq("status", "AVAILABLE")
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 24);

  if (options.type) q = q.eq("property_type", options.type);
  if (options.minPrice) q = q.gte("price", options.minPrice);
  if (options.maxPrice) q = q.lte("price", options.maxPrice);
  if (options.minBedrooms) q = q.gte("bedrooms", options.minBedrooms);
  if (options.city) q = q.ilike("address", `%${options.city}%`);

  const { data, error } = await q;
  if (error) {
    console.error("[queries/properties] listPublicProperties:", error.message);
    return [];
  }

  return (data ?? []).map((p): PublicProperty => {
    const photos = (p.photos as Array<{ photo_url: string; display_order: number }> | null)
      ?.slice()
      ?.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
      ?.map((ph) => ph.photo_url) ?? [];
    const ownerRow = Array.isArray(p.owner) ? p.owner[0] : p.owner;
    return {
      id: p.id as string,
      title: p.title as string,
      description: p.description as string,
      price: Number(p.price),
      bedrooms: p.bedrooms as number,
      bathrooms: p.bathrooms as number,
      sqm: (p.square_meters as number) ?? 0,
      type: p.property_type as string,
      status: p.status as string,
      address: p.address as string,
      amenities: (p.amenities as string[]) ?? [],
      viewsCount: (p.views_count as number) ?? 0,
      createdAt: p.created_at as string,
      primaryPhotoUrl: photos[0] ?? DEFAULT_PHOTO,
      photos: photos.length > 0 ? photos : [DEFAULT_PHOTO],
      owner: ownerRow
        ? {
            id: ownerRow.id as string,
            firstName: ownerRow.first_name as string,
            lastName: ownerRow.last_name as string,
            role: ownerRow.role as string,
            isVerified: Boolean(ownerRow.is_verified),
          }
        : null,
    };
  });
}

/** Récupère une propriété par id, avec toutes ses photos */
export async function getPropertyById(
  id: string,
): Promise<PublicProperty | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select(
      `
      id, title, description, price, bedrooms, bathrooms,
      square_meters, property_type, status, address, amenities,
      views_count, created_at,
      photos:property_photos(photo_url, display_order),
      owner:users!owner_id(id, first_name, last_name, role, is_verified)
    `,
    )
    .eq("id", id)
    .maybeSingle();
  if (error || !data) {
    if (error) console.error("[queries/properties] getPropertyById:", error.message);
    return null;
  }
  const photos = (data.photos as Array<{ photo_url: string; display_order: number }> | null)
    ?.slice()
    ?.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    ?.map((ph) => ph.photo_url) ?? [];
  const ownerRow = Array.isArray(data.owner) ? data.owner[0] : data.owner;
  return {
    id: data.id as string,
    title: data.title as string,
    description: data.description as string,
    price: Number(data.price),
    bedrooms: data.bedrooms as number,
    bathrooms: data.bathrooms as number,
    sqm: (data.square_meters as number) ?? 0,
    type: data.property_type as string,
    status: data.status as string,
    address: data.address as string,
    amenities: (data.amenities as string[]) ?? [],
    viewsCount: (data.views_count as number) ?? 0,
    createdAt: data.created_at as string,
    primaryPhotoUrl: photos[0] ?? DEFAULT_PHOTO,
    photos: photos.length > 0 ? photos : [DEFAULT_PHOTO],
    owner: ownerRow
      ? {
          id: ownerRow.id as string,
          firstName: ownerRow.first_name as string,
          lastName: ownerRow.last_name as string,
          role: ownerRow.role as string,
          isVerified: Boolean(ownerRow.is_verified),
        }
      : null,
  };
}

/** Stats plateforme pour la landing publique */
export async function getPlatformStats(): Promise<{
  totalProperties: number;
  totalAvailable: number;
  totalUsers: number;
  totalCities: number;
}> {
  const supabase = await createClient();
  const [props, available, users] = await Promise.all([
    supabase.from("properties").select("id", { count: "exact", head: true }),
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("status", "AVAILABLE"),
    supabase.from("users").select("id", { count: "exact", head: true }),
  ]);

  return {
    totalProperties: props.count ?? 0,
    totalAvailable: available.count ?? 0,
    totalUsers: users.count ?? 0,
    totalCities: 7, // valeur dérivée du référentiel geo (Cotonou, Calavi, etc.)
  };
}
