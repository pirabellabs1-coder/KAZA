'use client';

import { useEffect, useState } from 'react';

/**
 * Hook qui retourne l'état de connexion en ligne du navigateur.
 * SSR-safe : retourne `true` au démarrage côté serveur ou avant hydratation.
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initialiser avec la valeur réelle après hydratation
    setIsOnline(window.navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
