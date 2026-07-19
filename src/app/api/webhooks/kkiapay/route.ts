import "server-only";

import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { parseWebhook, getPaymentStatus } from "@/lib/payments";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  applyPaymentStatus,
  FINAL_STATUSES,
  type FulfillablePayment,
} from "@/lib/payments/fulfill";

// =============================================================================
// Webhook KkiaPay
// =============================================================================
// KkiaPay declenche le paiement cote client (widget) puis notifie ce webhook.
// On NE fait PAS confiance au payload : on RE-VERIFIE via l'API KkiaPay
// (POST /transactions/status). Idempotent.
//
// Securite : KkiaPay signe ses webhooks via l'en-tete `x-kkiapay-secret`
// (egal au secret webhook configure dans le dashboard). On le controle si
// KKIAPAY_WEBHOOK_SECRET est defini ; la re-verification API reste la source
// de verite dans tous les cas.
// =============================================================================

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.KKIAPAY_WEBHOOK_SECRET;
  if (webhookSecret) {
    const provided = req.headers.get("x-kkiapay-secret");
    if (provided !== webhookSecret) {
      console.warn("[webhook:kkiapay] secret webhook invalide");
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }
  }

  const rawBody = await req.text();

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  let event;
  try {
    event = parseWebhook(parsedBody, "kkiapay");
  } catch (err) {
    console.error("[webhook:kkiapay] parse echec:", err);
    return NextResponse.json({ error: "Evenement invalide" }, { status: 400 });
  }

  const admin = createAdminClient() as unknown as SupabaseClient;
  const { data: payment, error: lookupErr } = await admin
    .from("payments")
    .select(
      "id, rental_id, status, user_id, amount, purpose, subscription_plan, metadata",
    )
    .eq("transaction_id", event.paymentId)
    .single();

  if (lookupErr || !payment) {
    console.warn(
      `[webhook:kkiapay] paiement introuvable (tx=${event.paymentId})`,
    );
    return NextResponse.json({ received: true, ignored: true });
  }

  if (FINAL_STATUSES.has((payment as { status: string }).status)) {
    return NextResponse.json({ received: true, idempotent: true });
  }

  let authoritativeStatus = event.status;
  try {
    const verified = await getPaymentStatus(event.paymentId, "kkiapay");
    authoritativeStatus = verified.status;
  } catch (err) {
    console.error("[webhook:kkiapay] re-verification statut echec:", err);
  }

  await applyPaymentStatus(
    admin,
    payment as FulfillablePayment,
    authoritativeStatus,
    event.metadata,
  );

  return NextResponse.json({ received: true });
}
