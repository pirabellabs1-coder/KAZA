"use server";

// =============================================================================
// KAZA - Messages (Server Actions)
//
// Messagerie 1-1 entre utilisateurs (locataires/proprietaires/etudiants).
// Une "conversation" est identifiee par la paire d'utilisateurs + un
// `propertyId` ou `roommateListingId` optionnel pour le contexte.
//
// L'arg `conversationId` cote client correspond ici a l'ID de l'autre
// utilisateur (recipientId). Le contexte propriete est optionnel.
// =============================================================================

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type { Message } from "@/types/properties";

import { createNotification, type ActionResult } from "./notifications";

// TODO: type manquant - voir note dans `properties.ts`.
async function getLooseClient(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const sendMessageSchema = z.object({
  conversationId: z.string().uuid("Identifiant de conversation invalide."),
  content: z
    .string()
    .min(1, "Le message ne peut pas etre vide.")
    .max(2000, "Le message ne peut pas depasser 2000 caracteres."),
  propertyId: z.string().uuid().optional(),
});

const startConversationSchema = z.object({
  recipientId: z.string().uuid("Destinataire invalide."),
  propertyId: z.string().uuid().optional(),
  content: z
    .string()
    .min(1, "Le message ne peut pas etre vide.")
    .max(2000, "Le message ne peut pas depasser 2000 caracteres."),
});

// ---------------------------------------------------------------------------
// sendMessage
// ---------------------------------------------------------------------------

interface SendMessageInput {
  conversationId: string;
  content: string;
  propertyId?: string;
}

/**
 * Envoie un message dans une conversation existante.
 * `conversationId` = identifiant de l'autre utilisateur (paire sender/recipient).
 */
export async function sendMessage(
  input: SendMessageInput
): Promise<ActionResult<Message>> {
  const parsed = sendMessageSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Donnees invalides.",
    };
  }

  const supabase = await getLooseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Vous devez etre connecte." };
  }

  if (parsed.data.conversationId === user.id) {
    return {
      success: false,
      error: "Vous ne pouvez pas vous envoyer un message a vous-meme.",
    };
  }

  const insert = {
    sender_id: user.id,
    recipient_id: parsed.data.conversationId,
    property_id: parsed.data.propertyId ?? null,
    content: parsed.data.content,
    is_read: false,
  };

  const { data, error } = await supabase
    .from("messages")
    .insert(insert)
    .select()
    .single();

  if (error || !data) {
    return { success: false, error: "Impossible d'envoyer le message." };
  }

  await createNotification(supabase, {
    userId: parsed.data.conversationId,
    type: "MESSAGE_RECEIVED",
    title: "Nouveau message",
    body: parsed.data.content.slice(0, 120),
    link: `/messages/${user.id}`,
  });

  revalidatePath("/messages");
  revalidatePath(`/messages/${parsed.data.conversationId}`);
  return { success: true, data: data as unknown as Message };
}

// ---------------------------------------------------------------------------
// markConversationRead
// ---------------------------------------------------------------------------

/**
 * Marque tous les messages d'une conversation comme lus pour l'utilisateur
 * courant (cote recipient).
 */
export async function markConversationRead(
  conversationId: string
): Promise<ActionResult> {
  const supabase = await getLooseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Vous devez etre connecte." };
  }

  const { error } = await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("recipient_id", user.id)
    .eq("sender_id", conversationId)
    .eq("is_read", false);

  if (error) {
    return {
      success: false,
      error: "Impossible de marquer les messages comme lus.",
    };
  }

  revalidatePath("/messages");
  revalidatePath(`/messages/${conversationId}`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// startConversation
// ---------------------------------------------------------------------------

interface StartConversationInput {
  recipientId: string;
  propertyId?: string;
  content: string;
}

/**
 * Demarre une nouvelle conversation avec un utilisateur, optionnellement
 * dans le contexte d'une annonce. Cree le premier message.
 */
export async function startConversation(
  input: StartConversationInput
): Promise<ActionResult<Message>> {
  const parsed = startConversationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Donnees invalides.",
    };
  }

  return sendMessage({
    conversationId: parsed.data.recipientId,
    content: parsed.data.content,
    propertyId: parsed.data.propertyId,
  });
}
