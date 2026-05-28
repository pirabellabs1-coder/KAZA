"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ChevronDown, Quote, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn, formatDate } from "@/lib/utils";
import {
  getReviewsForProperty,
  getAverageRating,
  getRatingDistribution,
  type DemoReview,
  type ReviewRating,
} from "@/lib/demo-reviews";

interface ReviewsSectionProps {
  propertyId: string;
  /** Note moyenne facultative pour synchro avec la fiche (sinon calculée). */
  rating?: number;
  /** Nombre d'avis facultatif (sinon calculé). */
  reviewsCount?: number;
  className?: string;
}

const ROLE_BADGE: Record<DemoReview["authorRole"], string> = {
  Locataire: "bg-kaza-blue/10 text-kaza-blue",
  Étudiant: "bg-kaza-green/10 text-kaza-green",
  Propriétaire: "bg-kaza-navy/10 text-kaza-navy",
};

export function ReviewsSection({
  propertyId,
  rating,
  reviewsCount,
  className,
}: ReviewsSectionProps) {
  const reviews = useMemo(
    () => getReviewsForProperty(propertyId),
    [propertyId]
  );

  const average = rating ?? getAverageRating(reviews);
  const total = reviewsCount ?? reviews.length;
  const distribution = useMemo(() => getRatingDistribution(reviews), [reviews]);

  const [showAll, setShowAll] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "5" | "4" | "low">(
    "all"
  );

  const filtered = useMemo(() => {
    switch (activeFilter) {
      case "5":
        return reviews.filter((r) => r.rating === 5);
      case "4":
        return reviews.filter((r) => r.rating === 4);
      case "low":
        return reviews.filter((r) => r.rating <= 3);
      default:
        return reviews;
    }
  }, [reviews, activeFilter]);

  const visible = showAll ? filtered : filtered.slice(0, 6);

  return (
    <section className={cn("w-full", className)} aria-label="Avis des utilisateurs">
      {/* Header : note + distribution */}
      <div className="grid gap-8 rounded-3xl border border-gray-100 bg-gradient-to-br from-white via-gray-50 to-white p-6 shadow-sm sm:p-8 lg:grid-cols-[260px_1fr] lg:gap-12">
        {/* Note moyenne */}
        <div className="flex flex-col items-center justify-center text-center lg:items-start lg:text-left">
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-6xl font-bold text-kaza-navy lg:text-7xl">
              {average.toFixed(1)}
            </span>
            <span className="text-lg font-medium text-muted-foreground">/5</span>
          </div>
          <div className="mt-2 flex items-center gap-0.5" aria-hidden>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "size-5",
                  i < Math.round(average)
                    ? "fill-amber-400 text-amber-400"
                    : "fill-transparent text-muted-foreground/30"
                )}
              />
            ))}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Basé sur{" "}
            <span className="font-semibold text-kaza-navy">{total}</span>{" "}
            {total > 1 ? "avis vérifiés" : "avis vérifié"}
          </p>
        </div>

        {/* Distribution */}
        <div className="flex flex-col justify-center gap-2.5">
          {([5, 4, 3, 2, 1] as ReviewRating[]).map((star) => {
            const count = distribution[star];
            const pct = reviews.length > 0
              ? Math.round((count / reviews.length) * 100)
              : 0;
            return (
              <div key={star} className="flex items-center gap-3">
                <span className="flex w-10 items-center justify-end gap-1 text-sm font-medium text-kaza-navy">
                  {star}
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                </span>
                <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      star >= 4
                        ? "bg-gradient-to-r from-kaza-green to-emerald-400"
                        : star === 3
                          ? "bg-amber-400"
                          : "bg-red-400"
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-12 text-right text-xs font-medium text-muted-foreground tabular-nums">
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs filtres */}
      <Tabs
        value={activeFilter}
        onValueChange={(v) => {
          setActiveFilter(v as typeof activeFilter);
          setShowAll(false);
        }}
        className="mt-8"
      >
        <TabsList className="h-11">
          <TabsTrigger value="all" className="px-4">
            Tous ({reviews.length})
          </TabsTrigger>
          <TabsTrigger value="5" className="px-4">
            5★ ({distribution[5]})
          </TabsTrigger>
          <TabsTrigger value="4" className="px-4">
            4★ ({distribution[4]})
          </TabsTrigger>
          <TabsTrigger value="low" className="px-4">
            3★ et moins ({distribution[3] + distribution[2] + distribution[1]})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeFilter} className="mt-6">
          {visible.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center text-sm text-muted-foreground">
              Aucun avis dans cette catégorie pour le moment.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {visible.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}

          {/* CTA voir plus */}
          {!showAll && filtered.length > 6 && (
            <div className="mt-8 flex justify-center">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowAll(true)}
                className="border-kaza-navy/20 text-kaza-navy hover:bg-kaza-navy hover:text-white"
              >
                Voir les {filtered.length} avis
                <ChevronDown className="ml-2 size-4" />
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}

// =============================================================================
// ReviewCard
// =============================================================================

function ReviewCard({ review }: { review: DemoReview }) {
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    review.avatarSeed
  )}&background=1A3A52&color=fff&bold=true&size=128`;

  return (
    <article className="group relative flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <Quote
        aria-hidden
        className="absolute right-5 top-5 size-7 text-kaza-blue/15 transition-colors group-hover:text-kaza-blue/30"
      />

      {/* Header auteur */}
      <header className="flex items-center gap-3">
        <div className="relative size-11 shrink-0 overflow-hidden rounded-full ring-2 ring-kaza-blue/10">
          <Image
            src={avatarUrl}
            alt={`Avatar de ${review.authorName}`}
            fill
            sizes="44px"
            className="object-cover"
            unoptimized
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-kaza-navy">
            {review.authorName}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 font-medium",
                ROLE_BADGE[review.authorRole]
              )}
            >
              {review.authorRole}
            </span>
            {review.city && <span>· {review.city}</span>}
          </div>
        </div>
      </header>

      {/* Note + date */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-0.5" aria-label={`Note ${review.rating} sur 5`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              aria-hidden
              className={cn(
                "size-3.5",
                i < review.rating
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-muted-foreground/30"
              )}
            />
          ))}
        </div>
        <time
          dateTime={review.date}
          className="text-xs text-muted-foreground"
        >
          {formatDate(review.date)}
        </time>
      </div>

      {/* Titre */}
      {review.title && (
        <h4 className="font-heading text-sm font-semibold leading-snug text-foreground">
          {review.title}
        </h4>
      )}

      {/* Commentaire */}
      <p className="text-sm leading-relaxed text-muted-foreground">
        {review.comment}
      </p>
    </article>
  );
}
