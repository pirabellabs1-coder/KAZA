'use client';

// =============================================================================
// KAZA - useTranslation + LocaleProvider
// Wave 10 - Olamide Adesanya (Mobile/PWA Specialist)
//
// Context React minimaliste pour gerer la locale active cote client.
// - Lecture initiale depuis localStorage (kaza-locale).
// - Persistance automatique au changement.
// - SSR-safe : DEFAULT_LOCALE par defaut, hydratation cote client.
// =============================================================================

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  DEFAULT_LOCALE,
  dictionaries,
  isLocale,
  type Dictionary,
  type Locale,
} from './index';

type LocaleContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Dictionary;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: dictionaries[DEFAULT_LOCALE],
});

const STORAGE_KEY = 'kaza-locale';

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // Hydratation : recupere la locale stockee cote client.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (isLocale(stored)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- setState intentionnel dans un effet (init/hydratation SSR-safe, abonnement navigateur ou souscription externe) — pattern correct, pas de cascade de rendu problematique
        setLocaleState(stored);
        document.documentElement.lang = stored;
      }
    } catch {
      // localStorage indisponible (mode prive, quota...) - on ignore.
    }
  }, []);

  const setLocale = (next: Locale) => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
        document.documentElement.lang = next;
      } catch {
        // ignore
      }
    }
    setLocaleState(next);
  };

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, t: dictionaries[locale] }),
    [locale]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LocaleContext);
}
