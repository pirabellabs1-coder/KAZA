import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";

// =============================================================================
// KAZA — Cycle de vie d'une location (rentals)
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
 * Active une location après encaissement du 1er loyer (escrow constitué) :
 *  1) rentals.status      → ACTIVE  (+ start_date si manquante)
 *  2) properties.status   → RENTED
 *  3) visites PENDING/CONFIRMED des AUTRES sur ce bien → CANCELLED
 *  4) candidatures PENDING des AUTRES sur ce bien      → REJECTED
 *  5) autres locations PENDING sur ce bien             → CANCELLED
 *
 * Best-effort et idempotent. Toujours appelé avec le client admin (webhook /
 * paiement wallet) car il agit au-delà du périmètre RLS d'un seul utilisateur.
 */
export async function activateRentalAfterPayment(
  admin: SupabaseClient,
  rentalId: string,
): Promise<void> {
  if (!rentalId) return;

  const { data: rental } = await admin
    .from("rentals")
    .select("id, property_id, tenant_id, status, start_date")
    .eq("id", rentalId)
    .maybeSingle();
  const r = rental as
    | { id: string; property_id: string; tenant_id: string; status: string }
    | null;
  if (!r) return;

  // Sécurité anti double-réservation : si cette location a déjà été annulée
  // (le bien a été pris par un autre candidat qui a payé en premier), on ne la
  // ré-active PAS — le remboursement éventuel relève du flux escrow/litige.
  if (r.status === "CANCELLED" || r.status === "TERMINATED") {
    console.warn(
      `[rentals] activation ignorée: location ${rentalId} déjà ${r.status}`,
    );
    return;
  }

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
  try {
    await admin
      .from("rentals")
      .update({ status: "CANCELLED" })
      .eq("property_id", propertyId)
      .eq("status", "PENDING")
      .neq("id", rentalId);
  } catch (err) {
    console.error("[rentals] activate: annulation locations échouée:", err);
  }
}
