import "server-only";

// =============================================================================
// KAZA - Queries KAZA Points (server-side)
//
// Tables ciblees :
//   - public.kaza_points_balance      (user_id PK, balance int)
//   - public.kaza_points_transactions (id, user_id, type, amount,
//                                      description, metadata, created_at)
//
// Les types Database ne sont pas (encore) generes pour ces tables : on
// passe par `as never` sur `.from()` et on type le retour manuellement.
// =============================================================================

import { createClient } from "@/lib/supabase/server";

export type PointsTransactionType =
  | "SIGNUP_BONUS"
  | "REFERRAL"
  | "PROPERTY_LISTED"
  | "CONTRACT_SIGNED"
  | "REVIEW_GIVEN"
  | "PROFILE_COMPLETED"
  | "KYC_APPROVED"
  | "REDEEMED"
  | "ADMIN_ADJUSTMENT";

export interface PointsBalance {
  balance: number;
}

export interface PointsTransaction {
  id: string;
  type: PointsTransactionType | string;
  amount: number;
  description: string | null;
  createdAt: string;
}

/**
 * Retourne le solde de KAZA Points du user. 0 si pas de ligne (le
 * trigger d'init cree la ligne au signup, mais on est defensif).
 */
export async function getPointsBalance(userId: string): Promise<number> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from as any)("kaza_points_balance")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();
  const balance = (data as { balance?: number } | null)?.balance;
  return typeof balance === "number" ? balance : 0;
}

/**
 * Historique des transactions de points, du plus recent au plus ancien.
 */
export async function listPointsTransactions(
  userId: string,
  limit = 30,
): Promise<PointsTransaction[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from as any)("kaza_points_transactions")
    .select("id, type, amount, description, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  const rows = (data ?? []) as Array<{
    id: string;
    type: string;
    amount: number;
    description: string | null;
    created_at: string;
  }>;

  return rows.map((t) => ({
    id: t.id,
    type: t.type,
    amount: t.amount,
    description: t.description,
    createdAt: t.created_at,
  }));
}
