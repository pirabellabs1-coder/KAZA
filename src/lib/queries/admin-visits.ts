import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";

// =============================================================================
// Kaabo — Admin : toutes les demandes de visite (supervision / sécurité)
// Lecture service-role (page réservée aux ADMIN par le middleware + layout).
// =============================================================================

export type AdminVisitStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";

export interface AdminVisitRow {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  visitorName: string;
  visitorEmail: string | null;
  ownerName: string;
  date: string;
  time: string;
  status: AdminVisitStatus;
  createdAt: string;
}

export interface AdminVisitsData {
  visits: AdminVisitRow[];
  total: number;
  pending: number;
  confirmed: number;
}

function fullName(first?: string | null, last?: string | null): string {
  const v = `${first ?? ""} ${last ?? ""}`.trim();
  return v.length > 0 ? v : "—";
}

export async function listAllVisitRequests(
  limit = 200,
): Promise<AdminVisitsData> {
  const empty: AdminVisitsData = {
    visits: [],
    total: 0,
    pending: 0,
    confirmed: 0,
  };
  try {
    const admin = createAdminClient() as unknown as SupabaseClient;

    const { data: visitsData } = await admin
      .from("visit_requests")
      .select(
        "id, property_id, tenant_id, requested_date, requested_time, status, created_at",
      )
      .order("requested_date", { ascending: false })
      .limit(limit);
    const rows = (visitsData ?? []) as Array<{
      id: string;
      property_id: string;
      tenant_id: string;
      requested_date: string;
      requested_time: string | null;
      status: AdminVisitStatus;
      created_at: string;
    }>;
    if (rows.length === 0) return empty;

    const propIds = [...new Set(rows.map((r) => r.property_id))];
    const { data: props } = await admin
      .from("properties")
      .select("id, title, address, owner_id")
      .in("id", propIds);
    const propMap = new Map(
      ((props ?? []) as Array<{
        id: string;
        title: string;
        address: string | null;
        owner_id: string;
      }>).map((p) => [p.id, p]),
    );

    const userIds = [
      ...new Set([
        ...rows.map((r) => r.tenant_id),
        ...Array.from(propMap.values()).map((p) => p.owner_id),
      ]),
    ];
    const { data: users } = await admin
      .from("users")
      .select("id, first_name, last_name, email")
      .in("id", userIds);
    const userMap = new Map(
      ((users ?? []) as Array<{
        id: string;
        first_name: string | null;
        last_name: string | null;
        email: string | null;
      }>).map((u) => [u.id, u]),
    );

    const visits: AdminVisitRow[] = rows.map((r) => {
      const prop = propMap.get(r.property_id);
      const visitor = userMap.get(r.tenant_id);
      const owner = prop ? userMap.get(prop.owner_id) : undefined;
      return {
        id: r.id,
        propertyId: r.property_id,
        propertyTitle: prop?.title ?? "Bien",
        propertyAddress: prop?.address ?? "",
        visitorName: fullName(visitor?.first_name, visitor?.last_name),
        visitorEmail: visitor?.email ?? null,
        ownerName: fullName(owner?.first_name, owner?.last_name),
        date: r.requested_date,
        time: (r.requested_time ?? "10:00").slice(0, 5),
        status: r.status,
        createdAt: r.created_at,
      };
    });

    return {
      visits,
      total: visits.length,
      pending: visits.filter((v) => v.status === "PENDING").length,
      confirmed: visits.filter((v) => v.status === "CONFIRMED").length,
    };
  } catch (err) {
    console.error("[admin-visits] listAllVisitRequests:", err);
    return empty;
  }
}
