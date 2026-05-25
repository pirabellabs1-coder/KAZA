"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Upload, X, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  maxImages?: number;
  onImagesChange?: (files: File[]) => void;
}

export function ImageUpload({
  maxImages = 10,
  onImagesChange,
}: ImageUploadProps) {
  const [previews, setPreviews] = useState<
    { file: File; url: string }[]
  >([]);
  const [isDragging, setIsDragging] = useState(false);

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const filesArray = Array.from(newFiles).filter((f) =>
        f.type.startsWith("image/")
      );
      const remaining = maxImages - previews.length;
      const toAdd = filesArray.slice(0, remaining);

      const newPreviews = toAdd.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      }));

      const updated = [...previews, ...newPreviews];
      setPreviews(updated);
      onImagesChange?.(updated.map((p) => p.file));
    },
    [previews, maxImages, onImagesChange]
  );

  const removeImage = (index: number) => {
    const updated = previews.filter((_, i) => i !== index);
    URL.revokeObjectURL(previews[index].url);
    setPreviews(updated);
    onImagesChange?.(updated.map((p) => p.file));
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors",
          isDragging
            ? "border-kaza-blue bg-kaza-blue/5"
            : "border-border hover:border-kaza-blue/50",
          previews.length >= maxImages && "pointer-events-none opacity-50"
        )}
      >
        <ImagePlus className="mb-3 size-10 text-muted-foreground" />
        <p className="mb-1 text-sm font-medium">
          Glissez vos images ici
        </p>
        <p className="mb-3 text-xs text-muted-foreground">
          ou cliquez pour sélectionner ({previews.length}/{maxImages})
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.multiple = true;
            input.accept = "image/*";
            input.onchange = (e) => {
              const files = (e.target as HTMLInputElement).files;
              if (files) addFiles(files);
            };
            input.click();
          }}
          disabled={previews.length >= maxImages}
        >
          <Upload className="mr-2 size-4" />
          Sélectionner
        </Button>
      </div>

      {/* Previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {previews.map((preview, index) => (
            <div key={index} className="group relative aspect-square overflow-hidden rounded-lg border">
              <Image
                src={preview.url}
                alt={`Image ${index + 1}`}
                fill
                className="object-cover"
                sizes="120px"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Supprimer l'image"
              >
                <X className="size-3" />
              </button>
              {index === 0 && (
                <span className="absolute bottom-1 left-1 rounded bg-kaza-blue px-1.5 py-0.5 text-[10px] font-medium text-white">
                  Principal
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {previews.length >= maxImages && (
        <p className="text-sm text-kaza-warning">
          Limite de {maxImages} images atteinte.
        </p>
      )}
    </div>
  );
}
