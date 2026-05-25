'use client';

import { ArrowLeft, Paperclip, Send } from 'lucide-react';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useViewportHeight } from '@/hooks/use-viewport-height';
import { cn } from '@/lib/utils';

export interface ConversationMessage {
  id: string;
  senderId: string;
  body: string;
  createdAt: string | Date;
}

export interface ConversationRecipient {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface ConversationMobileProps {
  messages: ConversationMessage[];
  currentUserId: string;
  recipient: ConversationRecipient;
  onSend: (body: string) => void | Promise<void>;
  onBack?: () => void;
  onAttach?: () => void;
  className?: string;
}

function formatTime(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Vue conversation plein ecran mobile.
 * - Header sticky (retour + avatar + nom)
 * - Liste messages avec scroll auto vers le bas
 * - Input sticky bottom (textarea + attache + envoyer)
 * - Hauteur calculee via `--vh` (useViewportHeight)
 */
export function ConversationMobile({
  messages,
  currentUserId,
  recipient,
  onSend,
  onBack,
  onAttach,
  className,
}: ConversationMobileProps) {
  useViewportHeight();

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll auto au dernier message
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const recipientInitials = useMemo(() => initials(recipient.name), [recipient.name]);

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    const value = draft.trim();
    if (!value || sending) return;
    setSending(true);
    try {
      await onSend(value);
      setDraft('');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  };

  return (
    <div
      className={cn('flex w-full flex-col bg-white', className)}
      style={{ height: 'calc(var(--vh) * 100)' }}
    >
      {/* Header sticky */}
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-200 bg-white px-3 py-2">
        {onBack && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onBack}
            aria-label="Retour"
          >
            <ArrowLeft className="size-5" />
          </Button>
        )}
        <Avatar className="size-9">
          {recipient.avatarUrl && (
            <AvatarImage src={recipient.avatarUrl} alt={recipient.name} />
          )}
          <AvatarFallback>{recipientInitials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">
            {recipient.name}
          </p>
        </div>
      </header>

      {/* Liste messages */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-3 py-3"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <ul className="flex flex-col gap-2">
          {messages.map((m) => {
            const mine = m.senderId === currentUserId;
            return (
              <li
                key={m.id}
                className={cn('flex w-full', mine ? 'justify-end' : 'justify-start')}
              >
                <div className={cn('flex max-w-[75%] flex-col', mine ? 'items-end' : 'items-start')}>
                  <div
                    className={cn(
                      'whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm',
                      mine
                        ? 'bg-kaza-blue text-white rounded-br-sm'
                        : 'bg-gray-200 text-gray-900 rounded-bl-sm',
                    )}
                  >
                    {m.body}
                  </div>
                  <span className="mt-0.5 px-1 text-[10px] text-gray-500">
                    {formatTime(m.createdAt)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Input sticky bottom */}
      <form
        onSubmit={submit}
        className="sticky bottom-0 flex items-end gap-2 border-t border-gray-200 bg-white px-2 py-2"
        style={{ paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))' }}
      >
        {onAttach && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onAttach}
            aria-label="Joindre un fichier"
          >
            <Paperclip className="size-5" />
          </Button>
        )}
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ecrire un message..."
          rows={1}
          className="min-h-[40px] max-h-32 flex-1 resize-none"
          aria-label="Message"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!draft.trim() || sending}
          aria-label="Envoyer"
          className="bg-kaza-blue hover:bg-kaza-blue/90"
        >
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
