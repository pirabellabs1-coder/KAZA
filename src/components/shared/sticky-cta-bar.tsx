import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StickyCtaBarProps {
  children: ReactNode;
  className?: string;
}

/**
 * Barre d'actions principale collee en bas d'ecran sur mobile uniquement.
 * Se positionne au-dessus du `BottomNav` (h-16 = 64px) et respecte la
 * safe-area-inset-bottom des appareils a encoche.
 */
export function StickyCtaBar({ children, className }: StickyCtaBarProps) {
  return (
    <div
      className={cn(
        'fixed inset-x-0 z-40 md:hidden',
        'bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.08)]',
        'h-16 px-4',
        'flex items-center gap-2',
        className,
      )}
      style={{
        bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {children}
    </div>
  );
}
