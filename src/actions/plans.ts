"use server";
import "server-only";

// =============================================================================
// KAZA — Server Actions Plans (édition admin des tarifs d'abonnement)
//
// Met à jour la table `public.plans` (migration 00031), source de vérité des
// tarifs Pro/Plus pilotables sans redéploiement. Toutes les actions :
//   1. Vérifient que l'utilisateur courant a le rôle ADMIN
//   2. Valident l'entrée via Zod
//   3. Exécutent l'upsert (RLS autorise l'écriture pour les ADMIN)
//   4. Revalident les pages publiques de tarifs + l'admin
// =============================================================================

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";

const priceSchema = z
  .number({ error: "Prix invalide." })
  .min(0, "Le prix doit être positif ou nul.")
  .max(100_000_000, "Prix trop élevé.");

const inputSchema = z.object({
  key: z.string().min(1, "Clé de plan manquante."),
  name: z.string().min(2).max(120).optional(),
  priceMonthly: priceSchema,
  priceYearly: priceSchema.nullable().optional(),
  features: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export type UpdatePlanInput = z.infer<typeof inputSchema>;

export interface ActionResult {
  success: boolean;
  error?: string;
}

async function requireAdmin(): Promise<ActionResult> {
  const user = await getCurrentDisplayUser();
  if (!user) {
    return { success: false, error: "Authentification requise." };
  }
  if (user.role !== "ADMIN") {
    return { success: false, error: "Réservé aux administrateurs." };
  }
  return { success: true };
}

/**
 * Met à jour les tarifs / le statut d'un plan existant.
 *
 * `priceYearly` peut valoir `null` pour effacer un tarif annuel. Les champs
 * `name`, `features` et `isActive` sont optionnels : non fournis = inchangés.
 */
export async function updatePlan(input: UpdatePlanInput): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.success) return guard;

  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides.",
    };
  }

  const { key, name, priceMonthly, priceYearly, features, isActive } =
    parsed.data;

  // Construit le patch en n'incluant que les champs réellement fournis.
  const patch: Record<string, unknown> = {
    price_monthly: priceMonthly,
    updated_at: new Date().toISOString(),
  };
  if (priceYearly !== undefined) patch.price_yearly = priceYearly;
  if (name !== undefined) patch.name = name.trim();
  if (features !== undefined) patch.features = features;
  if (isActive !== undefined) patch.is_active = isActive;

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("plans")
    .update(patch)
    .eq("key", key);

  if (error) {
    console.error("[plans] updatePlan:", error.message);
    return { success: false, error: "Impossible de mettre à jour le plan." };
  }

  revalidatePath("/admin/plans");
  revalidatePath("/pricing");
  revalidatePath("/plus");
  revalidatePath("/agency/billing");

  return { success: true };
}
