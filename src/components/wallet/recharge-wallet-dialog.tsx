// =============================================================================
// KAZA — Dialog : recharge du wallet par Mobile Money (client)
// Initialise un checkout GeniusPay ; le solde est crédité par le webhook
// après confirmation du paiement (purpose = WALLET_TOPUP).
// =============================================================================

"use client";

import { useState, useTransition } from "react";
import { Plus, Loader2, Smartphone } from "lucide-react";

import { initiateWalletTopUp } from "@/actions/wallet";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast-helper";
import { cn } from "@/lib/utils";

const MIN_TOPUP = 500;
const QUICK_AMOUNTS = [2000, 5000, 10000, 25000, 50000];

function formatFcfa(n: number) {
  return `${n.toLocaleString("fr-FR")} FCFA`;
}

interface RechargeWalletDialogProps {
  triggerLabel?: string;
  triggerClassName?: string;
}

export function RechargeWalletDialog({
  triggerLabel = "Recharger",
  triggerClassName,
}: RechargeWalletDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [pending, startTransition] = useTransition();

  const amountNum = Number(amount.replace(/\s/g, "")) || 0;
  const error =
    amountNum > 0 && amountNum < MIN_TOPUP
      ? `Montant minimum : ${formatFcfa(MIN_TOPUP)}`
      : null;
  const canSubmit = !pending && amountNum >= MIN_TOPUP;

  const handleSubmit = () => {
    if (!canSubmit) return;
    startTransition(async () => {
      const res = await initiateWalletTopUp(amountNum);
      if (res.success && res.checkoutUrl) {
        toast.info("Redirection vers le paiement Mobile Money…");
        window.location.href = res.checkoutUrl;
        return;
      }
      toast.error(res.error ?? "Impossible d'initier la recharge.");
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className={cn(
            "gap-2 bg-white text-kaza-navy hover:bg-white/90",
            triggerClassName,
          )}
        >
          <Plus className="size-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-heading">
            Recharger mon wallet
          </DialogTitle>
          <DialogDescription>
            Ajoutez des fonds via Mobile Money (MTN, Moov, Wave) ou carte. Le
            solde est crédité dès la confirmation du paiement.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          {/* Montants rapides */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold">Montant</Label>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_AMOUNTS.map((q) => {
                const active = amountNum === q;
                return (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setAmount(String(q))}
                    className={cn(
                      "rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-colors",
                      active
                        ? "border-kaza-navy bg-kaza-navy/5 text-kaza-navy"
                        : "border-border text-muted-foreground hover:border-kaza-navy/30",
                    )}
                  >
                    {q.toLocaleString("fr-FR")}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Montant personnalisé */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="topup-amount" className="text-sm font-semibold">
              Ou montant personnalisé (FCFA)
            </Label>
            <Input
              id="topup-amount"
              type="number"
              inputMode="numeric"
              min={MIN_TOPUP}
              step={500}
              placeholder={String(MIN_TOPUP)}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {error && (
              <p className="text-xs font-medium text-kaza-error">{error}</p>
            )}
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-kaza-blue/20 bg-kaza-blue/5 p-3 text-xs text-muted-foreground">
            <Smartphone className="size-4 shrink-0 text-kaza-blue" />
            Vous serez redirigé vers la page de paiement sécurisée. Une fois le
            paiement confirmé, votre solde sera mis à jour automatiquement.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="gap-2 bg-kaza-navy text-white hover:bg-kaza-navy/90"
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            {amountNum >= MIN_TOPUP
              ? `Recharger ${formatFcfa(amountNum)}`
              : "Recharger"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
