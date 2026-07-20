import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";

// =============================================================================
// Kaabo — Débit / crédit du solde Kaabo (wallet) pour payer un service.
// Le débit passe par la fonction Postgres `wallet_debit` (verrou FOR UPDATE +
// garde-fou anti-solde-négatif) → atomique, jamais de double-débit.
// =============================================================================

export type WalletDebitType =
  | "RENT_DEBIT"
  | "EXPENSE_DEBIT"
  | "SUBSCRIPTION_DEBIT"
  | "BOOST_DEBIT"
  // Blocage des fonds lors d'une demande de retrait (payout).
  | "PAYOUT_REQUESTED"
  // Acompte de réservation pour l'achat d'un bien (vente).
  | "BOOKING_DEPOSIT";

export interface WalletDebitInput {
  userId: string;
  amountFcfa: number;
  type: WalletDebitType;
  description: string;
  referenceId?: string | null;
  metadata?: Record<string, unknown>;
}

export type WalletDebitResult =
  | { ok: true; txId: string }
  | { ok: false; error: string };

/** Débite le solde Kaabo de façon atomique. Échoue proprement si insuffisant. */
export async function walletDebit(
  input: WalletDebitInput,
): Promise<WalletDebitResult> {
  const admin = createAdminClient() as unknown as SupabaseClient;
  const { data, error } = await admin.rpc("wallet_debit", {
    p_user: input.userId,
    p_amount: Math.round(input.amountFcfa),
    p_type: input.type,
    p_description: input.description,
    p_reference: input.referenceId ?? null,
    p_metadata: input.metadata ?? {},
  });

  if (error) {
    const m = (error.message || "").toUpperCase();
    if (m.includes("INSUFFICIENT_BALANCE")) {
      return { ok: false, error: "Solde Kaabo insuffisant pour ce paiement." };
    }
    if (m.includes("WALLET_FROZEN")) {
      return { ok: false, error: "Votre solde Kaabo est temporairement gelé." };
    }
    if (m.includes("INVALID_AMOUNT")) {
      return { ok: false, error: "Montant invalide." };
    }
    console.error("[wallet] debit failed:", error.message);
    return { ok: false, error: "Échec du débit du solde Kaabo." };
  }

  return { ok: true, txId: data as string };
}

/**
 * Re-crédite le solde (remboursement) — utilisé si une étape post-débit échoue,
 * pour ne jamais laisser un utilisateur débité sans contrepartie.
 */
export async function walletRefund(
  userId: string,
  amountFcfa: number,
  description: string,
  referenceId?: string | null,
): Promise<void> {
  const admin = createAdminClient() as unknown as SupabaseClient;
  const { error } = await admin.from("wallet_transactions").insert({
    user_id: userId,
    type: "REFUND_GIVEN",
    amount_fcfa: Math.round(amountFcfa),
    description,
    reference_id: referenceId ?? null,
  });
  if (error) console.error("[wallet] refund failed:", error.message);
}

export interface WalletBalance {
  balance: number;
  frozen: boolean;
}

/** Solde Kaabo courant + indicateur de gel. */
export async function getWalletBalanceFor(
  userId: string,
): Promise<WalletBalance> {
  const admin = createAdminClient() as unknown as SupabaseClient;
  const { data } = await admin
    .from("user_wallets")
    .select("balance_fcfa, is_frozen")
    .eq("user_id", userId)
    .maybeSingle();
  const row = data as { balance_fcfa?: number; is_frozen?: boolean } | null;
  return {
    balance: Number(row?.balance_fcfa ?? 0),
    frozen: row?.is_frozen === true,
  };
}
