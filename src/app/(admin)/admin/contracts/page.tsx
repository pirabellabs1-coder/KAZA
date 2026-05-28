import type { Metadata } from "next";
import Link from "next/link";
import {
  Archive,
  CalendarClock,
  CheckCircle2,
  Download,
  FileText,
  Home,
  ScrollText,
  ShieldCheck,
  Timer,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { formatFcfa, formatNumber } from "@/lib/utils";
import {
  listAllContracts,
  type AdminContractRow,
  type AdminContractStatus,
} from "@/lib/queries/admin";

import { ContractActionsMenu } from "./contract-actions-menu";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contrats plateforme — KAZA Admin",
  description:
    "Suivi de tous les contrats de location, litiges et conformité juridique.",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_BADGE: Record<
  AdminContractStatus,
  { label: string; classes: string }
> = {
  DRAFT: {
    label: "Brouillon",
    classes: "bg-slate-100 text-slate-700 border-slate-200",
  },
  PENDING_TENANT: {
    label: "Attente locataire",
    classes: "bg-blue-100 text-blue-700 border-blue-200",
  },
  PENDING_OWNER: {
    label: "Attente bailleur",
    classes: "bg-amber-100 text-amber-700 border-amber-200",
  },
  SIGNED: {
    label: "Signé",
    classes: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  CANCELLED: {
    label: "Annulé",
    classes: "bg-red-100 text-red-700 border-red-200",
  },
};

function StatusPill({ status }: { status: AdminContractStatus }) {
  const cfg = STATUS_BADGE[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.classes}`}
    >
      {cfg.label}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
  accent?: "amber" | "red" | "green" | "blue" | "slate";
}) {
  const colorMap: Record<string, string> = {
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    green: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="flex items-start gap-4">
        <div
          className={`flex size-10 items-center justify-center rounded-xl ${
            accent ? colorMap[accent] : "bg-kaza-navy/10 text-kaza-navy"
          }`}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="font-heading text-2xl font-bold text-kaza-navy">
            {value}
          </p>
          {hint && (
            <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function contractNumber(c: AdminContractRow): string {
  return `KAZA-${c.id.slice(0, 8).toUpperCase()}`;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR");
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminContractsPage() {
  const contracts = await listAllContracts();

  const counts = contracts.reduce(
    (acc, c) => {
      acc.total += 1;
      if (c.status === "SIGNED") acc.signed += 1;
      if (c.status === "PENDING_TENANT" || c.status === "PENDING_OWNER")
        acc.pendingSign += 1;
      if (c.status === "DRAFT") acc.draft += 1;
      if (c.status === "CANCELLED") acc.cancelled += 1;
      return acc;
    },
    { total: 0, signed: 0, pendingSign: 0, draft: 0, cancelled: 0 },
  );

  // Snapshot temporel stable pour le rendu (Server Component rendu à chaque
  // requête grâce à `force-dynamic`). Pas d'impact de pureté côté React.
  // eslint-disable-next-line react-hooks/purity
  const today = Date.now();
  const expiringSoon = contracts
    .filter((c) => {
      if (c.status !== "SIGNED" || !c.endDate) return false;
      const end = new Date(c.endDate).getTime();
      if (Number.isNaN(end)) return false;
      const diffDays = (end - today) / (1000 * 60 * 60 * 24);
      return diffDays > 0 && diffDays <= 30;
    })
    .slice(0, 10);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-bold text-kaza-navy lg:text-3xl">
          Tous les contrats plateforme
        </h1>
        <p className="text-sm text-muted-foreground">
          {counts.signed} contrats signés · {counts.pendingSign} en attente de
          signature · {expiringSoon.length} expirent dans 30j
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          icon={ScrollText}
          label="Total contrats"
          value={formatNumber(counts.total)}
          hint="Tous statuts confondus"
          accent="blue"
        />
        <StatCard
          icon={CheckCircle2}
          label="Signés"
          value={String(counts.signed)}
          hint="Cycle complet"
          accent="green"
        />
        <StatCard
          icon={FileText}
          label="En attente signature"
          value={String(counts.pendingSign)}
          hint="Signature partielle"
          accent="amber"
        />
        <StatCard
          icon={FileText}
          label="Brouillons"
          value={String(counts.draft)}
          hint="PDF en préparation"
          accent="slate"
        />
        <StatCard
          icon={Archive}
          label="Annulés"
          value={String(counts.cancelled)}
          hint="Avant signature complète"
          accent="red"
        />
      </div>

      {/* Empty state */}
      {counts.total === 0 && (
        <Card className="rounded-2xl border-2 border-dashed shadow-none">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <ScrollText className="size-10 text-muted-foreground" />
            <div>
              <p className="font-heading text-lg font-bold text-kaza-navy">
                Aucun contrat sur la plateforme
              </p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Dès qu&apos;une location sera matérialisée par un PDF (table{" "}
                <code className="rounded bg-slate-100 px-1">contracts</code>), elle apparaîtra ici
                avec son bailleur, son locataire et son cycle de signature.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expirations imminentes */}
      {expiringSoon.length > 0 && (
        <Card className="rounded-2xl border-amber-200 bg-amber-50/40 shadow-sm">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <CalendarClock className="size-5" />
            </div>
            <div>
              <CardTitle className="font-heading text-lg text-kaza-navy">
                Expirations imminentes (≤ 30 jours)
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Notifier les parties pour renouvellement ou résiliation
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-xl border bg-white">
              <table className="min-w-[700px] w-full text-sm">
                <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-3 text-left">N° contrat</th>
                    <th className="px-3 py-3 text-left">Bien</th>
                    <th className="px-3 py-3 text-left">Bailleur</th>
                    <th className="px-3 py-3 text-left">Locataire</th>
                    <th className="px-3 py-3 text-left">Échéance</th>
                    <th className="px-3 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {expiringSoon.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/30">
                      <td className="px-3 py-3 font-medium text-kaza-navy">
                        {contractNumber(c)}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {c.propertyTitle}
                      </td>
                      <td className="px-3 py-3">{c.ownerName}</td>
                      <td className="px-3 py-3">{c.tenantName}</td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center gap-1 text-xs text-amber-700">
                          <Timer className="size-3" />
                          {formatDate(c.endDate)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-amber-200 text-amber-700 hover:bg-amber-50"
                        >
                          Notifier renouvellement
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtres + table principale */}
      {counts.total > 0 && (
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg text-kaza-navy">
              Tous les contrats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              <Input
                placeholder="Rechercher n° contrat, parties..."
                className="lg:col-span-1"
              />
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {(Object.keys(STATUS_BADGE) as AdminContractStatus[]).map(
                    (s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_BADGE[s].label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les périodes</SelectItem>
                  <SelectItem value="7d">7 derniers jours</SelectItem>
                  <SelectItem value="30d">30 derniers jours</SelectItem>
                  <SelectItem value="90d">90 derniers jours</SelectItem>
                  <SelectItem value="year">Cette année</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-x-auto rounded-xl border">
              <table className="min-w-[1100px] w-full text-sm">
                <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-3 text-left">N° contrat</th>
                    <th className="px-3 py-3 text-left">Statut</th>
                    <th className="px-3 py-3 text-left">Bailleur</th>
                    <th className="px-3 py-3 text-left">Locataire</th>
                    <th className="px-3 py-3 text-left">Bien</th>
                    <th className="px-3 py-3 text-right">Loyer</th>
                    <th className="px-3 py-3 text-left">Période</th>
                    <th className="px-3 py-3 text-left">Signé</th>
                    <th className="px-3 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {contracts.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/30">
                      <td className="px-3 py-3">
                        <Link
                          href={
                            c.rentalId
                              ? `/contracts/${c.id}`
                              : `/admin/contracts`
                          }
                          className="font-medium text-kaza-blue hover:underline"
                        >
                          {contractNumber(c)}
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        <StatusPill status={c.status} />
                      </td>
                      <td className="px-3 py-3 text-sm">{c.ownerName}</td>
                      <td className="px-3 py-3 text-sm">{c.tenantName}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-kaza-navy">
                            {c.propertyTitle}
                          </span>
                          {c.propertyAddress && (
                            <span className="text-xs text-muted-foreground">
                              {c.propertyAddress}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right font-medium tabular-nums">
                        {c.monthlyRent > 0 ? formatFcfa(c.monthlyRent) : "—"}
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">
                        {formatDate(c.startDate)} → {formatDate(c.endDate)}
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">
                        {formatDate(c.signedAt)}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            title="Voir contrat"
                          >
                            <Link href={`/contracts/${c.id}`}>
                              <Download className="size-4" />
                            </Link>
                          </Button>
                          <ContractActionsMenu
                            contractNumber={contractNumber(c)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conformité juridique */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <CardTitle className="font-heading text-lg text-kaza-navy">
              Conformité juridique
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Cadre réglementaire applicable à tous les contrats KAZA
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Loi 2018-12",
                desc: "Bail d'habitation au Bénin — tous contrats conformes",
              },
              {
                title: "OHADA art. 101-134",
                desc: "Acte uniforme sur le droit commercial général",
              },
              {
                title: "Mentions obligatoires",
                desc: "Identité parties, durée, loyer, charges, dépôt, état des lieux",
              },
              {
                title: "Juridiction",
                desc: "Tribunal de Commerce de Cotonou pour différends",
              },
            ].map((b) => (
              <div
                key={b.title}
                className="rounded-xl border bg-white p-4 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-kaza-green" />
                  <p className="font-medium text-kaza-navy">{b.title}</p>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Templates utilisés */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Home className="size-5" />
          </div>
          <div>
            <CardTitle className="font-heading text-lg text-kaza-navy">
              Répartition par statut
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              État actuel du portefeuille de contrats
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-3 text-left">Statut</th>
                  <th className="px-3 py-3 text-right">Nombre</th>
                  <th className="px-3 py-3 text-right">Part</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(Object.keys(STATUS_BADGE) as AdminContractStatus[]).map(
                  (s) => {
                    const n = contracts.filter((c) => c.status === s).length;
                    const pct =
                      counts.total > 0
                        ? Math.round((n / counts.total) * 100)
                        : 0;
                    return (
                      <tr key={s} className="hover:bg-muted/30">
                        <td className="px-3 py-3">
                          <Badge variant="secondary" className="text-xs">
                            {STATUS_BADGE[s].label}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-right font-medium tabular-nums">
                          {n}
                        </td>
                        <td className="px-3 py-3 text-right text-xs text-muted-foreground">
                          {pct}%
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
