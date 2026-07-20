'use client';

// =============================================================================
// Kaabo - useTypingIndicator (optionnel)
//
// Hook utilitaire base sur Supabase Realtime "broadcast" pour publier et
// recevoir des evenements "typing" 1-1. Sans table SQL : ephemeral only.
//
// Usage :
//   const { otherIsTyping, notifyTyping } = useTypingIndicator(meId, otherId);
//   <Textarea onChange={() => notifyTyping()} />
//   {otherIsTyping && <span>en train d'ecrire...</span>}
// =============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

interface UseTypingIndicatorResult {
  otherIsTyping: boolean;
  /** Notifie l'autre cote qu'on est en train d'ecrire. Throttle ~1500ms. */
  notifyTyping: () => void;
}

const TYPING_TIMEOUT_MS = 2500;
const THROTTLE_MS = 1500;

/**
 * Channel partage par paire d'utilisateurs (cle deterministe).
 */
function channelKey(a: string, b: string): string {
  return [a, b].sort().join(':');
}

export function useTypingIndicator(
  currentUserId: string,
  otherUserId: string,
): UseTypingIndicatorResult {
  const [otherIsTyping, setOtherIsTyping] = useState(false);

  const sendRef = useRef<((event: { event: string; payload: unknown }) => void) | null>(null);
  const lastSentRef = useRef<number>(0);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!currentUserId || !otherUserId) return;

    const supabase = createClient();
    const channel = supabase.channel(`typing:${channelKey(currentUserId, otherUserId)}`, {
      config: { broadcast: { self: false } },
    });

    channel.on('broadcast', { event: 'typing' }, (payload) => {
      const data = payload.payload as { sender_id?: string } | undefined;
      if (!data || data.sender_id !== otherUserId) return;
      setOtherIsTyping(true);
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      clearTimerRef.current = setTimeout(() => {
        setOtherIsTyping(false);
      }, TYPING_TIMEOUT_MS);
    });

    channel.subscribe();

    sendRef.current = (msg) => {
      void channel.send({ type: 'broadcast', ...msg });
    };

    return () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      sendRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [currentUserId, otherUserId]);

  const notifyTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastSentRef.current < THROTTLE_MS) return;
    lastSentRef.current = now;
    sendRef.current?.({
      event: 'typing',
      payload: { sender_id: currentUserId },
    });
  }, [currentUserId]);

  return { otherIsTyping, notifyTyping };
}
