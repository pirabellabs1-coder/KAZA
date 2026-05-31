import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";

// =============================================================================
// KAZA — Contrat de bail à afficher, construit à partir du `rental` (le lien
// "Contrat" des locations passe un rental_id). Autorisation : locataire OU
// propriétaire du bail uniquement.
// =============================================================================

export interface ContractView {
  id: string;
  status: string;
  propertyTitle: string;
  propertyAddress: string;
  ownerName: string;
  tenantName: string;
  monthlyRent: number;
  deposit: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  signedAt?: string;
}

export async function getContractForRental(
  rentalId: string,
  userId: string,
): Promise<ContractView | null> {
  if (!rentalId || !userId) return null;
  const admin = createAdminClient() as unknown as SupabaseClient;

  const { data } = await admin
    .from("rentals")
    .select(
      "id, monthly_rent, security_deposit, start_date, end_date, status, created_at, tenant_id, " +
        "property:properties!property_id(title, address, owner_id, owner:users!owner_id(first_name, last_name)), " +
        "tenant:users!tenant_id(first_name, last_name)",
    )
    .eq("id", rentalId)
    .maybeSingle();

  if (!data) return null;
  const r = data as unknown as {
    id: string;
    monthly_rent: number | string | null;
    security_deposit: number | string | null;
    start_date: string;
    end_date: string;
    status: string | null;
    created_at: string;
    tenant_id: string;
    property?: {
      title?: string | null;
      address?: string | null;
      owner_id?: string | null;
      owner?: { first_name?: string | null; last_name?: string | null } | null;
    } | null;
    tenant?: { first_name?: string | null; last_name?: string | null } | null;
  };

  const ownerId = r.property?.owner_id ?? null;
  // Autorisation : uniquement le locataire ou le propriétaire du bail.
  if (r.tenant_id !== userId && ownerId !== userId) return null;

  const ownerName =
    `${r.property?.owner?.first_name ?? ""} ${r.property?.owner?.last_name ?? ""}`.trim() ||
    "Propriétaire";
  const tenantName =
    `${r.tenant?.first_name ?? ""} ${r.tenant?.last_name ?? ""}`.trim() ||
    "Locataire";

  const active = r.status === "ACTIVE" || r.status === "SIGNED";
  const status = active ? "SIGNED" : "DRAFT";

  return {
    id: r.id,
    status,
    propertyTitle: r.property?.title ?? "Bien loué",
    propertyAddress: r.property?.address ?? "",
    ownerName,
    tenantName,
    monthlyRent: Number(r.monthly_rent ?? 0),
    deposit: Number(r.security_deposit ?? 0),
    startDate: r.start_date,
    endDate: r.end_date,
    createdAt: r.created_at,
    signedAt: active ? r.created_at : undefined,
  };
}
