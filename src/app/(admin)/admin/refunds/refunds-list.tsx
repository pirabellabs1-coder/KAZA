// =============================================================================
// KAZA - Admin / Liste des remboursements — client
// =============================================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Clock4, Receipt } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast-helper";
import { approveRefund, rejectRefund } from "@/actions/refunds";
import { cn, formatPrice } from "@/lib/utils";

export type RefundStatus = "pending" | "approved" | "rejected";

export interface RefundRequest {
  id: string;
  userName: string;
  userEmail: string;
  amount: number;
  reason: string;
  requestedAt: string;
  status: RefundStatus;
  decisionNote?: string | null;
}

const statusConfig: Record<
  RefundStatus,
  { label: string; classes: string; icon: typeof CheckCircle2 }
> = {
  pending: {
    label: "En attente",
    classes: "bg-orange-100 text-orange-700 border-orange-200",
    icon: Clock4,
  },
  approved: {
    label: "Approuvée",
    classes: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Refusée",
    classes: "bg-red-100 text-red-700 border-red-200",
    icon: XCircle,
  },
};

interface RefundsListProps {
  requests: RefundRequest[];
  adminEmail: string;
}

type DialogState =
  | { type: "approve"; request: RefundRequest }
  | { type: "reject"; request: RefundRequest }
  | null;

export function RefundsList({ requests }: RefundsListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [rejectReason, setRejectReason] = useState("");

  const filtered = requests.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    return true;
  });

  const closeDialog = () => {
    setDialog(null);
    setRejectReason("");
  };

  const handleConfirm = () => {
    if (!dialog) return;
    const request = dialog.request;

    if (dialog.type === "reject" && rejectReason.trim().length < 3) return;

    const isApprove = dialog.type === "approve";
    const note = rejectReason.trim();

    startTransition(async () => {
      const result = isApprove
        ? await approveRefund(request.id)
        : await rejectRefund(request.id, note);

      if (!result.success) {
        toast.error(result.error ?? "Impossible d'enregistrer la décision.");
        return;
      }

      if (isApprove) {
        toast.success(
          `Remboursement de ${formatPrice(request.amount)} approuvé pour ${request.userName}.`,
        );
      } else {
        toast.info(`Demande de remboursement #${request.id.slice(0, 8)} refusée.`);
      }

      closeDialog();
      router.refresh();
    });
  };

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {filtered.length} demande{filtered.length > 1 ? "s" : ""} affichée
          {filtered.length > 1 ? "s" : ""}
        </p>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="approved">Approuvée</SelectItem>
            <SelectItem value="rejected">Refusée</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-card py-12 text-center">
          <Receipt className="size-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">
            Aucune demande
          </p>
          <p className="text-xs text-muted-foreground">
            Aucune demande ne correspond à ces filtres.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((req) => {
            const config = statusConfig[req.status];
            const StatusIcon = config.icon;
            return (
              <article
                key={req.id}
                className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
              >
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="font-mono text-xs text-muted-foreground">
                      #{req.id.slice(0, 8)}
                    </span>
                    <p className="text-base font-semibold text-foreground">
                      {req.userName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {req.userEmail}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                      config.classes,
                    )}
                  >
                    <StatusIcon className="size-3" />
                    {config.label}
                  </span>
                </header>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Montant</p>
                    <p className="text-lg font-bold text-kaza-navy">
                      {formatPrice(req.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Demandée le
                    </p>
                    <p className="font-medium text-foreground">
                      {new Date(req.requestedAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Motif invoqué
                  </p>
                  <p className="mt-1 rounded-md bg-muted/50 p-3 text-sm italic text-foreground">
                    « {req.reason} »
                  </p>
                </div>

                {req.status !== "pending" && req.decisionNote && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Note de décision
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {req.decisionNote}
                    </p>
                  </div>
                )}

                {req.status === "pending" && (
                  <footer className="flex flex-wrap gap-2 border-t border-border pt-4">
                    <Button
                      size="sm"
                      className="bg-kaza-green hover:bg-kaza-green/90"
                      onClick={() =>
                        setDialog({ type: "approve", request: req })
                      }
                    >
                      <CheckCircle2 className="size-4" />
                      Approuver
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-kaza-error hover:bg-red-50 hover:text-kaza-error"
                      onClick={() => {
                        setRejectReason("");
                        setDialog({ type: "reject", request: req });
                      }}
                    >
                      <XCircle className="size-4" />
                      Refuser
                    </Button>
                  </footer>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Dialog approuver */}
      <Dialog
        open={dialog?.type === "approve"}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approuver le remboursement ?</DialogTitle>
            <DialogDescription>
              Les fonds escrow seront immédiatement libérés vers le compte de
              l&apos;utilisateur.
            </DialogDescription>
          </DialogHeader>
          {dialog?.type === "approve" && (
            <div className="rounded-lg bg-muted/50 p-4 text-sm">
              <p className="font-medium text-foreground">
                {dialog.request.userName}
              </p>
              <p className="text-xs text-muted-foreground">
                {dialog.request.userEmail}
              </p>
              <p className="mt-2 text-lg font-bold text-kaza-green">
                {formatPrice(dialog.request.amount)}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={isPending}>
              Annuler
            </Button>
            <Button
              className="bg-kaza-green hover:bg-kaza-green/90"
              onClick={handleConfirm}
              disabled={isPending}
            >
              {isPending ? "Traitement…" : "Approuver le remboursement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog refuser */}
      <Dialog
        open={dialog?.type === "reject"}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser le remboursement ?</DialogTitle>
            <DialogDescription>
              L&apos;utilisateur recevra votre motif par email.
            </DialogDescription>
          </DialogHeader>
          {dialog?.type === "reject" && (
            <div className="flex flex-col gap-3">
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <p className="font-medium">
                  {dialog.request.userName} —{" "}
                  {formatPrice(dialog.request.amount)}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="reject-reason">
                  Motif du refus <span className="text-kaza-error">*</span>
                </Label>
                <Textarea
                  id="reject-reason"
                  placeholder="Ex : remboursement non éligible selon les CGU, preuves insuffisantes..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={isPending}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={isPending || rejectReason.trim().length < 3}
            >
              {isPending ? "Traitement…" : "Refuser"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
