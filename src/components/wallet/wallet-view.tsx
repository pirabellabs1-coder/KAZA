// =============================================================================
// KAZA — Vue Wallet partagée (Owner / Agency)
// Composant serveur ; affiche solde, transactions, retraits, RIB.
// =============================================================================

import {
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock4,
  Landmark,
  Receipt,
  Smartphone,
  Snowflake,
  Sparkles,
  Wallet as WalletIcon,
  XCircle,
} from "lucide-react";

import { BankDetailsDialog } from "@/components/wallet/bank-details-dialog";
import { RequestWithdrawalDialog } from "@/components/wallet/request-withdrawal-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type {
  WalletState,
  WalletTx,
  WithdrawalRequest,
} from "@/lib/queries/wallet";

interface WalletViewProps {
  wallet: WalletState;
  transactions: WalletTx[];
  withdrawals: WithdrawalRequest[];
}

function formatFcfa(n: number) {
  return `${Math.abs(n).toLocaleString("fr-FR")} FCFA`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function maskIban(iban: string | null) {
  if (!iban) return null;
  const clean = iban.replace(/\s/g, "");
  if (clean.length <= 8) return clean;
  return `${clean.slice(0, 4)} •••• •••• ${clean.slice(-4)}`;
}

function maskPhone(phone: string | null) {
  if (!phone) return null;
  const clean = phone.replace(/\s/g, "");
  if (clean.length <= 4) return clean;
  return `${clean.slice(0, 4)} ••• ${clean.slice(-2)}`;
}

const TX_TYPE_META: Record<
  string,
  { label: string; className: string }
> = {
  RENT_RECEIVED: {
    label: "Loyer reçu",
    className: "bg-emerald-100 text-emerald-700",
  },
  BOOKING_DEPOSIT: {
    label: "Caution reçue",
    className: "bg-blue-100 text-blue-700",
  },
  PAYOUT_REQUESTED: {
    label: "Retrait demandé",
    className: "bg-amber-100 text-amber-700",
  },
  PAYOUT_PROCESSED: {
    label: "Retrait payé",
    className: "bg-slate-100 text-slate-700",
  },
  REFUND_GIVEN: {
    label: "Remboursement",
    className: "bg-red-100 text-red-700",
  },
  PLATFORM_FEE: {
    label: "Commission KAZA",
    className: "bg-slate-100 text-slate-700",
  },
  BONUS: { label: "Bonus", className: "bg-purple-100 text-purple-700" },
  ADJUSTMENT: {
    label: "Ajustement",
    className: "bg-slate-100 text-slate-700",
  },
};

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

export function WalletView({
  wallet,
  transactions,
  withdrawals,
}: WalletViewProps) {
  const hasAnyActivity =
    wallet.balance !== 0 ||
    wallet.totalIn > 0 ||
    transactions.length > 0 ||
    withdrawals.length > 0;

  return (
    <div className="space-y-6">
      {/* Hero solde */}
      <Card className="relative overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-kaza-navy via-kaza-navy to-[#0F2940] text-white shadow-xl">
        <div className="pointer-events-none absolute -right-12 -top-12 size-56 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -right-24 top-24 size-72 rounded-full bg-kaza-blue/15 blur-2xl" />
        <CardContent className="relative p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/70">
                <WalletIcon className="size-3.5" />
                Solde disponible
                {wallet.isFrozen && (
                  <Badge className="ml-2 bg-red-500/20 text-red-100 hover:bg-red-500/30">
                    <Snowflake className="mr-1 size-3" />
                    Gelé
                  </Badge>
                )}
                {!wallet.isFrozen && (
                  <Badge className="ml-2 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30">
                    Actif
                  </Badge>
                )}
              </div>
              <p className="mt-2 font-heading text-4xl font-bold tracking-tight sm:text-5xl">
                {formatFcfa(wallet.balance)}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <div className="flex items-center gap-2 text-white/80">
                  <ArrowDownLeft className="size-4 text-emerald-300" />
                  <span>Entrées : </span>
                  <span className="font-mono font-semibold text-white">
                    {formatFcfa(wallet.totalIn)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <ArrowUpRight className="size-4 text-red-300" />
                  <span>Sorties : </span>
                  <span className="font-mono font-semibold text-white">
                    {formatFcfa(wallet.totalOut)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <RequestWithdrawalDialog
                availableBalance={wallet.balance}
                isFrozen={wallet.isFrozen}
              />
              <BankDetailsDialog
                initialIban={wallet.iban}
                initialBankName={wallet.bankName}
                initialMobileMoneyNumber={wallet.mobileMoneyNumber}
                initialMobileMoneyProvider={wallet.mobileMoneyProvider}
                triggerLabel="Modifier RIB / Mobile Money"
                triggerClassName="border-white/30 bg-white/10 text-white hover:bg-white/20"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty state global */}
      {!hasAnyActivity && (
        <Card className="rounded-2xl border-dashed shadow-sm">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-kaza-navy/5 text-kaza-navy">
              <Sparkles className="size-6" />
            </div>
            <p className="font-heading text-lg font-semibold text-foreground">
              Votre wallet est prêt
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              Votre wallet sera crédité dès le premier loyer reçu via KAZA.
              Pensez à enregistrer vos coordonnées bancaires pour faciliter
              vos futurs retraits.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Transactions */}
        <Card className="rounded-2xl shadow-sm lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="font-heading text-base">
                  Historique des transactions
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Mouvements récents sur votre wallet
                </p>
              </div>
              {transactions.length > 0 && (
                <Badge variant="outline" className="text-[11px]">
                  {transactions.length} mouvement
                  {transactions.length > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-10 text-center">
                <Receipt className="size-8 text-muted-foreground/40" />
                <p className="text-sm font-medium">Aucune transaction</p>
                <p className="text-xs text-muted-foreground">
                  Les mouvements apparaîtront ici dès le premier paiement.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2 font-medium">Type</th>
                      <th className="pb-2 font-medium">Description</th>
                      <th className="pb-2 text-right font-medium">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {transactions.map((tx) => {
                      const meta = TX_TYPE_META[tx.type] ?? {
                        label: tx.type,
                        className: "bg-slate-100 text-slate-700",
                      };
                      const positive = tx.amount > 0;
                      const zero = tx.amount === 0;
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/60">
                          <td className="py-2.5 text-muted-foreground">
                            {formatDate(tx.createdAt)}
                          </td>
                          <td className="py-2.5">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                                meta.className,
                              )}
                            >
                              {meta.label}
                            </span>
                          </td>
                          <td className="py-2.5 text-muted-foreground">
                            {tx.description ?? "—"}
                          </td>
                          <td
                            className={cn(
                              "py-2.5 text-right font-mono font-semibold",
                              zero
                                ? "text-muted-foreground"
                                : positive
                                  ? "text-kaza-green"
                                  : "text-kaza-error",
                            )}
                          >
                            {zero
                              ? "—"
                              : `${positive ? "+" : "-"} ${formatFcfa(tx.amount)}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Méthodes de paiement */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-base">
              Méthodes de paiement
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Destinations enregistrées pour vos retraits
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Bancaire */}
            <div className="rounded-xl border bg-slate-50/60 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-kaza-navy">
                <Landmark className="size-3.5" />
                Compte bancaire
              </div>
              {wallet.iban ? (
                <>
                  <p className="mt-2 font-mono text-sm font-semibold text-foreground">
                    {maskIban(wallet.iban)}
                  </p>
                  {wallet.bankName && (
                    <p className="text-xs text-muted-foreground">
                      {wallet.bankName}
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">
                  Aucun RIB enregistré.
                </p>
              )}
            </div>

            {/* Mobile Money */}
            <div className="rounded-xl border bg-slate-50/60 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-kaza-navy">
                <Smartphone className="size-3.5" />
                Mobile Money
              </div>
              {wallet.mobileMoneyNumber ? (
                <>
                  <p className="mt-2 font-mono text-sm font-semibold text-foreground">
                    {maskPhone(wallet.mobileMoneyNumber)}
                  </p>
                  {wallet.mobileMoneyProvider && (
                    <p className="text-xs text-muted-foreground">
                      {wallet.mobileMoneyProvider}
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">
                  Aucun numéro Mobile Money enregistré.
                </p>
              )}
            </div>

            <BankDetailsDialog
              initialIban={wallet.iban}
              initialBankName={wallet.bankName}
              initialMobileMoneyNumber={wallet.mobileMoneyNumber}
              initialMobileMoneyProvider={wallet.mobileMoneyProvider}
              triggerLabel={
                wallet.iban || wallet.mobileMoneyNumber
                  ? "Modifier"
                  : "Ajouter des coordonnées"
              }
              triggerClassName="w-full"
            />
          </CardContent>
        </Card>
      </div>

      {/* Demandes de retrait */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="font-heading text-base">
                Mes demandes de retrait
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Suivi de vos virements demandés
              </p>
            </div>
            {withdrawals.length > 0 && (
              <Badge variant="outline" className="text-[11px]">
                {withdrawals.length} demande
                {withdrawals.length > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {withdrawals.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-10 text-center">
              <Building2 className="size-8 text-muted-foreground/40" />
              <p className="text-sm font-medium">Aucune demande de retrait</p>
              <p className="text-xs text-muted-foreground">
                Cliquez sur « Demander un retrait » dès que votre solde est
                suffisant.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Méthode</th>
                    <th className="pb-2 font-medium">Destination</th>
                    <th className="pb-2 text-right font-medium">Brut</th>
                    <th className="pb-2 text-right font-medium">Fee</th>
                    <th className="pb-2 text-right font-medium">Net</th>
                    <th className="pb-2 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {withdrawals.map((w) => {
                    const status =
                      STATUS_META[w.status] ?? {
                        label: w.status,
                        className: "bg-slate-100 text-slate-700",
                        icon: Clock4,
                      };
                    const StatusIcon = status.icon;
                    return (
                      <tr key={w.id} className="hover:bg-slate-50/60">
                        <td className="py-2.5 text-muted-foreground">
                          {formatDate(w.requestedAt)}
                        </td>
                        <td className="py-2.5 font-medium">{w.method}</td>
                        <td className="py-2.5 max-w-[200px] truncate text-muted-foreground">
                          {w.destination}
                        </td>
                        <td className="py-2.5 text-right font-mono">
                          {formatFcfa(w.amount)}
                        </td>
                        <td className="py-2.5 text-right font-mono text-kaza-error">
                          - {formatFcfa(w.fee)}
                        </td>
                        <td className="py-2.5 text-right font-mono font-semibold text-kaza-green">
                          {formatFcfa(w.netAmount)}
                        </td>
                        <td className="py-2.5">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                              status.className,
                            )}
                          >
                            <StatusIcon className="size-3" />
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
