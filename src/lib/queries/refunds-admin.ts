import "server-only";

// =============================================================================
// Kaabo — Queries Remboursements (back-office admin, server-side)
// Lecture de `refund_requests` pour la page /admin/refunds.
// RLS : SELECT reserve aux ADMIN (et au demandeur). La page admin etant deja
// protegee par le layout, on lit ici toutes les lignes visibles.
// Ne throw jamais : retourne [] en cas d'erreur.
//
// `refund_requests` n'est pas (encore) dans les types generes Supabase : on
// cast le client en `any` (meme limitation que `partner_applications`).
// =============================================================================

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from "@/lib/supabase/server";

export type RefundRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface RefundRequestRow {
  id: string;
  paymentId: string | null;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  reason: string;
  status: RefundRequestStatus;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  decisionNote: string | null;
}

interface RawRow {
  id: string;
  payment_id: string | null;
  user_id: string;
  amount: number | string | null;
  reason: string;
  status: RefundRequestStatus;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  decision_note: string | null;
  user:
    | { first_name: string | null; last_name: string | null; email: string | null }
    | null;
}

function mapRow(row: RawRow): RefundRequestRow {
  const fn = row.user?.first_name ?? "";
  const ln = row.user?.last_name ?? "";
  const fullName = `${fn} ${ln}`.trim() || "Utilisateur";

  return {
    id: row.id,
    paymentId: row.payment_id,
    userId: row.user_id,
    userName: fullName,
    userEmail: row.user?.email ?? "",
    amount: typeof row.amount === "string" ? Number(row.amount) : row.amount ?? 0,
    reason: row.reason,
    status: row.status,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
    resolvedBy: row.resolved_by,
    decisionNote: row.decision_note,
  };
}

/**
 * Liste les demandes de remboursement, de la plus recente a la plus ancienne.
 * Jointure sur `users` (via la FK `refund_requests.user_id`) pour le nom et
 * l'email du demandeur. Renvoie [] en cas d'erreur.
 */
export async function listRefundRequests(): Promise<RefundRequestRow[]> {
  const supabase = (await createClient()) as any;

  const { data, error } = await supabase
    .from("refund_requests")
    .select(
      "id, payment_id, user_id, amount, reason, status, created_at, resolved_at, resolved_by, decision_note, user:users!refund_requests_user_id_fkey(first_name, last_name, email)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[refunds-admin] listRefundRequests:", error.message);
    return [];
  }

  return ((data ?? []) as RawRow[]).map(mapRow);
}
