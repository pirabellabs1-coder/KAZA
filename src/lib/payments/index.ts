import "server-only";

import { geniuspayClient } from "./geniuspay";
import {
  type CreatePaymentInput,
  type PaymentProvider,
  type PaymentResult,
  type WebhookEvent,
  PaymentProviderError,
} from "./types";

// =============================================================================
// KAZA - Facade unifiee des providers de paiement
// =============================================================================
// Tous les appels paiement de l'application doivent passer par cette facade
// pour permettre:
// - Le fallback automatique entre providers (FedaPay -> Kkiapay)
// - Une interface unique pour les server actions
// - L'instrumentation centralisee (logs, metrics)
// =============================================================================

export type {
  CreatePaymentInput,
  PaymentMethod,
  PaymentProvider,
  PaymentResult,
  PaymentStatus,
  WebhookEvent,
} from "./types";
export { PaymentProviderError, WebhookSignatureError } from "./types";

interface PaymentProviderAdapter {
  createCheckout: (input: CreatePaymentInput) => Promise<PaymentResult>;
  verifyWebhookSignature: (rawBody: string, signature: string) => boolean;
  parseWebhookEvent: (body: unknown) => WebhookEvent;
}

const PROVIDERS: Record<PaymentProvider, PaymentProviderAdapter> = {
  geniuspay: geniuspayClient,
};

/**
 * Retourne l'adapter d'un provider de paiement.
 */
export function getPaymentProvider(name: PaymentProvider): PaymentProviderAdapter {
  const provider = PROVIDERS[name];
  if (!provider) {
    throw new PaymentProviderError(
      name,
      `Provider de paiement inconnu: ${name}`
    );
  }
  return provider;
}

interface CreatePaymentOptions {
  /** Provider de paiement (unique : GeniusPay). */
  provider?: PaymentProvider;
}

/**
 * Crée un paiement via GeniusPay (seul provider d'encaissement de la
 * plateforme). Renvoie l'URL de checkout hébergée à laquelle rediriger le
 * client.
 */
export async function createPayment(
  input: CreatePaymentInput,
  opts: CreatePaymentOptions = {}
): Promise<PaymentResult> {
  const provider = opts.provider ?? "geniuspay";
  return await getPaymentProvider(provider).createCheckout(input);
}

/**
 * Verifie la signature d'un webhook pour le provider donne.
 */
export function verifyWebhook(
  provider: PaymentProvider,
  rawBody: string,
  signature: string
): boolean {
  return getPaymentProvider(provider).verifyWebhookSignature(rawBody, signature);
}

/**
 * Parse un evenement webhook pour le provider donne.
 */
export function parseWebhook(
  provider: PaymentProvider,
  body: unknown
): WebhookEvent {
  return getPaymentProvider(provider).parseWebhookEvent(body);
}
