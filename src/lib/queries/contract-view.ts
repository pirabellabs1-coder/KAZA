import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { ensureContractForRental } from "@/lib/rentals/lifecycle";

// =============================================================================
// KAZA — Contrat de bail à afficher/signer. Pilote le VRAI cycle d'état de la
// table `contracts` (DRAFT → PENDING_TENANT → PENDING_OWNER → SIGNED), avec les
// infos du bail (rental + property + parties) pour le rendu. L'`id` de route
// peut être un rental_id (lien des locations) OU un contract_id (lien des
// notifications) — on résout les deux. Autorisation : locataire OU bailleur.
// =============================================================================

export type RealContractStatus =
  | "DRAFT"
  | "PENDING_TENANT"
  | "PENDING_OWNER"
  | "SIGNED"
  | "CANCELLED";

export interface ContractView {
  /** id RÉEL de la table contracts (pour signContract / sendContractToTenant). */
  contractId: string;
  rentalId: string;
  status: RealContractStatus;
  signedByOwner: boolean;
  signedByTenant: boolean;
  ownerSignedAt: string | null;
  tenantSignedAt: string | null;
  ownerId: string;
  tenantId: string;
  propertyTitle: string;
  propertyAddress: string;
  ownerName: string;
  tenantName: string;
  monthlyRent: number;
  deposit: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export async function getContractForRental(
  idOrRentalId: string,
  userId: string,
): Promise<ContractView | null> {
  if (!idOrRentalId || !userId) return null;
  const admin = createAdminClient() as unknown as SupabaseClient;

  const rentalSelect =
    "id, monthly_rent, security_deposit, start_date, end_date, status, created_at, tenant_id, " +
    "property:properties!property_id(title, address, owner_id, owner:users!owner_id(first_name, last_name)), " +
    "tenant:users!tenant_id(first_name, last_name)";

  // 1) Tente comme rental_id.
  let { data } = await admin
    .from("rentals")
    .select(rentalSelect)
    .eq("id", idOrRentalId)
    .maybeSingle();

  // 2) Sinon, tente comme contract_id → résout le rental_id.
  if (!data) {
    const { data: c } = await admin
      .from("contracts")
      .select("rental_id")
      .eq("id", idOrRentalId)
      .maybeSingle();
    const rid = (c as { rental_id?: string } | null)?.rental_id;
    if (rid) {
      const res = await admin
        .from("rentals")
        .select(rentalSelect)
        .eq("id", rid)
        .maybeSingle();
      data = res.data;
    }
  }
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

  // Le VRAI contrat de ce bail (créé en DRAFT à l'acceptation). Fallback : on
  // le crée si absent (locations héritées).
  let { data: contractRow } = await admin
    .from("contracts")
    .select(
      "id, status, signed_by_owner, signed_by_tenant, owner_signed_at, tenant_signed_at",
    )
    .eq("rental_id", r.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!contractRow) {
    const newId = await ensureContractForRental(r.id);
    if (newId) {
      const res = await admin
        .from("contracts")
        .select(
          "id, status, signed_by_owner, signed_by_tenant, owner_signed_at, tenant_signed_at",
        )
        .eq("id", newId)
        .maybeSingle();
      contractRow = res.data;
    }
  }
  if (!contractRow) return null;
  const c = contractRow as {
    id: string;
    status: string;
    signed_by_owner: boolean;
    signed_by_tenant: boolean;
    owner_signed_at: string | null;
    tenant_signed_at: string | null;
  };

  const ownerName =
    `${r.property?.owner?.first_name ?? ""} ${r.property?.owner?.last_name ?? ""}`.trim() ||
    "Propriétaire";
  const tenantName =
    `${r.tenant?.first_name ?? ""} ${r.tenant?.last_name ?? ""}`.trim() ||
    "Locataire";

  return {
    contractId: c.id,
    rentalId: r.id,
    status: (c.status as RealContractStatus) ?? "DRAFT",
    signedByOwner: c.signed_by_owner === true,
    signedByTenant: c.signed_by_tenant === true,
    ownerSignedAt: c.owner_signed_at,
    tenantSignedAt: c.tenant_signed_at,
    ownerId: ownerId ?? "",
    tenantId: r.tenant_id,
    propertyTitle: r.property?.title ?? "Bien loué",
    propertyAddress: r.property?.address ?? "",
    ownerName,
    tenantName,
    monthlyRent: Number(r.monthly_rent ?? 0),
    deposit: Number(r.security_deposit ?? 0),
    startDate: r.start_date,
    endDate: r.end_date,
    createdAt: r.created_at,
  };
}
