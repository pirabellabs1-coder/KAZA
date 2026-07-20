import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Wallet,
  CreditCard,
  Calendar,
  Receipt,
  Inbox,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatFcfa } from "@/lib/utils";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { getTenantFinanceSummary } from "@/lib/queries/tenant-finance";

export const metadata: Metadata = {
  title: "Mes finances — Locataire",
  description: "Suivi réel de vos paiements de loyer, solde et historique.",
};

export const dynamic = "force-dynamic";

const STATUS_META: Record<
  string,
  { label: string; cls: string; Icon: typeof CheckCircle2 }
> = {
  COMPLETED: { label: "Payé", cls: "bg-emerald-100 text-emerald-700", Icon: CheckCircle2 },
  PENDING: { label: "En attente", cls: "bg-amber-100 text-amber-700", Icon: Clock },
  FAILED: { label: "Échec", cls: "bg-red-100 text-red-700", Icon: XCircle },
  REFUNDED: { label: "Remboursé", cls: "bg-slate-100 text-slate-600", Icon: Receipt },
};

function monthLabel(key: string): string {
  const [y, m] = key.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
}

export default async function TenantFinancePage() {
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login?redirect=/tenant/finance");

  const fin = await getTenantFinanceSummary(user.id);
  const maxMonth = Math.max(1, ...fin.monthlyHistory.map((m) => m.paid));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Mes finances
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Suivi de vos loyers, paiements et solde — données réelles.
        </p>
      </div>

      {/* KPIs réels */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-kaza-blue">
          <CardContent className="p-5">
            <Wallet className="size-5 text-kaza-blue" />
            <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">
              Solde Kaabo
            </p>
            <p className="font-heading text-2xl font-bold text-kaza-navy">
              {formatFcfa(fin.walletBalance)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-kaza-green">
          <CardContent className="p-5">
            <CreditCard className="size-5 text-kaza-green" />
            <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">
              Loyer mensuel
            </p>
            <p className="font-heading text-2xl font-bold text-kaza-navy">
              {fin.currentRent > 0 ? formatFcfa(fin.currentRent) : "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {fin.activeRentals} bail{fin.activeRentals > 1 ? "s" : ""} actif{fin.activeRentals > 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-5">
            <Calendar className="size-5 text-amber-600" />
            <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">
              Payé (12 mois)
            </p>
            <p className="font-heading text-2xl font-bold text-kaza-navy">
              {formatFcfa(fin.totalPaid12m)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-kaza-navy">
          <CardContent className="p-5">
            <Receipt className="size-5 text-kaza-navy" />
            <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">
              Total payé
            </p>
            <p className="font-heading text-2xl font-bold text-kaza-navy">
              {formatFcfa(fin.totalPaid)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Historique mensuel (réel) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Paiements par mois</CardTitle>
          <p className="text-sm text-muted-foreground">
            Loyers réglés sur les 12 derniers mois
          </p>
        </CardHeader>
        <CardContent>
          {fin.monthlyHistory.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Inbox className="size-9 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                Aucun paiement enregistré
              </p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Vos paiements de loyer via Kaabo apparaîtront ici, mois par mois.
              </p>
            </div>
          ) : (
            <div className="flex h-48 items-end gap-2">
              {fin.monthlyHistory.map((m) => (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-kaza-blue to-kaza-blue/60"
                      style={{ height: `${(m.paid / maxMonth) * 100}%` }}
                      title={formatFcfa(m.paid)}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {monthLabel(m.month)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historique des paiements (réel) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Historique des paiements</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/tenant/payments/checkout">Effectuer un paiement</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {fin.payments.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Receipt className="size-9 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                Aucun paiement pour le moment
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {fin.payments.slice(0, 15).map((p) => {
                const meta = STATUS_META[p.status] ?? STATUS_META.PENDING;
                const Icon = meta.Icon;
                return (
                  <li key={p.id} className="flex items-center gap-3 py-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-slate-100">
                      <Icon className="size-4 text-slate-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-kaza-navy">
                        {p.propertyTitle ?? "Paiement"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(p.paymentDate ?? p.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                        {" · "}
                        {p.method}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-kaza-navy">{formatFcfa(p.amount)}</p>
                      <Badge className={`${meta.cls} text-[10px]`}>{meta.label}</Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
