import "server-only";

import { createHmac } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";

// =============================================================================
// Kaabo — Distribution des webhooks
// -----------------------------------------------------------------------------
// Pour chaque endpoint actif souscrit à l'événement, envoie un POST JSON signé
// (HMAC-SHA256, en-tête X-Kaabo-Signature). Best-effort : n'interrompt jamais
// l'action métier qui a déclenché l'événement.
// =============================================================================

export type WebhookEvent =
  | "property.created"
  | "property.updated"
  | "property.rented";

interface WebhookRow {
  id: string;
  url: string;
  secret: string;
  events: string[];
}

function sign(secret: string, payload: string): string {
  return "sha256=" + createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Diffuse un événement à tous les endpoints abonnés. À appeler sans `await`
 * bloquant (ou dans un try/catch) — la livraison ne doit pas casser l'action.
 */
export async function dispatchWebhookEvent(
  event: WebhookEvent,
  data: Record<string, unknown>,
): Promise<void> {
  try {
    const admin = createAdminClient() as unknown as SupabaseClient;
    const { data: rows } = await admin
      .from("webhook_endpoints")
      .select("id, url, secret, events")
      .eq("is_active", true)
      .contains("events", [event]);

    const endpoints = (rows ?? []) as WebhookRow[];
    if (endpoints.length === 0) return;

    const body = JSON.stringify({
      event,
      createdAt: new Date().toISOString(),
      data,
    });

    await Promise.all(
      endpoints.map(async (ep) => {
        let status = 0;
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8000);
          const res = await fetch(ep.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Kaabo-Event": event,
              "X-Kaabo-Signature": sign(ep.secret, body),
            },
            body,
            signal: controller.signal,
          });
          clearTimeout(timeout);
          status = res.status;
        } catch {
          status = 0; // échec réseau / timeout
        }

        const ok = status >= 200 && status < 300;
        const patch: Record<string, unknown> = {
          last_delivery_at: new Date().toISOString(),
          last_status: status,
        };
        if (ok) patch.failure_count = 0;
        await admin.from("webhook_endpoints").update(patch).eq("id", ep.id);
        if (!ok) {
          // Incrément atomique du compteur d'échecs (best-effort).
          try {
            await admin.rpc("bump_webhook_failure", { p_id: ep.id });
          } catch {
            /* ignore */
          }
        }
      }),
    );
  } catch (err) {
    console.error("[webhooks] dispatch:", err);
  }
}
