import { NextRequest, NextResponse } from "next/server";

// =============================================================================
// Route de diagnostic TEMPORAIRE : teste si l'API GeniusPay est joignable
// depuis le runtime Vercel (et si le User-Agent navigateur fait passer le
// challenge Cloudflare). Ne renvoie AUCUNE donnée sensible (statut + nature
// de la réponse uniquement). À supprimer après diagnostic.
// =============================================================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BALANCE_URL = "https://geniuspay.ci/api/v1/merchant/account/balance";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

async function probe(withUa: boolean) {
  const apiKey = process.env.GENIUSPAY_PUBLIC_KEY ?? "";
  const apiSecret = process.env.GENIUSPAY_SECRET_KEY ?? "";
  const headers: Record<string, string> = {
    "X-API-Key": apiKey,
    "X-API-Secret": apiSecret,
    Accept: "application/json",
  };
  if (withUa) headers["User-Agent"] = UA;
  try {
    const r = await fetch(BALANCE_URL, { headers });
    const body = await r.text();
    const cloudflare = /just a moment|cf-chl|challenge-platform|cf_chl|cloudflare/i.test(
      body,
    );
    return {
      status: r.status,
      cloudflareChallenge: cloudflare,
      kind: cloudflare
        ? "cloudflare-challenge"
        : body.trim().startsWith("{")
          ? "json"
          : "other",
      // snippet anonymisé (chiffres masqués)
      snippet: body.slice(0, 70).replace(/\d/g, "#").replace(/\s+/g, " "),
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("key") !== "kz-diag-7f3a9") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const [withUa, withoutUa] = await Promise.all([probe(true), probe(false)]);
  return NextResponse.json({
    hasKeys: !!(
      process.env.GENIUSPAY_PUBLIC_KEY && process.env.GENIUSPAY_SECRET_KEY
    ),
    withUserAgent: withUa,
    withoutUserAgent: withoutUa,
  });
}
