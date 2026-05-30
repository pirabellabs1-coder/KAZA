import "server-only";

import { createClient } from "@/lib/supabase/server";

// =============================================================================
// KAZA — Queries Feature Flags (server-side)
// Lecture de la table `public.feature_flags` (RLS : SELECT public, write ADMIN).
//   - `listFeatureFlags` : back-office admin /admin/feature-flags
//   - `isFeatureEnabled` : helper de garde côté serveur (kill-switch)
//
// Les types Supabase auto-générés ne connaissent pas encore la table
// `feature_flags` (migration 00030). On bypass volontairement via `as any` —
// la sécurité reste assurée par les policies RLS.
// =============================================================================

export interface FeatureFlag {
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  rollout: number; // 0-100
  createdAt: string;
  updatedAt: string;
}

interface FeatureFlagRow {
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  rollout: number;
  created_at: string;
  updated_at: string;
}

function mapRow(row: FeatureFlagRow): FeatureFlag {
  return {
    key: row.key,
    name: row.name,
    description: row.description,
    enabled: row.enabled,
    rollout: row.rollout,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Liste tous les feature flags, triés par clé (ordre alphabétique stable).
 * Renvoie un tableau vide en cas d'erreur ou d'absence de données.
 */
export async function listFeatureFlags(): Promise<FeatureFlag[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("feature_flags")
    .select("*")
    .order("key", { ascending: true });

  if (error) {
    console.warn("[feature-flags] listFeatureFlags:", error.message);
    return [];
  }

  return ((data ?? []) as FeatureFlagRow[]).map(mapRow);
}

/**
 * Helper de garde : indique si un flag est activé.
 * Un flag absent ou en erreur est considéré comme désactivé (fail-safe).
 */
export async function isFeatureEnabled(key: string): Promise<boolean> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("feature_flags")
    .select("enabled")
    .eq("key", key)
    .maybeSingle();

  if (error || !data) {
    if (error) console.warn("[feature-flags] isFeatureEnabled:", error.message);
    return false;
  }

  return Boolean((data as { enabled: boolean }).enabled);
}
