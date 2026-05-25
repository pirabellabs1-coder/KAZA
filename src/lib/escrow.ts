import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

// =============================================================================
// KAZA - Logique Escrow
// =============================================================================
// L'escrow permet a KAZA de retenir les fonds verses par le locataire pendant
// X jours avant de les liberer au proprietaire. Cela securise les deux parties
// (verification de l'etat des lieux, possibilite de remboursement en cas de
// litige).
// =============================================================================

const DEFAULT_HOLD_DAYS = parseInt(
  process.env.ESCROW_DEFAULT_HOLD_DAYS ?? "7",
  10
);

/**
 * Calcule la date a laquelle les fonds doivent etre liberes au proprietaire.
 * @param rentalStartDate Date de debut de location (ISO string ou Date)
 * @param holdDays Nombre de jours de retenue (defaut: env ESCROW_DEFAULT_HOLD_DAYS ou 7)
 */
export function computeReleaseDate(
  rentalStartDate: string | Date,
  holdDays = DEFAULT_HOLD_DAYS
): Date {
  const start = rentalStartDate instanceof Date
    ? rentalStartDate
    : new Date(rentalStartDate);
  const release = new Date(start);
  release.setDate(release.getDate() + holdDays);
  return release;
}

export interface EscrowResult {
  paymentId: string;
  status: "held_in_escrow" | "released" | "refunded";
  releaseDate?: string;
}

/**
 * Place un paiement en escrow: passe `payments.status` a 'PROCESSING' (vue
 * application = held_in_escrow) et insere une ligne dans `escrow_payments`
 * avec la date de liberation prevue.
 *
 * Note: La table `payments` n'a pas de statut 'HELD' natif, on utilise donc
 * la table `escrow_payments` comme source de verite pour l'etat d'escrow.
 */
export async function holdInEscrow(
  paymentId: string,
  releaseDate: Date | string
): Promise<EscrowResult> {
  const supabase = createAdminClient();
  const releaseIso =
    releaseDate instanceof Date ? releaseDate.toISOString() : releaseDate;

  // Recupere les details du paiement pour creer/mettre a jour l'escrow.
  const { data: payment, error: fetchErr } = await supabase
    .from("payments")
    .select("id, rental_id, user_id, amount")
    .eq("id", paymentId)
    .single();

  if (fetchErr || !payment) {
    throw new Error(
      `Escrow: paiement introuvable (${paymentId}): ${fetchErr?.message ?? "not found"}`
    );
  }

  // Recupere le owner via property -> rental.
  const { data: rental, error: rentalErr } = await supabase
    .from("rentals")
    .select("tenant_id, property_id, properties:property_id(owner_id)")
    .eq("id", payment.rental_id)
    .single();

  if (rentalErr || !rental) {
    throw new Error(
      `Escrow: rental introuvable (${payment.rental_id}): ${rentalErr?.message ?? "not found"}`
    );
  }

  const ownerId = (
    rental as unknown as { properties?: { owner_id?: string } }
  ).properties?.owner_id;
  if (!ownerId) {
    throw new Error(
      `Escrow: owner introuvable pour rental ${payment.rental_id}`
    );
  }

  const durationDays = Math.max(
    1,
    Math.ceil(
      (new Date(releaseIso).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
  );

  // Upsert escrow row.
  const { error: escrowErr } = await supabase
    .from("escrow_payments")
    .upsert(
      {
        rental_id: payment.rental_id,
        tenant_id: rental.tenant_id ?? payment.user_id,
        owner_id: ownerId,
        total_amount: payment.amount,
        amount_paid: payment.amount,
        duration_days: durationDays,
        status: "HELD",
        release_date: releaseIso,
      },
      { onConflict: "rental_id" }
    );

  if (escrowErr) {
    throw new Error(`Escrow: insertion echouee: ${escrowErr.message}`);
  }

  // Marque le paiement en 'PROCESSING' (etat transitoire entre PENDING et COMPLETED).
  await supabase
    .from("payments")
    .update({ status: "PROCESSING" })
    .eq("id", paymentId);

  return {
    paymentId,
    status: "held_in_escrow",
    releaseDate: releaseIso,
  };
}

/**
 * Libere les fonds en escrow vers le proprietaire.
 * TODO(payments): declencher un transfert reel via FedaPay payouts ou virement
 * bancaire une fois l'API de payout integree.
 */
export async function releaseFromEscrow(paymentId: string): Promise<EscrowResult> {
  const supabase = createAdminClient();

  const { data: payment, error } = await supabase
    .from("payments")
    .select("id, rental_id")
    .eq("id", paymentId)
    .single();

  if (error || !payment) {
    throw new Error(
      `Escrow release: paiement introuvable (${paymentId}): ${error?.message ?? "not found"}`
    );
  }

  const now = new Date().toISOString();

  const { error: escrowErr } = await supabase
    .from("escrow_payments")
    .update({ status: "RELEASED", release_date: now })
    .eq("rental_id", payment.rental_id);

  if (escrowErr) {
    throw new Error(`Escrow release: mise a jour echouee: ${escrowErr.message}`);
  }

  // TODO(payments): appeler l'API de payout du provider pour transferer
  // les fonds vers le compte du proprietaire.

  await supabase
    .from("payments")
    .update({ status: "COMPLETED", payment_date: now })
    .eq("id", paymentId);

  return { paymentId, status: "released", releaseDate: now };
}

/**
 * Rembourse un paiement en escrow au locataire (ex: litige tranche en sa
 * faveur, annulation avant fin du delai de retenue).
 * TODO(payments): declencher un refund reel via l'API du provider.
 */
export async function refundFromEscrow(
  paymentId: string,
  reason: string
): Promise<EscrowResult> {
  const supabase = createAdminClient();

  const { data: payment, error } = await supabase
    .from("payments")
    .select("id, rental_id")
    .eq("id", paymentId)
    .single();

  if (error || !payment) {
    throw new Error(
      `Escrow refund: paiement introuvable (${paymentId}): ${error?.message ?? "not found"}`
    );
  }

  const { error: escrowErr } = await supabase
    .from("escrow_payments")
    .update({ status: "REFUNDED" })
    .eq("rental_id", payment.rental_id);

  if (escrowErr) {
    throw new Error(`Escrow refund: mise a jour echouee: ${escrowErr.message}`);
  }

  // TODO(payments): appeler l'API refund du provider.

  await supabase
    .from("payments")
    .update({ status: "REFUNDED" })
    .eq("id", paymentId);

  console.info(
    `[escrow] paiement ${paymentId} rembourse (motif: ${reason})`
  );

  return { paymentId, status: "refunded" };
}
