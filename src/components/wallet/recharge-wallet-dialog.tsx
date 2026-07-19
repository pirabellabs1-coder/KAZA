// =============================================================================
// KAZA — Dialog : recharge du wallet par Mobile Money (client)
// Paiement Mobile Money on-page (FeexPay) ; le solde est crédité par le webhook
// / le polling après confirmation du paiement (purpose = WALLET_TOPUP).
// =============================================================================

"use client";

import { useState } from "react";
import { Plus, Smartphone } from "lucide-react";

import { initiateWalletTopUp } from "@/actions/wallet";
import { MomoPaymentPanel } from "@/components/payments/momo-payment-panel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

  const amountNum = Number(amount.replace(/\s/g, "")) || 0;
  const error =
    amountNum > 0 && amountNum < MIN_TOPUP
      ? `Montant minimum : ${formatFcfa(MIN_TOPUP)}`
      : null;
  const amountReady = amountNum >= MIN_TOPUP;

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
            Choisissez votre opérateur puis validez le paiement directement sur
            votre téléphone. Votre solde sera mis à jour automatiquement.
          </div>

          {/* Paiement Mobile Money on-page (visible une fois le montant saisi) */}
          {amountReady ? (
            <MomoPaymentPanel
              amount={amountNum}
              submitLabel={`Recharger ${formatFcfa(amountNum)}`}
              initiate={(momo) => initiateWalletTopUp(amountNum, momo)}
              onSuccess={() => {
                toast.success("Recharge confirmée. Votre solde a été crédité.");
                setOpen(false);
                window.location.reload();
              }}
            />
          ) : (
            <p className="text-center text-xs text-muted-foreground">
              Saisissez un montant d&apos;au moins {formatFcfa(MIN_TOPUP)} pour
              continuer.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
