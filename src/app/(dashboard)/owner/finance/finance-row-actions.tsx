"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Download } from "lucide-react";

import { remindTenantRentPayment } from "@/actions/owner-rentals";
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
// Kaabo — Actions des lignes de la page Finances propriétaire
// =============================================================================

interface RentRowActionProps {
  paymentId: string;
  status: "RECEIVED" | "PENDING" | "LATE";
  tenant: string;
  property: string;
  amountLabel: string;
  dueDateLabel: string;
}

export function RentRowAction({
  paymentId,
  status,
  tenant,
  property,
  amountLabel,
  dueDateLabel,
}: RentRowActionProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [detailOpen, setDetailOpen] = useState(false);

  if (status === "RECEIVED") {
    return (
      <>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[11px]"
          onClick={() => setDetailOpen(true)}
        >
          Voir détail
        </Button>
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Loyer réglé</DialogTitle>
              <DialogDescription>{property}</DialogDescription>
            </DialogHeader>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <Field label="Locataire" value={tenant} />
              <Field label="Montant" value={amountLabel} />
              <Field label="Statut" value="Reçu" />
              <Field label="Échéance" value={dueDateLabel} />
            </dl>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  const relancer = () =>
    startTransition(async () => {
      const res = await remindTenantRentPayment(paymentId);
      if (!res.success) {
        toast.error(res.error ?? "Relance impossible.");
        return;
      }
      toast.success(`Relance envoyée à ${tenant}.`);
      router.refresh();
    });

  return (
    <Button
      size="sm"
      variant="outline"
      className="h-7 text-[11px]"
      onClick={relancer}
      disabled={pending}
    >
      {pending ? "Envoi…" : "Relancer"}
    </Button>
  );
}

interface PayoutReceiptButtonProps {
  reference: string;
  dateLabel: string;
  amountLabel: string;
  method: string;
  statusLabel: string;
}

export function PayoutReceiptButton({
  reference,
  dateLabel,
  amountLabel,
  method,
  statusLabel,
}: PayoutReceiptButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 text-[11px]"
        onClick={() => setOpen(true)}
      >
        <Download className="mr-1 size-3" />
        Téléchar.
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Justificatif de versement</DialogTitle>
            <DialogDescription>Réf. {reference}</DialogDescription>
          </DialogHeader>
          <div
            id="payout-receipt"
            className="space-y-2 rounded-xl border bg-white p-4 text-sm"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-heading text-lg font-bold text-kaza-navy">
                Kaabo
              </span>
              <span className="text-xs text-muted-foreground">
                Justificatif de versement
              </span>
            </div>
            <Field label="Référence" value={reference} />
            <Field label="Date" value={dateLabel} />
            <Field label="Montant" value={amountLabel} />
            <Field label="Méthode" value={method} />
            <Field label="Statut" value={statusLabel} />
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
              <Download className="mr-1 size-4" />
              Enregistrer / Imprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium text-kaza-navy">{value}</dd>
    </div>
  );
}
