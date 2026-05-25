"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface RatingStarsProps {
  rating?: number;
  maxStars?: number;
  interactive?: boolean;
  size?: "sm" | "md" | "lg";
  onRate?: (rating: number) => void;
}

export function RatingStars({
  rating = 0,
  maxStars = 5,
  interactive = false,
  size = "md",
  onRate,
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const displayRating = hoverRating || rating;

  const sizeClasses = {
    sm: "size-3.5",
    md: "size-5",
    lg: "size-6",
  };

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxStars }, (_, i) => {
        const starIndex = i + 1;
        const isFull = displayRating >= starIndex;
        const isHalf =
          !isFull && displayRating >= starIndex - 0.5;

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            className={cn(
              "relative",
              interactive && "cursor-pointer hover:scale-110 transition-transform",
              !interactive && "cursor-default"
            )}
            onClick={() => interactive && onRate?.(starIndex)}
            onMouseEnter={() => interactive && setHoverRating(starIndex)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            aria-label={`${starIndex} étoile${starIndex > 1 ? "s" : ""}`}
          >
            <Star
              className={cn(
                sizeClasses[size],
                isFull
                  ? "fill-kaza-warning text-kaza-warning"
                  : isHalf
                    ? "fill-kaza-warning/50 text-kaza-warning"
                    : "text-muted-foreground/30"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
