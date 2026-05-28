// =============================================================================
// KAZA - Demo surveys (Wave 10)
//
// Sondages post-evenement mockes + helpers de persistance localStorage.
// SSR-safe. Aucun appel reseau.
// =============================================================================

export type SurveyTrigger =
  | "after_visit"
  | "after_first_month"
  | "after_contract_sign"
  | "after_payment"
  | "monthly_nps";

export type SurveyQuestionType = "rating" | "choice" | "text";

export interface SurveyQuestion {
  id: string;
  type: SurveyQuestionType;
  question: string;
  options?: string[]; // requis quand type = choice
  required: boolean;
  /**
   * Echelle pour les questions de type rating. Par defaut 1..5. Pour un NPS
   * on peut utiliser 1..10.
   */
  scale?: number;
}

export interface PendingSurvey {
  id: string;
  trigger: SurveyTrigger;
  title: string;
  contextLabel: string;
  triggeredAt: string; // ISO
  questions: SurveyQuestion[];
}

export interface SurveyAnswer {
  surveyId: string;
  answers: Record<string, string | number>;
  completedAt: string;
}

const PENDING_KEY = "kaza-surveys-pending";
const COMPLETED_KEY = "kaza-surveys-completed";

// Dates fixes pour le seed (rendu stable SSR)
const D_VISIT = "2026-05-25T16:00:00.000Z";
const D_MONTH = "2026-05-15T09:00:00.000Z";
const D_NPS = "2026-05-20T12:00:00.000Z";

export const SEED_SURVEYS: PendingSurvey[] = [
  {
    id: "srv-001",
    trigger: "after_visit",
    title: "Comment s'est passee votre visite ?",
    contextLabel: "Visite du 25 mai — Villa Fidjrosse",
    triggeredAt: D_VISIT,
    questions: [
      {
        id: "q1",
        type: "rating",
        question: "Comment evaluez-vous votre experience globale lors de la visite ?",
        required: true,
        scale: 5,
      },
      {
        id: "q2",
        type: "choice",
        question: "La propriete correspondait-elle a l'annonce ?",
        options: [
          "Oui, parfaitement conforme",
          "Decu, plusieurs differences",
          "Autre / je preciserai",
        ],
        required: true,
      },
      {
        id: "q3",
        type: "text",
        question: "Un commentaire a partager avec le proprietaire ?",
        required: false,
      },
      {
        id: "q4",
        type: "rating",
        question: "Recommanderiez-vous cette propriete a un proche ? (1 = jamais, 10 = absolument)",
        required: true,
        scale: 10,
      },
    ],
  },
  {
    id: "srv-002",
    trigger: "after_first_month",
    title: "1 mois apres votre emmenagement",
    contextLabel: "Appartement Akpakpa — emmenage le 15 avril 2026",
    triggeredAt: D_MONTH,
    questions: [
      {
        id: "q1",
        type: "rating",
        question: "Etes-vous satisfait(e) du logement apres un mois ?",
        required: true,
        scale: 5,
      },
      {
        id: "q2",
        type: "rating",
        question: "Qualite de la communication avec le proprietaire ?",
        required: true,
        scale: 5,
      },
      {
        id: "q3",
        type: "choice",
        question: "Avez-vous rencontre des problemes techniques ?",
        options: ["Aucun", "Mineurs (resolus)", "Importants (non resolus)"],
        required: true,
      },
      {
        id: "q4",
        type: "choice",
        question: "La procedure de signature electronique etait-elle claire ?",
        options: ["Tres claire", "Acceptable", "Difficile a suivre"],
        required: true,
      },
      {
        id: "q5",
        type: "text",
        question: "Que pourrait-on ameliorer dans votre experience KAZA ?",
        required: false,
      },
    ],
  },
  {
    id: "srv-003",
    trigger: "monthly_nps",
    title: "Satisfaction trimestrielle (NPS)",
    contextLabel: "Mai 2026 — votre avis nous interesse",
    triggeredAt: D_NPS,
    questions: [
      {
        id: "q1",
        type: "rating",
        question: "Sur une echelle de 1 a 10, recommanderiez-vous KAZA a un ami ?",
        required: true,
        scale: 10,
      },
      {
        id: "q2",
        type: "text",
        question: "Pourquoi ce score ?",
        required: false,
      },
    ],
  },
];

// =============================================================================
// Persistance localStorage
// =============================================================================

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson<T>(key: string): T | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

/**
 * Retourne les sondages en attente. Au premier appel, seed le localStorage
 * avec `SEED_SURVEYS`. En SSR, renvoie le seed directement.
 */
export function getPendingSurveys(): PendingSurvey[] {
  const stored = readJson<PendingSurvey[]>(PENDING_KEY);
  if (Array.isArray(stored)) return stored;
  if (isBrowser()) writeJson(PENDING_KEY, SEED_SURVEYS);
  return SEED_SURVEYS;
}

/** Liste l'historique des sondages completes. */
export function getCompletedSurveys(): SurveyAnswer[] {
  const stored = readJson<SurveyAnswer[]>(COMPLETED_KEY);
  return Array.isArray(stored) ? stored : [];
}

/**
 * Marque un sondage comme complete : ajoute la reponse a l'historique et
 * retire le sondage de la liste en attente.
 */
export function submitSurvey(answer: SurveyAnswer): void {
  if (!isBrowser()) return;
  const pending = getPendingSurveys().filter((s) => s.id !== answer.surveyId);
  writeJson(PENDING_KEY, pending);
  const completed = getCompletedSurveys();
  writeJson(COMPLETED_KEY, [...completed, answer]);
}

/** Retrouve un sondage complete par son id. */
export function findCompletedSurvey(surveyId: string): SurveyAnswer | undefined {
  return getCompletedSurveys().find((c) => c.surveyId === surveyId);
}

/** Retrouve la definition d'un sondage par id (utile apres soumission). */
export function findSurveyDefinition(surveyId: string): PendingSurvey | undefined {
  return SEED_SURVEYS.find((s) => s.id === surveyId);
}

/** Reinitialise au seed. */
export function resetSurveys(): void {
  if (!isBrowser()) return;
  writeJson(PENDING_KEY, SEED_SURVEYS);
  writeJson(COMPLETED_KEY, [] as SurveyAnswer[]);
}
