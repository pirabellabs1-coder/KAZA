import "server-only";

// =============================================================================
// KAZA — Crédit du wallet après recharge Mobile Money (purpose = WALLET_TOPUP).
// Insère une wallet_transactions positive de type TOPUP ; le trigger
// `on_wallet_tx_insert` met à jour balance_fcfa / total_in_fcfa.
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";

export interface CreditWalletResult {
  ok: boolean;
  error?: string;
}

export async function creditWalletTopUp(
  admin: SupabaseClient,
  params: { userId: string; amountFcfa: number; paymentId?: string },
): Promise<CreditWalletResult> {
  const amount = Math.round(Number(params.amountFcfa) || 0);
  if (!params.userId || amount <= 0) return { ok: false, error: "INVALID" };

  try {
    // Idempotence : si une transaction TOPUP existe déjà pour ce paiement, skip.
    if (params.paymentId) {
      const { data: existing } = await admin
        .from("wallet_transactions")
        .select("id")
        .eq("reference_id", params.paymentId)
        .eq("type", "TOPUP")
        .maybeSingle();
      if (existing) return { ok: true };
    }

    const { error } = await admin.from("wallet_transactions").insert({
      user_id: params.userId,
      type: "TOPUP",
      amount_fcfa: amount,
      description: `Recharge KAZA Wallet — ${amount.toLocaleString("fr-FR")} FCFA`,
      reference_id: params.paymentId ?? null,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "EXCEPTION" };
  }
}
