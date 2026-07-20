"use server";

import "server-only";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { WEBHOOK_EVENTS } from "@/lib/webhooks/events";

// =============================================================================
// Kaabo — Webhooks (endpoints HTTP sortants)
// GRATUIT pour AGENCY/ADMIN, payant (Developer API) pour les devs externes.
// =============================================================================

export interface WebhookDTO {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastStatus: number | null;
  lastDeliveryAt: string | null;
  failureCount: number;
  createdAt: string;
}

export interface CreateWebhookResult {
  success: boolean;
  error?: string;
  /** Secret de signature — affiché UNE seule fois. */
  secret?: string;
}

async function canManage(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  const role = (profile as { role?: string } | null)?.role;
  return role === "AGENCY" || role === "ADMIN" || role === "DEVELOPER";
}

export async function createWebhookEndpoint(
  url: string,
  events: string[],
): Promise<CreateWebhookResult> {
  const clean = (url ?? "").trim();
  if (!/^https:\/\/.+/i.test(clean)) {
    return { success: false, error: "L'URL doit commencer par https://" };
  }
  const validEvents = (events ?? []).filter((e) =>
    (WEBHOOK_EVENTS as readonly string[]).includes(e),
  );
  if (validEvents.length === 0) {
    return { success: false, error: "Sélectionnez au moins un événement." };
  }

  const supabase = (await createClient()) as unknown as SupabaseClient;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Vous devez être connecté." };

  if (!(await canManage(supabase, user.id))) {
    return {
      success: false,
      error: "Créez un compte développeur pour utiliser les webhooks.",
    };
  }

  const secret = `whsec_${randomBytes(24).toString("hex")}`;

  const { error } = await supabase.from("webhook_endpoints").insert({
    user_id: user.id,
    url: clean,
    secret,
    events: validEvents,
  });

  if (error) {
    console.error("[webhooks] create:", error.message);
    return { success: false, error: "Impossible de créer le webhook." };
  }

  revalidatePath("/developers");
  return { success: true, secret };
}

export async function listMyWebhooks(): Promise<WebhookDTO[]> {
  const supabase = (await createClient()) as unknown as SupabaseClient;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("webhook_endpoints")
    .select(
      "id, url, events, is_active, last_status, last_delivery_at, failure_count, created_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[webhooks] list:", error.message);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((r) => ({
    id: r.id as string,
    url: r.url as string,
    events: (r.events as string[]) ?? [],
    isActive: Boolean(r.is_active),
    lastStatus: (r.last_status as number | null) ?? null,
    lastDeliveryAt: (r.last_delivery_at as string | null) ?? null,
    failureCount: Number(r.failure_count ?? 0),
    createdAt: r.created_at as string,
  }));
}

export async function revokeWebhookEndpoint(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  if (!id) return { success: false, error: "Identifiant manquant." };
  const supabase = (await createClient()) as unknown as SupabaseClient;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Vous devez être connecté." };

  const { error } = await supabase
    .from("webhook_endpoints")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: "Suppression impossible." };
  revalidatePath("/developers");
  return { success: true };
}
