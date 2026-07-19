// =============================================================================
// KAZA - Payment Provider Types (couche d'integration paiement)
// =============================================================================
// Ces types sont utilises par la couche d'integration du provider (FeexPay) et
// la facade unifiee (`createPayment` / `createCardCheckout` / `getPaymentStatus`).
// Ils sont volontairement decouples du modele Supabase (`src/types/payments.ts`)
// qui utilise des enums en MAJUSCULES alignes avec la BDD.
//
// La conversion entre ces deux representations se fait dans `actions/payments.ts`
// et dans les webhook / polling handlers.
// =============================================================================

export type PaymentProvider = "feexpay" | "kkiapay";

/**
 * Identifiant de reseau Mobile Money. La valeur est celle attendue par le champ
 * `reseau` de l'API FeexPay (ex: "MTN", "MOOV CI", "ORANGE CI", "WAVE CI",
 * "TOGOCOM TG"...). Le catalogue complet par pays vit dans
 * `src/lib/payments/feexpay-countries.ts`.
 */
export type MobileMoneyNetwork = string;

export type PaymentMethod =
  | "mobile_money"
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

/**
 * Entree commune a toute initiation de paiement (loyer, wallet, abonnement,
 * boost, frais partages, acompte de vente...).
 */
export interface CreatePaymentInput {
  /** Montant en FCFA (entier, pas de centimes pour XOF) */
  amount: number;
  currency: "XOF";
  description: string;
  customerEmail: string;
  /** Numero du payeur au format local (obligatoire pour le Mobile Money). */
  customerPhone?: string;
  /** ID interne de la location (rental) pour relier le paiement */
  rentalId?: string;
  /** Metadonnees libres propagees au provider via `callback_info`. */
  metadata?: Record<string, string>;
}

/**
 * Entree specifique Mobile Money : ajoute le reseau operateur choisi par le
 * client sur la page de checkout (flux « requesttopay » direct, sans
 * redirection).
 */
export interface CreateMobileMoneyInput extends CreatePaymentInput {
  network: MobileMoneyNetwork;
  /** Code ISO-2 du pays du payeur (ex: "BJ", "CI", "TG", "SN", "NE"). */
  countryCode: string;
  /** Numero du payeur — requis ici. */
  customerPhone: string;
}

/**
 * Champs de checkout Mobile Money fournis par le client (formulaire on-page),
 * partages par toutes les server actions d'encaissement (loyer, wallet,
 * abonnement, boost, frais partages, acompte de vente).
 */
export interface MomoCheckoutFields {
  /** Reseau operateur (valeur `reseau` FeexPay, issue du catalogue). */
  network: MobileMoneyNetwork;
  /** Numero de telephone du payeur (format local ou international). */
  phone: string;
  /** Code ISO-2 du pays (ex: "BJ"). Defaut "BJ" si absent. */
  countryCode?: string;
}

export interface PaymentResult {
  provider: PaymentProvider;
  /** Reference retournee par le provider (transaction id FeexPay). */
  providerPaymentId: string;
  status: PaymentStatus;
  amount: number;
  /**
   * URL hostee par le provider pour redirection client. Uniquement present pour
   * le paiement par carte ; absent pour le Mobile Money (flux on-page).
   */
  checkoutUrl?: string;
  /** Reponse brute du provider (pour debug / audit) */
  raw: unknown;
}

/**
 * Statut d'une transaction obtenu par verification serveur autoritaire
 * (GET status FeexPay). Sert au polling on-page et a la re-verification du
 * webhook.
 */
export interface TransactionStatus {
  provider: PaymentProvider;
  reference: string;
  status: PaymentStatus;
  amount: number;
  /** Numero du payeur tel que renvoye par FeexPay (`payer.partyId`). */
  payerPhone?: string;
  raw: unknown;
}

export interface WebhookEvent {
  provider: PaymentProvider;
  /** Type d'evenement normalise (ex: 'transaction.approved'). */
  type: string;
  /** Reference de transaction cote provider. */
  paymentId: string;
  status: PaymentStatus;
  amount: number;
  /**
   * Metadonnees libres renvoyees par le provider (echo du `callback_info`
   * envoye a l'initiation). Sert notamment a retrouver le code promo
   * (`promo_code` / `promo_discount`) et le `user_id`. Vide si le provider ne
   * renvoie rien.
   */
  metadata: Record<string, string>;
  raw: unknown;
}

/**
 * Normalise une valeur `callback_info` renvoyee par le provider en
 * `Record<string, string>`. Tolere aussi bien un objet deja parse qu'une chaine
 * JSON. Toute valeur non-string est convertie via String(); les valeurs
 * null/undefined sont ignorees. Renvoie `{}` si la valeur est absente ou non
 * parsable.
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

/**
 * Mappe un statut brut FeexPay vers notre statut interne.
 * Statuts FeexPay : PENDING, SUCCESSFUL, FAILED (+ CANCELED / REFUNDED).
 */
export function mapFeexpayStatus(raw: string): PaymentStatus {
  switch ((raw ?? "").toUpperCase()) {
    case "SUCCESSFUL":
    case "SUCCESS":
    case "COMPLETED":
    case "APPROVED":
      return "succeeded";
    case "FAILED":
    case "CANCELED":
    case "CANCELLED":
    case "DECLINED":
      return "failed";
    case "REFUNDED":
      return "refunded";
    case "PROCESSING":
      return "processing";
    case "PENDING":
    default:
      return "pending";
  }
}

/**
 * Mappe un statut brut KkiaPay vers notre statut interne.
 * Statuts KkiaPay : SUCCESS, PENDING, FAILED, INSUFFICIENT_FUNDS...
 */
export function mapKkiapayStatus(raw: string): PaymentStatus {
  switch ((raw ?? "").toUpperCase()) {
    case "SUCCESS":
    case "SUCCESSFUL":
    case "COMPLETED":
      return "succeeded";
    case "FAILED":
    case "INSUFFICIENT_FUNDS":
    case "EXPIRED":
    case "CANCELED":
    case "CANCELLED":
      return "failed";
    case "REFUNDED":
    case "REVERTED":
      return "refunded";
    case "PROCESSING":
      return "processing";
    case "PENDING":
    default:
      return "pending";
  }
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
