"use server";
import "server-only";

// =============================================================================
// KAZA — Server Actions Feature Flags (upsert + toggle sur `feature_flags`)
//
// Toutes les actions :
//   1. Vérifient que l'utilisateur courant a le rôle ADMIN
//   2. Valident l'entrée via Zod
//   3. Exécutent la mutation (RLS l'autorise grâce au rôle ADMIN)
//   4. Revalident `/admin/feature-flags`
//
// Les types Supabase auto-générés ne connaissent pas encore la table
// `feature_flags` (migration 00030) : bypass via `as any`, sécurité RLS.
// =============================================================================

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";

export interface ActionResult<T = undefined> {
  success: boolean;
  data?: T;
  error?: string;
}

async function requireAdmin(): Promise<ActionResult<{ userId: string }>> {
  const user = await getCurrentDisplayUser();
  if (!user) {
    return { success: false, error: "Authentification requise." };
  }
  if (user.role !== "ADMIN") {
    return { success: false, error: "Réservé aux administrateurs." };
  }
  return { success: true, data: { userId: user.id } };
}

const upsertSchema = z.object({
  key: z
    .string()
    .trim()
    .min(3, "La clé doit faire au moins 3 caractères.")
    .max(80)
    .regex(
      /^[a-z0-9_]+$/,
      "Clé invalide (lettres minuscules, chiffres, underscores).",
    ),
  name: z.string().trim().min(2, "Le nom est requis.").max(120),
  description: z.string().trim().max(500).optional().nullable(),
  enabled: z.boolean(),
  rollout: z
    .number()
    .int()
    .min(0, "Le rollout doit être entre 0 et 100.")
    .max(100, "Le rollout doit être entre 0 et 100."),
});

type UpsertFlagInput = z.infer<typeof upsertSchema>;

// ---------------------------------------------------------------------------
// upsertFeatureFlag — crée ou met à jour un flag (clé = PK)
// ---------------------------------------------------------------------------

export async function upsertFeatureFlag(
  input: UpsertFlagInput,
): Promise<ActionResult<{ key: string }>> {
  const guard = await requireAdmin();
  if (!guard.success) return { success: false, error: guard.error };

  const parsed = upsertSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides.",
    };
  }

  const { key, name, description, enabled, rollout } = parsed.data;
  const cleanDescription = description?.trim();

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("feature_flags")
    .upsert(
      {
        key,
        name,
        description: cleanDescription && cleanDescription.length > 0 ? cleanDescription : null,
        enabled,
        rollout,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );

  if (error) {
    console.error("[feature-flags] upsertFeatureFlag:", error.message);
    return { success: false, error: "Impossible d'enregistrer le flag." };
  }

  revalidatePath("/admin/feature-flags");
  return { success: true, data: { key } };
}

// ---------------------------------------------------------------------------
// toggleFeatureFlag — active/désactive un flag existant
// ---------------------------------------------------------------------------

export async function toggleFeatureFlag(
  key: string,
  enabled: boolean,
): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.success) return { success: false, error: guard.error };

  if (!key || typeof key !== "string") {
    return { success: false, error: "Clé manquante." };
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("feature_flags")
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("key", key);

  if (error) {
    console.error("[feature-flags] toggleFeatureFlag:", error.message);
    return { success: false, error: "Impossible de modifier le flag." };
  }

  revalidatePath("/admin/feature-flags");
  return { success: true };
}
