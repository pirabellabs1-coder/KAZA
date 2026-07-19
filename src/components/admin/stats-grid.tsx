import { cn } from "@/lib/utils";

interface StatsGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: 2 | 3 | 4;
}

/**
 * Responsive grid wrapper for <StatsCard /> components.
 * Default: 1 column on mobile, 2 on tablet, 4 on desktop.
 */
export function StatsGrid({
  children,
  className,
  cols = 4,
}: StatsGridProps) {
  const colsClass =
    cols === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : cols === 3
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div className={cn("stagger-children grid gap-4", colsClass, className)}>
      {children}
    </div>
  );
}
