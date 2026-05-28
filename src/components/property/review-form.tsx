"use client";

import { useState, useTransition } from "react";
import { PenSquare, Loader2 } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { RatingStars } from "@/components/shared/rating-stars";
import { toast } from "@/components/ui/toast-helper";
import { submitReview } from "@/actions/reviews";

interface ReviewFormProps {
  rentalId: string;
  propertyTitle: string;
  ownerName?: string;
  triggerLabel?: string;
  triggerVariant?:
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "destructive";
  triggerClassName?: string;
}

const MIN_COMMENT = 10;
const MAX_COMMENT = 1000;

export function ReviewForm({
  rentalId,
  propertyTitle,
  ownerName,
  triggerLabel = "Écrire mon avis",
  triggerVariant = "default",
  triggerClassName = "bg-kaza-blue hover:bg-kaza-blue/90",
}: ReviewFormProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isPending, startTransition] = useTransition();

  const reset = () => {
    setRating(0);
    setComment("");
  };

  const handleOpenChange = (next: boolean) => {
    if (isPending) return;
    setOpen(next);
    if (!next) reset();
  };

  const handleSubmit = () => {
    if (rating < 1 || rating > 5) {
      toast.error("Sélectionnez une note entre 1 et 5 étoiles.");
      return;
    }
    const trimmed = comment.trim();
    if (trimmed.length < MIN_COMMENT) {
      toast.error(
        `Votre commentaire doit faire au moins ${MIN_COMMENT} caractères.`,
      );
      return;
    }
    if (trimmed.length > MAX_COMMENT) {
      toast.error(
        `Votre commentaire ne peut pas dépasser ${MAX_COMMENT} caractères.`,
      );
      return;
    }

    startTransition(async () => {
      const result = await submitReview({
        rentalId,
        rating,
        comment: trimmed,
      });
      if (!result.success) {
        toast.error(result.error ?? "Impossible d'enregistrer votre avis.");
        return;
      }
      toast.success("Merci pour votre avis !");
      setOpen(false);
      reset();
    });
  };

  const commentLength = comment.length;
  const isTooShort = commentLength < MIN_COMMENT;
  const isTooLong = commentLength > MAX_COMMENT;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant={triggerVariant}
          className={triggerClassName}
        >
          <PenSquare className="mr-1.5 size-3.5" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Évaluer cette location</DialogTitle>
          <DialogDescription>
            {ownerName
              ? `${propertyTitle} — ${ownerName}`
              : propertyTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Votre note</p>
            <div className="flex justify-center rounded-md bg-muted/30 p-3">
              <RatingStars
                rating={rating}
                interactive
                size="lg"
                onRate={setRating}
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Votre commentaire</p>
            <Textarea
              rows={5}
              maxLength={MAX_COMMENT}
              placeholder="Partagez votre expérience : qualité du logement, relation avec le propriétaire, réactivité..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isPending}
            />
            <p
              className={
                isTooLong
                  ? "text-[10px] text-destructive"
                  : "text-[10px] text-muted-foreground"
              }
            >
              {commentLength} / {MAX_COMMENT} caractères · minimum{" "}
              {MIN_COMMENT}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button
            className="bg-kaza-blue hover:bg-kaza-blue/90"
            onClick={handleSubmit}
            disabled={
              isPending || rating === 0 || isTooShort || isTooLong
            }
          >
            {isPending ? (
              <>
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                Publication...
              </>
            ) : (
              "Publier mon avis"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
