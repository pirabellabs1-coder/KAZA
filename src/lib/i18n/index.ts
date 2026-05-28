// =============================================================================
// KAZA - i18n (utilitaires + dictionnaire central)
// Wave 10 - Olamide Adesanya (Mobile/PWA Specialist)
//
// Approche minimaliste sans next-intl (non installe) : un simple Context
// React + dictionnaires statiques. Suffisant pour MVP, extensible vers
// next-intl plus tard si besoin de routing localise.
// =============================================================================

import fr from './locales/fr';
import en from './locales/en';

export type Locale = 'fr' | 'en';

export const DEFAULT_LOCALE: Locale = 'fr';
export const AVAILABLE_LOCALES: Locale[] = ['fr', 'en'];

export const dictionaries = { fr, en } as const;

export type Dictionary = typeof fr;

/**
 * Garde-fou type-safe : verifie qu'une chaine est une `Locale` valide.
 */
export function isLocale(value: unknown): value is Locale {
  return value === 'fr' || value === 'en';
}

/**
 * Libelles humains pour l'UI (selecteur de langue).
 */
export const LOCALE_LABELS: Record<Locale, string> = {
  fr: 'Francais',
  en: 'English',
};
