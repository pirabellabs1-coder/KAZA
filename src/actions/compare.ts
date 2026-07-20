"use server";

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

// =============================================================================
// Kaabo — Recherche de biens pour le comparateur (données réelles)
// =============================================================================

const DEFAULT_PHOTO =
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80";

export interface CompareItem {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  squareMeters: number;
  neighborhood: string;
  city: string;
  isVerified: boolean;
  amenities: {
    parking: boolean;
    airConditioning: boolean;
    furnished: boolean;
    waterIncluded: boolean;
    internet: boolean;
    securityGuard: boolean;
  };
}

function has(list: string[], re: RegExp): boolean {
  return list.some((a) => re.test(a));
}

/** Découpe une adresse libre en quartier (1er segment) et ville (dernier utile). */
function splitAddress(address: string): { neighborhood: string; city: string } {
  const parts = address
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return { neighborhood: "", city: "" };
  const neighborhood = parts[0]!;
  // Ville : avant-dernier segment si le dernier est un pays, sinon le dernier.
  const city =
    parts.length >= 3 ? parts[parts.length - 2]! : parts[parts.length - 1]!;
  return { neighborhood, city };
}

export async function searchComparableProperties(
  query: string,
  excludeIds: string[] = [],
): Promise<CompareItem[]> {
  const supabase = (await createClient()) as unknown as SupabaseClient;

  let q = supabase
    .from("properties")
    .select(
      `id, title, price, property_type, bedrooms, bathrooms, square_meters,
       address, amenities,
       photos:property_photos(photo_url, display_order),
       owner:users!owner_id(is_verified)`,
    )
    .eq("status", "AVAILABLE")
    .order("created_at", { ascending: false })
    .limit(24);

  const term = (query ?? "").trim();
  if (term) {
    q = q.or(`title.ilike.%${term}%,address.ilike.%${term}%`);
  }

  const { data, error } = await q;
  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[])
    .filter((p) => !excludeIds.includes(p.id))
    .map((p) => {
      const photos = (p.photos ?? []) as Array<{
        photo_url: string;
        display_order: number;
      }>;
      const cover =
        photos
          .slice()
          .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))[0]
          ?.photo_url ?? DEFAULT_PHOTO;
      const amen = ((p.amenities ?? []) as string[]).map((a) =>
        String(a).toLowerCase(),
      );
      const owner = Array.isArray(p.owner) ? p.owner[0] : p.owner;
      const { neighborhood, city } = splitAddress(
        (p.address as string | null) ?? "",
      );
      return {
        id: p.id as string,
        title: p.title as string,
        price: Number(p.price),
        imageUrl: cover,
        type: p.property_type as string,
        bedrooms: Number(p.bedrooms ?? 0),
        bathrooms: Number(p.bathrooms ?? 0),
        squareMeters: Number(p.square_meters ?? 0),
        neighborhood,
        city,
        isVerified: Boolean(owner?.is_verified),
        amenities: {
          parking: has(amen, /parking|garage/),
          airConditioning: has(amen, /clim/),
          furnished: has(amen, /meubl/),
          waterIncluded: has(amen, /eau/),
          internet: has(amen, /internet|wifi/),
          securityGuard: has(amen, /gardien|s[ée]cur/),
        },
      } satisfies CompareItem;
    });
}
