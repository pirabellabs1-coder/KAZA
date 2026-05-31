import "server-only";

// =============================================================================
// KAZA — Profil colocataire + matching (student_profiles, migration 00040)
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

async function loose(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

export type ColocProfileData = Record<string, unknown>;

export async function getStudentProfile(
  userId: string,
): Promise<ColocProfileData | null> {
  if (!userId) return null;
  try {
    const supabase = await loose();
    const { data } = await supabase
      .from("student_profiles")
      .select("data")
      .eq("user_id", userId)
      .maybeSingle();
    return (data?.data as ColocProfileData | undefined) ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

export interface MatchResult {
  userId: string;
  name: string;
  avatarUrl: string | null;
  university: string;
  discipline: string;
  budgetMax: string;
  bio: string;
  score: number;
  reasons: string[];
}

function s(v: unknown): string {
  return typeof v === "string" ? v : "";
}
function n(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "") return Number(v) || 0;
  return 0;
}
function arr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

/** Score de compatibilité 0-100 entre deux profils. */
function scoreMatch(
  me: ColocProfileData,
  other: ColocProfileData,
): { score: number; reasons: string[] } {
  let score = 40;
  const reasons: string[] = [];

  // Université
  if (s(me.university) && s(me.university) === s(other.university)) {
    score += 16;
    reasons.push("Même université");
  }

  // Budget proche
  const myBudget = n(me.budgetMax);
  const otherBudget = n(other.budgetMax);
  if (myBudget > 0 && otherBudget > 0) {
    const diff = Math.abs(myBudget - otherBudget);
    const ref = Math.max(myBudget, otherBudget);
    const ratio = 1 - Math.min(diff / ref, 1);
    const pts = Math.round(ratio * 16);
    score += pts;
    if (pts >= 10) reasons.push("Budget similaire");
  }

  // Rythme de sommeil
  if (s(me.sleepHabit) && s(me.sleepHabit) === s(other.sleepHabit)) {
    score += 8;
    reasons.push("Même rythme de vie");
  }

  // Tabac
  if (me.smoker === other.smoker) {
    score += 5;
  }

  // Propreté (proche)
  const cDiff = Math.abs(n(me.cleanliness) - n(other.cleanliness));
  score += Math.max(0, 6 - cDiff * 2);
  if (cDiff <= 1) reasons.push("Niveau de propreté compatible");

  // Hobbies / alimentation partagés
  const sharedHobbies = arr(me.hobbies).filter((h) => arr(other.hobbies).includes(h));
  if (sharedHobbies.length > 0) {
    score += Math.min(sharedHobbies.length * 3, 9);
    reasons.push(`${sharedHobbies.length} hobby(s) en commun`);
  }

  return { score: Math.max(0, Math.min(100, Math.round(score))), reasons };
}

export async function getStudentMatches(
  userId: string,
): Promise<MatchResult[]> {
  if (!userId) return [];
  try {
    const supabase = await loose();

    const me = await getStudentProfile(userId);
    if (!me) return [];

    const { data: profiles } = await supabase
      .from("student_profiles")
      .select("user_id, data")
      .neq("user_id", userId)
      .eq("is_public", true)
      .limit(60);
    const rows = (profiles ?? []) as Array<{
      user_id: string;
      data: ColocProfileData;
    }>;
    if (rows.length === 0) return [];

    const userIds = rows.map((r) => r.user_id);
    const { data: users } = await supabase
      .from("users")
      .select("id, first_name, last_name, profile_photo_url")
      .in("id", userIds);
    const userMap = new Map(
      ((users ?? []) as Array<{
        id: string;
        first_name: string | null;
        last_name: string | null;
        profile_photo_url: string | null;
      }>).map((u) => [u.id, u]),
    );

    const matches: MatchResult[] = rows.map((r) => {
      const { score, reasons } = scoreMatch(me, r.data ?? {});
      const u = userMap.get(r.user_id);
      const d = r.data ?? {};
      return {
        userId: r.user_id,
        name:
          `${u?.first_name ?? ""} ${u?.last_name ?? ""}`.trim() || "Étudiant",
        avatarUrl: (s(d.avatarUrl) || u?.profile_photo_url) ?? null,
        university: s(d.university),
        discipline: s(d.discipline),
        budgetMax: s(d.budgetMax),
        bio: s(d.bio),
        score,
        reasons,
      };
    });

    return matches.sort((a, b) => b.score - a.score);
  } catch {
    return [];
  }
}
