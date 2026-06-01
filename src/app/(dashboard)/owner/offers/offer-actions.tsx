"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X, BadgeCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast-helper";

import { decideOffer, markPropertySold } from "@/actions/property-offers";

export function OfferDecisionButtons({ offerId }: { offerId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const decide = (decision: "ACCEPTED" | "REJECTED") => {
    startTransition(async () => {
      const res = await decideOffer(offerId, decision);
      if (res.success) {
        toast.success(
          decision === "ACCEPTED" ? "Offre acceptée" : "Offre refusée",
        );
        router.refresh();
      } else {
        toast.error(res.error ?? "Échec");
      }
    });
  };

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        className="gap-1.5 bg-kaza-green hover:bg-kaza-green/90"
        disabled={isPending}
        onClick={() => decide("ACCEPTED")}
      >
        {isPending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Check className="size-3.5" />
        )}
        Accepter
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5 text-rose-600 hover:text-rose-700"
        disabled={isPending}
        onClick={() => decide("REJECTED")}
      >
        <X className="size-3.5" />
        Refuser
      </Button>
    </div>
  );
}

export function MarkSoldButton({ offerId }: { offerId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handle = () => {
    startTransition(async () => {
      const res = await markPropertySold(offerId);
      if (res.success) {
        toast.success("Bien marqué comme vendu");
        router.refresh();
      } else {
        toast.error(res.error ?? "Échec");
      }
    });
  };

  return (
    <Button
      size="sm"
      className="gap-1.5 bg-kaza-navy hover:bg-kaza-navy/90"
      disabled={isPending}
      onClick={handle}
    >
      {isPending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <BadgeCheck className="size-3.5" />
      )}
      Marquer comme vendu
    </Button>
  );
}
