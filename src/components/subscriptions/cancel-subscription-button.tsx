"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

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
import { toast } from "@/components/ui/toast-helper";
import { cancelSubscription } from "@/actions/subscriptions";

interface CancelSubscriptionButtonProps {
  subscriptionId: string;
  className?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  label?: string;
}

export function CancelSubscriptionButton({
  subscriptionId,
  className,
  variant = "outline",
  label = "Résilier l'abonnement",
}: CancelSubscriptionButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await cancelSubscription(subscriptionId);
      if (result.success) {
        toast.success("Votre abonnement a été résilié.");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Impossible de résilier l'abonnement.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant={variant} className={className}>
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmer la résiliation ?</DialogTitle>
          <DialogDescription>
            Votre abonnement sera annulé immédiatement. Vous pourrez vous
            réabonner à tout moment.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Garder mon plan
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Résiliation...
              </>
            ) : (
              "Confirmer la résiliation"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
