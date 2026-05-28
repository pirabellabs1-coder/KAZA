import type { Metadata } from "next";
import {
  Activity,
  BarChart3,
  Eye,
  MousePointerClick,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPlatformAnalytics30d } from "@/lib/queries/analytics";
import { formatNumber } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Analytics — KAZA Admin",
  description: "Analytics live de la plateforme KAZA (30 derniers jours).",
};

// =============================================================================
// PAGE
// =============================================================================
export default async function AdminAnalyticsPage() {
  const platform = await getPlatformAnalytics30d();

  const isEmpty =
    platform.totalEvents === 0 &&
    platform.totalSessions === 0 &&
    platform.totalSignups === 0;

  const kpis = [
    {
      title: "Sessions uniques 30j",
      value: formatNumber(platform.totalSessions),
      Icon: Users,
      color: "bg-blue-50 text-kaza-blue",
    },
    {
      title: "Events totaux",
      value: formatNumber(platform.totalEvents),
      Icon: Activity,
      color: "bg-cyan-50 text-cyan-600",
    },
    {
      title: "Page views",
      value: formatNumber(platform.totalPageViews),
      Icon: MousePointerClick,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Vues propriétés",
      value: formatNumber(platform.totalPropertyViews),
      Icon: Eye,
      color: "bg-amber-50 text-amber-600",
    },
    {
      title: "Inscriptions 30j",
      value: formatNumber(platform.totalSignups),
      Icon: UserPlus,
      color: "bg-purple-50 text-purple-600",
    },
    {
      title: "Types d'évènements",
      value: formatNumber(platform.byEventType.length),
      Icon: BarChart3,
      color: "bg-rose-50 text-rose-600",
    },
  ];

  // ---------------------------------------------------------------------------
  // Sparkline 30j — sessions par jour (SVG natif)
  // ---------------------------------------------------------------------------
  const daily = platform.daily;
  // On comble les jours manquants pour avoir un alignement propre.
  const dailySessions = daily.map((d) => d.sessions);
  const maxSess = Math.max(1, ...dailySessions);
  const dailyW = 760;
  const dailyH = 240;
  const padL = 50;
  const padR = 16;
  const padT = 20;
  const padB = 32;
  const innerW = dailyW - padL - padR;
  const innerH = dailyH - padT - padB;

  const x = (i: number) =>
    padL + (daily.length <= 1 ? innerW / 2 : (i / (daily.length - 1)) * innerW);
  const y = (v: number) => padT + innerH - (v / maxSess) * innerH;
  const linePoints =
    daily.length > 0
      ? daily.map((d, i) => `${x(i)},${y(d.sessions)}`).join(" ")
      : "";

  return (
    <div className="space-y-8">
      {/* ================================================================== */}
      {/* HEADER                                                              */}
      {/* ================================================================== */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-emerald-200 bg-emerald-50 text-emerald-700"
            >
              <Sparkles className="mr-1 h-3 w-3" />
              Données live
            </Badge>
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Console KAZA · Analytics
            </span>
          </div>
          <h1 className="font-heading text-3xl font-bold text-kaza-navy lg:text-4xl">
            Analytics plateforme
          </h1>
          <p className="text-sm text-muted-foreground lg:text-base">
            30 derniers jours · table `analytics_events` (Supabase).
          </p>
        </div>
      </div>

      {/* Empty state */}
      {isEmpty && (
        <Card className="rounded-2xl border-dashed border-kaza-blue/40 bg-kaza-blue/5 shadow-sm">
          <CardContent className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-kaza-blue/15 text-kaza-blue">
              <Sparkles className="size-6" />
            </div>
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Pas encore d&apos;activité enregistrée
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Les évènements (vues, inscriptions, visites…) apparaîtront ici
              dès les premiers passages sur la plateforme.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ================================================================== */}
      {/* KPI CARDS (6)                                                       */}
      {/* ================================================================== */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((k) => {
          const Icon = k.Icon;
          return (
            <Card
              key={k.title}
              className="rounded-xl border-gray-200/80 shadow-sm"
            >
              <CardContent className="flex items-start gap-3 p-4">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${k.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {k.title}
                  </p>
                  <p className="mt-0.5 font-heading text-xl font-bold text-kaza-navy">
                    {k.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ================================================================== */}
      {/* Daily activity 30j                                                   */}
      {/* ================================================================== */}
      <Card className="rounded-2xl border-gray-200/80 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="font-heading text-lg text-kaza-navy">
            Activité quotidienne — 30 jours
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Nombre de sessions uniques par jour
          </p>
        </CardHeader>
        <CardContent>
          {daily.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-slate-50/40 px-4 py-12 text-center text-sm text-muted-foreground">
              Aucune donnée disponible pour cette période.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <svg
                viewBox={`0 0 ${dailyW} ${dailyH}`}
                className="h-[240px] w-full min-w-[680px]"
              >
                <defs>
                  <linearGradient id="dailyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1976D2" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#1976D2" stopOpacity={0} />
                  </linearGradient>
                </defs>

                {/* gridlines */}
                {Array.from({ length: 5 }).map((_, i) => {
                  const gy = padT + (i / 4) * innerH;
                  const v = Math.round((maxSess * (4 - i)) / 4);
                  return (
                    <g key={i}>
                      <line
                        x1={padL}
                        x2={padL + innerW}
                        y1={gy}
                        y2={gy}
                        stroke="#E5E7EB"
                        strokeDasharray={i === 4 ? "0" : "2 4"}
                      />
                      <text
                        x={padL - 8}
                        y={gy + 4}
                        textAnchor="end"
                        className="fill-gray-400"
                        fontSize="10"
                      >
                        {v}
                      </text>
                    </g>
                  );
                })}

                {/* area */}
                <polygon
                  points={`${padL},${padT + innerH} ${linePoints} ${padL + innerW},${padT + innerH}`}
                  fill="url(#dailyGrad)"
                />
                {/* line */}
                <polyline
                  points={linePoints}
                  fill="none"
                  stroke="#1976D2"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* dots */}
                {daily.map((d, i) => (
                  <circle
                    key={d.day}
                    cx={x(i)}
                    cy={y(d.sessions)}
                    r={2.5}
                    fill="#1976D2"
                  />
                ))}

                {/* X labels — 1 sur 5 pour ne pas surcharger */}
                {daily.map((d, i) =>
                  i % Math.max(1, Math.floor(daily.length / 6)) === 0 ? (
                    <text
                      key={`xl-${d.day}`}
                      x={x(i)}
                      y={dailyH - 10}
                      textAnchor="middle"
                      className="fill-gray-500"
                      fontSize="10"
                    >
                      {d.day.slice(5)}
                    </text>
                  ) : null,
                )}
              </svg>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* Top events par type                                                  */}
      {/* ================================================================== */}
      <Card className="rounded-2xl border-gray-200/80 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="font-heading text-lg text-kaza-navy">
            Évènements par type
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Volume, utilisateurs uniques et sessions uniques (30 j)
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {platform.byEventType.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-slate-50/40 px-4 py-12 text-center text-sm text-muted-foreground">
              Aucun évènement enregistré sur les 30 derniers jours.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-gray-200 bg-gray-50/70 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-2.5 text-left font-semibold">
                    Type d&apos;évènement
                  </th>
                  <th className="px-5 py-2.5 text-right font-semibold">
                    Count
                  </th>
                  <th className="px-5 py-2.5 text-right font-semibold">
                    Users uniques
                  </th>
                  <th className="px-5 py-2.5 text-right font-semibold">
                    Sessions uniques
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...platform.byEventType]
                  .sort((a, b) => b.count - a.count)
                  .map((row) => (
                    <tr
                      key={row.eventType}
                      className="border-b border-gray-100 last:border-b-0"
                    >
                      <td className="px-5 py-3 font-mono text-xs text-kaza-navy">
                        {row.eventType}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-kaza-navy">
                        {formatNumber(row.count)}
                      </td>
                      <td className="px-5 py-3 text-right text-muted-foreground">
                        {formatNumber(row.uniqueUsers)}
                      </td>
                      <td className="px-5 py-3 text-right text-muted-foreground">
                        {formatNumber(row.uniqueSessions)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2 animate-pulse rounded-full bg-kaza-green" />
          Vues SQL : analytics_30d + analytics_daily_30d
        </span>
        <span>Source : Supabase analytics_events</span>
      </div>
    </div>
  );
}
