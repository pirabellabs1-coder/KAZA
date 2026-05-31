"use server";

import "server-only";

// =============================================================================
// KAZA — Persistance du profil colocataire (table student_profiles, migr 00040)
// =============================================================================

import { revalidatePath } from "next/cache";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface ActionResult {
  success: boolean;
  error?: string;
}

/**
 * Enregistre (upsert) le profil colocataire de l'étudiant courant. `profile`
 * est l'objet complet du formulaire, stocké tel quel en JSONB. On extrait
 * `university` et `budget_max` pour le filtrage/matching.
 */
export async function upsertStudentProfile(
  profile: Record<string, unknown>,
): Promise<ActionResult> {
  const user = await getCurrentDisplayUser();
  if (!user) return { success: false, error: "Vous devez être connecté." };

  const supabase = (await createClient()) as unknown as SupabaseClient;

  const university =
    typeof profile.university === "string" ? profile.university : null;
  const budgetRaw = profile.budgetMax;
  const budgetMax =
    typeof budgetRaw === "string" && budgetRaw.trim() !== ""
      ? Number(budgetRaw)
      : typeof budgetRaw === "number"
        ? budgetRaw
        : null;

  const { error } = await supabase.from("student_profiles").upsert(
    {
      user_id: user.id,
      data: profile,
      university,
      budget_max: Number.isFinite(budgetMax) ? budgetMax : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) return { success: false, error: error.message };

  revalidatePath("/student/profile-coloc");
  revalidatePath("/student/matches");
  return { success: true };
}
