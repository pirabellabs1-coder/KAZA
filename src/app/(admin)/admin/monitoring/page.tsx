import type { Metadata } from "next";
import {
  Activity,
  AlertTriangle,
  Bell,
  Cpu,
  Database,
  Gauge,
  Info,
  RefreshCcw,
  Server,
  XCircle,
  Zap,
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
  ERROR_LOG,
  MONITORING_METRICS,
  SERVER_NODES,
  formatBytes,
  formatNumber,
} from "@/lib/mock/admin-platform-data";

export const metadata: Metadata = {
  title: "Monitoring temps réel — KAZA Admin",
  description: "Supervision live de l'infrastructure KAZA.",
};

// =============================================================================
// Données dérivées (hors composant pour rester serveur)
// =============================================================================
const RPS = MONITORING_METRICS.requestsPerSecond;
const RPS_CURRENT = RPS[RPS.length - 1]!.value;
const RPS_MAX = Math.max(...RPS.map((p) => p.value));

// Latency 24h synthétique
const LATENCY_24H = Array.from({ length: 24 }, (_, i) => {
  const t = (i / 23) * Math.PI * 2;
  return {
    h: i,
    p50: Math.round(35 + 12 * Math.sin(t / 3) + 5 * Math.cos(t)),
    p95: Math.round(160 + 45 * Math.sin(t / 2) + 18 * Math.cos(t / 1.5)),
    p99: Math.round(380 + 120 * Math.sin(t / 1.8) + 40 * Math.cos(t)),
  };
});

// Error rate timeline 24h
const ERROR_RATE_24H = Array.from({ length: 24 }, (_, i) => ({
  h: i,
  value: Math.max(
    0.05,
    0.4 + 0.3 * Math.sin(i / 3) + 0.2 * Math.cos(i / 2) + (i === 17 ? 1.2 : 0)
  ),
}));

const ALERTS_CONFIG = [
  {
    id: "al-1",
    name: "CPU > 85%",
    channel: "Slack #ops-alerts",
    severity: "WARN",
    on: true,
  },
  {
    id: "al-2",
    name: "Error rate > 1%",
    channel: "PagerDuty (on-call)",
    severity: "CRITICAL",
    on: true,
  },
  {
    id: "al-3",
    name: "Latence p99 > 1000ms",
    channel: "Slack #ops-alerts + Email",
    severity: "WARN",
    on: true,
  },
  {
    id: "al-4",
    name: "Disque > 90%",
    channel: "Slack #infra + SMS",
    severity: "CRITICAL",
    on: true,
  },
  {
    id: "al-5",
    name: "DB connections > 80% pool",
    channel: "Slack #db-alerts",
    severity: "WARN",
    on: false,
  },
];

// =============================================================================
// PAGE
// =============================================================================
export default function AdminMonitoringPage() {
  // -------- GRAPHIQUE 1 — Req/sec live --------
  const g1W = 720;
  const g1H = 220;
  const g1Pad = { l: 40, r: 16, t: 16, b: 28 };
  const g1InnerW = g1W - g1Pad.l - g1Pad.r;
  const g1InnerH = g1H - g1Pad.t - g1Pad.b;
  const g1X = (i: number) => g1Pad.l + (i / (RPS.length - 1)) * g1InnerW;
  const g1Y = (v: number) => g1Pad.t + g1InnerH - (v / RPS_MAX) * g1InnerH;
  const rpsLine = RPS.map((p, i) => `${g1X(i)},${g1Y(p.value)}`).join(" ");
  const rpsArea = `${g1Pad.l},${g1Pad.t + g1InnerH} ${rpsLine} ${g1Pad.l + g1InnerW},${g1Pad.t + g1InnerH}`;

  // -------- GRAPHIQUE 2 — Latency p50/p95/p99 --------
  const g2W = 720;
  const g2H = 260;
  const g2Pad = { l: 50, r: 16, t: 20, b: 30 };
  const g2InnerW = g2W - g2Pad.l - g2Pad.r;
  const g2InnerH = g2H - g2Pad.t - g2Pad.b;
  const g2Max = Math.max(...LATENCY_24H.map((p) => p.p99)) * 1.1;
  const g2X = (i: number) => g2Pad.l + (i / (LATENCY_24H.length - 1)) * g2InnerW;
  const g2Y = (v: number) => g2Pad.t + g2InnerH - (v / g2Max) * g2InnerH;
  const slaY = g2Y(500);
  const p50Line = LATENCY_24H.map((p, i) => `${g2X(i)},${g2Y(p.p50)}`).join(" ");
  const p95Line = LATENCY_24H.map((p, i) => `${g2X(i)},${g2Y(p.p95)}`).join(" ");
  const p99Line = LATENCY_24H.map((p, i) => `${g2X(i)},${g2Y(p.p99)}`).join(" ");

  // -------- GRAPHIQUE 3 — Error rate bars --------
  const g3W = 720;
  const g3H = 220;
  const g3Pad = { l: 40, r: 16, t: 16, b: 28 };
  const g3InnerW = g3W - g3Pad.l - g3Pad.r;
  const g3InnerH = g3H - g3Pad.t - g3Pad.b;
  const g3Max = Math.max(...ERROR_RATE_24H.map((p) => p.value)) * 1.15;
  const g3BarStep = g3InnerW / ERROR_RATE_24H.length;
  const g3BarW = g3BarStep * 0.65;

  // -------- GRAPHIQUE 4 — Donuts CPU par node --------
  const donutR = 32;
  const donutCirc = 2 * Math.PI * donutR;

  return (
    <div className="space-y-8">
      {/* ================================================================== */}
      {/* HEADER                                                              */}
      {/* ================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-kaza-navy lg:text-3xl">
            Monitoring temps réel
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Supervision infrastructure · 6 nodes · refresh continu
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-sm font-semibold text-emerald-700">
              Live · MAJ il y a 2s
            </span>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5">
            <RefreshCcw className="h-4 w-4" />
            Rafraîchir
          </Button>
        </div>
      </div>

      {/* ================================================================== */}
      {/* KPI ROW (5 cards)                                                   */}
      {/* ================================================================== */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          {
            label: "Req/sec actuel",
            value: formatNumber(RPS_CURRENT),
            unit: "req/s",
            Icon: Zap,
            tint: "text-kaza-blue",
            bg: "bg-blue-50",
          },
          {
            label: "Latence p50",
            value: `${MONITORING_METRICS.latency.p50}`,
            unit: "ms",
            Icon: Gauge,
            tint: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Latence p95",
            value: `${MONITORING_METRICS.latency.p95}`,
            unit: "ms",
            Icon: Gauge,
            tint: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            label: "Latence p99",
            value: `${MONITORING_METRICS.latency.p99}`,
            unit: "ms",
            Icon: Gauge,
            tint: "text-red-600",
            bg: "bg-red-50",
          },
          {
            label: "Error rate",
            value: `${MONITORING_METRICS.errorRate}`,
            unit: "%",
            Icon: AlertTriangle,
            tint: "text-orange-600",
            bg: "bg-orange-50",
          },
        ].map((k) => {
          const Icon = k.Icon;
          return (
            <Card key={k.label} className="rounded-2xl border-gray-200/80 shadow-sm">
              <CardContent className="p-5">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${k.bg}`}>
                  <Icon className={`h-5 w-5 ${k.tint}`} />
                </div>
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {k.label}
                </p>
                <p className="mt-1 font-heading text-2xl font-bold text-kaza-navy">
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
      {/* GRAPHIQUE 1 — Req/sec live                                          */}
      {/* ================================================================== */}
      <Card className="rounded-2xl border-gray-200/80 shadow-sm">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-2">
          <div>
            <CardTitle className="font-heading text-lg text-kaza-navy">
              Requêtes par seconde · live
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              60 dernières secondes · pic à {formatNumber(RPS_MAX)} req/s
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-kaza-blue">
            <Activity className="h-3.5 w-3.5 animate-pulse" />
            {formatNumber(RPS_CURRENT)} req/s
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <svg
              viewBox={`0 0 ${g1W} ${g1H}`}
              className="h-[220px] w-full min-w-[600px]"
            >
              <defs>
                <linearGradient id="rpsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1976D2" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#1976D2" stopOpacity={0} />
                </linearGradient>
              </defs>

              {/* gridlines Y */}
              {Array.from({ length: 4 }).map((_, i) => {
                const y = g1Pad.t + (i / 3) * g1InnerH;
                const v = Math.round((RPS_MAX * (3 - i)) / 3);
                return (
                  <g key={i}>
                    <line
                      x1={g1Pad.l}
                      x2={g1Pad.l + g1InnerW}
                      y1={y}
                      y2={y}
                      stroke="#E5E7EB"
                      strokeDasharray={i === 3 ? "0" : "2 4"}
                    />
                    <text
                      x={g1Pad.l - 6}
                      y={y + 3}
                      textAnchor="end"
                      className="fill-gray-400"
                      fontSize="9"
                    >
                      {v}
                    </text>
                  </g>
                );
              })}

              <polygon points={rpsArea} fill="url(#rpsGrad)" />
              <polyline
                points={rpsLine}
                fill="none"
                stroke="#1976D2"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Marqueur dernier point pulsant */}
              <circle
                cx={g1X(RPS.length - 1)}
                cy={g1Y(RPS_CURRENT)}
                r={6}
                fill="#1976D2"
                opacity={0.25}
              >
                <animate
                  attributeName="r"
                  values="6;12;6"
                  dur="1.4s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.25;0;0.25"
                  dur="1.4s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle
                cx={g1X(RPS.length - 1)}
                cy={g1Y(RPS_CURRENT)}
                r={4}
                fill="#1976D2"
              />

              {/* axe X */}
              <text
                x={g1Pad.l}
                y={g1H - 8}
                className="fill-gray-500"
                fontSize="10"
              >
                -60s
              </text>
              <text
                x={g1Pad.l + g1InnerW}
                y={g1H - 8}
                textAnchor="end"
                className="fill-gray-500"
                fontSize="10"
              >
                Maintenant
              </text>
            </svg>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* GRAPHIQUE 2 — Latency p50/p95/p99 (24h)                             */}
      {/* ================================================================== */}
      <Card className="rounded-2xl border-gray-200/80 shadow-sm">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-2">
          <div>
            <CardTitle className="font-heading text-lg text-kaza-navy">
              Latence p50 · p95 · p99 — 24h
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Seuil SLA fixé à 500 ms (ligne pointillée rouge)
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-4 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">p50</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-4 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">p95</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-4 rounded-full bg-red-500" />
              <span className="text-muted-foreground">p99</span>
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <svg
              viewBox={`0 0 ${g2W} ${g2H}`}
              className="h-[260px] w-full min-w-[600px]"
            >
              {/* grid Y */}
              {Array.from({ length: 5 }).map((_, i) => {
                const y = g2Pad.t + (i / 4) * g2InnerH;
                const v = Math.round((g2Max * (4 - i)) / 4);
                return (
                  <g key={i}>
                    <line
                      x1={g2Pad.l}
                      x2={g2Pad.l + g2InnerW}
                      y1={y}
                      y2={y}
                      stroke="#E5E7EB"
                      strokeDasharray={i === 4 ? "0" : "2 4"}
                    />
                    <text
                      x={g2Pad.l - 6}
                      y={y + 3}
                      textAnchor="end"
                      className="fill-gray-400"
                      fontSize="10"
                    >
                      {v}ms
                    </text>
                  </g>
                );
              })}

              {/* SLA threshold 500ms */}
              <line
                x1={g2Pad.l}
                x2={g2Pad.l + g2InnerW}
                y1={slaY}
                y2={slaY}
                stroke="#EF4444"
                strokeWidth={1.5}
                strokeDasharray="5 4"
              />
              <text
                x={g2Pad.l + g2InnerW - 4}
                y={slaY - 6}
                textAnchor="end"
                className="fill-red-500"
                fontSize="10"
                fontWeight="600"
              >
                SLA 500ms
              </text>

              {/* p99 */}
              <polyline
                points={p99Line}
                fill="none"
                stroke="#EF4444"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* p95 */}
              <polyline
                points={p95Line}
                fill="none"
                stroke="#F59E0B"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* p50 */}
              <polyline
                points={p50Line}
                fill="none"
                stroke="#4CAF50"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* X labels */}
              {LATENCY_24H.filter((_, i) => i % 4 === 0).map((p) => (
                <text
                  key={p.h}
                  x={g2X(p.h)}
                  y={g2H - 10}
                  textAnchor="middle"
                  className="fill-gray-500"
                  fontSize="10"
                >
                  {String(p.h).padStart(2, "0")}h
                </text>
              ))}
            </svg>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* GRAPHIQUE 3 — Error rate timeline (24h)                             */}
      {/* ================================================================== */}
      <Card className="rounded-2xl border-gray-200/80 shadow-sm">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-2">
          <div>
            <CardTitle className="font-heading text-lg text-kaza-navy">
              Taux d&apos;erreurs HTTP — 24h
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Barres horaires · vert &lt; 0.5% · ambre &lt; 1% · rouge ≥ 1%
            </p>
          </div>
          <Badge className="border-0 bg-red-50 text-red-700 hover:bg-red-50">
            Pic 17h : 1.6%
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <svg
              viewBox={`0 0 ${g3W} ${g3H}`}
              className="h-[220px] w-full min-w-[600px]"
            >
              {/* grid */}
              {Array.from({ length: 4 }).map((_, i) => {
                const y = g3Pad.t + (i / 3) * g3InnerH;
                const v = ((g3Max * (3 - i)) / 3).toFixed(1);
                return (
                  <g key={i}>
                    <line
                      x1={g3Pad.l}
                      x2={g3Pad.l + g3InnerW}
                      y1={y}
                      y2={y}
                      stroke="#E5E7EB"
                      strokeDasharray={i === 3 ? "0" : "2 4"}
                    />
                    <text
                      x={g3Pad.l - 6}
                      y={y + 3}
                      textAnchor="end"
                      className="fill-gray-400"
                      fontSize="10"
                    >
                      {v}%
                    </text>
                  </g>
                );
              })}

              {ERROR_RATE_24H.map((d, i) => {
                const h = (d.value / g3Max) * g3InnerH;
                const x = g3Pad.l + i * g3BarStep + (g3BarStep - g3BarW) / 2;
                const y = g3Pad.t + g3InnerH - h;
                const color =
                  d.value >= 1 ? "#EF4444" : d.value >= 0.5 ? "#F59E0B" : "#4CAF50";
                return (
                  <g key={i}>
                    <rect
                      x={x}
                      y={y}
                      width={g3BarW}
                      height={h}
                      fill={color}
                      rx={2}
                    />
                    {i % 3 === 0 && (
                      <text
                        x={x + g3BarW / 2}
                        y={g3H - 10}
                        textAnchor="middle"
                        className="fill-gray-500"
                        fontSize="10"
                      >
                        {String(i).padStart(2, "0")}h
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* GRAPHIQUE 4 — Donuts CPU par node                                   */}
      {/* ================================================================== */}
      <Card className="rounded-2xl border-gray-200/80 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="font-heading text-lg text-kaza-navy">
            Disponibilité services — CPU temps réel
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            6 nodes · seuils 70% (OK) / 85% (warn) / &gt;85% (critique)
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {SERVER_NODES.map((n) => {
              const cpuColor =
                n.cpu < 70 ? "#4CAF50" : n.cpu < 85 ? "#F59E0B" : "#EF4444";
              const cpuDash = (n.cpu / 100) * donutCirc;
              return (
                <div
                  key={n.id}
                  className="flex flex-col items-center rounded-xl border border-gray-200 bg-white p-3"
                >
                  <div className="relative">
                    <svg viewBox="0 0 100 100" className="h-24 w-24">
                      <circle
                        r={donutR}
                        cx={50}
                        cy={50}
                        fill="transparent"
                        stroke="#F1F5F9"
                        strokeWidth={10}
                      />
                      <circle
                        r={donutR}
                        cx={50}
                        cy={50}
                        fill="transparent"
                        stroke={cpuColor}
                        strokeWidth={10}
                        strokeDasharray={`${cpuDash} ${donutCirc - cpuDash}`}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span
                        className="font-heading text-lg font-bold"
                        style={{ color: cpuColor }}
                      >
                        {n.cpu}%
                      </span>
                      <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
                        CPU
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-center text-xs font-semibold text-kaza-navy">
                    {n.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{n.region}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* TABLE SERVER_NODES                                                  */}
      {/* ================================================================== */}
      <Card className="rounded-2xl border-gray-200/80 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="font-heading text-lg text-kaza-navy">
            Nodes infrastructure
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Détail par serveur · actions de maintenance disponibles
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-y border-gray-200 bg-gray-50/70 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-6 py-3 font-semibold">Node</th>
                  <th className="px-6 py-3 font-semibold">Région</th>
                  <th className="px-6 py-3 font-semibold">Statut</th>
                  <th className="px-6 py-3 font-semibold">CPU</th>
                  <th className="px-6 py-3 font-semibold">Mémoire</th>
                  <th className="px-6 py-3 text-right font-semibold">Requêtes 24h</th>
                  <th className="px-6 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {SERVER_NODES.map((n) => {
                  const cpuColor =
                    n.cpu < 70 ? "bg-emerald-500" : n.cpu < 85 ? "bg-amber-500" : "bg-red-500";
                  const memColor =
                    n.memory < 70 ? "bg-emerald-500" : n.memory < 85 ? "bg-amber-500" : "bg-red-500";
                  return (
                    <tr
                      key={n.id}
                      className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <Server className="h-4 w-4 text-kaza-navy" />
                          <span className="font-semibold text-kaza-navy">{n.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-600">
                        {n.region}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className="border-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                          {n.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className={`h-full ${cpuColor}`}
                              style={{ width: `${n.cpu}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-700">
                            {n.cpu}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className={`h-full ${memColor}`}
                              style={{ width: `${n.memory}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-700">
                            {n.memory}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-800">
                        {formatNumber(n.requests24h)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                            Redémarrer
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                            Drainer
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                            Logs
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* LOGS D'ERREURS                                                      */}
      {/* ================================================================== */}
      <Card className="rounded-2xl border-gray-200/80 shadow-sm">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-2">
          <div>
            <CardTitle className="font-heading text-lg text-kaza-navy">
              Logs d&apos;erreurs récents
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {ERROR_LOG.length} évènements · dernières 24h
            </p>
          </div>
          <Button variant="outline" size="sm">
            Voir tous les logs
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-y border-gray-200 bg-gray-50/70 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-6 py-3 font-semibold">Heure</th>
                  <th className="px-6 py-3 font-semibold">Niveau</th>
                  <th className="px-6 py-3 font-semibold">Service</th>
                  <th className="px-6 py-3 font-semibold">Message</th>
                  <th className="px-6 py-3 text-right font-semibold">Occurrences</th>
                </tr>
              </thead>
              <tbody>
                {ERROR_LOG.map((log) => {
                  const styleMap = {
                    ERROR: {
                      Icon: XCircle,
                      pill: "bg-red-100 text-red-700",
                      row: "bg-red-50/40",
                    },
                    WARN: {
                      Icon: AlertTriangle,
                      pill: "bg-amber-100 text-amber-700",
                      row: "bg-amber-50/40",
                    },
                    INFO: {
                      Icon: Info,
                      pill: "bg-blue-100 text-blue-700",
                      row: "",
                    },
                  } as const;
                  const cfg = styleMap[log.level as keyof typeof styleMap];
                  const Icon = cfg.Icon;
                  const date = new Date(log.timestamp);
                  return (
                    <tr
                      key={log.id}
                      className={`border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 ${cfg.row}`}
                    >
                      <td className="px-6 py-3 font-mono text-xs text-gray-600">
                        {date.toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-3">
                        <Badge className={`border-0 ${cfg.pill} hover:${cfg.pill}`}>
                          <Icon className="mr-1 h-3 w-3" />
                          {log.level}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 font-medium text-kaza-navy">
                        {log.service}
                      </td>
                      <td className="px-6 py-3 text-gray-700">{log.message}</td>
                      <td className="px-6 py-3 text-right">
                        <span className="inline-flex items-center justify-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                          ×{log.count}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* MÉTRIQUES AVANCÉES                                                  */}
      {/* ================================================================== */}
      <div>
        <h2 className="mb-3 font-heading text-lg font-bold text-kaza-navy">
          Métriques avancées
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Connexions actives",
              value: formatNumber(MONITORING_METRICS.activeConnections),
              Icon: Activity,
              tint: "text-kaza-blue",
              bg: "bg-blue-50",
            },
            {
              label: "Cache hit rate",
              value: `${MONITORING_METRICS.cacheHitRate}%`,
              Icon: Zap,
              tint: "text-emerald-600",
              bg: "bg-emerald-50",
            },
            {
              label: "DB queries/sec",
              value: formatNumber(MONITORING_METRICS.dbQueriesPerSecond),
              Icon: Database,
              tint: "text-purple-600",
              bg: "bg-purple-50",
            },
            {
              label: "Bytes transférés 24h",
              value: formatBytes(842_350_000_000),
              Icon: Cpu,
              tint: "text-amber-600",
              bg: "bg-amber-50",
            },
          ].map((m) => {
            const Icon = m.Icon;
            return (
              <Card key={m.label} className="rounded-2xl border-gray-200/80 shadow-sm">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${m.bg}`}>
                    <Icon className={`h-5 w-5 ${m.tint}`} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {m.label}
                    </p>
                    <p className="font-heading text-xl font-bold text-kaza-navy">
                      {m.value}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ================================================================== */}
      {/* ALERTES CONFIGURÉES                                                 */}
      {/* ================================================================== */}
      <Card className="rounded-2xl border-gray-200/80 shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
          <div>
            <CardTitle className="font-heading text-lg text-kaza-navy">
              Alertes configurées
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {ALERTS_CONFIG.filter((a) => a.on).length} / {ALERTS_CONFIG.length} actives
            </p>
          </div>
          <Bell className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {ALERTS_CONFIG.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3.5"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      a.severity === "CRITICAL" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-kaza-navy">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{a.channel}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    className={`border-0 ${
                      a.severity === "CRITICAL"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    } hover:bg-transparent`}
                  >
                    {a.severity}
                  </Badge>
                  <div
                    role="switch"
                    aria-checked={a.on}
                    className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${
                      a.on ? "bg-emerald-500" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                        a.on ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
