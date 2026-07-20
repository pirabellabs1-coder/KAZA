import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Users,
  Target,
  TrendingUp,
  Wallet,
  Clock,
  Flame,
  UserPlus,
  Mail,
  Phone,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import {
  getLeadStats,
  listLeads,
  type AgencyLead,
  type LeadSource,
  type LeadStage,
} from "@/lib/queries/agency-leads";
import { listTeamMembers } from "@/lib/queries/agency-team";

import { NewLeadDialog } from "./new-lead-dialog";

export const metadata: Metadata = {
  title: "Leads & prospects — Kaabo Agence",
  description:
    "Pilotez votre pipeline commercial : prospects, scoring, conversions.",
};

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const KANBAN_STAGES: LeadStage[] = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "VISIT_SCHEDULED",
  "OFFER",
  "WON",
  "LOST",
];

const STAGE_LABELS: Record<LeadStage, string> = {
  NEW: "Nouveau",
  CONTACTED: "Contacté",
  QUALIFIED: "Qualifié",
  VISIT_SCHEDULED: "Visite planifiée",
  OFFER: "Offre",
  WON: "Signé",
  LOST: "Perdu",
};

const STAGE_COLORS: Record<LeadStage, string> = {
  NEW: "bg-slate-100 text-slate-700",
  CONTACTED: "bg-blue-100 text-blue-700",
  QUALIFIED: "bg-indigo-100 text-indigo-700",
  VISIT_SCHEDULED: "bg-amber-100 text-amber-700",
  OFFER: "bg-orange-100 text-orange-700",
  WON: "bg-emerald-100 text-emerald-700",
  LOST: "bg-rose-100 text-rose-700",
};

const STAGE_BORDER: Record<LeadStage, string> = {
  NEW: "border-l-slate-400",
  CONTACTED: "border-l-blue-500",
  QUALIFIED: "border-l-indigo-500",
  VISIT_SCHEDULED: "border-l-amber-500",
  OFFER: "border-l-orange-500",
  WON: "border-l-emerald-500",
  LOST: "border-l-rose-500",
};

const SOURCE_LABELS: Record<LeadSource, string> = {
  SITE_KAZA: "Site Kaabo",
  SOCIAL: "Réseaux sociaux",
  WORD_OF_MOUTH: "Bouche-à-oreille",
  GOOGLE_ADS: "Pub Google",
  EVENT: "Évènement",
  OTHER: "Autre",
};

const SOURCE_COLORS: Record<LeadSource, string> = {
  SITE_KAZA: "bg-kaza-blue/10 text-kaza-blue",
  SOCIAL: "bg-purple-100 text-purple-700",
  WORD_OF_MOUTH: "bg-emerald-100 text-emerald-700",
  GOOGLE_ADS: "bg-rose-100 text-rose-700",
  EVENT: "bg-amber-100 text-amber-700",
  OTHER: "bg-slate-100 text-slate-700",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysSince(dateStr: string): number {
  const d = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - d) / (1000 * 60 * 60 * 24)));
}

function formatFcfaShort(value: number | null): string {
  if (value === null || value === undefined) return "—";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)} k`;
  return value.toString();
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-kaza-green";
  if (score >= 60) return "text-kaza-blue";
  if (score >= 40) return "text-amber-600";
  return "text-rose-600";
}

function scoreRingColor(score: number): string {
  if (score >= 80) return "#4CAF50";
  if (score >= 60) return "#1976D2";
  if (score >= 40) return "#F59E0B";
  return "#E11D48";
}

function memberInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0]?.toUpperCase())
    .filter(Boolean)
    .slice(0, 2)
    .join("");
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AgencyLeadsPage() {
  const user = await getCurrentDisplayUser();
  if (!user) {
    redirect("/login?redirect=/agency/leads");
  }

  const [leads, stats, members] = await Promise.all([
    listLeads(user.id),
    getLeadStats(user.id),
    listTeamMembers(user.id),
  ]);

  const activeAgents = members
    .filter((m) => m.status === "ACTIVE" || m.status === "ON_LEAVE")
    .map((m) => ({ id: m.id, fullName: m.fullName }));

  // "À faire aujourd'hui" : NEW/CONTACTED dont last_activity_at > 3 jours
  const todoLeads = leads
    .filter((l) => l.stage === "NEW" || l.stage === "CONTACTED")
    .filter((l) => daysSince(l.lastActivityAt) >= 3)
    .sort(
      (a, b) =>
        new Date(a.lastActivityAt).getTime() -
        new Date(b.lastActivityAt).getTime(),
    )
    .slice(0, 6);

  const leadsByStage = (stage: LeadStage) =>
    leads.filter((l) => l.stage === stage);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-kaza-navy">
            Leads &amp; prospects
          </h1>
          <p className="mt-1 text-muted-foreground">
            Pipeline commercial — {stats.openLeads} prospect
            {stats.openLeads > 1 ? "s" : ""} ouvert
            {stats.openLeads > 1 ? "s" : ""}
          </p>
        </div>
        <NewLeadDialog agents={activeAgents} />
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatPill
          icon={<Users className="size-5 text-kaza-blue" />}
          label="Leads ouverts"
          value={stats.openLeads.toString()}
          subtitle="Hors gagnés / perdus"
        />
        <StatPill
          icon={<Target className="size-5 text-amber-600" />}
          label="Score moyen"
          value={stats.openLeads > 0 ? `${stats.averageScore} / 100` : "—"}
          subtitle="Qualité des prospects"
        />
        <StatPill
          icon={<TrendingUp className="size-5 text-kaza-green" />}
          label="Taux de conversion"
          value={`${stats.conversionRate}%`}
          subtitle={`${stats.byStage.WON} signés sur ${stats.total}`}
        />
        <StatPill
          icon={<Wallet className="size-5 text-kaza-navy" />}
          label="Valeur pipeline"
          value={`${formatFcfaShort(stats.pipelineValueFcfa)} FCFA`}
          subtitle="En négociation"
        />
      </div>

      {/* Empty state */}
      {leads.length === 0 ? (
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-kaza-navy/10">
              <UserPlus className="size-8 text-kaza-navy" />
            </div>
            <div className="space-y-2">
              <h3 className="font-heading text-lg font-semibold text-kaza-navy">
                Votre pipeline est vide
              </h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                Capturez vos premiers prospects pour structurer votre activité
                commerciale et booster votre taux de conversion.
              </p>
            </div>
            <NewLeadDialog agents={activeAgents} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          {/* Kanban */}
          <div className="space-y-4">
            <h2 className="font-heading text-lg font-semibold text-kaza-navy">
              Pipeline
            </h2>
            <div className="-mx-2 overflow-x-auto pb-2">
              <div className="flex min-w-max gap-3 px-2">
                {KANBAN_STAGES.map((stage) => (
                  <KanbanColumn
                    key={stage}
                    stage={stage}
                    leads={leadsByStage(stage)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar à faire */}
          <aside className="space-y-4">
            <Card className="rounded-2xl border-0 bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm">
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-amber-200">
                  <Flame className="size-5 text-orange-700" />
                </div>
                <div>
                  <CardTitle className="font-heading text-base text-kaza-navy">
                    À faire aujourd&apos;hui
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Leads inactifs depuis 3 jours et plus
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {todoLeads.length === 0 ? (
                  <p className="rounded-xl border border-dashed bg-white/60 py-6 text-center text-xs text-muted-foreground">
                    Tout est à jour, bravo
                  </p>
                ) : (
                  todoLeads.map((lead) => (
                    <Link
                      key={lead.id}
                      href={`/agency/leads/${lead.id}`}
                      className="block rounded-xl border bg-white/80 p-3 transition hover:border-kaza-navy hover:shadow"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-kaza-navy">
                            {lead.fullName}
                          </p>
                          {lead.email && (
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {lead.email}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant="secondary"
                          className={STAGE_COLORS[lead.stage]}
                        >
                          {STAGE_LABELS[lead.stage]}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="size-3" />
                          Depuis {daysSince(lead.lastActivityAt)}j
                        </span>
                        {lead.assignedMember && (
                          <span className="text-muted-foreground">
                            {lead.assignedMember.fullName.split(" ")[0]}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sous-composants
// ---------------------------------------------------------------------------

function StatPill({
  icon,
  label,
  value,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
          {icon}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold text-kaza-navy">{value}</p>
        {subtitle && (
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

function KanbanColumn({
  stage,
  leads,
}: {
  stage: LeadStage;
  leads: AgencyLead[];
}) {
  return (
    <div className="flex w-72 min-w-[18rem] flex-col rounded-2xl bg-muted/40 p-3">
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className={`${STAGE_COLORS[stage]} font-semibold`}
          >
            {STAGE_LABELS[stage]}
          </Badge>
          <span className="text-xs font-medium text-muted-foreground">
            {leads.length}
          </span>
        </div>
      </div>
      <div className="space-y-2.5">
        {leads.length === 0 ? (
          <p className="rounded-xl border border-dashed bg-white/60 py-6 text-center text-xs text-muted-foreground">
            Aucun lead
          </p>
        ) : (
          leads.map((lead) => <LeadCard key={lead.id} lead={lead} />)
        )}
      </div>
    </div>
  );
}

function LeadCard({ lead }: { lead: AgencyLead }) {
  return (
    <Link
      href={`/agency/leads/${lead.id}`}
      className={`block rounded-xl border border-l-4 bg-white p-3 shadow-sm transition hover:shadow-md ${STAGE_BORDER[lead.stage]}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-kaza-navy">
            {lead.fullName}
          </p>
          {lead.email && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
              <Mail className="size-3" />
              {lead.email}
            </p>
          )}
          {lead.phone && !lead.email && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
              <Phone className="size-3" />
              {lead.phone}
            </p>
          )}
        </div>
        <ScoreRing score={lead.score} />
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px]">
        <Badge
          variant="secondary"
          className={`${SOURCE_COLORS[lead.source]} text-[10px]`}
        >
          {SOURCE_LABELS[lead.source]}
        </Badge>
        {lead.budgetFcfa !== null && (
          <span className="font-semibold text-kaza-navy">
            {formatFcfaShort(lead.budgetFcfa)} FCFA
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between border-t pt-2">
        {lead.assignedMember ? (
          <div className="flex items-center gap-1.5">
            <div className="flex size-5 items-center justify-center rounded-full bg-kaza-navy text-[9px] font-semibold text-white">
              {memberInitials(lead.assignedMember.fullName)}
            </div>
            <span className="text-[10px] text-muted-foreground">
              {lead.assignedMember.fullName.split(" ")[0]}
            </span>
          </div>
        ) : (
          <span className="text-[10px] italic text-muted-foreground">
            Non assigné
          </span>
        )}
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock className="size-3" />
          {daysSince(lead.lastActivityAt)}j
        </span>
      </div>
    </Link>
  );
}

function ScoreRing({ score }: { score: number }) {
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = scoreRingColor(score);

  return (
    <div className="relative flex size-9 items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="3"
        />
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className={`relative text-[10px] font-bold ${scoreColor(score)}`}>
        {score}
      </span>
    </div>
  );
}
