// =============================================================================
// KAZA — Dialog : RIB / Mobile Money (client)
// =============================================================================

"use client";

import { useState, useTransition } from "react";

import { updateBankDetails } from "@/actions/wallet";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast-helper";
import { cn } from "@/lib/utils";

interface BankDetailsDialogProps {
  initialIban?: string | null;
  initialBankName?: string | null;
  initialMobileMoneyNumber?: string | null;
  initialMobileMoneyProvider?: string | null;
  triggerLabel?: string;
  triggerClassName?: string;
  triggerVariant?: "default" | "outline" | "ghost" | "secondary";
}

const PROVIDERS = ["MTN", "Moov", "Wave", "Orange Money"] as const;

export function BankDetailsDialog({
  initialIban,
  initialBankName,
  initialMobileMoneyNumber,
  initialMobileMoneyProvider,
  triggerLabel = "Modifier mes coordonnées",
  triggerClassName,
  triggerVariant = "outline",
}: BankDetailsDialogProps) {
  const [open, setOpen] = useState(false);
  const [iban, setIban] = useState(initialIban ?? "");
  const [bankName, setBankName] = useState(initialBankName ?? "");
  const [mmNumber, setMmNumber] = useState(initialMobileMoneyNumber ?? "");
  const [mmProvider, setMmProvider] = useState(
    initialMobileMoneyProvider ?? "",
  );
  const [pending, startTransition] = useTransition();

  const handleSubmit = () => {
    startTransition(async () => {
      const res = await updateBankDetails({
        iban: iban.trim() || undefined,
        bankName: bankName.trim() || undefined,
        mobileMoneyNumber: mmNumber.trim() || undefined,
        mobileMoneyProvider: mmProvider.trim() || undefined,
      });
      if (res.success) {
        toast.success("Coordonnées mises à jour.");
        setOpen(false);
      } else {
        toast.error(res.error ?? "Erreur lors de l'enregistrement");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={triggerVariant}
          className={cn(triggerClassName)}
        >
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="font-heading">
            Coordonnées de paiement
          </DialogTitle>
          <DialogDescription>
            Renseignez au moins une méthode pour pouvoir recevoir vos retraits.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          {/* RIB bancaire */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-kaza-navy">
              Compte bancaire
            </h4>
            <div className="flex flex-col gap-2">
              <Label htmlFor="bank-name" className="text-sm">
                Nom de la banque
              </Label>
              <Input
                id="bank-name"
                placeholder="Ex : Ecobank Bénin"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="iban" className="text-sm">
                IBAN
              </Label>
              <Input
                id="iban"
                placeholder="BJ66 BJ06 1010 0100 1234 5678 90"
                value={iban}
                onChange={(e) => setIban(e.target.value.toUpperCase())}
              />
              <p className="text-[11px] text-muted-foreground">
                Vos coordonnées sont chiffrées et ne sont jamais partagées.
              </p>
            </div>
          </div>

          <Separator />

          {/* Mobile Money */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-kaza-navy">
              Mobile Money
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="mm-provider" className="text-sm">
                  Opérateur
                </Label>
                <Select value={mmProvider} onValueChange={setMmProvider}>
                  <SelectTrigger id="mm-provider">
                    <SelectValue placeholder="Choisir" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="mm-number" className="text-sm">
                  Numéro
                </Label>
                <Input
                  id="mm-number"
                  inputMode="tel"
                  placeholder="+229 97 12 34 56"
                  value={mmNumber}
                  onChange={(e) => setMmNumber(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={pending}
            className="bg-kaza-navy text-white hover:bg-kaza-navy/90"
          >
            {pending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
