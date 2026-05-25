'use client';

// =============================================================================
// KAZA - useRealtimeMessages
//
// Hook client qui :
//   1. Charge l'historique des messages echanges entre deux utilisateurs.
//   2. S'abonne au channel Supabase Realtime pour recevoir les INSERT live.
//   3. Nettoie le channel automatiquement au demontage.
//
// La convention KAZA : une "conversation" = paire (currentUser, otherUser).
// Il n'y a pas de table conversations cote SQL.
// =============================================================================

import { useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export interface RealtimeMessage {
  id: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  created_at: string;
}

interface UseRealtimeMessagesResult {
  messages: RealtimeMessage[];
  loading: boolean;
  error: string | null;
}

/**
 * Charge + ecoute les messages entre `currentUserId` et `otherUserId`.
 * Retourne un tableau trie par date croissante (du plus ancien au plus recent).
 */
export function useRealtimeMessages(
  currentUserId: string,
  otherUserId: string,
): UseRealtimeMessagesResult {
  const [messages, setMessages] = useState<RealtimeMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUserId || !otherUserId) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    let cancelled = false;

    // 1. Chargement initial de l'historique.
    void (async () => {
      const { data, error: loadError } = await supabase
        .from('messages')
        .select('id, content, sender_id, recipient_id, created_at')
        .or(
          `and(sender_id.eq.${currentUserId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${currentUserId})`,
        )
        .order('created_at', { ascending: true });

      if (cancelled) return;

      if (loadError) {
        setError(loadError.message);
      } else {
        setMessages((data ?? []) as RealtimeMessage[]);
      }
      setLoading(false);
    })();

    // 2. Souscription aux INSERT en temps reel.
    //    Filtre cote serveur sur recipient_id = currentUserId pour recevoir
    //    uniquement les messages entrants, puis filtre cote client pour ne
    //    retenir que ceux issus de `otherUserId`.
    const channel = supabase
      .channel(`messages:${currentUserId}:${otherUserId}`)
      .on(
        // postgres_changes n'est pas dans le type generique du wrapper,
        // on cast pour eviter un cast au niveau du callback.
        'postgres_changes' as never,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${currentUserId}`,
        } as never,
        (payload: { new: RealtimeMessage }) => {
          const msg = payload.new;
          if (msg.sender_id !== otherUserId) return;
          setMessages((prev) => {
            // Eviter les doublons si le message a deja ete pousse optimistiquement.
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        },
      )
      .subscribe();

    // 3. Cleanup obligatoire au unmount.
    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [currentUserId, otherUserId]);

  return { messages, loading, error };
}
