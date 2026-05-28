"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPoints, getPointsBalance } from "@/lib/demo-points";

interface PointsBadgeProps {
  /**
   * - `compact` : icône + nombre seul (pour une barre d'outils dense).
   * - `full`    : icône + nombre + libellé "KAZA Points".
   */
  variant?: "compact" | "full";
  className?: string;
  /**
   * Si vrai, le badge devient un lien vers /points.
   */
  asLink?: boolean;
}

/**
 * Badge réutilisable affichant le solde courant de KAZA Points.
 * Lit depuis localStorage côté client ; rend un placeholder neutre en SSR.
 */
export function PointsBadge({
  variant = "compact",
  className,
  asLink = true,
}: PointsBadgeProps) {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    setBalance(getPointsBalance());

    const handler = () => setBalance(getPointsBalance());
    window.addEventListener("storage", handler);
    window.addEventListener("kaza-points-updated", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("kaza-points-updated", handler);
    };
  }, []);

  const display = balance === null ? "—" : formatPoints(balance);

  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-sm font-semibold text-kaza-navy transition-colors hover:border-kaza-blue/40 hover:bg-kaza-blue/5",
        variant === "compact" && "px-2.5 py-1 text-xs",
        className,
      )}
    >
      <Sparkles
        className={cn(
          "shrink-0 text-kaza-warning",
          variant === "compact" ? "size-3.5" : "size-4",
        )}
      />
      <span>{display}</span>
      {variant === "full" && (
        <span className="text-xs font-medium text-muted-foreground">
          KAZA Points
        </span>
      )}
    </span>
  );

  if (asLink) {
    return (
      <Link href="/points" aria-label="Voir mes KAZA Points">
        {content}
      </Link>
    );
  }
  return content;
}
