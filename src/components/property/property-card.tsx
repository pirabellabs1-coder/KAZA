"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin, Bed, Bath, Maximize, Star } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface PropertyCardProps {
  id: string;
  title: string;
  price: number;
  address: string;
  bedrooms: number;
  bathrooms: number;
  squareMeters: number;
  imageUrl: string;
  propertyType: string;
  rating?: number;
  isVerified?: boolean;
  isFavorite?: boolean;
  onFavoriteToggle?: (id: string) => void;
}

export function PropertyCard({
  id,
  title,
  price,
  address,
  bedrooms,
  bathrooms,
  squareMeters,
  imageUrl,
  propertyType,
  rating,
  isVerified,
  isFavorite = false,
  onFavoriteToggle,
}: PropertyCardProps) {
  const [favorite, setFavorite] = useState(isFavorite);

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorite(!favorite);
    onFavoriteToggle?.(id);
  };

  return (
    <Link href={`/properties/${id}`} className="group block">
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md">
        {/* Image */}
        <div className="relative h-[200px] w-full overflow-hidden">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {/* Badges */}
          <div className="absolute left-3 top-3 flex gap-2">
            {isVerified && (
              <Badge className="bg-kaza-green text-white">Vérifié</Badge>
            )}
          </div>

          {/* Favorite button */}
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute right-3 top-3 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white"
            onClick={handleFavorite}
            aria-label={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            <Heart
              className={cn(
                "size-4",
                favorite
                  ? "fill-kaza-blue text-kaza-blue"
                  : "text-muted-foreground"
              )}
            />
          </Button>

          {/* Price badge */}
          <div className="absolute bottom-3 right-3 rounded-lg bg-kaza-blue px-3 py-1.5 text-sm font-semibold text-white">
            {formatPrice(price)}
            <span className="text-xs font-normal opacity-80">/mois</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="mb-2 flex items-start justify-between">
            <h3 className="line-clamp-1 text-base font-semibold text-foreground">
              {title}
            </h3>
            {rating && (
              <div className="flex items-center gap-1 text-sm">
                <Star className="size-3.5 fill-kaza-warning text-kaza-warning" />
                <span className="font-medium">{rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          <div className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5" />
            <span className="line-clamp-1">{address}</span>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Bed className="size-3.5" />
              <span>{bedrooms} Ch.</span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="size-3.5" />
              <span>{bathrooms} SdB</span>
            </div>
            <div className="flex items-center gap-1">
              <Maximize className="size-3.5" />
              <span>{squareMeters}m²</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
