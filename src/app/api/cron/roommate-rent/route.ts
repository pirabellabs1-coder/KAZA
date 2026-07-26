import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { generateMonthlyRentExpenses } from "@/lib/roommate/recurring-rent";
import type { SupabaseClient } from "@supabase/supabase-js";

// =============================================================================
// Kaabo — Cron : loyer partagé mensuel des colocations (le 1er du mois)
//
// GET /api/cron/roommate-rent
// Génère la dépense « Loyer — <mois> » répartie entre colocataires pour chaque
// colocation active. Idempotent (ne recrée pas le loyer du mois déjà généré).
//
// Sécurité : header `Authorization: Bearer ${CRON_SECRET}` (Vercel Cron) ou
// `?secret=` pour un déclenchement manuel.
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
    const admin = createAdminClient() as unknown as SupabaseClient;
    const result = await generateMonthlyRentExpenses(admin);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron:roommate-rent]", err);
    return NextResponse.json(
      { ok: false, error: "Échec du traitement." },
      { status: 500 },
    );
  }
}
