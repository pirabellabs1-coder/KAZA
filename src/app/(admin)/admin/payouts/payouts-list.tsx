// =============================================================================
// KAZA — Admin / Liste des demandes de retrait (client)
// =============================================================================

"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Building2,
  CheckCircle2,
  Clock4,
  Landmark,
  Receipt,
  Smartphone,
  XCircle,
} from "lucide-react";

import { approveWithdrawal, rejectWithdrawal } from "@/actions/wallet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast-helper";
import type { AdminWithdrawalRequest } from "@/lib/queries/wallet";
import { cn } from "@/lib/utils";

interface PayoutsListProps {
  requests: AdminWithdrawalRequest[];
}

const TAB_ORDER = ["PENDING", "APPROVED", "COMPLETED", "REJECTED"] as const;
type TabKey = (typeof TAB_ORDER)[number];

const STATUS_META: Record<
  string,
  { label: string; className: string; icon: typeof Clock4 }
> = {
  PENDING: {
    label: "En attente",
    className: "bg-amber-100 text-amber-700",
    icon: Clock4,
  },
  APPROVED: {
    label: "Approuvée",
    className: "bg-blue-100 text-blue-700",
    icon: CheckCircle2,
  },
  PROCESSING: {
    label: "En traitement",
    className: "bg-blue-100 text-blue-700",
    icon: Clock4,
  },
  COMPLETED: {
    label: "Payée",
    className: "bg-emerald-100 text-emerald-700",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "Refusée",
    className: "bg-red-100 text-red-700",
    icon: XCircle,
  },
  CANCELLED: {
    label: "Annulée",
    className: "bg-slate-100 text-slate-700",
    icon: XCircle,
  },
};

const METHOD_META: Record<
  string,
  { label: string; icon: typeof Landmark }
> = {
  BANK_TRANSFER: { label: "Virement bancaire", icon: Landmark },
  MOBILE_MONEY: { label: "Mobile Money", icon: Smartphone },
  CASH: { label: "Espèces", icon: Building2 },
};

function formatFcfa(n: number) {
  return `${Math.abs(n).toLocaleString("fr-FR")} FCFA`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type DialogState =
  | { type: "approve"; request: AdminWithdrawalRequest }
  | { type: "reject"; request: AdminWithdrawalRequest }
  | null;

export function PayoutsList({ requests }: PayoutsListProps) {
  const [tab, setTab] = useState<TabKey>("PENDING");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [reference, setReference] = useState("");
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  // Stats
  const stats = useMemo(() => {
    const pendings = requests.filter((r) => r.status === "PENDING");
    const totalPending = pendings.reduce((s, r) => s + r.netAmount, 0);
    const now = new Date();
    const completedThisMonth = requests.filter((r) => {
      if (r.status !== "COMPLETED") return false;
      if (!r.processedAt) return false;
      const d = new Date(r.processedAt);
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    });
    const totalCompletedMonth = completedThisMonth.reduce(
      (s, r) => s + r.netAmount,
      0,
    );
    return {
      pendingCount: pendings.length,
      totalPending,
      processedMonthCount: completedThisMonth.length,
      totalProcessedMonth: totalCompletedMonth,
    };
  }, [requests]);

  const grouped = useMemo(() => {
    const m: Record<TabKey, AdminWithdrawalRequest[]> = {
      PENDING: [],
      APPROVED: [],
      COMPLETED: [],
      REJECTED: [],
    };
    for (const r of requests) {
      const s = r.status as TabKey;
      if (m[s]) m[s].push(r);
      // PROCESSING → APPROVED bucket
      if (r.status === "PROCESSING") m.APPROVED.push(r);
      // CANCELLED → REJECTED bucket
      if (r.status === "CANCELLED") m.REJECTED.push(r);
    }
    return m;
  }, [requests]);

  const handleApprove = () => {
    if (!dialog || dialog.type !== "approve") return;
    const req = dialog.request;
    startTransition(async () => {
      const res = await approveWithdrawal(req.id, reference.trim() || undefined);
      if (res.success) {
        toast.success(
          `Demande de ${req.userName} (${formatFcfa(req.netAmount)}) marquée comme payée.`,
        );
        setDialog(null);
        setReference("");
      } else {
        toast.error(res.error ?? "Erreur lors de l'approbation");
      }
    });
  };

  const handleReject = () => {
    if (!dialog || dialog.type !== "reject") return;
    if (reason.trim().length < 3) return;
    const req = dialog.request;
    startTransition(async () => {
      const res = await rejectWithdrawal(req.id, reason.trim());
      if (res.success) {
        toast.info(
          `Demande de ${req.userName} refusée. Montant restitué au wallet.`,
        );
        setDialog(null);
        setReason("");
      } else {
        toast.error(res.error ?? "Erreur lors du refus");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Demandes en attente
            </p>
            <p className="mt-1 font-heading text-2xl font-bold text-kaza-navy">
              {stats.pendingCount}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-amber-200 bg-amber-50/50 shadow-sm">
          <CardContent className="p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-amber-700">
              Montant net à payer
            </p>
            <p className="mt-1 font-heading text-2xl font-bold text-amber-900">
              {formatFcfa(stats.totalPending)}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-emerald-200 bg-emerald-50/50 shadow-sm">
          <CardContent className="p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-700">
              Traité ce mois ({stats.processedMonthCount})
            </p>
            <p className="mt-1 font-heading text-2xl font-bold text-emerald-900">
              {formatFcfa(stats.totalProcessedMonth)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <TabsList className="grid w-full grid-cols-4 sm:w-auto sm:inline-flex">
          {TAB_ORDER.map((t) => (
            <TabsTrigger key={t} value={t} className="text-xs">
              {STATUS_META[t].label} ({grouped[t].length})
            </TabsTrigger>
          ))}
        </TabsList>

        {TAB_ORDER.map((t) => (
          <TabsContent key={t} value={t} className="mt-4">
            <PayoutTable
              requests={grouped[t]}
              onApprove={(r) => {
                setReference("");
                setDialog({ type: "approve", request: r });
              }}
              onReject={(r) => {
                setReason("");
                setDialog({ type: "reject", request: r });
              }}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Dialog approuver */}
      <Dialog
        open={dialog?.type === "approve"}
        onOpenChange={(o) => {
          if (!o) {
            setDialog(null);
            setReference("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marquer comme payée</DialogTitle>
            <DialogDescription>
              Confirmez que le virement a bien été effectué hors plateforme.
              Le montant a déjà été décompté du wallet lors de la demande.
            </DialogDescription>
          </DialogHeader>
          {dialog?.type === "approve" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4 text-sm">
                <p className="font-medium">{dialog.request.userName}</p>
                <p className="text-xs text-muted-foreground">
                  {dialog.request.userEmail}
                </p>
                <p className="mt-2 text-lg font-bold text-kaza-green">
                  {formatFcfa(dialog.request.netAmount)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {METHOD_META[dialog.request.method]?.label ?? dialog.request.method}{" "}
                  → {dialog.request.destination}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ref">Référence du virement (optionnel)</Label>
                <Input
                  id="ref"
                  placeholder="Ex : ECOBANK-2026-05-28-001"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Annuler
            </Button>
            <Button
              onClick={handleApprove}
              disabled={pending}
              className="bg-kaza-green hover:bg-kaza-green/90"
            >
              {pending ? "Traitement..." : "Confirmer le paiement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog refuser */}
      <Dialog
        open={dialog?.type === "reject"}
        onOpenChange={(o) => {
          if (!o) {
            setDialog(null);
            setReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser la demande</DialogTitle>
            <DialogDescription>
              Le montant sera restitué au wallet de l&apos;utilisateur.
            </DialogDescription>
          </DialogHeader>
          {dialog?.type === "reject" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <p className="font-medium">
                  {dialog.request.userName} —{" "}
                  {formatFcfa(dialog.request.amount)}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="reason">
                  Motif du refus <span className="text-kaza-error">*</span>
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Ex : Coordonnées bancaires invalides, vérification KYC incomplète..."
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={pending || reason.trim().length < 3}
            >
              {pending ? "Traitement..." : "Refuser"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PayoutTable({
  requests,
  onApprove,
  onReject,
}: {
  requests: AdminWithdrawalRequest[];
  onApprove: (r: AdminWithdrawalRequest) => void;
  onReject: (r: AdminWithdrawalRequest) => void;
}) {
  if (requests.length === 0) {
    return (
      <Card className="rounded-2xl border-dashed shadow-sm">
        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <Receipt className="size-10 text-muted-foreground/40" />
          <p className="text-sm font-medium">Aucune demande</p>
          <p className="text-xs text-muted-foreground">
            Rien à traiter dans cette catégorie pour l&apos;instant.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Utilisateur</th>
                <th className="px-4 py-3 font-medium">Méthode</th>
                <th className="px-4 py-3 font-medium">Destination</th>
                <th className="px-4 py-3 text-right font-medium">Brut</th>
                <th className="px-4 py-3 text-right font-medium">Fee</th>
                <th className="px-4 py-3 text-right font-medium">Net</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {requests.map((r) => {
                const status =
                  STATUS_META[r.status] ?? STATUS_META.PENDING;
                const method = METHOD_META[r.method];
                const StatusIcon = status.icon;
                const MethodIcon = method?.icon ?? Receipt;
                return (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">
                        {r.userName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.userEmail}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-xs">
                        <MethodIcon className="size-3.5 text-kaza-navy" />
                        <span className="font-medium">
                          {method?.label ?? r.method}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[200px] truncate text-xs text-muted-foreground">
                      {r.destination}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatFcfa(r.amount)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-kaza-error">
                      - {formatFcfa(r.fee)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-kaza-green">
                      {formatFcfa(r.netAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                          status.className,
                        )}
                      >
                        <StatusIcon className="size-3" />
                        {status.label}
                      </span>
                      {r.reference && (
                        <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                          {r.reference}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDate(r.requestedAt)}
                      {r.processedAt && (
                        <p className="text-[10px]">
                          Traité : {formatDate(r.processedAt)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.status === "PENDING" ? (
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            className="h-7 bg-kaza-green text-[11px] hover:bg-kaza-green/90"
                            onClick={() => onApprove(r)}
                          >
                            <CheckCircle2 className="mr-1 size-3" />
                            Payer
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px] text-kaza-error hover:bg-red-50 hover:text-kaza-error"
                            onClick={() => onReject(r)}
                          >
                            <XCircle className="mr-1 size-3" />
                            Refuser
                          </Button>
                        </div>
                      ) : r.notes ? (
                        <Badge
                          variant="outline"
                          className="max-w-[200px] truncate text-[10px]"
                          title={r.notes}
                        >
                          {r.notes}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
