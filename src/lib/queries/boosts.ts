import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

// =============================================================================
// KAZA — Queries boosts d'annonce (server-side)
//
// Un boost actif (status = ACTIVE et ends_at > now) doit avoir un effet visible :
// l'annonce remonte en tête de la recherche / des listings publics et reçoit un
// badge « Sponsorisé ». Ce module expose la lecture des property_id boostés.
//
// La table `property_boosts` n'est pas typée dans `src/types/supabase.ts` :
// on passe par un client générique pour la requête.
// =============================================================================

/**
 * Retourne l'ensemble des `property_id` ayant au moins un boost actif
 * (status = ACTIVE et ends_at dans le futur). Renvoie un `Set` pour un test
 * d'appartenance O(1) côté appelant.
 *
 * Ne lève jamais : en cas d'erreur (table absente, RLS, etc.) renvoie un Set
 * vide — l'absence de boost ne doit pas casser l'affichage des annonces.
 */
export async function getActiveBoostedPropertyIds(): Promise<Set<string>> {
  try {
    const supabase = (await createClient()) as unknown as SupabaseClient;
    const { data, error } = await supabase
      .from("property_boosts")
      .select("property_id")
      .eq("status", "ACTIVE")
      .gt("ends_at", new Date().toISOString());

    if (error) {
      console.error("[queries/boosts] getActiveBoostedPropertyIds:", error.message);
      return new Set();
    }

    const ids = (data ?? [])
      .map((row: { property_id?: unknown }) =>
        typeof row.property_id === "string" ? row.property_id : null,
      )
      .filter((id): id is string => Boolean(id));

    return new Set(ids);
  } catch (err) {
    console.error("[queries/boosts] getActiveBoostedPropertyIds (catch):", err);
    return new Set();
  }
}
