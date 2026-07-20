import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import {
  type CreateMobileMoneyInput,
  type CreatePaymentInput,
  type PaymentResult,
  type TransactionStatus,
  type WebhookEvent,
  PaymentProviderError,
  mapFeexpayStatus,
  normalizeProviderMetadata,
} from "./types";
import { dialCodeFor } from "./feexpay-countries";

// =============================================================================
// FeexPay — Client d'integration (Mobile Money + carte, Afrique de l'Ouest)
// Docs : https://docs.feexpay.me  •  API : https://api.feexpay.me
//
// Auth : header `Authorization: Bearer <FEEXPAY_API_KEY>` (cle secrete, jamais
// exposee cote client) + `shop` (identifiant marchand) dans le corps.
//
// Flux Mobile Money (Benin — MTN / MOOV / CELTIIS) : ENCAISSEMENT DIRECT.
//   POST /api/transactions/requesttopay/integration  ->  { status, reference }
//   Le client valide la transaction sur son telephone (USSD / appli operateur).
//   On confirme ensuite via le GET status (polling on-page + webhook).
//
// Flux carte : POST /api/transactions/card/inittransact/integration
//   -> { status, url, transref }  ->  redirection vers `url` (page hostee).
//
// Verification : GET /api/transactions/getrequesttopay/integration/{reference}
//   -> { status, amount, payer: { partyId } }  (source de verite autoritaire).
// =============================================================================

const BASE_URL =
  process.env.FEEXPAY_API_BASE?.replace(/\/$/, "") ?? "https://api.feexpay.me";

function getConfig() {
  const apiKey = process.env.FEEXPAY_API_KEY;
  const shopId = process.env.FEEXPAY_SHOP_ID;
  const webhookSecret = process.env.FEEXPAY_WEBHOOK_SECRET;

  if (!apiKey || !shopId) {
    throw new PaymentProviderError(
      "feexpay",
      "Configuration FeexPay manquante (FEEXPAY_API_KEY / FEEXPAY_SHOP_ID).",
    );
  }
  return { apiKey, shopId, webhookSecret };
}

function buildHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

/**
 * Normalise un numero de telephone vers le format international sans `+` attendu
 * par FeexPay (ex: "2290197000000"). Retire espaces, tirets, points, un
 * eventuel `+` ou `00` en tete, puis prefixe l'indicatif du pays si absent.
 */
export function normalizePhone(raw: string, countryCode = "BJ"): string {
  const dial = dialCodeFor(countryCode);
  let digits = (raw ?? "").replace(/[^\d+]/g, "");
  digits = digits.replace(/^\+/, "").replace(/^00/, "");
  if (!digits.startsWith(dial)) {
    digits = `${dial}${digits}`;
  }
  return digits;
}

interface FeexpayCreateResponse {
  status?: string;
  reference?: string;
  transref?: string;
  url?: string;
  payment_url?: string;
  amount?: number;
  message?: string;
}

/**
 * Initie un paiement Mobile Money direct (« requesttopay »). Renvoie la
 * reference FeexPay ; le paiement reste PENDING jusqu'a validation du client sur
 * son telephone (confirme via le GET status).
 */
async function requestToPay(
  input: CreateMobileMoneyInput,
): Promise<PaymentResult> {
  const { apiKey, shopId } = getConfig();

  if (input.currency !== "XOF") {
    throw new PaymentProviderError(
      "feexpay",
      `Devise non supportee : ${input.currency}. Seul XOF est accepte.`,
    );
  }

  const body = {
    phoneNumber: normalizePhone(input.customerPhone, input.countryCode),
    amount: Math.round(input.amount),
    reseau: input.network,
    shop: shopId,
    first_name: input.metadata?.first_name || "Client Kaabo",
    email: input.customerEmail || undefined,
    // callback_info est renvoye tel quel dans le webhook -> on y encode nos
    // metadonnees (user_id, purpose, promo_code...).
    callback_info: JSON.stringify(input.metadata ?? {}),
    ...(input.rentalId ? { custom_id: input.rentalId } : {}),
  };

  const res = await fetch(
    `${BASE_URL}/api/transactions/requesttopay/integration`,
    {
      method: "POST",
      headers: buildHeaders(apiKey),
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new PaymentProviderError(
      "feexpay",
      `Echec d'initiation du paiement Mobile Money FeexPay (${res.status}): ${errText}`,
      { statusCode: res.status },
    );
  }

  const json = (await res.json()) as FeexpayCreateResponse;
  const reference = json.reference ?? json.transref;

  if (!reference || (json.status ?? "").toUpperCase() === "FAILED") {
    throw new PaymentProviderError(
      "feexpay",
      json.message ||
        "Reponse FeexPay invalide : reference manquante ou transaction refusee " +
          "(numero ou reseau incorrect).",
    );
  }

  return {
    provider: "feexpay",
    providerPaymentId: reference,
    status: mapFeexpayStatus(json.status ?? "PENDING"),
    amount: Math.round(Number(json.amount ?? input.amount)),
    raw: json,
  };
}

/**
 * Initie un paiement par carte bancaire. Renvoie l'URL de la page de paiement
 * hostee par FeexPay a laquelle rediriger le client.
 */
async function initCardCheckout(
  input: CreatePaymentInput & { firstName?: string; lastName?: string },
): Promise<PaymentResult> {
  const { apiKey, shopId } = getConfig();

  if (input.currency !== "XOF") {
    throw new PaymentProviderError(
      "feexpay",
      `Devise non supportee : ${input.currency}. Seul XOF est accepte.`,
    );
  }

  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    ""
  ).replace(/\/$/, "");

  const body = {
    phone: input.customerPhone
      ? normalizePhone(input.customerPhone, "BJ")
      : undefined,
    amount: Math.round(input.amount),
    reseau: "VISA",
    shop: shopId,
    first_name: input.firstName || input.metadata?.first_name || "Client",
    last_name: input.lastName || input.metadata?.last_name || "Kaabo",
    email: input.customerEmail || undefined,
    country: "Benin",
    currency: "XOF",
    callback_info: JSON.stringify(input.metadata ?? {}),
    ...(input.rentalId ? { custom_id: input.rentalId } : {}),
    ...(siteUrl ? { return_url: `${siteUrl}/tenant/payments/success` } : {}),
  };

  const res = await fetch(
    `${BASE_URL}/api/transactions/card/inittransact/integration`,
    {
      method: "POST",
      headers: buildHeaders(apiKey),
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new PaymentProviderError(
      "feexpay",
      `Echec d'initiation du paiement carte FeexPay (${res.status}): ${errText}`,
      { statusCode: res.status },
    );
  }

  const json = (await res.json()) as FeexpayCreateResponse;
  const url = json.url ?? json.payment_url;
  const reference = json.transref ?? json.reference;

  if (!url || !reference) {
    throw new PaymentProviderError(
      "feexpay",
      json.message ||
        "Reponse carte FeexPay invalide : url ou reference manquante.",
    );
  }

  return {
    provider: "feexpay",
    providerPaymentId: reference,
    status: mapFeexpayStatus(json.status ?? "PENDING"),
    amount: Math.round(Number(json.amount ?? input.amount)),
    checkoutUrl: url,
    raw: json,
  };
}

interface FeexpayStatusResponse {
  status?: string;
  amount?: number;
  reference?: string;
  payer?: { partyId?: string } | null;
}

/**
 * Verifie le statut d'une transaction aupres de FeexPay (source de verite).
 * Utilise pour le polling on-page ET pour re-verifier les webhooks (on ne fait
 * jamais confiance au payload brut du callback).
 */
async function getTransactionStatus(
  reference: string,
): Promise<TransactionStatus> {
  const { apiKey } = getConfig();

  const res = await fetch(
    `${BASE_URL}/api/transactions/getrequesttopay/integration/${encodeURIComponent(reference)}`,
    { method: "GET", headers: buildHeaders(apiKey) },
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new PaymentProviderError(
      "feexpay",
      `Echec de verification du statut FeexPay (${res.status}): ${errText}`,
      { statusCode: res.status },
    );
  }

  const json = (await res.json()) as FeexpayStatusResponse;

  return {
    provider: "feexpay",
    reference,
    status: mapFeexpayStatus(json.status ?? "PENDING"),
    amount: Math.round(Number(json.amount ?? 0)),
    payerPhone: json.payer?.partyId ?? undefined,
    raw: json,
  };
}

/**
 * Verifie la signature HMAC-SHA256 d'un webhook FeexPay lorsqu'un secret est
 * configure. FeexPay n'expose pas systematiquement une signature ; l'appelant
 * (route webhook) NE se fie de toute facon PAS a ce payload et re-verifie
 * chaque evenement via {@link getTransactionStatus}. Renvoie `true` si aucun
 * secret n'est configure (verification deleguee au GET status).
 */
function verifyWebhookSignature(
  rawBody: string,
  signature?: string,
): boolean {
  // Ne depend QUE du secret webhook (pas de la config marchande complete), pour
  // que la route webhook reponde proprement meme si le shop n'est pas configure.
  const webhookSecret = process.env.FEEXPAY_WEBHOOK_SECRET;
  if (!webhookSecret) return true; // Verification autoritaire faite via GET status.
  if (!signature) return false;

  const expected = createHmac("sha256", webhookSecret)
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

/**
 * Parse un webhook / callback FeexPay en evenement normalise. Le statut ici est
 * indicatif : la route webhook re-verifie via {@link getTransactionStatus}.
 * Payload typique : `{ reference, status, amount, callback_info, ... }`.
 */
function parseWebhookEvent(body: unknown): WebhookEvent {
  if (!body || typeof body !== "object") {
    throw new PaymentProviderError("feexpay", "Corps de webhook invalide.");
  }
  const payload = body as {
    event?: string;
    status?: string;
    reference?: string;
    transref?: string;
    amount?: number;
    callback_info?: unknown;
    metadata?: unknown;
  };

  const paymentId = payload.reference ?? payload.transref ?? "";
  if (!paymentId) {
    throw new PaymentProviderError(
      "feexpay",
      "Webhook FeexPay sans reference de transaction.",
    );
  }

  return {
    provider: "feexpay",
    type: payload.event ?? "transaction.update",
    paymentId,
    status: mapFeexpayStatus(payload.status ?? "PENDING"),
    amount: typeof payload.amount === "number" ? Math.round(payload.amount) : 0,
    metadata: normalizeProviderMetadata(
      payload.callback_info ?? payload.metadata,
    ),
    raw: body,
  };
}

export const feexpayClient = {
  requestToPay,
  initCardCheckout,
  getTransactionStatus,
  verifyWebhookSignature,
  parseWebhookEvent,
};

export type FeexpayClient = typeof feexpayClient;
