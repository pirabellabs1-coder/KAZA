"use client";

import { useRef, useState } from "react";
import { Compass, Loader2, Upload, X } from "lucide-react";

import { uploadPropertyPhotoViaServer } from "@/actions/property-photos";
import { Panorama360Viewer } from "@/components/property/panorama-360-viewer";
import { toast } from "@/components/ui/toast-helper";

// =============================================================================
// Kaabo — Uploader de vue 360° (image panoramique équirectangulaire)
// =============================================================================
// Pensé mobile : l'utilisateur importe depuis son téléphone une photo
// panoramique (mode Panorama de l'appareil ou appli photosphère). L'image est
// uploadée sur le même bucket que les photos, et l'URL publique est renvoyée
// au parent (formulaire de création).
// =============================================================================

interface Panorama360UploaderProps {
  value?: string;
  onChange: (url: string) => void;
}

export function Panorama360Uploader({
  value,
  onChange,
}: Panorama360UploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadPropertyPhotoViaServer(fd);
      if (!res.success) {
        toast.error(res.error ?? "Échec de l'upload de la vue 360°.");
        return;
      }
      onChange(res.url);
      toast.success("Vue 360° ajoutée.");
    } catch {
      toast.error("Impossible d'importer la vue 360°.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />

      {value ? (
        <div className="space-y-2">
          <Panorama360Viewer src={value} height={300} />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-60"
            >
              <Upload className="size-3.5" /> Remplacer
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/5 disabled:opacity-60"
            >
              <X className="size-3.5" /> Retirer
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-kaza-blue/40 bg-white p-6 text-center transition-colors hover:border-kaza-blue hover:bg-kaza-blue/5 disabled:opacity-60"
        >
          {uploading ? (
            <>
              <Loader2 className="size-6 animate-spin text-kaza-blue" />
              <span className="text-sm font-medium text-foreground">
                Import de la vue 360°…
              </span>
            </>
          ) : (
            <>
              <Compass className="size-7 text-kaza-blue" />
              <span className="text-sm font-medium text-foreground">
                Importer une photo panoramique 360°
              </span>
              <span className="text-xs text-muted-foreground">
                Depuis votre téléphone (mode Panorama) ou une appli photosphère —
                image équirectangulaire, ratio 2:1
              </span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
