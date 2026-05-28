import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Building2,
  MessageSquare,
  Sparkles,
  Wallet,
  Target,
  Clock,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { getLead, type LeadSource, type LeadStage } from "@/lib/queries/agency-leads";
import { listTeamMembers } from "@/lib/queries/agency-team";

import { LeadControls } from "./lead-controls";
import { LeadNotesEditor } from "./lead-notes-editor";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const lead = await getLead(id);
  return {
    title: lead
      ? `${lead.fullName} — Lead KAZA Agence`
      : "Lead introuvable — KAZA Agence",
    description: lead?.notes ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Constantes de présentation
// ---------------------------------------------------------------------------

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

const SOURCE_LABELS: Record<LeadSource, string> = {
  SITE_KAZA: "Site KAZA",
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

function formatDateFr(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatFcfa(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return `${new Intl.NumberFormat("fr-FR").format(value)} FCFA`;
}

function initialsOf(name: string): string {
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

export default async function LeadDetailPage({ params }: PageProps) {
  const user = await getCurrentDisplayUser();
  if (!user) {
    redirect("/login?redirect=/agency/leads");
  }

  const { id } = await params;
  const [lead, members] = await Promise.all([
    getLead(id),
    listTeamMembers(user.id),
  ]);

  if (!lead || lead.agencyId !== user.id) {
    notFound();
  }

  const activeAgents = members
    .filter((m) => m.status === "ACTIVE" || m.status === "ON_LEAVE")
    .map((m) => ({ id: m.id, fullName: m.fullName }));

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div>
        <Link
          href="/agency/leads"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-kaza-navy"
        >
          <ArrowLeft className="size-4" />
          Retour au pipeline
        </Link>
      </div>

      {/* Header */}
      <Card className="overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-kaza-navy via-kaza-navy/95 to-kaza-blue text-white shadow-lg">
        <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-white/15 text-2xl font-bold">
              {initialsOf(lead.fullName)}
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold sm:text-3xl">
                {lead.fullName}
              </h1>
              {lead.email && (
                <p className="mt-1 text-sm text-white/80">{lead.email}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge
                  variant="secondary"
                  className={`${STAGE_COLORS[lead.stage]} font-semibold`}
                >
                  {STAGE_LABELS[lead.stage]}
                </Badge>
                <Badge
                  variant="secondary"
                  className={SOURCE_COLORS[lead.source]}
                >
                  {SOURCE_LABELS[lead.source]}
                </Badge>
                <Badge variant="secondary" className="bg-white/15 text-white">
                  Score : {lead.score}/100
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Colonne principale */}
        <div className="space-y-6 lg:col-span-2">
          {/* Notes */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100">
                <MessageSquare className="size-5 text-amber-700" />
              </div>
              <CardTitle className="font-heading text-lg text-kaza-navy">
                Notes &amp; suivi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LeadNotesEditor
                leadId={lead.id}
                initialNotes={lead.notes ?? ""}
              />
            </CardContent>
          </Card>

          {/* Propriété intéressée */}
          {lead.property && (
            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-kaza-blue/10">
                  <Building2 className="size-5 text-kaza-blue" />
                </div>
                <CardTitle className="font-heading text-lg text-kaza-navy">
                  Bien d&apos;intérêt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/properties/${lead.property.id}`}
                  className="block rounded-xl border bg-card p-4 transition hover:border-kaza-navy hover:shadow"
                >
                  <p className="font-semibold text-kaza-navy">
                    {lead.property.title}
                  </p>
                  {lead.property.address && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {lead.property.address}
                    </p>
                  )}
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Historique synthétique */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-kaza-green/10">
                <Clock className="size-5 text-kaza-green" />
              </div>
              <CardTitle className="font-heading text-lg text-kaza-navy">
                Activité
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4 border-l-2 border-muted pl-4">
                <li className="relative">
                  <span className="absolute -left-[1.4rem] top-1 size-3 rounded-full bg-kaza-blue ring-4 ring-white" />
                  <p className="text-sm font-medium text-foreground">
                    Dernière activité — {STAGE_LABELS[lead.stage]}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDateFr(lead.lastActivityAt)}
                  </p>
                </li>
                <li className="relative">
                  <span className="absolute -left-[1.4rem] top-1 size-3 rounded-full bg-slate-400 ring-4 ring-white" />
                  <p className="text-sm font-medium text-foreground">
                    Lead créé via {SOURCE_LABELS[lead.source]}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDateFr(lead.createdAt)}
                  </p>
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Actions */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading text-base text-kaza-navy">
                Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LeadControls
                leadId={lead.id}
                currentStage={lead.stage}
                currentAssignee={lead.assignedTo}
                agents={activeAgents}
              />
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading text-base text-kaza-navy">
                Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ContactRow
                icon={<Mail className="size-4 text-muted-foreground" />}
                label="Email"
                value={lead.email}
              />
              <ContactRow
                icon={<Phone className="size-4 text-muted-foreground" />}
                label="Téléphone"
                value={lead.phone}
              />
              <ContactRow
                icon={<Calendar className="size-4 text-muted-foreground" />}
                label="Créé le"
                value={formatDateFr(lead.createdAt)}
              />
            </CardContent>
          </Card>

          {/* Profil commercial */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading text-base text-kaza-navy">
                Profil commercial
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Row
                icon={<Wallet className="size-4 text-kaza-navy" />}
                label="Budget"
                value={formatFcfa(lead.budgetFcfa)}
              />
              <Row
                icon={<Target className="size-4 text-amber-600" />}
                label="Score"
                value={`${lead.score} / 100`}
              />
              <Row
                icon={<Sparkles className="size-4 text-kaza-blue" />}
                label="Source"
                value={SOURCE_LABELS[lead.source]}
              />
              {lead.assignedMember && (
                <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-kaza-navy text-sm font-semibold text-white">
                    {initialsOf(lead.assignedMember.fullName)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      Agent assigné
                    </p>
                    <p className="truncate text-sm font-semibold text-foreground">
                      {lead.assignedMember.fullName}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function ContactRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value ?? "—"}</p>
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <span className="text-sm font-semibold text-kaza-navy">{value}</span>
    </div>
  );
}
