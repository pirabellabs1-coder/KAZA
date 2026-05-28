import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    label: string;
    type: "positive" | "negative" | "neutral";
  };
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
}: StatsCardProps) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-5 text-kaza-navy" />
        </div>
        {trend && (
          <span
            className={cn(
              "text-xs font-medium",
              trend.type === "positive" && "text-kaza-green",
              trend.type === "negative" && "text-kaza-error",
              trend.type === "neutral" && "text-muted-foreground"
            )}
          >
            {trend.label}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-1 text-xl font-bold text-foreground">{value}</p>
        {subtitle && (
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
