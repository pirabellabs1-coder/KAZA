'use client';

import { type ReactNode, type CSSProperties } from 'react';
import { useInView } from '@/hooks/use-in-view';
import { cn } from '@/lib/utils';

interface FadeInProps {
  children: ReactNode;
  /** Delay in ms before the animation starts. Default 0 */
  delay?: number;
  /** Animation duration in ms. Default 600 */
  duration?: number;
  className?: string;
}

/**
 * FadeIn - Apparition en fondu + translateY(8px) -> 0 quand l'élément
 * entre dans le viewport. GPU-accelerated (transform + opacity uniquement).
 */
export function FadeIn({ children, delay = 0, duration = 600, className }: FadeInProps) {
  const { ref, inView } = useInView<HTMLDivElement>();

  const style: CSSProperties = {
    opacity: inView ? 1 : 0,
    transform: inView ? 'translateY(0)' : 'translateY(8px)',
    transition: `opacity ${duration}ms ease-out ${delay}ms, transform ${duration}ms ease-out ${delay}ms`,
    willChange: 'opacity, transform',
  };

  return (
    <div ref={ref} className={cn(className)} style={style}>
      {children}
    </div>
  );
}
