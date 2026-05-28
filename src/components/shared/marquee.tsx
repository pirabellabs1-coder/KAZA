'use client';

import { type ReactNode, type CSSProperties, Children } from 'react';
import { cn } from '@/lib/utils';

interface MarqueeProps {
  children: ReactNode;
  /** Vitesse en pixels/seconde. Default 60 */
  speed?: number;
  /** Direction du défilement. Default 'left' */
  direction?: 'left' | 'right';
  /** Pause le défilement au survol. Default true */
  pauseOnHover?: boolean;
  className?: string;
  /** Largeur estimée du contenu en px (sert au calcul de durée). Default 1200 */
  contentWidth?: number;
}

/**
 * Marquee - Bande défilante infinie pour partenaires, témoignages, logos.
 * Duplique le contenu pour assurer la boucle visuelle continue.
 * Utilise les classes CSS définies dans src/styles/animations.css.
 */
export function Marquee({
  children,
  speed = 60,
  direction = 'left',
  pauseOnHover = true,
  className,
  contentWidth = 1200,
}: MarqueeProps) {
  // Durée = distance / vitesse. On parcourt -50% de la largeur totale dupliquée
  // donc la durée correspond à 100% de la largeur du contenu original.
  const duration = Math.max(5, contentWidth / Math.max(1, speed));

  const trackStyle: CSSProperties = {
    ['--marquee-duration' as string]: `${duration}s`,
  };

  const items = Children.toArray(children);

  return (
    <div
      className={cn(
        'overflow-hidden w-full',
        pauseOnHover && 'marquee-pause',
        className,
      )}
    >
      <div
        className={cn(
          'flex w-max marquee-track',
          direction === 'left' ? 'marquee-left' : 'marquee-right',
        )}
        style={trackStyle}
      >
        {/* Contenu original */}
        <div className="flex shrink-0 items-center gap-8 pr-8">
          {items.map((child, i) => (
            <div key={`a-${i}`} className="shrink-0">
              {child}
            </div>
          ))}
        </div>
        {/* Duplicat pour boucle infinie */}
        <div className="flex shrink-0 items-center gap-8 pr-8" aria-hidden="true">
          {items.map((child, i) => (
            <div key={`b-${i}`} className="shrink-0">
              {child}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
