import "server-only";

// =============================================================================
// Kaabo — Queries messages Supabase (server-side)
//
// Lecture des conversations et des messages d'un utilisateur. Toutes les
// requetes sont filtrees par `sender_id` ou `recipient_id = userId`, ce qui
// est compatible avec les policies RLS (`messages_select_own`).
// =============================================================================

import { createClient } from "@/lib/supabase/server";
import type { Message } from "@/types/properties";

export interface ConversationListItem {
  /** Identifiant de l'autre utilisateur (utilise comme conversationId dans l'URL) */
  otherUserId: string;
  otherUserFirstName: string;
  otherUserLastName: string;
  otherUserRole: string;
  otherUserPhotoUrl: string | null;
  /** Contexte (annonce) eventuel — null si conversation libre */
  propertyId: string | null;
  propertyTitle: string | null;
  lastMessage: string;
  lastMessageAt: string;
  /** Nombre de messages dont je suis recipient et qui sont !is_read */
  unreadCount: number;
}

interface RawMessageRow {
  id: string;
  sender_id: string;
  recipient_id: string;
  property_id: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface ConversationKey {
  otherUserId: string;
  propertyId: string | null;
}

function makeKey(k: ConversationKey): string {
  return `${k.otherUserId}::${k.propertyId ?? ""}`;
}

/**
 * Liste les conversations d'un utilisateur, regroupees par (autre utilisateur,
 * propriete optionnelle). Triees par date du dernier message decroissante.
 *
 * Strategie : on tire les N derniers messages echanges (sender ou recipient
 * = userId), on les agrege en memoire. Suffisant pour les volumes MVP ;
 * passer a une vue SQL si > quelques milliers de messages par user.
 */
export async function listConversations(
  userId: string,
  options: { limit?: number } = {},
): Promise<ConversationListItem[]> {
  const limit = options.limit ?? 300;
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("messages")
    .select("id, sender_id, recipient_id, property_id, content, is_read, created_at")
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !rows) {
    return [];
  }

  // Regroupement par cle (autre_user, property_id)
  const grouped = new Map<
    string,
    {
      key: ConversationKey;
      lastMessage: RawMessageRow;
      unreadCount: number;
    }
  >();

  for (const raw of rows as RawMessageRow[]) {
    const otherUserId =
      raw.sender_id === userId ? raw.recipient_id : raw.sender_id;
    const key: ConversationKey = {
      otherUserId,
      propertyId: raw.property_id,
    };
    const mapKey = makeKey(key);
    const existing = grouped.get(mapKey);
    const isUnreadForMe = raw.recipient_id === userId && !raw.is_read;

    if (!existing) {
      grouped.set(mapKey, {
        key,
        lastMessage: raw,
        unreadCount: isUnreadForMe ? 1 : 0,
      });
    } else {
      if (isUnreadForMe) existing.unreadCount += 1;
      // Comme les rows sont DESC, le premier vu est le dernier message —
      // pas de mise a jour de lastMessage necessaire.
    }
  }

  if (grouped.size === 0) return [];

  // Hydrate les profils utilisateurs et les titres de proprietes en une seule
  // requete par table.
  const otherUserIds = Array.from(
    new Set(Array.from(grouped.values()).map((g) => g.key.otherUserId)),
  );
  const propertyIds = Array.from(
    new Set(
      Array.from(grouped.values())
        .map((g) => g.key.propertyId)
        .filter((id): id is string => id !== null),
    ),
  );

  const [{ data: users }, { data: properties }] = await Promise.all([
    supabase
      .from("users")
      .select("id, first_name, last_name, role, profile_photo_url")
      .in("id", otherUserIds),
    propertyIds.length
      ? supabase.from("properties").select("id, title").in("id", propertyIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);

  const userById = new Map(
    (users ?? []).map((u) => [u.id, u]),
  );
  const propertyById = new Map(
    (properties ?? []).map((p) => [p.id, p]),
  );

  return Array.from(grouped.values())
    .map<ConversationListItem>((g) => {
      const u = userById.get(g.key.otherUserId);
      const p = g.key.propertyId
        ? propertyById.get(g.key.propertyId)
        : undefined;
      return {
        otherUserId: g.key.otherUserId,
        otherUserFirstName: u?.first_name ?? "Utilisateur",
        otherUserLastName: u?.last_name ?? "",
        otherUserRole: u?.role ?? "TENANT",
        otherUserPhotoUrl: u?.profile_photo_url ?? null,
        propertyId: g.key.propertyId,
        propertyTitle: p?.title ?? null,
        lastMessage: g.lastMessage.content,
        lastMessageAt: g.lastMessage.created_at,
        unreadCount: g.unreadCount,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.lastMessageAt).getTime() -
        new Date(a.lastMessageAt).getTime(),
    );
}

/**
 * Liste tous les messages echanges entre `userId` et `otherUserId`,
 * optionnellement scopes a une propriete. Tri ASC (du plus ancien au plus
 * recent) pour affichage chat.
 */
export async function listMessagesWith(
  userId: string,
  otherUserId: string,
  propertyId?: string,
): Promise<Message[]> {
  const supabase = await createClient();

  let query = supabase
    .from("messages")
    .select(
      "id, sender_id, recipient_id, property_id, roommate_listing_id, content, is_read, created_at",
    )
    .or(
      `and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`,
    )
    .order("created_at", { ascending: true })
    .limit(500);

  if (propertyId) {
    query = query.eq("property_id", propertyId);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data as unknown as Message[];
}

/**
 * Marque tous les messages recus par `userId` (depuis `otherUserId`) comme lus.
 * Aligne avec l'action server `markConversationRead` mais utilisable cote
 * server component pour rafraichir l'etat avant rendu.
 */
export async function markMessagesRead(
  userId: string,
  otherUserId: string,
): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("recipient_id", userId)
    .eq("sender_id", otherUserId)
    .eq("is_read", false);
}

/**
 * Recupere le profil public d'un utilisateur pour l'en-tete d'une conversation.
 */
export async function getConversationPartner(
  otherUserId: string,
): Promise<{
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  photoUrl: string | null;
} | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, first_name, last_name, role, profile_photo_url")
    .eq("id", otherUserId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    firstName: data.first_name,
    lastName: data.last_name,
    role: data.role,
    photoUrl: data.profile_photo_url,
  };
}
