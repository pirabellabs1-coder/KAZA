import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { completeEndedRentals } from "@/lib/rentals/end-leases";
import type { SupabaseClient } from "@supabase/supabase-js";

// =============================================================================
// KAZA — Cron : fin de bail automatique (quotidien)
//
// GET /api/cron/end-leases
// Passe les locations ACTIVE arrivées à terme à COMPLETED et libère le bien.
//
// Sécurité : exige le header `Authorization: Bearer ${CRON_SECRET}`.
// Vercel Cron ajoute automatiquement ce header quand l'env var CRON_SECRET est
// définie. On accepte aussi `?secret=` pour un déclenchement manuel.
// =============================================================================

export const dynamic = "force-dynamic";
// Empêche tout cache et autorise un peu de temps de traitement.
export const maxDuration = 60;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  // Sécurisé par défaut : sans secret configuré, on refuse.
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  const qp = req.nextUrl.searchParams.get("secret");
  return qp === secret;
}

export async function GET(req: NextRequest): Promise<Response> {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { error: "Non autorisé." },
      { status: 401 },
    );
  }

  try {
    const admin = createAdminClient() as unknown as SupabaseClient;
    const result = await completeEndedRentals(admin);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron:end-leases]", err);
    return NextResponse.json(
      { ok: false, error: "Échec du traitement." },
      { status: 500 },
    );
  }
}
