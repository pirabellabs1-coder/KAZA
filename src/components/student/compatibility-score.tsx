import { cn } from "@/lib/utils";

interface CompatibilityScoreProps {
  score: number; // 0-100
  size?: "sm" | "md" | "lg";
  className?: string;
}

const DIMENSIONS = {
  sm: { box: 72, radius: 30, stroke: 6, text: "text-lg", label: "text-[10px]" },
  md: { box: 120, radius: 50, stroke: 10, text: "text-3xl", label: "text-xs" },
  lg: { box: 160, radius: 68, stroke: 12, text: "text-4xl", label: "text-sm" },
} as const;

type Tier = {
  label: string;
  stroke: string;
  text: string;
  bg: string;
  badge: string;
};

function getTier(score: number): Tier {
  if (score >= 90)
    return {
      label: "Excellent match",
      stroke: "stroke-kaza-green",
      text: "text-kaza-green",
      bg: "bg-kaza-green/10",
      badge: "text-kaza-green",
    };
  if (score >= 70)
    return {
      label: "Très bon match",
      stroke: "stroke-kaza-blue",
      text: "text-kaza-blue",
      bg: "bg-kaza-blue/10",
      badge: "text-kaza-blue",
    };
  if (score >= 50)
    return {
      label: "Match correct",
      stroke: "stroke-orange-500",
      text: "text-orange-600",
      bg: "bg-orange-50",
      badge: "text-orange-600",
    };
  return {
    label: "Faible compatibilité",
    stroke: "stroke-red-500",
    text: "text-red-600",
    bg: "bg-red-50",
    badge: "text-red-600",
  };
}

export function CompatibilityScore({
  score,
  size = "md",
  className,
}: CompatibilityScoreProps) {
  const dim = DIMENSIONS[size];
  const safe = Math.max(0, Math.min(score, 100));
  const tier = getTier(safe);
  const circumference = 2 * Math.PI * dim.radius;
  const dashOffset = circumference - (safe / 100) * circumference;
  const center = dim.box / 2;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div
        className="relative"
        style={{ width: dim.box, height: dim.box }}
        role="img"
        aria-label={`Score de compatibilité ${safe}%`}
      >
        <svg
          width={dim.box}
          height={dim.box}
          viewBox={`0 0 ${dim.box} ${dim.box}`}
          className="-rotate-90"
        >
          <circle
            cx={center}
            cy={center}
            r={dim.radius}
            strokeWidth={dim.stroke}
            className="stroke-muted/40 fill-none"
          />
          <circle
            cx={center}
            cy={center}
            r={dim.radius}
            strokeWidth={dim.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className={cn("fill-none transition-all duration-500", tier.stroke)}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(
              "font-heading font-bold tabular-nums leading-none",
              dim.text,
              tier.text
            )}
          >
            {Math.round(safe)}
            <span className="text-[0.5em] font-semibold">%</span>
          </span>
        </div>
      </div>
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 font-medium",
          dim.label,
          tier.bg,
          tier.badge
        )}
      >
        {tier.label}
      </span>
    </div>
  );
}
