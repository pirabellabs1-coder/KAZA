import "server-only";

// =============================================================================
// KAZA — Règlement d'une part de frais partagés après paiement Mobile Money
// (purpose = EXPENSE_SHARE). Marque la part réglée et crédite le wallet du
// colocataire qui a avancé l'argent (paid_by). Idempotent.
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";

export interface SettleShareResult {
  ok: boolean;
  error?: string;
}

export async function settleExpenseShareFromPayment(
  admin: SupabaseClient,
  params: {
    shareId: string;
    paidBy?: string | null;
    amountFcfa: number;
    paymentId?: string;
  },
): Promise<SettleShareResult> {
  const { shareId } = params;
  const amount = Math.round(Number(params.amountFcfa) || 0);
  if (!shareId) return { ok: false, error: "INVALID" };

  try {
    // Marque la part réglée UNIQUEMENT si elle ne l'est pas déjà (idempotence
    // + anti double-crédit en cas de double webhook).
    const { data: updated, error: updErr } = await admin
      .from("expense_shares")
      .update({ settled: true, settled_at: new Date().toISOString() })
      .eq("id", shareId)
      .eq("settled", false)
      .select("id");

    if (updErr) return { ok: false, error: updErr.message };
    if (!updated || updated.length === 0) {
      // Déjà réglée → ne recrédite pas.
      return { ok: true };
    }

    // Rembourse le colocataire qui a avancé l'argent.
    if (params.paidBy && amount > 0) {
      await admin.from("wallet_transactions").insert({
        user_id: params.paidBy,
        type: "ADJUSTMENT",
        amount_fcfa: amount,
        description: `Remboursement frais partagés colocation — ${amount.toLocaleString("fr-FR")} FCFA`,
        reference_id: params.paymentId ?? shareId,
      });
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "EXCEPTION" };
  }
}
