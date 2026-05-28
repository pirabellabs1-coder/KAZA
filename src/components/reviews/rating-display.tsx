import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingDisplayProps {
  rating: number;
  reviewsCount?: number;
  size?: "sm" | "md" | "lg";
  max?: number;
  className?: string;
}

const SIZE_CLASSES = {
  sm: { star: "size-3.5", text: "text-xs", count: "text-[11px]" },
  md: { star: "size-4", text: "text-sm", count: "text-xs" },
  lg: { star: "size-5", text: "text-base", count: "text-sm" },
} as const;

export function RatingDisplay({
  rating,
  reviewsCount,
  size = "md",
  max = 5,
  className,
}: RatingDisplayProps) {
  const s = SIZE_CLASSES[size];
  const safe = Math.max(0, Math.min(rating, max));

  return (
    <div
      className={cn("inline-flex items-center gap-1.5", className)}
      aria-label={`Note ${safe.toFixed(1)} sur ${max}`}
    >
      <div className="flex items-center gap-0.5">
        {Array.from({ length: max }, (_, i) => {
          const index = i + 1;
          const isFull = safe >= index;
          const isHalf = !isFull && safe >= index - 0.5;
          return (
            <Star
              key={index}
              className={cn(
                s.star,
                isFull
                  ? "fill-kaza-warning text-kaza-warning"
                  : isHalf
                    ? "fill-kaza-warning/50 text-kaza-warning"
                    : "fill-transparent text-muted-foreground/30"
              )}
            />
          );
        })}
      </div>
      <span className={cn(s.text, "font-semibold tabular-nums text-foreground")}>
        {safe.toFixed(1)}
      </span>
      {typeof reviewsCount === "number" ? (
        <span className={cn(s.count, "text-muted-foreground")}>
          ({reviewsCount})
        </span>
      ) : null}
    </div>
  );
}
