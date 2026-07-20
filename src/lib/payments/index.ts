import "server-only";

import { feexpayClient } from "./feexpay";
import { kkiapayClient } from "./kkiapay";
import {
  type CreateMobileMoneyInput,
  type CreatePaymentInput,
  type PaymentProvider,
  type PaymentResult,
  type TransactionStatus,
  type WebhookEvent,
} from "./types";

// =============================================================================
// Kaabo - Facade unifiee du provider de paiement (FeexPay)
// =============================================================================
// Tous les appels paiement de l'application passent par cette facade pour :
// - Une interface unique pour les server actions
// - L'instrumentation centralisee (logs, metrics)
// - Un decouplage total du provider concret (FeexPay aujourd'hui)
//
// Deux flux d'encaissement :
// - Mobile Money (on-page)  : createPayment()      -> reference a poller
// - Carte bancaire (redirect): createCardCheckout() -> checkoutUrl
// =============================================================================

export type {
  CreateMobileMoneyInput,
  CreatePaymentInput,
  MobileMoneyNetwork,
  PaymentMethod,
  PaymentProvider,
  PaymentResult,
  PaymentStatus,
  TransactionStatus,
  WebhookEvent,
} from "./types";
export { PaymentProviderError, WebhookSignatureError } from "./types";

/**
 * Initie un paiement Mobile Money direct (FeexPay « requesttopay »). Le client
 * valide ensuite sur son telephone ; le statut est confirme via
 * {@link getPaymentStatus} (polling) et le webhook. Renvoie la reference
 * FeexPay dans `providerPaymentId` (pas d'URL de redirection).
 */
export async function createPayment(
  input: CreateMobileMoneyInput,
): Promise<PaymentResult> {
  return await feexpayClient.requestToPay(input);
}

/**
 * Initie un paiement par carte bancaire (FeexPay). Renvoie l'URL de la page de
 * paiement hostee a laquelle rediriger le client.
 */
export async function createCardCheckout(
  input: CreatePaymentInput & { firstName?: string; lastName?: string },
): Promise<PaymentResult> {
  return await feexpayClient.initCardCheckout(input);
}

/**
 * Verifie le statut autoritaire d'une transaction aupres du provider indique
 * (FeexPay par defaut). Utilise pour le polling on-page et la re-verification
 * des webhooks.
 */
export async function getPaymentStatus(
  reference: string,
  provider: PaymentProvider = "feexpay",
): Promise<TransactionStatus> {
  if (provider === "kkiapay") {
    return await kkiapayClient.getTransactionStatus(reference);
  }
  return await feexpayClient.getTransactionStatus(reference);
}

/**
 * Verifie la signature d'un webhook FeexPay (si un secret est configure).
 */
export function verifyWebhook(rawBody: string, signature?: string): boolean {
  return feexpayClient.verifyWebhookSignature(rawBody, signature);
}

/**
 * Parse un evenement webhook du provider indique (FeexPay par defaut).
 */
export function parseWebhook(
  body: unknown,
  provider: PaymentProvider = "feexpay",
): WebhookEvent {
  if (provider === "kkiapay") {
    return kkiapayClient.parseWebhookEvent(body);
  }
  return feexpayClient.parseWebhookEvent(body);
}
