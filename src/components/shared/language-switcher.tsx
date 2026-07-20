'use client';

// =============================================================================
// Kaabo - LanguageSwitcher (Client)
// Wave 10 - Olamide Adesanya (Mobile/PWA Specialist)
//
// Dropdown shadcn (Radix) pour basculer entre FR et EN. S'appuie sur
// `useTranslation` (LocaleProvider doit etre monte plus haut dans l'arbre).
// - variant 'icon' : bouton ghost iconique (Globe + chevron).
// - variant 'full' : ajoute le libelle court "FR" / "EN" a cote.
// =============================================================================

import { Check, ChevronDown, Globe } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/lib/i18n/use-translation';
import type { Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type LanguageSwitcherProps = {
  className?: string;
  variant?: 'icon' | 'full';
};

const OPTIONS: { value: Locale; label: string; short: string }[] = [
  { value: 'fr', label: '🇫🇷 Francais', short: 'FR' },
  { value: 'en', label: '🇬🇧 English', short: 'EN' },
];

export function LanguageSwitcher({
  className,
  variant = 'icon',
}: LanguageSwitcherProps) {
  const { locale, setLocale } = useTranslation();
  const current = OPTIONS.find((o) => o.value === locale) ?? OPTIONS[0];
  const isFull = variant === 'full';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={isFull ? 'sm' : 'icon'}
          aria-label="Changer la langue"
          className={cn('gap-1.5', className)}
        >
          <Globe className="h-4 w-4" aria-hidden="true" />
          {isFull && (
            <span className="text-sm font-medium">{current.short}</span>
          )}
          <ChevronDown
            className="h-3 w-3 opacity-60"
            aria-hidden="true"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {OPTIONS.map((opt) => {
          const active = opt.value === locale;
          return (
            <DropdownMenuItem
              key={opt.value}
              onSelect={() => setLocale(opt.value)}
              className="flex items-center justify-between gap-2 cursor-pointer"
            >
              <span>{opt.label}</span>
              {active && (
                <Check className="h-4 w-4 text-primary" aria-hidden="true" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default LanguageSwitcher;
