"use client";

import { useState } from "react";
import Link from "next/link";
import { Flag } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RatingStars } from "@/components/shared/rating-stars";
import { formatDate, getInitials } from "@/lib/utils";

export interface ReviewItem {
  id: string;
  authorName: string;
  authorAvatar?: string | null;
  rating: number;
  date: string;
  comment: string;
  propertyId?: string;
  propertyTitle?: string;
}

interface ReviewCardProps {
  review: ReviewItem;
  onReport?: (id: string) => void;
}

const COLLAPSE_THRESHOLD = 200;

export function ReviewCard({ review, onReport }: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = review.comment.length > COLLAPSE_THRESHOLD;
  const displayed =
    !isLong || expanded
      ? review.comment
      : `${review.comment.slice(0, COLLAPSE_THRESHOLD).trim()}…`;

  const [firstName = "", lastName = ""] = review.authorName.split(" ");

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar>
              {review.authorAvatar && (
                <AvatarImage src={review.authorAvatar} alt={review.authorName} />
              )}
              <AvatarFallback className="bg-kaza-navy text-xs text-white">
                {getInitials(firstName || review.authorName, lastName || "")}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {review.authorName}
              </p>
              <div className="mt-0.5 flex items-center gap-2">
                <RatingStars rating={review.rating} size="sm" />
                <span className="text-xs text-muted-foreground">
                  {formatDate(review.date)}
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onReport?.(review.id)}
            aria-label="Signaler cet avis"
          >
            <Flag className="size-4" />
          </Button>
        </div>

        {review.propertyId && review.propertyTitle && (
          <Link
            href={`/properties/${review.propertyId}`}
            className="inline-flex text-xs font-medium text-kaza-blue hover:underline"
          >
            {review.propertyTitle}
          </Link>
        )}

        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
          {displayed}
        </p>

        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs font-medium text-kaza-blue hover:underline"
          >
            {expanded ? "Voir moins" : "Voir plus"}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
