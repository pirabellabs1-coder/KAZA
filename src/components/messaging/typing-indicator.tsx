// =============================================================================
// KAZA - TypingIndicator (server component)
//
// Trois points animes + libelle « {name} est en train d'ecrire... ». Les
// animations vivent dans styles/animations.css (.typing-dot) et respectent
// `prefers-reduced-motion`.
// =============================================================================

import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  name: string;
  className?: string;
}

export function TypingIndicator({ name, className }: TypingIndicatorProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`${name} est en train d'ecrire`}
      className={cn(
        'flex items-center gap-2 text-xs text-muted-foreground',
        className,
      )}
    >
      <span className="flex h-4 items-end gap-1" aria-hidden>
        <span className="typing-dot block size-1.5 rounded-full bg-kaza-blue/70" />
        <span className="typing-dot typing-dot-2 block size-1.5 rounded-full bg-kaza-blue/70" />
        <span className="typing-dot typing-dot-3 block size-1.5 rounded-full bg-kaza-blue/70" />
      </span>
      <span className="italic">{name} est en train d&apos;ecrire...</span>
    </div>
  );
}
