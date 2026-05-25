import type { Metadata } from "next";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CalendarClock,
  CreditCard,
  Plus,
  Smartphone,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatsCard } from "@/components/dashboard/stats-card";
import { formatPrice } from "@/lib/utils";
import {
  TransactionsList,
  type WalletTransaction,
} from "./transactions-list";

export const metadata: Metadata = {
  title: "Mon portefeuille",
};

const BALANCE = 245_000;
const SPENT_THIS_MONTH = 175_000;
const UPCOMING_RENT_30D = 150_000;

const PAYMENT_METHODS = [
  {
    id: "pm-mtn",
    type: "mobile",
    label: "MTN Mobile Money",
    masked: "+229 97 ** ** 41",
    isDefault: true,
  },
  {
    id: "pm-moov",
    type: "mobile",
    label: "Moov Money",
    masked: "+229 96 ** ** 12",
    isDefault: false,
  },
  {
    id: "pm-visa",
    type: "card",
    label: "Carte VISA",
    masked: "•••• 4821 — exp. 09/27",
    isDefault: false,
  },
];

const TRANSACTIONS: WalletTransaction[] = [
  {
    id: "tx-001",
    date: "2026-05-22T09:14:00.000Z",
    description: "Recharge MTN Mobile Money",
    method: "MTN_MOMO",
    amount: 100_000,
    direction: "in",
    status: "completed",
  },
  {
    id: "tx-002",
    date: "2026-05-20T18:02:00.000Z",
    description: "Loyer Mai — Studio Fidjrosse",
    method: "WALLET",
    amount: 150_000,
    direction: "out",
    status: "completed",
  },
  {
    id: "tx-003",
    date: "2026-05-18T11:35:00.000Z",
    description: "Caution Studio Fidjrosse",
    method: "WALLET",
    amount: 25_000,
    direction: "out",
    status: "completed",
  },
  {
    id: "tx-004",
    date: "2026-05-15T08:00:00.000Z",
    description: "Recharge Moov Money",
    method: "MOOV_MONEY",
    amount: 75_000,
    direction: "in",
    status: "completed",
  },
  {
    id: "tx-005",
    date: "2026-05-10T20:45:00.000Z",
    description: "Frais de service KAZA",
    method: "WALLET",
    amount: 2_500,
    direction: "out",
    status: "completed",
  },
  {
    id: "tx-006",
    date: "2026-05-05T07:20:00.000Z",
    description: "Recharge Carte VISA",
    method: "VISA",
    amount: 200_000,
    direction: "in",
    status: "completed",
  },
  {
    id: "tx-007",
    date: "2026-04-28T16:11:00.000Z",
    description: "Loyer Avril — Studio Fidjrosse",
    method: "WALLET",
    amount: 150_000,
    direction: "out",
    status: "completed",
  },
  {
    id: "tx-008",
    date: "2026-04-22T10:00:00.000Z",
    description: "Retrait vers MTN Mobile Money",
    method: "MTN_MOMO",
    amount: 50_000,
    direction: "out",
    status: "completed",
  },
  {
    id: "tx-009",
    date: "2026-04-15T13:25:00.000Z",
    description: "Recharge MTN Mobile Money",
    method: "MTN_MOMO",
    amount: 50_000,
    direction: "in",
    status: "pending",
  },
  {
    id: "tx-010",
    date: "2026-03-30T09:00:00.000Z",
    description: "Loyer Mars — Studio Fidjrosse",
    method: "WALLET",
    amount: 150_000,
    direction: "out",
    status: "completed",
  },
  {
    id: "tx-011",
    date: "2026-03-12T19:32:00.000Z",
    description: "Recharge Carte VISA",
    method: "VISA",
    amount: 100_000,
    direction: "in",
    status: "failed",
  },
  {
    id: "tx-012",
    date: "2026-02-28T08:30:00.000Z",
    description: "Loyer Février — Studio Fidjrosse",
    method: "WALLET",
    amount: 150_000,
    direction: "out",
    status: "completed",
  },
];

export default function TenantWalletPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Mon portefeuille
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gérez votre solde, vos méthodes de paiement et l&apos;historique de vos
          transactions.
        </p>
      </div>

      {/* Balance card */}
      <Card className="overflow-hidden border-kaza-navy/20 bg-gradient-to-br from-kaza-navy to-kaza-navy/90 text-white">
        <CardContent className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-white/70">
                <Wallet className="size-4" />
                Solde disponible
              </div>
              <p className="mt-3 font-heading text-4xl font-bold tracking-tight sm:text-5xl">
                {formatPrice(BALANCE)}
              </p>
              <p className="mt-1 text-sm text-white/70">
                Mis à jour à l&apos;instant
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button className="bg-white text-kaza-navy hover:bg-white/90">
              <ArrowDownToLine className="size-4" />
              Recharger
            </Button>
            <Button
              variant="outline"
              className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <ArrowUpFromLine className="size-4" />
              Retirer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sub stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <StatsCard
          title="Total dépensé ce mois"
          value={formatPrice(SPENT_THIS_MONTH)}
          icon={TrendingDown}
          subtitle="Mai 2026"
          trend={{ label: "−12% vs avril", type: "positive" }}
        />
        <StatsCard
          title="Loyers à venir (30j)"
          value={formatPrice(UPCOMING_RENT_30D)}
          icon={CalendarClock}
          subtitle="Prochaine échéance le 1er juin"
        />
      </div>

      {/* Payment methods */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Méthodes de paiement</CardTitle>
          <Button variant="outline" size="sm">
            <Plus className="size-4" />
            Ajouter une méthode
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {PAYMENT_METHODS.map((pm) => (
              <div
                key={pm.id}
                className="flex items-start gap-3 rounded-lg border p-4 transition-colors hover:border-kaza-blue/50 hover:bg-muted/40"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-kaza-navy/5 text-kaza-navy">
                  {pm.type === "mobile" ? (
                    <Smartphone className="size-5" />
                  ) : (
                    <CreditCard className="size-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{pm.label}</p>
                    {pm.isDefault && (
                      <Badge variant="secondary" className="text-[10px]">
                        Par défaut
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {pm.masked}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transactions */}
      <TransactionsList transactions={TRANSACTIONS} />
    </div>
  );
}
