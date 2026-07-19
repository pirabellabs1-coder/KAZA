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
import { createAdminClient } from "@/lib/supabase/admin";
import { createPayment } from "@/lib/payments";
import type { MomoCheckoutFields } from "@/lib/payments/types";
import { PLAN_DETAILS } from "@/lib/queries/subscriptions";
import { getPlan } from "@/lib/queries/plans";
import { activatePaidSubscription } from "@/lib/subscriptions/activate";
import { walletDebit, walletRefund } from "@/lib/wallet/spend";

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

  // Prix recalculé depuis la DB au moment du débit (source de vérité éditable
  // via /admin/plans). Fallback sur le catalogue statique si la table est
  // vide / inaccessible afin de ne jamais bloquer une souscription.
  const planDetails = (await getPlan(plan)) ?? PLAN_DETAILS[plan];
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

  const priceFcfa = Number(planDetails.priceMonthly);
  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const periodLabel = `${now.toLocaleDateString("fr-FR")} → ${periodEnd.toLocaleDateString("fr-FR")}`;
  const isWalletPayment = paymentMethod === "wallet";

  // 2) Si paiement au solde KAZA et plan payant : DÉBITE D'ABORD, de façon
  //    atomique (verrou + vérif gel/solde côté RPC SECURITY DEFINER). Sans débit
  //    réussi, on ne crée jamais la souscription → plus d'abonnement gratuit.
  let walletTxId: string | null = null;
  if (priceFcfa > 0 && isWalletPayment) {
    const debit = await walletDebit({
      userId: user.id,
      amountFcfa: priceFcfa,
      type: "SUBSCRIPTION_DEBIT",
      description: `Abonnement ${planDetails.name} — période ${periodLabel}`,
      referenceId: null,
    });
    if (!debit.ok) {
      return { success: false, error: debit.error };
    }
    walletTxId = debit.txId;
  }

  // 3) Crée la nouvelle souscription (active immédiatement). Si la création
  //    échoue APRÈS un débit réussi, on rembourse pour ne pas léser l'utilisateur.
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
    if (walletTxId) {
      await walletRefund(
        user.id,
        priceFcfa,
        `Remboursement — échec création abonnement ${planDetails.name}`,
      );
    }
    return {
      success: false,
      error: subErr?.message ?? "INTERNAL",
    };
  }

  // 4) Si payant au wallet : trace billing_attempt SUCCESS (le débit est déjà fait)
  if (priceFcfa > 0 && isWalletPayment) {
    await supabase.from("subscription_billing_attempts").insert({
      subscription_id: sub.id,
      user_id: user.id,
      amount_fcfa: priceFcfa,
      period_start: now.toISOString(),
      period_end: periodEnd.toISOString(),
      status: "SUCCESS",
      attempted_at: now.toISOString(),
      wallet_tx_id: walletTxId,
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
// Paiement d'un abonnement par MOYEN DE PAIEMENT (Mobile Money / FedaPay)
// — alternative au débit du solde wallet. Initialise un checkout provider ;
//   l'abonnement est activé par le webhook au passage du paiement à COMPLETED.
// ---------------------------------------------------------------------------

export interface CheckoutResult {
  success: boolean;
  error?: string;
  paymentId?: string;
  reference?: string;
  /** true si plan gratuit : aucun paiement, abonnement activé directement. */
  activated?: boolean;
}

export async function initiateSubscriptionCheckout(
  plan: string,
  momo: MomoCheckoutFields,
): Promise<CheckoutResult> {
  const supabase = await getLooseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "NOT_AUTHENTICATED" };

  const planDetails = (await getPlan(plan)) ?? PLAN_DETAILS[plan];
  if (!planDetails) return { success: false, error: "INTERNAL" };

  // Déjà abonné ?
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .in("status", ["TRIAL", "ACTIVE"])
    .maybeSingle();
  if (existing) return { success: false, error: "ALREADY_SUBSCRIBED" };

  const priceFcfa = Number(planDetails.priceMonthly);

  // Plan gratuit → activation directe, sans paiement.
  if (priceFcfa <= 0) {
    const admin = createAdminClient() as unknown as SupabaseClient;
    const res = await activatePaidSubscription(admin, {
      userId: user.id,
      plan,
      amountFcfa: 0,
      paymentMethod: "free",
    });
    if (!res.ok) return { success: false, error: res.error ?? "INTERNAL" };
    revalidatePath("/settings/billing");
    return { success: true, activated: true };
  }

  if (!momo?.phone?.trim() || !momo?.network) {
    return { success: false, error: "Opérateur et numéro Mobile Money requis." };
  }

  // Plan payant → paiement Mobile Money on-page.
  try {
    const result = await createPayment({
      amount: priceFcfa,
      currency: "XOF",
      description: `Abonnement ${planDetails.name}`,
      customerEmail: user.email ?? "",
      customerPhone: momo.phone,
      network: momo.network,
      countryCode: momo.countryCode ?? "BJ",
      metadata: { user_id: user.id, kind: "subscription", plan },
    });

    const admin = createAdminClient() as unknown as SupabaseClient;
    const { data: payment, error: insertErr } = await admin
      .from("payments")
      .insert({
        user_id: user.id,
        rental_id: null,
        amount: priceFcfa,
        payment_method: "MOBILE_MONEY",
        transaction_id: result.providerPaymentId,
        status: "PENDING",
        purpose: "SUBSCRIPTION",
        subscription_plan: plan,
      })
      .select("id")
      .single();
    if (insertErr || !payment) {
      console.error(
        "[subscriptions] insert payment echec:",
        insertErr?.message,
      );
      return { success: false, error: "Impossible d'initier le paiement." };
    }

    return {
      success: true,
      paymentId: payment.id,
      reference: result.providerPaymentId,
    };
  } catch (err) {
    console.error("[subscriptions] checkout echec:", err);
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Erreur lors du paiement.",
    };
  }
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
