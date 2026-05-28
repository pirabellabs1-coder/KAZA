import "server-only";

// =============================================================================
// KAZA — Queries notifications (server-side)
//
// La table `notifications` (migration 00004) stocke `read_at: timestamptz`
// au lieu d'un booleen — on derive `isRead = read_at !== null`.
// =============================================================================

import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/supabase";

export type NotificationCategory =
  | "visit_request"
  | "visit_accepted"
  | "visit_rejected"
  | "message_received"
  | "payment_received"
  | "payment_failed"
  | "payment_due"
  | "property_approved"
  | "property_rejected"
  | "property_suspended"
  | "contract_ready"
  | "contract_signed"
  | "review_received"
  | "identity_approved"
  | "identity_rejected"
  | "system";

export interface UserNotification {
  id: string;
  type: NotificationCategory;
  title: string;
  body: string | null;
  link: string | null;
  metadata: Json | null;
  isRead: boolean;
  createdAt: string;
}

/**
 * Liste les notifications de l'utilisateur (les plus recentes d'abord).
 * RLS : `Users see their own notifications` filtre automatiquement par
 * `auth.uid() = user_id`, mais on passe `userId` pour clarte + index.
 */
export async function listNotifications(
  userId: string,
  limit = 50,
): Promise<UserNotification[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, body, link, metadata, read_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((n) => ({
    id: n.id,
    type: n.type as NotificationCategory,
    title: n.title,
    body: n.body,
    link: n.link,
    metadata: n.metadata,
    isRead: n.read_at !== null,
    createdAt: n.created_at,
  }));
}

/**
 * Retourne le nombre de notifications non lues de l'utilisateur courant.
 * Utilise un count exact côté Postgres (cheap grâce à l'index partiel
 * `idx_notifications_user_unread`).
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) return 0;
  return count ?? 0;
}
