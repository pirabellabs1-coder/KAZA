import "server-only";

import { PaymentProviderError } from "./types";

// =============================================================================
// KAZA — Reversements (payouts) sortants
//
// L'encaissement (checkout) passe 100% par GeniusPay. En revanche, l'API de
// payout (reversement vers un bénéficiaire mobile money) de GeniusPay est
// « Bientôt disponible » à ce jour — voir https://geniuspay.ci/docs/payout-api.
//
// Tant qu'elle n'est pas active, on NE simule PAS un transfert : `sendPayout`
// lève une erreur explicite. Les libérations d'escrow / remboursements restent
// donc en attente (escrow non débité) et sont traités manuellement depuis
// l'espace admin (/admin/payouts) jusqu'à activation du payout GeniusPay.
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
  /** Référence interne KAZA (idempotence). */
  merchantReference?: string;
}

export interface PayoutResult {
  payoutId: string;
  status: string;
  amount: number;
  raw: unknown;
}

/**
 * Déclenche un reversement sortant. Indisponible tant que l'API payout
 * GeniusPay n'est pas active : lève une {@link PaymentProviderError} pour que
 * l'appelant (libération escrow / remboursement) NE marque PAS les fonds comme
 * transférés. Le reversement doit alors être traité manuellement.
 */
export async function sendPayout(input: PayoutInput): Promise<PayoutResult> {
  void input;
  throw new PaymentProviderError(
    "geniuspay",
    "Reversement automatique indisponible : l'API payout GeniusPay n'est pas " +
      "encore active. À traiter manuellement depuis l'espace admin (/admin/payouts).",
  );
}
