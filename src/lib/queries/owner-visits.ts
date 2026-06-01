import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

// =============================================================================
// KAZA — Visites du propriétaire (pour le calendrier)
// Source : visit_requests des biens dont l'utilisateur est propriétaire.
// =============================================================================

export type OwnerVisitStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";

export interface OwnerCalendarVisit {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  visitorName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  message: string | null;
  status: OwnerVisitStatus;
  createdAt: string;
}

function fullName(first?: string | null, last?: string | null): string {
  const v = `${first ?? ""} ${last ?? ""}`.trim();
  return v.length > 0 ? v : "Visiteur";
}

export async function getOwnerVisitCalendar(
  userId: string,
): Promise<OwnerCalendarVisit[]> {
  if (!userId) return [];
  const supabase = (await createClient()) as unknown as SupabaseClient;

  // 1) Biens du propriétaire.
  const { data: props } = await supabase
    .from("properties")
    .select("id, title, address")
    .eq("owner_id", userId);
  const propList = (props ?? []) as Array<{
    id: string;
    title: string;
    address: string | null;
  }>;
  if (propList.length === 0) return [];
  const propMap = new Map(propList.map((p) => [p.id, p]));

  // 2) Demandes de visite sur ces biens.
  const { data: visits } = await supabase
    .from("visit_requests")
    .select(
      "id, property_id, tenant_id, requested_date, requested_time, message, status, created_at",
    )
    .in(
      "property_id",
      propList.map((p) => p.id),
    )
    .order("requested_date", { ascending: true });
  const rows = (visits ?? []) as Array<{
    id: string;
    property_id: string;
    tenant_id: string;
    requested_date: string;
    requested_time: string | null;
    message: string | null;
    status: OwnerVisitStatus;
    created_at: string;
  }>;
  if (rows.length === 0) return [];

  // 3) Noms des visiteurs.
  const tenantIds = [...new Set(rows.map((r) => r.tenant_id))];
  const { data: users } = await supabase
    .from("users")
    .select("id, first_name, last_name")
    .in("id", tenantIds);
  const nameMap = new Map(
    ((users ?? []) as Array<{
      id: string;
      first_name: string | null;
      last_name: string | null;
    }>).map((u) => [u.id, fullName(u.first_name, u.last_name)]),
  );

  return rows.map((r) => {
    const p = propMap.get(r.property_id);
    return {
      id: r.id,
      propertyId: r.property_id,
      propertyTitle: p?.title ?? "Bien",
      propertyAddress: p?.address ?? "",
      visitorName: nameMap.get(r.tenant_id) ?? "Visiteur",
      date: r.requested_date,
      time: (r.requested_time ?? "10:00").slice(0, 5),
      message: r.message,
      status: r.status,
      createdAt: r.created_at,
    };
  });
}
