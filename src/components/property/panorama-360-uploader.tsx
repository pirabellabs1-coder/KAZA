"use client";

import { useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Compass,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";

import { uploadPropertyPhotoViaServer } from "@/actions/property-photos";
import {
  Panorama360Viewer,
  type PanoramaScene,
} from "@/components/property/panorama-360-viewer";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast-helper";

// =============================================================================
// Kaabo — Gestionnaire de visite 360° multi-scènes
// =============================================================================
// Le propriétaire importe PLUSIEURS photos panoramiques (une par pièce/zone)
// depuis son téléphone, les nomme (Salon, Chambre, Extérieur…) et les ordonne.
// Le visiteur pourra naviguer de scène en scène avec les flèches sur la fiche.
// =============================================================================

interface Panorama360UploaderProps {
  value: PanoramaScene[];
  onChange: (scenes: PanoramaScene[]) => void;
}

export function Panorama360Uploader({
  value,
  onChange,
}: Panorama360UploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const scenes = value ?? [];

  async function handleFiles(files: FileList) {
    setUploading(true);
    try {
      const added: PanoramaScene[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await uploadPropertyPhotoViaServer(fd);
        if (!res.success) {
          toast.error(res.error ?? "Échec de l'upload d'une vue 360°.");
          continue;
        }
        added.push({ url: res.url, label: "" });
      }
      if (added.length > 0) {
        onChange([...scenes, ...added]);
        toast.success(
          `${added.length} vue${added.length > 1 ? "s" : ""} 360° ajoutée${
            added.length > 1 ? "s" : ""
          }.`,
        );
      }
    } catch {
      toast.error("Impossible d'importer la vue 360°.");
    } finally {
      setUploading(false);
    }
  }

  function updateLabel(i: number, label: string) {
    onChange(scenes.map((s, idx) => (idx === i ? { ...s, label } : s)));
  }
  function remove(i: number) {
    onChange(scenes.filter((_, idx) => idx !== i));
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= scenes.length) return;
    const next = [...scenes];
    [next[i], next[j]] = [next[j]!, next[i]!];
    onChange(next);
  }

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Liste des scènes (ordonnées) */}
      {scenes.length > 0 && (
        <div className="space-y-2">
          {scenes.map((s, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border bg-white p-2"
            >
              {/* Vignette */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.url}
                alt=""
                className="h-12 w-20 shrink-0 rounded-lg object-cover"
              />
              <span className="w-5 shrink-0 text-center text-sm font-semibold text-muted-foreground">
                {i + 1}
              </span>
              <Input
                value={s.label ?? ""}
                onChange={(e) => updateLabel(i, e.target.value)}
                placeholder="Nom de la pièce (ex : Salon, Chambre, Extérieur)"
                className="h-9 flex-1"
              />
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
                  aria-label="Monter"
                >
                  <ArrowUp className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === scenes.length - 1}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
                  aria-label="Descendre"
                >
                  <ArrowDown className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="rounded-md p-1.5 text-destructive hover:bg-destructive/5"
                  aria-label="Supprimer"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bouton d'ajout */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-kaza-blue/40 bg-white p-5 text-center transition-colors hover:border-kaza-blue hover:bg-kaza-blue/5 disabled:opacity-60"
      >
        {uploading ? (
          <>
            <Loader2 className="size-6 animate-spin text-kaza-blue" />
            <span className="text-sm font-medium text-foreground">
              Import en cours…
            </span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-2 text-sm font-medium text-foreground">
              {scenes.length > 0 ? (
                <>
                  <Plus className="size-4 text-kaza-blue" /> Ajouter une pièce
                </>
              ) : (
                <>
                  <Compass className="size-5 text-kaza-blue" /> Importer vos
                  photos 360°
                </>
              )}
            </span>
            <span className="text-xs text-muted-foreground">
              Depuis votre téléphone (mode Panorama) — une photo par pièce, dans
              l&apos;ordre de la visite
            </span>
          </>
        )}
      </button>

      {/* Aperçu de la visite */}
      {scenes.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Aperçu de la visite (naviguez avec les flèches) :
          </p>
          <Panorama360Viewer scenes={scenes} height={280} />
        </div>
      )}
    </div>
  );
}
