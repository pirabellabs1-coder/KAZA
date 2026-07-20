import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

// =============================================================================
// Kaabo — Suivi d'utilisation de l'API (données réelles)
// =============================================================================

export interface ApiUsage {
  totalCalls: number;
  callsToday: number;
  activeKeys: number;
  recent: Array<{
    method: string;
    path: string;
    status: number;
    createdAt: string;
  }>;
}

export async function getApiUsage(userId: string): Promise<ApiUsage> {
  const supabase = (await createClient()) as unknown as SupabaseClient;

  // Total des appels = somme des call_count des clés + clés actives.
  const { data: keys } = await supabase
    .from("api_keys")
    .select("call_count, is_active")
    .eq("user_id", userId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const keyRows = (keys ?? []) as any[];
  const totalCalls = keyRows.reduce(
    (s, k) => s + Number(k.call_count ?? 0),
    0,
  );
  const activeKeys = keyRows.filter((k) => k.is_active).length;

  // Appels aujourd'hui (depuis minuit UTC) via le journal.
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const { count: callsToday } = await supabase
    .from("api_request_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfDay.toISOString());

  // 15 dernières requêtes.
  const { data: logs } = await supabase
    .from("api_request_logs")
    .select("method, path, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(15);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recent = ((logs ?? []) as any[]).map((l) => ({
    method: l.method as string,
    path: l.path as string,
    status: Number(l.status),
    createdAt: l.created_at as string,
  }));

  return {
    totalCalls,
    callsToday: callsToday ?? 0,
    activeKeys,
    recent,
  };
}
