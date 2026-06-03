import type { Metadata } from "next";
import {
  Building2,
  TrendingUp,
  ShieldCheck,
  Clock,
  FileCheck2,
  Search,
  ArrowUpRight,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { cn, formatFcfa, formatFcfaShort, formatNumber } from "@/lib/utils";
import { listAllAgencies, type AdminAgencyRow } from "@/lib/queries/admin";

import { AgencyActions } from "./agency-actions";
import { KycReviewActions } from "./kyc-review-actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gestion des agences B2B — Admin KAZA",
  description:
    "Pilotage des agences immobilières partenaires : KYC, plans, audit, performance et compliance.",
};

// ---------------------------------------------------------------------------
// Helpers UI
// ---------------------------------------------------------------------------

type DisplayPlan = "STARTER" | "PREMIUM" | "ELITE" | "PLUS" | "AUTRE";
type DisplayStatus = "ACTIVE" | "SUSPENDED" | "PENDING_KYC" | "TRIAL";

const PLAN_BADGE: Record<DisplayPlan, string> = {
  STARTER: "bg-slate-100 text-slate-700 border-slate-200",
  PREMIUM: "bg-amber-100 text-amber-700 border-amber-300",
  ELITE: "bg-violet-100 text-violet-700 border-violet-300",
  PLUS: "bg-blue-100 text-blue-700 border-blue-300",
  AUTRE: "bg-slate-100 text-slate-600 border-slate-200",
};

const STATUS_BADGE: Record<DisplayStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  SUSPENDED: "bg-red-100 text-red-700",
  PENDING_KYC: "bg-blue-100 text-blue-700",
  TRIAL: "bg-amber-100 text-amber-700",
};

const STATUS_LABEL: Record<DisplayStatus, string> = {
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
  PENDING_KYC: "KYC en attente",
  TRIAL: "Période d’essai",
};

function mapPlan(raw: string | null): DisplayPlan {
  if (!raw) return "AUTRE";
  if (raw.includes("STARTER")) return "STARTER";
  if (raw.includes("PREMIUM")) return "PREMIUM";
  if (raw.includes("ELITE")) return "ELITE";
  if (raw.includes("PLUS")) return "PLUS";
  return "AUTRE";
}

/**
 * Déduit un statut d'agence à partir de l'état KYC + abonnement.
 * - Pas de KYC validé → PENDING_KYC
 * - Abonnement TRIAL → TRIAL
 * - Pas d'abonnement actif ou KYC rejeté → SUSPENDED
 * - Sinon → ACTIVE
 */
function deriveStatus(agency: AdminAgencyRow): DisplayStatus {
  if (agency.verificationStatus === "REJECTED") return "SUSPENDED";
  if (
    agency.verificationStatus === "PENDING" ||
    agency.verificationStatus === "UNVERIFIED"
  ) {
    return "PENDING_KYC";
  }
  if (agency.subscriptionStatus === "TRIAL") return "TRIAL";
  if (
    !agency.subscriptionStatus ||
    agency.subscriptionStatus === "CANCELLED" ||
    agency.subscriptionStatus === "EXPIRED" ||
    agency.subscriptionStatus === "PAST_DUE"
  ) {
    return "SUSPENDED";
  }
  return "ACTIVE";
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((s) => s.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  hint,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
  accent: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-kaza-navy">
            {value}
          </p>
          {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
        </div>
        <span className={cn("inline-flex size-9 items-center justify-center rounded-xl", accent)}>
          <Icon className="size-4" />
        </span>
      </div>
    </div>
  );
}

function AgencyCard({ agency }: { agency: AdminAgencyRow }) {
  const status = deriveStatus(agency);
  const plan = mapPlan(agency.planName);

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5 shadow-sm transition hover:shadow-md">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-kaza-navy text-base font-bold text-white shadow-sm">
            {initialsOf(agency.name)}
          </div>
          <div className="min-w-0">
            <h3 className="font-heading text-base font-bold text-kaza-navy">
              {agency.name}
            </h3>
            <p className="truncate text-xs text-muted-foreground">{agency.email}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge className={cn("border", PLAN_BADGE[plan])}>
            {plan === "AUTRE" ? "—" : plan}
          </Badge>
          <Badge className={STATUS_BADGE[status]}>{STATUS_LABEL[status]}</Badge>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {agency.phone && <span>{agency.phone}</span>}
        {agency.phone && agency.city && <span>·</span>}
        {agency.city && <span>{agency.city}</span>}
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-center">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Annonces actives
          </p>
          <p className="mt-0.5 font-heading text-lg font-bold text-kaza-navy">
            {agency.activeProperties}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Abonnement / mois
          </p>
          <p className="mt-0.5 font-heading text-lg font-bold text-kaza-green">
            {agency.monthlyPlanFcfa > 0
              ? formatFcfaShort(agency.monthlyPlanFcfa)
              : "—"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        <span>
          Inscrite le{" "}
          {new Date(agency.signedAt).toLocaleDateString("fr-FR")}
        </span>
        <span>·</span>
        <span>
          KYC&nbsp;: <strong className="text-foreground">{agency.verificationStatus}</strong>
        </span>
      </div>

      <footer className="flex items-center gap-2 border-t border-border pt-3">
        <AgencyActions
          agency={{
            id: agency.id,
            name: agency.name,
            email: agency.email,
            phone: agency.phone,
            city: agency.city,
            isVerified: agency.isVerified,
            verificationStatus: agency.verificationStatus,
            signedAt: agency.signedAt,
            activeProperties: agency.activeProperties,
            monthlyPlanFcfa: agency.monthlyPlanFcfa,
            planName: agency.planName,
            displayStatus: status,
          }}
        />
      </footer>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminAgenciesPage() {
  const agencies = await listAllAgencies();

  const enriched = agencies.map((a) => ({
    ...a,
    derivedStatus: deriveStatus(a),
    derivedPlan: mapPlan(a.planName),
  }));

  const total = enriched.length;
  const active = enriched.filter((a) => a.derivedStatus === "ACTIVE").length;
  const suspended = enriched.filter((a) => a.derivedStatus === "SUSPENDED").length;
  const pendingKyc = enriched.filter((a) => a.derivedStatus === "PENDING_KYC").length;
  const trial = enriched.filter((a) => a.derivedStatus === "TRIAL").length;

  const mrr = enriched.reduce(
    (acc, a) => acc + (a.derivedStatus === "ACTIVE" || a.derivedStatus === "TRIAL" ? a.monthlyPlanFcfa : 0),
    0,
  );
  const verifiedCount = enriched.filter((a) => a.isVerified).length;
  const verifRate = total > 0 ? Math.round((verifiedCount / total) * 100) : 0;

  const topPerformers = [...enriched]
    .sort((a, b) => b.activeProperties - a.activeProperties)
    .slice(0, 5);

  const kycPending = enriched.filter((a) => a.derivedStatus === "PENDING_KYC");

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-kaza-navy lg:text-3xl">
          Gestion des agences B2B
        </h1>
        <p className="text-sm text-muted-foreground">
          {active} agences actives · {suspended} en suspension · {trial} trial
        </p>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Building2}
          label="Total agences"
          value={String(total)}
          accent="bg-kaza-navy/10 text-kaza-navy"
          hint={`${pendingKyc} en attente de KYC`}
        />
        <StatCard
          icon={TrendingUp}
          label="MRR cumulé"
          value={mrr > 0 ? formatFcfaShort(mrr) : "—"}
          accent="bg-emerald-100 text-emerald-700"
          hint="revenu mensuel récurrent"
        />
        <StatCard
          icon={ShieldCheck}
          label="Taux de vérification"
          value={`${verifRate}%`}
          accent="bg-blue-100 text-blue-700"
          hint={`${verifiedCount} agences validées`}
        />
        <StatCard
          icon={Clock}
          label="Trial en cours"
          value={String(trial)}
          accent="bg-amber-100 text-amber-700"
          hint="conversion attendue"
        />
      </section>

      {/* Empty state global */}
      {total === 0 && (
        <section className="rounded-2xl border-2 border-dashed border-border bg-slate-50/60 p-10 text-center">
          <Building2 className="mx-auto size-10 text-muted-foreground" />
          <h2 className="mt-3 font-heading text-lg font-bold text-kaza-navy">
            Aucune agence inscrite pour le moment
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Les agences B2B (rôle <code className="rounded bg-slate-200 px-1">AGENCY</code>) inscrites
            sur KAZA apparaîtront ici avec leur abonnement et leur portefeuille d&apos;annonces actives.
          </p>
        </section>
      )}

      {/* KYC pending */}
      {kycPending.length > 0 && (
        <section className="rounded-2xl border-2 border-blue-200 bg-blue-50/40 p-5 shadow-sm">
          <header className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck2 className="size-5 text-kaza-blue" />
              <h2 className="font-heading text-base font-bold text-kaza-navy">
                KYC en attente de validation
              </h2>
              <Badge className="border-blue-300 bg-blue-100 text-blue-700">
                {kycPending.length}
              </Badge>
            </div>
          </header>

          <div className="grid gap-4">
            {kycPending.map((a) => (
              <div
                key={a.id}
                className="grid gap-4 rounded-xl border border-blue-200 bg-white p-4 lg:grid-cols-[1fr_2fr_auto] lg:items-center"
              >
                <div>
                  <p className="font-heading text-base font-bold text-kaza-navy">
                    {a.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {a.email}
                    {a.city ? ` · ${a.city}` : ""}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Inscrite le{" "}
                    {new Date(a.signedAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <ul className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                  {["RCCM", "IFU", "Statuts", "RIB"].map((d) => (
                    <li
                      key={d}
                      className="flex items-center justify-between rounded-lg border border-border bg-slate-50 px-3 py-2"
                    >
                      <span className="font-semibold text-kaza-navy">{d}</span>
                      <Badge className="border-amber-200 bg-amber-100 text-amber-700">
                        À vérifier
                      </Badge>
                    </li>
                  ))}
                </ul>
                <KycReviewActions agencyId={a.id} agencyName={a.name} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Filters */}
      {total > 0 && (
        <section className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1 lg:max-w-md">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Nom d’agence, email, ville…" className="pl-9" />
            </div>
            <div className="grid grid-cols-2 gap-2 lg:flex">
              <Select defaultValue="all">
                <SelectTrigger className="w-full lg:w-[140px]">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous plans</SelectItem>
                  <SelectItem value="STARTER">Starter</SelectItem>
                  <SelectItem value="PREMIUM">Premium</SelectItem>
                  <SelectItem value="ELITE">Elite</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-full lg:w-[150px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="ACTIVE">Actif</SelectItem>
                  <SelectItem value="TRIAL">Trial</SelectItem>
                  <SelectItem value="PENDING_KYC">KYC en attente</SelectItem>
                  <SelectItem value="SUSPENDED">Suspendu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>
      )}

      {/* Grid of agencies */}
      {total > 0 && (
        <section className="grid gap-4 md:grid-cols-2">
          {enriched.map((a) => (
            <AgencyCard key={a.id} agency={a} />
          ))}
        </section>
      )}

      {/* Top performers */}
      {topPerformers.length > 0 && (
        <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <header className="mb-4 flex items-center gap-2">
            <TrendingUp className="size-5 text-kaza-green" />
            <h2 className="font-heading text-base font-bold text-kaza-navy">
              Top agences — par portefeuille actif
            </h2>
          </header>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Agence</TableHead>
                  <TableHead>Ville</TableHead>
                  <TableHead className="text-right">Abonnement</TableHead>
                  <TableHead className="text-right">Annonces actives</TableHead>
                  <TableHead className="text-right">KYC</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPerformers.map((a, idx) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex size-7 items-center justify-center rounded-full text-xs font-bold",
                          idx === 0
                            ? "bg-amber-100 text-amber-700"
                            : idx === 1
                              ? "bg-slate-200 text-slate-700"
                              : idx === 2
                                ? "bg-orange-100 text-orange-700"
                                : "bg-slate-100 text-slate-600",
                        )}
                      >
                        {idx + 1}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-kaza-navy">{a.name}</span>
                        <Badge className={cn("border text-[10px]", PLAN_BADGE[a.derivedPlan])}>
                          {a.derivedPlan === "AUTRE" ? "—" : a.derivedPlan}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {a.city ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-kaza-navy">
                      {a.monthlyPlanFcfa > 0 ? formatFcfa(a.monthlyPlanFcfa) : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(a.activeProperties)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-xs font-semibold",
                          a.isVerified ? "text-kaza-green" : "text-amber-700",
                        )}
                      >
                        <ArrowUpRight className="size-3.5" />
                        {a.verificationStatus}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {/* Plans comparator */}
      <section>
        <header className="mb-4">
          <h2 className="font-heading text-lg font-bold text-kaza-navy">
            Rappel des plans B2B
          </h2>
          <p className="text-sm text-muted-foreground">
            Limites contractuelles utilisées lors des changements de plan.
          </p>
        </header>
        <div className="grid gap-4 md:grid-cols-3">
          {(
            [
              {
                key: "STARTER",
                price: 49_000,
                color: "border-slate-200",
                limits: ["Jusqu’à 50 annonces", "3 agents", "Support email"],
              },
              {
                key: "PREMIUM",
                price: 149_000,
                color: "border-amber-300 ring-1 ring-amber-200",
                limits: [
                  "Jusqu’à 200 annonces",
                  "10 agents",
                  "Mise en avant ×2",
                  "Support prioritaire",
                ],
              },
              {
                key: "ELITE",
                price: 399_000,
                color: "border-violet-300 ring-1 ring-violet-200",
                limits: [
                  "Annonces illimitées",
                  "Équipe illimitée",
                  "Account manager dédié",
                  "API & exports",
                  "SLA 99.9%",
                ],
              },
            ] as const
          ).map((p) => (
            <div
              key={p.key}
              className={cn(
                "flex flex-col gap-3 rounded-2xl border-2 bg-white p-5 shadow-sm",
                p.color,
              )}
            >
              <div className="flex items-center justify-between">
                <Badge className={cn("border", PLAN_BADGE[p.key])}>{p.key}</Badge>
                <span className="text-xs text-muted-foreground">/ mois</span>
              </div>
              <div>
                <p className="font-heading text-2xl font-bold text-kaza-navy">
                  {formatFcfa(p.price)}
                </p>
              </div>
              <ul className="space-y-1.5 text-sm">
                {p.limits.map((l) => (
                  <li key={l} className="flex items-start gap-2 text-foreground">
                    <span className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-kaza-green/15 text-kaza-green">
                      ✓
                    </span>
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
