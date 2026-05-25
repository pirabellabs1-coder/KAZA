"use server";

// =============================================================================
// KAZA - Notifications (Server Actions)
//
// Convention de retour : `{ success: true } | { success: false; error: string }`
// (Server Actions destinees a etre appelees depuis des composants client).
//
// NOTE IMPORTANTE : la table `notifications` n'existe pas encore dans le schema
// Supabase (00001_initial_schema.sql). Les helpers ci-dessous sont prets a etre
// branches des qu'elle sera creee (cf. rapport `.team/reports/aminata_wave1.md`).
// En attendant, les operations sur la table sont "best-effort" : on log et on
// echoue silencieusement plutot que de bloquer les flux metier (visites,
// messages, etc.) qui creent des notifs en cascade.
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

/** Categories de notification supportees par la plateforme. */
export type NotificationType =
  | "VISIT_REQUESTED"
  | "VISIT_CONFIRMED"
  | "VISIT_REJECTED"
  | "VISIT_CANCELLED"
  | "MESSAGE_RECEIVED"
  | "REVIEW_RECEIVED"
  | "PROPERTY_PUBLISHED"
  | "FAVORITE_PRICE_CHANGED";

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}

// ---------------------------------------------------------------------------
// Helper interne (export)
// ---------------------------------------------------------------------------

/**
 * Cree une notification pour un utilisateur donne.
 *
 * Utilise un client Supabase deja initialise (typiquement injecte depuis une
 * autre Server Action). Si la table `notifications` n'existe pas encore,
 * l'erreur est loguee et la promesse se resout silencieusement (`success: false`)
 * afin de ne pas casser le flux appelant (creation de visite, message, etc.).
 */
export async function createNotification(
  supabase: SupabaseClient,
  input: CreateNotificationInput
): Promise<ActionResult> {
  try {
    // TODO: type manquant - la table `notifications` n'est pas encore dans
    // `src/types/supabase.ts`. Demander a Yaw d'ajouter la migration + types.
    const { error } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from("notifications" as any)
      .insert({
        user_id: input.userId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        link: input.link ?? null,
        is_read: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

    if (error) {
      console.warn(
        "[notifications] insertion impossible (table absente ?)",
        error.message
      );
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
  const supabase = (await createClient()) as unknown as SupabaseClient;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Vous devez etre connecte." };
  }

  // TODO: type manquant - table `notifications`.
  const { error } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from("notifications" as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ is_read: true } as any)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return {
      success: false,
      error: "Impossible de marquer la notification comme lue.",
    };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

/** Marque toutes les notifications de l'utilisateur courant comme lues. */
export async function markAllNotificationsRead(): Promise<ActionResult> {
  const supabase = (await createClient()) as unknown as SupabaseClient;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Vous devez etre connecte." };
  }

  const { error } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from("notifications" as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ is_read: true } as any)
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {
    return {
      success: false,
      error: "Impossible de mettre a jour les notifications.",
    };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

/** Supprime une notification appartenant a l'utilisateur courant. */
export async function deleteNotification(id: string): Promise<ActionResult> {
  const supabase = (await createClient()) as unknown as SupabaseClient;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Vous devez etre connecte." };
  }

  const { error } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from("notifications" as any)
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return {
      success: false,
      error: "Impossible de supprimer la notification.",
    };
  }

  revalidatePath("/dashboard");
  return { success: true };
}
