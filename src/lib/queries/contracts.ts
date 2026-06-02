import "server-only";

// =============================================================================
// KAZA — Requête « Mes contrats » (/contracts) branchée sur la table réelle
// `contracts` → `rentals` → `properties` + noms (users). Scopée à l'utilisateur :
// il voit les contrats où il est LOCATAIRE (rental.tenant_id) ou PROPRIÉTAIRE
// du bien (property.owner_id). Lecture via service role, filtrage strict en code.
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";

export interface UserContract {
  id: string;
  status: "DRAFT" | "PENDING_TENANT" | "PENDING_OWNER" | "SIGNED" | "CANCELLED";
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
  pdfUrl?: string;
}

function fullName(first?: string | null, last?: string | null): string {
  const v = `${first ?? ""} ${last ?? ""}`.trim();
  return v.length > 0 ? v : "—";
}

export async function listUserContracts(
  userId: string,
): Promise<UserContract[]> {
  if (!userId) return [];
  try {
    const admin = createAdminClient() as unknown as SupabaseClient;

    // 1. Biens possédés par l'utilisateur (propriétaire/agence)
    const { data: ownedProps } = await admin
      .from("properties")
      .select("id, title, address, owner_id")
      .eq("owner_id", userId);
    const ownedPropIds = (
      (ownedProps ?? []) as Array<{ id: string }>
    ).map((p) => p.id);

    // 2. Baux où l'utilisateur est locataire + baux sur ses biens
    const rentalSel =
      "id, property_id, tenant_id, monthly_rent, security_deposit, start_date, end_date";
    const [{ data: asTenant }, { data: asOwner }] = await Promise.all([
      admin.from("rentals").select(rentalSel).eq("tenant_id", userId),
      ownedPropIds.length > 0
        ? admin.from("rentals").select(rentalSel).in("property_id", ownedPropIds)
        : Promise.resolve({ data: [] as unknown[] }),
    ]);

    type RentalRow = {
      id: string;
      property_id: string;
      tenant_id: string;
      monthly_rent: number;
      security_deposit: number | null;
      start_date: string;
      end_date: string | null;
    };
    const rentalsMap = new Map<string, RentalRow>();
    for (const r of [
      ...((asTenant ?? []) as RentalRow[]),
      ...((asOwner ?? []) as RentalRow[]),
    ]) {
      rentalsMap.set(r.id, r);
    }
    if (rentalsMap.size === 0) return [];

    const rentals = [...rentalsMap.values()];
    const rentalIds = rentals.map((r) => r.id);
    const propIds = [...new Set(rentals.map((r) => r.property_id))];
    const tenantIds = [...new Set(rentals.map((r) => r.tenant_id))];

    // 3. Propriétés + utilisateurs (noms) en lots
    const [{ data: props }, { data: contracts }] = await Promise.all([
      admin
        .from("properties")
        .select("id, title, address, owner_id")
        .in("id", propIds),
      admin
        .from("contracts")
        .select(
          "id, rental_id, status, pdf_url, contract_pdf_url, created_at, signed_at",
        )
        .in("rental_id", rentalIds)
        .order("created_at", { ascending: false }),
    ]);

    const propRows = (props ?? []) as Array<{
      id: string;
      title: string;
      address: string | null;
      owner_id: string;
    }>;
    const propMap = new Map(propRows.map((p) => [p.id, p]));
    const ownerIds = [...new Set(propRows.map((p) => p.owner_id))];

    const { data: users } = await admin
      .from("users")
      .select("id, first_name, last_name")
      .in("id", [...new Set([...ownerIds, ...tenantIds])]);
    const nameMap = new Map(
      ((users ?? []) as Array<{
        id: string;
        first_name: string | null;
        last_name: string | null;
      }>).map((u) => [u.id, fullName(u.first_name, u.last_name)]),
    );

    const contractRows = (contracts ?? []) as Array<{
      id: string;
      rental_id: string;
      status: UserContract["status"];
      pdf_url: string | null;
      contract_pdf_url: string | null;
      created_at: string;
      signed_at: string | null;
    }>;

    return contractRows
      .map((c): UserContract | null => {
        const rental = rentalsMap.get(c.rental_id);
        if (!rental) return null;
        const prop = propMap.get(rental.property_id);
        return {
          id: c.id,
          status: c.status,
          propertyTitle: prop?.title ?? "Bien",
          propertyAddress: prop?.address ?? "",
          ownerName: prop ? nameMap.get(prop.owner_id) ?? "—" : "—",
          tenantName: nameMap.get(rental.tenant_id) ?? "—",
          monthlyRent: Number(rental.monthly_rent),
          deposit:
            rental.security_deposit != null
              ? Number(rental.security_deposit)
              : 0,
          startDate: rental.start_date,
          endDate: rental.end_date ?? "",
          createdAt: c.created_at,
          signedAt: c.signed_at ?? undefined,
          pdfUrl: c.pdf_url ?? c.contract_pdf_url ?? undefined,
        };
      })
      .filter((x): x is UserContract => x !== null);
  } catch {
    return [];
  }
}

/**
 * Renvoie un contrat précis de l'utilisateur (locataire ou propriétaire du
 * bien) par son id, ou null s'il n'existe pas / n'est pas accessible.
 * Réutilise le scope sécurisé de listUserContracts.
 */
export async function getUserContractById(
  userId: string,
  contractId: string,
): Promise<UserContract | null> {
  if (!userId || !contractId) return null;
  const all = await listUserContracts(userId);
  return all.find((c) => c.id === contractId) ?? null;
}
