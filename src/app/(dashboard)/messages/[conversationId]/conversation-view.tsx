'use client';

// =============================================================================
// KAZA - ConversationView (client component)
//
// Vue conversation 1-1 : header (avatar + nom + retour mobile), liste messages
// scrollable avec auto-scroll bas, input multiline avec envoi optimiste.
// Branche le hook `useRealtimeMessages` pour le live + `sendMessage` server
// action pour les ecritures.
// =============================================================================

import { ArrowLeft, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

import { sendMessage } from '@/actions/messages';
import { MessageBubble } from '@/components/messaging/message-bubble';
import { MessageInput } from '@/components/messaging/message-input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { emitToast } from '@/components/ui/sonner';
import { useRealtimeMessages } from '@/hooks/use-realtime-messages';

interface ConversationViewProps {
  currentUserId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatarUrl?: string | null;
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function ConversationView({
  currentUserId,
  otherUserId,
  otherUserName,
  otherUserAvatarUrl,
}: ConversationViewProps) {
  const { messages, loading, error } = useRealtimeMessages(
    currentUserId,
    otherUserId,
  );

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll en bas a chaque nouveau message.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const handleSend = async (content: string) => {
    const result = await sendMessage({
      conversationId: otherUserId,
      content,
    });
    if (!result.success) {
      emitToast({ variant: 'error', message: result.error });
    }
    // Le message reapparaitra via Realtime cote destinataire, et via la
    // revalidation Next cote expediteur lors du prochain render serveur.
    // Pour un feedback immediat, on s'appuie sur l'arrivee Realtime (cas
    // multi-onglets) + revalidatePath cote action.
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-xl border bg-card">
      {/* Header */}
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-white px-4 py-3">
        <Button
          asChild
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          aria-label="Retour aux conversations"
        >
          <Link href="/messages">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <Avatar>
          {otherUserAvatarUrl ? (
            <AvatarImage src={otherUserAvatarUrl} alt={otherUserName} />
          ) : null}
          <AvatarFallback className="bg-kaza-navy text-white text-xs">
            {initialsFromName(otherUserName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {otherUserName}
          </p>
        </div>
      </header>

      {/* Liste messages */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto bg-muted/20 p-4"
      >
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Chargement des messages...
            </p>
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <MessageCircle className="size-10 text-muted-foreground/50" />
            <p className="text-sm font-medium text-foreground">
              Aucun message pour le moment
            </p>
            <p className="text-xs text-muted-foreground">
              Envoyez le premier message pour demarrer la conversation.
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              isOwn={m.sender_id === currentUserId}
              senderName={otherUserName}
              senderAvatarUrl={otherUserAvatarUrl ?? undefined}
            />
          ))
        )}
      </div>

      {/* Input */}
      <MessageInput onSend={handleSend} />
    </div>
  );
}
