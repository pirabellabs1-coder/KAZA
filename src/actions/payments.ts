"use server";

import { randomUUID } from "node:crypto";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPayment, getPaymentStatus } from "@/lib/payments";
import type { MomoCheckoutFields, PaymentProvider } from "@/lib/payments/types";
import {
  applyPaymentStatus,
  type FulfillablePayment,
} from "@/lib/payments/fulfill";
import { validatePromoCode, computeDiscount } from "@/lib/queries/promo";
import {
  walletDebit,
  walletRefund,
  getWalletBalanceFor,
} from "@/lib/wallet/spend";
import { holdInEscrow, computeReleaseDate } from "@/lib/escrow";
import {
  activateRentalAfterPayment,
  getRentalContractStatus,
} from "@/lib/rentals/lifecycle";
import { notifyRentPayment } from "@/lib/rentals/notify-payment";
import type { SupabaseClient } from "@supabase/supabase-js";

// =============================================================================
// KAZA - Server Actions Paiements
// =============================================================================

export interface InitiateRentPaymentInput extends MomoCheckoutFields {
  rentalId: string;
  /**
   * Code promo (optionnel). Re-validé côté serveur : la remise n'est jamais
   * calculée à partir d'une valeur fournie par le client.
   */
  promoCode?: string;
}

export interface InitiateRentPaymentResult {
  success: boolean;
  paymentId?: string;
  /** Reference FeexPay a poller (flux Mobile Money on-page). */
  reference?: string;
  /** URL de redirection (uniquement flux carte). */
  checkoutUrl?: string;
  error?: string;
}

/**
 * Initie un paiement de loyer Mobile Money (FeexPay, flux on-page) :
 * 1) Verifie que l'utilisateur courant est bien le locataire du rental
 * 2) Declenche la demande de paiement FeexPay (« requesttopay ») vers le numero
 * 3) Insere une ligne `payments` avec status=PENDING et la reference FeexPay
 * 4) Retourne la reference : le client valide sur son telephone puis le statut
 *    est confirme par polling (`checkPaymentStatus`) + webhook.
 */
export async function initiateRentPayment(
  input: InitiateRentPaymentInput
): Promise<InitiateRentPaymentResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { success: false, error: "Authentification requise." };
  }

  // Recupere les details du rental + email pour le provider.
  const { data: rental, error: rentalErr } = await supabase
    .from("rentals")
    .select("id, tenant_id, monthly_rent, property_id, status")
    .eq("id", input.rentalId)
    .single();

  if (rentalErr || !rental) {
    return { success: false, error: "Location introuvable." };
  }

  if (rental.tenant_id !== user.id) {
    return {
      success: false,
      error: "Vous n'etes pas autorise a payer pour cette location.",
    };
  }

  if (!rental.monthly_rent || rental.monthly_rent <= 0) {
    return { success: false, error: "Montant de loyer invalide." };
  }

  // Le 1er loyer (qui finalise le bail) n'est payable QU'APRÈS signature du
  // contrat par les deux parties. Les loyers suivants (bail déjà ACTIVE) ne
  // sont pas bloqués.
  if ((rental as { status?: string }).status === "PENDING") {
    const contract = await getRentalContractStatus(rental.id);
    if (!contract.signed) {
      return {
        success: false,
        error:
          "Le bail doit être signé par le propriétaire et le locataire avant le paiement.",
      };
    }
  }

  // Code promo (optionnel) : on revalide TOUJOURS côté serveur. La remise
  // n'est jamais déduite d'une valeur fournie par le client.
  const baseAmount = rental.monthly_rent;
  let discount = 0;
  let appliedPromoCode: string | null = null;
  if (input.promoCode && input.promoCode.trim()) {
    const validation = await validatePromoCode(
      input.promoCode,
      "RESERVATION",
      user.id,
    );
    if (
      validation.valid &&
      validation.discountType &&
      validation.discountValue != null
    ) {
      discount = computeDiscount(
        baseAmount,
        validation.discountType,
        validation.discountValue,
      );
      if (discount > 0) {
        appliedPromoCode = input.promoCode.trim().toUpperCase();
      }
    }
    // Code invalide/expiré → on ignore silencieusement la remise (le checkout
    // a déjà affiché l'erreur à l'application). Le paiement passe au plein tarif.
  }

  const amountToCharge = Math.max(0, baseAmount - discount);

  if (!input.phone || !input.phone.trim()) {
    return { success: false, error: "Numéro de téléphone requis." };
  }
  if (!input.network) {
    return { success: false, error: "Opérateur Mobile Money requis." };
  }

  try {
    const result = await createPayment({
      amount: amountToCharge,
      currency: "XOF",
      description: `Loyer mensuel - location ${rental.id}`,
      customerEmail: user.email ?? "",
      customerPhone: input.phone,
      network: input.network,
      countryCode: input.countryCode ?? "BJ",
      rentalId: rental.id,
      metadata: {
        user_id: user.id,
        ...(appliedPromoCode
          ? { promo_code: appliedPromoCode, promo_discount: String(discount) }
          : {}),
      },
    });

    // Insere la ligne payments (admin client car le webhook devra pouvoir
    // updater meme si l'utilisateur n'est plus connecte).
    const admin = createAdminClient();
    const { data: payment, error: insertErr } = await admin
      .from("payments")
      .insert({
        rental_id: rental.id,
        user_id: user.id,
        amount: amountToCharge,
        payment_method: "MOBILE_MONEY",
        transaction_id: result.providerPaymentId,
        status: "PENDING",
      })
      .select("id")
      .single();

    if (insertErr || !payment) {
      console.error("[payments] insert echec:", insertErr);
      return {
        success: false,
        error: "Impossible d'enregistrer le paiement.",
      };
    }

    // NOTE : on n'enregistre PLUS la redemption du code promo ici. Tant que le
    // paiement est PENDING, rien ne garantit qu'il aboutira ; compter la
    // redemption + le quota dès l'initiation les fausserait en cas d'échec.
    // Le code promo et le montant remisé sont propagés au provider via
    // `metadata` (promo_code / promo_discount) et la redemption est désormais
    // enregistrée par le webhook (FedaPay / Kkiapay) UNIQUEMENT au passage du
    // paiement à COMPLETED. Voir `redeemPromoForUser` + les routes
    // `src/app/api/webhooks/*`.

    return {
      success: true,
      paymentId: payment.id,
      reference: result.providerPaymentId,
    };
  } catch (err) {
    console.error("[payments] initiation echec:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de l'initiation du paiement.",
    };
  }
}

// ---------------------------------------------------------------------------
// Polling on-page : verifie le statut d'un paiement Mobile Money aupres du
// provider (source de verite) et applique le fulfillment si COMPLETED. Appele
// en boucle par le formulaire de checkout apres l'initiation.
// ---------------------------------------------------------------------------

export interface CheckPaymentStatusResult {
  status: "pending" | "processing" | "succeeded" | "failed";
  error?: string;
}

/**
 * Verifie le statut d'un paiement dont l'utilisateur courant est proprietaire.
 * Idempotent : delegue a `applyPaymentStatus` (meme logique que le webhook).
 */
export async function checkPaymentStatus(
  paymentId: string,
  provider: PaymentProvider = "feexpay",
): Promise<CheckPaymentStatusResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return { status: "failed", error: "Authentification requise." };

  const admin = createAdminClient() as unknown as SupabaseClient;
  const { data: payment, error: pErr } = await admin
    .from("payments")
    .select(
      "id, rental_id, status, user_id, amount, purpose, subscription_plan, metadata, transaction_id",
    )
    .eq("id", paymentId)
    .single();

  if (pErr || !payment) return { status: "failed", error: "Paiement introuvable." };
  if ((payment as { user_id: string }).user_id !== user.id) {
    return { status: "failed", error: "Non autorisé." };
  }

  const p = payment as unknown as FulfillablePayment & {
    transaction_id: string;
  };

  // Deja finalise ?
  if (p.status === "COMPLETED") return { status: "succeeded" };
  if (p.status === "FAILED") return { status: "failed" };

  try {
    const verified = await getPaymentStatus(p.transaction_id, provider);
    await applyPaymentStatus(
      admin,
      p,
      verified.status,
      (p.metadata as Record<string, string>) ?? {},
    );
    switch (verified.status) {
      case "succeeded":
      case "held_in_escrow":
      case "released":
        return { status: "succeeded" };
      case "failed":
      case "refunded":
        return { status: "failed" };
      case "processing":
        return { status: "processing" };
      default:
        return { status: "pending" };
    }
  } catch (err) {
    console.error("[payments] check status echec:", err);
    return { status: "pending", error: "Vérification impossible pour le moment." };
  }
}

/** Solde KAZA de l'utilisateur courant (pour le tunnel de paiement). */
export async function getMyWalletBalance(): Promise<{
  balance: number;
  frozen: boolean;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { balance: 0, frozen: false };
  return getWalletBalanceFor(user.id);
}

/**
 * Paie le loyer DEPUIS le solde KAZA (wallet) — alternative à FeexPay.
 * Débit atomique (pas de double-débit), puis mise en séquestre. Si la mise en
 * séquestre échoue, le solde est recrédité automatiquement.
 */
export async function payRentFromWallet(
  input: { rentalId: string; promoCode?: string },
): Promise<InitiateRentPaymentResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return { success: false, error: "Authentification requise." };

  const { data: rental, error: rentalErr } = await supabase
    .from("rentals")
    .select("id, tenant_id, monthly_rent, property_id, status")
    .eq("id", input.rentalId)
    .single();
  if (rentalErr || !rental) return { success: false, error: "Location introuvable." };
  if (rental.tenant_id !== user.id) {
    return { success: false, error: "Vous n'êtes pas autorisé à payer pour cette location." };
  }
  if (!rental.monthly_rent || rental.monthly_rent <= 0) {
    return { success: false, error: "Montant de loyer invalide." };
  }

  // Bail signé obligatoire avant le 1er loyer (cf. initiateRentPayment).
  if ((rental as { status?: string }).status === "PENDING") {
    const contract = await getRentalContractStatus(rental.id);
    if (!contract.signed) {
      return {
        success: false,
        error:
          "Le bail doit être signé par le propriétaire et le locataire avant le paiement.",
      };
    }
  }

  // Promo : revalidée côté serveur (jamais déduite d'une valeur client).
  const baseAmount = rental.monthly_rent;
  let discount = 0;
  let appliedPromoCode: string | null = null;
  if (input.promoCode && input.promoCode.trim()) {
    const validation = await validatePromoCode(input.promoCode, "RESERVATION", user.id);
    if (validation.valid && validation.discountType && validation.discountValue != null) {
      discount = computeDiscount(baseAmount, validation.discountType, validation.discountValue);
      if (discount > 0) appliedPromoCode = input.promoCode.trim().toUpperCase();
    }
  }
  const amountToCharge = Math.max(0, baseAmount - discount);
  if (amountToCharge <= 0) return { success: false, error: "Montant invalide." };

  const admin = createAdminClient();

  // 1) Ligne payments (WALLET, PENDING).
  const { data: payment, error: insertErr } = await admin
    .from("payments")
    .insert({
      rental_id: rental.id,
      user_id: user.id,
      amount: amountToCharge,
      payment_method: "WALLET",
      transaction_id: `WALLET-${randomUUID()}`,
      status: "PENDING",
      metadata: {
        user_id: user.id,
        paid_from: "wallet",
        ...(appliedPromoCode
          ? { promo_code: appliedPromoCode, promo_discount: String(discount) }
          : {}),
      },
    })
    .select("id")
    .single();
  if (insertErr || !payment) {
    console.error("[payments] wallet rent insert echec:", insertErr);
    return { success: false, error: "Impossible d'enregistrer le paiement." };
  }

  // 2) Débit atomique du solde.
  const debit = await walletDebit({
    userId: user.id,
    amountFcfa: amountToCharge,
    type: "RENT_DEBIT",
    description: `Loyer — location ${rental.id}`,
    referenceId: payment.id,
    metadata: { rental_id: rental.id },
  });
  if (!debit.ok) {
    await admin.from("payments").update({ status: "FAILED" }).eq("id", payment.id);
    return { success: false, error: debit.error };
  }

  // 3) Mise en séquestre (état PROCESSING). En cas d'échec → remboursement.
  try {
    await holdInEscrow(payment.id, computeReleaseDate(new Date()));
  } catch (e) {
    console.error("[payments] wallet rent escrow echec:", e);
    await walletRefund(
      user.id,
      amountToCharge,
      "Remboursement — échec de la mise en séquestre du loyer",
      payment.id,
    );
    await admin.from("payments").update({ status: "REFUNDED" }).eq("id", payment.id);
    return {
      success: false,
      error: "Le paiement n'a pas pu aboutir, votre solde a été recrédité.",
    };
  }

  // Le 1er loyer payé active le bail : location ACTIVE, bien RENTED, visites /
  // candidatures concurrentes annulées. Best-effort, idempotent.
  try {
    const { activated } = await activateRentalAfterPayment(
      admin as unknown as SupabaseClient,
      rental.id,
    );
    // Notifie bailleur + locataire (et bail actif au 1er loyer).
    await notifyRentPayment(admin as unknown as SupabaseClient, {
      rentalId: rental.id,
      amount: amountToCharge,
      activated,
    });
  } catch (e) {
    console.error("[payments] wallet rent activation echec:", e);
  }

  return { success: true, paymentId: payment.id };
}

export interface GetPaymentHistoryInput {
  userId?: string; // defaut: utilisateur courant
  limit?: number;
  offset?: number;
}

/**
 * Liste l'historique de paiements de l'utilisateur (RLS applique).
 */
export async function getPaymentHistory(input: GetPaymentHistoryInput = {}) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { success: false as const, error: "Authentification requise." };
  }

  const targetUserId = input.userId ?? user.id;
  const limit = Math.min(input.limit ?? 20, 100);
  const offset = input.offset ?? 0;

  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", targetUserId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return { success: false as const, error: error.message };
  }

  return { success: true as const, payments: data ?? [] };
}

export interface RequestRefundInput {
  paymentId: string;
  reason: string;
}

/**
 * Cree une demande de remboursement. La logique reelle de refund est traitee
 * de maniere asynchrone (escrow + appel API provider).
 */
export async function requestRefund(input: RequestRefundInput) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { success: false as const, error: "Authentification requise." };
  }

  if (!input.reason || input.reason.trim().length < 5) {
    return {
      success: false as const,
      error: "Motif de remboursement requis (5 caracteres min).",
    };
  }

  // Verifie que le paiement appartient bien a l'utilisateur.
  const { data: payment, error: payErr } = await supabase
    .from("payments")
    .select("id, user_id, status, amount")
    .eq("id", input.paymentId)
    .single();

  if (payErr || !payment) {
    return { success: false as const, error: "Paiement introuvable." };
  }
  if (payment.user_id !== user.id) {
    return {
      success: false as const,
      error: "Vous n'etes pas autorise a demander ce remboursement.",
    };
  }
  if (payment.status === "REFUNDED") {
    return {
      success: false as const,
      error: "Ce paiement a deja ete rembourse.",
    };
  }

  // `refund_requests` n'est pas (encore) dans les types generes Supabase :
  // on cast le client en `any` pour ces requetes (meme limite que
  // `partner_applications`).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const refundDb = supabase as any;

  // Empeche les doublons : une demande PENDING existe deja pour ce paiement.
  const { data: existing } = await refundDb
    .from("refund_requests")
    .select("id")
    .eq("payment_id", payment.id)
    .eq("status", "PENDING")
    .maybeSingle();

  if (existing) {
    return {
      success: false as const,
      error: "Une demande de remboursement est deja en attente pour ce paiement.",
    };
  }

  // Persiste la demande de remboursement (status PENDING). La RLS
  // `refund_insert` garantit auth.uid() = user_id.
  const { error: insertErr } = await refundDb.from("refund_requests").insert({
    payment_id: payment.id,
    user_id: user.id,
    reason: input.reason.trim(),
    amount: payment.amount ?? 0,
    status: "PENDING",
  });

  if (insertErr) {
    console.error("[payments] insert refund_request echec:", insertErr);
    return {
      success: false as const,
      error: "Impossible d'enregistrer la demande de remboursement.",
    };
  }

  return { success: true as const };
}
