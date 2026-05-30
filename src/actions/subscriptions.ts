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
 * Crée un abonnement actif pour l'utilisateur courant en débitant son wallet KAZA.
 *
 * Flow wallet-based MVP :
 *  1) Refuse si abonnement TRIAL/ACTIVE déjà présent (ALREADY_SUBSCRIBED)
 *  2) Vérifie le solde wallet (INSUFFICIENT_FUNDS si payant et solde < prix)
 *  3) Crée la ligne `subscriptions` avec `current_period_end = now + 30j`
 *  4) Si payant : insère un `wallet_transactions` négatif (le trigger
 *     `on_wallet_tx_insert` met à jour `user_wallets.balance_fcfa` /
 *     `total_out_fcfa`), puis insère un `subscription_billing_attempts` SUCCESS
 *  5) Émet une facture PAID associée (legacy, conservé pour la page billing)
 */
export async function subscribeToPlan(
  plan: string,
  paymentMethod: string = "wallet",
): Promise<SubscribeResult> {
  const supabase = await getLooseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "NOT_AUTHENTICATED" };

  const planDetails = PLAN_DETAILS[plan];
  if (!planDetails) return { success: false, error: "INTERNAL" };

  // 1) Refuse si l'utilisateur a déjà un abonnement TRIAL/ACTIVE
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id, status")
    .eq("user_id", user.id)
    .in("status", ["TRIAL", "ACTIVE"])
    .maybeSingle();

  if (existing) {
    return { success: false, error: "ALREADY_SUBSCRIBED" };
  }

  // 2) Vérifie le solde wallet (skip si plan gratuit)
  const priceFcfa = Number(planDetails.priceMonthly);
  if (priceFcfa > 0) {
    const { data: wallet } = await supabase
      .from("user_wallets")
      .select("balance_fcfa")
      .eq("user_id", user.id)
      .maybeSingle();

    const balance = Number(wallet?.balance_fcfa ?? 0);
    if (balance < priceFcfa) {
      return { success: false, error: "INSUFFICIENT_FUNDS" };
    }
  }

  // 3) Crée la nouvelle souscription (active immédiatement)
  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const { data: sub, error: subErr } = await supabase
    .from("subscriptions")
    .insert({
      user_id: user.id,
      plan,
      status: "ACTIVE",
      monthly_price: priceFcfa,
      currency: "XOF",
      started_at: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      payment_method: paymentMethod,
    })
    .select("id")
    .single();

  if (subErr || !sub) {
    return {
      success: false,
      error: subErr?.message ?? "INTERNAL",
    };
  }

  // 4) Si payant : débit wallet + trace billing_attempt SUCCESS
  if (priceFcfa > 0) {
    const periodLabel = `${now.toLocaleDateString("fr-FR")} → ${periodEnd.toLocaleDateString("fr-FR")}`;

    // Insertion d'une wallet_transactions négative — le trigger
    // `on_wallet_tx_insert` met à jour balance_fcfa et total_out_fcfa.
    const { data: tx } = await supabase
      .from("wallet_transactions")
      .insert({
        user_id: user.id,
        type: "SUBSCRIPTION_DEBIT",
        amount_fcfa: -priceFcfa,
        description: `Abonnement ${planDetails.name} — période ${periodLabel}`,
        reference_id: sub.id,
      })
      .select("id")
      .single();

    await supabase.from("subscription_billing_attempts").insert({
      subscription_id: sub.id,
      user_id: user.id,
      amount_fcfa: priceFcfa,
      period_start: now.toISOString(),
      period_end: periodEnd.toISOString(),
      status: "SUCCESS",
      attempted_at: now.toISOString(),
      wallet_tx_id: tx?.id ?? null,
    });
  }

  // 5) Facture PAID (legacy — alimente /settings/billing et /agency/billing)
  const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(
    Math.random() * 9000 + 1000,
  )}`;

  await supabase.from("invoices").insert({
    subscription_id: sub.id,
    user_id: user.id,
    number: invoiceNumber,
    amount: priceFcfa,
    currency: "XOF",
    status: "PAID",
    paid_at: now.toISOString(),
    description: `Abonnement ${planDetails.name} — ${now.toLocaleDateString(
      "fr-FR",
      { month: "long", year: "numeric" },
    )}`,
    payment_method: paymentMethod,
  });

  revalidatePath("/agency/billing");
  revalidatePath("/plus");
  revalidatePath("/pricing");
  revalidatePath("/profile");
  revalidatePath("/settings/billing");

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
