// =============================================================================
// Kaabo - MessageBubble (server component)
//
// Bulle de message unique : a droite (own, kaza-blue) ou a gauche (autre,
// gray-200). Affiche un avatar pour les messages recus uniquement.
// =============================================================================

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
  };
  isOwn: boolean;
  senderName?: string;
  senderAvatarUrl?: string | null;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function initialsFromName(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function MessageBubble({
  message,
  isOwn,
  senderName,
  senderAvatarUrl,
}: MessageBubbleProps) {
  return (
    <div
      className={cn(
        'flex w-full items-end gap-2',
        isOwn ? 'justify-end' : 'justify-start',
      )}
    >
      {!isOwn && (
        <Avatar size="sm" className="shrink-0">
          {senderAvatarUrl ? (
            <AvatarImage src={senderAvatarUrl} alt={senderName ?? 'Expediteur'} />
          ) : null}
          <AvatarFallback className="bg-kaza-navy text-white text-[10px]">
            {initialsFromName(senderName)}
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'flex max-w-[75%] flex-col',
          isOwn ? 'items-end' : 'items-start',
        )}
      >
        <div
          className={cn(
            'whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm leading-relaxed',
            isOwn
              ? 'bg-kaza-blue text-white rounded-br-sm'
              : 'bg-gray-200 text-gray-900 rounded-bl-sm',
          )}
        >
          {message.content}
        </div>
        <span
          className={cn(
            'mt-0.5 px-1 text-[10px]',
            isOwn ? 'text-muted-foreground' : 'text-muted-foreground',
          )}
        >
          {formatTime(message.created_at)}
        </span>
      </div>
    </div>
  );
}
