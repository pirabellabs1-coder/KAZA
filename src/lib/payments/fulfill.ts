import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { WebhookEvent, TransactionStatus } from "./types";
import { computeReleaseDate, holdInEscrow } from "@/lib/escrow";
import { redeemPromoOnComplete } from "./redeem-on-complete";
import { activatePaidSubscription } from "@/lib/subscriptions/activate";
import { activatePaidBoost } from "@/lib/boosts/activate";
import { creditWalletTopUp } from "@/lib/wallet/credit";
import { settleExpenseShareFromPayment } from "@/lib/expenses/settle";
import { activateRentalAfterPayment } from "@/lib/rentals/lifecycle";
import { notifyRentPayment } from "@/lib/rentals/notify-payment";
import { markOfferDepositPaid } from "@/lib/offers/deposit";

// =============================================================================
// KAZA - Fulfillment d'un paiement confirme (COMPLETED)
// =============================================================================
// Logique unique appelee A LA FOIS par :
//  - la route webhook (`/api/webhooks/feexpay`, `/api/webhooks/kkiapay`)
//  - le polling on-page (action `checkPaymentStatus`)
//
// Idempotente : ne fait rien si le paiement est deja dans un etat final. Chaque
// sous-traitement (escrow, wallet, abonnement, boost, frais partages, vente,
// activation de bail) est lui-meme idempotent et isole (un echec n'empeche pas
// les autres).
// =============================================================================

export const FINAL_STATUSES = new Set(["COMPLETED", "FAILED", "REFUNDED"]);

export type DbPaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "REFUNDED";

/** Mappe un statut interne provider vers le statut BDD (MAJUSCULES). */
export function toDbStatus(
  status: TransactionStatus["status"] | WebhookEvent["status"],
): DbPaymentStatus {
  switch (status) {
    case "succeeded":
    case "held_in_escrow":
    case "released":
      return "COMPLETED";
    case "failed":
      return "FAILED";
    case "refunded":
      return "REFUNDED";
    case "processing":
      return "PROCESSING";
    default:
      return "PENDING";
  }
}

export interface FulfillablePayment {
  id: string;
  rental_id: string | null;
  status: string;
  user_id: string;
  amount: number | null;
  purpose?: string | null;
  subscription_plan?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Applique la transition de statut d'un paiement + declenche le fulfillment si
 * le paiement passe a COMPLETED. Renvoie `{ changed, newStatus }`.
 *
 * @param admin  Client Supabase service-role.
 * @param payment  Ligne `payments` (deja chargee).
 * @param status  Statut interne autoritaire (issu du GET status provider).
 * @param metadata  Metadonnees (callback_info) — sert au code promo.
 */
export async function applyPaymentStatus(
  admin: SupabaseClient,
  payment: FulfillablePayment,
  status: TransactionStatus["status"],
  metadata: Record<string, string> = {},
): Promise<{ changed: boolean; newStatus: DbPaymentStatus }> {
  const newStatus = toDbStatus(status);

  // Idempotence : deja dans un etat final -> ne rien refaire.
  if (FINAL_STATUSES.has(payment.status)) {
    return { changed: false, newStatus: payment.status as DbPaymentStatus };
  }
  if (newStatus === payment.status) {
    return { changed: false, newStatus };
  }

  const now = new Date().toISOString();
  await admin
    .from("payments")
    .update({
      status: newStatus,
      payment_date: newStatus === "COMPLETED" ? now : null,
    })
    .eq("id", payment.id);

  if (newStatus === "COMPLETED") {
    await fulfillCompletedPayment(admin, payment, metadata);
  }

  return { changed: true, newStatus };
}

/**
 * Effets de bord d'un paiement COMPLETED, selon son `purpose` / `rental_id`.
 * Chaque bloc est isole : un echec est loggue mais n'interrompt pas les autres.
 */
export async function fulfillCompletedPayment(
  admin: SupabaseClient,
  payment: FulfillablePayment,
  metadata: Record<string, string> = {},
): Promise<void> {
  // Code promo : redemption comptee uniquement au passage COMPLETED.
  try {
    await redeemPromoOnComplete(
      { metadata } as WebhookEvent,
      payment.user_id,
      admin,
    );
  } catch (err) {
    console.error("[fulfill] redeem promo echec:", err);
  }

  const purpose = payment.purpose ?? undefined;
  const meta = (payment.metadata ?? {}) as Record<string, unknown>;
  const amount = Number(payment.amount ?? 0);

  // Abonnement paye par moyen de paiement.
  if (purpose === "SUBSCRIPTION" && payment.subscription_plan) {
    try {
      await activatePaidSubscription(admin, {
        userId: payment.user_id,
        plan: payment.subscription_plan,
        amountFcfa: amount,
        paymentMethod: "mobile_money",
      });
    } catch (err) {
      console.error("[fulfill] activation abonnement echec:", err);
    }
  }

  // Boost d'annonce.
  if (purpose === "BOOST") {
    const m = meta as { property_id?: string; plan?: string; days?: number };
    if (m.property_id && m.plan) {
      try {
        await activatePaidBoost(admin, {
          userId: payment.user_id,
          propertyId: m.property_id,
          plan: m.plan,
          days: Number(m.days ?? 7),
          amountFcfa: amount,
          paymentId: payment.id,
        });
      } catch (err) {
        console.error("[fulfill] activation boost echec:", err);
      }
    }
  }

  // Recharge wallet.
  if (purpose === "WALLET_TOPUP") {
    try {
      await creditWalletTopUp(admin, {
        userId: payment.user_id,
        amountFcfa: amount,
        paymentId: payment.id,
      });
    } catch (err) {
      console.error("[fulfill] credit wallet echec:", err);
    }
  }

  // Frais partages colocation.
  if (purpose === "EXPENSE_SHARE") {
    const m = meta as { share_id?: string; paid_by?: string | null };
    if (m.share_id) {
      try {
        await settleExpenseShareFromPayment(admin, {
          shareId: m.share_id,
          paidBy: m.paid_by ?? null,
          amountFcfa: amount,
          paymentId: payment.id,
        });
      } catch (err) {
        console.error("[fulfill] settle frais partages echec:", err);
      }
    }
  }

  // Acompte de reservation d'achat (vente).
  if (purpose === "SALE_DEPOSIT") {
    const m = meta as { offer_id?: string };
    if (m.offer_id) {
      try {
        await markOfferDepositPaid(admin, { offerId: m.offer_id });
      } catch (err) {
        console.error("[fulfill] acompte vente echec:", err);
      }
    }
  }

  // Paiement de loyer / reservation -> escrow + activation de la location.
  if (payment.rental_id) {
    try {
      const releaseDate = computeReleaseDate(new Date());
      await holdInEscrow(payment.id, releaseDate);
    } catch (err) {
      console.error("[fulfill] escrow echec:", err);
    }
    try {
      const { activated } = await activateRentalAfterPayment(
        admin,
        payment.rental_id,
      );
      await notifyRentPayment(admin, {
        rentalId: payment.rental_id,
        amount,
        activated,
      });
    } catch (err) {
      console.error("[fulfill] activation location echec:", err);
    }
  }
}
