import { Check, Lock, Unlock, AlertTriangle, Clock } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

// =============================================================================
// KAZA - Timeline Escrow (séquestre)
// =============================================================================

export type EscrowStatus = "held" | "released" | "disputed";

interface EscrowTimelineProps {
  paidAt: string;
  releaseAt: string;
  currentStatus: EscrowStatus;
}

function getProgressPercent(paidAt: string, releaseAt: string): number {
  const paid = new Date(paidAt).getTime();
  const release = new Date(releaseAt).getTime();
  const now = Date.now();
  if (now <= paid) return 0;
  if (now >= release) return 100;
  return Math.round(((now - paid) / (release - paid)) * 100);
}

function getDaysRemaining(releaseAt: string): number {
  const release = new Date(releaseAt).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((release - now) / (1000 * 60 * 60 * 24)));
}

export function EscrowTimeline({
  paidAt,
  releaseAt,
  currentStatus,
}: EscrowTimelineProps) {
  const percent = getProgressPercent(paidAt, releaseAt);
  const daysLeft = getDaysRemaining(releaseAt);
  const isReleased = currentStatus === "released";
  const isDisputed = currentStatus === "disputed";

  const progressColor = isDisputed
    ? "bg-destructive"
    : isReleased
      ? "bg-kaza-green"
      : "bg-kaza-blue";

  return (
    <div className="w-full">
      {/* Bandeau statut */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isDisputed ? (
            <>
              <AlertTriangle className="size-4 text-destructive" />
              <span className="text-sm font-semibold text-destructive">
                Litige en cours
              </span>
            </>
          ) : isReleased ? (
            <>
              <Unlock className="size-4 text-kaza-green" />
              <span className="text-sm font-semibold text-kaza-green">
                Fonds libérés
              </span>
            </>
          ) : (
            <>
              <Lock className="size-4 text-kaza-blue" />
              <span className="text-sm font-semibold text-kaza-blue">
                Fonds en séquestre
              </span>
            </>
          )}
        </div>
        {!isReleased && !isDisputed && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" />
            {daysLeft > 0
              ? `${daysLeft} jour${daysLeft > 1 ? "s" : ""} restant${daysLeft > 1 ? "s" : ""}`
              : "Libération imminente"}
          </span>
        )}
      </div>

      {/* Timeline horizontale */}
      <div className="relative">
        {/* Jalons */}
        <div className="flex items-center justify-between">
          {/* Jalon 1 : Paiement reçu */}
          <div className="z-10 flex flex-col items-center">
            <div className="flex size-9 items-center justify-center rounded-full border-2 border-kaza-green bg-kaza-green text-white shadow-sm">
              <Check className="size-4" strokeWidth={3} />
            </div>
            <p className="mt-2 text-xs font-medium text-foreground">
              Paiement reçu
            </p>
            <p className="text-[10px] text-muted-foreground">
              {formatDate(paidAt)}
            </p>
          </div>

          {/* Jalon 2 : En séquestre (milieu) */}
          <div className="z-10 flex flex-col items-center">
            <div
              className={cn(
                "flex size-9 items-center justify-center rounded-full border-2 bg-background shadow-sm",
                isDisputed
                  ? "border-destructive text-destructive"
                  : isReleased || percent >= 50
                    ? "border-kaza-blue bg-kaza-blue text-white"
                    : "border-muted-foreground/30 text-muted-foreground"
              )}
            >
              {isDisputed ? (
                <AlertTriangle className="size-4" />
              ) : (
                <Lock className="size-4" />
              )}
            </div>
            <p className="mt-2 text-xs font-medium text-foreground">
              {isDisputed ? "Litige" : "En séquestre"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {percent}% écoulé
            </p>
          </div>

          {/* Jalon 3 : Libération propriétaire */}
          <div className="z-10 flex flex-col items-center">
            <div
              className={cn(
                "flex size-9 items-center justify-center rounded-full border-2 shadow-sm",
                isReleased
                  ? "border-kaza-green bg-kaza-green text-white"
                  : "border-muted-foreground/30 bg-background text-muted-foreground"
              )}
            >
              {isReleased ? (
                <Check className="size-4" strokeWidth={3} />
              ) : (
                <Unlock className="size-4" />
              )}
            </div>
            <p className="mt-2 text-xs font-medium text-foreground">
              Libération propriétaire
            </p>
            <p className="text-[10px] text-muted-foreground">
              {formatDate(releaseAt)}
            </p>
          </div>
        </div>

        {/* Barre de progression (derrière les jalons) */}
        <div className="absolute left-0 right-0 top-[18px] -z-0 mx-[18px] h-1 rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              progressColor
            )}
            style={{ width: isReleased ? "100%" : `${percent}%` }}
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}
