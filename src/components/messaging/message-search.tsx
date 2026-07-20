'use client';

// =============================================================================
// Kaabo - MessageSearch (client component)
//
// Champ de recherche debounce (300ms) avec icone loupe + bouton clear. Notifie
// le parent via `onSearch` uniquement apres la fin du debounce ; la valeur
// affichee dans l'input reste synchrone (controle par `query` si fourni).
// =============================================================================

import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface MessageSearchProps {
  /** Valeur initiale / controlee. */
  query?: string;
  /** Appele apres 300ms de stabilite. */
  onSearch: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Debounce en millisecondes (defaut 300). */
  debounceMs?: number;
}

export function MessageSearch({
  query,
  onSearch,
  placeholder = 'Rechercher dans la conversation...',
  className,
  debounceMs = 300,
}: MessageSearchProps) {
  const [value, setValue] = useState<string>(query ?? '');
  const lastEmitted = useRef<string>(query ?? '');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync avec parent quand `query` change de l'exterieur (reset, navigation).
  useEffect(() => {
    if (typeof query === 'string' && query !== value) {
      setValue(query);
      lastEmitted.current = query;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    if (value === lastEmitted.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      lastEmitted.current = value;
      onSearch(value);
    }, debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, debounceMs, onSearch]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const clear = () => {
    setValue('');
    lastEmitted.current = '';
    if (timerRef.current) clearTimeout(timerRef.current);
    onSearch('');
  };

  return (
    <div className={cn('relative w-full', className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        type="search"
        inputMode="search"
        role="searchbox"
        aria-label="Recherche"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className="h-10 pl-9 pr-10"
      />
      {value.length > 0 && (
        <button
          type="button"
          onClick={clear}
          aria-label="Effacer la recherche"
          className="absolute right-2 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
