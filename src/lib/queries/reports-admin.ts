import "server-only";

import { createClient } from "@/lib/supabase/server";

// =============================================================================
// Kaabo — Queries Signalements (back-office admin, server-side)
// Lecture de `public.reports` pour la page /admin/reports.
// RLS : SELECT réservé aux ADMIN (et au reporter pour ses propres signalements).
// L'INSERT public est géré par la server action `reportContent`.
// Ne throw jamais : retourne [] en cas d'erreur.
// La table `reports` n'est pas encore dans les types Supabase générés : on cast
// le client en `any` (même pattern que partners-admin).
// =============================================================================

export type ReportStatus = "PENDING" | "REVIEWED" | "RESOLVED" | "DISMISSED";

export interface ReportSummary {
  id: string;
  reporterId: string | null;
  targetType: string;
  targetId: string | null;
  reason: string;
  details: string | null;
  status: ReportStatus;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
}

interface ReportRow {
  id: string;
  reporter_id: string | null;
  target_type: string;
  target_id: string | null;
  reason: string;
  details: string | null;
  status: ReportStatus;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

function mapRow(row: ReportRow): ReportSummary {
  return {
    id: row.id,
    reporterId: row.reporter_id,
    targetType: row.target_type,
    targetId: row.target_id,
    reason: row.reason,
    details: row.details,
    status: row.status,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
    resolvedBy: row.resolved_by,
  };
}

/**
 * Liste les signalements, du plus récent au plus ancien.
 * Le passage des policies RLS garantit que seuls les ADMIN voient la liste
 * complète. Renvoie un tableau vide en cas d'erreur ou d'absence de données.
 */
export async function listReports(): Promise<ReportSummary[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("reports")
    .select(
      "id, reporter_id, target_type, target_id, reason, details, status, created_at, resolved_at, resolved_by",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[reports-admin] listReports:", error.message);
    return [];
  }

  return ((data ?? []) as ReportRow[]).map(mapRow);
}

/**
 * Liste les signalements émis par un utilisateur donné (ses propres
 * signalements), du plus récent au plus ancien. La policy RLS autorise un
 * utilisateur à lire ses signalements (`reporter_id = auth.uid()`).
 * Renvoie [] en cas d'erreur ou d'absence de session.
 */
export async function listMyReports(
  userId: string,
): Promise<ReportSummary[]> {
  if (!userId) return [];
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("reports")
    .select(
      "id, reporter_id, target_type, target_id, reason, details, status, created_at, resolved_at, resolved_by",
    )
    .eq("reporter_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[reports-admin] listMyReports:", error.message);
    return [];
  }

  return ((data ?? []) as ReportRow[]).map(mapRow);
}

/**
 * Compte les signalements en attente de traitement (status = 'PENDING').
 * Utilise une requête `head: true` (aucune donnée transférée, juste le count).
 * Les policies RLS garantissent que seuls les ADMIN obtiennent le total réel.
 * Renvoie 0 en cas d'erreur (table absente, droits insuffisants).
 */
export async function countPendingReports(): Promise<number> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count, error } = await (supabase as any)
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("status", "PENDING");

  if (error) {
    console.warn("[reports-admin] countPendingReports:", error.message);
    return 0;
  }

  return count ?? 0;
}
