import "server-only";

// =============================================================================
// Kaabo — Quotas par plan d'abonnement (source de vérité unique).
// Utilisé pour l'enforcement : annonces actives, boosts/mois, membres d'équipe.
// `Infinity` = illimité. Aucune sous (plan null) = FREE.
// =============================================================================

export interface PlanQuotas {
  label: string;
  maxListings: number; // annonces actives (status != ARCHIVED)
  boostsPerMonth: number;
  teamMembers: number;
}

const QUOTAS: Record<string, PlanQuotas> = {
  FREE: { label: "Gratuit", maxListings: 3, boostsPerMonth: 0, teamMembers: 1 },
  PLUS_MONTHLY: {
    label: "Kaabo Plus",
    maxListings: 10,
    boostsPerMonth: 0,
    teamMembers: 1,
  },
  PLUS_YEARLY: {
    label: "Kaabo Plus",
    maxListings: 10,
    boostsPerMonth: 0,
    teamMembers: 1,
  },
  PRO_STARTER: {
    label: "Pro Starter",
    maxListings: 50,
    boostsPerMonth: 3,
    teamMembers: 5,
  },
  PRO_PREMIUM: {
    label: "Pro Premium",
    maxListings: 200,
    boostsPerMonth: 10,
    teamMembers: 15,
  },
  PRO_ELITE: {
    label: "Pro Elite",
    maxListings: Infinity,
    boostsPerMonth: Infinity,
    teamMembers: Infinity,
  },
};

/**
 * Quotas pour un code de plan (ou null/inconnu → FREE).
 */
export function getPlanQuotas(plan: string | null | undefined): PlanQuotas {
  if (!plan) return QUOTAS.FREE;
  return QUOTAS[plan] ?? QUOTAS.FREE;
}

/** Formate un quota pour l'affichage (∞ si illimité). */
export function formatQuota(value: number): string {
  return value === Infinity ? "∞" : String(value);
}
