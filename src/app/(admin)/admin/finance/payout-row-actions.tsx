"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// =============================================================================
// Kaabo — Actions d'une ligne de virement (admin finance)
// =============================================================================
// « Détail » : dialogue en lecture seule (sûr).
// « Renvoyer » / « Annuler » : désactivés tant que le moteur de décaissement
// automatique n'est pas branché (évite toute opération d'argent involontaire).
// =============================================================================

interface PayoutRowActionsProps {
  payout: {
    id: string;
    beneficiary: string;
    type: string;
    amountLabel: string;
    statusLabel: string;
    status: string;
    method: string;
    scheduledAt: string;
    paidAt?: string;
  };
}

export function PayoutRowActions({ payout }: PayoutRowActionsProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="h-7 px-2 text-xs"
        onClick={() => setOpen(true)}
      >
        Détail
      </Button>
      {payout.status === "FAILED" && (
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs"
          disabled
          title="Décaissement automatique bientôt disponible"
        >
          Renvoyer
        </Button>
      )}
      {payout.status === "SCHEDULED" && (
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs"
          disabled
          title="Décaissement automatique bientôt disponible"
        >
          Annuler
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Virement — {payout.beneficiary}</DialogTitle>
            <DialogDescription>Référence #{payout.id.slice(0, 8)}</DialogDescription>
          </DialogHeader>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Row label="Bénéficiaire" value={payout.beneficiary} />
            <Row label="Type" value={payout.type} />
            <Row label="Montant" value={payout.amountLabel} />
            <Row label="Statut" value={payout.statusLabel} />
            <Row label="Méthode" value={payout.method} />
            <Row
              label={payout.paidAt ? "Payé le" : "Prévu le"}
              value={payout.paidAt ?? payout.scheduledAt}
            />
          </dl>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium text-kaza-navy">{value}</dd>
    </div>
  );
}
