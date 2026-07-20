"use server";

import "server-only";

import { randomBytes, createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { getActiveSubscription } from "@/lib/queries/subscriptions";

// =============================================================================
// Kaabo — Clés API (accès programmatique)
// -----------------------------------------------------------------------------
// GRATUIT pour AGENCY et ADMIN. PAYANT pour les développeurs externes
// (abonnement « Kaabo Developer API » requis). La clé complète n'est montrée
// qu'UNE SEULE FOIS à la création ; seul son hash SHA-256 est stocké.
// =============================================================================

export interface ApiKeyDTO {
  id: string;
  name: string;
  keyPrefix: string;
  tier: "AGENCY" | "DEVELOPER";
  isActive: boolean;
  callCount: number;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface GenerateApiKeyResult {
  success: boolean;
  error?: string;
  /** Clé complète — affichée UNE seule fois, jamais re-consultable. */
  apiKey?: string;
  keyPrefix?: string;
}

function hashKey(fullKey: string): string {
  return createHash("sha256").update(fullKey).digest("hex");
}

/** AGENCY et ADMIN → accès gratuit ; sinon abonnement Developer requis. */
async function resolveTier(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ tier: "AGENCY" | "DEVELOPER" } | { error: string }> {
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  const role = (profile as { role?: string } | null)?.role;

  if (role === "AGENCY" || role === "ADMIN") {
    return { tier: "AGENCY" };
  }

  // Développeur externe : abonnement Developer API actif requis.
  const sub = await getActiveSubscription(userId);
  if (sub?.plan === "DEVELOPER_API") {
    return { tier: "DEVELOPER" };
  }
  return {
    error:
      "L'accès API est réservé aux agences (gratuit) ou nécessite un abonnement « Kaabo Developer API ».",
  };
}

export async function generateApiKey(
  name: string,
): Promise<GenerateApiKeyResult> {
  const label = (name ?? "").trim() || "Clé API";
  const supabase = (await createClient()) as unknown as SupabaseClient;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Vous devez être connecté." };

  const tierRes = await resolveTier(supabase, user.id);
  if ("error" in tierRes) {
    return { success: false, error: tierRes.error };
  }

  // Génère une clé : kaabo_live_<48 hex>.
  const secret = randomBytes(24).toString("hex");
  const fullKey = `kaabo_live_${secret}`;
  const keyPrefix = fullKey.slice(0, 16); // "kaabo_live_xxxx"
  const keyHash = hashKey(fullKey);

  const rateLimit = tierRes.tier === "AGENCY" ? 5000 : 10000;

  const { error } = await supabase.from("api_keys").insert({
    user_id: user.id,
    name: label,
    key_prefix: keyPrefix,
    key_hash: keyHash,
    tier: tierRes.tier,
    rate_limit: rateLimit,
  });

  if (error) {
    console.error("[api-keys] generate:", error.message);
    return { success: false, error: "Impossible de créer la clé API." };
  }

  revalidatePath("/developers");
  return { success: true, apiKey: fullKey, keyPrefix };
}

export async function listMyApiKeys(): Promise<ApiKeyDTO[]> {
  const supabase = (await createClient()) as unknown as SupabaseClient;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("api_keys")
    .select(
      "id, name, key_prefix, tier, is_active, call_count, last_used_at, created_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[api-keys] list:", error.message);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    keyPrefix: r.key_prefix as string,
    tier: r.tier as "AGENCY" | "DEVELOPER",
    isActive: Boolean(r.is_active),
    callCount: Number(r.call_count ?? 0),
    lastUsedAt: (r.last_used_at as string | null) ?? null,
    createdAt: r.created_at as string,
  }));
}

export async function revokeApiKey(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  if (!id) return { success: false, error: "Identifiant manquant." };
  const supabase = (await createClient()) as unknown as SupabaseClient;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Vous devez être connecté." };

  const { error } = await supabase
    .from("api_keys")
    .update({ is_active: false, revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: "Impossible de révoquer la clé." };
  }
  revalidatePath("/developers");
  return { success: true };
}
