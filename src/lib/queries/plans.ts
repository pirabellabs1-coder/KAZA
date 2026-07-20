import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { PLAN_DETAILS, type PlanDetails } from "@/lib/queries/subscriptions";

// =============================================================================
// Kaabo — Plans d'abonnement centralisés en DB (lecture server-side)
//
// Source de vérité : table `public.plans` (migration 00031). Pilotable depuis
// l'espace admin (/admin/plans) sans redéploiement. Mappe les lignes vers le
// format `PlanDetails` partagé avec `subscriptions.ts`.
//
// Le catalogue statique `PLAN_DETAILS` reste utilisé comme FALLBACK lorsque la
// table est vide / inaccessible (erreur réseau, RLS, migration non appliquée).
// =============================================================================

// La table `plans` n'est pas encore typée dans `src/types/supabase.ts` — on
// retombe sur le client générique, comme pour `job_offers` / `subscriptions`.
async function getLooseClient(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

interface PlanRow {
  key: string;
  name: string;
  audience: string;
  price_monthly: number | string;
  price_yearly: number | string | null;
  features: unknown;
  sort_order: number;
  is_active: boolean;
}

function coerceAudience(value: string): PlanDetails["audience"] {
  return value === "AGENCY" ? "AGENCY" : "TENANT";
}

function coerceFeatures(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  return [];
}

function mapRow(row: PlanRow): PlanDetails {
  const priceYearly =
    row.price_yearly === null || row.price_yearly === undefined
      ? undefined
      : Number(row.price_yearly);

  return {
    name: row.name,
    priceMonthly: Number(row.price_monthly),
    ...(priceYearly !== undefined ? { priceYearly } : {}),
    audience: coerceAudience(row.audience),
    features: coerceFeatures(row.features),
  };
}

/**
 * Lit tous les plans actifs depuis la table `plans`, triés par `sort_order`,
 * et les mappe vers un `Record<string, PlanDetails>` (clé = `plans.key`).
 *
 * Fallback : si la table est vide, inaccessible ou en erreur, retourne le
 * catalogue statique `PLAN_DETAILS` afin de ne jamais casser l'affichage des
 * tarifs ni le tunnel d'abonnement.
 */
export async function getAllPlans(): Promise<Record<string, PlanDetails>> {
  try {
    const supabase = await getLooseClient();
    const { data, error } = await supabase
      .from("plans")
      .select(
        "key, name, audience, price_monthly, price_yearly, features, sort_order, is_active",
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error || !data || data.length === 0) {
      if (error) console.warn("[plans] getAllPlans:", error.message);
      return PLAN_DETAILS;
    }

    const result: Record<string, PlanDetails> = {};
    for (const row of data as PlanRow[]) {
      result[row.key] = mapRow(row);
    }
    return result;
  } catch (err) {
    console.warn("[plans] getAllPlans (exception):", err);
    return PLAN_DETAILS;
  }
}

/**
 * Retourne le détail d'un plan par sa clé (lecture DB avec fallback statique).
 * Utilisé notamment pour recalculer le prix au moment du débit wallet.
 */
export async function getPlan(key: string): Promise<PlanDetails | null> {
  const all = await getAllPlans();
  return all[key] ?? PLAN_DETAILS[key] ?? null;
}
