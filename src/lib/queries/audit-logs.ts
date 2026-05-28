import "server-only";

// =============================================================================
// KAZA — Audit log queries (server-side)
// Wave 9 — Yaw
//
// Lectures consommées par /admin/audit-log : flux chronologique, agrégats
// (KPIs 7j/30j, top admins). Le contrôle d'accès est assuré par la RLS de
// `audit_logs` (SELECT réservé aux ADMIN).
//
// Les types générés Supabase n'incluent pas encore `audit_logs` — on cast
// le client en `any` pour les requêtes (même limitation que `properties.ts`).
// =============================================================================

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from "@/lib/supabase/server";

export interface AuditLogEntry {
  id: string;
  adminId: string | null;
  adminName: string;
  action: string;
  targetType: string;
  targetId: string;
  targetLabel: string | null;
  reason: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface AuditLogFilters {
  adminId?: string;
  action?: string;
  targetType?: string;
  limit?: number;
}

/** Liste paginée des actions admin, plus récentes en premier. */
export async function listAuditLogs(
  filters?: AuditLogFilters,
): Promise<AuditLogEntry[]> {
  const supabase = (await createClient()) as any;

  let q = supabase
    .from("audit_logs")
    .select(
      "id, admin_id, admin_name, action, target_type, target_id, target_label, reason, ip_address, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(filters?.limit ?? 100);

  if (filters?.adminId) q = q.eq("admin_id", filters.adminId);
  if (filters?.action) q = q.eq("action", filters.action);
  if (filters?.targetType) q = q.eq("target_type", filters.targetType);

  const { data, error } = (await q) as {
    data: any[] | null;
    error: { message: string } | null;
  };

  if (error) {
    console.error("[audit] listAuditLogs:", error.message);
    return [];
  }

  return (data ?? []).map(
    (l): AuditLogEntry => ({
      id: l.id as string,
      adminId: (l.admin_id as string | null) ?? null,
      adminName: (l.admin_name as string | null) ?? "Admin",
      action: l.action as string,
      targetType: l.target_type as string,
      targetId: l.target_id as string,
      targetLabel: (l.target_label as string | null) ?? null,
      reason: (l.reason as string | null) ?? null,
      ipAddress: (l.ip_address as string | null) ?? null,
      createdAt: l.created_at as string,
    }),
  );
}

export interface AuditStats {
  actions7d: number;
  actions30d: number;
  riskActions30d: number;
  activeAdmins30d: number;
}

/** KPIs principaux du journal d'audit (7j, 30j, actions sensibles, admins actifs). */
export async function getAuditStats(): Promise<AuditStats> {
  const supabase = (await createClient()) as any;
  const now = Date.now();
  const day7 = new Date(now - 7 * 86_400_000).toISOString();
  const day30 = new Date(now - 30 * 86_400_000).toISOString();

  const RISK_ACTIONS = ["USER_BANNED", "USER_DELETED", "AGENCY_SUSPENDED"];

  // `from(...).select("*", { count: "exact", head: true })` ne ramène pas
  // de lignes — idéal pour les KPIs.
  const [r7, r30, riskCount, adminsRes] = await Promise.all([
    supabase
      .from("audit_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", day7),
    supabase
      .from("audit_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", day30),
    supabase
      .from("audit_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", day30)
      .in("action", RISK_ACTIONS),
    supabase
      .from("audit_logs")
      .select("admin_id")
      .gte("created_at", day30)
      .not("admin_id", "is", null),
  ]);

  if (r7.error) console.error("[audit] stats 7d:", r7.error.message);
  if (r30.error) console.error("[audit] stats 30d:", r30.error.message);
  if (riskCount.error)
    console.error("[audit] stats risk:", riskCount.error.message);
  if (adminsRes.error)
    console.error("[audit] stats admins:", adminsRes.error.message);

  const uniqueAdmins = new Set<string>(
    ((adminsRes.data ?? []) as Array<{ admin_id: string | null }>)
      .map((r) => r.admin_id)
      .filter((id): id is string => !!id),
  );

  return {
    actions7d: (r7.count as number | null) ?? 0,
    actions30d: (r30.count as number | null) ?? 0,
    riskActions30d: (riskCount.count as number | null) ?? 0,
    activeAdmins30d: uniqueAdmins.size,
  };
}

export interface AdminActivitySummary {
  adminId: string;
  adminName: string;
  count30d: number;
  lastActionAt: string | null;
}

/** Top admins par nombre d'actions sur 30 jours (agrégation côté Node). */
export async function getTopAdminsByActivity(
  limit = 3,
): Promise<AdminActivitySummary[]> {
  const supabase = (await createClient()) as any;
  const day30 = new Date(Date.now() - 30 * 86_400_000).toISOString();

  const { data, error } = (await supabase
    .from("audit_logs")
    .select("admin_id, admin_name, created_at")
    .gte("created_at", day30)
    .order("created_at", { ascending: false })) as {
    data:
      | Array<{
          admin_id: string | null;
          admin_name: string | null;
          created_at: string;
        }>
      | null;
    error: { message: string } | null;
  };

  if (error) {
    console.error("[audit] getTopAdminsByActivity:", error.message);
    return [];
  }

  const byAdmin = new Map<string, AdminActivitySummary>();
  for (const row of data ?? []) {
    if (!row.admin_id) continue;
    const cur = byAdmin.get(row.admin_id);
    if (cur) {
      cur.count30d += 1;
      // Tri desc côté SQL : le premier vu pour cet admin est sa dernière action.
    } else {
      byAdmin.set(row.admin_id, {
        adminId: row.admin_id,
        adminName: row.admin_name ?? "Admin",
        count30d: 1,
        lastActionAt: row.created_at,
      });
    }
  }

  return Array.from(byAdmin.values())
    .sort((a, b) => b.count30d - a.count30d)
    .slice(0, limit);
}
