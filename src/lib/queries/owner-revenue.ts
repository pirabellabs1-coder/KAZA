import "server-only";

// =============================================================================
// KAZA — Agrégation mensuelle des revenus & occupation du propriétaire
// (12 mois glissants), branchée sur payments + rentals + properties réels.
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";

export interface MonthlyRevenuePoint {
  month: string;
  revenue: number;
  occupancy: number;
}

export async function getOwnerMonthlyRevenue(
  ownerId: string,
): Promise<MonthlyRevenuePoint[]> {
  if (!ownerId) return [];
  try {
    const admin = createAdminClient() as unknown as SupabaseClient;

    // Biens du propriétaire
    const { data: props } = await admin
      .from("properties")
      .select("id")
      .eq("owner_id", ownerId);
    const propIds = ((props ?? []) as Array<{ id: string }>).map((p) => p.id);
    const totalProps = propIds.length;
    if (totalProps === 0) return [];

    // Baux sur ces biens (pour l'occupation)
    const { data: rentals } = await admin
      .from("rentals")
      .select("id, start_date, end_date")
      .in("property_id", propIds);
    const rentalRows = (rentals ?? []) as Array<{
      id: string;
      start_date: string | null;
      end_date: string | null;
    }>;
    const rentalIds = rentalRows.map((r) => r.id);

    // Paiements complétés sur ces baux
    const paymentRows: Array<{ amount: number; date: string }> = [];
    if (rentalIds.length > 0) {
      const { data: pays } = await admin
        .from("payments")
        .select("amount, payment_date, created_at, status, rental_id")
        .in("rental_id", rentalIds)
        .eq("status", "COMPLETED");
      for (const p of (pays ?? []) as Array<{
        amount: number;
        payment_date: string | null;
        created_at: string;
      }>) {
        paymentRows.push({
          amount: Number(p.amount),
          date: p.payment_date ?? p.created_at,
        });
      }
    }

    // 12 mois glissants (du plus ancien au plus récent)
    const now = new Date();
    const points: MonthlyRevenuePoint[] = [];
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const revenue = paymentRows
        .filter((p) => {
          const d = new Date(p.date);
          return d >= start && d < end;
        })
        .reduce((s, p) => s + p.amount, 0);

      const activeRentals = rentalRows.filter((r) => {
        if (!r.start_date) return false;
        const rs = new Date(r.start_date);
        const re = r.end_date ? new Date(r.end_date) : null;
        return rs < end && (!re || re >= start);
      }).length;
      const occupancy = Math.round((activeRentals / totalProps) * 100);

      points.push({
        month: start.toLocaleDateString("fr-FR", { month: "short" }),
        revenue,
        occupancy: Math.min(occupancy, 100),
      });
    }

    return points;
  } catch {
    return [];
  }
}
