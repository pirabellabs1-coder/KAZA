import "server-only";

import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { geniuspayClient } from "@/lib/payments/geniuspay";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeReleaseDate, holdInEscrow } from "@/lib/escrow";
import { redeemPromoOnComplete } from "@/lib/payments/redeem-on-complete";
import { activatePaidSubscription } from "@/lib/subscriptions/activate";
import { activatePaidBoost } from "@/lib/boosts/activate";
import { creditWalletTopUp } from "@/lib/wallet/credit";
import { settleExpenseShareFromPayment } from "@/lib/expenses/settle";

// =============================================================================
// Webhook GeniusPay
// =============================================================================
// Sécurité :
// - Vérifie la signature HMAC-SHA256 : HMAC(timestamp + "." + body, secret)
//   via les headers x-webhook-signature / x-webhook-timestamp (+ anti-rejeu 5 min)
// - Idempotent : si le paiement est déjà dans un état final → 200 sans retraiter
// - 401 si signature invalide
// =============================================================================

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const FINAL_STATUSES = new Set(["COMPLETED", "FAILED", "REFUNDED"]);

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-webhook-signature") ?? "";
  const timestamp = req.headers.get("x-webhook-timestamp") ?? "";
  const rawBody = await req.text();

  // 1) Vérification de signature (HMAC sur timestamp + "." + body).
  if (!geniuspayClient.verifyWebhookSignature(rawBody, signature, timestamp)) {
    console.warn("[webhook:geniuspay] signature invalide");
    return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
  }

  // 2) Parsing JSON.
  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  let event;
  try {
    event = geniuspayClient.parseWebhookEvent(parsedBody);
  } catch (err) {
    console.error("[webhook:geniuspay] parse echec:", err);
    return NextResponse.json({ error: "Evenement invalide" }, { status: 400 });
  }

  // 3) Lookup paiement par transaction_id (= reference GeniusPay).
  const admin = createAdminClient();
  const { data: payment, error: lookupErr } = await (
    admin as unknown as SupabaseClient
  )
    .from("payments")
    .select(
      "id, rental_id, status, user_id, amount, purpose, subscription_plan, metadata",
    )
    .eq("transaction_id", event.paymentId)
    .single();

  if (lookupErr || !payment) {
    console.warn(
      `[webhook:geniuspay] paiement introuvable (ref=${event.paymentId})`,
    );
    return NextResponse.json({ received: true, ignored: true });
  }

  // 4) Idempotence.
  if (FINAL_STATUSES.has(payment.status)) {
    return NextResponse.json({ received: true, idempotent: true });
  }

  // 5) Mise à jour selon le statut.
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

  if (newStatus === "COMPLETED") {
    await redeemPromoOnComplete(event, payment.user_id, admin);

    const p = payment as unknown as {
      purpose?: string;
      subscription_plan?: string | null;
      amount?: number;
      metadata?: Record<string, unknown> | null;
    };

    // Abonnement payé par moyen de paiement.
    if (p.purpose === "SUBSCRIPTION" && p.subscription_plan) {
      try {
        await activatePaidSubscription(admin, {
          userId: payment.user_id,
          plan: p.subscription_plan,
          amountFcfa: Number(p.amount ?? 0),
          paymentMethod: "mobile_money",
        });
      } catch (err) {
        console.error("[webhook:geniuspay] activation abonnement echec:", err);
      }
    }

    // Boost d'annonce payé par moyen de paiement.
    if (p.purpose === "BOOST" && p.metadata) {
      const m = p.metadata as {
        property_id?: string;
        plan?: string;
        days?: number;
      };
      if (m.property_id && m.plan) {
        try {
          await activatePaidBoost(admin as unknown as SupabaseClient, {
            userId: payment.user_id,
            propertyId: m.property_id,
            plan: m.plan,
            days: Number(m.days ?? 7),
            amountFcfa: Number(p.amount ?? 0),
            paymentId: payment.id,
          });
        } catch (err) {
          console.error("[webhook:geniuspay] activation boost echec:", err);
        }
      }
    }

    // Recharge wallet payée par Mobile Money.
    if (p.purpose === "WALLET_TOPUP") {
      try {
        await creditWalletTopUp(admin as unknown as SupabaseClient, {
          userId: payment.user_id,
          amountFcfa: Number(p.amount ?? 0),
          paymentId: payment.id,
        });
      } catch (err) {
        console.error("[webhook:geniuspay] credit wallet echec:", err);
      }
    }

    // Frais partagés colocation.
    if (p.purpose === "EXPENSE_SHARE" && p.metadata) {
      const m = p.metadata as { share_id?: string; paid_by?: string | null };
      if (m.share_id) {
        try {
          await settleExpenseShareFromPayment(
            admin as unknown as SupabaseClient,
            {
              shareId: m.share_id,
              paidBy: m.paid_by ?? null,
              amountFcfa: Number(p.amount ?? 0),
              paymentId: payment.id,
            },
          );
        } catch (err) {
          console.error("[webhook:geniuspay] settle frais partages echec:", err);
        }
      }
    }

    // Paiement de loyer / réservation → escrow.
    if (payment.rental_id) {
      try {
        const releaseDate = computeReleaseDate(new Date());
        await holdInEscrow(payment.id, releaseDate);
      } catch (err) {
        console.error("[webhook:geniuspay] escrow echec:", err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
