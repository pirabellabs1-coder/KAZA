import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { fedapayClient } from "@/lib/payments/fedapay";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeReleaseDate, holdInEscrow } from "@/lib/escrow";

// =============================================================================
// Webhook FedaPay
// =============================================================================
// Securite:
// - Verifie la signature HMAC SHA-256 (header `x-fedapay-signature`)
// - Idempotent: si le paiement est deja dans un etat final on retourne 200 sans
//   reprocesser
// - Renvoie 401 si signature invalide (avec log warn)
// =============================================================================

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const FINAL_STATUSES = new Set(["COMPLETED", "FAILED", "REFUNDED"]);

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-fedapay-signature") ?? "";
  const rawBody = await req.text();

  // 1) Verification de signature.
  if (!fedapayClient.verifyWebhookSignature(rawBody, signature)) {
    console.warn("[webhook:fedapay] signature invalide");
    return NextResponse.json(
      { error: "Signature invalide" },
      { status: 401 }
    );
  }

  // 2) Parsing JSON + extraction de l'evenement normalise.
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
    event = fedapayClient.parseWebhookEvent(parsedBody);
  } catch (err) {
    console.error("[webhook:fedapay] parse echec:", err);
    return NextResponse.json(
      { error: "Evenement invalide" },
      { status: 400 }
    );
  }

  // 3) Lookup payment par transaction_id (fedapay providerPaymentId).
  const admin = createAdminClient();
  const { data: payment, error: lookupErr } = await admin
    .from("payments")
    .select("id, rental_id, status")
    .eq("transaction_id", event.paymentId)
    .single();

  if (lookupErr || !payment) {
    console.warn(
      `[webhook:fedapay] paiement introuvable (tx=${event.paymentId})`
    );
    // 200 pour eviter les retries infinis du provider sur un paiement absent.
    return NextResponse.json({ received: true, ignored: true });
  }

  // 4) Idempotence: si deja dans un etat final, skip silencieusement.
  if (FINAL_STATUSES.has(payment.status)) {
    return NextResponse.json({ received: true, idempotent: true });
  }

  // 5) Mise a jour selon le statut.
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

  // 6) Si paiement approuve + rental_id present -> escrow.
  if (event.type === "transaction.approved" && payment.rental_id) {
    try {
      const releaseDate = computeReleaseDate(new Date());
      await holdInEscrow(payment.id, releaseDate);
    } catch (err) {
      console.error("[webhook:fedapay] escrow echec:", err);
      // On ne renvoie pas 500 - le paiement est valide cote provider, l'escrow
      // pourra etre reconcilie par un job ulterieur.
    }
  }

  return NextResponse.json({ received: true });
}
