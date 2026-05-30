"use client";

// =============================================================================
// KAZA — Admin / Édition des tarifs d'un plan (mensuel + annuel)
//
// Composant client : champs prix éditables, appel à `updatePlan`, puis
// `router.refresh()` + toast. Le prix annuel n'est affiché que pour les plans
// qui en disposent (PLUS_YEARLY).
// =============================================================================

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";

import { updatePlan } from "@/actions/plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast-helper";

interface PlanEditRowProps {
  planKey: string;
  name: string;
  priceMonthly: number;
  priceYearly: number | null;
  /** Si vrai, on expose un champ prix annuel (sinon mensuel seul). */
  hasYearly: boolean;
}

export function PlanEditRow({
  planKey,
  name,
  priceMonthly,
  priceYearly,
  hasYearly,
}: PlanEditRowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [monthly, setMonthly] = useState(String(priceMonthly));
  const [yearly, setYearly] = useState(
    priceYearly === null ? "" : String(priceYearly),
  );

  const monthlyNum = Number(monthly);
  const yearlyNum = yearly.trim() === "" ? null : Number(yearly);

  const isDirty =
    monthlyNum !== priceMonthly || yearlyNum !== (priceYearly ?? null);

  const isInvalid =
    !Number.isFinite(monthlyNum) ||
    monthlyNum < 0 ||
    (yearlyNum !== null && (!Number.isFinite(yearlyNum) || yearlyNum < 0));

  function handleSave() {
    if (isInvalid) {
      toast.error("Veuillez saisir des montants valides.");
      return;
    }
    startTransition(async () => {
      const result = await updatePlan({
        key: planKey,
        priceMonthly: monthlyNum,
        ...(hasYearly ? { priceYearly: yearlyNum } : {}),
      });
      if (result.success) {
        toast.success(`Tarifs de « ${name} » mis à jour.`);
        router.refresh();
      } else {
        toast.error(result.error ?? "Impossible de mettre à jour le plan.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="grid flex-1 gap-2">
        <Label htmlFor={`${planKey}-monthly`} className="text-xs">
          Prix mensuel (FCFA)
        </Label>
        <Input
          id={`${planKey}-monthly`}
          type="number"
          min={0}
          step={100}
          inputMode="numeric"
          value={monthly}
          onChange={(e) => setMonthly(e.target.value)}
          disabled={isPending}
        />
      </div>

      {hasYearly && (
        <div className="grid flex-1 gap-2">
          <Label htmlFor={`${planKey}-yearly`} className="text-xs">
            Prix annuel (FCFA)
          </Label>
          <Input
            id={`${planKey}-yearly`}
            type="number"
            min={0}
            step={1000}
            inputMode="numeric"
            placeholder="—"
            value={yearly}
            onChange={(e) => setYearly(e.target.value)}
            disabled={isPending}
          />
        </div>
      )}

      <Button
        type="button"
        onClick={handleSave}
        disabled={isPending || isInvalid || !isDirty}
        className="bg-kaza-navy text-white hover:bg-kaza-navy/90 sm:w-auto"
      >
        <Save className="mr-2 size-4" />
        {isPending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </div>
  );
}
