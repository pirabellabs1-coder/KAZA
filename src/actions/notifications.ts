"use server";

// =============================================================================
// KAZA - Notifications (Server Actions)
//
// Convention de retour : `{ success: true } | { success: false; error: string }`
// (Server Actions destinees a etre appelees depuis des composants client).
//
// La table `notifications` est livree par la migration 00004_notifications.sql :
// elle utilise `read_at: timestamptz` (NULL = non lue) et `metadata: jsonb`
// pour le payload structure.
// =============================================================================

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

/** Categories de notification supportees par la plateforme (alignees sur l'ENUM). */
export type NotificationType =
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

// Compat retro : certains call sites utilisent encore les anciens libelles
// UPPER_CASE. Cette table de mapping permet de les accepter sans casser
// le contrat actuel (visites, messages, etc.).
const LEGACY_TYPE_MAP: Record<string, NotificationType> = {
  VISIT_REQUESTED: "visit_request",
  VISIT_CONFIRMED: "visit_accepted",
  VISIT_REJECTED: "visit_rejected",
  VISIT_CANCELLED: "visit_rejected",
  MESSAGE_RECEIVED: "message_received",
  REVIEW_RECEIVED: "review_received",
  PROPERTY_PUBLISHED: "property_approved",
  FAVORITE_PRICE_CHANGED: "system",
};

function coerceType(value: string): NotificationType {
  if (value in LEGACY_TYPE_MAP) return LEGACY_TYPE_MAP[value];
  return value as NotificationType;
}

interface CreateNotificationInput {
  userId: string;
  type: NotificationType | string;
  title: string;
  body?: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Helper interne (export)
// ---------------------------------------------------------------------------

/**
 * Cree une notification pour un utilisateur donne.
 *
 * Utilise un client Supabase deja initialise (typiquement injecte depuis une
 * autre Server Action). En cas d'erreur (RLS, contrainte FK, etc.) on log et
 * on resout silencieusement pour ne pas bloquer le flux appelant (creation
 * de visite, message, etc.).
 */
export async function createNotification(
  supabase: SupabaseClient,
  input: CreateNotificationInput,
): Promise<ActionResult> {
  try {
    const { error } = await supabase.from("notifications").insert({
      user_id: input.userId,
      type: coerceType(input.type),
      title: input.title,
      body: input.body ?? null,
      link: input.link ?? null,
      metadata: input.metadata ?? {},
      read_at: null,
    });

    if (error) {
      console.warn("[notifications] insertion impossible", error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.warn("[notifications] exception lors de la creation", err);
    return {
      success: false,
      error: "Impossible de creer la notification.",
    };
  }
}

// ---------------------------------------------------------------------------
// Server Actions publiques
// ---------------------------------------------------------------------------

/** Marque une notification comme lue. */
export async function markNotificationRead(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Vous devez etre connecte." };
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return {
      success: false,
      error: "Impossible de marquer la notification comme lue.",
    };
  }

  revalidatePath("/notifications");
  revalidatePath("/dashboard");
  return { success: true };
}

/** Marque toutes les notifications de l'utilisateur courant comme lues. */
export async function markAllNotificationsRead(): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Vous devez etre connecte." };
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) {
    return {
      success: false,
      error: "Impossible de mettre a jour les notifications.",
    };
  }

  revalidatePath("/notifications");
  revalidatePath("/dashboard");
  return { success: true };
}

/** Supprime une notification appartenant a l'utilisateur courant. */
export async function deleteNotification(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Vous devez etre connecte." };
  }

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return {
      success: false,
      error: "Impossible de supprimer la notification.",
    };
  }

  revalidatePath("/notifications");
  revalidatePath("/dashboard");
  return { success: true };
}
