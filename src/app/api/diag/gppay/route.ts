import { NextRequest, NextResponse } from "next/server";

import { geniuspayClient } from "@/lib/payments/geniuspay";

// Route de diagnostic TEMPORAIRE : exécute le vrai chemin de paiement
// (createCheckout → relais Supabase → GeniusPay) DEPUIS Vercel, pour prouver
// que la chaîne fonctionne en production. À supprimer après vérification.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("key") !== "kz-diag-7f3a9") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  try {
    const r = await geniuspayClient.createCheckout({
      amount: 1000,
      currency: "XOF",
      description: "Diagnostic chaîne paiement KAZA",
      customerEmail: "diag@kaza.africa",
      customerPhone: "+22990000000",
    });
    return NextResponse.json({
      ok: true,
      hasCheckoutUrl: !!r.checkoutUrl,
      reference: r.providerPaymentId,
      status: r.status,
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
