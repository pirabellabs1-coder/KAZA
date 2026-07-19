import "server-only";

import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { parseWebhook, verifyWebhook, getPaymentStatus } from "@/lib/payments";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  applyPaymentStatus,
  FINAL_STATUSES,
  type FulfillablePayment,
} from "@/lib/payments/fulfill";

// =============================================================================
// Webhook FeexPay
// =============================================================================
// Fiabilite :
// - Signature HMAC verifiee SI un secret est configure (FEEXPAY_WEBHOOK_SECRET).
// - Dans tous les cas, on NE fait PAS confiance au payload : le statut est
//   RE-VERIFIE aupres de l'API FeexPay (GET status) — source de verite.
// - Idempotent : si le paiement est deja dans un etat final -> 200 sans rejouer.
// =============================================================================

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const signature =
    req.headers.get("x-webhook-signature") ??
    req.headers.get("x-feexpay-signature") ??
    undefined;
  const rawBody = await req.text();

  // 1) Verification de signature (no-op si aucun secret configure).
  if (!verifyWebhook(rawBody, signature)) {
    console.warn("[webhook:feexpay] signature invalide");
    return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
  }

  // 2) Parsing.
  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  let event;
  try {
    event = parseWebhook(parsedBody, "feexpay");
  } catch (err) {
    console.error("[webhook:feexpay] parse echec:", err);
    return NextResponse.json({ error: "Evenement invalide" }, { status: 400 });
  }

  // 3) Lookup paiement par transaction_id (= reference FeexPay).
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
      `[webhook:feexpay] paiement introuvable (ref=${event.paymentId})`,
    );
    return NextResponse.json({ received: true, ignored: true });
  }

  // 4) Idempotence.
  if (FINAL_STATUSES.has((payment as { status: string }).status)) {
    return NextResponse.json({ received: true, idempotent: true });
  }

  // 5) Re-verification AUTORITAIRE via l'API statut (on ne fait pas confiance
  //    au payload du webhook).
  let authoritativeStatus = event.status;
  try {
    const verified = await getPaymentStatus(event.paymentId, "feexpay");
    authoritativeStatus = verified.status;
  } catch (err) {
    console.error("[webhook:feexpay] re-verification statut echec:", err);
    // On retombe sur le statut du payload (best-effort) plutot que d'echouer.
  }

  // 6) Application du statut + fulfillment (idempotent).
  await applyPaymentStatus(
    admin,
    payment as FulfillablePayment,
    authoritativeStatus,
    event.metadata,
  );

  return NextResponse.json({ received: true });
}
