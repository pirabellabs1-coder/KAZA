// =============================================================================
// Kaabo — Dialog : demande de retrait (client)
// =============================================================================

"use client";

import { useMemo, useState, useTransition } from "react";
import { Landmark, Smartphone, Banknote } from "lucide-react";

import { requestWithdrawal } from "@/actions/wallet";
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

const FEE_RATE = 0.01;
const MIN_WITHDRAWAL = 5000;

type Method = "BANK_TRANSFER" | "MOBILE_MONEY" | "CASH";

const methodOptions: {
  value: Method;
  label: string;
  description: string;
  icon: typeof Landmark;
  placeholder: string;
}[] = [
  {
    value: "BANK_TRANSFER",
    label: "Virement bancaire",
    description: "Sous 48-72h ouvrées",
    icon: Landmark,
    placeholder: "Ex : BJ66 BJ06 1010 0100 1234 5678 90",
  },
  {
    value: "MOBILE_MONEY",
    label: "Mobile Money",
    description: "Sous 24h (MTN, Moov, Wave)",
    icon: Smartphone,
    placeholder: "Ex : +229 97 12 34 56 (MTN)",
  },
  {
    value: "CASH",
    label: "Espèces (agence Kaabo)",
    description: "Récupération en agence Cotonou",
    icon: Banknote,
    placeholder: "Ex : Agence Cotonou Cadjèhoun",
  },
];

interface RequestWithdrawalDialogProps {
  availableBalance: number;
  isFrozen: boolean;
  triggerLabel?: string;
  triggerClassName?: string;
}

function formatFcfa(n: number) {
  return `${n.toLocaleString("fr-FR")} FCFA`;
}

export function RequestWithdrawalDialog({
  availableBalance,
  isFrozen,
  triggerLabel = "Demander un retrait",
  triggerClassName,
}: RequestWithdrawalDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState<Method>("BANK_TRANSFER");
  const [destination, setDestination] = useState("");
  const [pending, startTransition] = useTransition();

  const amountNum = Number(amount.replace(/\s/g, "")) || 0;
  const fee = Math.round(amountNum * FEE_RATE);
  const net = Math.max(0, amountNum - fee);

  const error = useMemo(() => {
    if (amountNum > 0 && amountNum < MIN_WITHDRAWAL) {
      return `Montant minimum : ${formatFcfa(MIN_WITHDRAWAL)}`;
    }
    if (amountNum > availableBalance) {
      return `Solde insuffisant. Disponible : ${formatFcfa(availableBalance)}`;
    }
    return null;
  }, [amountNum, availableBalance]);

  const canSubmit =
    !pending &&
    amountNum >= MIN_WITHDRAWAL &&
    amountNum <= availableBalance &&
    destination.trim().length >= 5;

  const handleSubmit = () => {
    if (!canSubmit) return;
    startTransition(async () => {
      const res = await requestWithdrawal({
        amount: amountNum,
        method,
        destination: destination.trim(),
      });
      if (res.success) {
        toast.success(
          `Demande de retrait de ${formatFcfa(amountNum)} envoyée. Vous recevrez ${formatFcfa(net)}.`,
        );
        setOpen(false);
        setAmount("");
        setDestination("");
      } else {
        toast.error(res.error ?? "Erreur lors de la demande");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          disabled={isFrozen || availableBalance < MIN_WITHDRAWAL}
          className={cn(
            "bg-white text-kaza-navy hover:bg-white/90",
            triggerClassName,
          )}
        >
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="font-heading">Demander un retrait</DialogTitle>
          <DialogDescription>
            Solde disponible :{" "}
            <span className="font-semibold text-kaza-navy">
              {formatFcfa(availableBalance)}
            </span>{" "}
            · Commission Kaabo : 1%
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          {/* Méthode */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold">Méthode</Label>
            <div className="grid gap-2">
              {methodOptions.map((opt) => {
                const Icon = opt.icon;
                const active = method === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMethod(opt.value)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors",
                      active
                        ? "border-kaza-navy bg-kaza-navy/5"
                        : "border-border hover:border-kaza-navy/30",
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-9 items-center justify-center rounded-lg",
                        active
                          ? "bg-kaza-navy text-white"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        {opt.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {opt.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Montant */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="withdrawal-amount" className="text-sm font-semibold">
              Montant à retirer (FCFA)
            </Label>
            <Input
              id="withdrawal-amount"
              type="number"
              inputMode="numeric"
              min={MIN_WITHDRAWAL}
              max={availableBalance}
              step={1000}
              placeholder={String(MIN_WITHDRAWAL)}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {error && (
              <p className="text-xs font-medium text-kaza-error">{error}</p>
            )}
          </div>

          {/* Destination */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="withdrawal-destination"
              className="text-sm font-semibold"
            >
              Destination
            </Label>
            <Input
              id="withdrawal-destination"
              placeholder={
                methodOptions.find((o) => o.value === method)?.placeholder ?? ""
              }
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              {method === "BANK_TRANSFER" && "Saisissez votre IBAN complet."}
              {method === "MOBILE_MONEY" &&
                "Numéro Mobile Money avec opérateur entre parenthèses."}
              {method === "CASH" &&
                "Indiquez l'agence Kaabo où récupérer les fonds."}
            </p>
          </div>

          {/* Récap fee + net */}
          {amountNum > 0 && (
            <div className="rounded-2xl border border-kaza-navy/15 bg-kaza-navy/5 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Montant brut</span>
                <span className="font-mono font-semibold">
                  {formatFcfa(amountNum)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Commission Kaabo (1%)
                </span>
                <span className="font-mono text-kaza-error">
                  - {formatFcfa(fee)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-kaza-navy/10 pt-2 text-base">
                <span className="font-semibold text-kaza-navy">
                  Vous recevrez
                </span>
                <span className="font-mono text-lg font-bold text-kaza-green">
                  {formatFcfa(net)}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="bg-kaza-navy text-white hover:bg-kaza-navy/90"
          >
            {pending ? "Envoi..." : "Confirmer la demande"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
