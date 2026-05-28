"use client";

// =============================================================================
// KAZA - AvatarUploader
//
// Composant client qui gere :
//   1) le rendu de l'avatar courant (image ou initiales),
//   2) la selection d'un fichier image (max 2 Mo, image/*),
//   3) l'upload vers Supabase Storage bucket `avatars` au path
//      `{userId}/avatar.{ext}` (avec upsert),
//   4) la recuperation de la public URL,
//   5) l'appel a l'action serveur `updateProfilePhoto(url)` pour
//      persister l'URL dans `public.users.profile_photo_url`,
//   6) un toast de succes + refresh du Server Component parent.
// =============================================================================

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/components/ui/toast-helper";
import { createClient } from "@/lib/supabase/client";
import { updateProfilePhoto } from "@/actions/profile";
import { getInitials } from "@/lib/utils";

interface AvatarUploaderProps {
  /** URL actuelle de la photo de profil (peut etre null/undefined). */
  currentUrl?: string | null;
  /** UUID Supabase du user (utilise pour le path dans le bucket). */
  userId: string;
  /** Prenom (pour calculer les initiales en fallback). */
  firstName: string;
  /** Nom (pour calculer les initiales en fallback). */
  lastName: string;
}

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 Mo
const ALLOWED_PREFIX = "image/";

function getExtension(file: File): string {
  // Priorite : extension du nom de fichier, sinon dernier segment du MIME.
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
  const fromMime = file.type.split("/").pop()?.toLowerCase();
  return fromMime && /^[a-z0-9]{2,5}$/.test(fromMime) ? fromMime : "jpg";
}

export function AvatarUploader({
  currentUrl,
  userId,
  firstName,
  lastName,
}: AvatarUploaderProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  // Affichage immediat (optimiste) une fois l'upload reussi.
  const [displayUrl, setDisplayUrl] = useState<string | null>(
    currentUrl ?? null,
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const initials = getInitials(firstName, lastName || " ");

  const handleSelectFile = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset l'input pour permettre la re-selection du meme fichier.
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith(ALLOWED_PREFIX)) {
      toast.error("Veuillez choisir une image (jpg, png, webp, gif).");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error("L'image ne doit pas depasser 2 Mo.");
      return;
    }

    setIsUploading(true);
    try {
      const supabase = createClient();
      const ext = getExtension(file);
      const path = `${userId}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, {
          upsert: true,
          contentType: file.type,
          cacheControl: "3600",
        });

      if (uploadError) {
        toast.error(`Echec de l'upload : ${uploadError.message}`);
        return;
      }

      const { data: publicData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      // Cache-buster pour forcer le navigateur a recharger l'image
      // (le path est identique entre deux uploads grace a upsert).
      const publicUrl = `${publicData.publicUrl}?t=${Date.now()}`;

      startTransition(async () => {
        const result = await updateProfilePhoto(publicUrl);
        if (!result.success) {
          toast.error(result.error ?? "Impossible d'enregistrer la photo.");
          return;
        }
        setDisplayUrl(publicUrl);
        toast.success("Photo de profil mise a jour !");
        router.refresh();
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur inattendue.";
      toast.error(`Upload impossible : ${message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const busy = isUploading || isPending;

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="relative">
        <Avatar className="size-20 ring-4 ring-kaza-navy/10">
          {displayUrl ? (
            <AvatarImage
              src={displayUrl}
              alt={`${firstName} ${lastName}`.trim() || "Avatar"}
            />
          ) : null}
          <AvatarFallback className="bg-kaza-navy text-xl text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
            <Loader2 className="size-5 animate-spin text-white" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSelectFile}
          disabled={busy}
          className="gap-2"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Camera className="size-4" />
          )}
          {busy ? "Envoi en cours…" : "Changer la photo"}
        </Button>
        <p className="text-xs text-muted-foreground">
          JPG, PNG ou WEBP — 2 Mo max.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
