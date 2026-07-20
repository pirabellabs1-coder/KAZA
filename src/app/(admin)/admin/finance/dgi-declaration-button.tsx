"use client";

import { useState } from "react";
import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast-helper";

// =============================================================================
// Kaabo — Déclaration TVA (DGI Bénin) — brouillon imprimable
// =============================================================================

interface DgiDeclarationButtonProps {
  periodLabel: string;
  grossRevenueLabel: string;
  tvaRateLabel: string;
  tvaAmountLabel: string;
}

export function DgiDeclarationButton({
  periodLabel,
  grossRevenueLabel,
  tvaRateLabel,
  tvaAmountLabel,
}: DgiDeclarationButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        size="sm"
        className="mt-2 bg-purple-600 hover:bg-purple-700"
        onClick={() => setOpen(true)}
      >
        <FileText className="mr-1 h-3.5 w-3.5" />
        Déclaration DGI Bénin
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Déclaration TVA — DGI Bénin</DialogTitle>
            <DialogDescription>
              Brouillon de déclaration pour la période {periodLabel}.
            </DialogDescription>
          </DialogHeader>
          <div
            id="dgi-declaration"
            className="space-y-3 rounded-xl border bg-white p-4 text-sm"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-heading text-lg font-bold text-kaza-navy">
                Kaabo
              </span>
              <span className="text-xs text-muted-foreground">
                Déclaration TVA
              </span>
            </div>
            <Row label="Période" value={periodLabel} />
            <Row label="Chiffre d'affaires brut" value={grossRevenueLabel} />
            <Row label="Taux de TVA" value={tvaRateLabel} />
            <Row label="TVA à reverser" value={tvaAmountLabel} strong />
            <p className="pt-2 text-[11px] leading-relaxed text-muted-foreground">
              Document indicatif généré par Kaabo. À vérifier et compléter avec
              votre comptable avant dépôt auprès de la DGI (échéance : 15 du mois
              suivant).
            </p>
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => {
                toast.info(
                  "Choisissez « Enregistrer au format PDF » dans la boîte d'impression.",
                );
                setTimeout(() => window.print(), 300);
              }}
            >
              <FileText className="mr-1 size-4" />
              Imprimer / Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={
          strong ? "font-bold text-purple-700" : "font-medium text-kaza-navy"
        }
      >
        {value}
      </span>
    </div>
  );
}
