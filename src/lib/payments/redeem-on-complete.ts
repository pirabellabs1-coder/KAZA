import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { redeemPromoForUser } from "@/actions/promo";
import type { WebhookEvent } from "@/lib/payments/types";

// =============================================================================
// Kaabo — Redemption d'un code promo au passage d'un paiement à COMPLETED
// =============================================================================
// Appelé EXCLUSIVEMENT par les webhooks de paiement (FedaPay / Kkiapay) lors de
// la transition PENDING → COMPLETED. À ce stade le paiement est confirmé côté
// provider : il est donc légitime de décompter le quota du code promo et
// d'enregistrer la `promo_redemptions`.
//
// IDEMPOTENCE : la transition COMPLETED est un état FINAL côté `payments`. Le
// webhook court-circuite tout retraitement d'un paiement déjà dans un état
// final (cf. `FINAL_STATUSES`), si bien que cette fonction n'est invoquée
// qu'une seule fois par paiement. `redeemPromoForUser` revalide en plus le code
// dans le contexte utilisateur (filet anti double-redemption via le quota
// `per_user_limit`).
//
// Le code promo + le montant remisé voyagent dans le `metadata` du provider
// (`promo_code` / `promo_discount`), propagé à l'initiation du paiement. En
// l'absence de code promo dans le metadata, la fonction ne fait rien.
// =============================================================================

/**
 * Enregistre la redemption du code promo associé à un paiement qui vient de
 * passer à COMPLETED. Best-effort : un échec est journalisé sans interrompre le
 * traitement du webhook (le paiement reste valide).
 *
 * @param event    Évènement webhook normalisé (porte `metadata`).
 * @param fallbackUserId  `user_id` issu de la ligne `payments` (utilisé si le
 *                        metadata provider ne contient pas `user_id`).
 * @param admin    Client Supabase admin (bypass RLS) déjà instancié par le
 *                 webhook.
 */
export async function redeemPromoOnComplete(
  event: WebhookEvent,
  fallbackUserId: string | null,
  admin: SupabaseClient,
): Promise<void> {
  const promoCode = event.metadata?.promo_code;
  if (!promoCode || !promoCode.trim()) {
    // Pas de code promo sur ce paiement → rien à faire.
    return;
  }

  const userId = event.metadata?.user_id?.trim() || fallbackUserId;
  if (!userId) {
    console.warn(
      `[webhook:${event.provider}] redemption promo impossible: user_id introuvable (tx=${event.paymentId})`,
    );
    return;
  }

  const discountRaw = event.metadata?.promo_discount;
  const discount = discountRaw ? Number(discountRaw) : 0;
  const amountDiscounted =
    Number.isFinite(discount) && discount > 0 ? discount : 0;

  try {
    const result = await redeemPromoForUser(
      promoCode,
      "RESERVATION",
      amountDiscounted,
      userId,
      admin,
    );
    if (!result.success) {
      console.error(
        `[webhook:${event.provider}] redeemPromo:`,
        result.error,
      );
    }
  } catch (err) {
    console.error(`[webhook:${event.provider}] redeemPromo exception:`, err);
  }
}
