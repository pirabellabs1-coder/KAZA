import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

// =============================================================================
// Kaabo — Subscriptions & Invoices (server-side queries)
//
// Branche les tables `subscriptions` et `invoices` (migration
// 00011_subscriptions.sql). Catalogue PLAN_DETAILS partagé entre la facturation
// agence, la page Plus et la page Pricing publique.
// =============================================================================

// Les nouvelles tables `subscriptions` / `invoices` ne sont pas encore typées
// dans `src/types/supabase.ts` — on retombe sur le client générique comme dans
// `owner-activity.ts` et `tenant-activity.ts`.
async function getLooseClient(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

// ---------------------------------------------------------------------------
// Types publics
// ---------------------------------------------------------------------------

export interface UserSubscription {
  id: string;
  plan: string;
  status: string;
  monthlyPrice: number;
  currency: string;
  startedAt: string;
  currentPeriodEnd: string;
  cancelledAt: string | null;
  paymentMethod: string | null;
}

export interface UserInvoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: string;
  issuedAt: string;
  paidAt: string | null;
  dueDate: string | null;
  description: string | null;
  paymentMethod: string | null;
  pdfUrl: string | null;
}

// ---------------------------------------------------------------------------
// Catalogue des plans (source de vérité partagée)
// ---------------------------------------------------------------------------

export interface PlanDetails {
  name: string;
  priceMonthly: number;
  priceYearly?: number;
  audience: "AGENCY" | "TENANT";
  features: string[];
}

export const PLAN_DETAILS: Record<string, PlanDetails> = {
  PRO_STARTER: {
    name: "Kaabo Pro Starter",
    priceMonthly: 5_000,
    audience: "AGENCY",
    features: [
      "50 annonces actives",
      "5 membres",
      "3 boosts/mois",
      "10 GB",
      "Support email",
    ],
  },
  PRO_PREMIUM: {
    name: "Kaabo Pro Premium",
    priceMonthly: 15_000,
    audience: "AGENCY",
    features: [
      "200 annonces actives",
      "15 membres",
      "10 boosts/mois",
      "50 GB",
      "Support prioritaire 7j/7",
      "Page agence custom",
      "Analytics export",
    ],
  },
  PRO_ELITE: {
    name: "Kaabo Pro Elite",
    priceMonthly: 30_000,
    audience: "AGENCY",
    features: [
      "Annonces illimitées",
      "Membres illimités",
      "Boosts illimités",
      "200 GB",
      "Support 24/7 dédié",
      "API access",
      'Badge "Vérifié+"',
    ],
  },
  PLUS_MONTHLY: {
    name: "Kaabo Plus Mensuel",
    priceMonthly: 5_000,
    audience: "TENANT",
    features: [
      "Alertes prioritaires",
      "Visites express",
      "Annonces premium en avant-première",
      "Conseil personnalisé",
    ],
  },
  PLUS_YEARLY: {
    name: "Kaabo Plus Annuel",
    priceMonthly: 4_167,
    priceYearly: 50_000,
    audience: "TENANT",
    features: [
      "Tout Plus Mensuel",
      "2 mois offerts",
      "Cadeau bienvenue",
      "Coach immobilier dédié",
    ],
  },
};

// Quota d'annonces actives autorisées par plan agence (0 = illimité).
export const PLAN_LISTING_QUOTA: Record<string, number> = {
  PRO_STARTER: 50,
  PRO_PREMIUM: 200,
  PRO_ELITE: 0,
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Retourne l'abonnement courant (statut TRIAL ou ACTIVE) du user, ou null.
 * Si plusieurs abonnements actifs existent (ne devrait pas arriver), on
 * renvoie le plus récent.
 */
export async function getActiveSubscription(
  userId: string,
): Promise<UserSubscription | null> {
  const supabase = await getLooseClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["TRIAL", "ACTIVE"])
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    plan: data.plan,
    status: data.status,
    monthlyPrice: Number(data.monthly_price),
    currency: data.currency,
    startedAt: data.started_at,
    currentPeriodEnd: data.current_period_end,
    cancelledAt: data.cancelled_at ?? null,
    paymentMethod: data.payment_method ?? null,
  };
}

/**
 * Liste toutes les factures d'un utilisateur, ordonnées par date d'émission
 * décroissante (la plus récente en premier).
 */
export async function listUserInvoices(userId: string): Promise<UserInvoice[]> {
  const supabase = await getLooseClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("user_id", userId)
    .order("issued_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    number: row.number,
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status,
    issuedAt: row.issued_at,
    paidAt: row.paid_at ?? null,
    dueDate: row.due_date ?? null,
    description: row.description ?? null,
    paymentMethod: row.payment_method ?? null,
    pdfUrl: row.pdf_url ?? null,
  }));
}
