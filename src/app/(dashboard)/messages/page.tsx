// =============================================================================
// KAZA - Messages (liste des conversations)
//
// Server component : recupere l'utilisateur courant + ses conversations via
// `getConversations(userId)` (livre wave 1) puis affiche la liste cliquable.
// Chaque entree mene a /messages/[otherUserId].
// =============================================================================

import { MessageSquare } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  getConversations,
  getCurrentUser,
} from '@/lib/supabase/queries';
import { cn, getInitials } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Messages',
};

// Formatter relatif manuel (pas de dependance date-fns au projet).
function formatRelative(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return "a l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;

  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();
  if (isYesterday) return 'Hier';

  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
  });
}

export default async function MessagesPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/login?redirect=/messages');
    return null; // unreachable, mais aide TS quand les types next/navigation manquent.
  }

  const conversations = await getConversations(currentUser.id);

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-xl border bg-card">
      <div className="border-b border-border p-4">
        <h1 className="font-heading text-lg font-bold text-kaza-navy">
          Messages
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {conversations.length}{' '}
          {conversations.length > 1 ? 'conversations' : 'conversation'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
            <MessageSquare className="size-12 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Aucune conversation
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Vos echanges avec proprietaires et locataires apparaitront ici.
              </p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {conversations.map((conv) => {
              const other = conv.other_user;
              const fullName = `${other.first_name} ${other.last_name}`.trim();
              const lastMessage = conv.last_message;
              const isUnread = conv.unread_count > 0;

              return (
                <li key={`${other.id}-${conv.property_id ?? 'none'}`}>
                  <Link
                    href={`/messages/${other.id}`}
                    className="flex w-full items-center gap-3 p-4 transition-colors hover:bg-muted/50"
                  >
                    <Avatar className="shrink-0">
                      {other.profile_photo_url && (
                        <AvatarImage
                          src={other.profile_photo_url}
                          alt={fullName}
                        />
                      )}
                      <AvatarFallback className="bg-kaza-navy text-white text-xs">
                        {getInitials(
                          other.first_name,
                          other.last_name ?? '',
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={cn(
                            'truncate text-sm',
                            isUnread
                              ? 'font-semibold text-foreground'
                              : 'font-medium text-foreground',
                          )}
                        >
                          {fullName || 'Utilisateur'}
                        </p>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {formatRelative(lastMessage.created_at)}
                        </span>
                      </div>
                      <p
                        className={cn(
                          'mt-0.5 truncate text-xs',
                          isUnread
                            ? 'text-foreground'
                            : 'text-muted-foreground',
                        )}
                      >
                        {lastMessage.sender_id === currentUser.id ? 'Vous: ' : ''}
                        {lastMessage.content}
                      </p>
                    </div>
                    {isUnread && (
                      <Badge
                        className="ml-1 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-kaza-blue px-1.5 text-[10px] text-white"
                      >
                        {conv.unread_count}
                      </Badge>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
