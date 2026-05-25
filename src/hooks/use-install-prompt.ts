'use client';

import { useCallback, useEffect, useState } from 'react';

const DISMISSED_KEY = 'kaza:install-dismissed';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

type PromptResult = 'accepted' | 'dismissed' | 'unavailable';

/**
 * Hook qui capture l'event `beforeinstallprompt` et expose un déclencheur d'installation.
 * Stocke la dismissal dans localStorage sous la clé `kaza:install-dismissed`.
 */
export function useInstallPrompt(): {
  canInstall: boolean;
  promptInstall: () => Promise<PromptResult>;
  dismiss: () => void;
} {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Vérifier si l'utilisateur a déjà refusé
    try {
      const stored = window.localStorage.getItem(DISMISSED_KEY);
      if (stored === 'true') {
        setDismissed(true);
      }
    } catch {
      // localStorage inaccessible (mode privé), ignorer
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const installedHandler = () => {
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<PromptResult> => {
    if (!deferredPrompt) return 'unavailable';

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      setDeferredPrompt(null);

      if (choice.outcome === 'dismissed') {
        try {
          window.localStorage.setItem(DISMISSED_KEY, 'true');
        } catch {
          // ignore
        }
        setDismissed(true);
      }

      return choice.outcome;
    } catch {
      return 'unavailable';
    }
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(DISMISSED_KEY, 'true');
    } catch {
      // ignore
    }
    setDismissed(true);
  }, []);

  return {
    canInstall: Boolean(deferredPrompt) && !dismissed,
    promptInstall,
    dismiss,
  };
}
