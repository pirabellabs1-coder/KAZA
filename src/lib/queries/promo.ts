import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

// =============================================================================
// Kaabo — Codes promo (server-side queries)
//
// Branche les tables `promo_codes` et `promo_redemptions` (migration 00028).
// Validation d'un code (fenêtre de validité, quotas globaux / par utilisateur,
// périmètre) et calcul du montant remisé. Aucune écriture ici : la création de
// `promo_redemptions` se fait côté server action après paiement effectif.
// =============================================================================

// Les tables `promo_codes` / `promo_redemptions` ne sont pas (encore) typées
// dans `src/types/supabase.ts` — on retombe sur le client générique, comme
// pour `subscriptions.ts` et `careers.ts`.
async function getLooseClient(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

// ---------------------------------------------------------------------------
// Types publics
// ---------------------------------------------------------------------------

export type PromoDiscountType = "PERCENT" | "FIXED";
export type PromoContext = "BOOST" | "SUBSCRIPTION" | "RESERVATION";
export type PromoAppliesTo = "ALL" | PromoContext;

export interface PromoValidationResult {
  valid: boolean;
  /** Code machine de l'échec (ex. EXPIRED, MAX_USES_REACHED) si `valid` faux. */
  reason?: string;
  promoId?: string;
  discountType?: PromoDiscountType;
  discountValue?: number;
}

interface PromoRow {
  id: string;
  code: string;
  discount_type: PromoDiscountType;
  discount_value: number | string;
  applies_to: PromoAppliesTo;
  max_uses: number | null;
  used_count: number | null;
  per_user_limit: number | null;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
}

// ---------------------------------------------------------------------------
// validatePromoCode — vérifie qu'un code est utilisable ici et maintenant
// ---------------------------------------------------------------------------

/**
 * Valide un code promo pour un contexte donné.
 *
 * Vérifie, dans l'ordre :
 *   1. existence du code (uppercase + trim)
 *   2. `is_active`
 *   3. fenêtre `valid_from` / `valid_until` par rapport à `now`
 *   4. quota global `used_count < max_uses` (null = illimité)
 *   5. périmètre `applies_to === 'ALL'` ou `applies_to === context`
 *   6. quota par utilisateur `per_user_limit` (si `userId` fourni)
 *
 * @returns `{ valid, reason?, promoId?, discountType?, discountValue? }`
 */
export async function validatePromoCode(
  code: string,
  context: PromoContext,
  userId?: string,
): Promise<PromoValidationResult> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return { valid: false, reason: "EMPTY" };
  }

  const supabase = await getLooseClient();

  const { data, error } = await supabase
    .from("promo_codes")
    .select(
      "id, code, discount_type, discount_value, applies_to, max_uses, used_count, per_user_limit, valid_from, valid_until, is_active",
    )
    .eq("code", normalized)
    .maybeSingle();

  if (error) {
    console.error("[promo] validatePromoCode:", error.message);
    return { valid: false, reason: "INTERNAL" };
  }

  const promo = data as PromoRow | null;
  if (!promo) {
    return { valid: false, reason: "NOT_FOUND" };
  }

  // 2) actif ?
  if (!promo.is_active) {
    return { valid: false, reason: "INACTIVE" };
  }

  // 3) fenêtre de validité
  const now = Date.now();
  if (promo.valid_from && new Date(promo.valid_from).getTime() > now) {
    return { valid: false, reason: "NOT_YET_VALID" };
  }
  if (promo.valid_until && new Date(promo.valid_until).getTime() < now) {
    return { valid: false, reason: "EXPIRED" };
  }

  // 4) quota global
  const maxUses = promo.max_uses;
  const usedCount = Number(promo.used_count ?? 0);
  if (maxUses != null && usedCount >= maxUses) {
    return { valid: false, reason: "MAX_USES_REACHED" };
  }

  // 5) périmètre
  if (promo.applies_to !== "ALL" && promo.applies_to !== context) {
    return { valid: false, reason: "WRONG_SCOPE" };
  }

  // 6) quota par utilisateur
  if (userId) {
    const perUserLimit = promo.per_user_limit ?? 1;
    if (perUserLimit > 0) {
      const { count, error: countError } = await supabase
        .from("promo_redemptions")
        .select("id", { count: "exact", head: true })
        .eq("promo_id", promo.id)
        .eq("user_id", userId);

      if (countError) {
        console.error("[promo] count redemptions:", countError.message);
        return { valid: false, reason: "INTERNAL" };
      }
      if ((count ?? 0) >= perUserLimit) {
        return { valid: false, reason: "PER_USER_LIMIT_REACHED" };
      }
    }
  }

  return {
    valid: true,
    promoId: promo.id,
    discountType: promo.discount_type,
    discountValue: Number(promo.discount_value),
  };
}

// ---------------------------------------------------------------------------
// computeDiscount — montant remisé pour un panier donné
// ---------------------------------------------------------------------------

/**
 * Calcule le montant remisé (jamais supérieur au montant de départ).
 *   - PERCENT : `amount * value / 100`, arrondi à l'entier
 *   - FIXED   : `min(value, amount)`
 * Le résultat est borné à `[0, amount]`.
 */
export function computeDiscount(
  amount: number,
  discountType: PromoDiscountType,
  discountValue: number,
): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  if (!Number.isFinite(discountValue) || discountValue <= 0) return 0;

  let discount: number;
  if (discountType === "PERCENT") {
    discount = Math.round((amount * discountValue) / 100);
  } else {
    discount = Math.min(discountValue, amount);
  }

  // Borne finale : jamais négatif, jamais supérieur au montant.
  return Math.max(0, Math.min(Math.round(discount), Math.round(amount)));
}

// ---------------------------------------------------------------------------
// Libellés humains des raisons de refus (réutilisable côté UI)
// ---------------------------------------------------------------------------

export const PROMO_REASON_LABELS: Record<string, string> = {
  EMPTY: "Veuillez saisir un code promo.",
  NOT_FOUND: "Ce code promo n'existe pas.",
  INACTIVE: "Ce code promo n'est plus actif.",
  NOT_YET_VALID: "Ce code promo n'est pas encore valable.",
  EXPIRED: "Ce code promo a expiré.",
  MAX_USES_REACHED: "Ce code promo a atteint son nombre maximal d'utilisations.",
  WRONG_SCOPE: "Ce code promo ne s'applique pas à cette opération.",
  PER_USER_LIMIT_REACHED: "Vous avez déjà utilisé ce code promo.",
  INTERNAL: "Impossible de vérifier ce code pour le moment.",
};

export function promoReasonLabel(reason?: string): string {
  if (!reason) return "Code promo invalide.";
  return PROMO_REASON_LABELS[reason] ?? "Code promo invalide.";
}
