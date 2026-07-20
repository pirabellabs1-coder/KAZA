import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

// =============================================================================
// Kaabo — Queries Demandes RGPD / APDP (server-side)
//
// Lecture de `public.gdpr_requests` (migration 00056).
// RLS :
//   - SELECT : le demandeur voit ses demandes OU l'ADMIN voit tout.
//   - INSERT : géré par la server action `submitGdprRequest`.
//   - UPDATE : ADMIN uniquement (server action `resolveGdprRequest`).
// Ne throw jamais : retourne [] en cas d'erreur (table absente, droits).
// La table n'est pas dans les types Supabase générés : on cast le client.
// =============================================================================

export type GdprRequestType =
  | "EXPORT"
  | "DELETION"
  | "RECTIFICATION"
  | "ACCESS";

export type GdprRequestStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "REJECTED";

export interface GdprRequest {
  id: string;
  userId: string | null;
  type: GdprRequestType;
  details: string | null;
  status: GdprRequestStatus;
  requestedAt: string;
  resolvedAt: string | null;
  adminNote: string | null;
}

/** Demande enrichie du nom/email du demandeur (vue admin). */
export interface GdprRequestWithUser extends GdprRequest {
  userName: string;
  email: string;
}

interface GdprRequestRow {
  id: string;
  user_id: string | null;
  type: GdprRequestType;
  details: string | null;
  status: GdprRequestStatus;
  requested_at: string;
  resolved_at: string | null;
  admin_note: string | null;
  user?:
    | { first_name: string | null; last_name: string | null; email: string | null }
    | Array<{ first_name: string | null; last_name: string | null; email: string | null }>
    | null;
}

async function getClient(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

function mapRow(row: GdprRequestRow): GdprRequest {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    details: row.details,
    status: row.status,
    requestedAt: row.requested_at,
    resolvedAt: row.resolved_at,
    adminNote: row.admin_note,
  };
}

/**
 * Liste toutes les demandes RGPD (réservé aux ADMIN par la policy RLS), de la
 * plus récente à la plus ancienne. Joint `users` pour exposer nom et email du
 * demandeur. Renvoie [] en cas d'erreur ou d'absence de données.
 */
export async function listGdprRequests(): Promise<GdprRequestWithUser[]> {
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("gdpr_requests")
    .select(
      `id, user_id, type, details, status, requested_at, resolved_at, admin_note,
       user:users!user_id(first_name, last_name, email)`,
    )
    .order("requested_at", { ascending: false });

  if (error) {
    console.warn("[queries/gdpr] listGdprRequests:", error.message);
    return [];
  }

  return ((data ?? []) as GdprRequestRow[]).map((row) => {
    const userRow = Array.isArray(row.user) ? row.user[0] : row.user;
    const fullName = userRow
      ? `${userRow.first_name ?? ""} ${userRow.last_name ?? ""}`.trim()
      : "";
    return {
      ...mapRow(row),
      userName: fullName || "Utilisateur supprimé",
      email: userRow?.email ?? "",
    };
  });
}

/**
 * Liste les demandes RGPD d'un utilisateur donné (les siennes), de la plus
 * récente à la plus ancienne. La policy RLS autorise `user_id = auth.uid()`.
 * Renvoie [] en cas d'erreur ou d'absence de session.
 */
export async function listMyGdprRequests(
  userId: string,
): Promise<GdprRequest[]> {
  if (!userId) return [];
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("gdpr_requests")
    .select(
      "id, user_id, type, details, status, requested_at, resolved_at, admin_note",
    )
    .eq("user_id", userId)
    .order("requested_at", { ascending: false });

  if (error) {
    console.warn("[queries/gdpr] listMyGdprRequests:", error.message);
    return [];
  }

  return ((data ?? []) as GdprRequestRow[]).map(mapRow);
}
