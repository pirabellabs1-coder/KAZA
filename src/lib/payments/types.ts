// =============================================================================
// KAZA - Payment Provider Types (couche d'integration paiement)
// =============================================================================
// Ces types sont utilises par la couche d'integration des providers (FedaPay,
// Kkiapay) et la facade unifiee `createPayment`. Ils sont volontairement
// decouples du modele Supabase (`src/types/payments.ts`) qui utilise des enums
// en MAJUSCULES alignes avec la BDD.
//
// La conversion entre ces deux representations se fait dans `actions/payments.ts`
// et dans les webhook handlers.
// =============================================================================

export type PaymentProvider = "geniuspay";

export type PaymentMethod =
  | "mtn_money"
  | "moov_money"
  | "card"
  | "bank_transfer";

export type PaymentStatus =
  | "pending"
  | "processing"
  | "succeeded"
  | "failed"
  | "refunded"
  | "held_in_escrow"
  | "released";

export interface CreatePaymentInput {
  /** Montant en FCFA (entier, pas de centimes pour XOF) */
  amount: number;
  currency: "XOF";
  description: string;
  customerEmail: string;
  customerPhone?: string;
  /** ID interne de la location (rental) pour relier le paiement */
  rentalId?: string;
  /** Metadonnees libres propagees au provider */
  metadata?: Record<string, string>;
}

export interface PaymentResult {
  provider: PaymentProvider;
  /** ID retourne par le provider (transaction id) */
  providerPaymentId: string;
  status: PaymentStatus;
  amount: number;
  /** URL hostee par le provider pour redirection client */
  checkoutUrl?: string;
  /** Reponse brute du provider (pour debug / audit) */
  raw: unknown;
}

export interface WebhookEvent {
  provider: PaymentProvider;
  /** Type d'evenement normalise (ex: 'transaction.approved', 'transaction.declined') */
  type: string;
  /** ID de transaction cote provider */
  paymentId: string;
  status: PaymentStatus;
  amount: number;
  /**
   * Metadonnees libres renvoyees par le provider (echo du `custom_metadata`
   * FedaPay / `data` Kkiapay envoye a l'initiation). Sert notamment a
   * retrouver le code promo (`promo_code` / `promo_discount`) et le `user_id`
   * au moment de confirmer le paiement. Vide si le provider ne renvoie rien.
   */
  metadata: Record<string, string>;
  raw: unknown;
}

/**
 * Normalise une valeur `custom_metadata` (FedaPay) / `data` (Kkiapay) renvoyee
 * par un provider en `Record<string, string>`. Tolere aussi bien un objet deja
 * parse qu'une chaine JSON. Toute valeur non-string est convertie via String();
 * les valeurs null/undefined sont ignorees. Renvoie `{}` si la valeur est
 * absente ou non parsable.
 */
export function normalizeProviderMetadata(
  raw: unknown,
): Record<string, string> {
  let obj = raw;
  if (typeof obj === "string") {
    try {
      obj = JSON.parse(obj);
    } catch {
      return {};
    }
  }
  if (!obj || typeof obj !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (v == null) continue;
    out[k] = typeof v === "string" ? v : String(v);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Erreurs typees
// ---------------------------------------------------------------------------

export class PaymentProviderError extends Error {
  readonly provider: PaymentProvider;
  readonly statusCode?: number;
  readonly providerCode?: string;

  constructor(
    provider: PaymentProvider,
    message: string,
    opts: { statusCode?: number; providerCode?: string } = {}
  ) {
    super(message);
    this.name = "PaymentProviderError";
    this.provider = provider;
    this.statusCode = opts.statusCode;
    this.providerCode = opts.providerCode;
  }
}

export class WebhookSignatureError extends Error {
  readonly provider: PaymentProvider;
  constructor(provider: PaymentProvider, message = "Signature webhook invalide") {
    super(message);
    this.name = "WebhookSignatureError";
    this.provider = provider;
  }
}
