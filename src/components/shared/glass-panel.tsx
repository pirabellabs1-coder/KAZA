import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Intensity = 'light' | 'medium' | 'strong';
type Tint = 'navy' | 'blue' | 'white';

interface GlassPanelProps {
  children: ReactNode;
  /** Intensité du flou. Default 'medium' */
  intensity?: Intensity;
  /** Teinte de fond. Default 'white' */
  tint?: Tint;
  className?: string;
}

const blurMap: Record<Intensity, string> = {
  light: 'backdrop-blur-md',
  medium: 'backdrop-blur-lg',
  strong: 'backdrop-blur-xl',
};

const opacityMap: Record<Intensity, string> = {
  light: '/10',
  medium: '/15',
  strong: '/20',
};

const tintMap: Record<Tint, string> = {
  navy: 'bg-kaza-navy',
  blue: 'bg-kaza-blue',
  white: 'bg-white',
};

const borderMap: Record<Tint, string> = {
  navy: 'border-white/10',
  blue: 'border-white/20',
  white: 'border-white/20',
};

/**
 * GlassPanel - Wrapper "glassmorphism" pour cartes, panneaux premium.
 * Compose backdrop-blur + bg semi-transparent + border + shadow.
 */
export function GlassPanel({
  children,
  intensity = 'medium',
  tint = 'white',
  className,
}: GlassPanelProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border shadow-xl',
        blurMap[intensity],
        `${tintMap[tint]}${opacityMap[intensity]}`,
        borderMap[tint],
        className,
      )}
    >
      {children}
    </div>
  );
}
