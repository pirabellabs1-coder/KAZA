import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Server,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { runHealthchecks } from "@/lib/health/check";
import { listOpenIncidents } from "@/lib/health/check";

export const metadata: Metadata = {
  title: "Monitoring temps réel — KAZA Admin",
  description: "Supervision live de l'infrastructure KAZA.",
};

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<
  string,
  { Icon: typeof CheckCircle2; color: string; label: string }
> = {
  OK: { Icon: CheckCircle2, color: "text-emerald-600", label: "OK" },
  DEGRADED: { Icon: AlertTriangle, color: "text-amber-600", label: "Dégradé" },
  DOWN: { Icon: XCircle, color: "text-red-600", label: "Indisponible" },
  UNKNOWN: { Icon: HelpCircle, color: "text-gray-400", label: "—" },
};

export default async function AdminMonitoringPage() {
  const [health, incidents] = await Promise.all([
    runHealthchecks(),
    listOpenIncidents(),
  ]);

  const globalUp = health.global === "OK";
  const globalDeg = health.global === "DEGRADED";

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-kaza-navy lg:text-3xl">
          Monitoring infrastructure
        </h1>
        <p className="text-sm text-muted-foreground">
          Santé des services KAZA en temps réel.
        </p>
      </header>

      {/* Global status banner */}
      <Card className="rounded-2xl border-gray-200/80 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                  globalUp
                    ? "bg-emerald-400"
                    : globalDeg
                    ? "bg-amber-400"
                    : "bg-red-400"
                }`}
              />
              <span
                className={`relative inline-flex h-3 w-3 rounded-full ${
                  globalUp
                    ? "bg-emerald-500"
                    : globalDeg
                    ? "bg-amber-500"
                    : "bg-red-500"
                }`}
              />
            </span>
            <div>
              <p className="font-heading text-lg font-bold text-kaza-navy">
                {globalUp
                  ? "Tous les services opérationnels"
                  : globalDeg
                  ? "Service dégradé détecté"
                  : "Incident en cours"}
              </p>
              <p className="text-xs text-muted-foreground">
                {health.checks.length} services surveillés ·{" "}
                {incidents.length} incident{incidents.length !== 1 ? "s" : ""} ouvert
                {incidents.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <Button asChild variant="outline" className="border-kaza-blue text-kaza-blue">
            <Link href="/status">
              Page statut publique <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Services list */}
      <Card className="rounded-2xl border-gray-200/80 shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-kaza-navy">
            État des services
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Healthchecks live (timeout 5s par appel)
          </p>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 sm:grid-cols-2">
            {health.checks.map((c) => {
              const badge = STATUS_BADGE[c.status];
              const Icon = badge.Icon;
              return (
                <li
                  key={c.id}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3"
                >
                  <Icon className={`h-5 w-5 shrink-0 ${badge.color}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-kaza-navy">
                      {c.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.latencyMs != null
                        ? `${c.latencyMs} ms`
                        : c.message ?? "—"}
                      {c.details ? ` · ${c.details}` : ""}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`shrink-0 text-xs ${badge.color}`}
                  >
                    {badge.label}
                  </Badge>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      {/* Open incidents */}
      <Card className="rounded-2xl border-gray-200/80 shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-kaza-navy">
            Incidents en cours
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Issus de la table `incidents` (gestion via SQL/admin)
          </p>
        </CardHeader>
        <CardContent>
          {incidents.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              <p className="text-sm text-muted-foreground">
                Aucun incident ouvert. Bonne nouvelle.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {incidents.map((inc) => (
                <li
                  key={inc.id}
                  className="rounded-xl border border-amber-200 bg-amber-50/60 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-kaza-navy">{inc.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {inc.description}
                      </p>
                    </div>
                    <Badge className="shrink-0 border-amber-300 bg-amber-100 text-amber-800">
                      {inc.severity}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Infra note */}
      <Card className="rounded-2xl border-gray-200/80 bg-slate-50/50 shadow-sm">
        <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-200">
            <Server className="h-5 w-5 text-slate-600" />
          </div>
          <div className="flex-1 text-sm text-muted-foreground">
            <p className="font-semibold text-kaza-navy">
              Métriques infrastructure détaillées
            </p>
            <p className="mt-0.5">
              Pour CPU/RAM/disque/connexions DB en temps réel, consulte les
              dashboards{" "}
              <a
                href="https://vercel.com/kaza2/kaza"
                className="text-kaza-blue underline-offset-2 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Vercel
              </a>{" "}
              et{" "}
              <a
                href="https://supabase.com/dashboard"
                className="text-kaza-blue underline-offset-2 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Supabase
              </a>{" "}
              — les métriques temps réel y sont exposées nativement.
            </p>
          </div>
          <Button asChild variant="ghost" className="text-kaza-blue">
            <Link href="/admin/audit-log">
              <Activity className="mr-1 h-4 w-4" /> Audit log
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
