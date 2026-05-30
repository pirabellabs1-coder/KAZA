"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, BellRing, Loader2 } from "lucide-react";

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

import { terminateRental, remindLatePayment } from "@/actions/agency-rentals";

export function TerminateRentalButton({
  rentalId,
  disabled,
}: {
  rentalId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handle = () => {
    startTransition(async () => {
      const res = await terminateRental(rentalId);
      if (res.success) {
        toast.success("Bail résilié");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error ?? "Échec");
      }
    });
  };

  if (disabled) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 text-rose-600 hover:text-rose-700">
          <Ban className="size-4" /> Résilier le bail
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Résilier ce bail ?</DialogTitle>
          <DialogDescription>
            Le bail passera au statut « Résilié » avec la date du jour comme date
            de fin. Cette action met fin à la location en cours.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
            Annuler
          </Button>
          <Button
            onClick={handle}
            disabled={isPending}
            className="gap-2 bg-rose-600 text-white hover:bg-rose-700"
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Confirmer la résiliation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RemindPaymentButton({ paymentId }: { paymentId: string }) {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  const handle = () => {
    startTransition(async () => {
      const res = await remindLatePayment(paymentId);
      if (res.success) {
        setSent(true);
        toast.success("Relance envoyée (email + SMS)");
      } else {
        toast.error(res.error ?? "Échec de la relance");
      }
    });
  };

  return (
    <Button
      size="sm"
      variant="outline"
      className="gap-1.5"
      onClick={handle}
      disabled={isPending || sent}
    >
      {isPending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <BellRing className="size-3.5" />
      )}
      {sent ? "Relancé" : "Relancer"}
    </Button>
  );
}
