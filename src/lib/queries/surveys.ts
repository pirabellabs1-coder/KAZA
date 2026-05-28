import "server-only";

// =============================================================================
// KAZA — Queries Surveys (server-side)
//
// Tables ciblées :
//   - public.surveys           (catalogue, JSONB questions)
//   - public.survey_responses  (1 par user/sondage)
//
// Pas encore typé dans `src/types/supabase.ts` → fallback client générique.
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types publics
// ---------------------------------------------------------------------------

export type SurveyQuestionType = "scale" | "choice" | "text";

export interface SurveyQuestion {
  id: string;
  type: SurveyQuestionType;
  question: string;
  // scale
  min?: number;
  max?: number;
  // choice
  options?: string[];
}

export interface Survey {
  id: string;
  title: string;
  description: string | null;
  questions: SurveyQuestion[];
  active: boolean;
  rewardPoints: number;
  createdAt: string;
}

export interface SurveyWithStatus extends Survey {
  answered: boolean;
  answeredAt: string | null;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  userId: string;
  answers: Record<string, string | number>;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getLooseClient(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

interface RawSurvey {
  id: string;
  title: string;
  description: string | null;
  questions: unknown;
  active: boolean;
  reward_points: number | null;
  created_at: string;
}

function coerceQuestions(value: unknown): SurveyQuestion[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((q): q is Record<string, unknown> => typeof q === "object" && q !== null)
    .map((q) => ({
      id: String(q.id ?? ""),
      type: (q.type === "scale" || q.type === "choice" || q.type === "text"
        ? q.type
        : "text") as SurveyQuestionType,
      question: String(q.question ?? ""),
      min: typeof q.min === "number" ? q.min : undefined,
      max: typeof q.max === "number" ? q.max : undefined,
      options: Array.isArray(q.options)
        ? q.options.filter((o): o is string => typeof o === "string")
        : undefined,
    }));
}

function mapSurvey(r: RawSurvey): Survey {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    questions: coerceQuestions(r.questions),
    active: r.active,
    rewardPoints: r.reward_points ?? 0,
    createdAt: r.created_at,
  };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Liste tous les sondages actifs, du plus récent au plus ancien. */
export async function listActiveSurveys(): Promise<Survey[]> {
  const supabase = await getLooseClient();
  const { data, error } = await supabase
    .from("surveys")
    .select("id, title, description, questions, active, reward_points, created_at")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as RawSurvey[]).map(mapSurvey);
}

/**
 * Liste tous les sondages actifs, enrichis du statut "déjà répondu" pour le
 * user donné. Idéal pour la page `/surveys`.
 */
export async function listSurveysWithStatus(
  userId: string,
): Promise<SurveyWithStatus[]> {
  const supabase = await getLooseClient();

  const [surveysRes, responsesRes] = await Promise.all([
    supabase
      .from("surveys")
      .select(
        "id, title, description, questions, active, reward_points, created_at",
      )
      .eq("active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("survey_responses")
      .select("survey_id, created_at")
      .eq("user_id", userId),
  ]);

  const surveys = (surveysRes.data ?? []) as RawSurvey[];
  const responses = (responsesRes.data ?? []) as Array<{
    survey_id: string;
    created_at: string;
  }>;

  const answeredMap = new Map<string, string>();
  for (const r of responses) {
    answeredMap.set(r.survey_id, r.created_at);
  }

  return surveys.map((r) => {
    const mapped = mapSurvey(r);
    const answeredAt = answeredMap.get(r.id) ?? null;
    return {
      ...mapped,
      answered: Boolean(answeredAt),
      answeredAt,
    };
  });
}

/** Indique si le user a déjà répondu au sondage donné. */
export async function hasUserAnswered(
  userId: string,
  surveyId: string,
): Promise<boolean> {
  const supabase = await getLooseClient();
  const { data } = await supabase
    .from("survey_responses")
    .select("id")
    .eq("user_id", userId)
    .eq("survey_id", surveyId)
    .maybeSingle();
  return Boolean(data);
}

/** Récupère un sondage par son id (utile pour le formulaire dédié). */
export async function getSurveyById(surveyId: string): Promise<Survey | null> {
  const supabase = await getLooseClient();
  const { data, error } = await supabase
    .from("surveys")
    .select("id, title, description, questions, active, reward_points, created_at")
    .eq("id", surveyId)
    .maybeSingle();
  if (error || !data) return null;
  return mapSurvey(data as RawSurvey);
}
