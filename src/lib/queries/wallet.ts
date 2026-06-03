// =============================================================================
// KAZA — Queries Wallet & retraits (server-only)
// Lecture du wallet utilisateur, transactions et demandes de retrait.
// =============================================================================

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

export interface WalletState {
  balance: number;
  totalIn: number;
  totalOut: number;
  isFrozen: boolean;
  iban: string | null;
  bankName: string | null;
  mobileMoneyNumber: string | null;
  mobileMoneyProvider: string | null;
}

export interface WalletTx {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  createdAt: string;
}

export interface WithdrawalRequest {
  id: string;
  amount: number;
  method: string;
  destination: string;
  status: string;
  fee: number;
  netAmount: number;
  requestedAt: string;
  processedAt: string | null;
  reference: string | null;
  notes: string | null;
}

export interface AdminWithdrawalRequest extends WithdrawalRequest {
  userId: string;
  userName: string;
  userEmail: string;
}

// Lignes brutes des tables/jointures (colonnes hors types générés).
interface WalletTxRow {
  id: string;
  type: string;
  amount_fcfa: number | string;
  description: string | null;
  created_at: string;
}
interface WithdrawalRow {
  id: string;
  amount_fcfa: number | string;
  method: string;
  destination: string;
  status: string;
  fee_fcfa: number | string | null;
  net_amount_fcfa: number | string;
  requested_at: string;
  processed_at: string | null;
  reference: string | null;
  notes: string | null;
}
const EMPTY_WALLET: WalletState = {
  balance: 0,
  totalIn: 0,
  totalOut: 0,
  isFrozen: false,
  iban: null,
  bankName: null,
  mobileMoneyNumber: null,
  mobileMoneyProvider: null,
};

/**
 * Renvoie l'état du wallet pour un utilisateur. Si la ligne n'existe pas
 * encore (jamais crédité), renvoie un wallet vide à zéro.
 */
export async function getWallet(userId: string): Promise<WalletState> {
  // Loose cast : tables wallet hors types générés Supabase.
  const supabase = (await createClient()) as unknown as SupabaseClient;
  const { data } = await supabase
    .from("user_wallets")
    .select(
      "balance_fcfa, total_in_fcfa, total_out_fcfa, is_frozen, iban, bank_name, mobile_money_number, mobile_money_provider",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return EMPTY_WALLET;

  return {
    balance: Number(data.balance_fcfa ?? 0),
    totalIn: Number(data.total_in_fcfa ?? 0),
    totalOut: Number(data.total_out_fcfa ?? 0),
    isFrozen: Boolean(data.is_frozen),
    iban: data.iban ?? null,
    bankName: data.bank_name ?? null,
    mobileMoneyNumber: data.mobile_money_number ?? null,
    mobileMoneyProvider: data.mobile_money_provider ?? null,
  };
}

/**
 * Liste les N dernières transactions du wallet d'un utilisateur.
 */
export async function listWalletTransactions(
  userId: string,
  limit = 30,
): Promise<WalletTx[]> {
  const supabase = (await createClient()) as unknown as SupabaseClient;
  const { data } = await supabase
    .from("wallet_transactions")
    .select("id, type, amount_fcfa, description, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as WalletTxRow[]).map((t) => ({
    id: t.id as string,
    type: t.type as string,
    amount: Number(t.amount_fcfa),
    description: (t.description as string | null) ?? null,
    createdAt: t.created_at as string,
  }));
}

/**
 * Liste les demandes de retrait d'un utilisateur, plus récentes en premier.
 */
export async function listWithdrawalRequests(
  userId: string,
): Promise<WithdrawalRequest[]> {
  const supabase = (await createClient()) as unknown as SupabaseClient;
  const { data } = await supabase
    .from("withdrawal_requests")
    .select(
      "id, amount_fcfa, method, destination, status, fee_fcfa, net_amount_fcfa, requested_at, processed_at, reference, notes",
    )
    .eq("user_id", userId)
    .order("requested_at", { ascending: false });

  return ((data ?? []) as WithdrawalRow[]).map((w) => ({
    id: w.id as string,
    amount: Number(w.amount_fcfa),
    method: w.method as string,
    destination: w.destination as string,
    status: w.status as string,
    fee: Number(w.fee_fcfa ?? 0),
    netAmount: Number(w.net_amount_fcfa),
    requestedAt: w.requested_at as string,
    processedAt: (w.processed_at as string | null) ?? null,
    reference: (w.reference as string | null) ?? null,
    notes: (w.notes as string | null) ?? null,
  }));
}

/**
 * (Admin) Liste TOUTES les demandes de retrait, avec infos utilisateur.
 */
export async function listAllWithdrawalRequests(): Promise<
  AdminWithdrawalRequest[]
> {
  const supabase = (await createClient()) as unknown as SupabaseClient;
  const { data } = await supabase
    .from("withdrawal_requests")
    .select(
      "id, user_id, amount_fcfa, method, destination, status, fee_fcfa, net_amount_fcfa, requested_at, processed_at, reference, notes, user:users!user_id(first_name, last_name, email)",
    )
    .order("requested_at", { ascending: false });

  interface WithdrawalRow {
    id: string;
    user_id: string;
    amount_fcfa: number | string;
    method: string;
    destination: string;
    status: string;
    fee_fcfa: number | string | null;
    net_amount_fcfa: number | string;
    requested_at: string;
    processed_at: string | null;
    reference: string | null;
    notes: string | null;
    user?: { first_name?: string; last_name?: string; email?: string } | null;
  }

  return ((data ?? []) as WithdrawalRow[]).map((w) => {
    const user = w.user ?? {};
    const fullName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
    return {
      id: w.id as string,
      userId: w.user_id as string,
      amount: Number(w.amount_fcfa),
      method: w.method as string,
      destination: w.destination as string,
      status: w.status as string,
      fee: Number(w.fee_fcfa ?? 0),
      netAmount: Number(w.net_amount_fcfa),
      requestedAt: w.requested_at as string,
      processedAt: (w.processed_at as string | null) ?? null,
      reference: (w.reference as string | null) ?? null,
      notes: (w.notes as string | null) ?? null,
      userName: fullName || "Utilisateur",
      userEmail: user.email ?? "",
    };
  });
}
