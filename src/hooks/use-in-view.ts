'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

interface UseInViewOptions {
  threshold?: number;
  once?: boolean;
  rootMargin?: string;
}

/**
 * useInView - SSR-safe hook to detect when an element enters the viewport.
 *
 * @param options.threshold - IntersectionObserver threshold (default 0.15)
 * @param options.once - If true, stop observing after first intersection (default true)
 * @param options.rootMargin - IntersectionObserver rootMargin (default '0px')
 */
export function useInView<T extends Element>(
  options: UseInViewOptions = {},
): { ref: RefObject<T | null>; inView: boolean } {
  const { threshold = 0.15, once = true, rootMargin = '0px' } = options;
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback : pas d'IO -> on considère que c'est visible
      // eslint-disable-next-line react-hooks/set-state-in-effect -- setState intentionnel dans un effet (init/hydratation SSR-safe, abonnement navigateur ou souscription externe) — pattern correct, pas de cascade de rendu problematique
      setInView(true);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          setInView(true);
          if (once) {
            observer.unobserve(entry.target);
          }
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, once, rootMargin]);

  return { ref, inView };
}
