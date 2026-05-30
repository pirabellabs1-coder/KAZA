import type { Metadata } from "next";
import {
  AlertTriangle,
  Calendar,
  Shield,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  getAuditStats,
  getTopAdminsByActivity,
  listAuditLogs,
  type AuditLogEntry,
} from "@/lib/queries/audit-logs";

import { AuditFilters } from "./audit-filters";

export const metadata: Metadata = {
  title: "Journal d'audit — KAZA Admin",
  description: "Traçabilité de toutes les actions administratives.",
};

// =============================================================================
// Labels & couleurs
// =============================================================================

const ACTION_LABELS: Record<string, string> = {
  USER_SUSPENDED: "Suspension utilisateur",
  USER_BANNED: "Bannissement utilisateur",
  USER_REACTIVATED: "Réactivation utilisateur",
  USER_DELETED: "Suppression utilisateur",
  USER_ROLE_CHANGED: "Changement de rôle",
  USER_IMPERSONATED: "Connexion en tant que",
  PROPERTY_APPROVED: "Annonce approuvée",
  PROPERTY_REJECTED: "Annonce rejetée",
  PROPERTY_FEATURED: "Annonce mise en avant",
  PROPERTY_HIDDEN: "Annonce masquée",
  CONTRACT_TERMINATED: "Contrat résilié",
  CONTRACT_VALIDATED: "Contrat validé",
  AGENCY_SUSPENDED: "Agence suspendue",
  AGENCY_PLAN_CHANGED: "Plan agence modifié",
  AGENCY_KYC_APPROVED: "KYC agence approuvé",
  PAYMENT_REFUNDED: "Paiement remboursé",
  WALLET_FROZEN: "Wallet gelé",
  WALLET_UNFROZEN: "Wallet dégelé",
  FEATURE_FLAG_TOGGLED: "Feature flag",
  EMAIL_TEMPLATE_EDITED: "Template email modifié",
  GDPR_EXPORT: "Export RGPD",
  GDPR_DELETION: "Suppression RGPD",
  KYC_APPROVED: "Identité validée",
  KYC_REJECTED: "Identité rejetée",
  OTHER: "Autre action",
};

const TARGET_CATEGORY_COLORS: Record<string, string> = {
  USER: "bg-blue-100 text-blue-700",
  PROPERTY: "bg-emerald-100 text-emerald-700",
  CONTRACT: "bg-amber-100 text-amber-700",
  AGENCY: "bg-purple-100 text-purple-700",
  PAYMENT: "bg-cyan-100 text-cyan-700",
  SYSTEM: "bg-slate-200 text-slate-700",
};

const RISK_ACTIONS: ReadonlySet<string> = new Set([
  "USER_BANNED",
  "USER_DELETED",
  "AGENCY_SUSPENDED",
]);

// =============================================================================
// PAGE
// =============================================================================

export default async function AdminAuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ admin?: string; action?: string; target?: string }>;
}) {
  const { admin = "", action = "", target = "" } = await searchParams;

  const [logs, stats, topAdmins] = await Promise.all([
    listAuditLogs({
      limit: 100,
      adminId: admin || undefined,
      action: action || undefined,
      targetType: target || undefined,
    }),
    getAuditStats(),
    getTopAdminsByActivity(3),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-kaza-navy lg:text-3xl">
            Journal d&apos;audit administrateur
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Toutes les actions sensibles des admins sont tracées et conservées
            (conformité OHADA & RGPD).
          </p>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Actions 7 jours",
            value: stats.actions7d,
            Icon: Calendar,
            tint: "text-kaza-blue",
            bg: "bg-blue-50",
          },
          {
            label: "Actions 30 jours",
            value: stats.actions30d,
            Icon: Calendar,
            tint: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Admins actifs (30j)",
            value: stats.activeAdmins30d,
            Icon: Users,
            tint: "text-purple-600",
            bg: "bg-purple-50",
          },
          {
            label: "Actions à risque (30j)",
            value: stats.riskActions30d,
            Icon: AlertTriangle,
            tint: "text-red-600",
            bg: "bg-red-50",
            highlight: true,
          },
        ].map((k) => {
          const Icon = k.Icon;
          return (
            <Card
              key={k.label}
              className={`rounded-2xl border-gray-200/80 shadow-sm ${
                k.highlight ? "ring-2 ring-red-100" : ""
              }`}
            >
              <CardContent className="p-5">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${k.bg}`}
                >
                  <Icon className={`h-5 w-5 ${k.tint}`} />
                </div>
                <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {k.label}
                </p>
                <p className="mt-1 font-heading text-3xl font-bold text-kaza-navy">
                  {k.value.toLocaleString("fr-FR")}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filtres — branchés sur les searchParams (?admin=&action=&target=) */}
      <AuditFilters
        admins={topAdmins.map((a) => ({
          adminId: a.adminId,
          adminName: a.adminName,
        }))}
        actionLabels={ACTION_LABELS}
        selectedAdmin={admin}
        selectedAction={action}
        selectedTarget={target}
      />

      {/* MAIN GRID — Logs + Sidebar admins */}
      <div className="grid gap-6 xl:grid-cols-4">
        {/* Logs chronologiques */}
        <Card className="rounded-2xl border-gray-200/80 shadow-sm xl:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-lg text-kaza-navy">
              Historique chronologique
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {logs.length === 0
                ? "Aucune action admin enregistrée pour le moment."
                : `${logs.length} entrée${
                    logs.length > 1 ? "s" : ""
                  } affichée${logs.length > 1 ? "s" : ""} · trié par date décroissante`}
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {logs.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-y border-gray-200 bg-gray-50/70 text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-3 font-semibold">Date & heure</th>
                      <th className="px-4 py-3 font-semibold">Admin</th>
                      <th className="px-4 py-3 font-semibold">Action</th>
                      <th className="px-4 py-3 font-semibold">Cible</th>
                      <th className="px-4 py-3 font-semibold">Raison</th>
                      <th className="px-4 py-3 font-semibold">IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <LogRow key={log.id} log={log} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar — Activité par admin */}
        <div className="space-y-4">
          <Card className="rounded-2xl border-gray-200/80 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-base text-kaza-navy">
                Activité par admin
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Top 3 — 30 derniers jours
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {topAdmins.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-4 text-center">
                  <Shield className="mx-auto mb-2 h-6 w-6 text-gray-400" />
                  <p className="text-xs text-muted-foreground">
                    Aucune activité admin sur les 30 derniers jours.
                  </p>
                </div>
              ) : (
                topAdmins.map((a) => {
                  const initials = computeInitials(a.adminName);
                  return (
                    <div
                      key={a.adminId}
                      className="rounded-xl border border-gray-200 bg-white p-3"
                    >
                      <div className="flex items-start gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-kaza-blue text-xs font-bold text-white">
                          {initials}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-kaza-navy">
                            {a.adminName}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Administrateur
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Actions</p>
                          <p className="font-bold text-kaza-navy">
                            {a.count30d}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Dernière</p>
                          <p className="font-semibold text-gray-700">
                            {a.lastActionAt
                              ? new Date(a.lastActionAt).toLocaleDateString(
                                  "fr-FR",
                                  { day: "2-digit", month: "short" },
                                )
                              : "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Sous-composants
// =============================================================================

function LogRow({ log }: { log: AuditLogEntry }) {
  const date = new Date(log.createdAt);
  const isRisk = RISK_ACTIONS.has(log.action);
  const actionLabel = ACTION_LABELS[log.action] ?? log.action;
  const categoryColor =
    TARGET_CATEGORY_COLORS[log.targetType] ?? "bg-slate-100 text-slate-700";

  return (
    <tr
      className={`border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 ${
        isRisk ? "bg-red-50/30" : ""
      }`}
    >
      <td className="px-4 py-3 text-xs text-gray-700">
        <div className="font-medium text-kaza-navy">
          {date.toLocaleDateString("fr-FR")}
        </div>
        <div className="text-muted-foreground">
          {date.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-kaza-blue text-[10px] font-bold text-white">
            {computeInitials(log.adminName)}
          </span>
          <span className="text-sm font-semibold text-kaza-navy">
            {log.adminName}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge className={`border-0 ${categoryColor} hover:bg-transparent`}>
          {actionLabel}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <span className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">
          {log.targetType}
        </span>
        <span className="block text-sm font-medium text-kaza-navy">
          {log.targetLabel ?? log.targetId}
        </span>
      </td>
      <td className="max-w-[220px] px-4 py-3">
        {log.reason ? (
          <span
            className="block truncate text-xs text-gray-600"
            title={log.reason}
          >
            {log.reason}
          </span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        {log.ipAddress ? (
          <span className="inline-block rounded bg-gray-100 px-2 py-0.5 font-mono text-[11px] text-gray-700">
            {log.ipAddress}
          </span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>
    </tr>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100">
        <Shield className="size-7 text-slate-500" />
      </div>
      <h3 className="text-base font-semibold text-kaza-navy">
        Aucune action admin enregistrée pour le moment
      </h3>
      <p className="max-w-md text-sm text-muted-foreground">
        Toutes les actions sensibles (suspensions, validations KYC, modération
        d&apos;annonces, etc.) seront tracées ici dès qu&apos;elles seront
        effectuées par un administrateur.
      </p>
    </div>
  );
}

function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "AD";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}
