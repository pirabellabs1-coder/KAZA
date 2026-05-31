"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  Bell,
  CheckCircle,
  Clock,
  CreditCard,
  Eye,
  Wallet,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatsCard } from "@/components/dashboard/stats-card";
import { toast } from "@/components/ui/toast-helper";
import { formatDate } from "@/lib/utils";
import type { OwnerPayment } from "@/lib/queries/owner-activity";

function formatFcfa(value: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(value)} FCFA`;
}

function isSameMonth(iso: string | null, ref: Date): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  return (
    d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()
  );
}

function isLate(payment: OwnerPayment): boolean {
  if (payment.status !== "PENDING") return false;
  if (!payment.dueDate) return false;
  return new Date(payment.dueDate) < new Date();
}

function paymentStatusBadge(payment: OwnerPayment) {
  if (isLate(payment)) {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="size-3" />
        En retard
      </Badge>
    );
  }
  switch (payment.status) {
    case "COMPLETED":
      return (
        <Badge className="gap-1 bg-kaza-green text-white hover:bg-kaza-green/90">
          <CheckCircle className="size-3" />
          Payé
        </Badge>
      );
    case "PENDING":
      return (
        <Badge className="gap-1 border-kaza-warning bg-kaza-warning/10 text-kaza-warning">
          <Clock className="size-3" />
          En attente
        </Badge>
      );
    case "PROCESSING":
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="size-3" />
          Traitement
        </Badge>
      );
    case "FAILED":
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="size-3" />
          Échoué
        </Badge>
      );
    case "REFUNDED":
      return (
        <Badge variant="outline" className="gap-1">
          <ArrowDownRight className="size-3" />
          Remboursé
        </Badge>
      );
    default:
      return <Badge variant="outline">{payment.status}</Badge>;
  }
}

function methodLabel(method: string | null): string {
  switch (method) {
    case "MOBILE_MONEY":
      return "Mobile Money";
    case "BANK_TRANSFER":
      return "Virement";
    case "CARD":
      return "Carte bancaire";
    case "WALLET":
      return "Portefeuille";
    case "CASH":
      return "Espèces";
    default:
      return "—";
  }
}

interface OwnerPaymentsViewProps {
  payments: OwnerPayment[];
}

export function OwnerPaymentsView({ payments }: OwnerPaymentsViewProps) {
  const stats = useMemo(() => {
    const now = new Date();
    let received = 0;
    let receivedThisMonth = 0;
    let pendingAmount = 0;
    let pendingCount = 0;
    let lateAmount = 0;
    let lateCount = 0;

    for (const p of payments) {
      if (p.status === "COMPLETED") {
        received += p.amount;
        if (isSameMonth(p.paidAt ?? p.createdAt, now)) {
          receivedThisMonth += p.amount;
        }
      } else if (p.status === "PENDING") {
        pendingAmount += p.amount;
        pendingCount += 1;
        if (isLate(p)) {
          lateAmount += p.amount;
          lateCount += 1;
        }
      }
    }

    return {
      received,
      receivedThisMonth,
      pendingAmount,
      pendingCount,
      lateAmount,
      lateCount,
    };
  }, [payments]);

  const [selected, setSelected] = useState<OwnerPayment | null>(null);

  const handleRemind = (p: OwnerPayment) => {
    toast.info(`Relance envoyée à ${p.tenantName}.`);
  };

  const handleView = (p: OwnerPayment) => {
    setSelected(p);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-kaza-navy">
          Paiements
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {payments.length === 0
            ? "Suivez ici l’ensemble des paiements liés à vos biens."
            : "Historique et suivi des paiements perçus."}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Perçu ce mois-ci"
          value={formatFcfa(stats.receivedThisMonth)}
          icon={Wallet}
          subtitle={`${formatFcfa(stats.received)} cumulés`}
          trend={
            stats.receivedThisMonth > 0
              ? { label: "Encaissements du mois", type: "positive" }
              : undefined
          }
        />
        <StatsCard
          title="En attente"
          value={formatFcfa(stats.pendingAmount)}
          icon={Clock}
          subtitle={`${stats.pendingCount} paiement${stats.pendingCount > 1 ? "s" : ""}`}
        />
        <StatsCard
          title="En retard"
          value={formatFcfa(stats.lateAmount)}
          icon={AlertTriangle}
          subtitle={`${stats.lateCount} échéance${stats.lateCount > 1 ? "s" : ""} dépassée${stats.lateCount > 1 ? "s" : ""}`}
          trend={
            stats.lateCount > 0
              ? { label: "Action requise", type: "negative" }
              : undefined
          }
        />
      </div>

      {payments.length === 0 ? (
        <EmptyPaymentsCard />
      ) : (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-xl text-kaza-navy">
              Historique des paiements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Date
                    </th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Locataire
                    </th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Bien
                    </th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Montant
                    </th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Méthode
                    </th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Statut
                    </th>
                    <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b transition-colors last:border-0 hover:bg-muted/40"
                    >
                      <td className="py-3 text-sm text-muted-foreground">
                        {p.paidAt
                          ? formatDate(p.paidAt)
                          : p.dueDate
                            ? formatDate(p.dueDate)
                            : formatDate(p.createdAt)}
                      </td>
                      <td className="py-3 text-sm font-medium">
                        {p.tenantName}
                      </td>
                      <td className="py-3 text-sm text-muted-foreground">
                        {p.propertyTitle}
                      </td>
                      <td className="py-3 text-sm font-semibold text-kaza-navy">
                        {formatFcfa(p.amount)}
                      </td>
                      <td className="py-3 text-sm text-muted-foreground">
                        {methodLabel(p.method)}
                      </td>
                      <td className="py-3">{paymentStatusBadge(p)}</td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleView(p)}
                            aria-label="Voir le détail"
                          >
                            <Eye className="size-4" />
                          </Button>
                          {isLate(p) && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleRemind(p)}
                              aria-label="Relancer"
                            >
                              <Bell className="size-4 text-kaza-warning" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border p-3 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {p.tenantName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {p.propertyTitle}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {p.paidAt
                          ? `Payé le ${formatDate(p.paidAt)}`
                          : p.dueDate
                            ? `Échéance ${formatDate(p.dueDate)}`
                            : `Créé ${formatDate(p.createdAt)}`}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <p className="text-sm font-semibold text-kaza-navy">
                        {formatFcfa(p.amount)}
                      </p>
                      {paymentStatusBadge(p)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Détail d'un paiement */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Détail du paiement</DialogTitle>
            <DialogDescription>
              Référence {selected?.id.slice(0, 8).toUpperCase()}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <DetailRow label="Locataire" value={selected.tenantName} />
              <DetailRow label="Bien" value={selected.propertyTitle} />
              <DetailRow
                label="Montant"
                value={formatFcfa(selected.amount)}
                strong
              />
              <DetailRow label="Moyen" value={methodLabel(selected.method)} />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Statut</span>
                {paymentStatusBadge(selected)}
              </div>
              {selected.dueDate && (
                <DetailRow
                  label="Échéance"
                  value={formatDate(selected.dueDate)}
                />
              )}
              <DetailRow
                label={selected.paidAt ? "Payé le" : "Créé le"}
                value={formatDate(selected.paidAt ?? selected.createdAt)}
              />
              {selected.rentalId && (
                <DetailRow
                  label="Location"
                  value={selected.rentalId.slice(0, 8).toUpperCase()}
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={
          strong
            ? "font-semibold text-kaza-navy"
            : "font-medium text-foreground"
        }
      >
        {value}
      </span>
    </div>
  );
}

function EmptyPaymentsCard() {
  return (
    <Card className="rounded-2xl border-2 border-dashed bg-gradient-to-br from-white via-muted/20 to-kaza-blue/[0.04] shadow-sm">
      <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-kaza-blue/10">
          <CreditCard className="size-8 text-kaza-blue" />
        </div>
        <h2 className="mt-6 font-heading text-xl font-bold text-kaza-navy">
          Aucun paiement enregistré
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Les paiements de vos locataires apparaîtront ici dès qu’ils seront
          effectués via Mobile Money, virement ou carte.
        </p>
      </CardContent>
    </Card>
  );
}
