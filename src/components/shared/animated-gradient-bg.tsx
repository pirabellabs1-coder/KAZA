'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedGradientBgProps {
  children: ReactNode;
  className?: string;
}

/**
 * AnimatedGradientBg - Background animé pour hero ou sections premium.
 * Deux blobs colorés (kaza-blue, kaza-green) animés via CSS @keyframes blob.
 * Un overlay blanc + backdrop-blur adoucit l'ensemble pour préserver la lisibilité.
 */
export function AnimatedGradientBg({ children, className }: AnimatedGradientBgProps) {
  return (
    <div className={cn('relative overflow-hidden isolate', className)}>
      {/* Blob 1 - bleu */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -left-24 h-[28rem] w-[28rem] rounded-full bg-kaza-blue opacity-40 mix-blend-multiply blur-3xl animate-blob"
      />
      {/* Blob 2 - vert */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -right-24 h-[28rem] w-[28rem] rounded-full bg-kaza-green opacity-40 mix-blend-multiply blur-3xl animate-blob animation-delay-2000"
      />
      {/* Blob 3 - navy (subtil, ajoute de la profondeur) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[22rem] w-[22rem] rounded-full bg-kaza-navy opacity-20 mix-blend-multiply blur-3xl animate-blob animation-delay-4000"
      />
      {/* Overlay adoucisseur */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-white/80 backdrop-blur-3xl"
      />
      {/* Contenu */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
