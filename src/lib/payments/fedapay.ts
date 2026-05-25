import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import {
  type CreatePaymentInput,
  type PaymentResult,
  type PaymentStatus,
  PaymentProviderError,
  type WebhookEvent,
} from "./types";

// =============================================================================
// FedaPay - Client d'integration (provider principal Mobile Money Benin)
// Docs: https://docs.fedapay.com
// =============================================================================

const SANDBOX_BASE_URL = "https://sandbox-api.fedapay.com/v1";
const LIVE_BASE_URL = "https://api.fedapay.com/v1";

function getConfig() {
  const secretKey = process.env.FEDAPAY_SECRET_KEY;
  const webhookSecret = process.env.FEDAPAY_WEBHOOK_SECRET;
  const env = (process.env.FEDAPAY_ENV ?? "sandbox").toLowerCase();

  if (!secretKey) {
    throw new PaymentProviderError(
      "fedapay",
      "Cle secrete FedaPay manquante (FEDAPAY_SECRET_KEY)."
    );
  }

  const baseUrl = env === "live" ? LIVE_BASE_URL : SANDBOX_BASE_URL;
  return { secretKey, webhookSecret, baseUrl, env };
}

function buildHeaders(secretKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${secretKey}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

/**
 * Mappe un statut brut FedaPay vers notre statut interne.
 * Statuts FedaPay: pending, approved, declined, canceled, refunded, transferred
 */
function mapFedapayStatus(raw: string): PaymentStatus {
  switch (raw.toLowerCase()) {
    case "approved":
    case "transferred":
      return "succeeded";
    case "declined":
    case "canceled":
      return "failed";
    case "refunded":
      return "refunded";
    case "pending":
    default:
      return "pending";
  }
}

interface FedapayTransactionResponse {
  "v1/transaction"?: {
    id: number;
    reference: string;
    amount: number;
    status: string;
  };
}

interface FedapayTokenResponse {
  token: string;
  url: string;
}

/**
 * Cree une transaction FedaPay puis genere un token de checkout.
 * Flux en 2 etapes: POST /transactions -> POST /transactions/{id}/token
 */
async function createCheckout(input: CreatePaymentInput): Promise<PaymentResult> {
  const { secretKey, baseUrl } = getConfig();

  if (input.currency !== "XOF") {
    throw new PaymentProviderError(
      "fedapay",
      `Devise non supportee: ${input.currency}. Seul XOF est accepte.`
    );
  }

  // Etape 1 : creer la transaction
  const txPayload = {
    description: input.description,
    amount: input.amount,
    currency: { iso: "XOF" },
    callback_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/payments/callback`,
    customer: {
      email: input.customerEmail,
      phone_number: input.customerPhone
        ? { number: input.customerPhone, country: "BJ" }
        : undefined,
    },
    custom_metadata: {
      ...(input.metadata ?? {}),
      ...(input.rentalId ? { rental_id: input.rentalId } : {}),
    },
  };

  const txRes = await fetch(`${baseUrl}/transactions`, {
    method: "POST",
    headers: buildHeaders(secretKey),
    body: JSON.stringify(txPayload),
  });

  if (!txRes.ok) {
    const errText = await txRes.text().catch(() => "");
    throw new PaymentProviderError(
      "fedapay",
      `Echec de creation de transaction FedaPay (${txRes.status}): ${errText}`,
      { statusCode: txRes.status }
    );
  }

  const txData = (await txRes.json()) as FedapayTransactionResponse;
  const transaction = txData["v1/transaction"];
  if (!transaction) {
    throw new PaymentProviderError(
      "fedapay",
      "Reponse FedaPay invalide: champ transaction manquant."
    );
  }

  // Etape 2 : generer le token de checkout
  const tokenRes = await fetch(
    `${baseUrl}/transactions/${transaction.id}/token`,
    {
      method: "POST",
      headers: buildHeaders(secretKey),
      body: JSON.stringify({}),
    }
  );

  if (!tokenRes.ok) {
    const errText = await tokenRes.text().catch(() => "");
    throw new PaymentProviderError(
      "fedapay",
      `Echec de generation du token FedaPay (${tokenRes.status}): ${errText}`,
      { statusCode: tokenRes.status }
    );
  }

  const tokenData = (await tokenRes.json()) as FedapayTokenResponse;

  return {
    provider: "fedapay",
    providerPaymentId: String(transaction.id),
    status: mapFedapayStatus(transaction.status),
    amount: transaction.amount,
    checkoutUrl: tokenData.url,
    raw: { transaction, token: tokenData },
  };
}

/**
 * Verifie la signature HMAC SHA-256 du webhook FedaPay.
 * Header attendu: `x-fedapay-signature`.
 */
function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const { webhookSecret } = getConfig();
  if (!webhookSecret) {
    console.warn(
      "[fedapay] FEDAPAY_WEBHOOK_SECRET non configure - signature non verifiable."
    );
    return false;
  }
  if (!signature) return false;

  const expected = createHmac("sha256", webhookSecret)
    .update(rawBody, "utf8")
    .digest("hex");

  // FedaPay peut envoyer un header au format "t=...,s=<hex>" - on extrait
  // toutes les valeurs hex candidates et on en valide au moins une.
  const candidates = signature
    .split(",")
    .map((part) => {
      const eq = part.indexOf("=");
      return eq >= 0 ? part.slice(eq + 1).trim() : part.trim();
    })
    .filter(Boolean);

  if (candidates.length === 0) candidates.push(signature);

  for (const candidate of candidates) {
    try {
      const a = Buffer.from(expected, "hex");
      const b = Buffer.from(candidate, "hex");
      if (a.length !== b.length) continue;
      if (timingSafeEqual(a, b)) return true;
    } catch {
      // ignore et continue
    }
  }
  return false;
}

/**
 * Parse un webhook FedaPay en evenement normalise.
 */
function parseWebhookEvent(body: unknown): WebhookEvent {
  if (!body || typeof body !== "object") {
    throw new PaymentProviderError("fedapay", "Corps de webhook invalide.");
  }
  const payload = body as {
    name?: string;
    event?: string;
    entity?: {
      id?: number | string;
      reference?: string;
      amount?: number;
      status?: string;
    };
    data?: {
      id?: number | string;
      reference?: string;
      amount?: number;
      status?: string;
    };
  };

  const type = payload.name ?? payload.event ?? "unknown";
  const entity = payload.entity ?? payload.data ?? {};
  const paymentId = entity.id != null ? String(entity.id) : entity.reference ?? "";
  const status = mapFedapayStatus(entity.status ?? "pending");

  if (!paymentId) {
    throw new PaymentProviderError(
      "fedapay",
      "Webhook FedaPay sans identifiant de transaction."
    );
  }

  return {
    provider: "fedapay",
    type,
    paymentId,
    status,
    amount: typeof entity.amount === "number" ? entity.amount : 0,
    raw: body,
  };
}

export const fedapayClient = {
  createCheckout,
  verifyWebhookSignature,
  parseWebhookEvent,
};

export type FedapayClient = typeof fedapayClient;
