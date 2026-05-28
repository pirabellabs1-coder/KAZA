"use server";
import "server-only";

// =============================================================================
// KAZA — Achievements (Server Actions)
//
// `unlockAchievement` :
//   - vérifie l'existence du code dans `achievement_definitions`
//   - INSERT (ou UPSERT) dans `user_achievements` avec `unlocked_at = now()`
//   - crédite les points correspondants dans `kaza_points_transactions`
//     (le trigger DB met à jour `kaza_points_balance` automatiquement)
//   - idempotent : si l'achievement est déjà unlocked, retourne success sans
//     re-créditer de points (anti-farming)
// =============================================================================

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { getAchievementByCode } from "@/lib/queries/achievements";

async function getLooseClient(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

export interface UnlockAchievementResult {
  success: boolean;
  error?: string;
  alreadyUnlocked?: boolean;
  pointsAwarded?: number;
}

/**
 * Débloque l'achievement `code` pour le user `userId` et crédite les points
 * correspondants. Idempotent : si la ligne existe déjà avec `unlocked_at`
 * non null, retourne `alreadyUnlocked: true` sans toucher au solde de points.
 *
 * Utilisable depuis une autre server action (ex: après une création de
 * propriété, on appelle `unlockAchievement(userId, "first_property")`).
 */
export async function unlockAchievement(
  userId: string,
  code: string,
): Promise<UnlockAchievementResult> {
  if (!userId || !code) {
    return { success: false, error: "Paramètres manquants." };
  }

  const definition = await getAchievementByCode(code);
  if (!definition) {
    return { success: false, error: `Achievement inconnu : ${code}.` };
  }

  const supabase = await getLooseClient();

  // 1) Lookup d'une éventuelle ligne existante
  const { data: existing } = await supabase
    .from("user_achievements")
    .select("id, unlocked_at")
    .eq("user_id", userId)
    .eq("achievement_id", definition.id)
    .maybeSingle();

  const existingRow = existing as { id: string; unlocked_at: string | null } | null;

  if (existingRow?.unlocked_at) {
    // Déjà débloqué : on ne re-crédite pas les points.
    return {
      success: true,
      alreadyUnlocked: true,
      pointsAwarded: 0,
    };
  }

  const nowIso = new Date().toISOString();

  // 2) Insert ou update (upsert manuel — la table a UNIQUE(user_id, achievement_id))
  if (existingRow) {
    const { error: updErr } = await supabase
      .from("user_achievements")
      .update({ unlocked_at: nowIso, progress: 1, target: 1 })
      .eq("id", existingRow.id);
    if (updErr) {
      return { success: false, error: "Impossible de débloquer le badge." };
    }
  } else {
    const { error: insErr } = await supabase
      .from("user_achievements")
      .insert({
        user_id: userId,
        achievement_id: definition.id,
        progress: 1,
        target: 1,
        unlocked_at: nowIso,
      });
    if (insErr) {
      return { success: false, error: "Impossible de débloquer le badge." };
    }
  }

  // 3) Crédite les points (le trigger met à jour kaza_points_balance)
  if (definition.pointsReward > 0) {
    await supabase.from("kaza_points_transactions").insert({
      user_id: userId,
      type: "ADMIN_ADJUSTMENT",
      amount: definition.pointsReward,
      description: `Badge débloqué : ${definition.title}`,
      metadata: { achievement_code: definition.code },
    });
  }

  revalidatePath("/achievements");
  revalidatePath("/dashboard");

  return {
    success: true,
    pointsAwarded: definition.pointsReward,
  };
}

/**
 * Met à jour la progression d'un achievement sans nécessairement le débloquer.
 * Utile pour les badges progressifs (ex: "5 visites effectuées").
 * Si `progress >= target`, l'achievement est automatiquement débloqué via
 * `unlockAchievement`.
 */
export async function updateAchievementProgress(
  userId: string,
  code: string,
  progress: number,
  target: number,
): Promise<UnlockAchievementResult> {
  if (!userId || !code) {
    return { success: false, error: "Paramètres manquants." };
  }

  const definition = await getAchievementByCode(code);
  if (!definition) {
    return { success: false, error: `Achievement inconnu : ${code}.` };
  }

  const supabase = await getLooseClient();

  // Si déjà débloqué : no-op
  const { data: existing } = await supabase
    .from("user_achievements")
    .select("id, unlocked_at")
    .eq("user_id", userId)
    .eq("achievement_id", definition.id)
    .maybeSingle();

  const existingRow = existing as { id: string; unlocked_at: string | null } | null;

  if (existingRow?.unlocked_at) {
    return { success: true, alreadyUnlocked: true, pointsAwarded: 0 };
  }

  // Si la progression atteint la cible → unlock complet
  if (progress >= target) {
    return unlockAchievement(userId, code);
  }

  if (existingRow) {
    await supabase
      .from("user_achievements")
      .update({ progress, target })
      .eq("id", existingRow.id);
  } else {
    await supabase.from("user_achievements").insert({
      user_id: userId,
      achievement_id: definition.id,
      progress,
      target,
      unlocked_at: null,
    });
  }

  revalidatePath("/achievements");
  return { success: true, pointsAwarded: 0 };
}
