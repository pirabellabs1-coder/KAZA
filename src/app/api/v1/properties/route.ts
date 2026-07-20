import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { dispatchWebhookEvent } from "@/lib/webhooks/dispatch";

// =============================================================================
// Kaabo — API publique v1 : annonces
// -----------------------------------------------------------------------------
// Authentification par clé API : header `Authorization: Bearer kaabo_live_...`.
// GET  : liste des annonces disponibles (données publiques).
// POST : création d'une annonce (réservée aux clés dont le compte est
//        OWNER/AGENCY/ADMIN). Chaque appel est journalisé (suivi d'usage réel).
// =============================================================================

export const dynamic = "force-dynamic";

const PROPERTY_TYPES = [
  "APARTMENT",
  "HOUSE",
  "VILLA",
  "STUDIO",
  "ROOM",
  "OFFICE",
  "LAND",
  "COMMERCIAL",
];

interface AuthedKey {
  keyId: string;
  userId: string;
}

async function authenticate(
  admin: SupabaseClient,
  req: NextRequest,
): Promise<AuthedKey | null> {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token || !token.startsWith("kaabo_")) return null;
  const keyHash = createHash("sha256").update(token).digest("hex");
  const { data } = await admin
    .from("api_keys")
    .select("id, user_id, is_active")
    .eq("key_hash", keyHash)
    .maybeSingle();
  const key = data as
    | { id: string; user_id: string; is_active: boolean }
    | null;
  if (!key || !key.is_active) return null;
  return { keyId: key.id, userId: key.user_id };
}

async function logRequest(
  admin: SupabaseClient,
  key: AuthedKey | null,
  method: string,
  path: string,
  status: number,
) {
  try {
    await admin.rpc("touch_api_key", key ? { p_id: key.keyId } : { p_id: null });
  } catch {
    /* ignore */
  }
  try {
    await admin.from("api_request_logs").insert({
      api_key_id: key?.keyId ?? null,
      user_id: key?.userId ?? null,
      method,
      path,
      status,
    });
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// GET — liste des annonces disponibles
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const admin = createAdminClient() as unknown as SupabaseClient;
  const key = await authenticate(admin, req);
  if (!key) {
    return NextResponse.json(
      { error: "unauthorized", message: "Clé API manquante ou invalide." },
      { status: 401 },
    );
  }

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

  const status = error ? 500 : 200;
  await logRequest(admin, key, "GET", "/api/v1/properties", status);

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

// ---------------------------------------------------------------------------
// POST — création d'une annonce
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const admin = createAdminClient() as unknown as SupabaseClient;
  const key = await authenticate(admin, req);
  if (!key) {
    return NextResponse.json(
      { error: "unauthorized", message: "Clé API manquante ou invalide." },
      { status: 401 },
    );
  }

  // Le compte doit pouvoir publier (propriétaire / agence / admin).
  const { data: profile } = await admin
    .from("users")
    .select("role")
    .eq("id", key.userId)
    .maybeSingle();
  const role = (profile as { role?: string } | null)?.role;
  if (!["OWNER", "AGENCY", "ADMIN"].includes(role ?? "")) {
    await logRequest(admin, key, "POST", "/api/v1/properties", 403);
    return NextResponse.json(
      {
        error: "forbidden",
        message:
          "Seuls les comptes propriétaire ou agence peuvent créer des annonces.",
      },
      { status: 403 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any;
  try {
    body = await req.json();
  } catch {
    await logRequest(admin, key, "POST", "/api/v1/properties", 400);
    return NextResponse.json(
      { error: "bad_request", message: "Corps JSON invalide." },
      { status: 400 },
    );
  }

  const title = String(body?.title ?? "").trim();
  const price = Number(body?.price);
  const propertyType = String(body?.propertyType ?? "").toUpperCase();
  const errors: string[] = [];
  if (title.length < 3) errors.push("title (min 3 caractères)");
  if (!Number.isFinite(price) || price <= 0) errors.push("price (> 0)");
  if (!PROPERTY_TYPES.includes(propertyType))
    errors.push(`propertyType (${PROPERTY_TYPES.join(", ")})`);

  if (errors.length > 0) {
    await logRequest(admin, key, "POST", "/api/v1/properties", 422);
    return NextResponse.json(
      { error: "validation_error", message: "Champs invalides.", fields: errors },
      { status: 422 },
    );
  }

  const listingType =
    String(body?.listingType ?? "RENT").toUpperCase() === "SALE"
      ? "SALE"
      : "RENT";

  const insert = {
    owner_id: key.userId,
    title,
    description: String(body?.description ?? "").trim() || null,
    price,
    property_type: propertyType,
    listing_type: listingType,
    address: String(body?.address ?? "").trim() || null,
    bedrooms: Number.isFinite(Number(body?.bedrooms))
      ? Number(body.bedrooms)
      : null,
    bathrooms: Number.isFinite(Number(body?.bathrooms))
      ? Number(body.bathrooms)
      : null,
    square_meters: Number.isFinite(Number(body?.squareMeters))
      ? Number(body.squareMeters)
      : null,
    status: "AVAILABLE",
  };

  const { data: created, error } = await admin
    .from("properties")
    .insert(insert)
    .select("id, title, price, property_type, listing_type, address, status")
    .single();

  if (error || !created) {
    await logRequest(admin, key, "POST", "/api/v1/properties", 500);
    return NextResponse.json(
      { error: "server_error", message: "Création impossible." },
      { status: 500 },
    );
  }

  await logRequest(admin, key, "POST", "/api/v1/properties", 201);

  // Webhook : nouvelle annonce (best-effort).
  await dispatchWebhookEvent("property.created", {
    id: created.id,
    title: created.title,
    price: Number(created.price),
    listingType: created.listing_type,
    propertyType: created.property_type,
    address: created.address,
    source: "api",
  });

  return NextResponse.json(
    {
      object: "property",
      data: {
        id: created.id,
        title: created.title,
        price: Number(created.price),
        propertyType: created.property_type,
        listingType: created.listing_type,
        address: created.address,
        status: created.status,
      },
    },
    { status: 201 },
  );
}
