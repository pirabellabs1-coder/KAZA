"use client";

import Image from "next/image";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Move,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface VirtualTourProps {
  images: string[];
  videoUrl?: string; // YouTube / Vimeo
  embedUrl?: string; // Matterport ou équivalent
}

type TourTab = "photos" | "video" | "tour360";

/**
 * Convertit une URL YouTube/Vimeo vers une URL d'embed iframe.
 * Renvoie l'URL d'origine si on ne sait pas la reconnaître (l'iframe se
 * débrouillera, ou l'utilisateur fournit déjà une URL d'embed).
 */
function toEmbedUrl(raw: string): string {
  try {
    const u = new URL(raw);
    // YouTube watch?v=
    if (
      (u.hostname.includes("youtube.com") ||
        u.hostname.includes("youtu.be")) &&
      !u.pathname.startsWith("/embed/")
    ) {
      const id =
        u.hostname.includes("youtu.be")
          ? u.pathname.slice(1)
          : u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    // Vimeo
    if (
      u.hostname.includes("vimeo.com") &&
      !u.hostname.includes("player.vimeo.com")
    ) {
      const id = u.pathname.replace(/\//g, "");
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    return raw;
  } catch {
    return raw;
  }
}

export function VirtualTour({ images, videoUrl, embedUrl }: VirtualTourProps) {
  const tabs = useMemo<TourTab[]>(() => {
    const list: TourTab[] = [];
    if (images.length > 0) list.push("photos");
    if (videoUrl) list.push("video");
    if (embedUrl || images.length > 0) list.push("tour360");
    return list;
  }, [images.length, videoUrl, embedUrl]);

  const [active, setActive] = useState<TourTab>(tabs[0] ?? "photos");
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // --- Parallaxe : panorama drag --------------------------------------
  // On translate horizontalement l'image en réponse au pointeur. Effet
  // simple mais convaincant quand on n'a pas de vrai panorama équirectangulaire.
  const panoramaRef = useRef<HTMLDivElement>(null);
  const [offsetX, setOffsetX] = useState(0);
  const dragRef = useRef<{ startX: number; startOffset: number } | null>(null);

  const maxOffset = 80; // px de déplacement max de part et d'autre.

  function onPointerDown(ev: ReactPointerEvent<HTMLDivElement>) {
    (ev.currentTarget as HTMLDivElement).setPointerCapture(ev.pointerId);
    dragRef.current = { startX: ev.clientX, startOffset: offsetX };
  }
  function onPointerMove(ev: ReactPointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const delta = ev.clientX - dragRef.current.startX;
    const next = Math.max(
      -maxOffset,
      Math.min(maxOffset, dragRef.current.startOffset + delta * 0.5)
    );
    setOffsetX(next);
  }
  function onPointerUp() {
    dragRef.current = null;
  }

  // Esc pour quitter le fullscreen.
  useEffect(() => {
    if (!isFullscreen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsFullscreen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFullscreen]);

  if (tabs.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-xl bg-muted text-muted-foreground">
        Aucun média disponible
      </div>
    );
  }

  const embedSrc = videoUrl ? toEmbedUrl(videoUrl) : undefined;
  const tourSrc = embedUrl ?? null;

  return (
    <>
      <div className="space-y-3">
        <Tabs
          value={active}
          onValueChange={(v) => setActive(v as TourTab)}
        >
          <div className="flex items-center justify-between gap-2">
            <TabsList>
              {tabs.includes("photos") && (
                <TabsTrigger value="photos">Photos</TabsTrigger>
              )}
              {tabs.includes("video") && (
                <TabsTrigger value="video">Vidéo</TabsTrigger>
              )}
              {tabs.includes("tour360") && (
                <TabsTrigger value="tour360">Visite 360°</TabsTrigger>
              )}
            </TabsList>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsFullscreen(true)}
              aria-label="Plein écran"
            >
              <Maximize className="size-4" />
            </Button>
          </div>

          {/* Photos */}
          {tabs.includes("photos") && (
            <TabsContent value="photos" className="mt-3">
              <PhotosView
                images={images}
                index={photoIndex}
                onIndexChange={setPhotoIndex}
              />
            </TabsContent>
          )}

          {/* Vidéo */}
          {tabs.includes("video") && embedSrc && (
            <TabsContent value="video" className="mt-3">
              <div className="relative w-full overflow-hidden rounded-xl bg-black">
                <div className="relative aspect-video w-full">
                  <iframe
                    src={embedSrc}
                    title="Visite vidéo"
                    className="absolute inset-0 h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </TabsContent>
          )}

          {/* Visite 360° / Panorama */}
          {tabs.includes("tour360") && (
            <TabsContent value="tour360" className="mt-3">
              {tourSrc ? (
                <div className="relative w-full overflow-hidden rounded-xl bg-black">
                  <div className="relative aspect-video w-full">
                    <iframe
                      src={tourSrc}
                      title="Visite virtuelle 360°"
                      className="absolute inset-0 h-full w-full"
                      allow="xr-spatial-tracking; fullscreen; vr"
                      allowFullScreen
                    />
                  </div>
                </div>
              ) : (
                <div
                  ref={panoramaRef}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  className="relative h-[300px] cursor-grab touch-none overflow-hidden rounded-xl bg-black select-none active:cursor-grabbing sm:h-[400px] lg:h-[500px]"
                >
                  <div
                    className="absolute inset-0 transition-transform"
                    style={{
                      transform: `translateX(${offsetX}px) scale(1.15)`,
                      transitionDuration: dragRef.current ? "0ms" : "200ms",
                    }}
                  >
                    <Image
                      src={images[photoIndex] ?? images[0]}
                      alt="Panorama"
                      fill
                      className="object-cover"
                      sizes="100vw"
                      draggable={false}
                    />
                  </div>
                  <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-xs text-white backdrop-blur-sm">
                    <Move className="size-3.5" />
                    Glissez pour explorer
                  </div>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Lightbox fullscreen */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          <div className="flex items-center justify-between p-4 text-white">
            <span className="text-sm font-medium opacity-80">
              {active === "photos" && `Photo ${photoIndex + 1} / ${images.length}`}
              {active === "video" && "Visite vidéo"}
              {active === "tour360" && "Visite 360°"}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 hover:text-white"
                onClick={() => setIsFullscreen(false)}
                aria-label="Quitter le plein écran"
              >
                <Minimize className="size-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 hover:text-white"
                onClick={() => setIsFullscreen(false)}
                aria-label="Fermer"
              >
                <X className="size-5" />
              </Button>
            </div>
          </div>

          <div className="relative flex-1">
            {active === "photos" && images[photoIndex] && (
              <div className="relative h-full w-full">
                <Image
                  src={images[photoIndex]}
                  alt="Photo plein écran"
                  fill
                  className="object-contain"
                  sizes="100vw"
                />
                {images.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white"
                      onClick={() =>
                        setPhotoIndex(
                          (i) => (i - 1 + images.length) % images.length
                        )
                      }
                      aria-label="Photo précédente"
                    >
                      <ChevronLeft className="size-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white"
                      onClick={() =>
                        setPhotoIndex((i) => (i + 1) % images.length)
                      }
                      aria-label="Photo suivante"
                    >
                      <ChevronRight className="size-5" />
                    </Button>
                  </>
                )}
              </div>
            )}

            {active === "video" && embedSrc && (
              <iframe
                src={embedSrc}
                title="Visite vidéo plein écran"
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}

            {active === "tour360" && tourSrc && (
              <iframe
                src={tourSrc}
                title="Visite 360° plein écran"
                className="h-full w-full"
                allow="xr-spatial-tracking; fullscreen; vr"
                allowFullScreen
              />
            )}

            {active === "tour360" && !tourSrc && images[photoIndex] && (
              <div className="relative h-full w-full">
                <Image
                  src={images[photoIndex]}
                  alt="Panorama plein écran"
                  fill
                  className="object-contain"
                  sizes="100vw"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

interface PhotosViewProps {
  images: string[];
  index: number;
  onIndexChange: (i: number) => void;
}

function PhotosView({ images, index, onIndexChange }: PhotosViewProps) {
  if (images.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-xl bg-muted text-muted-foreground">
        Aucune photo
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="relative h-[300px] overflow-hidden rounded-xl sm:h-[400px] lg:h-[500px]">
        <Image
          src={images[index]}
          alt={`Photo ${index + 1}`}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 80vw"
        />
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white"
              onClick={() =>
                onIndexChange((index - 1 + images.length) % images.length)
              }
              aria-label="Photo précédente"
            >
              <ChevronLeft className="size-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white"
              onClick={() => onIndexChange((index + 1) % images.length)}
              aria-label="Photo suivante"
            >
              <ChevronRight className="size-5" />
            </Button>
            <div className="absolute bottom-3 right-3 rounded-lg bg-black/60 px-3 py-1 text-sm text-white">
              {index + 1} / {images.length}
            </div>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => onIndexChange(i)}
              className={cn(
                "relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all sm:h-20 sm:w-24",
                i === index
                  ? "border-kaza-blue"
                  : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              <Image
                src={src}
                alt={`Miniature ${i + 1}`}
                fill
                className="object-cover"
                sizes="96px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
