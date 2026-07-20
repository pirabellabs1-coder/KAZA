import "server-only";

// =============================================================================
// Kaabo — Activation d'un abonnement payé par moyen de paiement (Mobile Money).
// Réutilisé par le webhook (après paiement COMPLETED) ET par l'action quand le
// plan est gratuit. NE débite PAS le wallet (l'argent vient du provider).
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";

import { getPlan } from "@/lib/queries/plans";
import { PLAN_DETAILS } from "@/lib/queries/subscriptions";

export interface ActivateResult {
  ok: boolean;
  subscriptionId?: string;
  alreadyActive?: boolean;
  error?: string;
}

/**
 * Active un abonnement pour `userId` sur `plan`, via un client admin (service
 * role). Idempotent : si un abonnement TRIAL/ACTIVE existe déjà, ne crée rien.
 */
export async function activatePaidSubscription(
  admin: SupabaseClient,
  params: {
    userId: string;
    plan: string;
    amountFcfa: number;
    paymentMethod?: string;
  },
): Promise<ActivateResult> {
  const { userId, plan } = params;
  if (!userId || !plan) return { ok: false, error: "INVALID" };

  const paymentMethod = params.paymentMethod ?? "mobile_money";

  try {
    // Idempotence : un abonnement actif existe déjà ?
    const { data: existing } = await admin
      .from("subscriptions")
      .select("id, status")
      .eq("user_id", userId)
      .in("status", ["TRIAL", "ACTIVE"])
      .maybeSingle();
    if (existing) {
      return { ok: true, subscriptionId: existing.id, alreadyActive: true };
    }

    const planDetails = (await getPlan(plan)) ?? PLAN_DETAILS[plan];
    const priceFcfa = Number(
      params.amountFcfa || planDetails?.priceMonthly || 0,
    );
    const planName = planDetails?.name ?? plan;

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const { data: sub, error: subErr } = await admin
      .from("subscriptions")
      .insert({
        user_id: userId,
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
      return { ok: false, error: subErr?.message ?? "INSERT_FAILED" };
    }

    // Tentative de facturation tracée (succès, payée par moyen de paiement).
    await admin.from("subscription_billing_attempts").insert({
      subscription_id: sub.id,
      user_id: userId,
      amount_fcfa: priceFcfa,
      period_start: now.toISOString(),
      period_end: periodEnd.toISOString(),
      status: "SUCCESS",
      attempted_at: now.toISOString(),
    });

    // Facture PAID (alimente /settings/billing et /agency/billing).
    const invoiceNumber = `INV-${now.getFullYear()}-${Math.floor(
      Math.random() * 9000 + 1000,
    )}`;
    await admin.from("invoices").insert({
      subscription_id: sub.id,
      user_id: userId,
      number: invoiceNumber,
      amount: priceFcfa,
      currency: "XOF",
      status: "PAID",
      paid_at: now.toISOString(),
      description: `Abonnement ${planName} — ${now.toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      })}`,
      payment_method: paymentMethod,
    });

    return { ok: true, subscriptionId: sub.id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "EXCEPTION",
    };
  }
}
