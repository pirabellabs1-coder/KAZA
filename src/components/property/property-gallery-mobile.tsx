'use client';

import Image from 'next/image';
import { X } from 'lucide-react';
import { useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useSwipe } from '@/hooks/use-swipe';

interface Photo {
  url: string;
  alt?: string;
}

interface PropertyGalleryMobileProps {
  photos: Photo[];
  initialIndex?: number;
  className?: string;
}

/**
 * Galerie photo mobile-first pour une fiche propriete.
 * - Swipe gauche/droite pour changer de photo
 * - Compteur "N / total" en haut-droite
 * - Dots indicators en bas
 * - Tap sur l'image -> lightbox plein-ecran
 */
export function PropertyGalleryMobile({
  photos,
  initialIndex = 0,
  className,
}: PropertyGalleryMobileProps) {
  const safeInitial = Math.min(Math.max(0, initialIndex), Math.max(0, photos.length - 1));
  const [index, setIndex] = useState(safeInitial);
  const [lightbox, setLightbox] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);

  const next = useCallback(() => {
    setIndex((i) => (photos.length === 0 ? 0 : (i + 1) % photos.length));
  }, [photos.length]);

  const prev = useCallback(() => {
    setIndex((i) => (photos.length === 0 ? 0 : (i - 1 + photos.length) % photos.length));
  }, [photos.length]);

  useSwipe(containerRef, {
    onSwipeLeft: next,
    onSwipeRight: prev,
  });

  useSwipe(lightboxRef, {
    onSwipeLeft: next,
    onSwipeRight: prev,
    onSwipeDown: () => setLightbox(false),
  });

  // Escape pour fermer la lightbox
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false);
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, next, prev]);

  if (photos.length === 0) {
    return (
      <div
        className={cn(
          'relative w-screen max-h-[400px] h-[70vh] bg-gray-100 flex items-center justify-center text-sm text-gray-500',
          className,
        )}
      >
        Aucune photo
      </div>
    );
  }

  const current = photos[index];

  return (
    <>
      <div
        ref={containerRef}
        className={cn(
          'relative w-screen max-h-[400px] h-[70vh] bg-black no-select overflow-hidden',
          className,
        )}
        role="region"
        aria-label="Galerie photos de la propriete"
      >
        <button
          type="button"
          onClick={() => setLightbox(true)}
          className="absolute inset-0 z-0 cursor-zoom-in"
          aria-label="Ouvrir la galerie en plein ecran"
        >
          <Image
            src={current.url}
            alt={current.alt ?? `Photo ${index + 1}`}
            fill
            sizes="100vw"
            className="object-cover"
            priority={index === 0}
          />
        </button>

        {/* Compteur */}
        <div className="absolute top-3 right-3 z-10 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm pointer-events-none">
          {index + 1} / {photos.length}
        </div>

        {/* Dots */}
        {photos.length > 1 && (
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex(i);
                }}
                aria-label={`Photo ${i + 1}`}
                aria-current={i === index}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === index ? 'w-6 bg-kaza-blue' : 'w-1.5 bg-white/70',
                )}
              />
            ))}
          </div>
        )}
      </div>

      {lightbox && (
        <div
          ref={lightboxRef}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black no-select"
          role="dialog"
          aria-modal="true"
          aria-label="Galerie plein ecran"
        >
          <button
            type="button"
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Fermer"
          >
            <X className="size-5" />
          </button>

          <div className="absolute top-4 left-4 z-10 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
            {index + 1} / {photos.length}
          </div>

          <div className="relative h-full w-full">
            <Image
              src={current.url}
              alt={current.alt ?? `Photo ${index + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
