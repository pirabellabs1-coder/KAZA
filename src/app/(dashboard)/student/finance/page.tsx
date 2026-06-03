import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Wallet,
  PiggyBank,
  Receipt,
  Users,
  Inbox,
  GraduationCap,
  ArrowRight,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFcfa } from "@/lib/utils";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { getTenantFinanceSummary } from "@/lib/queries/tenant-finance";
import { listStudentColocations } from "@/lib/queries/tenant-activity";

export const metadata: Metadata = {
  title: "Mes finances — Étudiant",
  description: "Budget logement, loyer et solde — données réelles.",
};

export const dynamic = "force-dynamic";

function monthLabel(key: string): string {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("fr-FR", {
    month: "short",
    year: "2-digit",
  });
}

export default async function StudentFinancePage() {
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login?redirect=/student/finance");

  const [fin, colocations] = await Promise.all([
    getTenantFinanceSummary(user.id),
    listStudentColocations(user.id).catch(() => []),
  ]);

  const maxMonth = Math.max(1, ...fin.monthlyHistory.map((m) => m.paid));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Mes finances
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Budget logement, loyer et solde KAZA — données réelles.
        </p>
      </div>

      {/* KPIs réels */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-kaza-blue">
          <CardContent className="p-5">
            <Wallet className="size-5 text-kaza-blue" />
            <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">
              Solde KAZA
            </p>
            <p className="font-heading text-2xl font-bold text-kaza-navy">
              {formatFcfa(fin.walletBalance)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-kaza-green">
          <CardContent className="p-5">
            <GraduationCap className="size-5 text-kaza-green" />
            <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">
              Loyer mensuel
            </p>
            <p className="font-heading text-2xl font-bold text-kaza-navy">
              {fin.currentRent > 0 ? formatFcfa(fin.currentRent) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-5">
            <Receipt className="size-5 text-amber-600" />
            <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">
              Payé (12 mois)
            </p>
            <p className="font-heading text-2xl font-bold text-kaza-navy">
              {formatFcfa(fin.totalPaid12m)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-5">
            <Users className="size-5 text-purple-600" />
            <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">
              Colocations
            </p>
            <p className="font-heading text-2xl font-bold text-kaza-navy">
              {colocations.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Historique mensuel réel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Paiements par mois</CardTitle>
          <p className="text-sm text-muted-foreground">
            Loyers réglés via KAZA — 12 derniers mois
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
                Vos paiements de loyer via KAZA apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="flex h-44 items-end gap-2">
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

      {/* Dépenses partagées de colocation — module réel */}
      <Link
        href="/student/expenses"
        className="group block rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-kaza-green/40"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-kaza-green/10">
              <PiggyBank className="size-5 text-kaza-green" />
            </div>
            <div>
              <p className="text-sm font-semibold text-kaza-navy">
                Loyer & frais partagés de colocation
              </p>
              <p className="text-xs text-muted-foreground">
                Réglez votre part de loyer et les dépenses (courses, factures)
                avec vos colocataires — depuis votre solde KAZA ou par Mobile
                Money, en une fois ou en plusieurs tranches.
              </p>
            </div>
          </div>
          <ArrowRight className="size-4 shrink-0 text-gray-300 group-hover:text-kaza-green" />
        </div>
      </Link>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/student/colocations"
          className="group flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-kaza-blue/30"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-kaza-navy">
            <Users className="size-4 text-purple-600" /> Mes colocations
          </span>
          <ArrowRight className="size-4 text-gray-300 group-hover:text-kaza-blue" />
        </Link>
        <Link
          href="/student/budget"
          className="group flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-kaza-blue/30"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-kaza-navy">
            <Wallet className="size-4 text-kaza-blue" /> Mon budget colocation
          </span>
          <ArrowRight className="size-4 text-gray-300 group-hover:text-kaza-blue" />
        </Link>
      </div>
    </div>
  );
}
