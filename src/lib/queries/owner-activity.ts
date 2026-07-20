import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

// =============================================================================
// Kaabo — Queries activité par owner (visits, rentals, payments, tenants)
// Server-side uniquement. Tout retour est best-effort : en cas d'erreur Supabase
// on logge et on retourne un tableau vide (ne jamais casser la page).
//
// NB : le schema réel utilise `tenant_id` / `requested_date` / `requested_time`
// pour `visit_requests` (et non `requester_id` / `proposed_date`). On expose
// néanmoins une API « owner-friendly » avec des champs `requester*` et
// `proposedDate` côté DTO pour l'UI.
// =============================================================================

export interface OwnerVisit {
  id: string;
  propertyTitle: string;
  propertyAddress: string;
  propertyId: string;
  requesterName: string;
  requesterEmail: string;
  proposedDate: string;
  proposedTime: string | null;
  status: string;
  message: string | null;
  createdAt: string;
}

export interface OwnerRental {
  id: string;
  propertyTitle: string;
  propertyAddress: string;
  propertyId: string;
  tenantName: string;
  tenantEmail: string;
  startDate: string;
  endDate: string | null;
  monthlyRent: number;
  status: string;
}

export interface OwnerPayment {
  id: string;
  rentalId: string | null;
  propertyTitle: string;
  tenantName: string;
  amount: number;
  status: string;
  method: string | null;
  dueDate: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface OwnerTenant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  propertiesRented: number;
  totalPaidFcfa: number;
  activeSince: string;
}

// ---------------------------------------------------------------------------
// Helpers internes
// ---------------------------------------------------------------------------

// TODO: type manquant — les relations FK ne sont pas exposées dans le client
// typed Database. On utilise un client loose en attendant la regeneration.
async function getLooseClient(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

function fullName(firstName?: string | null, lastName?: string | null): string {
  const value = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  return value.length > 0 ? value : "Locataire";
}

// ---------------------------------------------------------------------------
// Nombre de demandes de visite reçues pour une propriété donnée
// ---------------------------------------------------------------------------

export async function countPropertyVisitRequests(
  propertyId: string,
): Promise<number> {
  if (!propertyId) return 0;
  try {
    const supabase = await getLooseClient();
    const { count, error } = await supabase
      .from("visit_requests")
      .select("id", { count: "exact", head: true })
      .eq("property_id", propertyId);
    if (error) {
      console.error("[owner-activity] countPropertyVisitRequests:", error.message);
      return 0;
    }
    return count ?? 0;
  } catch {
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Demandes de visite reçues par un owner
// ---------------------------------------------------------------------------

export async function listOwnerVisits(ownerId: string): Promise<OwnerVisit[]> {
  if (!ownerId) return [];
  try {
    const supabase = await getLooseClient();
    const { data, error } = await supabase
      .from("visit_requests")
      .select(
        `
        id, requested_date, requested_time, status, message, created_at,
        property:properties!inner(id, title, address, owner_id),
        requester:users!visit_requests_tenant_id_fkey(first_name, last_name, email)
      `,
      )
      .eq("property.owner_id", ownerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[owner-activity] visits:", error.message);
      return [];
    }

    return (data ?? []).map((row: Record<string, unknown>) => {
      const property = (row.property ?? null) as {
        id?: string;
        title?: string;
        address?: string | null;
      } | null;
      const requester = (row.requester ?? null) as {
        first_name?: string | null;
        last_name?: string | null;
        email?: string | null;
      } | null;

      return {
        id: String(row.id ?? ""),
        propertyTitle: property?.title ?? "—",
        propertyAddress: property?.address ?? "",
        propertyId: property?.id ?? "",
        requesterName: fullName(requester?.first_name, requester?.last_name),
        requesterEmail: requester?.email ?? "",
        proposedDate: String(row.requested_date ?? ""),
        proposedTime: (row.requested_time as string | null) ?? null,
        status: String(row.status ?? "PENDING"),
        message: (row.message as string | null) ?? null,
        createdAt: String(row.created_at ?? ""),
      };
    });
  } catch (err) {
    console.error("[owner-activity] visits (exception):", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Locations actives / passées / pending d'un owner
// ---------------------------------------------------------------------------

export async function listOwnerRentals(
  ownerId: string,
): Promise<OwnerRental[]> {
  if (!ownerId) return [];
  try {
    const supabase = await getLooseClient();
    const { data, error } = await supabase
      .from("rentals")
      .select(
        `
        id, start_date, end_date, monthly_rent, status,
        property:properties!inner(id, title, address, owner_id),
        tenant:users!rentals_tenant_id_fkey(first_name, last_name, email)
      `,
      )
      .eq("property.owner_id", ownerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[owner-activity] rentals:", error.message);
      return [];
    }

    return (data ?? []).map((row: Record<string, unknown>) => {
      const property = (row.property ?? null) as {
        id?: string;
        title?: string;
        address?: string | null;
      } | null;
      const tenant = (row.tenant ?? null) as {
        first_name?: string | null;
        last_name?: string | null;
        email?: string | null;
      } | null;

      return {
        id: String(row.id ?? ""),
        propertyTitle: property?.title ?? "—",
        propertyAddress: property?.address ?? "",
        propertyId: property?.id ?? "",
        tenantName: fullName(tenant?.first_name, tenant?.last_name),
        tenantEmail: tenant?.email ?? "",
        startDate: String(row.start_date ?? ""),
        endDate: (row.end_date as string | null) ?? null,
        monthlyRent: Number(row.monthly_rent ?? 0),
        status: String(row.status ?? "PENDING"),
      };
    });
  } catch (err) {
    console.error("[owner-activity] rentals (exception):", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Paiements liés aux biens d'un owner
// ---------------------------------------------------------------------------

export async function listOwnerPayments(
  ownerId: string,
): Promise<OwnerPayment[]> {
  if (!ownerId) return [];
  try {
    const supabase = await getLooseClient();
    const { data, error } = await supabase
      .from("payments")
      .select(
        `
        id, amount, status, payment_method, payment_date, created_at, rental_id,
        rental:rentals!inner(
          id,
          property:properties!inner(id, title, owner_id)
        ),
        tenant:users!payments_user_id_fkey(first_name, last_name)
      `,
      )
      .eq("rental.property.owner_id", ownerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[owner-activity] payments:", error.message);
      return [];
    }

    return (data ?? []).map((row: Record<string, unknown>) => {
      const rental = (row.rental ?? null) as {
        property?: { title?: string | null } | null;
      } | null;
      const tenant = (row.tenant ?? null) as {
        first_name?: string | null;
        last_name?: string | null;
      } | null;
      const paymentDate = (row.payment_date as string | null) ?? null;
      const status = String(row.status ?? "PENDING");

      return {
        id: String(row.id ?? ""),
        rentalId: (row.rental_id as string | null) ?? null,
        propertyTitle: rental?.property?.title ?? "—",
        tenantName: fullName(tenant?.first_name, tenant?.last_name),
        amount: Number(row.amount ?? 0),
        status,
        method: (row.payment_method as string | null) ?? null,
        // Sans champ `due_date` dans le schéma actuel : on retombe sur la
        // payment_date pour les paiements en attente, créé pour le reste.
        dueDate: paymentDate,
        paidAt: status === "COMPLETED" ? paymentDate : null,
        createdAt: String(row.created_at ?? ""),
      };
    });
  } catch (err) {
    console.error("[owner-activity] payments (exception):", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Locataires actifs (distinct) sur les biens d'un owner
// ---------------------------------------------------------------------------

export async function listOwnerTenants(
  ownerId: string,
): Promise<OwnerTenant[]> {
  if (!ownerId) return [];
  try {
    const supabase = await getLooseClient();

    // 1) On récupère toutes les locations ACTIVES sur les biens de l'owner.
    const { data: rentals, error: rentalsError } = await supabase
      .from("rentals")
      .select(
        `
        id, tenant_id, start_date, status,
        property:properties!inner(id, owner_id),
        tenant:users!rentals_tenant_id_fkey(id, first_name, last_name, email)
      `,
      )
      .eq("property.owner_id", ownerId)
      .eq("status", "ACTIVE");

    if (rentalsError) {
      console.error("[owner-activity] tenants/rentals:", rentalsError.message);
      return [];
    }

    type RentalRow = {
      id: string;
      tenant_id: string;
      start_date: string;
      tenant: {
        id?: string | null;
        first_name?: string | null;
        last_name?: string | null;
        email?: string | null;
      } | null;
    };

    const rentalRows = (rentals ?? []) as unknown as RentalRow[];
    if (rentalRows.length === 0) return [];

    const rentalIds = rentalRows.map((r) => r.id);

    // 2) Agrégation des montants payés (statut COMPLETED) par rental_id.
    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select("rental_id, amount, status")
      .in("rental_id", rentalIds)
      .eq("status", "COMPLETED");

    if (paymentsError) {
      console.error("[owner-activity] tenants/payments:", paymentsError.message);
    }

    const paidByRental = new Map<string, number>();
    for (const p of payments ?? []) {
      const rid = (p as { rental_id: string }).rental_id;
      const amt = Number((p as { amount: number | string }).amount ?? 0);
      paidByRental.set(rid, (paidByRental.get(rid) ?? 0) + amt);
    }

    // 3) Regroupement par locataire (distinct).
    const grouped = new Map<string, OwnerTenant>();
    for (const r of rentalRows) {
      const tenantId = r.tenant?.id ?? r.tenant_id;
      if (!tenantId) continue;

      const existing = grouped.get(tenantId);
      const rentalPaid = paidByRental.get(r.id) ?? 0;

      if (existing) {
        existing.propertiesRented += 1;
        existing.totalPaidFcfa += rentalPaid;
        if (r.start_date && r.start_date < existing.activeSince) {
          existing.activeSince = r.start_date;
        }
      } else {
        grouped.set(tenantId, {
          id: tenantId,
          firstName: r.tenant?.first_name ?? "",
          lastName: r.tenant?.last_name ?? "",
          email: r.tenant?.email ?? "",
          propertiesRented: 1,
          totalPaidFcfa: rentalPaid,
          activeSince: r.start_date ?? "",
        });
      }
    }

    return Array.from(grouped.values()).sort((a, b) =>
      a.activeSince.localeCompare(b.activeSince),
    );
  } catch (err) {
    console.error("[owner-activity] tenants (exception):", err);
    return [];
  }
}
