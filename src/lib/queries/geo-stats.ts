import "server-only";

import { createClient } from "@/lib/supabase/server";
import { COUNTRIES, getAllCities } from "@/lib/geo/locations";

// =============================================================================
// KAZA — Stats géographiques live (counts par pays, par ville, prix moyen)
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
  const supabase = await createClient();

  // 1. Toutes les propriétés AVAILABLE avec leur address + price
  const { data, error } = await supabase
    .from("properties")
    .select("address, price")
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
      if (price > 0) {
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
    { name: string; city: string; countryCode: string; sumPrice: number; count: number }
  > = {};

  for (const country of COUNTRIES) {
    for (const city of country.cities) {
      for (const neighborhood of city.neighborhoods) {
        const key = `${country.code}:${city.slug}:${neighborhood.slug}`;
        neighborhoodAgg[key] = {
          name: neighborhood.name,
          city: city.name,
          countryCode: country.code,
          sumPrice: 0,
          count: 0,
        };
      }
    }
  }

  for (const prop of data) {
    const addr = (prop.address as string | null)?.toLowerCase() ?? "";
    const price = Number(prop.price);
    for (const [_key, agg] of Object.entries(neighborhoodAgg)) {
      const lower = agg.name.toLowerCase();
      if (addr.includes(lower)) {
        agg.count += 1;
        if (price > 0) agg.sumPrice += price;
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
        avgPrice: n.count > 0 ? Math.round(n.sumPrice / n.count) : 0,
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
