'use client';

import { useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInstallPrompt } from '@/hooks/use-install-prompt';

/**
 * Bannière flottante d'invitation à l'installation PWA.
 * Apparaît si le navigateur supporte `beforeinstallprompt` et que l'utilisateur
 * n'a pas refusé précédemment. Se positionne au-dessus du bottom-nav mobile.
 */
export function InstallPrompt() {
  const { canInstall, promptInstall, dismiss } = useInstallPrompt();
  const [installing, setInstalling] = useState(false);

  if (!canInstall) return null;

  const handleInstall = async () => {
    setInstalling(true);
    const result = await promptInstall();
    setInstalling(false);

    if (result === 'accepted') {
      // MVP : toast léger via alert. À remplacer par un vrai toast plus tard.
      if (typeof window !== 'undefined') {
        window.alert('KAZA a été installée sur votre appareil.');
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Installation de l'application KAZA"
      className="fixed inset-x-3 bottom-[calc(64px+env(safe-area-inset-bottom)+12px)] z-50 mx-auto max-w-md animate-in slide-in-from-bottom-6 rounded-xl border border-border bg-white p-4 shadow-lg md:bottom-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-kaza-navy text-white">
          <Download className="size-5" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            Installez KAZA sur votre téléphone
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Pour un accès rapide à vos annonces et messages.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleInstall}
              disabled={installing}
              className="bg-kaza-blue hover:bg-kaza-blue/90"
            >
              {installing ? 'Installation…' : 'Installer'}
            </Button>
            <Button size="sm" variant="ghost" onClick={dismiss}>
              Plus tard
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted"
          aria-label="Fermer"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
