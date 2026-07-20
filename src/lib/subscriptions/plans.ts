// =============================================================================
// Kaabo — Catalogue des plans d'abonnement (wallet-based billing)
//
// Source de vérité pour les plans wallet-based MVP. Le catalogue historique
// `PLAN_DETAILS` (cf. `src/lib/queries/subscriptions.ts`) reste utilisé par la
// page Pricing publique et la facturation agence ; ce module sert de référence
// pour le nouveau flux de débit wallet (subscription_billing_attempts).
// =============================================================================

export type SubscriptionPlanKey = "STARTER" | "PRO" | "PRO_PLUS" | "AGENCY";

export interface SubscriptionPlan {
  key: SubscriptionPlanKey;
  name: string;
  monthlyPriceFcfa: number;
  description: string;
  features: string[];
  target: "OWNER" | "OWNER_PRO" | "AGENCY";
}

export const PLANS: Record<SubscriptionPlanKey, SubscriptionPlan> = {
  STARTER: {
    key: "STARTER",
    name: "Starter",
    monthlyPriceFcfa: 0,
    description: "Pour démarrer",
    features: ["1 annonce active", "Stats de base", "Support email"],
    target: "OWNER",
  },
  PRO: {
    key: "PRO",
    name: "Pro",
    monthlyPriceFcfa: 2000,
    description: "Pour propriétaires actifs",
    features: [
      "10 annonces actives",
      "Analytics complet",
      "Boosts mensuels inclus",
      "Support prioritaire",
    ],
    target: "OWNER_PRO",
  },
  PRO_PLUS: {
    key: "PRO_PLUS",
    name: "Pro+",
    monthlyPriceFcfa: 5000,
    description: "Pour pros du locatif",
    features: [
      "Annonces illimitées",
      "Toutes features Pro",
      "Concierge dédié",
      "Outils fiscaux",
    ],
    target: "OWNER_PRO",
  },
  AGENCY: {
    key: "AGENCY",
    name: "Agency",
    monthlyPriceFcfa: 9900,
    description: "Pour agences immo",
    features: [
      "Multi-utilisateurs équipe",
      "CRM leads intégré",
      "Marque blanche",
      "Account manager",
    ],
    target: "AGENCY",
  },
};

export function getPlan(key: SubscriptionPlanKey): SubscriptionPlan {
  return PLANS[key];
}
