import { Star } from "lucide-react";
import { RatingStars } from "@/components/shared/rating-stars";
import { cn } from "@/lib/utils";

interface RatingDistribution {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

interface RatingSummaryProps {
  average: number;
  total: number;
  distribution: RatingDistribution;
  className?: string;
}

export function RatingSummary({
  average,
  total,
  distribution,
  className,
}: RatingSummaryProps) {
  const stars = [5, 4, 3, 2, 1] as const;

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-6",
        className
      )}
    >
      <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-center">
        {/* Average */}
        <div className="flex flex-col items-center justify-center text-center md:border-r md:pr-8">
          <p className="font-heading text-5xl font-bold text-kaza-navy">
            {average.toFixed(1)}
          </p>
          <div className="mt-2">
            <RatingStars rating={average} size="md" />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {total} {total > 1 ? "avis" : "avis"}
          </p>
        </div>

        {/* Distribution */}
        <div className="space-y-2">
          {stars.map((star) => {
            const count = distribution[star] ?? 0;
            const pct = total > 0 ? (count / total) * 100 : 0;

            return (
              <div key={star} className="flex items-center gap-3">
                <div className="flex w-12 items-center gap-1 text-sm font-medium text-muted-foreground">
                  {star}
                  <Star className="size-3.5 fill-kaza-warning text-kaza-warning" />
                </div>
                <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-kaza-warning transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-12 text-right text-xs text-muted-foreground tabular-nums">
                  {pct.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
