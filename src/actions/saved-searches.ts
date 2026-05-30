"use server";

// =============================================================================
// KAZA — Recherches sauvegardées & alertes (Server Actions)
//
// "Sauvegarder" et "Alerte" sur la page recherche persistent les critères de
// l'utilisateur dans `public.saved_searches`. Une alerte = ligne avec
// is_alert = TRUE (notification ultérieure sur nouveaux biens correspondants).
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

import type { ActionResult } from "./notifications";

async function getLooseClient(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

export interface SearchCriteria {
  country?: string;
  city?: string;
  type?: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  q?: string;
  targets?: string;
}

export interface SavedSearchRow {
  id: string;
  label: string;
  criteria: SearchCriteria;
  isAlert: boolean;
  createdAt: string;
}

/** Construit un libellé lisible à partir des critères. */
function buildLabel(criteria: SearchCriteria): string {
  const parts: string[] = [];
  if (criteria.q) parts.push(criteria.q);
  if (criteria.city) parts.push(criteria.city);
  if (criteria.type) parts.push(criteria.type);
  if (criteria.maxPrice) parts.push(`≤ ${criteria.maxPrice} FCFA`);
  return parts.length > 0 ? parts.join(" · ") : "Toutes les annonces";
}

/** Nettoie les critères : on ne garde que les champs non vides / non "all". */
function cleanCriteria(criteria: SearchCriteria): SearchCriteria {
  const out: SearchCriteria = {};
  for (const [k, v] of Object.entries(criteria)) {
    if (v && v !== "all" && v !== "") {
      out[k as keyof SearchCriteria] = v;
    }
  }
  return out;
}

/**
 * Enregistre une recherche (is_alert = false) ou une alerte (is_alert = true).
 */
export async function saveSearch(
  criteria: SearchCriteria,
  isAlert: boolean,
): Promise<ActionResult<{ id: string }>> {
  const supabase = await getLooseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Connectez-vous pour utiliser cette fonctionnalité." };
  }

  const clean = cleanCriteria(criteria);
  const label = buildLabel(clean);

  // Évite les doublons exacts (mêmes critères + même type) pour cet utilisateur.
  const { data: existing } = await supabase
    .from("saved_searches")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_alert", isAlert)
    .eq("criteria", JSON.stringify(clean))
    .maybeSingle();

  if (existing?.id) {
    return { success: true, data: { id: existing.id as string } };
  }

  const { data, error } = await supabase
    .from("saved_searches")
    .insert({
      user_id: user.id,
      label,
      criteria: clean,
      is_alert: isAlert,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[saved-searches] saveSearch:", error.message);
    return { success: false, error: "Impossible d'enregistrer pour le moment." };
  }

  return { success: true, data: { id: data.id as string } };
}

/** Liste les recherches/alertes de l'utilisateur courant. */
export async function getMySavedSearches(): Promise<SavedSearchRow[]> {
  const supabase = await getLooseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("saved_searches")
    .select("id, label, criteria, is_alert, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[saved-searches] getMySavedSearches:", error.message);
    return [];
  }

  return (data ?? []).map((r) => ({
    id: r.id as string,
    label: (r.label as string) ?? "Ma recherche",
    criteria: (r.criteria as SearchCriteria) ?? {},
    isAlert: Boolean(r.is_alert),
    createdAt: r.created_at as string,
  }));
}

/** Supprime une recherche/alerte. */
export async function deleteSavedSearch(
  id: string,
): Promise<ActionResult<null>> {
  const supabase = await getLooseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié." };

  const { error } = await supabase
    .from("saved_searches")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: "Suppression impossible." };
  }
  return { success: true, data: null };
}
