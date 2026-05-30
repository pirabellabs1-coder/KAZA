"use server";

import "server-only";

// =============================================================================
// KAZA — Server Actions Codes promo
//
// Admin (gardé par un check role ADMIN) :
//   - listPromoCodes()      : liste tous les codes
//   - createPromoCode(input): crée un code (validation Zod)
//   - togglePromoCode(id,..): active / désactive un code
//
// Utilisateur :
//   - applyPromoToReservation(code, amount) : VALIDE un code pour une
//     réservation et renvoie {discount,total} SANS écrire de redemption.
//   - redeemPromo(code, context, amountDiscounted) : enregistre la redemption
//     + incrémente `used_count`. À appeler APRÈS un paiement effectif.
//
// Aucun SECRET / service_role_key exposé : tout passe par le client serveur
// soumis à la RLS (write réservé aux admins, redemptions own-only).
// =============================================================================

import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import {
  validatePromoCode,
  computeDiscount,
  promoReasonLabel,
  type PromoContext,
  type PromoDiscountType,
  type PromoAppliesTo,
} from "@/lib/queries/promo";
import type { ActionResult } from "@/actions/notifications";

// Les tables `promo_codes` / `promo_redemptions` ne sont pas typées dans
// `src/types/supabase.ts` — client générique.
async function getLooseClient(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

async function requireAdmin(): Promise<ActionResult<{ userId: string }>> {
  const user = await getCurrentDisplayUser();
  if (!user) return { success: false, error: "Authentification requise." };
  if (user.role !== "ADMIN") {
    return { success: false, error: "Réservé aux administrateurs." };
  }
  return { success: true, data: { userId: user.id } };
}

// ---------------------------------------------------------------------------
// Types publics
// ---------------------------------------------------------------------------

export interface AdminPromoCode {
  id: string;
  code: string;
  description: string | null;
  discountType: PromoDiscountType;
  discountValue: number;
  appliesTo: PromoAppliesTo;
  maxUses: number | null;
  usedCount: number;
  perUserLimit: number;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface ApplyPromoResult {
  success: boolean;
  error?: string;
  /** Montant remisé (FCFA). */
  discount?: number;
  /** Nouveau total après remise (FCFA). */
  total?: number;
  /** Code normalisé (uppercase/trim) à transmettre au paiement. */
  code?: string;
  discountType?: PromoDiscountType;
  discountValue?: number;
}

// ---------------------------------------------------------------------------
// listPromoCodes (admin) — tous les codes, plus récents d'abord
// ---------------------------------------------------------------------------

export async function listPromoCodes(): Promise<AdminPromoCode[]> {
  const guard = await requireAdmin();
  if (!guard.success) return [];

  const supabase = await getLooseClient();
  const { data, error } = await supabase
    .from("promo_codes")
    .select(
      "id, code, description, discount_type, discount_value, applies_to, max_uses, used_count, per_user_limit, valid_from, valid_until, is_active, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[promo] listPromoCodes:", error.message);
    return [];
  }

  type Row = {
    id: string;
    code: string;
    description: string | null;
    discount_type: PromoDiscountType;
    discount_value: number | string;
    applies_to: PromoAppliesTo;
    max_uses: number | null;
    used_count: number | null;
    per_user_limit: number | null;
    valid_from: string | null;
    valid_until: string | null;
    is_active: boolean;
    created_at: string;
  };

  return ((data ?? []) as Row[]).map((row) => ({
    id: row.id,
    code: row.code,
    description: row.description,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    appliesTo: row.applies_to,
    maxUses: row.max_uses,
    usedCount: Number(row.used_count ?? 0),
    perUserLimit: Number(row.per_user_limit ?? 1),
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    isActive: row.is_active,
    createdAt: row.created_at,
  }));
}

// ---------------------------------------------------------------------------
// createPromoCode (admin)
// ---------------------------------------------------------------------------

const DISCOUNT_TYPES = ["PERCENT", "FIXED"] as const;
const APPLIES_TO = ["ALL", "BOOST", "SUBSCRIPTION", "RESERVATION"] as const;

const createSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "Le code doit contenir au moins 3 caractères.")
      .max(40, "Le code ne peut pas dépasser 40 caractères.")
      .regex(
        /^[A-Za-z0-9_-]+$/,
        "Le code ne peut contenir que des lettres, chiffres, tirets et underscores.",
      ),
    description: z.string().trim().max(280).optional(),
    discountType: z.enum(DISCOUNT_TYPES),
    discountValue: z.coerce
      .number()
      .positive("La valeur de la remise doit être positive."),
    appliesTo: z.enum(APPLIES_TO),
    maxUses: z.coerce
      .number()
      .int()
      .positive("Le nombre d'utilisations doit être positif.")
      .optional(),
    perUserLimit: z.coerce
      .number()
      .int()
      .min(1, "La limite par utilisateur doit être au moins 1.")
      .default(1),
    validUntil: z.string().trim().optional(),
  })
  .superRefine((val, ctx) => {
    // Une remise en pourcentage ne peut pas dépasser 100 %.
    if (val.discountType === "PERCENT" && val.discountValue > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discountValue"],
        message: "Un pourcentage ne peut pas dépasser 100 %.",
      });
    }
  });

export async function createPromoCode(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const guard = await requireAdmin();
  if (!guard.success) return { success: false, error: guard.error };
  const adminUserId = guard.data?.userId ?? null;

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides.",
    };
  }

  const v = parsed.data;

  // Normalisation de la date de fin : "YYYY-MM-DD" → fin de journée ISO.
  let validUntil: string | null = null;
  if (v.validUntil) {
    const parsedDate = new Date(`${v.validUntil}T23:59:59`);
    if (Number.isNaN(parsedDate.getTime())) {
      return { success: false, error: "Date de fin de validité invalide." };
    }
    validUntil = parsedDate.toISOString();
  }

  const supabase = await getLooseClient();
  const { data, error } = await supabase
    .from("promo_codes")
    .insert({
      code: v.code.trim().toUpperCase(),
      description: v.description?.trim() || null,
      discount_type: v.discountType,
      discount_value: v.discountValue,
      applies_to: v.appliesTo,
      max_uses: v.maxUses ?? null,
      per_user_limit: v.perUserLimit,
      valid_until: validUntil,
      is_active: true,
      created_by: adminUserId,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[promo] createPromoCode:", error?.message);
    return {
      success: false,
      error:
        error?.code === "23505"
          ? "Ce code existe déjà."
          : "Impossible de créer le code promo.",
    };
  }

  revalidatePath("/admin/promo-codes");
  return { success: true, data: { id: (data as { id: string }).id } };
}

// ---------------------------------------------------------------------------
// togglePromoCode (admin) — active / désactive
// ---------------------------------------------------------------------------

export async function togglePromoCode(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.success) return { success: false, error: guard.error };
  if (!id) return { success: false, error: "Identifiant manquant." };

  const supabase = await getLooseClient();
  const { error } = await supabase
    .from("promo_codes")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) {
    console.error("[promo] togglePromoCode:", error.message);
    return { success: false, error: "Impossible de mettre à jour le code." };
  }

  revalidatePath("/admin/promo-codes");
  return { success: true };
}

// ---------------------------------------------------------------------------
// applyPromoToReservation (user) — valide SANS enregistrer
// ---------------------------------------------------------------------------

/**
 * Valide un code promo pour une réservation et calcule la remise.
 * N'ENREGISTRE RIEN : l'écriture de la redemption se fait via `redeemPromo`
 * après confirmation du paiement.
 */
export async function applyPromoToReservation(
  code: string,
  amount: number,
): Promise<ApplyPromoResult> {
  const user = await getCurrentDisplayUser();
  if (!user) {
    return { success: false, error: "Authentification requise." };
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return { success: false, error: "Montant invalide." };
  }

  const result = await validatePromoCode(code, "RESERVATION", user.id);
  if (
    !result.valid ||
    !result.discountType ||
    result.discountValue == null
  ) {
    return { success: false, error: promoReasonLabel(result.reason) };
  }

  const discount = computeDiscount(
    amount,
    result.discountType,
    result.discountValue,
  );

  if (discount <= 0) {
    return {
      success: false,
      error: "Ce code n'apporte aucune réduction sur ce montant.",
    };
  }

  return {
    success: true,
    discount,
    total: Math.max(0, amount - discount),
    code: code.trim().toUpperCase(),
    discountType: result.discountType,
    discountValue: result.discountValue,
  };
}

// ---------------------------------------------------------------------------
// redeemPromo (user) — enregistre la redemption après paiement réussi
// ---------------------------------------------------------------------------

/**
 * Enregistre l'utilisation effective d'un code promo :
 *   1. revalide le code dans le contexte (anti double-usage / course)
 *   2. insère une ligne `promo_redemptions` (RLS : insert own)
 *   3. incrémente `used_count` du code
 *
 * À appeler uniquement après un paiement confirmé.
 */
export async function redeemPromo(
  code: string,
  context: PromoContext,
  amountDiscounted: number,
): Promise<ActionResult<{ redemptionId: string }>> {
  const user = await getCurrentDisplayUser();
  if (!user) return { success: false, error: "Authentification requise." };

  return redeemPromoForUser(code, context, amountDiscounted, user.id);
}

/**
 * Variante de {@link redeemPromo} pour les contextes SANS session (webhooks de
 * paiement, jobs). L'identifiant utilisateur est fourni explicitement et un
 * client Supabase (typiquement le client admin) peut être injecté afin de
 * contourner la RLS `insert own` qui s'appuie sur `auth.uid()`.
 *
 * IDEMPOTENCE : l'appelant DOIT garantir que cette fonction n'est invoquée
 * qu'une seule fois par paiement (le webhook ne la déclenche qu'au passage
 * PENDING → COMPLETED, état final qui court-circuite tout retraitement). En
 * filet de sécurité supplémentaire, on revalide le code dans le contexte
 * utilisateur, ce qui rejette une seconde redemption une fois le quota
 * `per_user_limit` atteint.
 *
 * À appeler uniquement après un paiement confirmé.
 */
export async function redeemPromoForUser(
  code: string,
  context: PromoContext,
  amountDiscounted: number,
  userId: string,
  client?: SupabaseClient,
): Promise<ActionResult<{ redemptionId: string }>> {
  if (!userId) return { success: false, error: "Utilisateur requis." };

  const validation = await validatePromoCode(code, context, userId);
  if (!validation.valid || !validation.promoId) {
    return { success: false, error: promoReasonLabel(validation.reason) };
  }

  const supabase = client ?? (await getLooseClient());

  const { data, error } = await supabase
    .from("promo_redemptions")
    .insert({
      promo_id: validation.promoId,
      user_id: userId,
      context,
      amount_discounted: Math.max(0, Math.round(amountDiscounted)),
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[promo] redeemPromo insert:", error?.message);
    return { success: false, error: "Impossible d'enregistrer le code promo." };
  }

  // Incrément ATOMIQUE du compteur global via RPC Postgres
  // (used_count = used_count + 1) — évite toute race condition sur le quota.
  const { error: incError } = await (
    supabase as unknown as {
      rpc: (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ error: { message: string } | null }>;
    }
  ).rpc("increment_promo_used_count", { p_id: validation.promoId });

  if (incError) {
    // La redemption est enregistrée ; on logge sans faire échouer le paiement.
    console.error("[promo] redeemPromo increment:", incError.message);
  }

  return { success: true, data: { redemptionId: (data as { id: string }).id } };
}
