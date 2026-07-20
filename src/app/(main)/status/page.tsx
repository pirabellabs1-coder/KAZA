import type { Metadata } from "next";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Globe,
  HelpCircle,
  Lock,
  Mail,
  Radio,
  ShieldCheck,
  Wrench,
  XCircle,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  runHealthchecks,
  listOpenIncidents,
  listRecentResolvedIncidents,
  listUpcomingMaintenances,
  getUptimeSummary,
  getLatencyHourly24h,
  getDailyUptime90d,
  type ServiceCheck,
  type ServiceHealth,
} from "@/lib/health/check";

export const metadata: Metadata = {
  title: "Statut plateforme — Kaabo",
  description:
    "Surveillance en temps réel de l'ensemble des services Kaabo. Transparence totale, mises à jour automatiques.",
};

// Force dynamic + revalidate toutes les 60 secondes
export const dynamic = "force-dynamic";
export const revalidate = 60;

// ---------------------------------------------------------------------------
// Helpers UI
// ---------------------------------------------------------------------------

const SERVICE_ICONS: Record<string, typeof Globe> = {
  frontend: Globe,
  rest: Zap,
  database: Database,
  auth: Lock,
  storage: ShieldCheck,
  realtime: Radio,
  email: Mail,
};

const STATUS_LABELS: Record<ServiceHealth, string> = {
  OK: "Opérationnel",
  DEGRADED: "Dégradé",
  DOWN: "Indisponible",
  UNKNOWN: "Statut inconnu",
};

const STATUS_COLORS: Record<
  ServiceHealth,
  { dot: string; badge: string; ring: string; text: string }
> = {
  OK: {
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    ring: "ring-emerald-500/30",
    text: "text-emerald-600",
  },
  DEGRADED: {
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    ring: "ring-amber-500/30",
    text: "text-amber-600",
  },
  DOWN: {
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-700 border-red-200",
    ring: "ring-red-500/30",
    text: "text-red-600",
  },
  UNKNOWN: {
    dot: "bg-slate-400",
    badge: "bg-slate-50 text-slate-700 border-slate-200",
    ring: "ring-slate-400/30",
    text: "text-slate-500",
  },
};

const STATUS_ICONS: Record<ServiceHealth, typeof CheckCircle2> = {
  OK: CheckCircle2,
  DEGRADED: AlertTriangle,
  DOWN: XCircle,
  UNKNOWN: HelpCircle,
};

function GlobalBanner({ status }: { status: ServiceHealth }) {
  const colors = STATUS_COLORS[status];
  const Icon = STATUS_ICONS[status];
  const labels: Record<ServiceHealth, string> = {
    OK: "Tous les systèmes sont opérationnels",
    DEGRADED: "Certains systèmes rencontrent des ralentissements",
    DOWN: "Une panne est en cours sur un ou plusieurs services critiques",
    UNKNOWN: "Statut partiel — certaines vérifications n'ont pas abouti",
  };
  return (
    <div
      className={`mx-auto inline-flex items-center gap-3 rounded-full border bg-white px-5 py-2.5 shadow-sm ring-4 ${colors.ring}`}
    >
      <span className="relative flex size-3">
        <span
          className={`absolute inset-0 inline-flex size-3 animate-ping rounded-full opacity-75 ${colors.dot}`}
        />
        <span className={`relative inline-flex size-3 rounded-full ${colors.dot}`} />
      </span>
      <Icon className={`size-5 ${colors.text}`} />
      <span className="font-heading text-base font-bold text-kaza-navy">
        {labels[status]}
      </span>
    </div>
  );
}

function ServiceRow({ check }: { check: ServiceCheck }) {
  const Icon = SERVICE_ICONS[check.id] ?? Globe;
  const StatusIcon = STATUS_ICONS[check.status];
  const colors = STATUS_COLORS[check.status];
  return (
    <li className="flex items-center justify-between gap-3 border-b border-border/60 py-4 last:border-0">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-kaza-navy/5 text-kaza-navy">
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">{check.name}</p>
          <p className="text-[11px] text-muted-foreground">
            {check.latencyMs != null && (
              <>
                <Clock className="mr-0.5 inline size-3" />
                {check.latencyMs} ms
                {check.details ? ` · ${check.details}` : ""}
              </>
            )}
            {check.message && (
              <span className="text-rose-600">{check.message}</span>
            )}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <StatusIcon className={`size-4 ${colors.text}`} />
        <Badge className={colors.badge}>{STATUS_LABELS[check.status]}</Badge>
      </div>
    </li>
  );
}

const SEVERITY_BADGE: Record<string, string> = {
  MINOR: "bg-blue-100 text-blue-700 border-blue-200",
  MAJOR: "bg-amber-100 text-amber-700 border-amber-200",
  CRITICAL: "bg-red-100 text-red-700 border-red-200",
  MAINTENANCE: "bg-purple-100 text-purple-700 border-purple-200",
};

const SEVERITY_LABEL: Record<string, string> = {
  MINOR: "Mineur",
  MAJOR: "Majeur",
  CRITICAL: "Critique",
  MAINTENANCE: "Maintenance",
};

const INCIDENT_STATUS_LABEL: Record<string, string> = {
  INVESTIGATING: "Enquête en cours",
  IDENTIFIED: "Cause identifiée",
  MONITORING: "Sous surveillance",
  RESOLVED: "Résolu",
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// PAGE
// ---------------------------------------------------------------------------

export default async function StatusPage() {
  const [
    health,
    openIncidents,
    resolvedIncidents,
    maintenances,
    uptime,
    latencyHourly,
    daily90d,
  ] = await Promise.all([
    runHealthchecks(),
    listOpenIncidents(),
    listRecentResolvedIncidents(8),
    listUpcomingMaintenances(),
    getUptimeSummary(),
    getLatencyHourly24h(),
    getDailyUptime90d(),
  ]);
  const uptimeById = new Map(uptime.map((u) => [u.serviceId, u]));
  const hasHistory = uptime.some((u) => u.samplesCount > 0);

  // ---- Données dérivées pour les graphes additionnels (toutes réelles) ----

  // 1) Uptime global par jour (30 derniers jours, depuis daily90d).
  const daily30 = [...daily90d]
    .sort((a, b) => a.day.localeCompare(b.day))
    .slice(-30)
    .map((d) => ({
      day: d.day,
      pct: d.total > 0 ? ((d.total - d.down - d.degraded) / d.total) * 100 : null,
    }));
  const daily30WithData = daily30.filter((d) => d.pct !== null);
  const globalUptime30 =
    daily30WithData.length > 0
      ? daily30WithData.reduce((s, d) => s + (d.pct ?? 0), 0) /
        daily30WithData.length
      : null;

  // 2) Latence moy par service + 3) uptime 7j par service.
  const perService = [...uptime].sort((a, b) =>
    a.serviceName.localeCompare(b.serviceName),
  );
  const maxLatency = Math.max(1, ...perService.map((u) => u.avgLatencyMs));

  // 4) Volume de checks par heure (24h) — somme des samples tous services.
  const volumeByHour = new Map<string, number>();
  for (const l of latencyHourly) {
    const key = new Date(l.hour).toISOString().slice(0, 13);
    volumeByHour.set(key, (volumeByHour.get(key) ?? 0) + l.samples);
  }
  const volumePoints = Array.from(volumeByHour.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([hour, count]) => ({ hour, count }));
  const maxVolume = Math.max(1, ...volumePoints.map((p) => p.count));

  // 6) Dernier incident (résolu récent sinon ouvert).
  const lastIncident = resolvedIncidents[0] ?? openIncidents[0] ?? null;

  return (
    <div className="bg-gray-50">
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-kaza-navy via-[#0E2A40] to-kaza-blue py-16 lg:py-20">
        <div className="relative mx-auto max-w-4xl px-4 text-center lg:px-8">
          <div className="mb-6 inline-flex items-center justify-center">
            <span className="flex size-20 items-center justify-center rounded-full bg-white/10 ring-4 ring-white/20 backdrop-blur">
              <Activity className="size-10 text-white" />
            </span>
          </div>
          <h1 className="font-heading text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
            Statut de la plateforme
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/80 sm:text-lg">
            Surveillance en temps réel de l&apos;ensemble des services Kaabo.
            Mises à jour automatiques toutes les 60 secondes.
          </p>
          <div className="mt-8 flex justify-center">
            <GlobalBanner status={health.global} />
          </div>
          <p className="mt-3 text-xs text-white/60">
            Dernière vérification : {formatDateTime(health.lastCheckedAt)}
          </p>
        </div>
      </section>

      {/* SERVICES LIVE */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-4xl space-y-8 px-4 lg:px-8">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading text-base text-kaza-navy">
                <Activity className="size-5 text-kaza-blue" />
                État des services en direct
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Chaque service est testé toutes les 60 s avec un timeout de
                5 s.
              </p>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border/60">
                {health.checks.map((check) => (
                  <ServiceRow key={check.id} check={check} />
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* UPTIME PAR SERVICE — derniers 24h/7j/30j */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading text-base text-kaza-navy">
                <CheckCircle2 className="size-5 text-emerald-600" />
                Disponibilité par service
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Calculée depuis l&apos;historique des healthchecks (snapshots
                stockés en base).
              </p>
            </CardHeader>
            <CardContent>
              {!hasHistory ? (
                <div className="rounded-xl border-2 border-dashed border-kaza-blue/30 bg-kaza-blue/5 p-8 text-center">
                  <Activity className="mx-auto size-8 text-kaza-blue" />
                  <p className="mt-2 font-semibold text-kaza-navy">
                    Construction de l&apos;historique en cours
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Les graphes de disponibilité apparaîtront après quelques
                    heures de fonctionnement (snapshot toutes les 60 s).
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead>
                      <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                        <th className="pb-2 font-semibold">Service</th>
                        <th className="pb-2 text-right font-semibold">24 h</th>
                        <th className="pb-2 text-right font-semibold">7 j</th>
                        <th className="pb-2 text-right font-semibold">30 j</th>
                        <th className="pb-2 text-right font-semibold">
                          Latence moy.
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {health.checks.map((c) => {
                        const u = uptimeById.get(c.id);
                        const fmt = (v?: number) =>
                          v == null || v === 0
                            ? "—"
                            : `${v.toFixed(v >= 99.95 ? 3 : 2)}%`;
                        return (
                          <tr key={c.id}>
                            <td className="py-2 font-medium text-foreground">
                              {c.name}
                            </td>
                            <td className="py-2 text-right tabular-nums text-kaza-navy">
                              {fmt(u?.uptime24h)}
                            </td>
                            <td className="py-2 text-right tabular-nums text-kaza-navy">
                              {fmt(u?.uptime7d)}
                            </td>
                            <td className="py-2 text-right tabular-nums text-kaza-navy">
                              {fmt(u?.uptime30d)}
                            </td>
                            <td className="py-2 text-right tabular-nums text-muted-foreground">
                              {u?.avgLatencyMs
                                ? `${u.avgLatencyMs} ms`
                                : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* GRAPHE LATENCE 24h — SVG natif */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading text-base text-kaza-navy">
                <Activity className="size-5 text-kaza-blue" />
                Latence base de données — 24 dernières heures
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Temps de réponse moyen (ms) par heure pour la base de données
                Supabase.
              </p>
            </CardHeader>
            <CardContent>
              {(() => {
                const dbPoints = latencyHourly
                  .filter((p) => p.serviceId === "database")
                  .slice(-24);
                if (dbPoints.length === 0) {
                  return (
                    <div className="rounded-xl border-2 border-dashed border-kaza-blue/30 bg-kaza-blue/5 p-8 text-center">
                      <Activity className="mx-auto size-8 text-kaza-blue" />
                      <p className="mt-2 font-semibold text-kaza-navy">
                        Pas encore de données sur 24h
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Revenez après quelques heures pour voir le graphique
                        s&apos;alimenter.
                      </p>
                    </div>
                  );
                }
                const maxL = Math.max(50, ...dbPoints.map((p) => p.avgLatency));
                const w = 720;
                const h = 200;
                const padL = 40;
                const padR = 12;
                const padT = 16;
                const padB = 28;
                const innerW = w - padL - padR;
                const innerH = h - padT - padB;
                const x = (i: number) =>
                  padL +
                  (dbPoints.length <= 1
                    ? innerW / 2
                    : (i / (dbPoints.length - 1)) * innerW);
                const y = (v: number) =>
                  padT + innerH - (v / maxL) * innerH;
                const points = dbPoints
                  .map((p, i) => `${x(i)},${y(p.avgLatency)}`)
                  .join(" ");
                const areaPath =
                  `M ${x(0)},${padT + innerH} ` +
                  dbPoints
                    .map((p, i) => `L ${x(i)},${y(p.avgLatency)}`)
                    .join(" ") +
                  ` L ${x(dbPoints.length - 1)},${padT + innerH} Z`;
                return (
                  <div className="overflow-x-auto">
                    <svg
                      viewBox={`0 0 ${w} ${h}`}
                      className="h-[200px] w-full min-w-[640px]"
                    >
                      <defs>
                        <linearGradient
                          id="latencyGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="0%" stopColor="#1976D2" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#1976D2" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      {[0.25, 0.5, 0.75].map((p) => (
                        <line
                          key={p}
                          x1={padL}
                          x2={w - padR}
                          y1={padT + innerH * p}
                          y2={padT + innerH * p}
                          stroke="#E5E7EB"
                          strokeDasharray="3 4"
                        />
                      ))}
                      <path d={areaPath} fill="url(#latencyGrad)" />
                      <polyline
                        fill="none"
                        stroke="#1976D2"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={points}
                      />
                      {dbPoints.map((p, i) => (
                        <circle
                          key={i}
                          cx={x(i)}
                          cy={y(p.avgLatency)}
                          r={3}
                          fill="#1976D2"
                        >
                          <title>{`${new Date(p.hour).toLocaleString("fr-FR")} · ${p.avgLatency} ms (${p.samples} mesures)`}</title>
                        </circle>
                      ))}
                      <text
                        x={padL - 6}
                        y={padT + 4}
                        textAnchor="end"
                        fontSize={9}
                        fill="#6B7280"
                      >
                        {Math.round(maxL)} ms
                      </text>
                      <text
                        x={padL - 6}
                        y={padT + innerH}
                        textAnchor="end"
                        fontSize={9}
                        fill="#6B7280"
                      >
                        0
                      </text>
                    </svg>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* CALENDRIER 90 JOURS — disponibilité globale */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading text-base text-kaza-navy">
                <Clock className="size-5 text-muted-foreground" />
                Disponibilité — 90 derniers jours
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Chaque carré = 1 jour. Vert = OK · Ambre = dégradé · Rouge =
                panne · Gris = pas de mesure.
              </p>
            </CardHeader>
            <CardContent>
              {(() => {
                // Build last 90 days array (most recent on the right)
                const days: Array<{
                  date: string;
                  ratio: number | null;
                  total: number;
                  down: number;
                  degraded: number;
                }> = [];
                const byDay = new Map(daily90d.map((d) => [d.day, d]));
                for (let i = 89; i >= 0; i--) {
                  const dt = new Date();
                  dt.setDate(dt.getDate() - i);
                  const key = dt.toISOString().slice(0, 10);
                  const found = byDay.get(key);
                  days.push({
                    date: key,
                    ratio: found ? found.ratio : null,
                    total: found?.total ?? 0,
                    down: found?.down ?? 0,
                    degraded: found?.degraded ?? 0,
                  });
                }
                const color = (
                  ratio: number | null,
                  total: number,
                  down: number,
                  degraded: number,
                ): string => {
                  if (ratio === null || total === 0) return "bg-slate-200";
                  if (down > 0) return "bg-red-500";
                  if (degraded > 0 || ratio < 0.99) return "bg-amber-400";
                  return "bg-emerald-500";
                };
                return (
                  <div className="space-y-3">
                    <div
                      className="grid gap-1"
                      style={{
                        gridTemplateColumns: "repeat(45, minmax(0, 1fr))",
                      }}
                    >
                      {days.map((d) => (
                        <div
                          key={d.date}
                          className={`aspect-square rounded-sm ${color(d.ratio, d.total, d.down, d.degraded)}`}
                          title={`${d.date} — ${
                            d.total === 0
                              ? "pas de mesure"
                              : `${d.total} mesures · ${(d.ratio! * 100).toFixed(2)}% OK`
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <span className="size-2.5 rounded-sm bg-emerald-500" />
                        100% disponible
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="size-2.5 rounded-sm bg-amber-400" />
                        Dégradations
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="size-2.5 rounded-sm bg-red-500" />
                        Panne
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="size-2.5 rounded-sm bg-slate-200" />
                        Pas de mesure
                      </span>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* ============================================================ */}
          {/* WIDGETS DE SUIVI (2) — uptime global 30j + dernier incident   */}
          {/* ============================================================ */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="rounded-2xl border-gray-200/80 shadow-sm">
              <CardContent className="p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Temps de fonctionnement (30 j)
                </p>
                <p className="mt-2 font-heading text-4xl font-bold text-kaza-navy">
                  {globalUptime30 !== null
                    ? `${globalUptime30.toFixed(2)} %`
                    : "—"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {globalUptime30 !== null
                    ? "Disponibilité moyenne tous services confondus"
                    : "Données en cours de collecte"}
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-gray-200/80 shadow-sm">
              <CardContent className="p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Dernier incident
                </p>
                {lastIncident ? (
                  <>
                    <p className="mt-2 truncate font-heading text-lg font-bold text-kaza-navy">
                      {lastIncident.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {lastIncident.severity} ·{" "}
                      {new Date(
                        lastIncident.resolvedAt ?? lastIncident.startedAt,
                      ).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mt-2 font-heading text-lg font-bold text-emerald-600">
                      Aucun incident récent
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Tous les services fonctionnent normalement.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ============================================================ */}
          {/* GRAPHE 1 — Uptime global 30 jours (courbe)                    */}
          {/* ============================================================ */}
          <Card className="rounded-2xl border-gray-200/80 shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading text-base text-kaza-navy">
                Disponibilité globale — 30 derniers jours
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                % de checks OK par jour, tous services confondus.
              </p>
            </CardHeader>
            <CardContent>
              {daily30WithData.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Données en cours de collecte.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <svg viewBox="0 0 720 180" className="h-44 w-full min-w-[560px]">
                    {[0, 25, 50, 75, 100].map((g) => (
                      <line
                        key={g}
                        x1={40}
                        x2={712}
                        y1={20 + ((100 - g) / 100) * 140}
                        y2={20 + ((100 - g) / 100) * 140}
                        stroke="#E5E7EB"
                        strokeDasharray={g === 0 ? "0" : "2 4"}
                      />
                    ))}
                    <polyline
                      fill="none"
                      stroke="#4CAF50"
                      strokeWidth={2.5}
                      strokeLinejoin="round"
                      points={daily30
                        .map((d, i) => {
                          const x =
                            40 + (i / Math.max(1, daily30.length - 1)) * 672;
                          const y = 20 + ((100 - (d.pct ?? 0)) / 100) * 140;
                          return `${x},${y}`;
                        })
                        .join(" ")}
                    />
                    <text x={4} y={24} className="fill-gray-400" fontSize="10">
                      100%
                    </text>
                    <text x={10} y={164} className="fill-gray-400" fontSize="10">
                      0%
                    </text>
                  </svg>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ============================================================ */}
          {/* GRAPHE 2 + 3 — Latence par service & Uptime 7j par service    */}
          {/* ============================================================ */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="rounded-2xl border-gray-200/80 shadow-sm">
              <CardHeader>
                <CardTitle className="font-heading text-base text-kaza-navy">
                  Latence moyenne par service
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Temps de réponse moyen (ms) — 30 derniers jours.
                </p>
              </CardHeader>
              <CardContent>
                {!hasHistory ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Données en cours de collecte.
                  </p>
                ) : (
                  <ul className="space-y-2.5">
                    {perService.map((u) => (
                      <li key={u.serviceId}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="font-medium text-gray-700">
                            {u.serviceName}
                          </span>
                          <span className="text-muted-foreground">
                            {u.avgLatencyMs} ms
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-kaza-blue"
                            style={{
                              width: `${(u.avgLatencyMs / maxLatency) * 100}%`,
                            }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-gray-200/80 shadow-sm">
              <CardHeader>
                <CardTitle className="font-heading text-base text-kaza-navy">
                  Disponibilité 7 jours par service
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  % de checks OK sur les 7 derniers jours.
                </p>
              </CardHeader>
              <CardContent>
                {!hasHistory ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Données en cours de collecte.
                  </p>
                ) : (
                  <ul className="space-y-2.5">
                    {perService.map((u) => {
                      const pct = u.uptime7d;
                      const color =
                        pct >= 99
                          ? "bg-emerald-500"
                          : pct >= 95
                            ? "bg-amber-500"
                            : "bg-red-500";
                      return (
                        <li key={u.serviceId}>
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="font-medium text-gray-700">
                              {u.serviceName}
                            </span>
                            <span className="text-muted-foreground">
                              {pct.toFixed(1)} %
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                            <div
                              className={`h-full rounded-full ${color}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ============================================================ */}
          {/* GRAPHE 4 — Volume de checks par heure (24h)                   */}
          {/* ============================================================ */}
          <Card className="rounded-2xl border-gray-200/80 shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading text-base text-kaza-navy">
                Volume de surveillance — 24 dernières heures
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Nombre de vérifications effectuées par heure.
              </p>
            </CardHeader>
            <CardContent>
              {volumePoints.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Données en cours de collecte.
                </p>
              ) : (
                <div className="flex h-40 items-end gap-1 overflow-x-auto">
                  {volumePoints.map((p) => (
                    <div
                      key={p.hour}
                      className="flex min-w-[10px] flex-1 flex-col items-center justify-end"
                      title={`${p.count} checks`}
                    >
                      <div
                        className="w-full rounded-t bg-gradient-to-t from-kaza-navy to-kaza-blue"
                        style={{ height: `${(p.count / maxVolume) * 100}%` }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* INCIDENTS OUVERTS */}
          {openIncidents.length > 0 && (
            <Card className="rounded-2xl border-amber-300 bg-amber-50/40 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading text-base text-amber-900">
                  <AlertCircle className="size-5 text-amber-600" />
                  Incidents en cours ({openIncidents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {openIncidents.map((inc) => (
                    <li
                      key={inc.id}
                      className="rounded-xl border border-amber-200 bg-white p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={SEVERITY_BADGE[inc.severity] ?? ""}>
                              {SEVERITY_LABEL[inc.severity] ?? inc.severity}
                            </Badge>
                            <Badge variant="outline">
                              {INCIDENT_STATUS_LABEL[inc.status] ?? inc.status}
                            </Badge>
                          </div>
                          <p className="mt-2 font-semibold text-kaza-navy">
                            {inc.title}
                          </p>
                          {inc.description && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {inc.description}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Depuis {formatDateTime(inc.startedAt)}
                        </span>
                      </div>
                      {inc.affectedServices.length > 0 && (
                        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
                          <span className="text-muted-foreground">
                            Services impactés :
                          </span>
                          {inc.affectedServices.map((s) => (
                            <Badge
                              key={s}
                              variant="outline"
                              className="text-[10px]"
                            >
                              {s}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {inc.updates.length > 0 && (
                        <ul className="mt-3 space-y-1 border-t pt-3 text-xs">
                          {inc.updates.slice(0, 5).map((u, i) => (
                            <li
                              key={i}
                              className="flex items-baseline gap-2 text-muted-foreground"
                            >
                              <span className="text-[10px]">
                                {formatDateTime(u.at)}
                              </span>
                              <span>{u.message}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* MAINTENANCES PROGRAMMÉES */}
          {maintenances.length > 0 && (
            <Card className="rounded-2xl border-purple-200 bg-purple-50/30 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading text-base text-purple-900">
                  <Wrench className="size-5 text-purple-600" />
                  Maintenances programmées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {maintenances.map((m) => (
                    <li
                      key={m.id}
                      className="rounded-xl border border-purple-200 bg-white p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-kaza-navy">
                            {m.title}
                          </p>
                          {m.description && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {m.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-xs">
                          <p className="font-semibold text-purple-700">
                            {formatDateTime(m.scheduledAt)}
                          </p>
                          <p className="text-muted-foreground">
                            Durée : {m.durationMinutes} min
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* HISTORIQUE INCIDENTS */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading text-base text-kaza-navy">
                <Clock className="size-5 text-muted-foreground" />
                Historique des incidents résolus
              </CardTitle>
            </CardHeader>
            <CardContent>
              {resolvedIncidents.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 p-8 text-center">
                  <CheckCircle2 className="mx-auto size-8 text-emerald-600" />
                  <p className="mt-2 font-semibold text-emerald-800">
                    Aucun incident enregistré
                  </p>
                  <p className="mt-1 text-xs text-emerald-700/80">
                    La plateforme tourne sans incident depuis sa mise en
                    production.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {resolvedIncidents.map((inc) => (
                    <li key={inc.id} className="py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="size-4 text-emerald-600" />
                          <span className="text-sm font-medium text-foreground">
                            {inc.title}
                          </span>
                          <Badge className={SEVERITY_BADGE[inc.severity] ?? ""}>
                            {SEVERITY_LABEL[inc.severity] ?? inc.severity}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Résolu le{" "}
                          {inc.resolvedAt
                            ? formatDateTime(inc.resolvedAt)
                            : "—"}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* INFO TECHNIQUE */}
          <div className="rounded-2xl border bg-white p-5 text-xs text-muted-foreground">
            <p className="mb-2 font-semibold text-kaza-navy">
              À propos de cette page
            </p>
            <p>
              Cette page interroge en direct chaque dépendance critique de
              Kaabo (frontend, API, base de données, authentification,
              stockage, temps réel, emails). Les incidents et maintenances
              sont publiés par l&apos;équipe technique depuis le tableau de
              bord administrateur et apparaissent ici immédiatement.
            </p>
            <p className="mt-2">
              Sources : healthchecks live via{" "}
              <code className="rounded bg-slate-100 px-1">
                /lib/health/check.ts
              </code>{" "}
              · Tables{" "}
              <code className="rounded bg-slate-100 px-1">incidents</code> et{" "}
              <code className="rounded bg-slate-100 px-1">maintenances</code>{" "}
              (Supabase).
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
