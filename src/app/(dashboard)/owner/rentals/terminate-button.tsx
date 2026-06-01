"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, Loader2 } from "lucide-react";

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

import { terminateOwnerRental } from "@/actions/owner-rentals";

export function OwnerTerminateRentalButton({ rentalId }: { rentalId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handle = () => {
    startTransition(async () => {
      const res = await terminateOwnerRental(rentalId);
      if (res.success) {
        toast.success("Bail résilié — le bien est de nouveau disponible");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error ?? "Échec de la résiliation");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 text-rose-600 hover:text-rose-700"
        >
          <Ban className="size-4" /> Résilier le bail
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Résilier ce bail ?</DialogTitle>
          <DialogDescription>
            Le bail passera au statut « Résilié » (date de fin : aujourd&apos;hui)
            et votre bien redeviendra disponible à la location. Le locataire en
            est informé par email. Cette action est définitive.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
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
