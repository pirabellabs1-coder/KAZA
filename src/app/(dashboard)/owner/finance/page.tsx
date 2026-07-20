import type { Metadata } from "next";
import {
  ArrowUpRight,
  Building2,
  Calculator,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Download,
  Info,
  Landmark,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataExportButtons } from "@/components/dashboard/data-export-buttons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFcfa, formatFcfaShort } from "@/lib/utils";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { listOwnerPayments } from "@/lib/queries/owner-activity";
import { listWithdrawalRequests } from "@/lib/queries/wallet";

export const metadata: Metadata = {
  title: "Finances propriétaire",
};

// Palette du donut « répartition par bien ».
const DONUT_COLORS = [
  "#1976D2",
  "#4CAF50",
  "#FF9800",
  "#9C27B0",
  "#00BCD4",
  "#E91E63",
  "#795548",
];

const JUSTIFICATIFS: Array<{
  id: string;
  title: string;
  icon: typeof Receipt;
  count: number;
  description: string;
}> = [];

const MONTH_LABELS = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Jun",
  "Jul",
  "Aoû",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

function payoutStatusFromDb(
  status: string,
): "PAID" | "PROCESSING" | "SCHEDULED" {
  const s = status.toUpperCase();
  if (s === "COMPLETED" || s === "PAID" || s === "APPROVED") return "PAID";
  if (s === "PENDING" || s === "SCHEDULED") return "SCHEDULED";
  return "PROCESSING";
}

// =============================================================================
// PAGE
// =============================================================================

export default async function OwnerFinancePage() {
  const user = await getCurrentDisplayUser();
  const userId = user?.id ?? "";

  const [payments, withdrawals] = await Promise.all([
    userId ? listOwnerPayments(userId) : Promise.resolve([]),
    userId ? listWithdrawalRequests(userId) : Promise.resolve([]),
  ]);

  const now = new Date();

  // --- Revenus par mois (12 derniers mois) -----------------------------------
  // On agrège les paiements complétés par mois calendaire.
  const monthBuckets: Array<{ key: string; month: string; revenue: number }> =
    [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthBuckets.push({
      key,
      month: `${MONTH_LABELS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
      revenue: 0,
    });
  }
  const bucketByKey = new Map(monthBuckets.map((b) => [b.key, b]));

  const completedPayments = payments.filter(
    (p) => p.status.toUpperCase() === "COMPLETED",
  );
  for (const p of completedPayments) {
    const ref = p.paidAt ?? p.createdAt;
    if (!ref) continue;
    const d = new Date(ref);
    if (Number.isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const bucket = bucketByKey.get(key);
    if (bucket) bucket.revenue += p.amount;
  }

  const OWNER_MONTHLY_REVENUE = monthBuckets.map((b) => ({
    month: b.month,
    revenue: b.revenue,
    occupancy: 0,
  }));

  // --- Loyers du mois en cours -----------------------------------------------
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const paymentsThisMonth = payments.filter((p) => {
    const ref = p.paidAt ?? p.dueDate ?? p.createdAt;
    if (!ref) return false;
    const d = new Date(ref);
    return d >= monthStart && d < monthEnd;
  });

  const RENT_DUE_THIS_MONTH = paymentsThisMonth.map((p) => {
    const dbStatus = p.status.toUpperCase();
    const ref = p.dueDate ?? p.createdAt;
    const isLate =
      dbStatus !== "COMPLETED" && ref ? new Date(ref) < now : false;
    const status: "RECEIVED" | "PENDING" | "LATE" =
      dbStatus === "COMPLETED" ? "RECEIVED" : isLate ? "LATE" : "PENDING";
    return {
      id: p.id,
      tenant: p.tenantName,
      property: p.propertyTitle,
      expected: p.amount,
      status,
      dueDate: ref ?? now.toISOString(),
    };
  });

  // --- Payouts (demandes de retrait) -----------------------------------------
  const OWNER_PAYOUTS = withdrawals.map((w) => ({
    id: w.id,
    date: w.processedAt ?? w.requestedAt,
    amount: w.amount,
    method: w.method,
    status: payoutStatusFromDb(w.status),
  }));

  // --- Répartition par bien (donut) sur 12 mois ------------------------------
  const byProperty = new Map<string, number>();
  for (const p of completedPayments) {
    byProperty.set(
      p.propertyTitle,
      (byProperty.get(p.propertyTitle) ?? 0) + p.amount,
    );
  }
  const totalByProperty = Array.from(byProperty.values()).reduce(
    (s, v) => s + v,
    0,
  );
  const DONUT_BREAKDOWN = Array.from(byProperty.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([label, amount], i) => ({
      label,
      amount,
      percentage:
        totalByProperty > 0 ? Math.round((amount / totalByProperty) * 100) : 0,
      color: DONUT_COLORS[i % DONUT_COLORS.length],
    }));

  const data = OWNER_MONTHLY_REVENUE;
  const totalRev = data.reduce((s, d) => s + d.revenue, 0);
  const hasRevenue = totalRev > 0;
  const maxRev = hasRevenue ? Math.max(...data.map((d) => d.revenue), 1) : 0;

  const grossRevenue = totalRev;
  const deductibles = 0;
  const taxableIncome = grossRevenue - deductibles;

  // KPIs dérivés des vraies données.
  const rentDueThisMonth = RENT_DUE_THIS_MONTH.filter(
    (r) => r.status !== "RECEIVED",
  ).reduce((s, r) => s + r.expected, 0);
  const payoutsReceived = OWNER_PAYOUTS.filter(
    (p) => p.status === "PAID",
  ).reduce((s, p) => s + p.amount, 0);
  const estimatedTax = Math.round(taxableIncome * 0.25);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-kaza-blue">
            Comptabilité
          </p>
          <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
            Finances propriétaire
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Suivi des revenus locatifs, payouts et fiscalité.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DataExportButtons
            filename="kaabo-comptabilite"
            rows={OWNER_MONTHLY_REVENUE.map((m) => ({
              Mois: m.month,
              "Revenu (FCFA)": m.revenue,
            }))}
          />
        </div>
      </div>

      {/* KPI ROW — valeurs dérivées des paiements / retraits réels */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KpiCard
          label="Revenus 12 mois"
          value={`${formatFcfaShort(grossRevenue)} FCFA`}
          subtitle={
            hasRevenue
              ? "Loyers nets perçus sur 12 mois"
              : "Aucune donnée agrégée"
          }
          icon={Wallet}
        />
        <KpiCard
          label="Loyers à percevoir ce mois"
          value={formatFcfa(rentDueThisMonth)}
          subtitle={
            rentDueThisMonth > 0
              ? "En attente ou en retard"
              : "Aucun loyer en attente"
          }
          icon={CalendarClock}
        />
        <KpiCard
          label="Payouts reçus"
          value={`${formatFcfaShort(payoutsReceived)} FCFA`}
          subtitle={payoutsReceived > 0 ? "Versements confirmés" : "Aucun versement"}
          icon={CheckCircle2}
        />
        <KpiCard
          label="Taxes estimées"
          value={formatFcfa(estimatedTax)}
          subtitle="À provisionner (25%)"
          icon={Landmark}
          subtitleType="warning"
        />
      </div>

      {/* GRAPHIQUE 1 — Revenus mensuels (aire courbée) */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="font-heading text-base">Revenus mensuels — 12 mois</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Loyers nets perçus, valeurs en FCFA
              </p>
            </div>
            <Badge variant="outline" className="border-kaza-blue text-kaza-blue">
              Total : {formatFcfa(totalRev)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {!hasRevenue ? (
            <div className="rounded-lg border border-dashed bg-slate-50/40 px-4 py-10 text-center text-sm text-muted-foreground">
              Aucun revenu agrégé pour le moment.
            </div>
          ) : (
          <div className="overflow-x-auto">
            <svg viewBox="0 0 760 280" className="min-w-[600px] w-full">
              <defs>
                <linearGradient id="ownerRevArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1976D2" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#1976D2" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {[0.25, 0.5, 0.75, 1].map((p) => (
                <line
                  key={p}
                  x1="60"
                  x2="740"
                  y1={40 + 200 * (1 - p)}
                  y2={40 + 200 * (1 - p)}
                  stroke="#E5E7EB"
                  strokeDasharray="4 4"
                />
              ))}
              {[0, 0.25, 0.5, 0.75, 1].map((p) => (
                <text
                  key={p}
                  x="54"
                  y={40 + 200 * (1 - p) + 4}
                  textAnchor="end"
                  className="fill-muted-foreground"
                  fontSize="10"
                >
                  {formatFcfaShort(maxRev * p)}
                </text>
              ))}
              {(() => {
                const slot = (740 - 60) / (data.length - 1);
                const points = data.map((d, i) => {
                  const x = 60 + i * slot;
                  const y = 40 + 200 - (d.revenue / maxRev) * 200;
                  return [x, y] as const;
                });
                const line = points
                  .map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`)
                  .join(" ");
                const area = `${line} L ${points[points.length - 1][0]} 240 L ${points[0][0]} 240 Z`;
                return (
                  <>
                    <path d={area} fill="url(#ownerRevArea)" />
                    <path
                      d={line}
                      fill="none"
                      stroke="#1976D2"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {points.map((p, i) => (
                      <g key={i}>
                        <circle
                          cx={p[0]}
                          cy={p[1]}
                          r={4}
                          fill="#fff"
                          stroke="#1976D2"
                          strokeWidth={2}
                        />
                        <text
                          x={p[0]}
                          y={p[1] - 10}
                          textAnchor="middle"
                          fontSize="9"
                          className="fill-kaza-navy"
                          fontWeight="600"
                        >
                          {formatFcfaShort(data[i]!.revenue)}
                        </text>
                      </g>
                    ))}
                  </>
                );
              })()}
              {data.map((d, i) => {
                const slot = (740 - 60) / (data.length - 1);
                const x = 60 + i * slot;
                return (
                  <text
                    key={d.month}
                    x={x}
                    y={262}
                    textAnchor="middle"
                    className="fill-muted-foreground"
                    fontSize="10"
                  >
                    {d.month.replace(" 25", "").replace(" 26", "")}
                  </text>
                );
              })}
            </svg>
          </div>
          )}
        </CardContent>
      </Card>

      {/* GRAPHIQUE 2 — Décomposition mensuelle (donut) + Table loyers du mois */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-heading text-base">
              Décomposition du mois
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Répartition des recettes
            </p>
          </CardHeader>
          <CardContent>
            {DONUT_BREAKDOWN.length === 0 ? (
              <div className="rounded-lg border border-dashed bg-slate-50/40 px-4 py-10 text-center text-sm text-muted-foreground">
                Aucune recette à répartir pour le moment.
              </div>
            ) : (
            <div className="flex flex-col items-center gap-4">
              <Donut
                data={DONUT_BREAKDOWN}
                totalLabel="Total"
                totalValue={formatFcfaShort(
                  DONUT_BREAKDOWN.reduce((s, x) => s + x.amount, 0),
                )}
              />
              <div className="w-full space-y-2">
                {DONUT_BREAKDOWN.map((s) => (
                  <div key={s.label} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-3 rounded-sm"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="font-medium">{s.label}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="font-mono">{formatFcfaShort(s.amount)}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {s.percentage}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}
          </CardContent>
        </Card>

        {/* Table loyers du mois */}
        <Card className="rounded-2xl shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading text-base">
              Loyers du mois en cours
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Mai 2026 — statut au {new Date().toLocaleDateString("fr-FR")}
            </p>
          </CardHeader>
          <CardContent>
            {RENT_DUE_THIS_MONTH.length === 0 ? (
              <div className="rounded-lg border border-dashed bg-slate-50/40 px-4 py-10 text-center text-sm text-muted-foreground">
                Aucun loyer enregistré ce mois-ci.
              </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 font-medium">Locataire</th>
                    <th className="pb-2 font-medium">Propriété</th>
                    <th className="pb-2 text-right font-medium">Attendu</th>
                    <th className="pb-2 font-medium">Statut</th>
                    <th className="pb-2 font-medium">Échéance</th>
                    <th className="pb-2 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {RENT_DUE_THIS_MONTH.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 font-medium">{r.tenant}</td>
                      <td className="py-2.5 text-muted-foreground">{r.property}</td>
                      <td className="py-2.5 text-right font-mono">
                        {formatFcfa(r.expected)}
                      </td>
                      <td className="py-2.5">
                        <RentStatusBadge status={r.status} />
                      </td>
                      <td className="py-2.5 text-muted-foreground">
                        {new Date(r.dueDate).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="py-2.5 text-right">
                        <Button size="sm" variant="outline" className="h-7 text-[11px]">
                          {r.status === "RECEIVED" ? "Voir détail" : "Relancer"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section "Mes payouts" */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="font-heading text-base">Mes payouts</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Versements depuis votre Kaabo Wallet vers compte bancaire
              </p>
            </div>
            <Badge variant="outline" className="border-kaza-green text-kaza-green">
              {formatFcfa(
                OWNER_PAYOUTS.filter((p) => p.status === "PAID").reduce(
                  (s, p) => s + p.amount,
                  0,
                ),
              )}{" "}
              reçus 12 mois
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {OWNER_PAYOUTS.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-slate-50/40 px-4 py-10 text-center text-sm text-muted-foreground">
              Aucun payout enregistré pour le moment.
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 text-right font-medium">Montant</th>
                  <th className="pb-2 font-medium">Méthode</th>
                  <th className="pb-2 font-medium">Statut</th>
                  <th className="pb-2 text-right font-medium">Justificatif</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {OWNER_PAYOUTS.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 text-muted-foreground">
                      {new Date(p.date).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="py-2.5 text-right font-mono font-semibold text-kaza-green">
                      {formatFcfa(p.amount)}
                    </td>
                    <td className="py-2.5 text-muted-foreground">{p.method}</td>
                    <td className="py-2.5">
                      <PayoutStatusBadge status={p.status} />
                    </td>
                    <td className="py-2.5 text-right">
                      <Button size="sm" variant="ghost" className="h-7 text-[11px]">
                        <Download className="mr-1 size-3" />
                        Téléchar.
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Section "Fiscalité Bénin" — valeurs à 0 tant que la DB n'est pas branchée */}
      <div>
        <h2 className="mb-3 font-heading text-base font-semibold text-foreground">
          Fiscalité Bénin
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Building2 className="size-3.5" />
                Recettes brutes 12 mois
              </div>
              <p className="mt-2 font-heading text-lg font-bold text-foreground">
                {formatFcfa(grossRevenue)}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Loyers + charges récupérables
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calculator className="size-3.5" />
                Charges déductibles
              </div>
              <p className="mt-2 font-heading text-lg font-bold text-foreground">
                {formatFcfa(deductibles)}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Frais agence, travaux, assurance
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm border-kaza-blue/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-kaza-blue">
                <Landmark className="size-3.5" />
                Revenus imposables
              </div>
              <p className="mt-2 font-heading text-lg font-bold text-kaza-navy">
                {formatFcfa(taxableIncome)}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Base de calcul de l&apos;impôt foncier
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <Info className="mt-0.5 size-5 shrink-0 text-amber-600" />
          <div className="text-sm text-amber-900">
            <p className="font-semibold">À retenir — Fiscalité immobilière Bénin</p>
            <p className="mt-1 text-amber-800">
              Au Bénin, les revenus fonciers sont imposés au taux de 25%.
              Déclaration annuelle à la DGI avant le 31 mars. Kaabo vous
              accompagne dans la préparation de votre déclaration.
            </p>
          </div>
        </div>
      </div>

      {/* Section "Justificatifs" */}
      <div>
        <h2 className="mb-3 font-heading text-base font-semibold text-foreground">
          Justificatifs
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {JUSTIFICATIFS.map((j) => (
            <Card key={j.id} className="rounded-2xl shadow-sm">
              <CardContent className="p-4">
                <div className="flex size-9 items-center justify-center rounded-lg bg-kaza-navy/5 text-kaza-navy">
                  <j.icon className="size-4" />
                </div>
                <p className="mt-3 font-heading text-sm font-semibold">
                  {j.title}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {j.description}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 h-8 w-full text-xs"
                >
                  <Download className="mr-1.5 size-3.5" />
                  ZIP 12 mois
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Footer info */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <ClipboardList className="size-3.5" />
          Données issues de votre activité Kaabo Wallet
        </span>
        <span className="flex items-center gap-1.5">
          <TrendingUp className="size-3.5 text-kaza-green" />
          Croissance annuelle +12%
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function KpiCard({
  label,
  value,
  subtitle,
  subtitleType = "neutral",
  icon: Icon,
}: {
  label: string;
  value: string;
  subtitle?: string;
  subtitleType?: "positive" | "negative" | "warning" | "neutral";
  icon: React.ComponentType<{ className?: string }>;
}) {
  const subColor =
    subtitleType === "positive"
      ? "text-kaza-green"
      : subtitleType === "negative"
        ? "text-red-600"
        : subtitleType === "warning"
          ? "text-amber-600"
          : "text-muted-foreground";

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <div className="flex size-7 items-center justify-center rounded-lg bg-slate-100">
            <Icon className="size-3.5 text-kaza-navy" />
          </div>
        </div>
        <p className="mt-2 font-heading text-lg font-bold text-foreground">
          {value}
        </p>
        {subtitle && (
          <p className={`mt-1 text-[11px] font-semibold ${subColor}`}>
            {subtitleType === "positive" && (
              <ArrowUpRight className="mr-0.5 inline size-3" />
            )}
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function RentStatusBadge({
  status,
}: {
  status: "RECEIVED" | "PENDING" | "LATE";
}) {
  const config = {
    RECEIVED: { label: "Reçu", className: "bg-emerald-100 text-emerald-700" },
    PENDING: { label: "En attente", className: "bg-amber-100 text-amber-700" },
    LATE: { label: "En retard", className: "bg-red-100 text-red-700" },
  }[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}

function PayoutStatusBadge({
  status,
}: {
  status: "PAID" | "PROCESSING" | "SCHEDULED";
}) {
  const config = {
    PAID: { label: "Payé", className: "bg-emerald-100 text-emerald-700" },
    PROCESSING: { label: "En cours", className: "bg-blue-100 text-blue-700" },
    SCHEDULED: { label: "Programmé", className: "bg-slate-100 text-slate-700" },
  }[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}

function Donut({
  data,
  totalLabel,
  totalValue,
}: {
  data: { label: string; percentage: number; color: string }[];
  totalLabel: string;
  totalValue: string;
}) {
  const size = 180;
  const radius = 70;
  const stroke = 22;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="#F1F5F9"
        strokeWidth={stroke}
      />
      {data.map((d, i) => {
        const dash = (d.percentage / 100) * circumference;
        const seg = (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={d.color}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${circumference}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="butt"
          />
        );
        // eslint-disable-next-line react-hooks/immutability -- accumulateur local pour un calcul de graphe (cumul angles/positions) — pur pour des props identiques
        offset += dash;
        return seg;
      })}
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        className="fill-muted-foreground"
        fontSize="10"
      >
        {totalLabel}
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        className="fill-foreground"
        fontSize="16"
        fontWeight="700"
      >
        {totalValue}
      </text>
    </svg>
  );
}
