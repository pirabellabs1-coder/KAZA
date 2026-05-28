import type { Metadata } from "next";
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Calendar,
  Download,
  FileText,
  Globe2,
  PercentCircle,
  Receipt,
  TrendingUp,
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

import {
  GEO_HEATMAP,
  PLATFORM_FINANCE_30D,
  RECENT_PAYOUTS,
  REVENUE_WATERFALL,
  formatFcfa,
  formatFcfaShort,
} from "@/lib/mock/admin-platform-data";
import { CountryFlag } from "@/components/shared/country-flag";

export const metadata: Metadata = {
  title: "Finance plateforme — KAZA Admin",
  description: "Contrôle financier complet · revenus, reversements, EBITDA.",
};

// =============================================================================
// Données dérivées
// =============================================================================
const REVENUE_12M = [
  { month: "Juin", revenue: 132_000_000, ebitda: 18_500_000 },
  { month: "Juil", revenue: 138_500_000, ebitda: 20_200_000 },
  { month: "Août", revenue: 145_300_000, ebitda: 22_100_000 },
  { month: "Sep", revenue: 152_800_000, ebitda: 24_500_000 },
  { month: "Oct", revenue: 158_200_000, ebitda: 25_800_000 },
  { month: "Nov", revenue: 162_400_000, ebitda: 27_200_000 },
  { month: "Déc", revenue: 168_900_000, ebitda: 28_800_000 },
  { month: "Jan", revenue: 159_200_000, ebitda: 26_400_000 },
  { month: "Fév", revenue: 164_700_000, ebitda: 27_900_000 },
  { month: "Mar", revenue: 171_200_000, ebitda: 29_500_000 },
  { month: "Avr", revenue: 175_800_000, ebitda: 30_700_000 },
  { month: "Mai", revenue: 178_500_000, ebitda: 31_400_000 },
];

const REVENUE_BREAKDOWN = [
  {
    label: "Commissions",
    value: PLATFORM_FINANCE_30D.commissionsFcfa,
    color: "#1A3A52",
  },
  {
    label: "Abonnements Pro",
    value: PLATFORM_FINANCE_30D.subscriptionsFcfa,
    color: "#1976D2",
  },
  {
    label: "Boosts annonces",
    value: PLATFORM_FINANCE_30D.boostsFcfa,
    color: "#4CAF50",
  },
];

const TOP_REVENUE_SOURCES = [
  { name: "Premier Immobilier (commission)", type: "Agence", amount: 16_800_000 },
  { name: "Dakar Habitat (commission)", type: "Agence", amount: 14_500_000 },
  { name: "Atlantique Habitat (commission)", type: "Agence", amount: 14_200_000 },
  { name: "Abidjan Élite — Plan ELITE", type: "Abonnement", amount: 850_000 },
  { name: "Boost Villa Haie Vive 7j", type: "Boost", amount: 280_000 },
  { name: "Abonnement Premium Atlantique", type: "Abonnement", amount: 145_000 },
  { name: "Boost T4 Cadjèhoun 3j", type: "Boost", amount: 95_000 },
  { name: "Cocotier Pro — Plan STARTER", type: "Abonnement", amount: 89_000 },
  { name: "Boost Studio Ganhi 7j", type: "Boost", amount: 78_000 },
  { name: "Tropic Immo — Plan STARTER", type: "Abonnement", amount: 65_000 },
];

const PAYOUT_STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-amber-100 text-amber-700",
  PAID: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-red-100 text-red-700",
};

const PAYOUT_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Planifié",
  PROCESSING: "En cours",
  PAID: "Payé",
  FAILED: "Échec",
};

const COUNTRY_FLAGS: Record<string, string> = {
  BJ: "🇧🇯",
  CI: "🇨🇮",
  SN: "🇸🇳",
  TG: "🇹🇬",
  BF: "🇧🇫",
  GH: "🇬🇭",
  NG: "🇳🇬",
};

// =============================================================================
// PAGE
// =============================================================================
export default function AdminFinancePage() {
  // GRAPHIQUE 1 — waterfall
  const wW = 800;
  const wH = 320;
  const wPad = { l: 60, r: 16, t: 30, b: 60 };
  const wInnerW = wW - wPad.l - wPad.r;
  const wInnerH = wH - wPad.t - wPad.b;
  const wMaxAbs = Math.max(...REVENUE_WATERFALL.map((r) => Math.abs(r.value)));
  const wBarW = (wInnerW / REVENUE_WATERFALL.length) * 0.55;
  const wStep = wInnerW / REVENUE_WATERFALL.length;
  const wColor = (type: string) =>
    type === "total" ? "#1A3A52" : type === "negative" ? "#EF4444" : "#4CAF50";

  // GRAPHIQUE 2 — donut breakdown
  const totalBreakdown = REVENUE_BREAKDOWN.reduce((s, r) => s + r.value, 0);
  const donutR = 70;
  const donutCirc = 2 * Math.PI * donutR;
  let cumulative = 0;
  const donutSegments = REVENUE_BREAKDOWN.map((item) => {
    const pct = item.value / totalBreakdown;
    const dashArray = pct * donutCirc;
    const dashOffset = -cumulative;
    cumulative += dashArray;
    return { ...item, dashArray, dashOffset, pct };
  });

  // GRAPHIQUE 3 — revenus 12 mois (aire + ligne EBITDA)
  const r3W = 800;
  const r3H = 280;
  const r3Pad = { l: 60, r: 16, t: 24, b: 36 };
  const r3InnerW = r3W - r3Pad.l - r3Pad.r;
  const r3InnerH = r3H - r3Pad.t - r3Pad.b;
  const r3MaxRev = Math.max(...REVENUE_12M.map((m) => m.revenue));
  const r3X = (i: number) =>
    r3Pad.l + (i / (REVENUE_12M.length - 1)) * r3InnerW;
  const r3Y = (v: number) => r3Pad.t + r3InnerH - (v / r3MaxRev) * r3InnerH;
  const revLine = REVENUE_12M.map((m, i) => `${r3X(i)},${r3Y(m.revenue)}`).join(" ");
  const revArea = `${r3Pad.l},${r3Pad.t + r3InnerH} ${revLine} ${r3Pad.l + r3InnerW},${r3Pad.t + r3InnerH}`;
  const ebitdaLine = REVENUE_12M.map((m, i) => `${r3X(i)},${r3Y(m.ebitda)}`).join(" ");

  // geo total
  const geoTotal = GEO_HEATMAP.reduce((s, c) => s + c.revenueFcfa, 0);
  const geoMax = Math.max(...GEO_HEATMAP.map((c) => c.revenueFcfa));

  return (
    <div className="space-y-8 pb-24">
      {/* ================================================================== */}
      {/* HEADER                                                              */}
      {/* ================================================================== */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-kaza-navy lg:text-3xl">
            Finance plateforme
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vue consolidée des revenus, commissions, reversements et EBITDA
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <select
              defaultValue="30j"
              className="cursor-pointer bg-transparent text-sm font-medium text-kaza-navy outline-none"
            >
              <option value="30j">30 derniers jours</option>
              <option value="90j">90 derniers jours</option>
              <option value="ytd">Année en cours (YTD)</option>
              <option value="12m">12 derniers mois</option>
            </select>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* KPI ROW                                                             */}
      {/* ================================================================== */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Revenus bruts (30j)",
            value: formatFcfaShort(PLATFORM_FINANCE_30D.grossRevenueFcfa),
            unit: "FCFA",
            delta: "+8.2%",
            positive: true,
            Icon: TrendingUp,
            tint: "text-kaza-blue",
            bg: "bg-blue-50",
          },
          {
            label: "Reversements bailleurs",
            value: formatFcfaShort(PLATFORM_FINANCE_30D.payoutsFcfa),
            unit: "FCFA",
            delta: "+6.4%",
            positive: true,
            Icon: Banknote,
            tint: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "EBITDA",
            value: formatFcfaShort(PLATFORM_FINANCE_30D.ebitda),
            unit: "FCFA",
            delta: "+11.7%",
            positive: true,
            Icon: Wallet,
            tint: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            label: "Marge EBITDA",
            value: `${PLATFORM_FINANCE_30D.ebitdaMargin}`,
            unit: "%",
            delta: "+1.4 pts",
            positive: true,
            Icon: PercentCircle,
            tint: "text-purple-600",
            bg: "bg-purple-50",
          },
        ].map((k) => {
          const Icon = k.Icon;
          return (
            <Card key={k.label} className="rounded-2xl border-gray-200/80 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${k.bg}`}>
                    <Icon className={`h-5 w-5 ${k.tint}`} />
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      k.positive
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-red-200 bg-red-50 text-red-700"
                    }
                  >
                    {k.positive ? (
                      <ArrowUpRight className="mr-1 h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="mr-1 h-3 w-3" />
                    )}
                    {k.delta}
                  </Badge>
                </div>
                <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {k.label}
                </p>
                <p className="mt-1 font-heading text-3xl font-bold text-kaza-navy">
                  {k.value}{" "}
                  <span className="text-sm font-medium text-muted-foreground">
                    {k.unit}
                  </span>
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ================================================================== */}
      {/* GRAPHIQUE 1 — Waterfall                                             */}
      {/* ================================================================== */}
      <Card className="rounded-2xl border-gray-200/80 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="font-heading text-lg text-kaza-navy">
            Décomposition financière — Revenue waterfall
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Du revenu brut à l&apos;EBITDA · 30 derniers jours
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <svg
              viewBox={`0 0 ${wW} ${wH}`}
              className="h-[320px] w-full min-w-[720px]"
            >
              {/* baseline */}
              <line
                x1={wPad.l}
                x2={wPad.l + wInnerW}
                y1={wPad.t + wInnerH}
                y2={wPad.t + wInnerH}
                stroke="#9CA3AF"
                strokeWidth={1}
              />

              {REVENUE_WATERFALL.map((item, i) => {
                const isPositive = item.value >= 0;
                const h = (Math.abs(item.value) / wMaxAbs) * wInnerH;
                const x = wPad.l + i * wStep + (wStep - wBarW) / 2;
                const y = isPositive
                  ? wPad.t + wInnerH - h
                  : wPad.t + wInnerH;
                const color = wColor(item.type);
                return (
                  <g key={item.label}>
                    {/* bar */}
                    <rect
                      x={x}
                      y={y}
                      width={wBarW}
                      height={h}
                      fill={color}
                      rx={3}
                    />
                    {/* connector dashed */}
                    {i < REVENUE_WATERFALL.length - 1 && (
                      <line
                        x1={x + wBarW}
                        x2={x + wStep}
                        y1={isPositive ? y : y - h}
                        y2={isPositive ? y : y - h}
                        stroke="#94A3B8"
                        strokeDasharray="3 3"
                      />
                    )}
                    {/* value */}
                    <text
                      x={x + wBarW / 2}
                      y={(isPositive ? y : y + h) - 8}
                      textAnchor="middle"
                      className="fill-kaza-navy"
                      fontSize="11"
                      fontWeight="700"
                    >
                      {formatFcfaShort(item.value)}
                    </text>
                    {/* label X */}
                    <text
                      x={x + wBarW / 2}
                      y={wH - 30}
                      textAnchor="middle"
                      className="fill-gray-600"
                      fontSize="10"
                    >
                      {item.label.length > 14
                        ? item.label.slice(0, 13) + "…"
                        : item.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-emerald-500" />
              <span className="text-muted-foreground">Positif</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-red-500" />
              <span className="text-muted-foreground">Négatif</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-kaza-navy" />
              <span className="text-muted-foreground">Total / Sous-total</span>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* DONUT + REVENU 12M                                                  */}
      {/* ================================================================== */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Donut breakdown */}
        <Card className="rounded-2xl border-gray-200/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-lg text-kaza-navy">
              Répartition des revenus
            </CardTitle>
            <p className="text-sm text-muted-foreground">3 sources principales</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-5">
              <div className="relative">
                <svg viewBox="0 0 200 200" className="h-44 w-44">
                  <circle
                    r={donutR}
                    cx={100}
                    cy={100}
                    fill="transparent"
                    stroke="#F1F5F9"
                    strokeWidth={28}
                  />
                  {donutSegments.map((s) => (
                    <circle
                      key={s.label}
                      r={donutR}
                      cx={100}
                      cy={100}
                      fill="transparent"
                      stroke={s.color}
                      strokeWidth={28}
                      strokeDasharray={`${s.dashArray} ${donutCirc - s.dashArray}`}
                      strokeDashoffset={s.dashOffset}
                      transform="rotate(-90 100 100)"
                      strokeLinecap="butt"
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    Total
                  </span>
                  <span className="font-heading text-xl font-bold text-kaza-navy">
                    {formatFcfaShort(totalBreakdown)}
                  </span>
                </div>
              </div>
              <ul className="w-full space-y-2.5">
                {donutSegments.map((s) => (
                  <li key={s.label} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="font-medium text-gray-700">{s.label}</span>
                    </span>
                    <span className="flex items-baseline gap-2">
                      <span className="font-semibold text-kaza-navy">
                        {formatFcfaShort(s.value)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {(s.pct * 100).toFixed(1)}%
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Revenus 12 mois */}
        <Card className="rounded-2xl border-gray-200/80 shadow-sm xl:col-span-2">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-2">
            <div>
              <CardTitle className="font-heading text-lg text-kaza-navy">
                Revenus & EBITDA — 12 mois glissants
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Aire : revenus bruts · ligne : EBITDA
              </p>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-4 rounded-full bg-kaza-blue" />
                <span className="text-muted-foreground">Revenus</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-4 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">EBITDA</span>
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <svg
                viewBox={`0 0 ${r3W} ${r3H}`}
                className="h-[280px] w-full min-w-[600px]"
              >
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1976D2" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#1976D2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                {/* grid Y */}
                {Array.from({ length: 5 }).map((_, i) => {
                  const y = r3Pad.t + (i / 4) * r3InnerH;
                  const v = Math.round((r3MaxRev * (4 - i)) / 4);
                  return (
                    <g key={i}>
                      <line
                        x1={r3Pad.l}
                        x2={r3Pad.l + r3InnerW}
                        y1={y}
                        y2={y}
                        stroke="#E5E7EB"
                        strokeDasharray={i === 4 ? "0" : "2 4"}
                      />
                      <text
                        x={r3Pad.l - 6}
                        y={y + 3}
                        textAnchor="end"
                        className="fill-gray-400"
                        fontSize="10"
                      >
                        {formatFcfaShort(v)}
                      </text>
                    </g>
                  );
                })}

                <polygon points={revArea} fill="url(#revGrad)" />
                <polyline
                  points={revLine}
                  fill="none"
                  stroke="#1976D2"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points={ebitdaLine}
                  fill="none"
                  stroke="#4CAF50"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {REVENUE_12M.map((m, i) => (
                  <g key={m.month}>
                    <circle cx={r3X(i)} cy={r3Y(m.revenue)} r={3} fill="#1976D2" />
                    <circle cx={r3X(i)} cy={r3Y(m.ebitda)} r={3} fill="#4CAF50" />
                    <text
                      x={r3X(i)}
                      y={r3H - 14}
                      textAnchor="middle"
                      className="fill-gray-500"
                      fontSize="10"
                    >
                      {m.month}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ================================================================== */}
      {/* TABLE PAYOUTS                                                       */}
      {/* ================================================================== */}
      <Card className="rounded-2xl border-gray-200/80 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="font-heading text-lg text-kaza-navy">
            Reversements en cours & récents
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {RECENT_PAYOUTS.length} transactions · Mobile Money / Virement / SWIFT
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-y border-gray-200 bg-gray-50/70 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-6 py-3 font-semibold">Bénéficiaire</th>
                  <th className="px-6 py-3 font-semibold">Type</th>
                  <th className="px-6 py-3 text-right font-semibold">Montant</th>
                  <th className="px-6 py-3 font-semibold">Statut</th>
                  <th className="px-6 py-3 font-semibold">Date</th>
                  <th className="px-6 py-3 font-semibold">Méthode</th>
                  <th className="px-6 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_PAYOUTS.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50"
                  >
                    <td className="px-6 py-4 font-semibold text-kaza-navy">
                      {p.beneficiary}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        className={`border-0 ${
                          p.type === "AGENCY"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        } hover:bg-transparent`}
                      >
                        {p.type === "AGENCY" ? "Agence" : "Propriétaire"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-emerald-600">
                      {formatFcfa(p.amountFcfa)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        className={`border-0 ${PAYOUT_STATUS_COLORS[p.status]} hover:bg-transparent`}
                      >
                        {PAYOUT_STATUS_LABELS[p.status]}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-700">
                      {p.paidAt ? `Payé le ${p.paidAt}` : `Prévu le ${p.scheduledAt}`}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600">{p.method}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                          Détail
                        </Button>
                        {p.status === "FAILED" && (
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                            Renvoyer
                          </Button>
                        )}
                        {p.status === "SCHEDULED" && (
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                            Annuler
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* RECETTES PAR PAYS + TOP SOURCES                                     */}
      {/* ================================================================== */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-2xl border-gray-200/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading flex items-center gap-2 text-lg text-kaza-navy">
              <Globe2 className="h-5 w-5 text-kaza-blue" />
              Recettes par pays
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Total : {formatFcfa(geoTotal)}
            </p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3.5">
              {GEO_HEATMAP.filter((c) => c.revenueFcfa > 0).map((c) => {
                const pct = geoTotal > 0 ? (c.revenueFcfa / geoTotal) * 100 : 0;
                const wPct = (c.revenueFcfa / geoMax) * 100;
                return (
                  <li key={c.code}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <CountryFlag code={c.code} className="h-3.5 w-5" title={c.country} />
                        <span className="font-medium text-gray-800">{c.country}</span>
                      </span>
                      <span className="flex items-baseline gap-2">
                        <span className="font-semibold text-kaza-navy">
                          {formatFcfaShort(c.revenueFcfa)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {pct.toFixed(1)}%
                        </span>
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-kaza-blue to-kaza-navy"
                        style={{ width: `${wPct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-lg text-kaza-navy">
              Top 10 sources de revenus
            </CardTitle>
            <p className="text-sm text-muted-foreground">Ce mois</p>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-gray-100">
              {TOP_REVENUE_SOURCES.map((src, i) => (
                <li
                  key={src.name}
                  className="flex items-center justify-between gap-3 px-6 py-3 hover:bg-gray-50/50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-kaza-navy/5 text-xs font-bold text-kaza-navy">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-kaza-navy">
                        {src.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{src.type}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600">
                    {formatFcfaShort(src.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* ================================================================== */}
      {/* TAXES & CONFORMITÉ                                                  */}
      {/* ================================================================== */}
      <Card className="rounded-2xl border-gray-200/80 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="font-heading flex items-center gap-2 text-lg text-kaza-navy">
            <Receipt className="h-5 w-5 text-purple-600" />
            Taxes & conformité fiscale
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            DGI Bénin · TVA 18% · échéance déclaration mensuelle 15 du mois
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                TVA collectée
              </p>
              <p className="mt-1 font-heading text-2xl font-bold text-kaza-navy">
                {formatFcfa(32_130_000)}
              </p>
              <p className="mt-1 text-xs text-emerald-600">+8.4% vs M-1</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                TVA déductible
              </p>
              <p className="mt-1 font-heading text-2xl font-bold text-kaza-navy">
                {formatFcfa(3_630_000)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Frais opérationnels</p>
            </div>
            <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
              <p className="text-xs uppercase tracking-wide text-purple-700">
                TVA à payer
              </p>
              <p className="mt-1 font-heading text-2xl font-bold text-purple-700">
                {formatFcfa(28_500_000)}
              </p>
              <Button size="sm" className="mt-2 bg-purple-600 hover:bg-purple-700">
                <FileText className="mr-1 h-3.5 w-3.5" />
                Déclaration DGI Bénin
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* STICKY EXPORT                                                       */}
      {/* ================================================================== */}
      <div className="fixed bottom-6 right-6 z-30 flex gap-3 lg:bottom-8 lg:right-8">
        <Button
          variant="outline"
          className="rounded-full bg-white shadow-lg backdrop-blur"
        >
          <Download className="mr-2 h-4 w-4" />
          Excel
        </Button>
        <Button className="rounded-full bg-kaza-navy shadow-lg hover:bg-kaza-navy/90">
          <Download className="mr-2 h-4 w-4" />
          Exporter rapport financier PDF
        </Button>
      </div>
    </div>
  );
}
