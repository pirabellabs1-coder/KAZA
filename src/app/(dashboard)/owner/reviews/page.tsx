import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Star } from "lucide-react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { RatingSummary } from "@/components/reviews/rating-summary";
import { ReviewList } from "@/components/reviews/review-list";
import type { ReviewItem } from "@/components/reviews/review-card";

import { listOwnerReceivedReviews } from "@/lib/queries/reviews";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";

export const metadata: Metadata = {
  title: "Mes évaluations",
};

export const dynamic = "force-dynamic";

const FILTERS = {
  all: () => true,
  "5": (r: ReviewItem) => r.rating === 5,
  "4": (r: ReviewItem) => r.rating === 4,
  low: (r: ReviewItem) => r.rating <= 3,
} as const;

export default async function OwnerReviewsPage() {
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login");

  const ownerReviews = await listOwnerReceivedReviews(user.id);

  // Adapter shape Supabase → shape ReviewItem attendue par <ReviewList>.
  const reviews: ReviewItem[] = ownerReviews.map((r) => {
    const fullName = `${r.reviewerFirstName} ${r.reviewerLastName}`.trim();
    return {
      id: r.id,
      authorName: fullName || "Anonyme",
      authorAvatar: null,
      rating: r.rating,
      date: r.createdAt,
      comment: r.comment,
      propertyId: r.propertyId,
      propertyTitle: r.propertyTitle,
    };
  });

  const total = reviews.length;
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  const average = total > 0 ? sum / total : 0;
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<
    1 | 2 | 3 | 4 | 5,
    number
  >;
  for (const r of reviews) {
    const k = Math.round(r.rating) as 1 | 2 | 3 | 4 | 5;
    if (k >= 1 && k <= 5) distribution[k] += 1;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Mes évaluations
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Consultez les avis laissés par vos locataires et visiteurs.
        </p>
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/30 p-10 text-center">
          <Star className="h-10 w-10 text-muted-foreground" />
          <h2 className="font-heading text-base font-bold text-kaza-navy">
            Aucune évaluation pour le moment
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Une fois la location terminée, vos locataires pourront laisser un
            avis sur leur expérience. Les évaluations s&apos;afficheront ici.
          </p>
        </div>
      ) : (
        <>
          <RatingSummary
            average={average}
            total={total}
            distribution={distribution}
          />

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full max-w-md overflow-x-auto">
              <TabsTrigger value="all">Toutes</TabsTrigger>
              <TabsTrigger value="5">5★</TabsTrigger>
              <TabsTrigger value="4">4★</TabsTrigger>
              <TabsTrigger value="low">3★ et moins</TabsTrigger>
            </TabsList>

            {(Object.keys(FILTERS) as Array<keyof typeof FILTERS>).map((key) => {
              const filtered = reviews.filter(FILTERS[key]);
              return (
                <TabsContent key={key} value={key} className="mt-4">
                  <ReviewList reviews={filtered} />
                </TabsContent>
              );
            })}
          </Tabs>
        </>
      )}
    </div>
  );
}
