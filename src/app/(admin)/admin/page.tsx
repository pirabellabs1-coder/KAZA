import type { Metadata } from "next";
import Link from "next/link";
import {
  Users,
  Building2,
  Wallet,
  ShieldCheck,
  ArrowRight,
  Activity,
  CreditCard,
  FileWarning,
  UserCog,
  HomeIcon,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ScrollText,
  Inbox,
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
  getAdminStats,
  listAllAgencies,
  type AdminStats,
  type AdminAgencyRow,
} from "@/lib/queries/admin";
import { listAuditLogs, type AuditLogEntry } from "@/lib/queries/audit-logs";
import { runHealthchecks } from "@/lib/health/check";
import { formatFcfaShort, formatNumber, settleAll } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Centre de contrôle — Kaabo Admin",
  description: "Vue temps réel de la plateforme Kaabo.",
};

export const dynamic = "force-dynamic";

// =============================================================================
// Helpers
// =============================================================================

const ROLE_COLORS: Record<string, string> = {
  TENANT: "#1976D2",
  OWNER: "#4CAF50",
  STUDENT: "#F59E0B",
  AGENCY: "#9333EA",
  ADMIN: "#1A3A52",
};

const ROLE_LABELS: Record<string, string> = {
  TENANT: "Locataires",
  OWNER: "Propriétaires",
  STUDENT: "Étudiants",
  AGENCY: "Agences",
  ADMIN: "Admins",
};

const PROP_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Disponibles",
  RENTED: "Louées",
  PENDING_REVIEW: "À modérer",
  DRAFT: "Brouillons",
  UNAVAILABLE: "Indisponibles",
  ARCHIVED: "Archivées",
};

const PROP_STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-emerald-500",
  RENTED: "bg-kaza-blue",
  PENDING_REVIEW: "bg-amber-500",
  DRAFT: "bg-gray-400",
  UNAVAILABLE: "bg-orange-500",
  ARCHIVED: "bg-slate-500",
};

const HEALTH_BADGE: Record<string, { Icon: typeof CheckCircle2; color: string }> = {
  OK: { Icon: CheckCircle2, color: "text-emerald-600" },
  DEGRADED: { Icon: AlertTriangle, color: "text-amber-600" },
  DOWN: { Icon: XCircle, color: "text-red-600" },
  UNKNOWN: { Icon: HelpCircle, color: "text-gray-400" },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return `il y a ${d} j`;
}

// =============================================================================
// Page
// =============================================================================

// Replis (degradation gracieuse) — utilises si une requete echoue, pour que la
// page s'affiche avec des sections vides plutot qu'une erreur 500.
const EMPTY_STATS: AdminStats = {
  totalUsers: 0,
  usersByRole: { TENANT: 0, OWNER: 0, STUDENT: 0, ADMIN: 0 },
  totalProperties: 0,
  propertiesByStatus: {
    DRAFT: 0,
    PENDING_REVIEW: 0,
    AVAILABLE: 0,
    RENTED: 0,
    UNAVAILABLE: 0,
    ARCHIVED: 0,
  },
  activeRentals: 0,
  totalRevenue30d: 0,
  totalVisits30d: 0,
  pendingVerifications: 0,
};

const EMPTY_HEALTH: Awaited<ReturnType<typeof runHealthchecks>> = {
  checks: [],
  global: "UNKNOWN",
  lastCheckedAt: new Date(0).toISOString(),
};

export default async function AdminDashboardPage() {
  const [stats, agencies, auditLogs, health] = await settleAll(
    [
      getAdminStats(),
      listAllAgencies(),
      listAuditLogs({ limit: 6 }),
      runHealthchecks(),
    ] as const,
    [EMPTY_STATS, [] as AdminAgencyRow[], [] as AuditLogEntry[], EMPTY_HEALTH] as const,
  );

  // Donut roles (réel)
  const roleEntries = Object.entries(stats.usersByRole)
    .filter(([, count]) => count > 0)
    .map(([role, count]) => ({
      role,
      count,
      label: ROLE_LABELS[role] ?? role,
      color: ROLE_COLORS[role] ?? "#64748B",
      percentage: stats.totalUsers > 0 ? (count / stats.totalUsers) * 100 : 0,
    }));

  const donutR = 70;
  const donutCirc = 2 * Math.PI * donutR;
  let cumulative = 0;
  const donutSegments = roleEntries.map((item) => {
    const dashArray = (item.percentage / 100) * donutCirc;
    const dashOffset = -cumulative;
    cumulative += dashArray;
    return { ...item, dashArray, dashOffset };
  });

  // Properties by status (réel)
  const propsEntries = Object.entries(stats.propertiesByStatus)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      status,
      count,
      label: PROP_STATUS_LABELS[status] ?? status,
      color: PROP_STATUS_COLORS[status] ?? "bg-gray-400",
      percentage: stats.totalProperties > 0 ? (count / stats.totalProperties) * 100 : 0,
    }));

  // Top agences par # annonces actives
  const topAgencies = [...agencies]
    .sort((a, b) => b.activeProperties - a.activeProperties)
    .slice(0, 5);

  const quickActions = [
    { href: "/admin/users", label: "Utilisateurs", desc: `${formatNumber(stats.totalUsers)} comptes`, Icon: Users, color: "bg-blue-50", text: "text-blue-600" },
    { href: "/admin/properties", label: "Annonces", desc: `${formatNumber(stats.totalProperties)} au total`, Icon: HomeIcon, color: "bg-emerald-50", text: "text-emerald-600" },
    { href: "/admin/verifications", label: "Vérifications KYC", desc: `${stats.pendingVerifications} en attente`, Icon: ShieldCheck, color: "bg-amber-50", text: "text-amber-600" },
    { href: "/admin/agencies", label: "Agences", desc: `${formatNumber(agencies.length)} actives`, Icon: Building2, color: "bg-purple-50", text: "text-purple-600" },
    { href: "/admin/payments", label: "Paiements", desc: "Réconciliation", Icon: CreditCard, color: "bg-cyan-50", text: "text-cyan-600" },
    { href: "/admin/audit-log", label: "Audit log", desc: `${auditLogs.length} actions récentes`, Icon: ScrollText, color: "bg-slate-50", text: "text-slate-700" },
    { href: "/admin/staff", label: "Équipe staff", desc: "Permissions & rôles", Icon: UserCog, color: "bg-indigo-50", text: "text-indigo-600" },
    { href: "/admin/disputes", label: "Litiges", desc: "Gestion conflits", Icon: FileWarning, color: "bg-red-50", text: "text-red-600" },
  ];

  const globalUp = health.global === "OK";
  const globalDeg = health.global === "DEGRADED";

  return (
    <div className="space-y-8">
      {/* =================================================================== */}
      {/* HEADER navy gradient + statut global live                           */}
      {/* =================================================================== */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-kaza-navy via-[#1f4663] to-[#0f2638] p-6 text-white shadow-sm lg:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_60%)]" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-0 bg-amber-400 font-semibold uppercase tracking-wide text-kaza-navy hover:bg-amber-400">
                Admin
              </Badge>
              <span className="text-xs uppercase tracking-[0.18em] text-white/60">
                Console Kaabo
              </span>
            </div>
            <h1 className="font-heading text-3xl font-bold leading-tight lg:text-4xl">
              Centre de contrôle Kaabo
            </h1>
            <p className="text-sm text-white/70 lg:text-base">
              Données temps réel — utilisateurs, annonces, paiements, santé services.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <div
              className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 ${
                globalUp
                  ? "border-emerald-400/30 bg-emerald-400/10"
                  : globalDeg
                  ? "border-amber-400/30 bg-amber-400/10"
                  : "border-red-400/30 bg-red-400/10"
              }`}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                    globalUp ? "bg-emerald-400" : globalDeg ? "bg-amber-400" : "bg-red-400"
                  }`}
                />
                <span
                  className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                    globalUp ? "bg-emerald-400" : globalDeg ? "bg-amber-400" : "bg-red-400"
                  }`}
                />
              </span>
              <span
                className={`text-sm font-semibold ${
                  globalUp ? "text-emerald-300" : globalDeg ? "text-amber-300" : "text-red-300"
                }`}
              >
                {globalUp
                  ? "Tous les services opérationnels"
                  : globalDeg
                  ? "Service dégradé"
                  : "Incident en cours"}
              </span>
            </div>
            <p className="text-xs text-white/50">
              <Link href="/status" className="underline-offset-2 hover:underline">
                Voir le statut détaillé →
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* KPI CARDS (toutes les valeurs sont réelles)                         */}
      {/* =================================================================== */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl border-gray-200/80 shadow-sm">
          <CardContent className="p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
              <Users className="h-5 w-5 text-kaza-blue" />
            </div>
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Utilisateurs
            </p>
            <p className="mt-1 font-heading text-3xl font-bold text-kaza-navy">
              {formatNumber(stats.totalUsers)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {stats.usersByRole.TENANT} loc · {stats.usersByRole.OWNER} prop · {stats.usersByRole.STUDENT} étu
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 shadow-sm">
          <CardContent className="p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
              <Building2 className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Annonces
            </p>
            <p className="mt-1 font-heading text-3xl font-bold text-kaza-navy">
              {formatNumber(stats.totalProperties)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {stats.propertiesByStatus.AVAILABLE} dispo · {stats.propertiesByStatus.RENTED} louées
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 shadow-sm">
          <CardContent className="p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
              <Wallet className="h-5 w-5 text-amber-600" />
            </div>
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Revenus 30j
            </p>
            <p className="mt-1 font-heading text-3xl font-bold text-kaza-navy">
              {formatFcfaShort(stats.totalRevenue30d)} FCFA
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {formatNumber(stats.totalVisits30d)} visites demandées
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 shadow-sm">
          <CardContent className="p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
              <ShieldCheck className="h-5 w-5 text-orange-600" />
            </div>
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Vérifications KYC
            </p>
            <p className="mt-1 font-heading text-3xl font-bold text-kaza-navy">
              {stats.pendingVerifications}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              dossiers en attente d&apos;examen
            </p>
          </CardContent>
        </Card>
      </div>

      {/* =================================================================== */}
      {/* Distribution rôles (donut réel) + Statut annonces (barres réelles)  */}
      {/* =================================================================== */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-2xl border-gray-200/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-lg text-kaza-navy">
              Distribution par rôle
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Répartition des {formatNumber(stats.totalUsers)} comptes inscrits
            </p>
          </CardHeader>
          <CardContent>
            {donutSegments.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Inbox className="h-8 w-8 text-gray-300" />
                <p className="text-sm text-muted-foreground">Aucun utilisateur inscrit.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-8">
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
                      {formatNumber(stats.totalUsers)}
                    </span>
                  </div>
                </div>

                <ul className="w-full flex-1 space-y-2.5">
                  {donutSegments.map((item) => (
                    <li
                      key={item.role}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-medium text-gray-700">{item.label}</span>
                      </span>
                      <span className="flex items-baseline gap-2">
                        <span className="font-semibold text-kaza-navy">
                          {formatNumber(item.count)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.percentage.toFixed(1)}%
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-lg text-kaza-navy">
              Annonces par statut
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {formatNumber(stats.totalProperties)} annonces au total
            </p>
          </CardHeader>
          <CardContent>
            {propsEntries.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Inbox className="h-8 w-8 text-gray-300" />
                <p className="text-sm text-muted-foreground">
                  Aucune annonce publiée pour le moment.
                </p>
              </div>
            ) : (
              <ul className="space-y-3.5">
                {propsEntries.map((p) => (
                  <li key={p.status}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-800">{p.label}</span>
                      <span className="flex items-baseline gap-2">
                        <span className="font-semibold text-kaza-navy">
                          {formatNumber(p.count)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {p.percentage.toFixed(1)}%
                        </span>
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full ${p.color}`}
                        style={{ width: `${p.percentage}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* =================================================================== */}
      {/* Top agences (réel) + Activité admin récente (audit logs réels)      */}
      {/* =================================================================== */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-2xl border-gray-200/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="font-heading text-lg text-kaza-navy">
                Top agences
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Triées par # annonces disponibles
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-kaza-blue">
              <Link href="/admin/agencies">
                Voir tout <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {topAgencies.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Building2 className="h-8 w-8 text-gray-300" />
                <p className="text-sm text-muted-foreground">
                  Aucune agence inscrite pour le moment.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {topAgencies.map((a, i) => (
                  <li key={a.id} className="flex items-center gap-3 py-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-700">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-kaza-navy">
                        {a.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {a.city ?? "—"} · {a.planName ?? "Sans abonnement"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-kaza-navy">
                        {a.activeProperties}
                      </p>
                      <p className="text-xs text-muted-foreground">annonces</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="font-heading text-lg text-kaza-navy">
                Activité admin récente
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Dernières actions enregistrées
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-kaza-blue">
              <Link href="/admin/audit-log">
                Audit log <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {auditLogs.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Activity className="h-8 w-8 text-gray-300" />
                <p className="text-sm text-muted-foreground">
                  Aucune action admin enregistrée pour le moment.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {auditLogs.map((log) => (
                  <li
                    key={log.id}
                    className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3"
                  >
                    <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold text-kaza-navy ring-1 ring-gray-200">
                      {(log.adminName ?? "?").charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-kaza-navy">
                        <span className="font-semibold">{log.adminName}</span>
                        <span className="text-muted-foreground"> · {log.action}</span>
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {log.targetType}
                        {log.targetLabel ? ` · ${log.targetLabel}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {timeAgo(log.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* =================================================================== */}
      {/* Santé services live (depuis runHealthchecks)                        */}
      {/* =================================================================== */}
      <Card className="rounded-2xl border-gray-200/80 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="font-heading text-lg text-kaza-navy">
              Santé des services
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Healthchecks live — détails publics sur /status
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild className="text-kaza-blue">
            <Link href="/status">
              Page statut <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {health.checks.map((c) => {
              const badge = HEALTH_BADGE[c.status];
              const Icon = badge.Icon;
              return (
                <li
                  key={c.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/60 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-kaza-navy">
                      {c.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.latencyMs != null ? `${c.latencyMs} ms` : c.message ?? "—"}
                    </p>
                  </div>
                  <Icon className={`h-5 w-5 shrink-0 ${badge.color}`} />
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      {/* =================================================================== */}
      {/* QUICK ACTIONS                                                       */}
      {/* =================================================================== */}
      <div>
        <h2 className="mb-4 font-heading text-lg font-semibold text-kaza-navy">
          Raccourcis
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="group relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm transition hover:border-kaza-blue/30 hover:shadow-md"
            >
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${a.color}`}>
                <a.Icon className={`h-5 w-5 ${a.text}`} />
              </div>
              <p className="text-sm font-semibold text-kaza-navy">{a.label}</p>
              <p className="text-xs text-muted-foreground">{a.desc}</p>
              <ArrowRight className="absolute right-3 top-3 h-4 w-4 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-kaza-blue" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
