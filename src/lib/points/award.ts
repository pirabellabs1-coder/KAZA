import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";

// =============================================================================
// Kaabo — Attribution de points Kaabo (best-effort, jamais bloquant)
// =============================================================================
// Insère une transaction de points ; le trigger `on_points_tx_insert` met à
// jour le solde. Utilise le service_role pour contourner la RLS. N'échoue
// jamais : l'attribution de points ne doit pas casser l'action métier.
// =============================================================================

export type PointsAwardType =
  | "PROPERTY_LISTED"
  | "CONTRACT_SIGNED"
  | "REVIEW_GIVEN"
  | "PROFILE_COMPLETED"
  | "REFERRAL";

const DEFAULT_AMOUNTS: Record<PointsAwardType, number> = {
  PROPERTY_LISTED: 250,
  CONTRACT_SIGNED: 1000,
  REVIEW_GIVEN: 25,
  PROFILE_COMPLETED: 100,
  REFERRAL: 1000,
};

/**
 * Crédite des points Kaabo à un utilisateur.
 * @param amount montant explicite (sinon barème par défaut du type)
 */
export async function awardPoints(
  userId: string | null | undefined,
  type: PointsAwardType,
  description: string,
  amount?: number,
  metadata?: Record<string, unknown>,
): Promise<void> {
  if (!userId) return;
  const pts = amount ?? DEFAULT_AMOUNTS[type];
  if (!pts || pts <= 0) return;
  try {
    const admin = createAdminClient() as unknown as SupabaseClient;
    await admin.from("kaza_points_transactions").insert({
      user_id: userId,
      type,
      amount: pts,
      description,
      metadata: metadata ?? {},
    });
  } catch (err) {
    console.error("[points/award]", type, err);
  }
}
