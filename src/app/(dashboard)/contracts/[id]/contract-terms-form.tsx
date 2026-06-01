"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast-helper";
import { setContractTerms } from "@/actions/contracts";

export function ContractTermsForm({
  rentalId,
  initialCharges,
  initialDeposit,
}: {
  rentalId: string;
  initialCharges: number;
  initialDeposit: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [charges, setCharges] = useState(String(initialCharges ?? 0));
  const [deposit, setDeposit] = useState(String(initialDeposit ?? 0));

  const save = () => {
    startTransition(async () => {
      const res = await setContractTerms({
        rentalId,
        monthlyCharges: Number(charges),
        securityDeposit: Number(deposit),
      });
      if (res.success) {
        toast.success("Conditions du bail enregistrées.");
        router.refresh();
      } else {
        toast.error(res.error ?? "Échec.");
      }
    });
  };

  return (
    <div className="space-y-2 rounded-lg border border-border/70 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Compléter le bail
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="ct-charges" className="text-xs">
            Charges /mois (FCFA)
          </Label>
          <Input
            id="ct-charges"
            type="number"
            min={0}
            value={charges}
            onChange={(e) => setCharges(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ct-deposit" className="text-xs">
            Dépôt de garantie (FCFA)
          </Label>
          <Input
            id="ct-deposit"
            type="number"
            min={0}
            value={deposit}
            onChange={(e) => setDeposit(e.target.value)}
            className="h-9"
          />
        </div>
      </div>
      <Button
        onClick={save}
        disabled={isPending}
        variant="outline"
        size="sm"
        className="w-full gap-1.5"
      >
        {isPending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Save className="size-3.5" />
        )}
        Enregistrer les conditions
      </Button>
    </div>
  );
}
