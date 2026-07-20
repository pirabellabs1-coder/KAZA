import "server-only";

import { createClient } from "@/lib/supabase/server";

// =============================================================================
// Kaabo — Queries propriétés par owner (server-side)
// Utilisé par les dashboards Owner et Agency pour lister/agréger leur portefeuille.
// =============================================================================

export interface OwnerProperty {
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
}

export interface OwnerPortfolioStats {
  total: number;
  available: number;
  rented: number;
  draft: number;
  totalMonthlyRevenuePotential: number;
  totalViews: number;
}

/** Liste les propriétés appartenant à un user (owner ou agence) */
export async function listPropertiesByOwner(
  ownerId: string,
): Promise<OwnerProperty[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select(
      `
      id, title, description, price, bedrooms, bathrooms,
      square_meters, property_type, status, address, amenities,
      views_count, created_at,
      photos:property_photos(photo_url, display_order)
    `,
    )
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[owner-properties] listPropertiesByOwner:", error.message);
    return [];
  }

  return (data ?? []).map((p): OwnerProperty => {
    const photos =
      (p.photos as unknown as
        | Array<{ photo_url: string; display_order: number }>
        | null)
        ?.slice()
        ?.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)) ?? [];
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
      primaryPhotoUrl: photos[0]?.photo_url ?? null,
    };
  });
}

/** Stats agrégées du portefeuille de l'owner */
export async function getOwnerPortfolioStats(
  ownerId: string,
): Promise<OwnerPortfolioStats> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select("id, status, price, views_count")
    .eq("owner_id", ownerId);

  if (error) {
    console.error("[owner-properties] getOwnerPortfolioStats:", error.message);
    return {
      total: 0,
      available: 0,
      rented: 0,
      draft: 0,
      totalMonthlyRevenuePotential: 0,
      totalViews: 0,
    };
  }

  const props = data ?? [];
  return {
    total: props.length,
    available: props.filter((p) => p.status === "AVAILABLE").length,
    rented: props.filter((p) => p.status === "RENTED").length,
    draft: props.filter((p) => p.status === "DRAFT").length,
    totalMonthlyRevenuePotential: props
      .filter((p) => p.status === "AVAILABLE" || p.status === "RENTED")
      .reduce((sum, p) => sum + Number(p.price), 0),
    totalViews: props.reduce(
      (sum, p) => sum + ((p.views_count as number) ?? 0),
      0,
    ),
  };
}
