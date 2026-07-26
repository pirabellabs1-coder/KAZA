import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";

// =============================================================================
// Kaabo - Logique Escrow
// =============================================================================
// L'escrow permet a Kaabo de retenir les fonds verses par le locataire pendant
// X jours avant de les liberer au proprietaire. Cela securise les deux parties
// (verification de l'etat des lieux, possibilite de remboursement en cas de
// litige).
//
// Modèle de reversement : à la libération, le NET (montant − commission Kaabo)
// est crédité au WALLET du propriétaire (wallet_transactions type RENT_RECEIVED,
// le trigger `on_wallet_tx_insert` met à jour `user_wallets.balance_fcfa`). Le
// propriétaire retire ensuite via le flux de retrait existant (withdrawal). Un
// remboursement crédite symétriquement le wallet du locataire (REFUND_GIVEN).
// =============================================================================

const DEFAULT_HOLD_DAYS = parseInt(
  process.env.ESCROW_DEFAULT_HOLD_DAYS ?? "7",
  10
);

/** Taux de commission par défaut (%) si `platform_settings` est indisponible. */
const DEFAULT_COMMISSION_RATE = 2;

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Lit le taux de commission plateforme (%) depuis `platform_settings.payments`.
 * Best-effort : retourne le défaut (2 %) en cas d'absence ou d'erreur.
 */
async function getCommissionRate(supabase: AdminClient): Promise<number> {
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
  status: "held_in_escrow" | "released" | "refunded" | "skipped";
  releaseDate?: string;
  reason?: string;
}

/**
 * Place un paiement en escrow: passe `payments.status` a 'PROCESSING' (vue
 * application = held_in_escrow) et insere une ligne dans `escrow_payments`
 * avec la date de liberation prevue.
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
    .select("tenant_id, property_id, monthly_rent, properties:property_id(owner_id)")
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

  // Part « caution » du versement : tout ce qui dépasse le loyer mensuel (le 1er
  // paiement inclut le loyer + la caution ; les loyers suivants = loyer seul).
  // Cette part ne sera PAS reversée au propriétaire (restituée au locataire en
  // fin de bail).
  const monthlyRent = Number(
    (rental as unknown as { monthly_rent?: number }).monthly_rent ?? 0
  );
  const depositPart = Math.max(0, Number(payment.amount ?? 0) - monthlyRent);

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
        deposit_fcfa: depositPart,
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

interface EscrowRow {
  id: string;
  rental_id: string;
  owner_id: string;
  tenant_id: string;
  amount_paid: number | null;
  total_amount: number | null;
  deposit_fcfa: number | null;
  status: string;
}

/**
 * Cœur de la libération : crédite le WALLET du propriétaire du NET
 * (montant − commission) et marque l'escrow RELEASED. Idempotent (garde sur le
 * type RENT_RECEIVED + reference_id = escrow.id, et update conditionné à HELD).
 */
async function releaseEscrowRow(
  supabase: AdminClient,
  escrow: EscrowRow
): Promise<{ released: boolean; reason?: string; commission?: number }> {
  if (escrow.status === "RELEASED") return { released: false, reason: "already" };
  if (escrow.status !== "HELD") {
    return { released: false, reason: `status ${escrow.status}` };
  }

  const amount = Number(escrow.amount_paid ?? escrow.total_amount ?? 0);
  if (amount <= 0) return { released: false, reason: "montant nul" };

  // La caution (deposit_fcfa) n'est PAS reversée au propriétaire : elle reste
  // en séquestre et sera restituée au locataire en fin de bail. La commission
  // Kaabo porte uniquement sur la part loyer.
  const deposit = Math.max(0, Number(escrow.deposit_fcfa ?? 0));
  const rentPortion = Math.max(0, amount - deposit);
  const rate = await getCommissionRate(supabase);
  const commission = Math.round((rentPortion * rate) / 100);
  const ownerAmount = Math.max(0, rentPortion - commission);

  const loose = supabase as unknown as SupabaseClient;

  // Idempotence : ne pas recréditer si une transaction existe déjà pour cet escrow.
  const { data: existing } = await loose
    .from("wallet_transactions")
    .select("id")
    .eq("reference_id", escrow.id)
    .eq("type", "RENT_RECEIVED")
    .maybeSingle();

  if (!existing && ownerAmount > 0) {
    const { error: txErr } = await loose.from("wallet_transactions").insert({
      user_id: escrow.owner_id,
      type: "RENT_RECEIVED",
      amount_fcfa: ownerAmount,
      description: `Loyer reversé (net, commission Kaabo ${rate}%) — location ${escrow.rental_id}`,
      reference_id: escrow.id,
    });
    if (txErr) return { released: false, reason: txErr.message };
  }

  const now = new Date().toISOString();
  const { error: updErr } = await supabase
    .from("escrow_payments")
    .update({ status: "RELEASED", release_date: now, commission_fcfa: commission })
    .eq("id", escrow.id)
    .eq("status", "HELD");

  if (updErr) return { released: false, reason: updErr.message };

  // Marque les paiements de loyer liés (en séquestre) comme réglés.
  await supabase
    .from("payments")
    .update({ status: "COMPLETED", payment_date: now })
    .eq("rental_id", escrow.rental_id)
    .eq("status", "PROCESSING");

  return { released: true, commission };
}

/**
 * Libère les fonds en escrow vers le WALLET du propriétaire (net de commission).
 * Utilisé pour une libération ciblée par paiement (ex : action admin).
 */
export async function releaseFromEscrow(
  paymentId: string
): Promise<EscrowResult> {
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

  const { data: escrow, error: escrowFetchErr } = await supabase
    .from("escrow_payments")
    .select("id, rental_id, owner_id, tenant_id, amount_paid, total_amount, deposit_fcfa, status")
    .eq("rental_id", payment.rental_id)
    .maybeSingle();

  if (escrowFetchErr || !escrow) {
    throw new Error(
      `Escrow release: escrow introuvable pour rental ${payment.rental_id}: ${escrowFetchErr?.message ?? "not found"}`
    );
  }

  const res = await releaseEscrowRow(supabase, escrow as unknown as EscrowRow);
  if (!res.released) {
    return { paymentId, status: "skipped", reason: res.reason };
  }
  return { paymentId, status: "released", releaseDate: new Date().toISOString() };
}

/**
 * Balaye les escrows arrivés à échéance (status HELD, release_date <= now) et
 * les libère (crédit wallet propriétaire). Appelé par le cron quotidien.
 */
export async function autoReleaseDueEscrows(
  supabase: AdminClient
): Promise<{ scanned: number; released: number; skipped: number }> {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("escrow_payments")
    .select("id, rental_id, owner_id, tenant_id, amount_paid, total_amount, deposit_fcfa, status")
    .eq("status", "HELD")
    .lte("release_date", nowIso)
    .limit(200);

  if (error || !data) {
    return { scanned: 0, released: 0, skipped: 0 };
  }

  let released = 0;
  let skipped = 0;
  for (const row of data as unknown as EscrowRow[]) {
    try {
      const res = await releaseEscrowRow(supabase, row);
      if (res.released) released += 1;
      else skipped += 1;
    } catch (e) {
      skipped += 1;
      console.error(
        `[escrow:auto-release] échec pour escrow ${row.id}:`,
        e instanceof Error ? e.message : e
      );
    }
  }

  return { scanned: data.length, released, skipped };
}

/**
 * Rembourse un paiement en escrow au locataire (ex: litige tranché en sa
 * faveur, annulation avant fin du délai de retenue). Le montant est crédité au
 * WALLET du locataire (REFUND_GIVEN), retirable ensuite.
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

  const amount = Number(escrow.amount_paid ?? escrow.total_amount ?? 0);
  if (amount <= 0) {
    return { paymentId, status: "skipped", reason: "montant nul" };
  }

  const loose = supabase as unknown as SupabaseClient;

  // Idempotence.
  const { data: existing } = await loose
    .from("wallet_transactions")
    .select("id")
    .eq("reference_id", escrow.id)
    .eq("type", "REFUND_GIVEN")
    .maybeSingle();

  if (!existing) {
    const { error: txErr } = await loose.from("wallet_transactions").insert({
      user_id: escrow.tenant_id,
      type: "REFUND_GIVEN",
      amount_fcfa: amount,
      description: `Remboursement escrow — ${reason}`,
      reference_id: escrow.id,
    });
    if (txErr) {
      throw new Error(`Escrow refund: crédit wallet échoué: ${txErr.message}`);
    }
  }

  const now = new Date().toISOString();
  const { error: escrowErr } = await supabase
    .from("escrow_payments")
    .update({ status: "REFUNDED", release_date: now })
    .eq("id", escrow.id)
    .neq("status", "REFUNDED");

  if (escrowErr) {
    console.error(
      `[escrow] refund crédité mais MAJ escrow échouée (${escrow.id}): ${escrowErr.message}`
    );
    throw new Error(
      `Escrow refund : crédit effectué mais mise à jour du statut échouée — réconciliation requise.`
    );
  }

  await supabase
    .from("payments")
    .update({ status: "REFUNDED" })
    .eq("rental_id", payment.rental_id)
    .in("status", ["PROCESSING", "COMPLETED"]);

  console.info(
    `[escrow] paiement ${paymentId} remboursé au wallet locataire (motif: ${reason})`
  );

  return { paymentId, status: "refunded" };
}
