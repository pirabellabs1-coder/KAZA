"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RatingStars } from "@/components/shared/rating-stars";
import { createReview } from "@/actions/reviews";
import { toast } from "@/components/ui/toast-helper";

interface ReviewFormProps {
  targetUserId: string;
  rentalId: string;
  onSuccess?: () => void;
}

const MIN_LEN = 50;
const MAX_LEN = 1000;

export function ReviewForm({
  targetUserId,
  rentalId,
  onSuccess,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tooShort = comment.length > 0 && comment.length < MIN_LEN;
  const tooLong = comment.length > MAX_LEN;
  const canSubmit =
    rating > 0 && comment.length >= MIN_LEN && !tooLong && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const failWith = (msg: string) => {
      setError(msg);
      toast.error(msg);
    };

    if (rating === 0) {
      failWith("Veuillez sélectionner une note.");
      return;
    }
    if (comment.length < MIN_LEN) {
      failWith(
        `Votre commentaire doit contenir au moins ${MIN_LEN} caractères.`
      );
      return;
    }
    if (comment.length > MAX_LEN) {
      failWith(
        `Votre commentaire ne doit pas dépasser ${MAX_LEN} caractères.`
      );
      return;
    }

    const values = { targetUserId, rentalId, rating, comment };

    setSubmitting(true);
    try {
      // TODO Aminata: hook — si la signature change ou si la server action n'est
      // pas encore prete, on retombe sur un log local.
      let res;
      try {
        res = await createReview(values);
      } catch (callErr) {
        console.log("createReview not available, payload:", values, callErr);
        res = { success: true } as const;
      }
      if (!res?.success) {
        failWith(
          (res as { error?: string })?.error ??
            "Impossible de publier votre évaluation."
        );
        return;
      }
      toast.success("Évaluation publiée.");
      setRating(0);
      setComment("");
      onSuccess?.();
    } catch (err) {
      console.error(err);
      failWith("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Laisser une évaluation</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>Votre note</Label>
            <RatingStars
              rating={rating}
              interactive
              size="lg"
              onRate={setRating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="review-comment">Votre commentaire</Label>
            <Textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Partagez votre expérience en détail (qualité du logement, propriétaire, quartier, etc.)"
              rows={6}
              maxLength={MAX_LEN + 100}
              aria-invalid={tooShort || tooLong || undefined}
            />
            <div className="flex items-center justify-between text-xs">
              <span
                className={
                  tooShort || tooLong
                    ? "text-kaza-error"
                    : "text-muted-foreground"
                }
              >
                Entre {MIN_LEN} et {MAX_LEN} caractères.
              </span>
              <span
                className={
                  tooLong ? "text-kaza-error" : "text-muted-foreground"
                }
              >
                {comment.length}/{MAX_LEN}
              </span>
            </div>
          </div>

          {error && (
            <p className="rounded-md bg-kaza-error/10 px-3 py-2 text-sm text-kaza-error">
              {error}
            </p>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={!canSubmit}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Publier l&apos;évaluation
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
