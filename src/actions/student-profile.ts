"use server";

import "server-only";

// =============================================================================
// Kaabo — Persistance du profil colocataire (table student_profiles, migr 00040)
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

// ---------------------------------------------------------------------------
// Université & emploi du temps (page /student/courses)
// ---------------------------------------------------------------------------

export interface CourseCell {
  title: string;
  prof?: string;
}

export interface StudentAcademicInput {
  university: string;
  faculty: string;
  studyYear: string;
  program: string;
  /** Grille emploi du temps : { [jour]: { [créneau]: { title, prof } } } */
  courses: Record<string, Record<string, CourseCell>>;
}

/**
 * Enregistre l'université et l'emploi du temps de l'étudiant courant. On
 * FUSIONNE dans le JSONB `data` existant pour ne pas écraser le profil
 * colocataire (budget, mode de vie, etc.) écrit par /student/profile-coloc.
 */
export async function saveStudentAcademic(
  input: StudentAcademicInput,
): Promise<ActionResult> {
  const user = await getCurrentDisplayUser();
  if (!user) return { success: false, error: "Vous devez être connecté." };

  const supabase = (await createClient()) as unknown as SupabaseClient;

  // Lecture du JSONB existant pour fusionner sans rien perdre.
  const { data: existing } = await supabase
    .from("student_profiles")
    .select("data")
    .eq("user_id", user.id)
    .maybeSingle();
  const prev =
    (existing?.data as Record<string, unknown> | undefined) ?? {};

  const merged: Record<string, unknown> = {
    ...prev,
    university: input.university,
    faculty: input.faculty,
    studyYear: input.studyYear,
    program: input.program,
    courses: input.courses,
  };

  const { error } = await supabase.from("student_profiles").upsert(
    {
      user_id: user.id,
      data: merged,
      university: input.university || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) return { success: false, error: error.message };

  revalidatePath("/student/courses");
  return { success: true };
}
