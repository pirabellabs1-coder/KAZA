'use client';

import { useEffect } from 'react';

/**
 * Hook qui maintient la CSS variable `--vh` synchronisee avec la hauteur
 * reelle du viewport (`window.innerHeight * 0.01`).
 *
 * Utile sur mobile pour eviter les sauts dus a la barre d'URL :
 * utiliser `h-[calc(var(--vh)*100)]` au lieu de `h-screen`.
 *
 * SSR-safe : ne fait rien sur le serveur, s'execute uniquement au mount.
 */
export function useViewportHeight(): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVh();

    window.addEventListener('resize', setVh);
    window.addEventListener('orientationchange', setVh);

    return () => {
      window.removeEventListener('resize', setVh);
      window.removeEventListener('orientationchange', setVh);
    };
  }, []);
}
