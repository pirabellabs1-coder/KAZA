'use client';

import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/use-online-status';

/**
 * Bannière fixe affichée en haut de page lorsque l'utilisateur perd la connexion.
 * À monter au niveau du root layout pour une couverture globale.
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-2 border-b border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-800"
    >
      <WifiOff className="size-4" aria-hidden="true" />
      <span>Vous êtes hors ligne. Certaines fonctionnalités sont limitées.</span>
    </div>
  );
}
