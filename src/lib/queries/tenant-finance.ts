import "server-only";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from "@/lib/supabase/server";

// =============================================================================
// Kaabo — Finances locataire (données réelles)
// Source : payments (user_id = payeur), rentals (tenant_id), user_wallets.
// =============================================================================

export interface TenantPayment {
  id: string;
  amount: number;
  method: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  paymentDate: string | null;
  createdAt: string;
  propertyTitle: string | null;
}

export interface TenantFinanceSummary {
  /** Loyer mensuel du bail actif (0 si aucun). */
  currentRent: number;
  /** Total des paiements COMPLETED (tout l'historique). */
  totalPaid: number;
  /** Total payé sur les 12 derniers mois. */
  totalPaid12m: number;
  /** Solde wallet réel. */
  walletBalance: number;
  /** Nombre de baux actifs. */
  activeRentals: number;
  /** Historique paiements complété, plus récent d'abord. */
  payments: TenantPayment[];
  /** Agrégat par mois (12 derniers mois) : { month: "2026-05", paid }. */
  monthlyHistory: Array<{ month: string; paid: number }>;
}

export async function getTenantFinanceSummary(
  userId: string,
): Promise<TenantFinanceSummary> {
  const empty: TenantFinanceSummary = {
    currentRent: 0,
    totalPaid: 0,
    totalPaid12m: 0,
    walletBalance: 0,
    activeRentals: 0,
    payments: [],
    monthlyHistory: [],
  };
  if (!userId) return empty;

  const supabase = (await createClient()) as any;

  const [paymentsRes, rentalsRes, walletRes] = await Promise.all([
    supabase
      .from("payments")
      .select(
        "id, amount, payment_method, status, payment_date, created_at, rental:rentals(property:properties(title))",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("rentals")
      .select("id, monthly_rent, status")
      .eq("tenant_id", userId),
    supabase
      .from("user_wallets")
      .select("balance_fcfa")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const rentals = (rentalsRes.data ?? []) as Array<{
    monthly_rent: number | string;
    status: string;
  }>;
  const activeRentals = rentals.filter((r) => r.status === "ACTIVE");
  const currentRent =
    activeRentals.length > 0 ? Number(activeRentals[0].monthly_rent ?? 0) : 0;

  const payments: TenantPayment[] = (paymentsRes.data ?? []).map((p: any) => {
    const rental = Array.isArray(p.rental) ? p.rental[0] : p.rental;
    const property = rental
      ? Array.isArray(rental.property)
        ? rental.property[0]
        : rental.property
      : null;
    return {
      id: p.id,
      amount: Number(p.amount ?? 0),
      method: p.payment_method ?? "—",
      status: p.status,
      paymentDate: p.payment_date ?? null,
      createdAt: p.created_at,
      propertyTitle: property?.title ?? null,
    };
  });

  const completed = payments.filter((p) => p.status === "COMPLETED");
  const totalPaid = completed.reduce((s, p) => s + p.amount, 0);

  const since12m = Date.now() - 365 * 24 * 60 * 60 * 1000;
  const totalPaid12m = completed
    .filter((p) => new Date(p.createdAt).getTime() >= since12m)
    .reduce((s, p) => s + p.amount, 0);

  // Agrégat par mois (YYYY-MM)
  const byMonth = new Map<string, number>();
  for (const p of completed) {
    const d = new Date(p.paymentDate ?? p.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    byMonth.set(key, (byMonth.get(key) ?? 0) + p.amount);
  }
  const monthlyHistory = Array.from(byMonth.entries())
    .map(([month, paid]) => ({ month, paid }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12);

  return {
    currentRent,
    totalPaid,
    totalPaid12m,
    walletBalance: Number(walletRes.data?.balance_fcfa ?? 0),
    activeRentals: activeRentals.length,
    payments,
    monthlyHistory,
  };
}
