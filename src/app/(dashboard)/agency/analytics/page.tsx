import type { Metadata } from "next";
import {
  TrendingUp,
  TrendingDown,
  Download,
  FileSpreadsheet,
  FileText,
  Star,
  MapPin,
  ArrowUpDown,
  Lightbulb,
  Sparkles,
  Target,
  Award,
  BarChart3,
  Users,
  PenLine,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatFcfaShort } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types & fallbacks locaux — à brancher quand les tables analytics seront
// en place (revenus mensuels, funnel CRM, occupation portfolio, sources de
// leads, team_members).
// ---------------------------------------------------------------------------

type AgentRole =
  | "Directrice"
  | "Manager"
  | "Agent senior"
  | "Agent"
  | "Stagiaire"
  | "Comptable"
  | "Gestionnaire";

interface AgentMember {
  id: string;
  name: string;
  role: AgentRole;
  email: string;
  initials: string;
  color: string;
  visitsThisMonth: number;
  signaturesYTD: number;
  caGeneratedFcfa: number;
  rating: number;
}

interface MonthlyRevenuePoint {
  month: string;
  value: number;
  signatures: number;
  visits: number;
}

interface FunnelStep {
  label: string;
  value: number;
  color: string;
}

interface OccupancyBucket {
  type: string;
  total: number;
  rented: number;
  color: string;
}

interface LeadSource {
  source: string;
  count: number;
  percentage: number;
}

// Fallback vide — à brancher quand la table agency_profiles sera en place.
const AGENCY_PROFILE = {
  name: "—",
};

// Fallback vide — à brancher quand la table team_members sera en place.
const AGENCY_TEAM: AgentMember[] = [];

// Fallback vide — à brancher quand la vue analytics_monthly_revenue sera en place.
const MONTHLY_REVENUE: MonthlyRevenuePoint[] = [];

// Fallback vide — à brancher quand la vue analytics_funnel sera en place.
const CONVERSION_FUNNEL: FunnelStep[] = [];

// Fallback vide — à brancher quand la vue analytics_occupancy sera en place.
const OCCUPANCY_BY_TYPE: OccupancyBucket[] = [];

// Fallback vide — à brancher quand la vue analytics_lead_sources sera en place.
const LEAD_SOURCES: LeadSource[] = [];

export const metadata: Metadata = {
  title: "Analytics — KAZA Pro Agence",
  description:
    "Analytics avancées de l'agence : revenus, conversion, occupation, sources de leads et performance des agents.",
};

// ---------------------------------------------------------------------------
// Helpers SVG
// ---------------------------------------------------------------------------

function buildAreaPath(
  values: number[],
  width: number,
  height: number,
  padding = 8,
) {
  if (values.length === 0) return { area: "", line: "" };
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const stepX = (width - padding * 2) / (values.length - 1);
  const points = values.map((v, i) => {
    const x = padding + i * stepX;
    const y = height - padding - ((v - min) / range) * (height - padding * 2);
    return { x, y };
  });
  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");
  const area = `${line} L ${points[points.length - 1].x.toFixed(2)} ${height - padding} L ${points[0].x.toFixed(2)} ${height - padding} Z`;
  return { area, line };
}

function buildSparkline(values: number[], width = 80, height = 28, padding = 2) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const stepX = (width - padding * 2) / (values.length - 1);
  return values
    .map((v, i) => {
      const x = padding + i * stepX;
      const y = height - padding - ((v - min) / range) * (height - padding * 2);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

// ---------------------------------------------------------------------------
// Données dérivées
// ---------------------------------------------------------------------------

const periods = [
  { id: "7d", label: "7 jours" },
  { id: "30d", label: "30 jours" },
  { id: "90d", label: "90 jours" },
  { id: "12m", label: "12 mois", active: true },
  { id: "ytd", label: "YTD" },
  { id: "custom", label: "Personnalisé" },
];

const topNeighborhoods = [
  { name: "Haie Vive (Cotonou)", value: 4_820, share: 100 },
  { name: "Cadjèhoun (Cotonou)", value: 4_120, share: 86 },
  { name: "Fidjrossè (Cotonou)", value: 3_580, share: 74 },
  { name: "Les Cocotiers (Cotonou)", value: 2_940, share: 61 },
  { name: "Calavi Akassato", value: 2_310, share: 48 },
];

const insights = [
  {
    icon: Sparkles,
    text: "Vos annonces premium génèrent 3,2× plus de contacts que les annonces standard.",
  },
  {
    icon: Target,
    text: "Le taux de conversion visite → signature progresse de +6 points sur 30 jours.",
  },
  {
    icon: Award,
    text: "Komi Agbeko reste l'agent le plus performant : 67 signatures YTD et 24,2 M FCFA générés.",
  },
  {
    icon: TrendingUp,
    text: "Le créneau samedi 10h-12h concentre 41 % de vos visites — pensez à doubler vos disponibilités.",
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AgencyAnalyticsPage() {
  // ---- KPI sparklines (12 derniers mois) ----
  const revenueValues = MONTHLY_REVENUE.map((m) => m.value);
  const signatureValues = MONTHLY_REVENUE.map((m) => m.signatures);
  const visitsValues = MONTHLY_REVENUE.map((m) => m.visits);
  const occupancyValues = [68.2, 69.1, 70.4, 71.0, 71.8, 72.3, 72.9, 73.4, 73.8, 74.1, 74.3, 74.5];
  const satisfactionValues = [4.5, 4.5, 4.6, 4.6, 4.6, 4.6, 4.7, 4.6, 4.7, 4.7, 4.7, 4.7];

  // ---- Graphique 1 : Revenus 12 mois ----
  const chartWidth = 720;
  const chartHeight = 240;
  const { area: revArea, line: revLine } = buildAreaPath(
    revenueValues,
    chartWidth,
    chartHeight,
  );
  const revAverage =
    revenueValues.length > 0
      ? revenueValues.reduce((acc, v) => acc + v, 0) / revenueValues.length
      : 0;
  const revMax = revenueValues.length > 0 ? Math.max(...revenueValues) : 0;
  const revMin = revenueValues.length > 0 ? Math.min(...revenueValues) : 0;
  const revRange = revMax - revMin || 1;
  const padding = 8;
  const avgY =
    chartHeight - padding - ((revAverage - revMin) / revRange) * (chartHeight - padding * 2);

  // ---- Graphique 2 : Funnel conversion ----
  const funnelMax = CONVERSION_FUNNEL[0]?.value ?? 0;

  // ---- Graphique 4 : Donut leads ----
  const donutSize = 220;
  const donutStroke = 32;
  const donutRadius = (donutSize - donutStroke) / 2;
  const donutCircum = 2 * Math.PI * donutRadius;
  let donutOffset = 0;
  const donutSegments = LEAD_SOURCES.map((src, idx) => {
    const colors = ["#1A3A52", "#1976D2", "#4CAF50", "#F59E0B", "#8B5CF6"];
    const length = (src.percentage / 100) * donutCircum;
    const seg = {
      ...src,
      color: colors[idx % colors.length],
      length,
      offset: donutOffset,
    };
    donutOffset += length;
    return seg;
  });

  // ---- Table agents triée par CA généré ----
  const sortedAgents = [...AGENCY_TEAM]
    .filter((a) => a.visitsThisMonth > 0)
    .sort((a, b) => b.caGeneratedFcfa - a.caGeneratedFcfa);

  return (
    <div className="space-y-8">
      {/* ============================================================== */}
      {/* HEADER                                                          */}
      {/* ============================================================== */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-kaza-navy">
            Analytics — {AGENCY_PROFILE.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vue 360° sur la performance de votre agence — données du 1<sup>er</sup> juin 2025 au 27 mai 2026.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm">
            <FileText className="size-4" /> Exporter PDF
          </Button>
          <Button variant="outline" size="sm">
            <FileSpreadsheet className="size-4" /> Exporter Excel
          </Button>
        </div>
      </div>

      {/* Sélecteur période — visuel, mode statique */}
      <div className="inline-flex flex-wrap items-center gap-1 rounded-2xl border bg-muted/40 p-1">
        {periods.map((p) => (
          <span
            key={p.id}
            className={cn(
              "rounded-xl px-3.5 py-1.5 text-xs font-medium transition-colors",
              p.active
                ? "bg-white text-kaza-navy shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:text-kaza-navy",
            )}
          >
            {p.label}
          </span>
        ))}
      </div>

      {/* ============================================================== */}
      {/* KPI ROW                                                         */}
      {/* ============================================================== */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="CA mensuel"
          value={`${formatFcfaShort(16_800_000)} FCFA`}
          variation="+11 %"
          variationType="positive"
          subtitle="vs. avril 2026"
          spark={revenueValues}
          color="#1976D2"
          Icon={TrendingUp}
        />
        <KpiCard
          label="Signatures du mois"
          value="12"
          variation="+20 %"
          variationType="positive"
          subtitle="vs. mois dernier"
          spark={signatureValues}
          color="#4CAF50"
          Icon={PenLine}
        />
        <KpiCard
          label="Taux d'occupation"
          value="74,5 %"
          variation="+3,2 pts"
          variationType="positive"
          subtitle="portefeuille global"
          spark={occupancyValues}
          color="#1A3A52"
          Icon={BarChart3}
        />
        <KpiCard
          label="Satisfaction client"
          value="4,7 / 5"
          variation="+0,1"
          variationType="positive"
          subtitle="moyenne 30 j"
          spark={satisfactionValues}
          color="#F59E0B"
          Icon={Star}
        />
      </div>

      {/* ============================================================== */}
      {/* GRAPHIQUE 1 — REVENUS 12 MOIS                                   */}
      {/* ============================================================== */}
      <Card className="rounded-2xl">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 font-heading">
              <TrendingUp className="size-5 text-kaza-blue" /> Revenus mensuels
            </CardTitle>
            <CardDescription>
              CA cumulé sur 12 mois — moyenne {formatFcfaShort(revAverage * 1000)} FCFA / mois
            </CardDescription>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-full bg-kaza-blue" />
              CA mensuel
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="inline-block h-px w-4 border-t border-dashed border-muted-foreground" />
              Moyenne
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="h-72 w-full min-w-[600px]"
              role="img"
              aria-label="Revenus mensuels sur 12 mois"
            >
              <defs>
                <linearGradient id="analyticsRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1976D2" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#1976D2" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0.25, 0.5, 0.75].map((p) => (
                <line
                  key={p}
                  x1="8"
                  x2={chartWidth - 8}
                  y1={chartHeight * p}
                  y2={chartHeight * p}
                  stroke="#E5E7EB"
                  strokeDasharray="4 4"
                />
              ))}
              {/* Ligne moyenne */}
              <line
                x1="8"
                x2={chartWidth - 8}
                y1={avgY}
                y2={avgY}
                stroke="#9CA3AF"
                strokeDasharray="6 4"
                strokeWidth="1.5"
              />
              <path d={revArea} fill="url(#analyticsRevGrad)" />
              <path
                d={revLine}
                fill="none"
                stroke="#1976D2"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {revenueValues.map((v, i) => {
                const stepX = (chartWidth - 16) / (revenueValues.length - 1);
                const x = 8 + i * stepX;
                const y =
                  chartHeight -
                  8 -
                  ((v - revMin) / revRange) * (chartHeight - 16);
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="4" fill="#1976D2" />
                    <circle
                      cx={x}
                      cy={y}
                      r="10"
                      fill="#1976D2"
                      fillOpacity="0"
                      className="hover:fill-opacity-15"
                    >
                      <title>
                        {MONTHLY_REVENUE[i].month} — {formatFcfaShort(v * 1000)} FCFA
                      </title>
                    </circle>
                  </g>
                );
              })}
            </svg>
            <div className="mt-2 grid grid-cols-12 gap-1 px-2 text-center text-[10px] uppercase tracking-wider text-muted-foreground">
              {MONTHLY_REVENUE.map((m) => (
                <span key={m.month} className="truncate">
                  {m.month}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ============================================================== */}
      {/* GRAPHIQUE 2 — FUNNEL                                            */}
      {/* ============================================================== */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading">
            <Target className="size-5 text-kaza-blue" /> Funnel de conversion
          </CardTitle>
          <CardDescription>
            De la vue d'une annonce jusqu'à la signature du contrat.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {CONVERSION_FUNNEL.map((step, idx) => {
              const width = (step.value / funnelMax) * 100;
              const prev = idx > 0 ? CONVERSION_FUNNEL[idx - 1].value : null;
              const conversion =
                prev !== null ? ((step.value / prev) * 100).toFixed(1) : null;
              return (
                <div key={step.label} className="space-y-1.5">
                  {conversion !== null && (
                    <p className="ml-3 text-[11px] font-medium text-muted-foreground">
                      ↓ {conversion} % de {CONVERSION_FUNNEL[idx - 1].label.toLowerCase()} →{" "}
                      {step.label.toLowerCase()}
                    </p>
                  )}
                  <div className="relative h-14 overflow-hidden rounded-xl bg-muted/40">
                    <div
                      className="absolute inset-y-0 left-0 flex items-center justify-between rounded-xl px-4 text-white shadow-sm transition-all"
                      style={{
                        width: `${width}%`,
                        backgroundColor: step.color,
                      }}
                    >
                      <span className="text-sm font-medium">{step.label}</span>
                      <span className="text-base font-bold tabular-nums">
                        {new Intl.NumberFormat("fr-FR").format(step.value)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 grid grid-cols-1 gap-3 rounded-xl bg-muted/30 p-4 sm:grid-cols-3">
            <FunnelMini label="Taux contact" value="6,5 %" hint="Vues → contacts" />
            <FunnelMini label="Taux visite" value="28,7 %" hint="Contacts → visites" />
            <FunnelMini label="Taux signature" value="44,9 %" hint="Offres → signatures" />
          </div>
        </CardContent>
      </Card>

      {/* ============================================================== */}
      {/* GRAPHIQUES 3 + 4 — OCCUPATION + DONUT                           */}
      {/* ============================================================== */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Graphique 3 : Occupation par type */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <BarChart3 className="size-5 text-kaza-blue" /> Occupation par type de bien
            </CardTitle>
            <CardDescription>
              Loués / Total — moyenne portefeuille {74.5} %
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 items-end gap-3 sm:gap-5">
              {OCCUPANCY_BY_TYPE.map((t) => {
                const pct = Math.round((t.rented / t.total) * 100);
                const maxAll = Math.max(...OCCUPANCY_BY_TYPE.map((x) => x.total));
                const totalH = (t.total / maxAll) * 180;
                const rentedH = (t.rented / maxAll) * 180;
                return (
                  <div key={t.type} className="flex flex-col items-center gap-2">
                    <span className="text-xs font-bold text-kaza-navy">{pct}%</span>
                    <div className="relative flex w-full max-w-[60px] flex-col items-center justify-end" style={{ height: 180 }}>
                      <div
                        className="absolute bottom-0 w-full rounded-t-md bg-muted"
                        style={{ height: totalH }}
                      />
                      <div
                        className="absolute bottom-0 w-full rounded-t-md transition-all"
                        style={{ height: rentedH, backgroundColor: t.color }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium text-foreground">{t.type}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {t.rented}/{t.total}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Graphique 4 : Donut sources de leads */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <Users className="size-5 text-kaza-blue" /> Sources des leads
            </CardTitle>
            <CardDescription>
              Origine des {LEAD_SOURCES.reduce((a, s) => a + s.count, 0)} leads des 30 derniers jours.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
              <div className="relative shrink-0">
                <svg
                  viewBox={`0 0 ${donutSize} ${donutSize}`}
                  className="h-52 w-52"
                  role="img"
                  aria-label="Répartition des sources de leads"
                >
                  <g transform={`rotate(-90 ${donutSize / 2} ${donutSize / 2})`}>
                    <circle
                      cx={donutSize / 2}
                      cy={donutSize / 2}
                      r={donutRadius}
                      fill="none"
                      stroke="#F3F4F6"
                      strokeWidth={donutStroke}
                    />
                    {donutSegments.map((seg) => (
                      <circle
                        key={seg.source}
                        cx={donutSize / 2}
                        cy={donutSize / 2}
                        r={donutRadius}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth={donutStroke}
                        strokeDasharray={`${seg.length} ${donutCircum - seg.length}`}
                        strokeDashoffset={-seg.offset}
                      />
                    ))}
                  </g>
                </svg>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    Total
                  </span>
                  <span className="font-heading text-2xl font-bold text-kaza-navy">
                    {LEAD_SOURCES.reduce((a, s) => a + s.count, 0)}
                  </span>
                  <span className="text-[11px] text-muted-foreground">leads</span>
                </div>
              </div>
              <ul className="grid w-full flex-1 gap-2">
                {donutSegments.map((seg) => (
                  <li
                    key={seg.source}
                    className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2"
                  >
                    <span className="flex items-center gap-2 text-sm text-foreground">
                      <span
                        className="inline-block size-3 rounded-sm"
                        style={{ backgroundColor: seg.color }}
                      />
                      {seg.source}
                    </span>
                    <span className="flex items-center gap-3 text-xs">
                      <span className="text-muted-foreground tabular-nums">
                        {seg.count}
                      </span>
                      <span className="font-bold text-kaza-navy tabular-nums">
                        {seg.percentage}%
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================================== */}
      {/* GRAPHIQUE 5 — TOP 5 QUARTIERS                                   */}
      {/* ============================================================== */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading">
            <MapPin className="size-5 text-kaza-blue" /> Top 5 quartiers — CA généré
          </CardTitle>
          <CardDescription>
            Quartiers les plus performants des 90 derniers jours (montants en kFCFA).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {topNeighborhoods.map((q, idx) => (
              <li key={q.name} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-kaza-blue/10 text-[11px] font-bold text-kaza-blue">
                      {idx + 1}
                    </span>
                    {q.name}
                  </span>
                  <span className="text-sm font-bold text-kaza-navy tabular-nums">
                    {new Intl.NumberFormat("fr-FR").format(q.value)} k
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-kaza-navy to-kaza-blue transition-all"
                    style={{ width: `${q.share}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* ============================================================== */}
      {/* TABLE — PERFORMANCE PAR AGENT                                   */}
      {/* ============================================================== */}
      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 font-heading">
              <Users className="size-5 text-kaza-blue" /> Performance par agent
            </CardTitle>
            <CardDescription>
              Classement trié par CA généré (année en cours).
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm">
            <Download className="size-4" /> Exporter
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <span className="inline-flex items-center gap-1">
                    Agent <ArrowUpDown className="size-3" />
                  </span>
                </TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead className="text-right">
                  <span className="inline-flex items-center gap-1">
                    Visites mois <ArrowUpDown className="size-3" />
                  </span>
                </TableHead>
                <TableHead className="text-right">
                  <span className="inline-flex items-center gap-1">
                    Signatures YTD <ArrowUpDown className="size-3" />
                  </span>
                </TableHead>
                <TableHead className="text-right">
                  <span className="inline-flex items-center gap-1">
                    CA généré <ArrowUpDown className="size-3" />
                  </span>
                </TableHead>
                <TableHead className="text-right">Note</TableHead>
                <TableHead className="text-right">
                  <span className="inline-flex items-center gap-1">
                    Conversion <ArrowUpDown className="size-3" />
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAgents.map((agent) => {
                const conv =
                  agent.visitsThisMonth > 0
                    ? Math.min(
                        99,
                        Math.round((agent.signaturesYTD / (agent.visitsThisMonth * 12)) * 100),
                      )
                    : 0;
                return (
                  <TableRow key={agent.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "flex size-9 items-center justify-center rounded-full text-xs font-bold text-white",
                            agent.color,
                          )}
                        >
                          {agent.initials}
                        </span>
                        <div>
                          <p className="font-medium text-foreground">{agent.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {agent.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-medium">
                        {agent.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {agent.visitsThisMonth}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {agent.signaturesYTD}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-kaza-navy tabular-nums">
                      {formatFcfaShort(agent.caGeneratedFcfa)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center gap-1">
                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                        <span className="tabular-nums">{agent.rating.toFixed(1)}</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                          conv >= 30 && "bg-emerald-100 text-emerald-700",
                          conv >= 15 && conv < 30 && "bg-amber-100 text-amber-700",
                          conv < 15 && "bg-slate-100 text-slate-600",
                        )}
                      >
                        {conv}%
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ============================================================== */}
      {/* INSIGHTS                                                        */}
      {/* ============================================================== */}
      <Card className="rounded-2xl border-kaza-blue/20 bg-gradient-to-br from-kaza-blue/5 to-kaza-navy/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-kaza-navy">
            <Lightbulb className="size-5 text-amber-500" /> Insights de la semaine
          </CardTitle>
          <CardDescription>
            Recommandations automatiques basées sur vos données 30 j.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 sm:grid-cols-2">
            {insights.map((ins, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-xl border border-kaza-blue/10 bg-white/70 p-4 shadow-sm"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-kaza-blue/10 text-kaza-blue">
                  <ins.icon className="size-4" />
                </span>
                <p className="text-sm leading-relaxed text-foreground">{ins.text}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sous-composants
// ---------------------------------------------------------------------------

interface KpiCardProps {
  label: string;
  value: string;
  variation: string;
  variationType: "positive" | "negative";
  subtitle: string;
  spark: number[];
  color: string;
  Icon: React.ComponentType<{ className?: string }>;
}

function KpiCard({
  label,
  value,
  variation,
  variationType,
  subtitle,
  spark,
  color,
  Icon,
}: KpiCardProps) {
  const sparkPath = buildSparkline(spark);
  const positive = variationType === "positive";
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
          <Icon className="size-5 text-kaza-navy" />
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
            positive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700",
          )}
        >
          {positive ? (
            <TrendingUp className="size-3" />
          ) : (
            <TrendingDown className="size-3" />
          )}
          {variation}
        </span>
      </div>
      <div className="mt-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 font-heading text-2xl font-bold text-kaza-navy">
          {value}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>
      </div>
      <div className="mt-3">
        <svg
          viewBox="0 0 80 28"
          className="h-8 w-full"
          preserveAspectRatio="none"
          role="img"
          aria-label={`Tendance ${label}`}
        >
          <path
            d={sparkPath}
            fill="none"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

function FunnelMini({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-lg bg-white p-3 text-center shadow-sm">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-heading text-xl font-bold text-kaza-navy">{value}</p>
      <p className="text-[10px] text-muted-foreground">{hint}</p>
    </div>
  );
}
