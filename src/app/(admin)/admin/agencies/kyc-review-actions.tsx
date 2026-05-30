"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileCheck2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast-helper";
import { setAgencyStatus, setAgencyVerified } from "@/actions/admin";

/**
 * Actions de revue KYC pour une agence en attente (section "KYC en attente").
 *  - "Approuver tout" → vérifie l'agence (is_verified=true, statut APPROVED).
 *  - "Rejeter" → ouvre un dialog de motif puis suspend l'agence (REJECTED).
 */
export function KycReviewActions({
  agencyId,
  agencyName,
}: {
  agencyId: string;
  agencyName: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");

  const handleApprove = () => {
    startTransition(async () => {
      const result = await setAgencyVerified(agencyId, true);
      if (result.success) {
        toast.success(`KYC de ${agencyName} approuvé. Agence vérifiée.`);
        router.refresh();
      } else {
        toast.error(result.error ?? "Action impossible.");
      }
    });
  };

  const handleReject = () => {
    const trimmed = reason.trim();
    if (trimmed.length < 10) {
      toast.error("Le motif doit comporter au moins 10 caractères.");
      return;
    }
    startTransition(async () => {
      const result = await setAgencyStatus(agencyId, "SUSPEND", trimmed);
      if (result.success) {
        toast.success(`Dossier KYC de ${agencyName} rejeté.`);
        setRejectOpen(false);
        setReason("");
        router.refresh();
      } else {
        toast.error(result.error ?? "Action impossible.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-2 lg:items-end">
      <Button
        className="bg-kaza-green hover:bg-kaza-green/90"
        onClick={handleApprove}
        disabled={isPending}
      >
        <FileCheck2 className="size-4" /> Approuver tout
      </Button>
      <Button
        variant="outline"
        className="border-red-300 text-red-700 hover:bg-red-50"
        onClick={() => setRejectOpen(true)}
        disabled={isPending}
      >
        <XCircle className="size-4" /> Rejeter
      </Button>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rejeter le dossier KYC</DialogTitle>
            <DialogDescription>
              {agencyName} sera suspendue. Indiquez le motif communiqué à
              l’agence.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="kyc-reject-reason">Motif du rejet</Label>
            <Textarea
              id="kyc-reject-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex : documents RCCM illisibles, IFU non concordant…"
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectOpen(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={handleReject}
              disabled={isPending}
            >
              <XCircle className="size-4" /> Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
