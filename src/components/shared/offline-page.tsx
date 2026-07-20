'use client';

// =============================================================================
// Kaabo - Offline Page (Client)
// Wave 10 - Olamide Adesanya (Mobile/PWA Specialist)
//
// UI plein ecran affichee quand l'utilisateur est hors ligne et qu'aucune
// page mise en cache ne correspond. A utiliser dans `not-found.tsx` ou
// dans une route `/offline` dediee.
// =============================================================================

import { WifiOff, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function OfflinePage() {
  const handleRetry = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-12 text-center"
    >
      <div className="flex size-20 items-center justify-center rounded-full bg-muted">
        <WifiOff className="size-10 text-muted-foreground" aria-hidden="true" />
      </div>
      <h1 className="mt-6 text-2xl font-semibold text-foreground sm:text-3xl">
        Vous etes hors ligne
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground sm:text-base">
        Les pages deja visitees restent accessibles. Verifiez votre connexion
        puis reessayez.
      </p>
      <Button
        onClick={handleRetry}
        className="mt-6 bg-kaza-blue hover:bg-kaza-blue/90"
      >
        <RotateCcw className="mr-2 size-4" aria-hidden="true" />
        Reessayer
      </Button>
    </div>
  );
}
