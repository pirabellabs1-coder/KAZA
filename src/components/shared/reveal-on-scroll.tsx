'use client';

import { type ReactNode, type CSSProperties } from 'react';
import { useInView } from '@/hooks/use-in-view';
import { cn } from '@/lib/utils';

type Direction = 'up' | 'down' | 'left' | 'right' | 'zoom';

interface RevealOnScrollProps {
  children: ReactNode;
  /** Direction d'apparition. Default 'up' */
  direction?: Direction;
  /** Distance en px pour les translations (ignoré pour 'zoom'). Default 24 */
  distance?: number;
  /** Delay in ms. Default 0 */
  delay?: number;
  /** Duration in ms. Default 600 */
  duration?: number;
  className?: string;
}

function getHiddenTransform(direction: Direction, distance: number): string {
  switch (direction) {
    case 'up':
      return `translateY(${distance}px)`;
    case 'down':
      return `translateY(-${distance}px)`;
    case 'left':
      return `translateX(${distance}px)`;
    case 'right':
      return `translateX(-${distance}px)`;
    case 'zoom':
      return 'scale(0.92)';
  }
}

/**
 * RevealOnScroll - Combine fade + translation directionnelle au scroll.
 * GPU-accelerated (transform + opacity uniquement).
 */
export function RevealOnScroll({
  children,
  direction = 'up',
  distance = 24,
  delay = 0,
  duration = 600,
  className,
}: RevealOnScrollProps) {
  const { ref, inView } = useInView<HTMLDivElement>();

  const hiddenTransform = getHiddenTransform(direction, distance);
  const visibleTransform = direction === 'zoom' ? 'scale(1)' : 'translate(0, 0)';

  const style: CSSProperties = {
    opacity: inView ? 1 : 0,
    transform: inView ? visibleTransform : hiddenTransform,
    transition: `opacity ${duration}ms ease-out ${delay}ms, transform ${duration}ms ease-out ${delay}ms`,
    willChange: 'opacity, transform',
  };

  return (
    <div ref={ref} className={cn(className)} style={style}>
      {children}
    </div>
  );
}
