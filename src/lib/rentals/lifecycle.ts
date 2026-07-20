import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";

// =============================================================================
// Kaabo — Cycle de vie d'une location (rentals)
// -----------------------------------------------------------------------------
// Une location naît PENDING (candidature acceptée par le propriétaire), puis
// devient ACTIVE dès que le 1er loyer est payé. À ce moment :
//   - le bien passe en RENTED (plus de nouvelles visites/candidatures/paiements)
//   - les autres demandes de visite / candidatures / locations PENDING sur ce
//     bien sont automatiquement annulées/refusées (le bien est pris)
// Idempotent : ré-appeler sur une location déjà ACTIVE ne casse rien.
// =============================================================================

/**
 * Crée (ou réutilise) la location PENDING d'une candidature acceptée.
 * Utilise le client admin : l'insertion d'une `rentals` pour le compte du
 * locataire ne doit pas dépendre des policies RLS du propriétaire.
 *
 * @returns l'id de la location, ou null en cas d'échec.
 */
export async function createPendingRental(input: {
  propertyId: string;
  tenantId: string;
  monthlyRent: number;
  startDate?: string | null;
  securityDeposit?: number | null;
}): Promise<string | null> {
  const admin = createAdminClient() as unknown as SupabaseClient;

  // Réutilise une location existante non terminée pour ce couple bien/locataire
  // (évite les doublons si le propriétaire ré-accepte ou clique deux fois).
  const { data: existing } = await admin
    .from("rentals")
    .select("id, status")
    .eq("property_id", input.propertyId)
    .eq("tenant_id", input.tenantId)
    .in("status", ["PENDING", "ACTIVE"])
    .limit(1);
  const existingRow = (existing as Array<{ id: string }> | null)?.[0];
  if (existingRow?.id) {
    return existingRow.id;
  }

  const startDate =
    input.startDate && input.startDate.length > 0
      ? input.startDate
      : new Date().toISOString().slice(0, 10);

  const { data, error } = await admin
    .from("rentals")
    .insert({
      property_id: input.propertyId,
      tenant_id: input.tenantId,
      monthly_rent: input.monthlyRent,
      security_deposit: input.securityDeposit ?? 0,
      start_date: startDate,
      status: "PENDING",
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[rentals] createPendingRental échec:", error?.message);
    return null;
  }
  return (data as { id: string }).id;
}

/**
 * Garantit qu'un contrat (bail) existe pour une location. Crée un brouillon
 * (status DRAFT) si aucun n'existe, puis déclenche au mieux la génération du
 * PDF (Edge Function). Idempotent. Retourne l'id du contrat (ou null).
 *
 * Le bail doit être SIGNÉ par les deux parties AVANT le paiement (cf.
 * `isRentalContractSigned`). Le propriétaire/agence le complète via l'éditeur.
 */
export async function ensureContractForRental(
  rentalId: string,
): Promise<string | null> {
  if (!rentalId) return null;
  const admin = createAdminClient() as unknown as SupabaseClient;

  const { data: existing } = await admin
    .from("contracts")
    .select("id")
    .eq("rental_id", rentalId)
    .limit(1);
  const found = (existing as Array<{ id: string }> | null)?.[0];
  if (found?.id) return found.id;

  const { data, error } = await admin
    .from("contracts")
    .insert({
      rental_id: rentalId,
      contract_type: "RENTAL",
      status: "DRAFT",
      signed_by_owner: false,
      signed_by_tenant: false,
    })
    .select("id")
    .single();
  if (error || !data) {
    console.error("[contracts] ensureContractForRental échec:", error?.message);
    return null;
  }
  const contractId = (data as { id: string }).id;

  // Génération du PDF — best-effort, ne bloque pas.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (supabaseUrl && anonKey) {
    try {
      await fetch(`${supabaseUrl}/functions/v1/generate-contract-pdf`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ contractId }),
      });
    } catch {
      // Non bloquant : régénérable depuis l'éditeur de contrat.
    }
  }
  return contractId;
}

export interface RentalContractStatus {
  contractId: string | null;
  status: string | null;
  signed: boolean;
}

/** Statut du bail d'une location (pour conditionner le paiement à la signature). */
export async function getRentalContractStatus(
  rentalId: string,
): Promise<RentalContractStatus> {
  const empty: RentalContractStatus = {
    contractId: null,
    status: null,
    signed: false,
  };
  if (!rentalId) return empty;
  const admin = createAdminClient() as unknown as SupabaseClient;
  const { data } = await admin
    .from("contracts")
    .select("id, status, signed_by_owner, signed_by_tenant")
    .eq("rental_id", rentalId)
    .order("created_at", { ascending: false })
    .limit(1);
  const row = (data as Array<{
    id: string;
    status: string;
    signed_by_owner: boolean;
    signed_by_tenant: boolean;
  }> | null)?.[0];
  if (!row) return empty;
  return {
    contractId: row.id,
    status: row.status,
    signed:
      row.status === "SIGNED" ||
      (row.signed_by_owner === true && row.signed_by_tenant === true),
  };
}

/**
 * Statut de bail pour plusieurs locations en une requête (pour les listes).
 * Map rentalId → { contractId, signed }.
 */
export async function getContractsForRentals(
  rentalIds: string[],
): Promise<Map<string, { contractId: string; signed: boolean }>> {
  const map = new Map<string, { contractId: string; signed: boolean }>();
  if (!rentalIds || rentalIds.length === 0) return map;
  const admin = createAdminClient() as unknown as SupabaseClient;
  const { data } = await admin
    .from("contracts")
    .select("id, rental_id, status, signed_by_owner, signed_by_tenant")
    .in("rental_id", rentalIds);
  const rows = (data ?? []) as Array<{
    id: string;
    rental_id: string;
    status: string;
    signed_by_owner: boolean;
    signed_by_tenant: boolean;
  }>;
  for (const c of rows) {
    if (!c.rental_id) continue;
    const signed =
      c.status === "SIGNED" ||
      (c.signed_by_owner === true && c.signed_by_tenant === true);
    // Conserve le contrat le plus avancé si plusieurs (rare).
    const prev = map.get(c.rental_id);
    if (!prev || (signed && !prev.signed)) {
      map.set(c.rental_id, { contractId: c.id, signed });
    }
  }
  return map;
}

/**
 * Active une location après encaissement du 1er loyer (escrow constitué) :
 *  1) rentals.status      → ACTIVE  (+ start_date si manquante)
 *  2) properties.status   → RENTED
 *  3) visites PENDING/CONFIRMED des AUTRES sur ce bien → CANCELLED
 *  4) candidatures PENDING des AUTRES sur ce bien      → REJECTED
 *  5) autres locations PENDING sur ce bien             → CANCELLED
 *  6) contrats (non signés) de ces locations rivales   → CANCELLED
 *
 * Best-effort et idempotent. Toujours appelé avec le client admin (webhook /
 * paiement wallet) car il agit au-delà du périmètre RLS d'un seul utilisateur.
 */
export async function activateRentalAfterPayment(
  admin: SupabaseClient,
  rentalId: string,
): Promise<{ activated: boolean }> {
  if (!rentalId) return { activated: false };

  const { data: rental } = await admin
    .from("rentals")
    .select("id, property_id, tenant_id, status, start_date")
    .eq("id", rentalId)
    .maybeSingle();
  const r = rental as
    | { id: string; property_id: string; tenant_id: string; status: string }
    | null;
  if (!r) return { activated: false };

  // Sécurité anti double-réservation : si cette location a déjà été annulée
  // (le bien a été pris par un autre candidat qui a payé en premier), on ne la
  // ré-active PAS — le remboursement éventuel relève du flux escrow/litige.
  if (r.status === "CANCELLED" || r.status === "TERMINATED") {
    console.warn(
      `[rentals] activation ignorée: location ${rentalId} déjà ${r.status}`,
    );
    return { activated: false };
  }

  // Le bail passe ACTIF (1er loyer) UNIQUEMENT si la location était PENDING.
  // Les loyers mensuels suivants (déjà ACTIVE) → activated=false (pas de spam).
  const wasActivated = r.status === "PENDING";
  const propertyId = r.property_id;

  // 1) Location → ACTIVE
  try {
    await admin
      .from("rentals")
      .update({ status: "ACTIVE" })
      .eq("id", rentalId)
      .neq("status", "ACTIVE");
  } catch (err) {
    console.error("[rentals] activate: maj location échouée:", err);
  }

  // 2) Bien → RENTED
  try {
    await admin
      .from("properties")
      .update({ status: "RENTED" })
      .eq("id", propertyId)
      .neq("status", "RENTED");
  } catch (err) {
    console.error("[rentals] activate: maj bien RENTED échouée:", err);
  }

  // 3) Visites des autres → CANCELLED (le locataire actuel garde l'historique)
  try {
    await admin
      .from("visit_requests")
      .update({ status: "CANCELLED" })
      .eq("property_id", propertyId)
      .in("status", ["PENDING", "CONFIRMED"])
      .neq("tenant_id", r.tenant_id);
  } catch (err) {
    console.error("[rentals] activate: annulation visites échouée:", err);
  }

  // 4) Candidatures des autres → REJECTED
  try {
    await admin
      .from("rental_applications")
      .update({ status: "REJECTED", decided_at: new Date().toISOString() })
      .eq("property_id", propertyId)
      .eq("status", "PENDING")
      .neq("tenant_id", r.tenant_id);
  } catch (err) {
    console.error("[rentals] activate: rejet candidatures échoué:", err);
  }

  // 5) Autres locations PENDING sur ce bien → CANCELLED
  //    + 6) leurs contrats (DRAFT/PENDING_*) → CANCELLED pour éviter qu'un
  //    candidat évincé garde un « bail à signer » fantôme.
  try {
    const { data: rivals } = await admin
      .from("rentals")
      .select("id")
      .eq("property_id", propertyId)
      .eq("status", "PENDING")
      .neq("id", rentalId);
    const rivalIds = ((rivals ?? []) as Array<{ id: string }>).map((x) => x.id);

    if (rivalIds.length > 0) {
      await admin
        .from("rentals")
        .update({ status: "CANCELLED" })
        .in("id", rivalIds);

      await admin
        .from("contracts")
        .update({ status: "CANCELLED" })
        .in("rental_id", rivalIds)
        .neq("status", "SIGNED");
    }
  } catch (err) {
    console.error("[rentals] activate: annulation locations échouée:", err);
  }

  return { activated: wasActivated };
}
