"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  RotateCw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Viewer panorama 360° simple sans dépendance externe.
 *
 * Approche : on prend une image équirectangulaire (panorama) et on permet
 * le pan horizontal (et vertical limité) au drag de souris ou au touch.
 * L'image est rendue dans un conteneur en overflow:hidden, on translate
 * un <img> qui fait ~3x la largeur visible pour permettre une rotation
 * fluide à 360° (on wrap quand on dépasse les bords).
 *
 * Ce n'est pas un vrai rendu sphérique WebGL — mais ça donne une
 * sensation de visite à 360° très convaincante sur mobile et desktop,
 * et reste léger (pas de three.js, photo-sphere-viewer, etc.).
 *
 * Pour un vrai rendu sphérique : remplacer par @photo-sphere-viewer/core
 * une fois l'image équirectangulaire produite.
 */

export interface PanoramaScene {
  /** URL d'une image équirectangulaire (ratio 2:1 idéalement) */
  url: string;
  /** Nom de la pièce / zone (ex: "Salon", "Chambre", "Extérieur"). */
  label?: string;
  /**
   * Orientation de départ (fraction 0→1) : où la scène s'ouvre par défaut.
   * 0 = bord gauche de la photo, 0.5 = centre, etc. Réglable à la création.
   */
  startAngle?: number;
}

interface Panorama360ViewerProps {
  /** Scène unique (rétrocompat). */
  src?: string;
  /** Visite multi-scènes ordonnée (salon, chambres, extérieur…). */
  scenes?: PanoramaScene[];
  /** Texte alternatif */
  alt?: string;
  /** Hauteur du viewer (px ou Tailwind class via className) */
  height?: number;
  className?: string;
  /** Autoplay rotation horizontale */
  autoRotate?: boolean;
}

export function Panorama360Viewer({
  src,
  scenes,
  alt = "Vue à 360°",
  height = 480,
  className,
  autoRotate = false,
}: Panorama360ViewerProps) {
  // Liste de scènes normalisée (fallback sur `src` unique).
  const sceneList = useMemo<PanoramaScene[]>(
    () =>
      scenes && scenes.length > 0 ? scenes : src ? [{ url: src }] : [],
    [scenes, src],
  );
  const [sceneIndex, setSceneIndex] = useState(0);
  const safeIndex = Math.min(sceneIndex, Math.max(sceneList.length - 1, 0));
  const currentSrc = sceneList[safeIndex]?.url ?? "";
  const currentLabel = sceneList[safeIndex]?.label;
  const currentStart = sceneList[safeIndex]?.startAngle ?? 0;
  const multi = sceneList.length > 1;

  const goPrev = () =>
    setSceneIndex((i) => (i - 1 + sceneList.length) % sceneList.length);
  const goNext = () => setSceneIndex((i) => (i + 1) % sceneList.length);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [rotating, setRotating] = useState(autoRotate);
  const dragStart = useRef<{ x: number; offsetX: number } | null>(null);

  // Au changement de scène : on relance le chargement et on positionne
  // l'image selon l'orientation de départ réglée par le propriétaire.
  useEffect(() => {
    setIsLoaded(false);
    const width = containerRef.current?.clientWidth ?? 0;
    const frac = Math.min(Math.max(currentStart, 0), 1);
    setOffsetX(-frac * width);
  }, [currentSrc, currentStart]);

  // Auto-rotation
  useEffect(() => {
    if (!rotating || isDragging) return;
    let raf = 0;
    const tick = () => {
      setOffsetX((prev) => {
        const max = (containerRef.current?.clientWidth ?? 800) * zoom;
        const next = prev - 0.4;
        return next < -max ? next + max : next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [rotating, isDragging, zoom]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, offsetX };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const newOffset = dragStart.current.offsetX + dx;
    const containerWidth = containerRef.current?.clientWidth ?? 800;
    const imgWidth = containerWidth * 3 * zoom;
    // Wrap horizontal pour effet 360°
    let wrapped = newOffset;
    while (wrapped > 0) wrapped -= imgWidth / 3;
    while (wrapped < -imgWidth / 3) wrapped += imgWidth / 3;
    setOffsetX(wrapped);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    dragStart.current = null;
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 2.5));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 1));
  const handleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void containerRef.current.requestFullscreen?.();
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-black select-none",
        className,
      )}
      style={{ height }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Image panorama — 3x la largeur visible pour permettre le wrap 360° */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={currentSrc}
        alt={currentLabel ?? alt}
        onLoad={() => setIsLoaded(true)}
        className={cn(
          "h-full select-none object-cover pointer-events-none transition-opacity duration-500",
          isLoaded ? "opacity-100" : "opacity-0",
          isDragging ? "cursor-grabbing" : "cursor-grab",
        )}
        style={{
          width: `${300 * zoom}%`,
          transform: `translate3d(${offsetX}px, 0, 0)`,
          willChange: "transform",
        }}
        draggable={false}
      />

      {/* Overlay de chargement */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-kaza-navy to-black text-white">
          <div className="flex flex-col items-center gap-3">
            <RotateCw className="size-8 animate-spin opacity-70" />
            <p className="text-sm">Chargement du panorama…</p>
          </div>
        </div>
      )}

      {/* Badge 360° */}
      <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-kaza-navy backdrop-blur">
        <span className="text-base leading-none">⊙</span>
        360°
      </div>

      {/* Navigation multi-scènes (visite : pièce par pièce) */}
      {multi && (
        <>
          {/* Nom de la pièce + compteur */}
          <div className="pointer-events-none absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full bg-black/70 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur">
            {currentLabel ?? `Scène ${safeIndex + 1}`}
            <span className="ml-2 text-xs font-normal text-white/70">
              {safeIndex + 1} / {sceneList.length}
            </span>
          </div>

          {/* Pastilles de scènes */}
          <div className="absolute left-1/2 top-14 z-10 flex max-w-[80%] -translate-x-1/2 flex-wrap justify-center gap-1.5">
            {sceneList.map((s, i) => (
              <button
                key={i}
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setSceneIndex(i)}
                title={s.label ?? `Scène ${i + 1}`}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === safeIndex
                    ? "w-6 bg-white"
                    : "w-2 bg-white/50 hover:bg-white/80",
                )}
                aria-label={s.label ?? `Scène ${i + 1}`}
              />
            ))}
          </div>

          {/* Flèche précédente */}
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={goPrev}
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/55 p-2.5 text-white shadow-lg backdrop-blur transition-colors hover:bg-kaza-blue"
            aria-label="Pièce précédente"
          >
            <ChevronLeft className="size-6" />
          </button>

          {/* Flèche suivante */}
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={goNext}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/55 p-2.5 text-white shadow-lg backdrop-blur transition-colors hover:bg-kaza-blue"
            aria-label="Pièce suivante"
          >
            <ChevronRight className="size-6" />
          </button>
        </>
      )}

      {/* Hint drag — disparaît au premier drag */}
      {!isDragging && (
        <div className="pointer-events-none absolute inset-x-0 bottom-20 mx-auto flex w-fit items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-xs text-white backdrop-blur opacity-90 transition-opacity group-hover:opacity-100">
          <span>👆</span>
          Glissez pour explorer
        </div>
      )}

      {/* Toolbar */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/70 px-2 py-1.5 backdrop-blur">
        <button
          type="button"
          onClick={() => setRotating((r) => !r)}
          className={cn(
            "rounded-full p-2 text-white transition-colors",
            rotating ? "bg-kaza-blue" : "hover:bg-white/10",
          )}
          aria-label={rotating ? "Arrêter la rotation" : "Rotation auto"}
          title={rotating ? "Arrêter la rotation" : "Rotation auto"}
        >
          <RotateCw className={cn("size-4", rotating && "animate-spin")} />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="rounded-full p-2 text-white transition-colors hover:bg-white/10 disabled:opacity-30"
          aria-label="Zoom arrière"
          disabled={zoom <= 1}
        >
          <ZoomOut className="size-4" />
        </button>
        <span className="px-2 text-xs font-medium text-white tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={handleZoomIn}
          className="rounded-full p-2 text-white transition-colors hover:bg-white/10 disabled:opacity-30"
          aria-label="Zoom avant"
          disabled={zoom >= 2.5}
        >
          <ZoomIn className="size-4" />
        </button>
        <div className="mx-1 h-5 w-px bg-white/20" />
        <button
          type="button"
          onClick={handleFullscreen}
          className="rounded-full p-2 text-white transition-colors hover:bg-white/10"
          aria-label="Plein écran"
        >
          <Maximize2 className="size-4" />
        </button>
      </div>
    </div>
  );
}
