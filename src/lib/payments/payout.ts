import "server-only";

import { PaymentProviderError } from "./types";

// =============================================================================
// Kaabo — Reversements (payouts) sortants
//
// L'encaissement (checkout) passe par FeexPay / KkiaPay. Le reversement sortant
// (payout vers un bénéficiaire mobile money) n'est PAS encore activé côté
// plateforme (nécessite l'API disbursement du provider + accord marchand).
//
// Tant qu'il n'est pas actif, on NE simule PAS un transfert : `sendPayout`
// lève une erreur explicite. Les libérations d'escrow / remboursements restent
// donc en attente (escrow non débité) et sont traités manuellement depuis
// l'espace admin (/admin/payouts).
// =============================================================================

export interface PayoutInput {
  /** Montant entier en FCFA (pas de centimes pour XOF). */
  amount: number;
  /** Numéro mobile money du bénéficiaire au format E.164. */
  phoneNumber: string;
  /** Code ISO pays du numéro (ex: "ci", "bj"). */
  countryCode?: string;
  /** Mode opérateur éventuel (ex: "wave", "orange_money"). */
  mode?: string;
  email?: string;
  firstname?: string;
  lastname?: string;
  description?: string;
  /** Référence interne Kaabo (idempotence). */
  merchantReference?: string;
}

export interface PayoutResult {
  payoutId: string;
  status: string;
  amount: number;
  raw: unknown;
}

/**
 * Déclenche un reversement sortant. Indisponible tant que l'API de payout du
 * provider n'est pas activée : lève une {@link PaymentProviderError} pour que
 * l'appelant (libération escrow / remboursement) NE marque PAS les fonds comme
 * transférés. Le reversement doit alors être traité manuellement.
 */
export async function sendPayout(input: PayoutInput): Promise<PayoutResult> {
  void input;
  throw new PaymentProviderError(
    "feexpay",
    "Reversement automatique indisponible : l'API de payout n'est pas encore " +
      "activée. À traiter manuellement depuis l'espace admin (/admin/payouts).",
  );
}
