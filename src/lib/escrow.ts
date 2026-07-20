import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendPayout } from "@/lib/payments/payout";

// =============================================================================
// Kaabo - Logique Escrow
// =============================================================================
// L'escrow permet a Kaabo de retenir les fonds verses par le locataire pendant
// X jours avant de les liberer au proprietaire. Cela securise les deux parties
// (verification de l'etat des lieux, possibilite de remboursement en cas de
// litige).
// =============================================================================

const DEFAULT_HOLD_DAYS = parseInt(
  process.env.ESCROW_DEFAULT_HOLD_DAYS ?? "7",
  10
);

/** Taux de commission par défaut (%) si `platform_settings` est indisponible. */
const DEFAULT_COMMISSION_RATE = 2;

/**
 * Lit le taux de commission plateforme (%) depuis `platform_settings.payments`.
 * Best-effort : retourne le défaut (2 %) en cas d'absence ou d'erreur.
 */
async function getCommissionRate(
  supabase: ReturnType<typeof createAdminClient>
): Promise<number> {
  try {
    const loose = supabase as unknown as SupabaseClient;
    const { data } = await loose
      .from("platform_settings")
      .select("value")
      .eq("key", "payments")
      .maybeSingle();
    const raw = (data as { value?: { commission?: number } } | null)?.value
      ?.commission;
    const rate = Number(raw);
    if (Number.isFinite(rate) && rate >= 0 && rate <= 100) return rate;
  } catch {
    // ignore — on retombe sur le défaut
  }
  return DEFAULT_COMMISSION_RATE;
}

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

type AdminClient = ReturnType<typeof createAdminClient>;

/** Destination mobile money d'un bénéficiaire pour un transfert FedaPay. */
interface PayoutDestination {
  phoneNumber: string;
  /** Mode opérateur FedaPay (mtn_open / moov_open) si déductible. */
  mode?: string;
  email?: string;
  countryCode?: string;
}

/**
 * Mappe un libellé d'opérateur mobile money stocké en base
 * (`user_wallets.mobile_money_provider`) vers un mode payout FedaPay.
 * Retourne undefined si inconnu (FedaPay tentera l'auto-détection).
 */
function mapProviderToMode(provider?: string | null): string | undefined {
  if (!provider) return undefined;
  const p = provider.toLowerCase();
  if (p.includes("mtn")) return "mtn_open";
  if (p.includes("moov")) return "moov_open";
  return undefined;
}

/**
 * Résout la destination mobile money d'un utilisateur depuis `user_wallets`.
 * Retourne null si aucune coordonnée de versement n'est enregistrée — auquel
 * cas le transfert ne doit PAS être tenté (et donc l'escrow non libéré).
 */
async function resolvePayoutDestination(
  supabase: AdminClient,
  userId: string
): Promise<PayoutDestination | null> {
  // `user_wallets` n'est pas déclaré dans les types générés (`Database`) — on
  // passe par un client loose-typed uniquement pour cette table, comme dans
  // src/actions/wallet.ts.
  const loose = supabase as unknown as SupabaseClient;

  const { data: wallet } = await loose
    .from("user_wallets")
    .select("mobile_money_number, mobile_money_provider")
    .eq("user_id", userId)
    .maybeSingle();

  const phoneNumber = (wallet as { mobile_money_number?: string | null } | null)
    ?.mobile_money_number;
  if (!phoneNumber) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("email")
    .eq("id", userId)
    .maybeSingle();

  return {
    phoneNumber,
    mode: mapProviderToMode(
      (wallet as { mobile_money_provider?: string | null } | null)
        ?.mobile_money_provider
    ),
    email: (profile as { email?: string | null } | null)?.email ?? undefined,
  };
}

/**
 * Libere les fonds en escrow vers le proprietaire.
 *
 * Sécurité de l'argent : le statut n'est marqué 'RELEASED' QU'APRÈS un payout
 * FedaPay réussi vers le propriétaire. Si la clé secrète FedaPay manque, si la
 * destination mobile money est absente, ou si le transfert échoue, l'escrow
 * reste en 'HELD' et une erreur est levée — jamais de faux release.
 */
export async function releaseFromEscrow(paymentId: string): Promise<EscrowResult> {
  const supabase = createAdminClient();

  const { data: payment, error } = await supabase
    .from("payments")
    .select("id, rental_id, amount")
    .eq("id", paymentId)
    .single();

  if (error || !payment) {
    throw new Error(
      `Escrow release: paiement introuvable (${paymentId}): ${error?.message ?? "not found"}`
    );
  }

  // Récupère la ligne escrow pour connaître le bénéficiaire (owner) et le montant.
  const { data: escrow, error: escrowFetchErr } = await supabase
    .from("escrow_payments")
    .select("id, owner_id, amount_paid, total_amount, status")
    .eq("rental_id", payment.rental_id)
    .maybeSingle();

  if (escrowFetchErr || !escrow) {
    throw new Error(
      `Escrow release: escrow introuvable pour rental ${payment.rental_id}: ${escrowFetchErr?.message ?? "not found"}`
    );
  }

  if (escrow.status === "RELEASED") {
    // Idempotence : déjà libéré, on ne retente pas de transfert.
    return { paymentId, status: "released" };
  }

  const amount = Number(
    escrow.amount_paid ?? escrow.total_amount ?? payment.amount ?? 0
  );

  // Commission plateforme (2 % par défaut) : le propriétaire reçoit le loyer
  // NET (montant - commission) ; la plateforme conserve la commission (elle
  // n'est simplement pas reversée — elle reste sur le solde encaissé Kaabo).
  const commissionRate = await getCommissionRate(supabase);
  const commission = Math.round((amount * commissionRate) / 100);
  const ownerAmount = Math.max(0, amount - commission);

  // 1) Vérifier la présence de la clé FedaPay AVANT toute mutation de statut.
  if (!process.env.FEDAPAY_SECRET_KEY) {
    throw new Error(
      "Escrow release impossible : FEDAPAY_SECRET_KEY manquante — l'argent ne peut pas être transféré au propriétaire."
    );
  }

  // 2) Résoudre la destination de versement du propriétaire.
  const destination = await resolvePayoutDestination(supabase, escrow.owner_id);
  if (!destination) {
    throw new Error(
      `Escrow release impossible : aucune coordonnée mobile money pour le propriétaire ${escrow.owner_id}. Escrow laissé en attente.`
    );
  }

  // 3) Déclencher le payout réel FedaPay. En cas d'échec, on NE touche PAS
  //    au statut escrow (reste HELD) et on propage l'erreur.
  let payoutId: string;
  try {
    const result = await sendPayout({
      amount: ownerAmount,
      phoneNumber: destination.phoneNumber,
      mode: destination.mode,
      email: destination.email,
      countryCode: destination.countryCode,
      description: `Kaabo — libération escrow location ${payment.rental_id} (net, commission ${commissionRate}%)`,
      merchantReference: `escrow-release-${escrow.id}`,
    });
    payoutId = result.payoutId;
  } catch (err) {
    console.error(
      `[escrow] payout release échoué pour paiement ${paymentId}:`,
      err instanceof Error ? err.message : err
    );
    throw new Error(
      `Escrow release : le reversement a échoué — fonds NON libérés. ${err instanceof Error ? err.message : ""}`
    );
  }

  // 4) Transfert réussi → marquer l'escrow comme libéré et stocker la référence.
  const now = new Date().toISOString();
  const { error: escrowErr } = await supabase
    .from("escrow_payments")
    .update({
      status: "RELEASED",
      release_date: now,
      payout_ref: payoutId,
      commission_fcfa: commission,
    })
    .eq("id", escrow.id);

  if (escrowErr) {
    // Le transfert a eu lieu mais l'update DB a échoué : on log fortement pour
    // réconciliation manuelle (l'argent est parti, le statut doit suivre).
    console.error(
      `[escrow] payout ${payoutId} effectué mais MAJ escrow échouée (${escrow.id}): ${escrowErr.message}`
    );
    throw new Error(
      `Escrow release : transfert effectué (ref ${payoutId}) mais mise à jour du statut échouée — réconciliation requise.`
    );
  }

  await supabase
    .from("payments")
    .update({ status: "COMPLETED", payment_date: now })
    .eq("id", paymentId);

  return { paymentId, status: "released", releaseDate: now };
}

/**
 * Rembourse un paiement en escrow au locataire (ex: litige tranche en sa
 * faveur, annulation avant fin du delai de retenue).
 *
 * Même garantie que le release : le statut 'REFUNDED' n'est posé QU'APRÈS un
 * transfert FedaPay réussi vers le locataire. Si la clé manque, si la
 * destination est absente ou si le transfert échoue, l'escrow reste inchangé.
 */
export async function refundFromEscrow(
  paymentId: string,
  reason: string
): Promise<EscrowResult> {
  const supabase = createAdminClient();

  const { data: payment, error } = await supabase
    .from("payments")
    .select("id, rental_id, amount")
    .eq("id", paymentId)
    .single();

  if (error || !payment) {
    throw new Error(
      `Escrow refund: paiement introuvable (${paymentId}): ${error?.message ?? "not found"}`
    );
  }

  const { data: escrow, error: escrowFetchErr } = await supabase
    .from("escrow_payments")
    .select("id, tenant_id, amount_paid, total_amount, status")
    .eq("rental_id", payment.rental_id)
    .maybeSingle();

  if (escrowFetchErr || !escrow) {
    throw new Error(
      `Escrow refund: escrow introuvable pour rental ${payment.rental_id}: ${escrowFetchErr?.message ?? "not found"}`
    );
  }

  if (escrow.status === "REFUNDED") {
    return { paymentId, status: "refunded" };
  }

  const amount = Number(
    escrow.amount_paid ?? escrow.total_amount ?? payment.amount ?? 0
  );

  // 1) Clé FedaPay requise avant toute mutation.
  if (!process.env.FEDAPAY_SECRET_KEY) {
    throw new Error(
      "Escrow refund impossible : FEDAPAY_SECRET_KEY manquante — le remboursement ne peut pas être transféré au locataire."
    );
  }

  // 2) Destination de versement du locataire.
  const destination = await resolvePayoutDestination(supabase, escrow.tenant_id);
  if (!destination) {
    throw new Error(
      `Escrow refund impossible : aucune coordonnée mobile money pour le locataire ${escrow.tenant_id}. Escrow laissé en attente.`
    );
  }

  // 3) Transfert réel (refund = payout sortant vers le locataire).
  let refundId: string;
  try {
    const result = await sendPayout({
      amount,
      phoneNumber: destination.phoneNumber,
      mode: destination.mode,
      email: destination.email,
      countryCode: destination.countryCode,
      description: `Kaabo — remboursement escrow location ${payment.rental_id} (${reason})`,
      merchantReference: `escrow-refund-${escrow.id}`,
    });
    refundId = result.payoutId;
  } catch (err) {
    console.error(
      `[escrow] payout refund échoué pour paiement ${paymentId}:`,
      err instanceof Error ? err.message : err
    );
    throw new Error(
      `Escrow refund : le reversement a échoué — remboursement NON effectué. ${err instanceof Error ? err.message : ""}`
    );
  }

  // 4) Succès → marquer remboursé + stocker la référence.
  const { error: escrowErr } = await supabase
    .from("escrow_payments")
    .update({ status: "REFUNDED", refund_ref: refundId })
    .eq("id", escrow.id);

  if (escrowErr) {
    console.error(
      `[escrow] refund ${refundId} effectué mais MAJ escrow échouée (${escrow.id}): ${escrowErr.message}`
    );
    throw new Error(
      `Escrow refund : transfert effectué (ref ${refundId}) mais mise à jour du statut échouée — réconciliation requise.`
    );
  }

  await supabase
    .from("payments")
    .update({ status: "REFUNDED" })
    .eq("id", paymentId);

  console.info(
    `[escrow] paiement ${paymentId} remboursé (ref ${refundId}, motif: ${reason})`
  );

  return { paymentId, status: "refunded" };
}
