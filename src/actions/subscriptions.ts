"use server";

// =============================================================================
// KAZA — Subscriptions (Server Actions)
//
// Souscription, annulation et facturation des abonnements KAZA Pro (agences)
// et KAZA Plus (locataires). Pas de Stripe pour le MVP : on suppose que le
// paiement est validé en amont par le caller (intégration FedaPay / mobile
// money à venir). `payment_method` reste un libellé texte.
// =============================================================================

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { PLAN_DETAILS } from "@/lib/queries/subscriptions";

// Les tables `subscriptions` / `invoices` ne sont pas encore typées dans
// `src/types/supabase.ts` — fallback sur le client générique.
async function getLooseClient(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

// ---------------------------------------------------------------------------
// Souscription
// ---------------------------------------------------------------------------

export interface SubscribeResult {
  success: boolean;
  error?: string;
  subscriptionId?: string;
}

/**
 * Crée un abonnement actif pour l'utilisateur courant.
 * - Annule tout abonnement TRIAL/ACTIVE existant (un user n'a qu'un seul
 *   abonnement actif à la fois)
 * - Crée la nouvelle ligne `subscriptions` avec `current_period_end = now + 30j`
 * - Émet une facture PAID associée
 */
export async function subscribeToPlan(
  plan: string,
  paymentMethod: string = "card",
): Promise<SubscribeResult> {
  const supabase = await getLooseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Non authentifié" };

  const planDetails = PLAN_DETAILS[plan];
  if (!planDetails) return { success: false, error: "Plan invalide" };

  // 1) Annule l'abonnement courant si existant
  await supabase
    .from("subscriptions")
    .update({
      status: "CANCELLED",
      cancelled_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .in("status", ["TRIAL", "ACTIVE"]);

  // 2) Crée la nouvelle souscription (active immédiatement — paiement supposé OK)
  const periodEnd = new Date();
  periodEnd.setDate(periodEnd.getDate() + 30);

  const { data: sub, error } = await supabase
    .from("subscriptions")
    .insert({
      user_id: user.id,
      plan,
      status: "ACTIVE",
      monthly_price: planDetails.priceMonthly,
      currency: "XOF",
      current_period_end: periodEnd.toISOString(),
      payment_method: paymentMethod,
    })
    .select()
    .single();

  if (error || !sub) {
    return {
      success: false,
      error: error?.message ?? "Impossible de créer l'abonnement.",
    };
  }

  // 3) Crée la facture initiale (PAID)
  const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(
    Math.random() * 9000 + 1000,
  )}`;

  await supabase.from("invoices").insert({
    subscription_id: sub.id,
    user_id: user.id,
    number: invoiceNumber,
    amount: planDetails.priceMonthly,
    currency: "XOF",
    status: "PAID",
    paid_at: new Date().toISOString(),
    description: `Abonnement ${planDetails.name} — ${new Date().toLocaleDateString(
      "fr-FR",
      { month: "long", year: "numeric" },
    )}`,
    payment_method: paymentMethod,
  });

  revalidatePath("/agency/billing");
  revalidatePath("/plus");
  revalidatePath("/pricing");
  revalidatePath("/profile");

  return { success: true, subscriptionId: sub.id };
}

// ---------------------------------------------------------------------------
// Annulation
// ---------------------------------------------------------------------------

export interface CancelResult {
  success: boolean;
  error?: string;
}

/**
 * Annule un abonnement appartenant à l'utilisateur courant.
 * Définit `status = CANCELLED` et `cancelled_at = now()`.
 * Les RLS garantissent qu'un user ne peut annuler qu'un abonnement qu'il
 * possède (ou si admin).
 */
export async function cancelSubscription(
  subscriptionId: string,
): Promise<CancelResult> {
  const supabase = await getLooseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Non authentifié" };

  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "CANCELLED",
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", subscriptionId)
    .eq("user_id", user.id);

  if (error) {
    return {
      success: false,
      error: error.message ?? "Impossible d'annuler l'abonnement.",
    };
  }

  revalidatePath("/agency/billing");
  revalidatePath("/plus");
  revalidatePath("/pricing");
  revalidatePath("/profile");

  return { success: true };
}
