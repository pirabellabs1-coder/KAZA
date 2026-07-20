import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";

// =============================================================================
// Kaabo — API publique v1 : liste des annonces disponibles
// -----------------------------------------------------------------------------
// Authentification par clé API : header `Authorization: Bearer kaabo_live_...`.
// Les données renvoyées sont PUBLIQUES (annonces disponibles). L'accès est
// gratuit pour les agences (clé AGENCY) et payant pour les développeurs.
// =============================================================================

export const dynamic = "force-dynamic";

function unauthorized(message: string) {
  return NextResponse.json(
    { error: "unauthorized", message },
    { status: 401 },
  );
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token || !token.startsWith("kaabo_")) {
    return unauthorized(
      "Clé API manquante. Utilisez l'en-tête Authorization: Bearer <clé>.",
    );
  }

  const admin = createAdminClient() as unknown as SupabaseClient;
  const keyHash = createHash("sha256").update(token).digest("hex");

  const { data: keyRow } = await admin
    .from("api_keys")
    .select("id, is_active")
    .eq("key_hash", keyHash)
    .maybeSingle();

  const key = keyRow as { id: string; is_active: boolean } | null;
  if (!key || !key.is_active) {
    return unauthorized("Clé API invalide ou révoquée.");
  }

  // Comptabilise l'appel (best-effort, atomique via RPC).
  try {
    await admin.rpc("touch_api_key", { p_id: key.id });
  } catch {
    await admin
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", key.id);
  }

  // Paramètres de pagination simples.
  const url = new URL(req.url);
  const limit = Math.min(
    Math.max(parseInt(url.searchParams.get("limit") ?? "20", 10) || 20, 1),
    100,
  );
  const offset = Math.max(
    parseInt(url.searchParams.get("offset") ?? "0", 10) || 0,
    0,
  );

  const { data, error } = await admin
    .from("properties")
    .select(
      `id, title, description, listing_type, price, bedrooms, bathrooms,
       square_meters, property_type, address, status, created_at`,
    )
    .eq("status", "AVAILABLE")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json(
      { error: "server_error", message: "Erreur lors de la récupération." },
      { status: 500 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = ((data ?? []) as any[]).map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    listingType: p.listing_type,
    price: Number(p.price),
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    squareMeters: p.square_meters,
    propertyType: p.property_type,
    address: p.address,
    createdAt: p.created_at,
  }));

  return NextResponse.json(
    { object: "list", count: items.length, limit, offset, data: items },
    { headers: { "Cache-Control": "no-store" } },
  );
}
