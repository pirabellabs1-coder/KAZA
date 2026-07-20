import "server-only";

// =============================================================================
// Kaabo — Activation d'un boost d'annonce payé par moyen de paiement.
// Réutilisé par le webhook après paiement COMPLETED (purpose = BOOST).
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";

export interface ActivateBoostResult {
  ok: boolean;
  boostId?: string;
  error?: string;
}

export async function activatePaidBoost(
  admin: SupabaseClient,
  params: {
    userId: string;
    propertyId: string;
    plan: string;
    days: number;
    amountFcfa: number;
    paymentId?: string;
  },
): Promise<ActivateBoostResult> {
  const { userId, propertyId, plan } = params;
  const days = Number(params.days) || 7;
  if (!userId || !propertyId || !plan) return { ok: false, error: "INVALID" };

  try {
    const now = new Date();
    const endsAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const { data: boost, error } = await admin
      .from("property_boosts")
      .insert({
        property_id: propertyId,
        user_id: userId,
        plan,
        amount: Number(params.amountFcfa) || 0,
        starts_at: now.toISOString(),
        ends_at: endsAt.toISOString(),
        status: "ACTIVE",
        payment_id: params.paymentId ?? null,
      })
      .select("id")
      .single();

    if (error || !boost) {
      return { ok: false, error: error?.message ?? "INSERT_FAILED" };
    }
    return { ok: true, boostId: (boost as { id: string }).id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "EXCEPTION" };
  }
}
