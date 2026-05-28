import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";

type CityCardProps = {
  slug: string;
  name: string;
  country: string;
  imageUrl: string;
  propertiesCount: number;
  averagePrice: number;
  neighborhoods?: string[];
  className?: string;
};

export function CityCard({
  slug,
  name,
  country,
  imageUrl,
  propertiesCount,
  averagePrice,
  neighborhoods,
  className,
}: CityCardProps) {
  return (
    <Link
      href={`/search?location=${slug}`}
      className={cn(
        "group relative block aspect-[4/3] overflow-hidden rounded-xl shadow-sm transition-all duration-300 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kaza-blue focus-visible:ring-offset-2",
        className
      )}
      aria-label={`Voir les annonces a ${name}, ${country}`}
    >
      <Image
        src={imageUrl}
        alt={`Vue de la ville de ${name}`}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />

      <div
        className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent transition-opacity duration-300 group-hover:from-black/95 group-hover:via-black/50"
        aria-hidden="true"
      />

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-5 text-white">
        <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-white/70">
          <MapPin className="size-3" aria-hidden="true" />
          {country}
        </div>
        <h3 className="font-heading text-2xl font-bold leading-tight drop-shadow-sm">
          {name}
        </h3>

        {neighborhoods && neighborhoods.length > 0 && (
          <p className="line-clamp-1 text-xs text-white/75">
            {neighborhoods.slice(0, 3).join(" · ")}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium backdrop-blur-sm">
            {propertiesCount.toLocaleString("fr-FR")} annonces
          </span>
          <span className="inline-flex items-center rounded-full bg-kaza-green/90 px-2.5 py-1 text-xs font-medium">
            {formatPrice(averagePrice)} /mois moy.
          </span>
        </div>
      </div>
    </Link>
  );
}
