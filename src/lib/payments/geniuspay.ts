import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import {
  type CreatePaymentInput,
  type PaymentResult,
  type PaymentStatus,
  PaymentProviderError,
  type WebhookEvent,
  normalizeProviderMetadata,
} from "./types";

// =============================================================================
// GeniusPay — Client d'intégration (Mobile Money + carte, 23 pays africains)
// Docs : https://geniuspay.ci/docs/api
//
// Auth : headers `X-API-Key` (clé publique pk_*) + `X-API-Secret` (clé secrète
// sk_*, jamais exposée côté client). Flux checkout en 1 étape : POST /payments
// renvoie `data.checkout_url` (page de paiement hébergée) + `data.reference`.
// =============================================================================

const BASE_URL =
  process.env.GENIUSPAY_API_BASE?.replace(/\/$/, "") ??
  "https://geniuspay.ci/api/v1/merchant";

function getConfig() {
  const apiKey = process.env.GENIUSPAY_PUBLIC_KEY;
  const apiSecret = process.env.GENIUSPAY_SECRET_KEY;
  const webhookSecret = process.env.GENIUSPAY_WEBHOOK_SECRET;

  if (!apiKey || !apiSecret) {
    throw new PaymentProviderError(
      "geniuspay",
      "Clés GeniusPay manquantes (GENIUSPAY_PUBLIC_KEY / GENIUSPAY_SECRET_KEY).",
    );
  }
  return { apiKey, apiSecret, webhookSecret };
}

function buildHeaders(apiKey: string, apiSecret: string): HeadersInit {
  return {
    "X-API-Key": apiKey,
    "X-API-Secret": apiSecret,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

/**
 * Mappe un statut brut GeniusPay vers notre statut interne.
 * Statuts GeniusPay : pending, processing, completed, failed, cancelled, refunded.
 */
function mapStatus(raw: string): PaymentStatus {
  switch ((raw ?? "").toLowerCase()) {
    case "completed":
      return "succeeded";
    case "processing":
      return "processing";
    case "failed":
    case "cancelled":
    case "canceled":
      return "failed";
    case "refunded":
      return "refunded";
    case "pending":
    default:
      return "pending";
  }
}

interface GeniusPayCreateResponse {
  data?: {
    id?: number | string;
    reference?: string;
    amount?: number;
    currency?: string;
    status?: string;
    checkout_url?: string;
    metadata?: unknown;
  };
}

/**
 * Crée un paiement GeniusPay et retourne l'URL de checkout hébergée.
 * On omet volontairement `payment_method` pour laisser le client choisir son
 * opérateur sur la page GeniusPay (recommandé pour maximiser les conversions).
 */
async function createCheckout(
  input: CreatePaymentInput,
): Promise<PaymentResult> {
  const { apiKey, apiSecret } = getConfig();

  if (input.currency !== "XOF") {
    throw new PaymentProviderError(
      "geniuspay",
      `Devise non supportée : ${input.currency}. Seul XOF est accepté.`,
    );
  }

  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    ""
  ).replace(/\/$/, "");

  const body = {
    amount: Math.round(input.amount),
    currency: "XOF",
    customer: {
      email: input.customerEmail || undefined,
      phone: input.customerPhone || undefined,
    },
    ...(siteUrl
      ? {
          success_url: `${siteUrl}/payments/success`,
          error_url: `${siteUrl}/payments/cancel`,
        }
      : {}),
    metadata: {
      ...(input.metadata ?? {}),
      ...(input.rentalId ? { rental_id: input.rentalId } : {}),
    },
  };

  const res = await fetch(`${BASE_URL}/payments`, {
    method: "POST",
    headers: buildHeaders(apiKey, apiSecret),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new PaymentProviderError(
      "geniuspay",
      `Échec de création du paiement GeniusPay (${res.status}): ${errText}`,
      { statusCode: res.status },
    );
  }

  const json = (await res.json()) as GeniusPayCreateResponse;
  const data = json.data;
  if (!data?.reference || !data.checkout_url) {
    throw new PaymentProviderError(
      "geniuspay",
      "Réponse GeniusPay invalide : reference ou checkout_url manquant.",
    );
  }

  return {
    provider: "geniuspay",
    providerPaymentId: data.reference,
    status: mapStatus(data.status ?? "pending"),
    amount: Math.round(Number(data.amount ?? input.amount)),
    checkoutUrl: data.checkout_url,
    raw: json,
  };
}

/**
 * Vérifie la signature HMAC-SHA256 d'un webhook GeniusPay.
 * Format documenté : `signature = HMAC-SHA256(timestamp + "." + body, secret)`
 * où `timestamp` = header `X-Webhook-Timestamp`, `body` = corps brut JSON.
 * Inclut une protection anti-rejeu (timestamp de plus de 5 min refusé).
 */
function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  timestamp?: string,
): boolean {
  const { webhookSecret } = getConfig();
  if (!webhookSecret) {
    console.warn(
      "[geniuspay] GENIUSPAY_WEBHOOK_SECRET non configuré — signature non vérifiable.",
    );
    return false;
  }
  if (!signature || !timestamp) return false;

  // Protection anti-rejeu : refuse un timestamp de plus de 5 minutes.
  const ts = Number(timestamp);
  if (Number.isFinite(ts) && Math.abs(Date.now() / 1000 - ts) > 300) {
    console.warn("[geniuspay] webhook timestamp expiré (anti-rejeu).");
    return false;
  }

  const expected = createHmac("sha256", webhookSecret)
    .update(`${timestamp}.${rawBody}`, "utf8")
    .digest("hex");

  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(signature.trim(), "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Parse un webhook GeniusPay en évènement normalisé.
 * Payload : `{ id, event, timestamp, data: { reference, amount, status,
 * metadata, ... }, environment }`.
 */
function parseWebhookEvent(body: unknown): WebhookEvent {
  if (!body || typeof body !== "object") {
    throw new PaymentProviderError("geniuspay", "Corps de webhook invalide.");
  }
  const payload = body as {
    event?: string;
    data?: {
      reference?: string;
      id?: number | string;
      amount?: number;
      status?: string;
      metadata?: unknown;
    };
  };

  const data = payload.data ?? {};
  const paymentId =
    data.reference ?? (data.id != null ? String(data.id) : "");

  if (!paymentId) {
    throw new PaymentProviderError(
      "geniuspay",
      "Webhook GeniusPay sans référence de transaction.",
    );
  }

  return {
    provider: "geniuspay",
    type: payload.event ?? "unknown",
    paymentId,
    status: mapStatus(data.status ?? "pending"),
    amount: typeof data.amount === "number" ? Math.round(data.amount) : 0,
    metadata: normalizeProviderMetadata(data.metadata),
    raw: body,
  };
}

export const geniuspayClient = {
  createCheckout,
  verifyWebhookSignature,
  parseWebhookEvent,
};

export type GeniusPayClient = typeof geniuspayClient;
