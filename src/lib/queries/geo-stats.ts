import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { COUNTRIES, getAllCities } from "@/lib/geo/locations";

// =============================================================================
// Kaabo — Stats géographiques live (counts par pays, par ville, prix moyen)
// =============================================================================

export interface GeoStats {
  countryCounts: Record<string, number>;
  cityCounts: Record<string, number>;
  cityAvgPrice: Record<string, number>;
  total: number;
  topNeighborhoodsByCountry: Record<
    string,
    Array<{ name: string; city: string; avgPrice: number; count: number }>
  >;
}

/**
 * Récupère les counts réels de biens AVAILABLE par pays et par ville.
 * Utilise ILIKE sur address car la colonne address est un texte libre.
 */
export async function getGeoStats(): Promise<GeoStats> {
  const supabase = (await createClient()) as unknown as SupabaseClient;

  // 1. Toutes les propriétés AVAILABLE avec address + price + type de transaction.
  //    Le "loyer moyen" ne doit inclure QUE les locations (RENT) : mélanger un
  //    prix de vente (plusieurs millions) fausse totalement la moyenne.
  const { data, error } = await supabase
    .from("properties")
    .select("address, price, listing_type")
    .eq("status", "AVAILABLE");

  if (error || !data) {
    return { countryCounts: {}, cityCounts: {}, cityAvgPrice: {}, total: 0, topNeighborhoodsByCountry: {} };
  }

  // Construit la liste de villes/pays à matcher
  const cities = getAllCities();
  const countryCounts: Record<string, number> = {};
  const cityCounts: Record<string, number> = {};
  const citySumPrice: Record<string, number> = {};
  const cityPriceCount: Record<string, number> = {};

  for (const country of COUNTRIES) {
    countryCounts[country.code] = 0;
  }

  for (const city of cities) {
    cityCounts[city.slug] = 0;
    citySumPrice[city.slug] = 0;
    cityPriceCount[city.slug] = 0;
  }

  for (const prop of data) {
    const addr = (prop.address as string | null)?.toLowerCase() ?? "";
    const price = Number(prop.price);
    const isRent =
      String(prop.listing_type ?? "RENT").toUpperCase() !== "SALE";

    // Match ville : on cherche le nom de la ville dans l'adresse
    let matchedCity: { slug: string; countryCode: string } | null = null;
    for (const city of cities) {
      // Match insensible : "cotonou" ou "abomey-calavi" → "abomey calavi" ou "calavi"
      const cityName = city.name.toLowerCase();
      const altName = city.slug.replace(/-/g, " ");
      if (addr.includes(cityName) || addr.includes(altName)) {
        matchedCity = { slug: city.slug, countryCode: city.countryCode };
        break;
      }
    }

    if (matchedCity) {
      cityCounts[matchedCity.slug] = (cityCounts[matchedCity.slug] ?? 0) + 1;
      countryCounts[matchedCity.countryCode] =
        (countryCounts[matchedCity.countryCode] ?? 0) + 1;
      // Loyer moyen : uniquement les locations.
      if (price > 0 && isRent) {
        citySumPrice[matchedCity.slug] =
          (citySumPrice[matchedCity.slug] ?? 0) + price;
        cityPriceCount[matchedCity.slug] =
          (cityPriceCount[matchedCity.slug] ?? 0) + 1;
      }
    }
  }

  const cityAvgPrice: Record<string, number> = {};
  for (const city of cities) {
    const n = cityPriceCount[city.slug] ?? 0;
    cityAvgPrice[city.slug] = n > 0 ? Math.round((citySumPrice[city.slug] ?? 0) / n) : 0;
  }

  // Top neighborhoods par pays — détection par nom dans l'adresse
  const neighborhoodAgg: Record<
    string,
    {
      name: string;
      city: string;
      countryCode: string;
      sumRent: number;
      rentCount: number;
      count: number;
    }
  > = {};

  for (const country of COUNTRIES) {
    for (const city of country.cities) {
      for (const neighborhood of city.neighborhoods) {
        const key = `${country.code}:${city.slug}:${neighborhood.slug}`;
        neighborhoodAgg[key] = {
          name: neighborhood.name,
          city: city.name,
          countryCode: country.code,
          sumRent: 0,
          rentCount: 0,
          count: 0,
        };
      }
    }
  }

  for (const prop of data) {
    const addr = (prop.address as string | null)?.toLowerCase() ?? "";
    const price = Number(prop.price);
    const isRent =
      String(prop.listing_type ?? "RENT").toUpperCase() !== "SALE";
    for (const agg of Object.values(neighborhoodAgg)) {
      const lower = agg.name.toLowerCase();
      if (addr.includes(lower)) {
        agg.count += 1;
        // Le loyer moyen ne compte que les locations.
        if (price > 0 && isRent) {
          agg.sumRent += price;
          agg.rentCount += 1;
        }
        break;
      }
    }
  }

  const topNeighborhoodsByCountry: GeoStats["topNeighborhoodsByCountry"] = {};
  for (const country of COUNTRIES) {
    const list = Object.values(neighborhoodAgg)
      .filter((n) => n.countryCode === country.code && n.count > 0)
      .map((n) => ({
        name: n.name,
        city: n.city,
        count: n.count,
        avgPrice: n.rentCount > 0 ? Math.round(n.sumRent / n.rentCount) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    if (list.length > 0) {
      topNeighborhoodsByCountry[country.code] = list;
    }
  }

  return {
    countryCounts,
    cityCounts,
    cityAvgPrice,
    total: data.length,
    topNeighborhoodsByCountry,
  };
}
