"use client";

// =============================================================================
// Kaabo - PropertyActions (client component)
//
// Barre d'actions affichee a cote du titre de la propriete : demande de visite
// (VisitRequestButton existant), bouton "Sauvegarder" (favoris localStorage) et
// bouton "Partager" (copie URL dans le presse-papier). Mobile-first.
// =============================================================================

import { useEffect, useState } from "react";
import { Heart, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast-helper";
import { cn } from "@/lib/utils";
import { VisitRequestButton } from "@/components/property/visit-request-button";
import { ReportButton } from "@/components/shared/report-button";

const FAVORITES_KEY = "kaza-favorites";

function readFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

function writeFavorites(ids: string[]): void {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  } catch {
    // ignore quota / privacy mode
  }
}

interface PropertyActionsProps {
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  ownerName: string;
  className?: string;
  /** Auth resolue cote serveur pour eviter un flash. */
  isAuthenticated?: boolean;
  /** Si vrai, on masque le bouton de demande de visite (proprietaire du bien). */
  isOwnProperty?: boolean;
}

export function PropertyActions({
  propertyId,
  propertyTitle,
  propertyAddress,
  ownerName,
  className,
  isAuthenticated,
  isOwnProperty = false,
}: PropertyActionsProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    setIsFavorite(readFavorites().includes(propertyId));
  }, [propertyId]);

  const toggleFavorite = () => {
    const current = readFavorites();
    const exists = current.includes(propertyId);
    const next = exists
      ? current.filter((id) => id !== propertyId)
      : [...current, propertyId];
    writeFavorites(next);
    setIsFavorite(!exists);
    if (exists) {
      toast.info("Retiré de vos favoris");
    } else {
      toast.success("Ajouté à vos favoris");
    }
  };

  const share = async () => {
    const url =
      typeof window !== "undefined"
        ? window.location.href
        : `/properties/${propertyId}`;

    // Web Share API si disponible (mobile)
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function"
    ) {
      try {
        await navigator.share({
          title: propertyTitle,
          text: `Découvrez ce bien sur Kaabo : ${propertyTitle}`,
          url,
        });
        return;
      } catch {
        // l'utilisateur a annulé ou erreur — on bascule sur clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié dans le presse-papier");
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {!isOwnProperty && (
        <VisitRequestButton
          propertyId={propertyId}
          propertyTitle={propertyTitle}
          propertyAddress={propertyAddress}
          ownerName={ownerName}
          variant="default"
          isAuthenticated={isAuthenticated}
        />
      )}
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={toggleFavorite}
        aria-pressed={isFavorite}
        aria-label={
          isFavorite ? "Retirer des favoris" : "Sauvegarder dans les favoris"
        }
        title={isFavorite ? "Retirer des favoris" : "Sauvegarder"}
      >
        <Heart
          className={cn(
            "size-4 transition-colors",
            isFavorite ? "fill-kaza-error text-kaza-error" : "",
          )}
        />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={share}
        aria-label="Partager cette propriété"
        title="Partager"
      >
        <Share2 className="size-4" />
      </Button>
      {!isOwnProperty && (
        <ReportButton
          targetType="property"
          targetId={propertyId}
          targetLabel={propertyTitle}
          variant="icon"
        />
      )}
    </div>
  );
}
