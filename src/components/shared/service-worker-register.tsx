'use client';

// =============================================================================
// KAZA - Service Worker Register (Client)
// Wave 10 - Olamide Adesanya (Mobile/PWA Specialist)
//
// Composant invisible qui enregistre `/sw.js` au mount.
// - Uniquement en production (NODE_ENV === 'production') pour eviter les
//   conflits avec le HMR de Next.js en dev.
// - SSR-safe : verifie la presence de `navigator` avant tout.
// - Silencieux en cas d'erreur (log console.warn).
// =============================================================================

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    const register = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js');
      } catch (err) {
        console.warn('[service-worker-register] echec enregistrement', err);
      }
    };

    // Differe l'enregistrement apres le load pour ne pas competir avec les
    // ressources critiques de la premiere peinture.
    if (document.readyState === 'complete') {
      void register();
    } else {
      window.addEventListener('load', register, { once: true });
      return () => window.removeEventListener('load', register);
    }
  }, []);

  return null;
}
