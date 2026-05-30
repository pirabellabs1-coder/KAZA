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

// =============================================================================
// Payouts FedaPay (transfert sortant vers un bénéficiaire mobile money)
// =============================================================================
// Flux en 2 étapes (cf. docs.fedapay.com / payouts) :
//   1) POST /payouts                → crée le payout (statut "pending")
//   2) PUT  /payouts/start          → déclenche réellement le transfert
//
// Utilisé aussi bien pour libérer l'escrow vers le propriétaire que pour
// rembourser le locataire : dans les deux cas il s'agit d'un transfert
// sortant vers un numéro mobile money.
// =============================================================================

export interface PayoutInput {
  /** Montant entier en FCFA (pas de centimes pour XOF). */
  amount: number;
  /** Numéro mobile money du bénéficiaire au format E.164 (+229...). */
  phoneNumber: string;
  /** Code ISO pays du numéro (ex: "bj" pour le Bénin). Défaut: "bj". */
  countryCode?: string;
  /** Mode opérateur FedaPay (ex: "mtn_open", "moov_open"). Optionnel: auto-détection. */
  mode?: string;
  /** Email du bénéficiaire (FedaPay l'utilise pour identifier le customer). */
  email?: string;
  firstname?: string;
  lastname?: string;
  description?: string;
  /** Référence interne KAZA (idempotence côté FedaPay). */
  merchantReference?: string;
}

export interface PayoutResult {
  /** Identifiant du payout côté FedaPay. */
  payoutId: string;
  status: string;
  amount: number;
  raw: unknown;
}

interface FedapayPayoutResponse {
  "v1/payout"?: {
    id: number;
    amount: number;
    status: string;
    reference?: string;
  };
}

/**
 * Crée puis déclenche un payout FedaPay (transfert mobile money sortant).
 * Lève une {@link PaymentProviderError} si la clé secrète manque ou si l'API
 * échoue — l'appelant DOIT traiter cette erreur (ne pas marquer les fonds
 * comme transférés en cas d'échec).
 */
async function sendPayout(input: PayoutInput): Promise<PayoutResult> {
  const { secretKey, baseUrl } = getConfig();

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new PaymentProviderError(
      "fedapay",
      `Montant de payout invalide: ${input.amount}.`
    );
  }
  if (!input.phoneNumber) {
    throw new PaymentProviderError(
      "fedapay",
      "Numéro de téléphone du bénéficiaire manquant pour le payout."
    );
  }

  // Étape 1 : créer le payout.
  const createPayload: Record<string, unknown> = {
    amount: Math.round(input.amount),
    currency: { iso: "XOF" },
    description: input.description,
    customer: {
      firstname: input.firstname,
      lastname: input.lastname,
      email: input.email,
      phone_number: {
        number: input.phoneNumber,
        country: (input.countryCode ?? "bj").toLowerCase(),
      },
    },
  };
  if (input.mode) createPayload.mode = input.mode;
  if (input.merchantReference) {
    createPayload.merchant_reference = input.merchantReference;
  }

  const createRes = await fetch(`${baseUrl}/payouts`, {
    method: "POST",
    headers: buildHeaders(secretKey),
    body: JSON.stringify(createPayload),
  });

  if (!createRes.ok) {
    const errText = await createRes.text().catch(() => "");
    throw new PaymentProviderError(
      "fedapay",
      `Échec de création du payout FedaPay (${createRes.status}): ${errText}`,
      { statusCode: createRes.status }
    );
  }

  const createData = (await createRes.json()) as FedapayPayoutResponse;
  const payout = createData["v1/payout"];
  if (!payout?.id) {
    throw new PaymentProviderError(
      "fedapay",
      "Réponse FedaPay invalide: champ payout manquant."
    );
  }

  // Étape 2 : déclencher l'envoi du payout (transfert immédiat).
  const startRes = await fetch(`${baseUrl}/payouts/start`, {
    method: "PUT",
    headers: buildHeaders(secretKey),
    body: JSON.stringify({ payouts: [{ id: payout.id }] }),
  });

  if (!startRes.ok) {
    const errText = await startRes.text().catch(() => "");
    throw new PaymentProviderError(
      "fedapay",
      `Échec du déclenchement du payout FedaPay (${startRes.status}): ${errText}`,
      { statusCode: startRes.status }
    );
  }

  const startData = await startRes.json().catch(() => null);

  return {
    payoutId: String(payout.id),
    status: payout.status ?? "started",
    amount: payout.amount ?? Math.round(input.amount),
    raw: { create: createData, start: startData },
  };
}

export const fedapayClient = {
  createCheckout,
  verifyWebhookSignature,
  parseWebhookEvent,
  sendPayout,
};

export type FedapayClient = typeof fedapayClient;
