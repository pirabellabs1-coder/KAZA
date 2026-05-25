'use client';

// =============================================================================
// KAZA - MessageInput (client component)
//
// Textarea auto-resize + bouton envoyer. Enter envoie, Shift+Enter saute une
// ligne. Desactive pendant l'envoi pour eviter les doubles soumissions.
// =============================================================================

import { Send } from 'lucide-react';
import {
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function MessageInput({
  onSend,
  disabled,
  placeholder = 'Ecrire un message...',
  className,
}: MessageInputProps) {
  const [value, setValue] = useState('');
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isDisabled = disabled || sending;

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    const content = value.trim();
    if (!content || isDisabled) return;

    setSending(true);
    try {
      await onSend(content);
      setValue('');
      // Reset hauteur du textarea apres envoi.
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
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

  // Auto-resize : on ajuste la hauteur a chaque saisie.
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  };

  return (
    <form
      onSubmit={submit}
      className={cn(
        'flex items-end gap-2 border-t border-border bg-white p-3',
        className,
      )}
    >
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        disabled={isDisabled}
        aria-label="Message"
        className="min-h-[40px] max-h-32 flex-1 resize-none"
      />
      <Button
        type="submit"
        size="icon"
        disabled={isDisabled || !value.trim()}
        aria-label="Envoyer"
        className="bg-kaza-blue hover:bg-kaza-blue/90 shrink-0"
      >
        <Send className="size-4" />
      </Button>
    </form>
  );
}
