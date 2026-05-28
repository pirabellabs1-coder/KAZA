"use client";

import { useState, useTransition } from "react";
import { Flag, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast-helper";
import { cn } from "@/lib/utils";
// =============================================================================
// Fallbacks locaux : la persistance réelle des signalements n'est pas encore
// branchée. On garde les libellés et le typage afin de préserver l'UI ;
// `addReport` est un no-op tant qu'aucune table `reports` n'est exposée via
// une server action publique.
// =============================================================================
type ReportReason =
  | "inappropriate"
  | "spam"
  | "scam"
  | "fake"
  | "harassment"
  | "illegal"
  | "other";

type ReportTargetType = "property" | "user" | "review" | "message" | "listing";

const REASON_META: Record<ReportReason, { label: string; description: string }> = {
  inappropriate: {
    label: "Contenu inapproprié",
    description: "Propos ou images non conformes aux règles KAZA.",
  },
  spam: {
    label: "Spam",
    description: "Contenu publicitaire répétitif ou non sollicité.",
  },
  scam: {
    label: "Arnaque",
    description: "Tentative de fraude, demande de paiement suspecte.",
  },
  fake: {
    label: "Fausse annonce",
    description: "Bien inexistant, photos volées ou prix mensonger.",
  },
  harassment: {
    label: "Harcèlement",
    description: "Comportement abusif, menaces ou propos haineux.",
  },
  illegal: {
    label: "Activité illégale",
    description: "Contenu contraire à la loi en vigueur.",
  },
  other: {
    label: "Autre",
    description: "Précisez la raison dans la description ci-dessous.",
  },
};

function addReport(_payload: {
  targetType: ReportTargetType;
  targetId: string;
  targetLabel: string;
  reason: ReportReason;
  description: string;
  reporterId: string;
}): void {
  // TODO: brancher sur une server action `reportContent()` (Supabase `reports`).
}

interface ReportButtonProps {
  targetType: ReportTargetType;
  targetId: string;
  targetLabel: string;
  variant?: "icon" | "link" | "button";
  className?: string;
}

const REASONS_ORDER: ReportReason[] = [
  "inappropriate",
  "spam",
  "scam",
  "fake",
  "harassment",
  "illegal",
  "other",
];

export function ReportButton({
  targetType,
  targetId,
  targetLabel,
  variant = "button",
  className,
}: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState("");
  const [certified, setCertified] = useState(false);
  const [isPending, startTransition] = useTransition();

  function resetState(): void {
    setReason(null);
    setDescription("");
    setCertified(false);
  }

  function handleSubmit(): void {
    if (!reason) {
      toast.error("Veuillez sélectionner une raison.");
      return;
    }
    if (description.trim().length < 10) {
      toast.error("Décrivez la situation en au moins 10 caractères.");
      return;
    }
    if (!certified) {
      toast.error("Veuillez certifier que votre signalement est sincère.");
      return;
    }

    startTransition(() => {
      addReport({
        targetType,
        targetId,
        targetLabel,
        reason,
        description: description.trim(),
        reporterId: "demo-user",
      });
      toast.success("Signalement envoyé. Notre équipe va l'examiner.");
      setOpen(false);
      // Petit délai pour éviter le flicker pendant la fermeture
      setTimeout(resetState, 200);
    });
  }

  const triggerButton = renderTrigger(variant, className);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setTimeout(resetState, 200);
        }
      }}
    >
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="size-5 text-destructive" />
            Signaler
          </DialogTitle>
          <DialogDescription>
            <span className="block">
              Cible :{" "}
              <Badge variant="outline" className="ml-1 text-xs">
                {targetLabel}
              </Badge>
            </span>
            <span className="mt-1 block text-xs">
              Aidez-nous à maintenir KAZA sûr. Les abus de signalement peuvent
              entraîner une suspension.
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* Raisons en radio cards */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Raison du signalement</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {REASONS_ORDER.map((r) => {
              const meta = REASON_META[r];
              const selected = reason === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={cn(
                    "rounded-md border p-3 text-left transition",
                    selected
                      ? "border-kaza-blue bg-kaza-blue/5 ring-1 ring-kaza-blue"
                      : "border-border hover:bg-muted/50",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex size-4 items-center justify-center rounded-full border",
                        selected
                          ? "border-kaza-blue bg-kaza-blue"
                          : "border-input",
                      )}
                    >
                      {selected && (
                        <span className="size-1.5 rounded-full bg-white" />
                      )}
                    </span>
                    <span className="text-sm font-medium">{meta.label}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {meta.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="report-description">
            Description détaillée <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="report-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="Expliquez le contexte (dates, captures, comportements observés...)."
          />
          <p className="text-xs text-muted-foreground">
            {description.length}/500 caractères
          </p>
        </div>

        {/* Certification */}
        <label className="flex items-start gap-2 rounded-md bg-muted/40 p-3 text-xs">
          <input
            type="checkbox"
            checked={certified}
            onChange={(e) => setCertified(e.target.checked)}
            className="mt-0.5 size-4 rounded border-input accent-[var(--color-kaza-blue)]"
          />
          <span>
            Je certifie que ce signalement est sincère et basé sur des faits. Je
            comprends qu&apos;un signalement abusif peut entraîner des
            sanctions.
          </span>
        </label>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Flag className="mr-2 size-4" />
            )}
            Envoyer le signalement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function renderTrigger(
  variant: "icon" | "link" | "button",
  className?: string,
) {
  if (variant === "icon") {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Signaler"
        className={cn(
          "text-muted-foreground hover:text-destructive",
          className,
        )}
      >
        <Flag className="size-4" />
      </Button>
    );
  }

  if (variant === "link") {
    return (
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:text-destructive hover:underline",
          className,
        )}
      >
        <Flag className="size-3.5" />
        Signaler
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn(
        "border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive",
        className,
      )}
    >
      <Flag className="mr-2 size-4" />
      Signaler
    </Button>
  );
}
