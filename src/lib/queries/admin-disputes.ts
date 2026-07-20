import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";

// =============================================================================
// Kaabo - Requête admin : liste de TOUS les litiges (table public.disputes)
// =============================================================================
// La RLS de `disputes` ne laisse voir qu'à l'agence ou au locataire concerné.
// L'admin passe donc par le client service-role (bypass RLS) pour tout voir.
// =============================================================================

export type AdminDisputeType =
  | "Paiement"
  | "Visite"
  | "Annonce"
  | "Comportement";

export type AdminDisputeStatus = "open" | "in_progress" | "resolved" | "closed";

export interface AdminDisputeRow {
  id: string;
  type: AdminDisputeType;
  plaintiff: string;
  defendant: string;
  status: AdminDisputeStatus;
  openedAt: string;
  resolvedAt: string | null;
  title: string;
  amountFcfa: number | null;
  priority: string;
  [key: string]: unknown;
}

const TYPE_MAP: Record<string, AdminDisputeType> = {
  UNPAID_RENT: "Paiement",
  DAMAGE: "Annonce",
  BREACH: "Annonce",
  COMPLAINT: "Comportement",
  NOISE: "Comportement",
  OTHER: "Comportement",
};

const STATUS_MAP: Record<string, AdminDisputeStatus> = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  RESOLVED: "resolved",
  CLOSED: "closed",
};

interface DisputeDbRow {
  id: string;
  dispute_type: string;
  status: string;
  title: string;
  amount_fcfa: number | null;
  priority: string;
  created_at: string;
  resolved_at: string | null;
  agency_id: string;
  tenant_id: string | null;
}

/**
 * Retourne les litiges de la plateforme (les plus récents d'abord), avec les
 * noms des parties résolus. Renvoie `[]` en cas d'erreur (dégradation gracieuse).
 */
export async function listAdminDisputes(
  limit = 200,
): Promise<AdminDisputeRow[]> {
  const admin = createAdminClient() as unknown as SupabaseClient;

  const { data, error } = await admin
    .from("disputes")
    .select(
      "id, dispute_type, status, title, amount_fcfa, priority, created_at, resolved_at, agency_id, tenant_id",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  const rows = data as DisputeDbRow[];

  // Résolution des noms des parties en un seul appel.
  const ids = [
    ...new Set(
      rows.flatMap((r) => [r.agency_id, r.tenant_id]).filter(Boolean) as string[],
    ),
  ];
  const names = new Map<string, string>();
  if (ids.length > 0) {
    const { data: users } = await admin
      .from("users")
      .select("id, first_name, last_name")
      .in("id", ids);
    (users ?? []).forEach(
      (u: { id: string; first_name: string | null; last_name: string | null }) =>
        names.set(
          u.id,
          `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || "—",
        ),
    );
  }

  return rows.map((r) => ({
    id: r.id,
    type: TYPE_MAP[r.dispute_type] ?? "Comportement",
    plaintiff: names.get(r.agency_id) ?? "Agence",
    defendant: r.tenant_id ? (names.get(r.tenant_id) ?? "Locataire") : "—",
    status: STATUS_MAP[r.status] ?? "open",
    openedAt: r.created_at,
    resolvedAt: r.resolved_at,
    title: r.title,
    amountFcfa: r.amount_fcfa,
    priority: r.priority,
  }));
}
