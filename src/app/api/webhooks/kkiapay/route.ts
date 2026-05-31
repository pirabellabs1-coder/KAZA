import "server-only";

import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { kkiapayClient } from "@/lib/payments/kkiapay";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeReleaseDate, holdInEscrow } from "@/lib/escrow";
import { redeemPromoOnComplete } from "@/lib/payments/redeem-on-complete";
import { activatePaidSubscription } from "@/lib/subscriptions/activate";

// =============================================================================
// Webhook Kkiapay
// =============================================================================
// Securite:
// - Verifie la signature HMAC SHA-256 (header `x-kkiapay-signature`)
// - Idempotent
// - 401 si signature invalide
// =============================================================================

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const FINAL_STATUSES = new Set(["COMPLETED", "FAILED", "REFUNDED"]);

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-kkiapay-signature") ?? "";
  const rawBody = await req.text();

  if (!kkiapayClient.verifyWebhookSignature(rawBody, signature)) {
    console.warn("[webhook:kkiapay] signature invalide");
    return NextResponse.json(
      { error: "Signature invalide" },
      { status: 401 }
    );
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: "Corps JSON invalide" },
      { status: 400 }
    );
  }

  let event;
  try {
    event = kkiapayClient.parseWebhookEvent(parsedBody);
  } catch (err) {
    console.error("[webhook:kkiapay] parse echec:", err);
    return NextResponse.json(
      { error: "Evenement invalide" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: payment, error: lookupErr } = await (
    admin as unknown as SupabaseClient
  )
    .from("payments")
    .select(
      "id, rental_id, status, user_id, amount, purpose, subscription_plan",
    )
    .eq("transaction_id", event.paymentId)
    .single();

  if (lookupErr || !payment) {
    console.warn(
      `[webhook:kkiapay] paiement introuvable (tx=${event.paymentId})`
    );
    return NextResponse.json({ received: true, ignored: true });
  }

  if (FINAL_STATUSES.has(payment.status)) {
    return NextResponse.json({ received: true, idempotent: true });
  }

  const now = new Date().toISOString();
  let newStatus: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REFUNDED" =
    "PENDING";

  switch (event.status) {
    case "succeeded":
      newStatus = "COMPLETED";
      break;
    case "failed":
      newStatus = "FAILED";
      break;
    case "refunded":
      newStatus = "REFUNDED";
      break;
    case "processing":
      newStatus = "PROCESSING";
      break;
    default:
      newStatus = "PENDING";
  }

  await admin
    .from("payments")
    .update({
      status: newStatus,
      payment_date: newStatus === "COMPLETED" ? now : null,
    })
    .eq("id", payment.id);

  // Code promo : redemption UNIQUEMENT au passage COMPLETED. Idempotence
  // garantie par le garde `FINAL_STATUSES` (paiement final = jamais retraite).
  // Best-effort : un echec ici ne casse pas le traitement du paiement.
  if (newStatus === "COMPLETED") {
    await redeemPromoOnComplete(event, payment.user_id, admin);

    const p = payment as unknown as {
      purpose?: string;
      subscription_plan?: string | null;
      amount?: number;
    };
    if (p.purpose === "SUBSCRIPTION" && p.subscription_plan) {
      try {
        await activatePaidSubscription(admin, {
          userId: payment.user_id,
          plan: p.subscription_plan,
          amountFcfa: Number(p.amount ?? 0),
          paymentMethod: "mobile_money",
        });
      } catch (err) {
        console.error("[webhook:kkiapay] activation abonnement echec:", err);
      }
    }
  }

  // Kkiapay envoie `payment.success` ou similaire en cas d'approbation.
  if (
    (event.status === "succeeded" ||
      event.type.toLowerCase().includes("success")) &&
    payment.rental_id
  ) {
    try {
      const releaseDate = computeReleaseDate(new Date());
      await holdInEscrow(payment.id, releaseDate);
    } catch (err) {
      console.error("[webhook:kkiapay] escrow echec:", err);
    }
  }

  return NextResponse.json({ received: true });
}
