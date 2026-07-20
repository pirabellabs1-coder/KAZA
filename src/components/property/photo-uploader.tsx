"use client";

// =============================================================================
// Kaabo - Composant d'upload de photos vers Supabase Storage
//
// Convention de path : `temp/{userId}/{uuid}.{ext}` (bucket public
// `property-photos`). Les fichiers sont uploadés AVANT que la propriété
// n'existe en base ; les URLs publiques sont ensuite persistées dans
// `property_photos` via `saveUploadedPhotoUrls()` une fois l'id obtenu.
//
// Le composant gère :
//   - drag & drop + click-to-select
//   - upload parallèle avec spinner par photo
//   - preview grid avec actions (supprimer, marquer comme principale)
//   - validation : max 30 photos, formats image/* uniquement, taille <= 10 Mo
// =============================================================================

import { useCallback, useEffect, useRef, useState } from "react";

import { Loader2, Star, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast-helper";
import { createClient } from "@/lib/supabase/client";
import { uploadPropertyPhotoViaServer } from "@/actions/property-photos";
import { cn } from "@/lib/utils";

interface PhotoUploaderProps {
  userId: string;
  initialPhotos?: string[];
  maxPhotos?: number;
  maxSizeMb?: number;
  onChange?: (urls: string[]) => void;
}

interface UploadedPhoto {
  url: string;          // URL publique (ou objectURL local pendant l'upload)
  storagePath: string;  // path dans le bucket (vide si photo initiale)
  uploading: boolean;
  error?: boolean;
}

const BUCKET = "property-photos";
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const DEFAULT_MAX_SIZE_MB = 10;

function isImageFile(file: File): boolean {
  return ALLOWED_TYPES.includes(file.type) || file.type.startsWith("image/");
}

export function PhotoUploader({
  userId,
  initialPhotos = [],
  maxPhotos = 30,
  maxSizeMb = DEFAULT_MAX_SIZE_MB,
  onChange,
}: PhotoUploaderProps) {
  const [photos, setPhotos] = useState<UploadedPhoto[]>(() =>
    initialPhotos.map((url) => ({
      url,
      storagePath: "",
      uploading: false,
    })),
  );
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // onChange dans une ref pour éviter de déclencher l'effet à chaque render
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Notifie le parent quand la liste des photos "stables" (non-uploading,
  // non-error) change.
  useEffect(() => {
    const stable = photos
      .filter((p) => !p.uploading && !p.error)
      .map((p) => p.url);
    onChangeRef.current?.(stable);
  }, [photos]);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files);
      const remainingSlots = maxPhotos - photos.length;
      if (remainingSlots <= 0) {
        toast.error(`Maximum ${maxPhotos} photos atteint`);
        return;
      }

      const toUpload = arr.slice(0, remainingSlots);
      if (arr.length > remainingSlots) {
        toast.warning(
          `Seules les ${remainingSlots} premières photos ont été retenues (max ${maxPhotos}).`,
        );
      }

      const maxBytes = maxSizeMb * 1024 * 1024;

      await Promise.all(
        toUpload.map(async (file) => {
          // Validation côté client
          if (!isImageFile(file)) {
            toast.error(`Format non supporté : ${file.name}`);
            return;
          }
          if (file.size > maxBytes) {
            toast.error(
              `${file.name} dépasse la limite de ${maxSizeMb} Mo`,
            );
            return;
          }

          const previewUrl = URL.createObjectURL(file);
          // Clé temporaire locale pour suivre ce placeholder précis.
          const tempKey = `pending-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`;

          // Ajoute le placeholder (uploading: true)
          setPhotos((prev) => [
            ...prev,
            { url: previewUrl, storagePath: tempKey, uploading: true },
          ]);

          // Upload via server action (client admin / service role) — chemin
          // fiable qui contourne les soucis de session/RLS côté navigateur.
          const fd = new FormData();
          fd.append("file", file);
          const res = await uploadPropertyPhotoViaServer(fd);

          if (!res.success) {
            console.error("[PhotoUploader] upload error:", res.error);
            toast.error(`Échec de l'upload de ${file.name} : ${res.error}`);
            setPhotos((prev) => prev.filter((x) => x.storagePath !== tempKey));
            URL.revokeObjectURL(previewUrl);
            return;
          }

          // Remplace le placeholder par la version uploadée (URL publique réelle)
          setPhotos((prev) =>
            prev.map((x) =>
              x.storagePath === tempKey
                ? {
                    url: res.url,
                    storagePath: res.path,
                    uploading: false,
                  }
                : x,
            ),
          );
          URL.revokeObjectURL(previewUrl);
        }),
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `userId` conservé volontairement (convention de path) ; n'affecte pas la mémoïsation
    [photos.length, maxPhotos, maxSizeMb, userId],
  );

  const removePhoto = useCallback(async (index: number) => {
    const photo = photos[index];
    if (!photo) return;

    // Si la photo a un storagePath, on essaie de la supprimer du bucket
    if (photo.storagePath) {
      const supabase = createClient();
      const { error } = await supabase.storage
        .from(BUCKET)
        .remove([photo.storagePath]);
      if (error) {
        // On garde quand même le retrait local : l'utilisateur ne veut plus
        // la voir. Le fichier orphelin pourra être nettoyé plus tard.
        console.warn("[PhotoUploader] remove error:", error);
      }
    }

    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }, [photos]);

  const setAsPrimary = useCallback((index: number) => {
    if (index === 0) return;
    setPhotos((prev) => {
      const arr = [...prev];
      const [photo] = arr.splice(index, 1);
      if (photo) arr.unshift(photo);
      return arr;
    });
    toast.success("Photo principale mise à jour");
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void handleFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      void handleFiles(e.target.files);
    }
    // Reset pour permettre de re-sélectionner le même fichier
    e.target.value = "";
  };

  const reachedMax = photos.length >= maxPhotos;

  return (
    <div className="space-y-3">
      {/* Zone drop */}
      <div
        role="button"
        tabIndex={0}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !reachedMax && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !reachedMax) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition-colors",
          reachedMax
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer",
          isDragging
            ? "border-kaza-blue bg-kaza-blue/5"
            : "border-border bg-muted/30 hover:border-kaza-blue/40 hover:bg-muted/40",
        )}
        aria-disabled={reachedMax}
      >
        <Upload className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">
          {reachedMax
            ? `Maximum ${maxPhotos} photos atteint`
            : "Glissez vos photos ici ou cliquez pour parcourir"}
        </p>
        <p className="text-xs text-muted-foreground">
          {photos.length} / {maxPhotos} photos · JPG, PNG, WebP, GIF — max {maxSizeMb} Mo
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      {/* Preview grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo, i) => (
            <div
              key={`${photo.storagePath || photo.url}-${i}`}
              className="group relative aspect-square overflow-hidden rounded-xl border-2 border-border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={`Photo ${i + 1}`}
                className="size-full object-cover"
              />

              {photo.uploading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/55">
                  <Loader2 className="size-6 animate-spin text-white" />
                  <span className="text-[10px] font-medium uppercase tracking-wider text-white">
                    Upload…
                  </span>
                </div>
              )}

              {i === 0 && !photo.uploading && (
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-kaza-blue px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  <Star className="size-3" />
                  Principale
                </span>
              )}

              {!photo.uploading && (
                <div className="absolute inset-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/70 via-black/0 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  {i !== 0 && (
                    <Button
                      type="button"
                      size="xs"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAsPrimary(i);
                      }}
                      className="gap-1"
                    >
                      <Star className="size-3" />
                      Principale
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      void removePhoto(i);
                    }}
                    className="ml-auto"
                    aria-label="Supprimer la photo"
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
