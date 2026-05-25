"use client";

import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { MessageSquare } from "lucide-react";
import { ReviewCard, type ReviewItem } from "./review-card";

type SortKey = "recent" | "best" | "worst";

interface ReviewListProps {
  reviews: ReviewItem[];
  pageSize?: number;
  onReport?: (id: string) => void;
}

export function ReviewList({ reviews, pageSize = 6, onReport }: ReviewListProps) {
  const [sort, setSort] = useState<SortKey>("recent");
  const [visible, setVisible] = useState(pageSize);

  const sorted = useMemo(() => {
    const copy = [...reviews];
    switch (sort) {
      case "best":
        return copy.sort((a, b) => b.rating - a.rating);
      case "worst":
        return copy.sort((a, b) => a.rating - b.rating);
      case "recent":
      default:
        return copy.sort(
          (a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }
  }, [reviews, sort]);

  const shown = sorted.slice(0, visible);
  const hasMore = visible < sorted.length;

  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="Pas encore d'évaluations"
        description="Les avis de vos locataires et invités apparaîtront ici."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {reviews.length} évaluation{reviews.length > 1 ? "s" : ""}
        </p>
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Plus récents</SelectItem>
            <SelectItem value="best">Mieux notés</SelectItem>
            <SelectItem value="worst">Moins bien notés</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {shown.map((review) => (
          <ReviewCard key={review.id} review={review} onReport={onReport} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={() => setVisible((v) => v + pageSize)}
          >
            Charger plus
          </Button>
        </div>
      )}
    </div>
  );
}
