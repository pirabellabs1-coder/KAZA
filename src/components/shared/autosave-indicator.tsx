"use client";

import { Check, Loader2, AlertCircle, Cloud } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Indicateur visuel d'auto-sauvegarde réutilisable.
 *
 * Utilisation typique :
 * ```tsx
 * const { status, statusLabel } = useAutoSave({ key, data });
 * <AutosaveIndicator status={status} label={statusLabel} />
 * ```
 */
export function AutosaveIndicator({
  status,
  label,
  className,
}: {
  status: "idle" | "saving" | "saved" | "error";
  label: string;
  className?: string;
}) {
  const icon =
    status === "saving" ? (
      <Loader2 className="size-3.5 animate-spin" />
    ) : status === "saved" ? (
      <Check className="size-3.5" />
    ) : status === "error" ? (
      <AlertCircle className="size-3.5" />
    ) : (
      <Cloud className="size-3.5" />
    );

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        status === "saved" && "bg-kaza-green/10 text-kaza-green",
        status === "saving" && "bg-kaza-blue/10 text-kaza-blue",
        status === "error" && "bg-red-50 text-red-600",
        status === "idle" && "bg-muted text-muted-foreground",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      {icon}
      {label}
    </span>
  );
}
