'use client';

import { useEffect, type RefObject } from 'react';

export interface UseSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  /** Distance minimale en pixels pour valider un swipe (defaut 50) */
  threshold?: number;
  /** Duree maximale du geste en ms (defaut 500) */
  maxDuration?: number;
}

/**
 * Hook detectant les swipes tactiles sur un element.
 *
 * Capture touchstart/touchmove/touchend, calcule dx/dy et la duree.
 * Annule le geste si dx/dy sont inferieurs au threshold ou si la duree
 * depasse maxDuration. La direction dominante (horizontale vs verticale)
 * determine quel callback est invoque.
 */
export function useSwipe<T extends HTMLElement>(
  ref: RefObject<T | null>,
  options: UseSwipeOptions,
): void {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    maxDuration = 500,
  } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === 'undefined') return;

    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let tracking = false;

    const handleStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      startX = t.clientX;
      startY = t.clientY;
      startTime = Date.now();
      tracking = true;
    };

    const handleMove = (_e: TouchEvent) => {
      // no-op: on attend touchend pour decider
    };

    const handleEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      if (!t) return;

      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const duration = Date.now() - startTime;

      if (duration > maxDuration) return;

      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (absX < threshold && absY < threshold) return;

      if (absX >= absY) {
        if (dx < 0) onSwipeLeft?.();
        else onSwipeRight?.();
      } else {
        if (dy < 0) onSwipeUp?.();
        else onSwipeDown?.();
      }
    };

    const handleCancel = () => {
      tracking = false;
    };

    el.addEventListener('touchstart', handleStart, { passive: true });
    el.addEventListener('touchmove', handleMove, { passive: true });
    el.addEventListener('touchend', handleEnd, { passive: true });
    el.addEventListener('touchcancel', handleCancel, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleStart);
      el.removeEventListener('touchmove', handleMove);
      el.removeEventListener('touchend', handleEnd);
      el.removeEventListener('touchcancel', handleCancel);
    };
  }, [ref, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, maxDuration]);
}
