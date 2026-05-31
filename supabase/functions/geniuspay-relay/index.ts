// =============================================================================
// KAZA — Relais GeniusPay (Edge Function Supabase)
//
// L'API GeniusPay (geniuspay.ci) est derrière Cloudflare Bot Management qui
// renvoie un challenge 403 aux IP serveur de Vercel. L'egress des Edge
// Functions Supabase, lui, passe le challenge. Ce relais reçoit une requête
// signée par notre serveur (header x-relay-secret) et la transmet à GeniusPay
// avec les clés API (secrets de la fonction), puis renvoie la réponse brute.
//
// Sécurité : seul notre serveur connaît GENIUSPAY_RELAY_SECRET. Les clés
// GeniusPay ne quittent jamais ce relais.
// =============================================================================

const BASE = "https://geniuspay.ci/api/v1/merchant";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const relaySecret = Deno.env.get("GENIUSPAY_RELAY_SECRET");
  if (!relaySecret || req.headers.get("x-relay-secret") !== relaySecret) {
    return json({ error: "unauthorized" }, 401);
  }

  let payload: { path?: string; method?: string; body?: unknown };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "bad_json" }, 400);
  }

  // Sécurité : on n'accepte qu'un chemin relatif sous /api/v1/merchant.
  const path =
    typeof payload.path === "string" && payload.path.startsWith("/")
      ? payload.path
      : "";
  const method = (payload.method ?? "POST").toUpperCase();

  const apiKey = Deno.env.get("GENIUSPAY_PUBLIC_KEY") ?? "";
  const apiSecret = Deno.env.get("GENIUSPAY_SECRET_KEY") ?? "";

  const init: RequestInit = {
    method,
    headers: {
      "X-API-Key": apiKey,
      "X-API-Secret": apiSecret,
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": UA,
    },
  };
  if (method !== "GET" && payload.body !== undefined) {
    init.body = JSON.stringify(payload.body);
  }

  try {
    const r = await fetch(`${BASE}${path}`, init);
    const text = await r.text();
    return new Response(text, {
      status: r.status,
      headers: {
        "Content-Type": r.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (e) {
    return json(
      { error: "relay_fetch_failed", message: e instanceof Error ? e.message : String(e) },
      502,
    );
  }
});
