import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { autoReleaseDueEscrows } from "@/lib/escrow";

// =============================================================================
// Kaabo — Cron : libération automatique des escrows arrivés à échéance
//
// GET /api/cron/release-escrow
// Crédite le wallet du propriétaire (net de commission) pour tous les
// `escrow_payments` en HELD dont `release_date <= now`, puis marque l'escrow
// RELEASED. Le propriétaire retire ensuite via le flux de retrait.
//
// Sécurité : header `Authorization: Bearer ${CRON_SECRET}` (ajouté par Vercel
// Cron) ou `?secret=` pour un déclenchement manuel.
// =============================================================================

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  return req.nextUrl.searchParams.get("secret") === secret;
}

export async function GET(req: NextRequest): Promise<Response> {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const result = await autoReleaseDueEscrows(admin);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron:release-escrow]", err);
    return NextResponse.json(
      { ok: false, error: "Échec du traitement." },
      { status: 500 }
    );
  }
}
