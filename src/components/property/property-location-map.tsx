import { ExternalLink, MapPin } from "lucide-react";

import { cn } from "@/lib/utils";

// =============================================================================
// PropertyLocationMap — carte interactive réelle (Google Maps embed) centrée
// sur l'adresse du bien. Aucune clé API requise : l'embed public fonctionne à
// partir d'une requête texte. Si l'adresse est absente, on affiche un repère
// honnête sans carte.
// =============================================================================

interface PropertyLocationMapProps {
  address: string;
  className?: string;
}

export function PropertyLocationMap({
  address,
  className,
}: PropertyLocationMapProps) {
  const trimmed = (address ?? "").trim();

  if (!trimmed) {
    return (
      <div
        className={cn(
          "flex h-[300px] items-center justify-center rounded-xl border bg-muted",
          className,
        )}
      >
        <div className="text-center text-muted-foreground">
          <MapPin className="mx-auto mb-2 size-8" />
          <p className="text-sm">Adresse non précisée</p>
        </div>
      </div>
    );
  }

  const query = encodeURIComponent(trimmed);
  const embedUrl = `https://www.google.com/maps?q=${query}&output=embed`;
  const linkUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="overflow-hidden rounded-xl border">
        <iframe
          title={`Carte — ${trimmed}`}
          src={embedUrl}
          className="h-[300px] w-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      <a
        href={linkUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-kaza-blue hover:underline"
      >
        Voir en grand sur Google Maps
        <ExternalLink className="size-3.5" aria-hidden />
      </a>
    </div>
  );
}
