"use server";

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { COUNTRIES } from "@/lib/geo/locations";

// =============================================================================
// Kaabo — Comparateur de quartiers (stats réelles calculées depuis les annonces)
// =============================================================================

export interface NeighborhoodOption {
  slug: string;
  name: string;
  city: string;
  country: string;
}

export interface NeighborhoodStats {
  slug: string;
  name: string;
  city: string;
  /** Indice de standing 1→5 (référentiel Kaabo). */
  priceTier: number;
  tags: string[];
  /** Nombre de biens disponibles détectés dans le quartier. */
  count: number;
  /** Loyer moyen (locations uniquement), 0 si aucune location. */
  avgRent: number;
  minRent: number;
  maxRent: number;
  avgSurface: number;
  /** Loyer moyen au m² (0 si non calculable). */
  avgPricePerM2: number;
  topType: string;
  amenities: {
    parking: number;
    airConditioning: number;
    furnished: number;
    waterIncluded: number;
    internet: number;
    securityGuard: number;
  };
}

/** Liste plate de tous les quartiers du référentiel (pour le sélecteur). */
export async function listAllNeighborhoods(): Promise<NeighborhoodOption[]> {
  const out: NeighborhoodOption[] = [];
  for (const country of COUNTRIES) {
    for (const city of country.cities) {
      for (const n of city.neighborhoods) {
        out.push({
          slug: n.slug,
          name: n.name,
          city: city.name,
          country: country.name,
        });
      }
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

function pct(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

export async function getNeighborhoodComparison(
  slugs: string[],
): Promise<NeighborhoodStats[]> {
  const wanted = (slugs ?? []).slice(0, 4);
  if (wanted.length === 0) return [];

  // Résout les quartiers demandés depuis le référentiel.
  const refs: Array<{
    slug: string;
    name: string;
    city: string;
    priceTier: number;
    tags: string[];
  }> = [];
  for (const country of COUNTRIES) {
    for (const city of country.cities) {
      for (const n of city.neighborhoods) {
        if (wanted.includes(n.slug)) {
          refs.push({
            slug: n.slug,
            name: n.name,
            city: city.name,
            priceTier: n.priceTier,
            tags: n.tags,
          });
        }
      }
    }
  }
  if (refs.length === 0) return [];

  const supabase = (await createClient()) as unknown as SupabaseClient;
  const { data } = await supabase
    .from("properties")
    .select(
      "address, price, listing_type, square_meters, property_type, amenities",
    )
    .eq("status", "AVAILABLE");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props = (data ?? []) as any[];

  return refs.map((ref) => {
    const nameLower = ref.name.toLowerCase();
    const inHood = props.filter((p) =>
      ((p.address as string | null) ?? "").toLowerCase().includes(nameLower),
    );
    const rents = inHood
      .filter(
        (p) => String(p.listing_type ?? "RENT").toUpperCase() !== "SALE",
      )
      .map((p) => Number(p.price))
      .filter((v) => v > 0);
    const surfaces = inHood
      .map((p) => Number(p.square_meters))
      .filter((v) => v > 0);

    const avgRent =
      rents.length > 0
        ? Math.round(rents.reduce((s, v) => s + v, 0) / rents.length)
        : 0;
    const avgSurface =
      surfaces.length > 0
        ? Math.round(surfaces.reduce((s, v) => s + v, 0) / surfaces.length)
        : 0;

    // Type le plus fréquent.
    const typeCount = new Map<string, number>();
    for (const p of inHood) {
      const t = String(p.property_type ?? "");
      typeCount.set(t, (typeCount.get(t) ?? 0) + 1);
    }
    const topType =
      Array.from(typeCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ??
      "—";

    // Fréquence des équipements.
    const total = inHood.length;
    const count = (re: RegExp) =>
      inHood.filter((p) =>
        ((p.amenities ?? []) as string[]).some((a) => re.test(String(a).toLowerCase())),
      ).length;

    return {
      slug: ref.slug,
      name: ref.name,
      city: ref.city,
      priceTier: ref.priceTier,
      tags: ref.tags,
      count: total,
      avgRent,
      minRent: rents.length > 0 ? Math.min(...rents) : 0,
      maxRent: rents.length > 0 ? Math.max(...rents) : 0,
      avgSurface,
      avgPricePerM2:
        avgRent > 0 && avgSurface > 0 ? Math.round(avgRent / avgSurface) : 0,
      topType,
      amenities: {
        parking: pct(count(/parking|garage/), total),
        airConditioning: pct(count(/clim/), total),
        furnished: pct(count(/meubl/), total),
        waterIncluded: pct(count(/eau/), total),
        internet: pct(count(/internet|wifi/), total),
        securityGuard: pct(count(/gardien|s[ée]cur/), total),
      },
    } satisfies NeighborhoodStats;
  });
}
