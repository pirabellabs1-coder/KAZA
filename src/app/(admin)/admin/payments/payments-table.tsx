// =============================================================================
// Kaabo - Admin / Transactions globales — table client
// =============================================================================

"use client";

import { useState } from "react";
import { Eye, CreditCard, Wallet, Smartphone, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/admin/data-table";
import { cn, formatPrice } from "@/lib/utils";

export type PaymentStatus = "success" | "pending" | "failed" | "refunded";
export type PaymentMethod = "kaza_pay" | "kaza_wallet" | "card";

export interface PaymentRow {
  id: string;
  date: string;
  userName: string;
  userEmail: string;
  propertyTitle: string;
  propertyId: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  [key: string]: unknown;
}

const statusConfig: Record<PaymentStatus, { label: string; classes: string }> =
  {
    success: {
      label: "Succès",
      classes: "bg-green-100 text-green-700 border-green-200",
    },
    pending: {
      label: "En attente",
      classes: "bg-orange-100 text-orange-700 border-orange-200",
    },
    failed: {
      label: "Échec",
      classes: "bg-red-100 text-red-700 border-red-200",
    },
    refunded: {
      label: "Remboursé",
      classes: "bg-gray-100 text-gray-700 border-gray-200",
    },
  };

const methodConfig: Record<
  PaymentMethod,
  { label: string; icon: typeof CreditCard }
> = {
  kaza_pay: { label: "Kaabo Pay", icon: Smartphone },
  kaza_wallet: { label: "Kaabo Wallet", icon: Wallet },
  card: { label: "Carte", icon: CreditCard },
};

interface PaymentsTableProps {
  rows: PaymentRow[];
}

export function PaymentsTable({ rows }: PaymentsTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("30d");
  const [detailRow, setDetailRow] = useState<PaymentRow | null>(null);

  const filtered = rows.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (periodFilter === "7d") {
      // eslint-disable-next-line react-hooks/purity -- Server Component rendu une fois par requete / valeur temporelle stable — appel horloge acceptable ici
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      if (new Date(p.date).getTime() < sevenDaysAgo) return false;
    }
    return true;
  });

  // Export CSV (compatible Excel via BOM) des transactions filtrées — données
  // déjà chargées côté client, aucune route serveur nécessaire.
  const exportCsv = () => {
    const headers = [
      "ID",
      "Date",
      "Utilisateur",
      "Email",
      "Bien",
      "Montant (FCFA)",
      "Statut",
      "Methode",
    ];
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = [headers.map(esc).join(",")];
    for (const p of filtered) {
      lines.push(
        [
          p.id,
          new Date(p.date).toLocaleString("fr-FR"),
          p.userName,
          p.userEmail,
          p.propertyTitle,
          String(p.amount),
          statusConfig[p.status].label,
          methodConfig[p.method].label,
        ]
          .map(esc)
          .join(","),
      );
    }
    const csv = "﻿" + lines.join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kaza-transactions-${filtered.length}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns: DataTableColumn<PaymentRow>[] = [
    {
      key: "date",
      label: "Date",
      sortValue: (row) => row.date,
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.date).toLocaleString("fr-FR", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
    {
      key: "id",
      label: "ID transaction",
      sortValue: (row) => row.id,
      render: (row) => (
        <span className="font-mono text-xs text-kaza-navy">{row.id}</span>
      ),
    },
    {
      key: "user",
      label: "Utilisateur",
      sortValue: (row) => row.userName,
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">
            {row.userName}
          </span>
          <span className="text-xs text-muted-foreground">{row.userEmail}</span>
        </div>
      ),
    },
    {
      key: "property",
      label: "Bien",
      sortValue: (row) => row.propertyTitle,
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm text-foreground">{row.propertyTitle}</span>
          <span className="text-xs text-muted-foreground">
            #{row.propertyId}
          </span>
        </div>
      ),
    },
    {
      key: "amount",
      label: "Montant",
      sortValue: (row) => row.amount,
      render: (row) => (
        <span className="font-semibold text-foreground">
          {formatPrice(row.amount)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Statut",
      sortValue: (row) => row.status,
      render: (row) => {
        const config = statusConfig[row.status];
        return (
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
              config.classes,
            )}
          >
            {config.label}
          </span>
        );
      },
    },
    {
      key: "method",
      label: "Méthode",
      sortValue: (row) => row.method,
      render: (row) => {
        const config = methodConfig[row.method];
        const Icon = config.icon;
        return (
          <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
            <Icon className="size-3.5 text-muted-foreground" />
            {config.label}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "Action",
      align: "right",
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1"
          onClick={() => setDetailRow(row)}
        >
          <Eye className="size-4" />
          Détails
        </Button>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rows={filtered}
        pageSize={10}
        searchAccessor={(row) =>
          `${row.id} ${row.userName} ${row.userEmail} ${row.propertyTitle}`
        }
        searchPlaceholder="Rechercher par ID, utilisateur, bien..."
        filters={
          <>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="success">Succès</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="failed">Échec</SelectItem>
                <SelectItem value="refunded">Remboursé</SelectItem>
              </SelectContent>
            </Select>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 derniers jours</SelectItem>
                <SelectItem value="30d">30 derniers jours</SelectItem>
                <SelectItem value="all">Tout</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={exportCsv}
              disabled={filtered.length === 0}
            >
              <Download className="size-4" />
              Exporter CSV
            </Button>
          </>
        }
        emptyTitle="Aucune transaction"
        emptyDescription="Aucune transaction ne correspond à ces filtres."
      />

      <Dialog
        open={!!detailRow}
        onOpenChange={(open) => !open && setDetailRow(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails de la transaction</DialogTitle>
            <DialogDescription>
              {detailRow && (
                <span className="font-mono text-xs">{detailRow.id}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          {detailRow && (
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Date</dt>
                <dd className="font-medium">
                  {new Date(detailRow.date).toLocaleString("fr-FR")}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Montant</dt>
                <dd className="font-semibold text-kaza-navy">
                  {formatPrice(detailRow.amount)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Utilisateur</dt>
                <dd className="font-medium">{detailRow.userName}</dd>
                <dd className="text-xs text-muted-foreground">
                  {detailRow.userEmail}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Bien</dt>
                <dd className="font-medium">{detailRow.propertyTitle}</dd>
                <dd className="text-xs text-muted-foreground">
                  #{detailRow.propertyId}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Méthode</dt>
                <dd className="font-medium">
                  {methodConfig[detailRow.method].label}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Statut</dt>
                <dd>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                      statusConfig[detailRow.status].classes,
                    )}
                  >
                    {statusConfig[detailRow.status].label}
                  </span>
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground">
                  Commission Kaabo (3%)
                </dt>
                <dd className="font-medium">
                  {formatPrice(Math.round(detailRow.amount * 0.03))}
                </dd>
              </div>
            </dl>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailRow(null)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
