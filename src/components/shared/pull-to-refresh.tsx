'use client';

import { Loader2 } from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
} from 'react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  /** Distance en px pour declencher (defaut 70) */
  threshold?: number;
  /** Distance max d'etirement (defaut 120) */
  maxPull?: number;
  className?: string;
}

/**
 * Wrapper detectant le pull-down quand scrollTop est a 0.
 * Mobile-only (cache par md:hidden equivalent : on no-op si viewport > 768px).
 */
export function PullToRefresh({
  children,
  onRefresh,
  threshold = 70,
  maxPull = 120,
  className,
}: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () => setEnabled(window.innerWidth <= 768);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const handleTouchStart = (e: ReactTouchEvent<HTMLDivElement>) => {
    if (!enabled || refreshing) return;
    const el = containerRef.current;
    if (!el || el.scrollTop > 0) return;
    startY.current = e.touches[0]?.clientY ?? null;
  };

  const handleTouchMove = (e: ReactTouchEvent<HTMLDivElement>) => {
    if (!enabled || refreshing || startY.current === null) return;
    const current = e.touches[0]?.clientY ?? 0;
    const dy = current - startY.current;
    if (dy <= 0) {
      setPull(0);
      return;
    }
    // resistance : on amortit au-dela du threshold
    const resisted = Math.min(maxPull, dy * 0.5);
    setPull(resisted);
  };

  const handleTouchEnd = async () => {
    if (!enabled || refreshing) {
      startY.current = null;
      return;
    }
    const distance = pull;
    startY.current = null;
    if (distance >= threshold) {
      setRefreshing(true);
      setPull(threshold);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
  };

  const indicatorVisible = pull > 0 || refreshing;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className={cn('relative overflow-auto', className)}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <div
        aria-hidden={!indicatorVisible}
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-center',
          'transition-opacity',
          indicatorVisible ? 'opacity-100' : 'opacity-0',
        )}
        style={{ height: Math.max(0, pull) }}
      >
        <Loader2
          className={cn(
            'size-5 text-kaza-blue',
            refreshing ? 'animate-spin' : '',
          )}
        />
      </div>
      <div
        style={{
          transform: pull > 0 ? `translateY(${pull}px)` : undefined,
          transition: startY.current === null ? 'transform 200ms ease-out' : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
