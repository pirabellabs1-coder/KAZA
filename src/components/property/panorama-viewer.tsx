"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Visionneuse panoramique 360° simple.
 *
 * Pas de dépendance externe. Utilise une image panoramique équirectangulaire
 * (ratio 2:1, format standard 360°). Le drag horizontal/vertical fait défiler
 * l'image avec un effet parallax. Compatible souris + tactile.
 *
 * Pour un vrai rendu sphérique WebGL, on basculerait sur `@photo-sphere-viewer/core`
 * (non installé dans cette démo).
 */
export interface PanoramaViewerProps {
  src: string;
  alt?: string;
  /** Vitesse de drag horizontale (0.5 = lent, 2 = rapide). Défaut 1. */
  sensitivity?: number;
  className?: string;
}

export function PanoramaViewer({
  src,
  alt = "Panorama 360°",
  sensitivity = 1,
  className,
}: PanoramaViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [offsetX, setOffsetX] = useState(50);
  const [offsetY, setOffsetY] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const startRef = useRef<{
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const auto = useRef<number | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);

  // Auto-rotation lente quand on ne drag pas
  useEffect(() => {
    if (!autoRotate || isDragging) {
      if (auto.current) cancelAnimationFrame(auto.current);
      return;
    }
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      setOffsetX((prev) => {
        const next = (prev + dt * 0.005) % 100;
        return next < 0 ? next + 100 : next;
      });
      auto.current = requestAnimationFrame(tick);
    };
    auto.current = requestAnimationFrame(tick);
    return () => {
      if (auto.current) cancelAnimationFrame(auto.current);
    };
  }, [autoRotate, isDragging]);

  const onPointerDown = (e: React.PointerEvent) => {
    setAutoRotate(false);
    setIsDragging(true);
    containerRef.current?.setPointerCapture(e.pointerId);
    startRef.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX,
      offsetY,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !startRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = (e.clientX - startRef.current.x) / rect.width;
    const dy = (e.clientY - startRef.current.y) / rect.height;
    const newX = (startRef.current.offsetX - dx * 100 * sensitivity) % 100;
    const newY = Math.max(
      20,
      Math.min(80, startRef.current.offsetY - dy * 100 * sensitivity),
    );
    setOffsetX(newX < 0 ? newX + 100 : newX);
    setOffsetY(newY);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    startRef.current = null;
    try {
      containerRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const resetView = () => {
    setOffsetX(50);
    setOffsetY(50);
    setAutoRotate(true);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-gray-900",
        isFullscreen ? "h-screen w-screen rounded-none" : "aspect-[2/1] w-full",
        className,
      )}
    >
      {/* Image panoramique : on rend l'image en doublant la largeur pour boucler */}
      <div
        className="absolute inset-0 cursor-grab select-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- image panoramique 360° manipulée via ref/transform (largeur 200%, drag), next/image inadapté */}
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          draggable={false}
          onLoad={() => setLoaded(true)}
          className="pointer-events-none absolute inset-y-0 h-full select-none object-cover"
          style={{
            width: "200%",
            left: `${-offsetX}%`,
            objectPosition: `center ${offsetY}%`,
            transition: isDragging ? "none" : "left 80ms linear",
          }}
        />
      </div>

      {/* Loading overlay */}
      {!loaded ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="flex flex-col items-center gap-3 text-white/80">
            <div className="size-8 animate-spin rounded-full border-4 border-white/20 border-t-white" />
            <p className="text-xs">Chargement de la vue 360°…</p>
          </div>
        </div>
      ) : null}

      {/* Badge 360° */}
      <div className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
        <span className="size-2 animate-pulse rounded-full bg-kaza-green" />
        Vue 360°
      </div>

      {/* Hint drag */}
      {loaded && autoRotate ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-16 flex justify-center">
          <div className="rounded-full bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur">
            ↔ Faites glisser pour explorer
          </div>
        </div>
      ) : null}

      {/* Contrôles */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="size-9 rounded-full bg-white/90 backdrop-blur hover:bg-white"
          onClick={resetView}
          aria-label="Réinitialiser la vue"
        >
          <RotateCcw className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="size-9 rounded-full bg-white/90 backdrop-blur hover:bg-white"
          onClick={toggleFullscreen}
          aria-label="Plein écran"
        >
          {isFullscreen ? (
            <Minimize2 className="size-4" />
          ) : (
            <Maximize2 className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
