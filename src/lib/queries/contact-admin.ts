import "server-only";

import { createClient } from "@/lib/supabase/server";

// =============================================================================
// KAZA — Queries Messages de contact (back-office admin)
// Lecture de `contact_messages` (formulaire public /contact).
// - `listContactMessages` : page admin /admin/messages
//
// Les types Supabase auto-générés ne connaissent pas encore la table
// `contact_messages` (migration 00017). On bypass volontairement via `as any` —
// la sécurité reste assurée par les policies RLS (SELECT réservé aux ADMIN).
// =============================================================================

export type ContactMessageStatus = "NEW" | "READ" | "REPLIED" | "CLOSED";

export interface ContactMessage {
  id: string;
  senderId: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  handledBy: string | null;
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
}

interface ContactMessageRow {
  id: string;
  sender_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  handled_by: string | null;
  reply: string | null;
  replied_at: string | null;
  created_at: string;
}

function mapRow(row: ContactMessageRow): ContactMessage {
  return {
    id: row.id,
    senderId: row.sender_id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    message: row.message,
    status: row.status,
    handledBy: row.handled_by,
    reply: row.reply,
    repliedAt: row.replied_at,
    createdAt: row.created_at,
  };
}

/**
 * Liste tous les messages de contact, triés du plus récent au plus ancien.
 * Renvoie un tableau vide en cas d'erreur ou d'absence de données.
 * RLS garantit que seuls les ADMIN voient la liste complète.
 */
export async function listContactMessages(): Promise<ContactMessage[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[contact-admin] listContactMessages:", error.message);
    return [];
  }

  return ((data ?? []) as ContactMessageRow[]).map(mapRow);
}
