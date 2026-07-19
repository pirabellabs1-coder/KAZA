import "server-only";

import {
  type TransactionStatus,
  type WebhookEvent,
  PaymentProviderError,
  mapKkiapayStatus,
  normalizeProviderMetadata,
} from "./types";

// =============================================================================
// KkiaPay — Client d'integration (Mobile Money + carte + Wave, Afrique de
// l'Ouest francophone). Docs : https://docs.kkiapay.me
//
// Modele : le paiement est declenche cote CLIENT via le widget KkiaPay
// (cle publique). Le widget renvoie un `transactionId`. Le serveur VERIFIE
// ensuite la transaction (source de verite) puis remplit la commande.
//
// Auth serveur (verification / remboursement) :
//   headers  X-API-KEY = cle publique
//            X-PRIVATE-KEY = cle privee (secrete)
//            X-SECRET-KEY  = secret (secret)
//   POST /api/v1/transactions/status  { transactionId }  (verifier)
//   POST /api/v1/transactions/revert  { transactionId }  (rembourser)
// =============================================================================

const LIVE_URL = "https://api.kkiapay.me";
const SANDBOX_URL = "https://api-sandbox.kkiapay.me";

function getConfig() {
  const publicKey = process.env.KKIAPAY_PUBLIC_KEY;
  const privateKey = process.env.KKIAPAY_PRIVATE_KEY;
  const secret = process.env.KKIAPAY_SECRET;
  const sandbox =
    (process.env.KKIAPAY_SANDBOX ?? "true").toLowerCase() !== "false";

  if (!publicKey || !privateKey || !secret) {
    throw new PaymentProviderError(
      "kkiapay",
      "Configuration KkiaPay manquante (KKIAPAY_PUBLIC_KEY / KKIAPAY_PRIVATE_KEY / KKIAPAY_SECRET).",
    );
  }
  return {
    publicKey,
    privateKey,
    secret,
    baseUrl: sandbox ? SANDBOX_URL : LIVE_URL,
  };
}

interface KkiapayStatusResponse {
  status?: string;
  amount?: number;
  transactionId?: string;
  reference?: string;
  performed_at?: string;
  source?: string;
  client?: { phone?: string } | null;
  state?: string;
}

/**
 * Verifie une transaction KkiaPay (source de verite). Utilise apres le retour
 * du widget et pour re-verifier les webhooks.
 */
async function getTransactionStatus(
  transactionId: string,
): Promise<TransactionStatus> {
  const { publicKey, privateKey, secret, baseUrl } = getConfig();

  const res = await fetch(`${baseUrl}/api/v1/transactions/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": publicKey,
      "X-PRIVATE-KEY": privateKey,
      "X-SECRET-KEY": secret,
    },
    body: JSON.stringify({ transactionId }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new PaymentProviderError(
      "kkiapay",
      `Echec de verification du statut KkiaPay (${res.status}): ${errText}`,
      { statusCode: res.status },
    );
  }

  const json = (await res.json()) as KkiapayStatusResponse;

  return {
    provider: "kkiapay",
    reference: transactionId,
    status: mapKkiapayStatus(json.status ?? json.state ?? "PENDING"),
    amount: Math.round(Number(json.amount ?? 0)),
    payerPhone: json.client?.phone ?? undefined,
    raw: json,
  };
}

/**
 * Rembourse une transaction KkiaPay.
 */
async function refundTransaction(
  transactionId: string,
): Promise<{ ok: boolean; raw: unknown }> {
  const { publicKey, baseUrl } = getConfig();
  const res = await fetch(`${baseUrl}/api/v1/transactions/revert`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": publicKey,
    },
    body: JSON.stringify({ transactionId }),
  });
  const raw = await res.json().catch(() => ({}));
  return { ok: res.ok, raw };
}

/**
 * Parse un webhook KkiaPay en evenement normalise. Le statut est indicatif ; la
 * route webhook re-verifie via {@link getTransactionStatus}.
 * Payload typique : `{ transactionId, isPaymentSucces, event, data, ... }`.
 */
function parseWebhookEvent(body: unknown): WebhookEvent {
  if (!body || typeof body !== "object") {
    throw new PaymentProviderError("kkiapay", "Corps de webhook invalide.");
  }
  const payload = body as {
    event?: string;
    transactionId?: string;
    isPaymentSucces?: boolean;
    status?: string;
    amount?: number;
    data?: unknown;
    state?: { data?: unknown };
  };

  const paymentId = payload.transactionId ?? "";
  if (!paymentId) {
    throw new PaymentProviderError(
      "kkiapay",
      "Webhook KkiaPay sans transactionId.",
    );
  }

  const rawStatus =
    payload.status ?? (payload.isPaymentSucces ? "SUCCESS" : "PENDING");

  return {
    provider: "kkiapay",
    type: payload.event ?? "transaction.update",
    paymentId,
    status: mapKkiapayStatus(rawStatus),
    amount: typeof payload.amount === "number" ? Math.round(payload.amount) : 0,
    metadata: normalizeProviderMetadata(payload.data ?? payload.state?.data),
    raw: body,
  };
}

export const kkiapayClient = {
  getTransactionStatus,
  refundTransaction,
  parseWebhookEvent,
};

export type KkiapayClient = typeof kkiapayClient;
