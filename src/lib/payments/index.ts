import "server-only";

import { fedapayClient } from "./fedapay";
import { kkiapayClient } from "./kkiapay";
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
  fedapay: fedapayClient,
  kkiapay: kkiapayClient,
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
  /** Provider de paiement preferentiel (defaut: fedapay) */
  provider?: PaymentProvider;
  /** Activer le fallback automatique sur Kkiapay si FedaPay echoue */
  fallback?: boolean;
}

/**
 * Cree un paiement via le provider choisi (FedaPay par defaut).
 * En cas d'echec et si `fallback` est actif (defaut: true), retombe sur
 * Kkiapay automatiquement.
 */
export async function createPayment(
  input: CreatePaymentInput,
  opts: CreatePaymentOptions = {}
): Promise<PaymentResult> {
  const provider = opts.provider ?? "fedapay";
  const fallback = opts.fallback ?? true;

  try {
    return await getPaymentProvider(provider).createCheckout(input);
  } catch (err) {
    if (!fallback || provider === "kkiapay") {
      throw err;
    }
    // Fallback automatique: tenter Kkiapay si FedaPay echoue.
    console.warn(
      `[payments] echec ${provider}, basculement vers kkiapay:`,
      err instanceof Error ? err.message : err
    );
    return await getPaymentProvider("kkiapay").createCheckout(input);
  }
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
