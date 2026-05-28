"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Receipt } from "lucide-react";
import { cn, formatDate, formatPrice } from "@/lib/utils";

export type TxDirection = "in" | "out";
export type TxStatus = "completed" | "pending" | "failed";
export type TxMethod =
  | "MTN_MOMO"
  | "MOOV_MONEY"
  | "VISA"
  | "BANK"
  | "WALLET";

export interface WalletTransaction {
  id: string;
  date: string;
  description: string;
  method: TxMethod;
  amount: number;
  direction: TxDirection;
  status: TxStatus;
}

const METHOD_LABEL: Record<TxMethod, string> = {
  MTN_MOMO: "KAZA Pay",
  MOOV_MONEY: "KAZA Wallet",
  VISA: "Carte VISA",
  BANK: "Virement bancaire",
  WALLET: "Solde portefeuille",
};

type DirectionFilter = "all" | "in" | "out";
type PeriodFilter = "all" | "30" | "90";

function statusBadge(status: TxStatus) {
  switch (status) {
    case "completed":
      return (
        <Badge className="gap-1 bg-kaza-green text-white hover:bg-kaza-green/90">
          <CheckCircle className="size-3" />
          Validé
        </Badge>
      );
    case "pending":
      return (
        <Badge className="gap-1 border-kaza-warning bg-kaza-warning/10 text-kaza-warning">
          <Clock className="size-3" />
          En attente
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="size-3" />
          Échoué
        </Badge>
      );
  }
}

interface TransactionsListProps {
  transactions: WalletTransaction[];
}

export function TransactionsList({ transactions }: TransactionsListProps) {
  const [direction, setDirection] = useState<DirectionFilter>("all");
  const [period, setPeriod] = useState<PeriodFilter>("all");

  const filtered = useMemo(() => {
    const now = Date.now();
    return transactions.filter((t) => {
      if (direction !== "all" && t.direction !== direction) return false;
      if (period !== "all") {
        const limitDays = period === "30" ? 30 : 90;
        const age = (now - new Date(t.date).getTime()) / (1000 * 60 * 60 * 24);
        if (age > limitDays) return false;
      }
      return true;
    });
  }, [transactions, direction, period]);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle>Historique des transactions</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={direction}
            onValueChange={(v) => setDirection(v as DirectionFilter)}
          >
            <SelectTrigger size="sm" className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tout</SelectItem>
              <SelectItem value="in">Entrées</SelectItem>
              <SelectItem value="out">Sorties</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={period}
            onValueChange={(v) => setPeriod(v as PeriodFilter)}
          >
            <SelectTrigger size="sm" className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toute la période</SelectItem>
              <SelectItem value="30">30 derniers jours</SelectItem>
              <SelectItem value="90">90 derniers jours</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Aucune transaction"
            description="Ajustez vos filtres pour voir plus de mouvements."
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Date
                    </th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Description
                    </th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Méthode
                    </th>
                    <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Montant
                    </th>
                    <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-b last:border-0 transition-colors hover:bg-muted/50"
                    >
                      <td className="py-3 text-sm text-muted-foreground">
                        {formatDate(tx.date)}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "flex size-7 items-center justify-center rounded-full",
                              tx.direction === "in"
                                ? "bg-kaza-green/10 text-kaza-green"
                                : "bg-kaza-error/10 text-kaza-error"
                            )}
                          >
                            {tx.direction === "in" ? (
                              <ArrowDownLeft className="size-4" />
                            ) : (
                              <ArrowUpRight className="size-4" />
                            )}
                          </div>
                          <span className="text-sm font-medium">
                            {tx.description}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-sm text-muted-foreground">
                        {METHOD_LABEL[tx.method]}
                      </td>
                      <td
                        className={cn(
                          "py-3 text-right text-sm font-semibold tabular-nums",
                          tx.direction === "in"
                            ? "text-kaza-green"
                            : "text-kaza-error"
                        )}
                      >
                        {tx.direction === "in" ? "+" : "−"}{" "}
                        {formatPrice(tx.amount)}
                      </td>
                      <td className="py-3 text-right">{statusBadge(tx.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {filtered.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-start justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full",
                        tx.direction === "in"
                          ? "bg-kaza-green/10 text-kaza-green"
                          : "bg-kaza-error/10 text-kaza-error"
                      )}
                    >
                      {tx.direction === "in" ? (
                        <ArrowDownLeft className="size-4" />
                      ) : (
                        <ArrowUpRight className="size-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {tx.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(tx.date)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {METHOD_LABEL[tx.method]}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        tx.direction === "in"
                          ? "text-kaza-green"
                          : "text-kaza-error"
                      )}
                    >
                      {tx.direction === "in" ? "+" : "−"} {formatPrice(tx.amount)}
                    </p>
                    <div className="mt-1">{statusBadge(tx.status)}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
