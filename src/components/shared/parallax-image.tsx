'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ParallaxImageProps {
  src: string;
  alt: string;
  /** Intensité du parallax (0 = aucun, 1 = scroll 1:1). Default 0.2 */
  intensity?: number;
  className?: string;
  /** Si true, utilise next/image fill (le parent doit être relative). Default true */
  fill?: boolean;
}

/**
 * ParallaxImage - Image avec effet parallax léger au scroll.
 * Utilise requestAnimationFrame pour throttler les calculs.
 * SSR-safe + respecte prefers-reduced-motion.
 */
export function ParallaxImage({
  src,
  alt,
  intensity = 0.2,
  className,
  fill = true,
}: ParallaxImageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Respect prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) return;

    let rafId: number | null = null;
    let ticking = false;

    const update = () => {
      const node = containerRef.current;
      if (node) {
        const rect = node.getBoundingClientRect();
        const viewportH = window.innerHeight || 1;
        // Distance normalisée du centre de l'élément par rapport au centre du viewport
        const elementCenter = rect.top + rect.height / 2;
        const viewportCenter = viewportH / 2;
        const delta = elementCenter - viewportCenter;
        setOffsetY(-delta * intensity);
      }
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        rafId = requestAnimationFrame(update);
        ticking = true;
      }
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [intensity]);

  return (
    <div ref={containerRef} className={cn('relative overflow-hidden', className)}>
      <div
        className="absolute inset-0"
        style={{
          transform: `translate3d(0, ${offsetY}px, 0)`,
          willChange: 'transform',
        }}
      >
        {fill ? (
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} className="w-full h-full object-cover" />
        )}
      </div>
    </div>
  );
}
