import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { ensureContractForRental } from "@/lib/rentals/lifecycle";

// =============================================================================
// Kaabo — Contrat de bail à afficher/signer. Pilote le VRAI cycle d'état de la
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

export interface ContractParty {
  name: string;
  idNumber: string | null;
  profession: string | null;
  employer: string | null;
  address: string | null;
  phone: string | null;
}

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
  owner: ContractParty;
  tenant: ContractParty;
  /** Pratique (= owner.name / tenant.name). */
  ownerName: string;
  tenantName: string;
  propertyTitle: string;
  propertyAddress: string;
  propertyType: string | null;
  propertySurface: number | null;
  propertyBedrooms: number | null;
  monthlyRent: number;
  monthlyCharges: number;
  deposit: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

function fullName(first?: string | null, last?: string | null, fallback = "—") {
  const v = `${first ?? ""} ${last ?? ""}`.trim();
  return v.length > 0 ? v : fallback;
}

export async function getContractForRental(
  idOrRentalId: string,
  userId: string,
): Promise<ContractView | null> {
  if (!idOrRentalId || !userId) return null;
  const admin = createAdminClient() as unknown as SupabaseClient;

  const partyFields =
    "first_name, last_name, id_number, profession, employer, address, phone";
  const rentalSelect =
    "id, monthly_rent, monthly_charges, security_deposit, start_date, end_date, status, created_at, tenant_id, " +
    `property:properties!property_id(title, address, property_type, square_meters, bedrooms, owner_id, owner:users!owner_id(${partyFields})), ` +
    `tenant:users!tenant_id(${partyFields})`;

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

  type PartyRow = {
    first_name?: string | null;
    last_name?: string | null;
    id_number?: string | null;
    profession?: string | null;
    employer?: string | null;
    address?: string | null;
    phone?: string | null;
  } | null;

  const r = data as unknown as {
    id: string;
    monthly_rent: number | string | null;
    monthly_charges: number | string | null;
    security_deposit: number | string | null;
    start_date: string;
    end_date: string;
    status: string | null;
    created_at: string;
    tenant_id: string;
    property?: {
      title?: string | null;
      address?: string | null;
      property_type?: string | null;
      square_meters?: number | null;
      bedrooms?: number | null;
      owner_id?: string | null;
      owner?: PartyRow;
    } | null;
    tenant?: PartyRow;
  };

  const ownerId = r.property?.owner_id ?? null;
  if (r.tenant_id !== userId && ownerId !== userId) return null;

  // Le VRAI contrat de ce bail (créé en DRAFT à l'acceptation). Fallback création.
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

  const o = r.property?.owner ?? null;
  const t = r.tenant ?? null;
  const owner: ContractParty = {
    name: fullName(o?.first_name, o?.last_name, "Propriétaire"),
    idNumber: o?.id_number ?? null,
    profession: o?.profession ?? null,
    employer: o?.employer ?? null,
    address: o?.address ?? null,
    phone: o?.phone ?? null,
  };
  const tenant: ContractParty = {
    name: fullName(t?.first_name, t?.last_name, "Locataire"),
    idNumber: t?.id_number ?? null,
    profession: t?.profession ?? null,
    employer: t?.employer ?? null,
    address: t?.address ?? null,
    phone: t?.phone ?? null,
  };

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
    owner,
    tenant,
    ownerName: owner.name,
    tenantName: tenant.name,
    propertyTitle: r.property?.title ?? "Bien loué",
    propertyAddress: r.property?.address ?? "",
    propertyType: r.property?.property_type ?? null,
    propertySurface: r.property?.square_meters ?? null,
    propertyBedrooms: r.property?.bedrooms ?? null,
    monthlyRent: Number(r.monthly_rent ?? 0),
    monthlyCharges: Number(r.monthly_charges ?? 0),
    deposit: Number(r.security_deposit ?? 0),
    startDate: r.start_date,
    endDate: r.end_date,
    createdAt: r.created_at,
  };
}
