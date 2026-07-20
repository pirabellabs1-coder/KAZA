import "server-only";

// =============================================================================
// Kaabo — Requêtes Candidatures (rental_applications, migration 00039)
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

async function loose(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

function fullName(first?: string | null, last?: string | null): string {
  const v = `${first ?? ""} ${last ?? ""}`.trim();
  return v.length > 0 ? v : "Candidat";
}

export interface TenantApplication {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  price: number;
  status: string;
  message: string | null;
  moveInDate: string | null;
  createdAt: string;
}

export interface OwnerApplication {
  id: string;
  propertyId: string;
  propertyTitle: string;
  tenantId: string;
  tenantName: string;
  tenantEmail: string;
  status: string;
  message: string | null;
  moveInDate: string | null;
  monthlyIncome: number | null;
  createdAt: string;
}

interface AppRow {
  id: string;
  property_id: string;
  tenant_id: string;
  status: string;
  message: string | null;
  move_in_date: string | null;
  monthly_income_fcfa: number | null;
  created_at: string;
}

export async function listTenantApplications(
  tenantId: string,
): Promise<TenantApplication[]> {
  if (!tenantId) return [];
  try {
    const supabase = await loose();
    const { data } = await supabase
      .from("rental_applications")
      .select(
        "id, property_id, status, message, move_in_date, created_at",
      )
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    const rows = (data ?? []) as AppRow[];
    if (rows.length === 0) return [];

    const propIds = [...new Set(rows.map((r) => r.property_id))];
    const { data: props } = await supabase
      .from("properties")
      .select("id, title, address, price")
      .in("id", propIds);
    const propMap = new Map(
      ((props ?? []) as Array<{
        id: string;
        title: string;
        address: string | null;
        price: number;
      }>).map((p) => [p.id, p]),
    );

    return rows.map((r) => {
      const p = propMap.get(r.property_id);
      return {
        id: r.id,
        propertyId: r.property_id,
        propertyTitle: p?.title ?? "Bien",
        propertyAddress: p?.address ?? "",
        price: p ? Number(p.price) : 0,
        status: r.status,
        message: r.message,
        moveInDate: r.move_in_date,
        createdAt: r.created_at,
      };
    });
  } catch {
    return [];
  }
}

export async function listOwnerApplications(
  ownerId: string,
): Promise<OwnerApplication[]> {
  if (!ownerId) return [];
  try {
    const supabase = await loose();
    const { data: props } = await supabase
      .from("properties")
      .select("id, title")
      .eq("owner_id", ownerId);
    const propList = (props ?? []) as Array<{ id: string; title: string }>;
    if (propList.length === 0) return [];
    const propTitle = new Map(propList.map((p) => [p.id, p.title]));

    const { data } = await supabase
      .from("rental_applications")
      .select(
        "id, property_id, tenant_id, status, message, move_in_date, monthly_income_fcfa, created_at",
      )
      .in(
        "property_id",
        propList.map((p) => p.id),
      )
      .order("created_at", { ascending: false });
    const rows = (data ?? []) as AppRow[];
    if (rows.length === 0) return [];

    const tenantIds = [...new Set(rows.map((r) => r.tenant_id))];
    const { data: users } = await supabase
      .from("users")
      .select("id, first_name, last_name, email")
      .in("id", tenantIds);
    const userMap = new Map(
      ((users ?? []) as Array<{
        id: string;
        first_name: string | null;
        last_name: string | null;
        email: string;
      }>).map((u) => [u.id, u]),
    );

    return rows.map((r) => {
      const u = userMap.get(r.tenant_id);
      return {
        id: r.id,
        propertyId: r.property_id,
        propertyTitle: propTitle.get(r.property_id) ?? "Bien",
        tenantId: r.tenant_id,
        tenantName: fullName(u?.first_name, u?.last_name),
        tenantEmail: u?.email ?? "",
        status: r.status,
        message: r.message,
        moveInDate: r.move_in_date,
        monthlyIncome:
          r.monthly_income_fcfa != null ? Number(r.monthly_income_fcfa) : null,
        createdAt: r.created_at,
      };
    });
  } catch {
    return [];
  }
}
