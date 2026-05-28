import type { Metadata } from "next";
import Link from "next/link";
import {
  Users,
  Building2,
  Wallet,
  ShieldCheck,
  ArrowRight,
  ArrowUpRight,
  AlertTriangle,
  Info,
  XCircle,
  CheckCircle2,
  Activity,
  CreditCard,
  FileWarning,
  UserCog,
  HomeIcon,
  Server,
  Cpu,
  Star,
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
  PLATFORM_OVERVIEW,
  USER_GROWTH,
  PLATFORM_REVENUE,
  USER_DISTRIBUTION,
  PROPERTIES_BY_CITY,
  DAILY_ACTIVITY,
  TOP_AGENCIES,
  RECENT_ALERTS,
  SYSTEM_HEALTH,
  formatFcfa,
  formatFcfaShort,
  formatNumber,
} from "@/lib/mock/admin-data";
import { getAdminStats } from "@/lib/queries/admin";

export const metadata: Metadata = {
  title: "Centre de contrôle — KAZA Admin",
  description: "Vue temps réel de la plateforme KAZA.",
};

// Force dynamic : le dashboard admin doit toujours refléter l'état réel de la DB.
export const dynamic = "force-dynamic";

// =============================================================================
// Sparkline component (inline pure-SVG)
// =============================================================================
function Sparkline({
  values,
  color,
  fill,
}: {
  values: number[];
  color: string;
  fill?: string;
}) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const points = values
    .map(
      (v, i) =>
        `${(i * 100) / (values.length - 1)},${30 - ((v - min) / range) * 26 - 2}`
    )
    .join(" ");
  const areaPoints = `0,30 ${points} 100,30`;

  return (
    <svg
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
      className="h-10 w-full"
    >
      {fill && <polygon fill={fill} points={areaPoints} opacity={0.18} />}
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

// =============================================================================
// Alert icon + color mapping
// =============================================================================
const alertConfig = {
  warning: { Icon: AlertTriangle, bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
  info: { Icon: Info, bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
  error: { Icon: XCircle, bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
  success: { Icon: CheckCircle2, bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
} as const;

const healthConfig = {
  OK: { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", label: "OK" },
  DEGRADED: { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", label: "DEGRADED" },
  DOWN: { color: "text-red-600", bg: "bg-red-50", border: "border-red-200", label: "DOWN" },
} as const;

export default async function AdminDashboardPage() {
  // -------- Stats Supabase réelles (utilisateurs / annonces / KYC) --------
  const stats = await getAdminStats();
  const activePropertiesReal =
    stats.propertiesByStatus.AVAILABLE + stats.propertiesByStatus.RENTED;

  // -------- KPI sparklines (last 8 months) --------
  const last8 = USER_GROWTH.slice(-8);
  const userSpark = last8.map((m) => m.users);
  const listingsSpark = [2410, 2580, 2710, 2830, 2940, 3060, 3140, 3215];
  const revenueSpark = PLATFORM_REVENUE.slice(-8).map(
    (m) => m.subscriptions + m.commissions + m.boosts
  );
  const verifSpark = [62, 58, 55, 52, 49, 50, 48, 47];

  // -------- Charts dimensions --------
  // Growth area chart
  const growthW = 720;
  const growthH = 260;
  const growthPad = { l: 50, r: 16, t: 20, b: 30 };
  const growthMaxUsers = Math.max(...USER_GROWTH.map((m) => m.users));
  const growthMaxAgencies = Math.max(...USER_GROWTH.map((m) => m.agencies));
  const growthInnerW = growthW - growthPad.l - growthPad.r;
  const growthInnerH = growthH - growthPad.t - growthPad.b;
  const growthX = (i: number) =>
    growthPad.l + (i / (USER_GROWTH.length - 1)) * growthInnerW;
  const growthYU = (v: number) =>
    growthPad.t + growthInnerH - (v / growthMaxUsers) * growthInnerH;
  const growthYA = (v: number) =>
    growthPad.t + growthInnerH - (v / growthMaxAgencies) * growthInnerH;

  const usersLine = USER_GROWTH.map((m, i) => `${growthX(i)},${growthYU(m.users)}`).join(" ");
  const usersArea = `${growthPad.l},${growthPad.t + growthInnerH} ${usersLine} ${growthPad.l + growthInnerW},${growthPad.t + growthInnerH}`;
  const agenciesLine = USER_GROWTH.map((m, i) => `${growthX(i)},${growthYA(m.agencies)}`).join(" ");

  // Stacked revenue bars
  const revW = 720;
  const revH = 280;
  const revPad = { l: 60, r: 16, t: 24, b: 36 };
  const revInnerW = revW - revPad.l - revPad.r;
  const revInnerH = revH - revPad.t - revPad.b;
  const revTotals = PLATFORM_REVENUE.map(
    (m) => m.subscriptions + m.commissions + m.boosts
  );
  const revMax = Math.max(...revTotals);
  const barW = (revInnerW / PLATFORM_REVENUE.length) * 0.6;
  const barStep = revInnerW / PLATFORM_REVENUE.length;
  const totalRevenue = revTotals.reduce((a, b) => a + b, 0);
  const yTicks = 4;

  // Donut chart
  const donutR = 70;
  const donutCirc = 2 * Math.PI * donutR;
  let cumulative = 0;
  const donutSegments = USER_DISTRIBUTION.map((item) => {
    const dashArray = (item.percentage / 100) * donutCirc;
    const dashOffset = -cumulative;
    cumulative += dashArray;
    return { ...item, dashArray, dashOffset };
  });

  // Daily activity grouped bars
  const actW = 720;
  const actH = 260;
  const actPad = { l: 48, r: 16, t: 24, b: 36 };
  const actInnerW = actW - actPad.l - actPad.r;
  const actInnerH = actH - actPad.t - actPad.b;
  const actSeries = [
    { key: "signups", label: "Inscriptions", color: "#1976D2" },
    { key: "listings", label: "Annonces", color: "#4CAF50" },
    { key: "contracts", label: "Contrats", color: "#F59E0B" },
    { key: "payments", label: "Paiements", color: "#1A3A52" },
  ] as const;
  const actMax = Math.max(
    ...DAILY_ACTIVITY.flatMap((d) => actSeries.map((s) => d[s.key as keyof typeof d] as number))
  );
  const groupW = actInnerW / DAILY_ACTIVITY.length;
  const subBarW = (groupW * 0.7) / actSeries.length;

  // Cities horizontal bars
  const cityMax = Math.max(...PROPERTIES_BY_CITY.map((c) => c.count));

  // Sort top agencies by CA desc
  const sortedAgencies = [...TOP_AGENCIES].sort((a, b) => b.ca - a.ca);

  // Quick actions config
  const quickActions = [
    { href: "/admin/users", label: "Utilisateurs", desc: `Gérer ${formatNumber(stats.totalUsers)} comptes`, Icon: Users, color: "from-blue-500/10 to-blue-500/0", text: "text-blue-600" },
    { href: "/admin/properties", label: "Annonces", desc: `${formatNumber(activePropertiesReal)} actives`, Icon: HomeIcon, color: "from-emerald-500/10 to-emerald-500/0", text: "text-emerald-600" },
    { href: "/admin/verifications", label: "Vérifications", desc: `${stats.pendingVerifications} en attente`, Icon: ShieldCheck, color: "from-amber-500/10 to-amber-500/0", text: "text-amber-600" },
    { href: "/admin/disputes", label: "Litiges", desc: "12 ouverts", Icon: FileWarning, color: "from-red-500/10 to-red-500/0", text: "text-red-600" },
    { href: "/admin/payments", label: "Paiements", desc: "Réconciliation", Icon: CreditCard, color: "from-purple-500/10 to-purple-500/0", text: "text-purple-600" },
    { href: "/admin/staff", label: "Équipe staff", desc: "Permissions & rôles", Icon: UserCog, color: "from-cyan-500/10 to-cyan-500/0", text: "text-cyan-600" },
  ];

  return (
    <div className="space-y-8">
      {/* ================================================================== */}
      {/* HEADER navy gradient                                                */}
      {/* ================================================================== */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-kaza-navy via-[#1f4663] to-[#0f2638] p-6 text-white shadow-sm lg:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_60%)]" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-0 bg-amber-400 font-semibold uppercase tracking-wide text-kaza-navy hover:bg-amber-400">
                Admin
              </Badge>
              <span className="text-xs uppercase tracking-[0.18em] text-white/60">
                Console KAZA
              </span>
            </div>
            <h1 className="font-heading text-3xl font-bold leading-tight lg:text-4xl">
              Centre de contrôle KAZA
            </h1>
            <p className="text-sm text-white/70 lg:text-base">
              Vue temps réel de la plateforme — utilisateurs, annonces, paiements, santé système.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <div className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3.5 py-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>
              <span className="text-sm font-semibold text-emerald-300">
                {PLATFORM_OVERVIEW.platformUptime}% uptime
              </span>
            </div>
            <p className="text-xs text-white/50">Dernière sync · il y a 12 secondes</p>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* KPI CARDS                                                           */}
      {/* ================================================================== */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Utilisateurs totaux */}
        <Card className="rounded-2xl border-gray-200/80 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                <Users className="h-5 w-5 text-kaza-blue" />
              </div>
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                <ArrowUpRight className="mr-1 h-3 w-3" />
                +5.2%
              </Badge>
            </div>
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Utilisateurs totaux
            </p>
            <p className="mt-1 font-heading text-3xl font-bold text-kaza-navy">
              {formatNumber(stats.totalUsers)}
            </p>
            <div className="mt-3 text-kaza-blue">
              <Sparkline values={userSpark} color="#1976D2" fill="#1976D2" />
            </div>
          </CardContent>
        </Card>

        {/* Annonces actives */}
        <Card className="rounded-2xl border-gray-200/80 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                <Building2 className="h-5 w-5 text-emerald-600" />
              </div>
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                <ArrowUpRight className="mr-1 h-3 w-3" />
                +8.1%
              </Badge>
            </div>
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Annonces actives
            </p>
            <p className="mt-1 font-heading text-3xl font-bold text-kaza-navy">
              {formatNumber(activePropertiesReal)}
            </p>
            <div className="mt-3 text-emerald-600">
              <Sparkline values={listingsSpark} color="#4CAF50" fill="#4CAF50" />
            </div>
          </CardContent>
        </Card>

        {/* Revenus 30j */}
        <Card className="rounded-2xl border-gray-200/80 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
                <Wallet className="h-5 w-5 text-amber-600" />
              </div>
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                <ArrowUpRight className="mr-1 h-3 w-3" />
                +12.4%
              </Badge>
            </div>
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Revenus 30j
            </p>
            <p className="mt-1 font-heading text-3xl font-bold text-kaza-navy">
              {formatFcfaShort(stats.totalRevenue30d)} FCFA
            </p>
            <div className="mt-3 text-amber-600">
              <Sparkline values={revenueSpark} color="#F59E0B" fill="#F59E0B" />
            </div>
          </CardContent>
        </Card>

        {/* Vérifications en attente */}
        <Card className="rounded-2xl border-gray-200/80 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
                <ShieldCheck className="h-5 w-5 text-orange-600" />
              </div>
              <Badge className="border-0 bg-orange-100 text-orange-700 hover:bg-orange-100">
                Action requise
              </Badge>
            </div>
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Vérifications en attente
            </p>
            <p className="mt-1 font-heading text-3xl font-bold text-kaza-navy">
              {stats.pendingVerifications}
            </p>
            <div className="mt-3 text-orange-500">
              <Sparkline values={verifSpark} color="#F97316" fill="#F97316" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ================================================================== */}
      {/* CHARTS row 1 — Growth (2/3) + Donut (1/3)                           */}
      {/* ================================================================== */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* GRAPHIQUE 1 — Croissance utilisateurs vs agences */}
        <Card className="rounded-2xl border-gray-200/80 shadow-sm xl:col-span-2">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-2">
            <div>
              <CardTitle className="font-heading text-lg text-kaza-navy">
                Croissance plateforme — 12 mois
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Utilisateurs vs agences inscrites
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-kaza-blue" />
                <span className="text-muted-foreground">Utilisateurs</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">Agences</span>
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <svg
                viewBox={`0 0 ${growthW} ${growthH}`}
                className="h-[260px] w-full min-w-[600px]"
              >
                <defs>
                  <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1976D2" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#1976D2" stopOpacity={0} />
                  </linearGradient>
                </defs>

                {/* grid Y */}
                {Array.from({ length: 5 }).map((_, i) => {
                  const y = growthPad.t + (i / 4) * growthInnerH;
                  const v = Math.round((growthMaxUsers * (4 - i)) / 4);
                  return (
                    <g key={i}>
                      <line
                        x1={growthPad.l}
                        x2={growthPad.l + growthInnerW}
                        y1={y}
                        y2={y}
                        stroke="#E5E7EB"
                        strokeDasharray={i === 4 ? "0" : "2 4"}
                      />
                      <text
                        x={growthPad.l - 8}
                        y={y + 4}
                        textAnchor="end"
                        className="fill-gray-400"
                        fontSize="10"
                      >
                        {formatFcfaShort(v)}
                      </text>
                    </g>
                  );
                })}

                {/* area users */}
                <polygon points={usersArea} fill="url(#usersGradient)" />
                <polyline
                  points={usersLine}
                  fill="none"
                  stroke="#1976D2"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* line agencies */}
                <polyline
                  points={agenciesLine}
                  fill="none"
                  stroke="#4CAF50"
                  strokeWidth={2.5}
                  strokeDasharray="4 3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* dots users */}
                {USER_GROWTH.map((m, i) => (
                  <circle
                    key={`u-${i}`}
                    cx={growthX(i)}
                    cy={growthYU(m.users)}
                    r={3}
                    fill="#1976D2"
                  />
                ))}

                {/* X labels */}
                {USER_GROWTH.map((m, i) => (
                  <text
                    key={`xl-${i}`}
                    x={growthX(i)}
                    y={growthH - 10}
                    textAnchor="middle"
                    className="fill-gray-500"
                    fontSize="10"
                  >
                    {m.month.split(" ")[0]}
                  </text>
                ))}
              </svg>
            </div>
          </CardContent>
        </Card>

        {/* GRAPHIQUE 3 — Donut distribution rôles */}
        <Card className="rounded-2xl border-gray-200/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-lg text-kaza-navy">
              Distribution par rôle
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Répartition des {formatNumber(PLATFORM_OVERVIEW.totalUsers)} comptes
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-5">
              <div className="relative">
                <svg viewBox="0 0 200 200" className="h-44 w-44">
                  {/* base track */}
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
                      key={s.role}
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
                  <span className="font-heading text-2xl font-bold text-kaza-navy">
                    {formatFcfaShort(PLATFORM_OVERVIEW.totalUsers)}
                  </span>
                </div>
              </div>

              <ul className="w-full space-y-2.5">
                {USER_DISTRIBUTION.map((item) => (
                  <li
                    key={item.role}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-medium text-gray-700">{item.role}</span>
                    </span>
                    <span className="flex items-baseline gap-2">
                      <span className="font-semibold text-kaza-navy">
                        {formatNumber(item.count)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {item.percentage}%
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ================================================================== */}
      {/* GRAPHIQUE 2 — Stacked revenue                                       */}
      {/* ================================================================== */}
      <Card className="rounded-2xl border-gray-200/80 shadow-sm">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-2">
          <div>
            <CardTitle className="font-heading text-lg text-kaza-navy">
              Revenus plateforme par source
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Cumul 12 mois ·{" "}
              <span className="font-semibold text-kaza-navy">
                {formatFcfaShort(totalRevenue)} FCFA
              </span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-kaza-navy" />
              <span className="text-muted-foreground">Abonnements</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-kaza-blue" />
              <span className="text-muted-foreground">Commissions</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-kaza-green" />
              <span className="text-muted-foreground">Boosts</span>
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <svg
              viewBox={`0 0 ${revW} ${revH}`}
              className="h-[280px] w-full min-w-[600px]"
            >
              {/* grid lines + Y labels */}
              {Array.from({ length: yTicks + 1 }).map((_, i) => {
                const y = revPad.t + (i / yTicks) * revInnerH;
                const v = Math.round((revMax * (yTicks - i)) / yTicks);
                return (
                  <g key={i}>
                    <line
                      x1={revPad.l}
                      x2={revPad.l + revInnerW}
                      y1={y}
                      y2={y}
                      stroke="#E5E7EB"
                      strokeDasharray={i === yTicks ? "0" : "2 4"}
                    />
                    <text
                      x={revPad.l - 8}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-gray-400"
                      fontSize="10"
                    >
                      {formatFcfaShort(v)}
                    </text>
                  </g>
                );
              })}

              {PLATFORM_REVENUE.map((m, i) => {
                const subH = (m.subscriptions / revMax) * revInnerH;
                const comH = (m.commissions / revMax) * revInnerH;
                const booH = (m.boosts / revMax) * revInnerH;
                const x = revPad.l + i * barStep + (barStep - barW) / 2;
                let yCursor = revPad.t + revInnerH;
                return (
                  <g key={m.month}>
                    {/* subscriptions (navy) — bottom */}
                    <rect
                      x={x}
                      y={(yCursor -= subH)}
                      width={barW}
                      height={subH}
                      fill="#1A3A52"
                      rx={2}
                    />
                    {/* commissions (blue) — middle */}
                    <rect
                      x={x}
                      y={(yCursor -= comH)}
                      width={barW}
                      height={comH}
                      fill="#1976D2"
                    />
                    {/* boosts (green) — top */}
                    <rect
                      x={x}
                      y={(yCursor -= booH)}
                      width={barW}
                      height={booH}
                      fill="#4CAF50"
                      rx={2}
                    />
                    {/* X label */}
                    <text
                      x={x + barW / 2}
                      y={revH - 14}
                      textAnchor="middle"
                      className="fill-gray-500"
                      fontSize="10"
                    >
                      {m.month.split(" ")[0]}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* CHARTS row 3 — Daily activity + Cities                              */}
      {/* ================================================================== */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* GRAPHIQUE 4 — Daily activity grouped bars */}
        <Card className="rounded-2xl border-gray-200/80 shadow-sm">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-2">
            <div>
              <CardTitle className="font-heading text-lg text-kaza-navy">
                Activité hebdomadaire
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                7 derniers jours · 4 métriques clés
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs">
              {actSeries.map((s) => (
                <span key={s.key} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
                  <span className="text-muted-foreground">{s.label}</span>
                </span>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <svg
                viewBox={`0 0 ${actW} ${actH}`}
                className="h-[260px] w-full min-w-[600px]"
              >
                {/* grid */}
                {Array.from({ length: 5 }).map((_, i) => {
                  const y = actPad.t + (i / 4) * actInnerH;
                  const v = Math.round((actMax * (4 - i)) / 4);
                  return (
                    <g key={i}>
                      <line
                        x1={actPad.l}
                        x2={actPad.l + actInnerW}
                        y1={y}
                        y2={y}
                        stroke="#E5E7EB"
                        strokeDasharray={i === 4 ? "0" : "2 4"}
                      />
                      <text
                        x={actPad.l - 8}
                        y={y + 4}
                        textAnchor="end"
                        className="fill-gray-400"
                        fontSize="10"
                      >
                        {v}
                      </text>
                    </g>
                  );
                })}

                {DAILY_ACTIVITY.map((d, i) => {
                  const groupX = actPad.l + i * groupW + (groupW - subBarW * actSeries.length) / 2;
                  return (
                    <g key={d.day}>
                      {actSeries.map((s, sIdx) => {
                        const val = d[s.key as keyof typeof d] as number;
                        const h = (val / actMax) * actInnerH;
                        const x = groupX + sIdx * subBarW;
                        const y = actPad.t + actInnerH - h;
                        return (
                          <rect
                            key={s.key}
                            x={x}
                            y={y}
                            width={subBarW - 2}
                            height={h}
                            fill={s.color}
                            rx={1.5}
                          />
                        );
                      })}
                      <text
                        x={actPad.l + i * groupW + groupW / 2}
                        y={actH - 14}
                        textAnchor="middle"
                        className="fill-gray-600"
                        fontSize="11"
                        fontWeight="500"
                      >
                        {d.day}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </CardContent>
        </Card>

        {/* GRAPHIQUE 5 — Properties by city horizontal */}
        <Card className="rounded-2xl border-gray-200/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-lg text-kaza-navy">
              Annonces par ville
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Top {PROPERTIES_BY_CITY.length} villes — total {formatNumber(PROPERTIES_BY_CITY.reduce((s, c) => s + c.count, 0))} annonces
            </p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3.5">
              {PROPERTIES_BY_CITY.map((c, i) => {
                const pct = (c.count / cityMax) * 100;
                return (
                  <li key={c.city}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[10px] font-semibold text-gray-600">
                          {i + 1}
                        </span>
                        <span className="font-medium text-gray-800">{c.city}</span>
                      </span>
                      <span className="flex items-baseline gap-2">
                        <span className="font-semibold text-kaza-navy">
                          {formatNumber(c.count)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {c.percentage}%
                        </span>
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-kaza-blue to-kaza-navy"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* ================================================================== */}
      {/* TABLE — Top 5 agences                                               */}
      {/* ================================================================== */}
      <Card className="rounded-2xl border-gray-200/80 shadow-sm">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-3">
          <div>
            <CardTitle className="font-heading text-lg text-kaza-navy">
              Top agences ce mois
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Classement par chiffre d&apos;affaires généré
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href="/admin/users">
              Voir toutes les agences
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-y border-gray-200 bg-gray-50/70 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-6 py-3 font-semibold">#</th>
                  <th className="px-6 py-3 font-semibold">Agence</th>
                  <th className="px-6 py-3 font-semibold">Ville</th>
                  <th className="px-6 py-3 text-right font-semibold">Annonces</th>
                  <th className="px-6 py-3 text-right font-semibold">CA du mois</th>
                  <th className="px-6 py-3 text-right font-semibold">Rating</th>
                </tr>
              </thead>
              <tbody>
                {sortedAgencies.map((a, i) => (
                  <tr
                    key={a.name}
                    className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50"
                  >
                    <td className="px-6 py-4">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-kaza-navy/5 text-xs font-bold text-kaza-navy">
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-kaza-navy">{a.name}</td>
                    <td className="px-6 py-4 text-gray-600">{a.city}</td>
                    <td className="px-6 py-4 text-right font-medium text-gray-800">
                      {formatNumber(a.listings)}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-emerald-600">
                      {formatFcfa(a.ca)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                        {a.rating.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* WIDGET — System health + Alerts                                     */}
      {/* ================================================================== */}
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="rounded-2xl border-gray-200/80 shadow-sm xl:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-heading text-lg text-kaza-navy">
                  Santé système
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  6 services monitorés · refresh toutes les 30 s
                </p>
              </div>
              <Server className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SYSTEM_HEALTH.map((s) => {
                const cfg = healthConfig[s.status as keyof typeof healthConfig];
                return (
                  <div
                    key={s.service}
                    className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Cpu className={`h-4 w-4 ${cfg.color}`} />
                        <span className="text-sm font-semibold text-kaza-navy">
                          {s.service}
                        </span>
                      </div>
                      <Badge
                        className={`border-0 ${cfg.bg} ${cfg.color} text-[10px] font-bold uppercase tracking-wider hover:${cfg.bg}`}
                      >
                        {cfg.label}
                      </Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Uptime</p>
                        <p className={`font-bold ${cfg.color}`}>{s.uptime}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Latence</p>
                        <p className="font-bold text-kaza-navy">{s.latency} ms</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-heading text-lg text-kaza-navy">
                  Alertes récentes
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {RECENT_ALERTS.length} événements
                </p>
              </div>
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {RECENT_ALERTS.map((a) => {
                const cfg = alertConfig[a.type as keyof typeof alertConfig];
                const Icon = cfg.Icon;
                return (
                  <li
                    key={a.id}
                    className={`flex gap-3 rounded-xl border ${cfg.border} ${cfg.bg} p-3`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white ${cfg.text}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-kaza-navy">
                          {a.title}
                        </p>
                        <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
                          {a.time}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs leading-relaxed text-gray-600">
                        {a.description}
                      </p>
                      <button
                        type="button"
                        className="mt-1.5 text-[11px] font-semibold text-kaza-blue hover:underline"
                      >
                        Marquer comme lu
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* ================================================================== */}
      {/* Quick actions                                                       */}
      {/* ================================================================== */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold text-kaza-navy">
              Actions rapides
            </h2>
            <p className="text-sm text-muted-foreground">
              Accès direct aux modules les plus utilisés
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {quickActions.map((q) => {
            const Icon = q.Icon;
            return (
              <Link
                key={q.href}
                href={q.href}
                className={`group relative overflow-hidden rounded-2xl border border-gray-200/80 bg-gradient-to-br ${q.color} bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ${q.text}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-3 font-semibold text-kaza-navy">{q.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{q.desc}</p>
                <ArrowRight className="absolute right-4 top-5 h-4 w-4 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-kaza-navy" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* ================================================================== */}
      {/* Footer card                                                         */}
      {/* ================================================================== */}
      <div className="rounded-2xl border border-gray-200/80 bg-gradient-to-r from-emerald-50 via-white to-blue-50 px-5 py-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="font-semibold text-kaza-navy">Plateforme stable</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
            <span>Dernière sauvegarde : il y a 14 min</span>
            <span className="hidden sm:inline">·</span>
            <span>
              API <span className="font-mono font-semibold text-kaza-navy">v2.4.1</span>
            </span>
            <span className="hidden sm:inline">·</span>
            <span>Région principale : <span className="font-semibold text-kaza-navy">eu-west-3</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
