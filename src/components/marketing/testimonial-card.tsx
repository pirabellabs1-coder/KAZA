import Image from "next/image";
import { Quote, Star } from "lucide-react";
import { cn } from "@/lib/utils";

type TestimonialCardProps = {
  name: string;
  role: string;
  avatarSeed: string;
  rating: number;
  quote: string;
  city: string;
  highlight?: string;
  className?: string;
};

export function TestimonialCard({
  name,
  role,
  avatarSeed,
  rating,
  quote,
  city,
  highlight,
  className,
}: TestimonialCardProps) {
  const safeRating = Math.max(0, Math.min(5, Math.round(rating)));
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    avatarSeed
  )}&background=1A3A52&color=fff&bold=true&size=128`;

  const renderQuote = () => {
    if (!highlight || !quote.includes(highlight)) {
      return quote;
    }
    const [before, ...rest] = quote.split(highlight);
    const after = rest.join(highlight);
    return (
      <>
        {before}
        <mark className="rounded-sm bg-kaza-green/10 px-1 text-kaza-green decoration-clone">
          {highlight}
        </mark>
        {after}
      </>
    );
  };

  return (
    <article
      className={cn(
        "group relative flex flex-col gap-4 rounded-2xl border bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
        className
      )}
    >
      <Quote
        className="size-8 text-kaza-blue/30 transition-colors group-hover:text-kaza-blue/50"
        aria-hidden="true"
      />

      <div className="flex items-center gap-0.5" aria-label={`Note ${safeRating} sur 5`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              "size-4",
              i < safeRating
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-muted-foreground/30"
            )}
            aria-hidden="true"
          />
        ))}
      </div>

      <blockquote className="text-base leading-relaxed text-foreground">
        {renderQuote()}
      </blockquote>

      <div className="mt-auto flex items-center gap-3 pt-4">
        <div className="relative size-11 overflow-hidden rounded-full ring-2 ring-kaza-blue/10">
          <Image
            src={avatarUrl}
            alt={`Photo de profil de ${name}`}
            fill
            sizes="44px"
            className="object-cover"
            unoptimized
          />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-kaza-navy">{name}</span>
          <span className="text-xs text-muted-foreground">
            {role} &middot; {city}
          </span>
        </div>
      </div>
    </article>
  );
}
