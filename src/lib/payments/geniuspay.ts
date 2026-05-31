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

// User-Agent de navigateur : l'API GeniusPay est derrière Cloudflare Bot
// Management, qui renvoie un challenge HTTP 403 (« Just a moment… ») aux
// requêtes serveur sans User-Agent de navigateur. Avec cet en-tête, la requête
// passe le challenge et l'API répond normalement.
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function buildHeaders(apiKey: string, apiSecret: string): HeadersInit {
  return {
    "X-API-Key": apiKey,
    "X-API-Secret": apiSecret,
    Accept: "application/json",
    "Content-Type": "application/json",
    "User-Agent": BROWSER_UA,
  };
}

// Relais Supabase Edge Function : l'API GeniusPay (Cloudflare) est injoignable
// depuis les IP serveur de Vercel. L'egress des Edge Functions Supabase passe
// le challenge ; on route donc les appels via la fonction `geniuspay-relay`
// quand `GENIUSPAY_RELAY_SECRET` est défini (prod). Sinon appel direct (dev
// local depuis une IP non bloquée).
const RELAY_SECRET = process.env.GENIUSPAY_RELAY_SECRET;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function geniuspayFetch(
  path: string,
  method: string,
  apiKey: string,
  apiSecret: string,
  body?: unknown,
): Promise<Response> {
  if (RELAY_SECRET && SUPABASE_URL) {
    return fetch(`${SUPABASE_URL}/functions/v1/geniuspay-relay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-relay-secret": RELAY_SECRET,
        ...(SUPABASE_ANON
          ? {
              apikey: SUPABASE_ANON,
              Authorization: `Bearer ${SUPABASE_ANON}`,
            }
          : {}),
      },
      body: JSON.stringify({ path, method, body }),
    });
  }
  const init: RequestInit = { method, headers: buildHeaders(apiKey, apiSecret) };
  if (method !== "GET" && body !== undefined) {
    init.body = JSON.stringify(body);
  }
  return fetch(`${BASE_URL}${path}`, init);
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
    description: input.description || "Paiement KAZA",
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

  const res = await geniuspayFetch("/payments", "POST", apiKey, apiSecret, body);

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
