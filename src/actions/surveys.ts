"use server";
import "server-only";

// =============================================================================
// Kaabo — Surveys (Server Actions)
//
// `submitSurveyResponse` :
//   - vérifie l'auth user
//   - vérifie l'existence + activité du sondage
//   - INSERT dans `survey_responses` (anti-doublon via UNIQUE(survey_id, user_id))
//   - crédite `reward_points` via `kaza_points_transactions`
// =============================================================================

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

async function getLooseClient(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

export interface SubmitSurveyResult {
  success: boolean;
  error?: string;
  pointsAwarded?: number;
}

// Les réponses sont libres (scale → number, choice/text → string). On
// valide juste qu'on a un objet sérialisable JSON et au moins une réponse.
const submitSchema = z.object({
  surveyId: z.string().uuid("Sondage invalide."),
  answers: z
    .record(z.string(), z.union([z.string(), z.number()]))
    .refine((v) => Object.keys(v).length > 0, {
      message: "Aucune réponse fournie.",
    }),
});

export interface SubmitSurveyInput {
  surveyId: string;
  answers: Record<string, string | number>;
}

/**
 * Enregistre la réponse de l'utilisateur courant au sondage. Empêche les
 * doublons via la contrainte SQL UNIQUE(survey_id, user_id).
 * Crédite `survey.reward_points` au user en cas de succès.
 */
export async function submitSurveyResponse(
  input: SubmitSurveyInput,
): Promise<SubmitSurveyResult> {
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides.",
    };
  }

  const supabase = await getLooseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Vous devez être connecté." };
  }

  // 1) Vérifie le sondage
  const { data: survey, error: surveyErr } = await supabase
    .from("surveys")
    .select("id, active, reward_points, title")
    .eq("id", parsed.data.surveyId)
    .maybeSingle();

  if (surveyErr || !survey) {
    return { success: false, error: "Sondage introuvable." };
  }

  const row = survey as {
    id: string;
    active: boolean;
    reward_points: number | null;
    title: string;
  };

  if (!row.active) {
    return { success: false, error: "Ce sondage n'est plus actif." };
  }

  // 2) Anti-doublon applicatif (au cas où la contrainte SQL renvoie un
  // message peu lisible). La contrainte UNIQUE reste la dernière ligne
  // de défense.
  const { data: existing } = await supabase
    .from("survey_responses")
    .select("id")
    .eq("survey_id", parsed.data.surveyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return {
      success: false,
      error: "Vous avez déjà répondu à ce sondage.",
    };
  }

  // 3) Insert réponse
  const { error: insertErr } = await supabase.from("survey_responses").insert({
    survey_id: parsed.data.surveyId,
    user_id: user.id,
    answers: parsed.data.answers,
  });

  if (insertErr) {
    // 23505 = unique_violation → réponse déjà soumise (concurrent)
    if ((insertErr as { code?: string }).code === "23505") {
      return {
        success: false,
        error: "Vous avez déjà répondu à ce sondage.",
      };
    }
    return {
      success: false,
      error: "Impossible d'enregistrer votre réponse.",
    };
  }

  // 4) Crédite les points
  const pointsAwarded = row.reward_points ?? 0;
  if (pointsAwarded > 0) {
    await supabase.from("kaza_points_transactions").insert({
      user_id: user.id,
      type: "ADMIN_ADJUSTMENT",
      amount: pointsAwarded,
      description: `Sondage complété : ${row.title}`,
      metadata: { survey_id: row.id },
    });
  }

  revalidatePath("/surveys");
  revalidatePath("/dashboard");

  return { success: true, pointsAwarded };
}
