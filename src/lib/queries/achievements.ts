import "server-only";

// =============================================================================
// Kaabo — Queries Achievements (server-side)
//
// Tables ciblées :
//   - public.achievement_definitions (catalogue immuable)
//   - public.user_achievements       (unlocks par user)
//
// Pas encore typé dans `src/types/supabase.ts` → fallback client générique.
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types publics
// ---------------------------------------------------------------------------

export type AchievementRarity = "common" | "rare" | "epic" | "legendary";

export interface AchievementDefinition {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string | null;
  category: string | null;
  pointsReward: number;
  rarity: AchievementRarity;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  progress: number;
  target: number;
  unlockedAt: string | null;
}

export interface UserAchievementWithDefinition extends AchievementDefinition {
  progress: number;
  target: number;
  unlockedAt: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getLooseClient(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

function coerceRarity(value: unknown): AchievementRarity {
  return value === "rare" || value === "epic" || value === "legendary"
    ? value
    : "common";
}

interface RawDefinition {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string | null;
  category: string | null;
  points_reward: number | null;
  rarity: string | null;
}

interface RawUserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  progress: number | null;
  target: number | null;
  unlocked_at: string | null;
}

function mapDefinition(r: RawDefinition): AchievementDefinition {
  return {
    id: r.id,
    code: r.code,
    title: r.title,
    description: r.description,
    icon: r.icon,
    category: r.category,
    pointsReward: r.points_reward ?? 0,
    rarity: coerceRarity(r.rarity),
  };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Liste le catalogue complet des achievements définis sur la plateforme,
 * trié par rareté (du commun au légendaire) puis par titre.
 */
export async function listAchievementCatalog(): Promise<AchievementDefinition[]> {
  const supabase = await getLooseClient();
  const { data, error } = await supabase
    .from("achievement_definitions")
    .select(
      "id, code, title, description, icon, category, points_reward, rarity",
    )
    .order("title", { ascending: true });

  if (error || !data) return [];
  return (data as RawDefinition[]).map(mapDefinition);
}

/**
 * Retourne la liste des achievements du user, fusionnée avec leur définition.
 * Pour chaque achievement du catalogue : on attache `unlockedAt` et la
 * `progress` si une ligne existe dans `user_achievements`, sinon null/0.
 */
export async function listUserAchievements(
  userId: string,
): Promise<UserAchievementWithDefinition[]> {
  const supabase = await getLooseClient();

  // Fetch parallèle : catalog + unlocks
  const [catalogRes, userRes] = await Promise.all([
    supabase
      .from("achievement_definitions")
      .select(
        "id, code, title, description, icon, category, points_reward, rarity",
      ),
    supabase
      .from("user_achievements")
      .select("id, user_id, achievement_id, progress, target, unlocked_at")
      .eq("user_id", userId),
  ]);

  const catalog = (catalogRes.data ?? []) as RawDefinition[];
  const unlocks = (userRes.data ?? []) as RawUserAchievement[];

  const byId = new Map<string, RawUserAchievement>(
    unlocks.map((u) => [u.achievement_id, u]),
  );

  return catalog.map((def) => {
    const ua = byId.get(def.id);
    const mapped = mapDefinition(def);
    return {
      ...mapped,
      progress: ua?.progress ?? 0,
      target: ua?.target ?? 1,
      unlockedAt: ua?.unlocked_at ?? null,
    };
  });
}

/**
 * Récupère une définition par son code public (ex: "first_login").
 * Utilisé côté server action pour vérifier l'existence avant unlock.
 */
export async function getAchievementByCode(
  code: string,
): Promise<AchievementDefinition | null> {
  const supabase = await getLooseClient();
  const { data, error } = await supabase
    .from("achievement_definitions")
    .select(
      "id, code, title, description, icon, category, points_reward, rarity",
    )
    .eq("code", code)
    .maybeSingle();
  if (error || !data) return null;
  return mapDefinition(data as RawDefinition);
}
