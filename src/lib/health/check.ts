import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

// =============================================================================
// Kaabo — Healthcheck live des services plateforme
// =============================================================================

export type ServiceHealth = "OK" | "DEGRADED" | "DOWN" | "UNKNOWN";

export interface ServiceCheck {
  id: string;
  name: string;
  status: ServiceHealth;
  latencyMs?: number;
  message?: string;
  details?: string;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const TIMEOUT_MS = 5000;

async function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T | null> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

async function pingRestApi(): Promise<ServiceCheck> {
  const start = Date.now();
  try {
    const res = await withTimeout(
      fetch(`${SUPABASE_URL}/rest/v1/`, { headers: { apikey: SUPABASE_ANON }, cache: "no-store" }),
      TIMEOUT_MS,
    );
    const latency = Date.now() - start;
    if (!res) return { id: "rest", name: "API REST", status: "DOWN", message: "Timeout > 5s" };
    if (res.status === 200 || res.status === 401 || res.status === 404) {
      return { id: "rest", name: "API REST", status: latency > 1500 ? "DEGRADED" : "OK", latencyMs: latency };
    }
    return { id: "rest", name: "API REST", status: "DOWN", latencyMs: latency, message: `HTTP ${res.status}` };
  } catch (err) {
    return { id: "rest", name: "API REST", status: "DOWN", message: err instanceof Error ? err.message.slice(0, 100) : "Erreur réseau" };
  }
}

async function pingDatabase(): Promise<ServiceCheck> {
  const start = Date.now();
  try {
    const supabase = await createClient();
    const result = await withTimeout(
      supabase.from("users").select("id", { count: "exact", head: true }),
      TIMEOUT_MS,
    );
    const latency = Date.now() - start;
    if (!result) return { id: "database", name: "Base de données", status: "DOWN", message: "Timeout > 5s" };
    if (result.error) return { id: "database", name: "Base de données", status: "DOWN", latencyMs: latency, message: result.error.message.slice(0, 100) };
    return { id: "database", name: "Base de données", status: latency > 800 ? "DEGRADED" : "OK", latencyMs: latency, details: `${result.count ?? 0} utilisateurs` };
  } catch (err) {
    return { id: "database", name: "Base de données", status: "DOWN", message: err instanceof Error ? err.message.slice(0, 100) : "Erreur DB" };
  }
}

async function pingAuth(): Promise<ServiceCheck> {
  const start = Date.now();
  try {
    const res = await withTimeout(
      fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: SUPABASE_ANON }, cache: "no-store" }),
      TIMEOUT_MS,
    );
    const latency = Date.now() - start;
    if (!res) return { id: "auth", name: "Authentification", status: "DOWN", message: "Timeout" };
    if (res.ok) return { id: "auth", name: "Authentification", status: latency > 1500 ? "DEGRADED" : "OK", latencyMs: latency };
    return { id: "auth", name: "Authentification", status: "DOWN", latencyMs: latency, message: `HTTP ${res.status}` };
  } catch {
    return { id: "auth", name: "Authentification", status: "DOWN", message: "Erreur réseau" };
  }
}

async function pingStorage(): Promise<ServiceCheck> {
  const start = Date.now();
  try {
    const res = await withTimeout(
      fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
        headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
        cache: "no-store",
      }),
      TIMEOUT_MS,
    );
    const latency = Date.now() - start;
    if (!res) return { id: "storage", name: "Stockage fichiers", status: "DOWN", message: "Timeout" };
    if (res.status === 200 || res.status === 401) {
      return { id: "storage", name: "Stockage fichiers", status: latency > 1500 ? "DEGRADED" : "OK", latencyMs: latency };
    }
    return { id: "storage", name: "Stockage fichiers", status: "DOWN", latencyMs: latency, message: `HTTP ${res.status}` };
  } catch {
    return { id: "storage", name: "Stockage fichiers", status: "DOWN", message: "Erreur réseau" };
  }
}

async function pingRealtime(): Promise<ServiceCheck> {
  const start = Date.now();
  try {
    const res = await withTimeout(
      fetch(`${SUPABASE_URL}/realtime/v1/api/tenants/realtime/health`, {
        headers: { apikey: SUPABASE_ANON },
        cache: "no-store",
      }),
      TIMEOUT_MS,
    );
    const latency = Date.now() - start;
    if (!res) return { id: "realtime", name: "Temps réel", status: "UNKNOWN" };
    if (res.ok || res.status === 404) {
      return { id: "realtime", name: "Temps réel", status: "OK", latencyMs: latency };
    }
    return { id: "realtime", name: "Temps réel", status: "DEGRADED", latencyMs: latency };
  } catch {
    return { id: "realtime", name: "Temps réel", status: "UNKNOWN" };
  }
}

async function pingEmail(): Promise<ServiceCheck> {
  const start = Date.now();
  try {
    const res = await withTimeout(
      fetch("https://status.resend.com/api/v2/status.json", { cache: "no-store" }),
      TIMEOUT_MS,
    );
    const latency = Date.now() - start;
    if (!res) return { id: "email", name: "Emails (Resend)", status: "UNKNOWN" };
    if (res.ok) {
      const json = (await res.json().catch(() => null)) as
        | { status?: { indicator?: string; description?: string } }
        | null;
      const indicator = json?.status?.indicator ?? "none";
      return {
        id: "email",
        name: "Emails (Resend)",
        status: indicator === "none" ? "OK" : indicator === "minor" ? "DEGRADED" : "DOWN",
        latencyMs: latency,
        details: json?.status?.description ?? undefined,
      };
    }
    return { id: "email", name: "Emails (Resend)", status: "UNKNOWN" };
  } catch {
    return { id: "email", name: "Emails (Resend)", status: "UNKNOWN" };
  }
}

async function pingFrontend(): Promise<ServiceCheck> {
  return { id: "frontend", name: "Site web (Vercel)", status: "OK", details: "Vercel Edge Network" };
}

/**
 * Persiste un snapshot des checks dans `health_snapshots` (best-effort).
 * Throttle : un INSERT au plus toutes les 60s par service (vérifié via SELECT).
 * Comme RLS bloque l'INSERT pour le rôle anon, on n'insère que si on a
 * la service_role key (côté serveur, depuis env).
 */
async function persistSnapshots(checks: ServiceCheck[]): Promise<void> {
  try {
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!serviceRole || !url) return;

    // Throttle : ne pas insérer plus d'1 fois par minute pour le même service.
    // On utilise la dernière entrée pour chaque service.
    const lastRes = await fetch(
      `${url}/rest/v1/health_snapshots?select=service_id,checked_at&order=checked_at.desc&limit=20`,
      {
        headers: {
          apikey: serviceRole,
          Authorization: `Bearer ${serviceRole}`,
        },
        cache: "no-store",
      },
    );
    const lastRows = lastRes.ok
      ? ((await lastRes.json()) as Array<{
          service_id: string;
          checked_at: string;
        }>)
      : [];
    const lastByService = new Map<string, number>();
    for (const r of lastRows) {
      if (!lastByService.has(r.service_id)) {
        lastByService.set(r.service_id, new Date(r.checked_at).getTime());
      }
    }
    const now = Date.now();
    const toInsert = checks
      .filter((c) => {
        const last = lastByService.get(c.id) ?? 0;
        return now - last > 55_000;
      })
      .map((c) => ({
        service_id: c.id,
        service_name: c.name,
        status: c.status,
        latency_ms: c.latencyMs ?? null,
        message: c.message ?? null,
      }));
    if (toInsert.length === 0) return;

    await fetch(`${url}/rest/v1/health_snapshots`, {
      method: "POST",
      headers: {
        apikey: serviceRole,
        Authorization: `Bearer ${serviceRole}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(toInsert),
    });
  } catch {
    // ignore
  }
}

export async function runHealthchecks(): Promise<{
  checks: ServiceCheck[];
  global: ServiceHealth;
  lastCheckedAt: string;
}> {
  const checks = await Promise.all([
    pingFrontend(),
    pingRestApi(),
    pingDatabase(),
    pingAuth(),
    pingStorage(),
    pingRealtime(),
    pingEmail(),
  ]);

  const critical = checks.filter((c) => c.id === "rest" || c.id === "database" || c.id === "auth");
  let global: ServiceHealth = "OK";
  if (critical.some((c) => c.status === "DOWN")) global = "DOWN";
  else if (checks.some((c) => c.status === "DOWN")) global = "DEGRADED";
  else if (checks.some((c) => c.status === "DEGRADED")) global = "DEGRADED";

  // Persiste les snapshots (best-effort, throttle 60s par service)
  void persistSnapshots(checks);

  return { checks, global, lastCheckedAt: new Date().toISOString() };
}

// =============================================================================
// Historique pour graphes
// =============================================================================

export interface UptimeSummary {
  serviceId: string;
  serviceName: string;
  uptime24h: number; // 0-100
  uptime7d: number;
  uptime30d: number;
  avgLatencyMs: number;
  samplesCount: number;
}

export async function getUptimeSummary(): Promise<UptimeSummary[]> {
  try {
    const supabase = (await createClient()) as unknown as SupabaseClient;
    const { data } = await supabase
      .from("health_uptime_summary")
      .select("*");
    return ((data ?? []) as Array<{
      service_id: string;
      service_name: string;
      total_24h: number;
      ok_24h: number;
      total_7d: number;
      ok_7d: number;
      total_30d: number;
      ok_30d: number;
      avg_latency_ms_30d: number;
    }>).map((r) => ({
      serviceId: r.service_id,
      serviceName: r.service_name,
      uptime24h: r.total_24h > 0 ? (r.ok_24h / r.total_24h) * 100 : 0,
      uptime7d: r.total_7d > 0 ? (r.ok_7d / r.total_7d) * 100 : 0,
      uptime30d: r.total_30d > 0 ? (r.ok_30d / r.total_30d) * 100 : 0,
      avgLatencyMs: r.avg_latency_ms_30d ?? 0,
      samplesCount: r.total_30d,
    }));
  } catch {
    return [];
  }
}

export interface LatencyHourly {
  serviceId: string;
  hour: string;
  avgLatency: number;
  samples: number;
}

export async function getLatencyHourly24h(): Promise<LatencyHourly[]> {
  try {
    const supabase = (await createClient()) as unknown as SupabaseClient;
    const { data } = await supabase
      .from("health_latency_hourly_24h")
      .select("*");
    return ((data ?? []) as Array<{
      service_id: string;
      hour: string;
      avg_latency_ms: number;
      samples: number;
    }>).map((r) => ({
      serviceId: r.service_id,
      hour: r.hour,
      avgLatency: r.avg_latency_ms,
      samples: r.samples,
    }));
  } catch {
    return [];
  }
}

export interface DailyUptime {
  day: string;
  total: number;
  ok: number;
  degraded: number;
  down: number;
  ratio: number; // 0-1, fraction OK
}

export async function getDailyUptime90d(): Promise<DailyUptime[]> {
  try {
    const supabase = (await createClient()) as unknown as SupabaseClient;
    const { data } = await supabase
      .from("health_daily_90d")
      .select("*");
    return ((data ?? []) as Array<{
      day: string;
      total: number;
      ok_count: number;
      degraded_count: number;
      down_count: number;
    }>).map((r) => ({
      day: r.day,
      total: r.total,
      ok: r.ok_count,
      degraded: r.degraded_count,
      down: r.down_count,
      ratio: r.total > 0 ? r.ok_count / r.total : 0,
    }));
  } catch {
    return [];
  }
}

// =============================================================================
// Incidents + maintenances
// =============================================================================

export interface IncidentRow {
  id: string;
  title: string;
  description: string | null;
  severity: string;
  status: string;
  affectedServices: string[];
  startedAt: string;
  resolvedAt: string | null;
  updates: { at: string; message: string; status?: string }[];
}

export interface MaintenanceRow {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  affectedServices: string[];
}

// Lignes brutes des tables incidents / maintenances (hors types générés).
interface IncidentDbRow {
  id: string;
  title: string;
  description: string | null;
  severity: string;
  status: string;
  affected_services: string[] | null;
  started_at: string;
  resolved_at: string | null;
  updates: { at: string; message: string; status?: string }[] | null;
}
interface MaintenanceDbRow {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  affected_services: string[] | null;
}

export async function listOpenIncidents(): Promise<IncidentRow[]> {
  try {
    const supabase = (await createClient()) as unknown as SupabaseClient;
    const { data, error } = await supabase
      .from("incidents")
      .select("*")
      .neq("status", "RESOLVED")
      .order("started_at", { ascending: false });
    if (error) return [];
    return ((data ?? []) as IncidentDbRow[]).map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      severity: r.severity,
      status: r.status,
      affectedServices: r.affected_services ?? [],
      startedAt: r.started_at,
      resolvedAt: r.resolved_at,
      updates: r.updates ?? [],
    }));
  } catch {
    return [];
  }
}

export async function listRecentResolvedIncidents(limit = 10): Promise<IncidentRow[]> {
  try {
    const supabase = (await createClient()) as unknown as SupabaseClient;
    const { data } = await supabase
      .from("incidents")
      .select("*")
      .eq("status", "RESOLVED")
      .order("resolved_at", { ascending: false })
      .limit(limit);
    return ((data ?? []) as IncidentDbRow[]).map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      severity: r.severity,
      status: r.status,
      affectedServices: r.affected_services ?? [],
      startedAt: r.started_at,
      resolvedAt: r.resolved_at,
      updates: r.updates ?? [],
    }));
  } catch {
    return [];
  }
}

export async function listUpcomingMaintenances(): Promise<MaintenanceRow[]> {
  try {
    const supabase = (await createClient()) as unknown as SupabaseClient;
    const { data } = await supabase
      .from("maintenances")
      .select("*")
      .in("status", ["SCHEDULED", "IN_PROGRESS"])
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at");
    return ((data ?? []) as MaintenanceDbRow[]).map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      scheduledAt: r.scheduled_at,
      durationMinutes: r.duration_minutes,
      status: r.status,
      affectedServices: r.affected_services ?? [],
    }));
  } catch {
    return [];
  }
}
