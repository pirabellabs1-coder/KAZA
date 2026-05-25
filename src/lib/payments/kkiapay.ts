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
// Kkiapay - Client d'integration (provider fallback Mobile Money Benin)
// Docs: https://docs.kkiapay.me
// =============================================================================

const SANDBOX_BASE_URL = "https://api-sandbox.kkiapay.me/api/v1";
const LIVE_BASE_URL = "https://api.kkiapay.me/api/v1";

function getConfig() {
  const publicKey = process.env.KKIAPAY_PUBLIC_KEY;
  const privateKey = process.env.KKIAPAY_PRIVATE_KEY;
  const secret = process.env.KKIAPAY_SECRET;
  const webhookSecret = process.env.KKIAPAY_WEBHOOK_SECRET;
  const env = (process.env.KKIAPAY_ENV ?? "sandbox").toLowerCase();

  if (!publicKey || !privateKey || !secret) {
    throw new PaymentProviderError(
      "kkiapay",
      "Cles Kkiapay manquantes (KKIAPAY_PUBLIC_KEY / KKIAPAY_PRIVATE_KEY / KKIAPAY_SECRET)."
    );
  }

  const baseUrl = env === "live" ? LIVE_BASE_URL : SANDBOX_BASE_URL;
  return { publicKey, privateKey, secret, webhookSecret, baseUrl, env };
}

function buildHeaders(cfg: ReturnType<typeof getConfig>): HeadersInit {
  return {
    "x-api-key": cfg.publicKey,
    "x-private-key": cfg.privateKey,
    "x-secret-key": cfg.secret,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

/**
 * Statuts Kkiapay: PENDING, SUCCESS, FAILED, REFUNDED.
 */
function mapKkiapayStatus(raw: string): PaymentStatus {
  switch (raw.toUpperCase()) {
    case "SUCCESS":
    case "APPROVED":
      return "succeeded";
    case "FAILED":
    case "DECLINED":
    case "CANCELED":
      return "failed";
    case "REFUNDED":
      return "refunded";
    case "PENDING":
    default:
      return "pending";
  }
}

interface KkiapayCheckoutResponse {
  transactionId?: string;
  id?: string;
  status?: string;
  amount?: number;
  paymentUrl?: string;
  url?: string;
}

async function createCheckout(input: CreatePaymentInput): Promise<PaymentResult> {
  const cfg = getConfig();

  if (input.currency !== "XOF") {
    throw new PaymentProviderError(
      "kkiapay",
      `Devise non supportee: ${input.currency}. Seul XOF est accepte.`
    );
  }

  const payload = {
    amount: input.amount,
    reason: input.description,
    email: input.customerEmail,
    phone: input.customerPhone,
    callback: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/payments/callback`,
    data: JSON.stringify({
      ...(input.metadata ?? {}),
      ...(input.rentalId ? { rental_id: input.rentalId } : {}),
    }),
  };

  const res = await fetch(`${cfg.baseUrl}/payments`, {
    method: "POST",
    headers: buildHeaders(cfg),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new PaymentProviderError(
      "kkiapay",
      `Echec de creation de paiement Kkiapay (${res.status}): ${errText}`,
      { statusCode: res.status }
    );
  }

  const data = (await res.json()) as KkiapayCheckoutResponse;
  const providerPaymentId = data.transactionId ?? data.id;
  if (!providerPaymentId) {
    throw new PaymentProviderError(
      "kkiapay",
      "Reponse Kkiapay invalide: identifiant de transaction manquant."
    );
  }

  return {
    provider: "kkiapay",
    providerPaymentId,
    status: mapKkiapayStatus(data.status ?? "PENDING"),
    amount: data.amount ?? input.amount,
    checkoutUrl: data.paymentUrl ?? data.url,
    raw: data,
  };
}

/**
 * Verifie la signature HMAC SHA-256 du webhook Kkiapay.
 * Header attendu: `x-kkiapay-signature`.
 */
function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const cfg = getConfig();
  if (!cfg.webhookSecret) {
    console.warn(
      "[kkiapay] KKIAPAY_WEBHOOK_SECRET non configure - signature non verifiable."
    );
    return false;
  }
  if (!signature) return false;

  const expected = createHmac("sha256", cfg.webhookSecret)
    .update(rawBody, "utf8")
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

function parseWebhookEvent(body: unknown): WebhookEvent {
  if (!body || typeof body !== "object") {
    throw new PaymentProviderError("kkiapay", "Corps de webhook invalide.");
  }
  const payload = body as {
    event?: string;
    type?: string;
    transactionId?: string;
    id?: string;
    status?: string;
    amount?: number;
    data?: Record<string, unknown>;
  };

  const paymentId = payload.transactionId ?? payload.id ?? "";
  if (!paymentId) {
    throw new PaymentProviderError(
      "kkiapay",
      "Webhook Kkiapay sans identifiant de transaction."
    );
  }

  return {
    provider: "kkiapay",
    type: payload.event ?? payload.type ?? "unknown",
    paymentId,
    status: mapKkiapayStatus(payload.status ?? "PENDING"),
    amount: typeof payload.amount === "number" ? payload.amount : 0,
    raw: body,
  };
}

export const kkiapayClient = {
  createCheckout,
  verifyWebhookSignature,
  parseWebhookEvent,
};

export type KkiapayClient = typeof kkiapayClient;
