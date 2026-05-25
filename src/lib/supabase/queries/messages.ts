// =============================================================================
// KAZA - Messages Queries (Server Components)
//
// Une conversation est definie par la paire (utilisateur courant, autre user)
// + un property_id optionnel pour le contexte.
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import type {
  ConversationSummary,
  Message,
  MessageWithSender,
} from "@/types/properties";
import type { UserPublicProfile } from "@/types/users";

// TODO: type manquant - voir note dans `queries/users.ts`.
async function getLooseClient(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

// ---------------------------------------------------------------------------
// getConversations
// ---------------------------------------------------------------------------

/**
 * Retourne la liste des conversations pour `userId` : pour chaque autre
 * utilisateur avec qui il a echange, on conserve le dernier message et le
 * nombre de messages non lus.
 *
 * Implementation : on charge tous les messages de l'utilisateur (en/sortie)
 * puis on agrege en memoire. Acceptable pour le MVP (volumes faibles).
 * A migrer vers une vue SQL ou un RPC quand le volume grandira.
 */
export async function getConversations(
  userId: string
): Promise<ConversationSummary[]> {
  const supabase = await getLooseClient();

  const { data, error } = await supabase
    .from("messages")
    .select(
      `
      *,
      sender:users!messages_sender_id_fkey (
        id, first_name, last_name, profile_photo_url, role,
        is_verified, verification_status, bio, rating_average, created_at
      ),
      recipient:users!messages_recipient_id_fkey (
        id, first_name, last_name, profile_photo_url, role,
        is_verified, verification_status, bio, rating_average, created_at
      )
    `
    )
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Lecture des conversations impossible : ${error.message}`);
  }

  type Row = Message & {
    sender: UserPublicProfile;
    recipient: UserPublicProfile;
  };

  const map = new Map<string, ConversationSummary>();

  for (const raw of (data ?? []) as unknown as Row[]) {
    const otherUser =
      raw.sender_id === userId ? raw.recipient : raw.sender;
    if (!otherUser) continue;

    const key = `${otherUser.id}::${raw.property_id ?? ""}::${raw.roommate_listing_id ?? ""}`;

    const existing = map.get(key);
    const isUnreadForMe = raw.recipient_id === userId && !raw.is_read;

    if (!existing) {
      map.set(key, {
        other_user: otherUser,
        last_message: {
          id: raw.id,
          sender_id: raw.sender_id,
          recipient_id: raw.recipient_id,
          property_id: raw.property_id,
          roommate_listing_id: raw.roommate_listing_id,
          content: raw.content,
          is_read: raw.is_read,
          created_at: raw.created_at,
        },
        unread_count: isUnreadForMe ? 1 : 0,
        property_id: raw.property_id,
        roommate_listing_id: raw.roommate_listing_id,
      });
    } else if (isUnreadForMe) {
      existing.unread_count += 1;
    }
  }

  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(b.last_message.created_at).getTime() -
      new Date(a.last_message.created_at).getTime()
  );
}

// ---------------------------------------------------------------------------
// getConversationMessages
// ---------------------------------------------------------------------------

/**
 * Retourne tous les messages echanges entre l'utilisateur courant et un
 * autre utilisateur. Filtre optionnel par contexte (annonce).
 * Resultat trie par date croissante (du plus ancien au plus recent).
 */
export async function getConversationMessages(
  otherUserId: string,
  propertyId?: string
): Promise<MessageWithSender[]> {
  const supabase = await getLooseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Vous devez etre connecte.");
  }

  let query = supabase
    .from("messages")
    .select(
      `
      *,
      sender:users!messages_sender_id_fkey (
        id, first_name, last_name, profile_photo_url, role,
        is_verified, verification_status, bio, rating_average, created_at
      )
    `
    )
    .or(
      `and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`
    )
    .order("created_at", { ascending: true });

  if (propertyId) {
    query = query.eq("property_id", propertyId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Lecture des messages impossible : ${error.message}`);
  }

  return (data ?? []) as unknown as MessageWithSender[];
}

// ---------------------------------------------------------------------------
// getUnreadCount
// ---------------------------------------------------------------------------

/** Nombre total de messages non lus pour `userId` (cote recipient). */
export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = await getLooseClient();

  const { count, error } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", userId)
    .eq("is_read", false);

  if (error) {
    throw new Error(
      `Lecture du compteur de messages impossible : ${error.message}`
    );
  }

  return count ?? 0;
}
