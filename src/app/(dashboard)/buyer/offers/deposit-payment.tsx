"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Smartphone, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast-helper";
import { formatPrice } from "@/lib/utils";

import {
  payOfferDepositFromWallet,
  initiateOfferDepositPayment,
} from "@/actions/property-offers";

export function DepositPaymentButton({
  offerId,
  deposit,
  walletBalance,
}: {
  offerId: string;
  deposit: number;
  walletBalance: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const canWallet = walletBalance >= deposit;

  const payWallet = () => {
    startTransition(async () => {
      const res = await payOfferDepositFromWallet(offerId);
      if (res.success) {
        toast.success("Acompte versé — le bien est réservé");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error ?? "Échec du paiement");
      }
    });
  };

  const payMomo = () => {
    startTransition(async () => {
      const res = await initiateOfferDepositPayment(offerId);
      if (res.success && res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else {
        toast.error(res.error ?? "Échec de l'initiation du paiement");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-kaza-green hover:bg-kaza-green/90">
          Payer l&apos;acompte
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verser l&apos;acompte de réservation</DialogTitle>
          <DialogDescription>
            Montant : <strong>{formatPrice(deposit)}</strong>. Ce versement
            réserve le bien à votre nom. La vente sera finalisée chez le notaire.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <button
            type="button"
            disabled={!canWallet || pending}
            onClick={payWallet}
            className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition hover:border-kaza-blue disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="flex size-10 items-center justify-center rounded-md bg-kaza-blue/10 text-kaza-blue">
              <Wallet className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">
                Solde KAZA ({formatPrice(walletBalance)})
              </span>
              <span className="block text-xs text-muted-foreground">
                {canWallet
                  ? "Paiement immédiat depuis votre portefeuille"
                  : "Solde insuffisant — rechargez ou utilisez Mobile Money"}
              </span>
            </span>
            {pending && <Loader2 className="size-4 animate-spin" />}
          </button>

          <button
            type="button"
            disabled={pending}
            onClick={payMomo}
            className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition hover:border-kaza-blue disabled:opacity-50"
          >
            <span className="flex size-10 items-center justify-center rounded-md bg-kaza-blue/10 text-kaza-blue">
              <Smartphone className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">Mobile Money</span>
              <span className="block text-xs text-muted-foreground">
                MTN, Moov et autres opérateurs — paiement sécurisé
              </span>
            </span>
            {pending && <Loader2 className="size-4 animate-spin" />}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
