"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type StatCounterProps = {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  description?: string;
  duration?: number;
  className?: string;
};

export function StatCounter({
  value,
  suffix,
  prefix,
  label,
  description,
  duration = 1500,
  className,
}: StatCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            const startTime = performance.now();

            const tick = (now: number) => {
              const elapsed = now - startTime;
              const progress = Math.min(elapsed / duration, 1);
              // ease-out cubic
              const eased = 1 - Math.pow(1 - progress, 3);
              setDisplayValue(Math.round(eased * value));

              if (progress < 1) {
                requestAnimationFrame(tick);
              } else {
                setDisplayValue(value);
              }
            };

            requestAnimationFrame(tick);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [value, duration, hasAnimated]);

  return (
    <div ref={ref} className={cn("flex flex-col", className)}>
      <div
        className="bg-gradient-to-br from-kaza-navy to-kaza-blue bg-clip-text font-heading text-2xl font-bold tracking-tight text-transparent sm:text-3xl lg:text-[2rem]"
        aria-live="polite"
      >
        {prefix}
        {displayValue.toLocaleString("fr-FR")}
        {suffix}
      </div>
      <div className="mt-2 text-sm font-medium text-foreground">{label}</div>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
