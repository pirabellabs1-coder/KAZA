import type { Metadata } from "next";
import Link from "next/link";
import {
  TrendingUp,
  Download,
  FileSpreadsheet,
  FileText,
  MapPin,
  Lightbulb,
  Target,
  BarChart3,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Page Analytics agence — tout est branché sur des fallbacks vides tant que
// les vues SQL d'agrégation (analytics_monthly_revenue, analytics_funnel,
// analytics_occupancy, analytics_lead_sources, analytics_top_neighborhoods,
// team_performance) ne sont pas matérialisées.
// ---------------------------------------------------------------------------

const AGENCY_PROFILE = {
  name: "votre agence",
};

export const metadata: Metadata = {
  title: "Analytics — KAZA Pro Agence",
  description:
    "Analytics avancées de l'agence : revenus, conversion, occupation, sources de leads et performance des agents.",
};

const periods = [
  { id: "7d", label: "7 jours" },
  { id: "30d", label: "30 jours" },
  { id: "90d", label: "90 jours" },
  { id: "12m", label: "12 mois", active: true },
  { id: "ytd", label: "YTD" },
  { id: "custom", label: "Personnalisé" },
];

// Sous-composant : empty state honnête utilisé pour tous les graphes tant
// que les sources de données ne sont pas branchées.
function ChartEmptyState({
  title = "Données insuffisantes pour ce graphique",
  description,
  Icon = BarChart3,
}: {
  title?: string;
  description?: string;
  Icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-kaza-blue/10">
        <Icon className="size-6 text-kaza-blue" />
      </div>
      <p className="mt-3 font-heading text-base font-semibold text-kaza-navy">
        {title}
      </p>
      {description ? (
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AgencyAnalyticsPage() {
  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-kaza-navy">
            Analytics — {AGENCY_PROFILE.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vue 360° sur la performance de votre agence — les indicateurs
            s&apos;afficheront ici dès que vos premières données seront
            collectées.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/agency/reports">
              <FileSpreadsheet className="size-4" /> Exporter (Excel/CSV)
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/agency/reports">
              <FileText className="size-4" /> Rapports
            </Link>
          </Button>
        </div>
      </div>

      {/* Sélecteur période — visuel */}
      <div className="inline-flex flex-wrap items-center gap-1 rounded-2xl border bg-muted/40 p-1">
        {periods.map((p) => (
          <span
            key={p.id}
            className={cn(
              "rounded-xl px-3.5 py-1.5 text-xs font-medium transition-colors",
              p.active
                ? "bg-white text-kaza-navy shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:text-kaza-navy",
            )}
          >
            {p.label}
          </span>
        ))}
      </div>

      {/* KPI ROW */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiEmptyCard label="CA mensuel" Icon={TrendingUp} />
        <KpiEmptyCard label="Signatures du mois" Icon={Target} />
        <KpiEmptyCard label="Taux d'occupation" Icon={BarChart3} />
        <KpiEmptyCard label="Satisfaction client" Icon={Users} />
      </div>

      {/* GRAPHIQUE 1 — Revenus 12 mois */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading">
            <TrendingUp className="size-5 text-kaza-blue" /> Revenus mensuels
          </CardTitle>
          <CardDescription>
            CA cumulé sur 12 mois — branché sur les paiements encaissés via
            KAZA.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartEmptyState
            description="Aucun paiement encaissé sur la période. Les revenus mensuels s'afficheront ici dès la première transaction confirmée."
            Icon={TrendingUp}
          />
        </CardContent>
      </Card>

      {/* GRAPHIQUE 2 — Funnel */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading">
            <Target className="size-5 text-kaza-blue" /> Funnel de conversion
          </CardTitle>
          <CardDescription>
            De la vue d&apos;une annonce jusqu&apos;à la signature du contrat.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartEmptyState
            description="Le funnel apparaîtra dès que vos annonces auront généré des vues, contacts et visites."
            Icon={Target}
          />
        </CardContent>
      </Card>

      {/* GRAPHIQUES 3 + 4 — OCCUPATION + DONUT */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <BarChart3 className="size-5 text-kaza-blue" /> Occupation par
              type de bien
            </CardTitle>
            <CardDescription>
              Loués / Total — sera calculé sur l&apos;ensemble de votre
              portefeuille.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartEmptyState
              description="Publiez vos premières annonces et signez vos premiers baux pour voir le taux d'occupation par typologie."
              Icon={BarChart3}
            />
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <Users className="size-5 text-kaza-blue" /> Sources des leads
            </CardTitle>
            <CardDescription>
              Origine des leads des 30 derniers jours.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartEmptyState
              description="Aucun lead enregistré sur la période. La répartition par canal s'affichera dès la première demande reçue."
              Icon={Users}
            />
          </CardContent>
        </Card>
      </div>

      {/* GRAPHIQUE 5 — TOP QUARTIERS */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading">
            <MapPin className="size-5 text-kaza-blue" /> Top quartiers — CA
            généré
          </CardTitle>
          <CardDescription>
            Quartiers les plus performants des 90 derniers jours.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartEmptyState
            description="Les quartiers générant le plus de revenus apparaîtront ici après vos premières locations."
            Icon={MapPin}
          />
        </CardContent>
      </Card>

      {/* TABLE — PERFORMANCE PAR AGENT */}
      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 font-heading">
              <Users className="size-5 text-kaza-blue" /> Performance par agent
            </CardTitle>
            <CardDescription>
              Classement trié par CA généré (année en cours).
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/agency/reports">
              <Download className="size-4" /> Exporter
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <ChartEmptyState
            title="Aucun agent enregistré"
            description="Invitez votre équipe depuis la page Équipe pour suivre la performance individuelle (visites, signatures, CA, conversion)."
            Icon={Users}
          />
        </CardContent>
      </Card>

      {/* INSIGHTS */}
      <Card className="rounded-2xl border-kaza-blue/20 bg-gradient-to-br from-kaza-blue/5 to-kaza-navy/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-kaza-navy">
            <Lightbulb className="size-5 text-amber-500" /> Insights de la
            semaine
          </CardTitle>
          <CardDescription>
            Recommandations automatiques basées sur vos données 30 j.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartEmptyState
            title="Pas encore d'insights"
            description="Notre moteur d'analyse a besoin d'au moins 30 jours d'activité pour produire ses premières recommandations."
            Icon={Lightbulb}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sous-composants
// ---------------------------------------------------------------------------

interface KpiEmptyCardProps {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}

function KpiEmptyCard({ label, Icon }: KpiEmptyCardProps) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
          <Icon className="size-5 text-kaza-navy" />
        </div>
      </div>
      <div className="mt-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 font-heading text-2xl font-bold text-muted-foreground">
          —
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Aucune donnée encore
        </p>
      </div>
    </div>
  );
}
