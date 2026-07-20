"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";

import { toggleSaveProperty } from "@/actions/favorites";
import { toast } from "@/components/ui/toast-helper";
import { cn } from "@/lib/utils";

// =============================================================================
// Kaabo — Bouton favori autonome (client)
// =============================================================================
// Utilisable depuis n'importe quel Server Component (cartes de recherche,
// listes…). Gère l'optimisme, le rollback en cas d'échec et la redirection
// vers la connexion si l'utilisateur n'est pas authentifié.
// =============================================================================

interface FavoriteButtonProps {
  propertyId: string;
  initialSaved?: boolean;
  className?: string;
  iconClassName?: string;
}

export function FavoriteButton({
  propertyId,
  initialSaved = false,
  className,
  iconClassName,
}: FavoriteButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [, startFav] = useTransition();
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !saved;
    setSaved(next); // optimiste
    startFav(async () => {
      try {
        const res = await toggleSaveProperty(propertyId);
        if (!res.success) {
          setSaved(!next); // rollback
          if (/connect/i.test(res.error ?? "")) {
            toast.error("Connectez-vous pour enregistrer vos favoris.");
            router.push("/login?redirect=/tenant/saved");
          } else {
            toast.error(res.error ?? "Action impossible pour le moment.");
          }
          return;
        }
        const favorited = res.data?.favorited ?? next;
        toast.success(
          favorited ? "Ajouté à vos favoris." : "Retiré de vos favoris.",
        );
      } catch {
        setSaved(!next);
        toast.error("Impossible de joindre le serveur.");
      }
    });
  };

  return (
    <button
      type="button"
      aria-label={saved ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-pressed={saved}
      onClick={handleClick}
      className={cn(
        "flex size-9 items-center justify-center rounded-full bg-white/95 text-foreground shadow-md backdrop-blur transition-all hover:scale-110 hover:text-rose-500",
        saved && "text-rose-500",
        className,
      )}
    >
      <Heart className={cn("size-4", saved && "fill-current", iconClassName)} />
    </button>
  );
}
