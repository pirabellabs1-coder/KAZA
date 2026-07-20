import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  TrendingUp,
  Wallet,
  Receipt,
  CalendarCheck,
  Heart,
  Home,
  Inbox,
  ArrowRight,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatFcfa } from "@/lib/utils";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { getTenantFinanceSummary } from "@/lib/queries/tenant-finance";
import {
  listTenantVisits,
  listSavedProperties,
  listTenantRentals,
} from "@/lib/queries/tenant-activity";

export const metadata: Metadata = {
  title: "Mes analyses · Kaabo",
  description: "Suivi réel de votre budget logement, paiements et activité.",
};

export const dynamic = "force-dynamic";

function monthLabel(key: string): string {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("fr-FR", {
    month: "short",
    year: "2-digit",
  });
}

export default async function TenantAnalyticsPage() {
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login?redirect=/tenant/analytics");

  const [fin, visits, saved, rentals] = await Promise.all([
    getTenantFinanceSummary(user.id),
    listTenantVisits(user.id),
    listSavedProperties(user.id),
    listTenantRentals(user.id),
  ]);

  const maxMonth = Math.max(1, ...fin.monthlyHistory.map((m) => m.paid));
  const activeRental = rentals.find((r) => r.status === "ACTIVE") ?? null;
  const hasNoActivity =
    fin.payments.length === 0 &&
    visits.length === 0 &&
    saved.length === 0 &&
    rentals.length === 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
          Mes analyses
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Votre activité Kaabo en chiffres réels — budget, paiements, recherche.
        </p>
      </div>

      {hasNoActivity ? (
        <Card className="rounded-2xl border-dashed bg-muted/30">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <Inbox className="size-10 text-muted-foreground" />
            <h2 className="font-heading text-lg font-semibold text-kaza-navy">
              Pas encore d&apos;activité
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Dès que vous demandez une visite, sauvegardez une annonce ou
              réglez un loyer, vos statistiques apparaîtront ici.
            </p>
            <Button asChild className="mt-2 bg-kaza-blue hover:bg-kaza-blue/90">
              <Link href="/search">Explorer les annonces</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPIs réels */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-5">
                <Wallet className="size-5 text-kaza-blue" />
                <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">
                  Total payé
                </p>
                <p className="font-heading text-2xl font-bold text-kaza-navy">
                  {formatFcfa(fin.totalPaid)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <CalendarCheck className="size-5 text-kaza-green" />
                <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">
                  Visites demandées
                </p>
                <p className="font-heading text-2xl font-bold text-kaza-navy">
                  {visits.length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <Heart className="size-5 text-rose-500" />
                <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">
                  Favoris
                </p>
                <p className="font-heading text-2xl font-bold text-kaza-navy">
                  {saved.length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <Home className="size-5 text-amber-600" />
                <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">
                  Loyer actuel
                </p>
                <p className="font-heading text-2xl font-bold text-kaza-navy">
                  {activeRental ? formatFcfa(activeRental.monthlyRent) : "—"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Évolution des paiements (réel) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="size-5 text-kaza-blue" />
                Évolution de vos paiements
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Loyers réglés via Kaabo — 12 derniers mois
              </p>
            </CardHeader>
            <CardContent>
              {fin.monthlyHistory.length === 0 ? (
                <div className="rounded-lg border border-dashed bg-slate-50/40 px-4 py-10 text-center text-sm text-muted-foreground">
                  Aucun paiement enregistré pour le moment.
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

          {/* Raccourcis */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Link
              href="/tenant/finance"
              className="group flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-kaza-blue/30"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-kaza-navy">
                <Receipt className="size-4 text-kaza-blue" /> Mes finances
              </span>
              <ArrowRight className="size-4 text-gray-300 group-hover:text-kaza-blue" />
            </Link>
            <Link
              href="/tenant/visits"
              className="group flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-kaza-blue/30"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-kaza-navy">
                <CalendarCheck className="size-4 text-kaza-green" /> Mes visites
              </span>
              <ArrowRight className="size-4 text-gray-300 group-hover:text-kaza-blue" />
            </Link>
            <Link
              href="/tenant/saved"
              className="group flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-kaza-blue/30"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-kaza-navy">
                <Heart className="size-4 text-rose-500" /> Mes favoris
              </span>
              <ArrowRight className="size-4 text-gray-300 group-hover:text-kaza-blue" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
