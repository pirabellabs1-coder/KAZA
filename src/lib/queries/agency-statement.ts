import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

// =============================================================================
// Kaabo — Relevé de gestion de l'agence (données réelles)
// -----------------------------------------------------------------------------
// Récapitulatif comptable des loyers encaissés via la plateforme pour les biens
// de l'agence : montant brut encaissé, commission Kaabo prélevée, net reversé.
// Source : escrow_payments (owner_id = agence). Ce n'est PAS une facture émise
// à un tiers — c'est un document interne de suivi pour l'agence.
// =============================================================================

export interface StatementLine {
  id: string;
  date: string;
  propertyTitle: string;
  tenantName: string;
  gross: number;
  commission: number;
  net: number;
  status: "RELEASED" | "HELD" | "REFUNDED" | string;
}

export interface AgencyStatement {
  lines: StatementLine[];
  totalCollected: number; // brut encaissé (reversé)
  totalCommission: number; // commission Kaabo prélevée
  totalNet: number; // net reversé à l'agence
  totalPending: number; // encore en séquestre (HELD)
}

export async function getAgencyStatement(
  agencyId: string,
): Promise<AgencyStatement> {
  const empty: AgencyStatement = {
    lines: [],
    totalCollected: 0,
    totalCommission: 0,
    totalNet: 0,
    totalPending: 0,
  };
  if (!agencyId) return empty;

  try {
    const supabase = (await createClient()) as unknown as SupabaseClient;
    const { data, error } = await supabase
      .from("escrow_payments")
      .select(
        `id, amount_paid, total_amount, commission_fcfa, status, release_date, created_at,
         tenant:users!tenant_id(first_name, last_name),
         rental:rentals!rental_id(property:properties!property_id(title))`,
      )
      .eq("owner_id", agencyId)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error || !data) return empty;

    let totalCollected = 0;
    let totalCommission = 0;
    let totalNet = 0;
    let totalPending = 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lines: StatementLine[] = (data as any[]).map((r) => {
      const gross = Number(r.amount_paid ?? r.total_amount ?? 0);
      const commission = Number(r.commission_fcfa ?? 0);
      const net = Math.max(0, gross - commission);
      const status = String(r.status ?? "");
      const tenant = Array.isArray(r.tenant) ? r.tenant[0] : r.tenant;
      const rental = Array.isArray(r.rental) ? r.rental[0] : r.rental;
      const property = rental
        ? Array.isArray(rental.property)
          ? rental.property[0]
          : rental.property
        : null;

      if (status === "RELEASED") {
        totalCollected += gross;
        totalCommission += commission;
        totalNet += net;
      } else if (status === "HELD") {
        totalPending += gross;
      }

      return {
        id: r.id as string,
        date: (r.release_date as string | null) ?? (r.created_at as string),
        propertyTitle: (property?.title as string | undefined) ?? "Bien",
        tenantName:
          `${tenant?.first_name ?? ""} ${tenant?.last_name ?? ""}`.trim() ||
          "Locataire",
        gross,
        commission,
        net,
        status,
      };
    });

    return { lines, totalCollected, totalCommission, totalNet, totalPending };
  } catch {
    return empty;
  }
}
