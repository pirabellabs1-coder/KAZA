"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  MapPin,
  Bed,
  Bath,
  Maximize,
  Star,
  ShieldCheck,
  Sparkles,
  Megaphone,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";
import { cn, formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  HOUSE: "Maison",
  APARTMENT: "Appartement",
  STUDIO: "Studio",
  ROOM: "Chambre",
  VILLA: "Villa",
  OFFICE: "Bureau",
};

export interface PropertyCardProps {
  id: string;
  title: string;
  price: number;
  address: string;
  bedrooms?: number;
  bathrooms?: number;
  squareMeters?: number;
  imageUrl: string;
  propertyType: string;
  rating?: number;
  reviewsCount?: number;
  isVerified?: boolean;
  isFeatured?: boolean;
  /** Annonce sponsorisée (boost actif) — affiche un badge « Sponsorisé ». */
  isBoosted?: boolean;
  isFavorite?: boolean;
  variant?: "default" | "featured" | "compact";
  onFavoriteToggle?: (id: string) => void;
  className?: string;
}

export function PropertyCard({
  id,
  title,
  price,
  address,
  bedrooms = 0,
  bathrooms = 0,
  squareMeters = 0,
  imageUrl,
  propertyType,
  rating,
  reviewsCount,
  isVerified,
  isFeatured,
  isBoosted,
  isFavorite = false,
  variant = "default",
  onFavoriteToggle,
  className,
}: PropertyCardProps) {
  const [favorite, setFavorite] = useState(isFavorite);

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorite(!favorite);
    onFavoriteToggle?.(id);
  };

  const typeLabel = PROPERTY_TYPE_LABELS[propertyType] ?? propertyType;
  const priceFormatted = formatPrice(price);

  // === Variant COMPACT (horizontal, listings condensés) ============
  if (variant === "compact") {
    return (
      <Link
        href={`/properties/${id}`}
        className={cn("group block", className)}
      >
        <article className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-500 hover:-translate-y-0.5 hover:shadow-xl sm:flex-row">
          <div className="relative h-52 w-full shrink-0 overflow-hidden sm:h-auto sm:w-64">
            <Image
              src={imageUrl}
              alt={`${title} — ${typeLabel} à louer, ${address}`}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 640px) 100vw, 256px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <FavoriteButton
              favorite={favorite}
              onClick={handleFavorite}
            />
            <div className="absolute left-3 top-3 flex flex-col gap-1.5">
              {isBoosted && <SponsoredBadge />}
              {isVerified && (
                <Badge className="gap-1 border-0 bg-kaza-green/95 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                  <ShieldCheck className="size-3" />
                  Vérifié
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-between p-5">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-heading line-clamp-2 text-lg font-semibold text-foreground transition-colors group-hover:text-kaza-blue">
                  {title}
                </h3>
                {rating ? <RatingPill rating={rating} /> : null}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" />
                <span className="line-clamp-1">{address}</span>
              </div>
              <SpecsRow
                bedrooms={bedrooms}
                bathrooms={bathrooms}
                squareMeters={squareMeters}
                typeLabel={typeLabel}
              />
            </div>
            <div className="mt-4 flex items-end justify-between">
              <PriceTag price={priceFormatted} />
              <span className="inline-flex items-center gap-1 text-sm font-medium text-kaza-blue opacity-0 transition-opacity group-hover:opacity-100">
                Voir <ArrowRight className="size-3.5" />
              </span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  // === Variants DEFAULT et FEATURED (verticaux) ====================
  const isFeaturedVariant = variant === "featured" || isFeatured;
  const aspectClass = isFeaturedVariant ? "aspect-[3/2]" : "aspect-[4/3]";
  const wrapperRing = isFeaturedVariant
    ? "ring-1 ring-kaza-green/40 shadow-lg"
    : "shadow-sm";

  return (
    <Link href={`/properties/${id}`} className={cn("group block", className)}>
      <article
        className={cn(
          "relative flex h-full flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl",
          wrapperRing,
        )}
      >
        {/* Image */}
        <div className={cn("relative w-full overflow-hidden", aspectClass)}>
          <Image
            src={imageUrl}
            alt={`${title} — ${typeLabel} à louer, ${address}`}
            fill
            className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.08]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />

          {/* Overlay subtil au hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          {/* Top-left badges */}
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {isBoosted && <SponsoredBadge />}
            {isFeaturedVariant && (
              <Badge className="gap-1 border-0 bg-kaza-green px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
                <Sparkles className="size-3" />
                À la une
              </Badge>
            )}
            {isVerified && (
              <Badge className="gap-1 border-0 bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-kaza-green shadow-md backdrop-blur">
                <ShieldCheck className="size-3" />
                Vérifié
              </Badge>
            )}
            <Badge className="gap-1 border-0 bg-kaza-navy/90 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur">
              {typeLabel}
            </Badge>
          </div>

          {/* Top-right favorite */}
          <FavoriteButton favorite={favorite} onClick={handleFavorite} />

          {/* Bottom-left price (glass) */}
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
            <div className="rounded-2xl bg-white/95 px-3.5 py-2 shadow-lg backdrop-blur-md">
              <div className="flex items-baseline gap-1">
                <span className="font-heading text-base font-bold text-kaza-navy">
                  {priceFormatted}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">
                  /mois
                </span>
              </div>
            </div>

            {/* Hover-only "Voir" pill */}
            <span className="inline-flex translate-y-2 items-center gap-1 rounded-full bg-kaza-navy/95 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg backdrop-blur transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              Voir <ArrowRight className="size-3" />
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-3 p-5">
          {/* Title + rating */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-heading line-clamp-2 text-base font-semibold leading-tight text-foreground transition-colors group-hover:text-kaza-blue sm:text-lg">
              {title}
            </h3>
            {rating ? (
              <RatingPill rating={rating} reviewsCount={reviewsCount} />
            ) : null}
          </div>

          {/* Address */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3.5 shrink-0 text-kaza-blue" />
            <span className="line-clamp-1">{address}</span>
          </div>

          {/* Specs */}
          <SpecsRow
            bedrooms={bedrooms}
            bathrooms={bathrooms}
            squareMeters={squareMeters}
            className="mt-auto"
          />
        </div>
      </article>
    </Link>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

/** Badge discret « Sponsorisé » pour les annonces avec un boost actif. */
function SponsoredBadge() {
  return (
    <Badge className="gap-1 border-0 bg-amber-500/95 px-2.5 py-1 text-[10px] font-semibold text-white shadow-md backdrop-blur-sm">
      <Megaphone className="size-3" />
      Sponsorisé
    </Badge>
  );
}

function FavoriteButton({
  favorite,
  onClick,
}: {
  favorite: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
      className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-110 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kaza-blue"
    >
      <Heart
        className={cn(
          "size-[18px] transition-all duration-300",
          favorite
            ? "fill-red-500 text-red-500"
            : "text-kaza-navy hover:fill-red-500/20",
        )}
      />
    </button>
  );
}

function RatingPill({
  rating,
  reviewsCount,
}: {
  rating: number;
  reviewsCount?: number;
}) {
  return (
    <div className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs">
      <Star className="size-3 fill-amber-500 text-amber-500" />
      <span className="font-semibold text-amber-900">{rating.toFixed(1)}</span>
      {reviewsCount ? (
        <span className="text-amber-700/70">({reviewsCount})</span>
      ) : null}
    </div>
  );
}

function SpecsRow({
  bedrooms,
  bathrooms,
  squareMeters,
  typeLabel,
  className,
}: {
  bedrooms: number;
  bathrooms: number;
  squareMeters: number;
  typeLabel?: string;
  className?: string;
}) {
  const items = [
    bedrooms > 0
      ? {
          icon: Bed,
          label: `${bedrooms} ch.`,
          aria: `${bedrooms} chambres`,
        }
      : null,
    bathrooms > 0
      ? {
          icon: Bath,
          label: `${bathrooms} sdb`,
          aria: `${bathrooms} salles de bain`,
        }
      : null,
    squareMeters > 0
      ? {
          icon: Maximize,
          label: `${squareMeters} m²`,
          aria: `${squareMeters} mètres carrés`,
        }
      : null,
  ].filter((x): x is { icon: typeof Bed; label: string; aria: string } => x !== null);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3 text-xs text-muted-foreground",
        className,
      )}
    >
      {typeLabel ? (
        <span className="font-medium text-kaza-navy">{typeLabel}</span>
      ) : null}
      {items.map((item, i) => (
        <span
          key={i}
          aria-label={item.aria}
          className="inline-flex items-center gap-1"
        >
          <item.icon className="size-3.5" />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function PriceTag({ price }: { price: string }) {
  return (
    <div className="flex items-baseline gap-1">
      <span className="font-heading text-xl font-bold text-kaza-navy">
        {price}
      </span>
      <span className="text-xs font-medium text-muted-foreground">/mois</span>
    </div>
  );
}
