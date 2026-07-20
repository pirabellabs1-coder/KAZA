import "server-only";

// =============================================================================
// Kaabo — Reversements (payouts) pour l'admin finance, branchés sur la table
// réelle `withdrawal_requests` (+ bénéficiaire via users). Lecture service role.
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";

export interface AdminPayout {
  id: string;
  beneficiary: string;
  type: "OWNER" | "AGENCY";
  amountFcfa: number;
  status: "SCHEDULED" | "PROCESSING" | "PAID" | "FAILED";
  scheduledAt: string;
  paidAt?: string;
  method: string;
}

const STATUS_MAP: Record<string, AdminPayout["status"]> = {
  PENDING: "PROCESSING",
  PROCESSING: "PROCESSING",
  COMPLETED: "PAID",
  REJECTED: "FAILED",
  FAILED: "FAILED",
};

const METHOD_LABEL: Record<string, string> = {
  MOBILE_MONEY: "Mobile Money",
  BANK_TRANSFER: "Virement",
  CASH: "Espèces",
};

function frDate(v: string | null): string {
  return v ? new Date(v).toLocaleDateString("fr-FR") : "";
}

export async function listAdminPayouts(limit = 20): Promise<AdminPayout[]> {
  try {
    const admin = createAdminClient() as unknown as SupabaseClient;
    const { data } = await admin
      .from("withdrawal_requests")
      .select(
        "id, user_id, amount_fcfa, net_amount_fcfa, method, status, created_at, processed_at",
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    const rows = (data ?? []) as Array<{
      id: string;
      user_id: string;
      amount_fcfa: number;
      net_amount_fcfa: number | null;
      method: string | null;
      status: string;
      created_at: string;
      processed_at: string | null;
    }>;
    if (rows.length === 0) return [];

    const userIds = [...new Set(rows.map((r) => r.user_id))];
    const { data: users } = await admin
      .from("users")
      .select("id, first_name, last_name, role")
      .in("id", userIds);
    const userMap = new Map(
      ((users ?? []) as Array<{
        id: string;
        first_name: string | null;
        last_name: string | null;
        role: string;
      }>).map((u) => [
        u.id,
        {
          name: `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || "Bénéficiaire",
          role: u.role,
        },
      ]),
    );

    return rows.map((r) => {
      const u = userMap.get(r.user_id);
      const status = STATUS_MAP[r.status] ?? "PROCESSING";
      return {
        id: r.id,
        beneficiary: u?.name ?? "Bénéficiaire",
        type: u?.role === "AGENCY" ? "AGENCY" : "OWNER",
        amountFcfa: Number(r.net_amount_fcfa ?? r.amount_fcfa),
        status,
        scheduledAt: frDate(r.created_at),
        paidAt: status === "PAID" ? frDate(r.processed_at) : undefined,
        method: r.method ? METHOD_LABEL[r.method] ?? r.method : "—",
      };
    });
  } catch {
    return [];
  }
}
