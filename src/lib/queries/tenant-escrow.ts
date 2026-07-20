import "server-only";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from "@/lib/supabase/server";

// =============================================================================
// Kaabo — Fonds en séquestre du locataire (données réelles)
//
// Source : table `escrow_payments` (migration 00001_initial_schema.sql).
// Colonnes : id, rental_id, tenant_id, owner_id, total_amount, amount_paid,
//            duration_days, status (escrow_status), release_date, created_at.
//
// `escrow_status` (enum DB, MAJUSCULES) :
//   HELD | PARTIALLY_RELEASED | RELEASED | REFUNDED | DISPUTED
//
// La page attend un statut simplifié en minuscules : "held" | "released" |
// "disputed". On mappe l'enum DB vers ce sous-ensemble (PARTIALLY_RELEASED et
// REFUNDED sont rattachés au bucket le plus proche : respectivement "held"
// — fonds encore partiellement détenus — et "released").
// =============================================================================

export interface EscrowPaymentRow {
  id: string;
  amount: number;
  status: "held" | "released" | "disputed";
}

function mapStatus(dbStatus: string): EscrowPaymentRow["status"] {
  switch (dbStatus) {
    case "RELEASED":
    case "REFUNDED":
      return "released";
    case "DISPUTED":
      return "disputed";
    case "HELD":
    case "PARTIALLY_RELEASED":
    default:
      return "held";
  }
}

/**
 * Liste les paiements en séquestre liés au locataire `userId`.
 * Lecture directe sur `escrow_payments.tenant_id` (RLS : le locataire ne voit
 * que ses propres lignes). Retourne [] en cas d'absence ou d'erreur.
 */
export async function listTenantEscrowPayments(
  userId: string,
): Promise<EscrowPaymentRow[]> {
  if (!userId) return [];

  const supabase = (await createClient()) as any;

  const { data, error } = await supabase
    .from("escrow_payments")
    .select("id, total_amount, status, created_at")
    .eq("tenant_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[tenant-escrow] query failed:", error.message);
    return [];
  }

  return ((data ?? []) as Array<{
    id: string;
    total_amount: number | string;
    status: string;
  }>).map((row) => ({
    id: row.id,
    amount: Number(row.total_amount ?? 0),
    status: mapStatus(row.status),
  }));
}
