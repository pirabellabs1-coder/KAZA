import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Building2,
  Users,
  Calendar,
  TrendingUp,
  ArrowRight,
  BarChart3,
  UserPlus,
  Activity,
  Rocket,
  HardDrive,
  ClipboardList,
  Sparkles,
  Plus,
} from "lucide-react";

import { StatsCard } from "@/components/dashboard/stats-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import {
  getOwnerPortfolioStats,
  listPropertiesByOwner,
} from "@/lib/queries/owner-properties";
import { getTeamStats, listTeamMembers } from "@/lib/queries/agency-team";

export const metadata: Metadata = {
  title: "Dashboard Agence — KAZA Pro",
  description: "Pilotez votre agence immobilière en un coup d'œil.",
};

const formatFcfa = (value: number) =>
  `${new Intl.NumberFormat("fr-FR").format(value)} FCFA`;

// Couleurs déterministes pour les initiales d'avatar (sans nom inventé).
const AVATAR_PALETTE = [
  "bg-kaza-navy",
  "bg-kaza-blue",
  "bg-kaza-green",
  "bg-amber-500",
  "bg-purple-500",
  "bg-rose-500",
  "bg-cyan-600",
  "bg-emerald-600",
];

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase())
    .filter(Boolean)
    .slice(0, 2)
    .join("");
}

// Raccourcis rapides
const quickActions = [
  {
    label: "Inviter un membre",
    href: "/agency/team",
    icon: UserPlus,
    accent: "from-kaza-blue/10 to-kaza-blue/5",
    iconColor: "text-kaza-blue",
  },
  {
    label: "Nouveau lead",
    href: "/agency/leads",
    icon: Activity,
    accent: "from-kaza-green/10 to-kaza-green/5",
    iconColor: "text-kaza-green",
  },
  {
    label: "Générer rapport",
    href: "/agency/reports",
    icon: ClipboardList,
    accent: "from-amber-100/80 to-amber-50/50",
    iconColor: "text-amber-600",
  },
  {
    label: "Booster annonce",
    href: "/owner/promotion",
    icon: Rocket,
    accent: "from-purple-100/80 to-purple-50/50",
    iconColor: "text-purple-600",
  },
];

export default async function AgencyDashboardPage() {
  const user = await getCurrentDisplayUser();
  if (!user) {
    redirect("/login");
  }

  const [allProperties, stats, teamMembers, teamStats] = await Promise.all([
    listPropertiesByOwner(user.id),
    getOwnerPortfolioStats(user.id),
    listTeamMembers(user.id),
    getTeamStats(user.id),
  ]);

  const topProps = allProperties.slice(0, 5);
  const hasProperties = stats.total > 0;
  const activeListings = stats.available + stats.rented;

  // Quotas — utilisation réelle pour annonces / équipe ; les autres restent à
  // 0 tant que les sources (boosts, stockage) ne sont pas branchées.
  const quotaStats = [
    {
      label: "Annonces",
      used: activeListings,
      max: 200,
      unit: "",
      icon: Building2,
    },
    { label: "Équipe", used: teamStats.total, max: 15, unit: "", icon: Users },
    { label: "Boosts (mois)", used: 0, max: 10, unit: "", icon: Rocket },
    { label: "Stockage", used: 0, max: 50, unit: " GB", icon: HardDrive },
  ];

  // Nom d'agence — basé sur le nom de l'utilisateur connecté tant que la
  // table agency_profiles n'est pas branchée.
  const agencyName =
    user.firstName && user.lastName
      ? `Agence ${user.firstName} ${user.lastName}`
      : "Votre agence";

  return (
    <div className="space-y-8">
      {/* Header bandeau */}
      <section className="rounded-2xl bg-gradient-to-r from-kaza-navy via-kaza-navy to-kaza-blue p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge className="mb-2 border-amber-300/40 bg-amber-500 text-white hover:bg-amber-500/90">
              Pro
            </Badge>
            <h1 className="font-heading text-2xl font-bold sm:text-3xl">
              {agencyName}
            </h1>
            <p className="mt-1 text-sm text-white/75">
              {teamStats.total > 0
                ? `${teamStats.total} collaborateur${teamStats.total > 1 ? "s" : ""}`
                : "Aucun collaborateur — invitez votre équipe"}
              {" · Espace KAZA Pro"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              asChild
              variant="outline"
              className="border-white bg-transparent text-white hover:bg-white/10"
            >
              <Link href="/agency/team">
                <Users className="mr-2 size-4" />
                Gérer l&apos;équipe
              </Link>
            </Button>
            <Button
              asChild
              className="bg-amber-500 text-white hover:bg-amber-500/90"
            >
              <Link href="/agency/analytics">
                <BarChart3 className="mr-2 size-4" />
                Analytics complètes
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* StatsCards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Annonces actives"
          value={activeListings}
          subtitle={`${stats.total} au total dans le portefeuille`}
          icon={Building2}
        />
        <StatsCard
          title="Équipe"
          value={`${teamStats.total} membre${teamStats.total > 1 ? "s" : ""}`}
          subtitle={
            teamStats.invited > 0
              ? `${teamStats.invited} invitation${teamStats.invited > 1 ? "s" : ""} en attente`
              : "Aucune invitation en attente"
          }
          icon={Users}
        />
        <StatsCard
          title="Visites du mois"
          value={0}
          subtitle="Aucune donnée encore"
          icon={Calendar}
        />
        <StatsCard
          title="Revenu potentiel"
          value={formatFcfa(stats.totalMonthlyRevenuePotential)}
          subtitle="Mensuel — annonces actives"
          icon={TrendingUp}
        />
      </section>

      {/* Équipe */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5 text-kaza-blue" />
            Équipe {agencyName}
          </CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/agency/team">
              Voir tout <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-kaza-blue/10">
                <UserPlus className="size-6 text-kaza-blue" />
              </div>
              <p className="mt-3 font-heading text-base font-semibold text-kaza-navy">
                Aucun membre encore
              </p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Invitez vos premiers collaborateurs pour piloter votre agence en
                équipe.
              </p>
              <Button
                asChild
                size="sm"
                className="mt-4 bg-kaza-navy text-white hover:bg-kaza-navy/90"
              >
                <Link href="/agency/team">
                  <UserPlus className="mr-2 size-4" />
                  Inviter un membre
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex -space-x-3">
                {teamMembers.slice(0, 6).map((m, idx) => (
                  <div
                    key={m.id}
                    title={`${m.fullName} — ${m.role}`}
                    className={`flex size-11 items-center justify-center rounded-full text-sm font-semibold text-white ring-2 ring-white ${AVATAR_PALETTE[idx % AVATAR_PALETTE.length]}`}
                  >
                    {initialsOf(m.fullName) || "?"}
                  </div>
                ))}
                {teamMembers.length > 6 && (
                  <div className="flex size-11 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground ring-2 ring-white">
                    +{teamMembers.length - 6}
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-wrap gap-x-8 gap-y-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Total équipe</p>
                  <p className="font-semibold text-kaza-navy">
                    {teamStats.total} membre{teamStats.total > 1 ? "s" : ""}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Agents actifs</p>
                  <p className="font-semibold text-kaza-navy">
                    {teamStats.active}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Visites moyennes / agent
                  </p>
                  <p className="font-semibold text-kaza-navy">
                    Aucune donnée encore
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance globale — empty state honnête tant que les revenus
          mensuels ne sont pas agrégés. */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-5 text-kaza-green" />
            Performance globale
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-kaza-green/10">
              <TrendingUp className="size-6 text-kaza-green" />
            </div>
            <p className="mt-3 font-heading text-base font-semibold text-kaza-navy">
              Données insuffisantes pour ce graphique
            </p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Les revenus mensuels apparaîtront ici dès que vos premiers loyers
              auront été encaissés via KAZA.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Activité récente + Pipeline */}
      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-5 text-kaza-blue" />
              Activité récente
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/notifications">
                Tout voir <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-kaza-blue/10">
                <Activity className="size-6 text-kaza-blue" />
              </div>
              <p className="mt-3 font-heading text-base font-semibold text-kaza-navy">
                Aucune activité récente
              </p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Vos évènements (signatures, leads, visites, paiements)
                apparaîtront ici en temps réel.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-5 text-kaza-blue" />
              Pipeline
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/agency/leads">
                CRM <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-kaza-blue/10">
                <BarChart3 className="size-6 text-kaza-blue" />
              </div>
              <p className="mt-3 font-heading text-base font-semibold text-kaza-navy">
                Pipeline vide
              </p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Les leads apparaîtront ici dès qu&apos;une demande sera reçue.
              </p>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="mt-4"
              >
                <Link href="/agency/leads">Ouvrir le CRM</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Quotas Pro Premium */}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-kaza-navy/[0.04] via-white to-kaza-blue/[0.06] shadow-sm ring-1 ring-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-amber-500" />
              Quotas — KAZA Pro Premium
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Utilisation en temps réel de votre plan d&apos;abonnement.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/agency/billing">
              Gérer mon plan <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quotaStats.map((stat) => {
              const percentage = Math.min(
                100,
                Math.round((stat.used / stat.max) * 100),
              );
              const isWarning = percentage > 80;
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="rounded-xl border border-border/70 bg-white p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Icon className="size-3.5 text-kaza-blue" />
                      {stat.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {percentage}%
                    </span>
                  </div>
                  <p className="font-heading text-xl font-bold text-kaza-navy">
                    {stat.used}
                    <span className="text-sm text-muted-foreground">
                      {stat.unit} / {stat.max}
                      {stat.unit}
                    </span>
                  </p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${
                        isWarning ? "bg-amber-500" : "bg-kaza-blue"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Raccourcis rapides */}
      <section>
        <h2 className="mb-3 font-heading text-lg font-bold text-kaza-navy">
          Raccourcis rapides
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className={`group flex items-center gap-3 rounded-2xl border border-border bg-gradient-to-br ${action.accent} p-5 transition-all hover:-translate-y-0.5 hover:shadow-md`}
              >
                <span
                  className={`flex size-11 items-center justify-center rounded-xl bg-white shadow-sm ${action.iconColor}`}
                >
                  <Icon className="size-5" />
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-kaza-navy">{action.label}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-kaza-blue">
                    Ouvrir{" "}
                    <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Annonces top 5 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-5 text-kaza-blue" />
            Top 5 annonces du mois
          </CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/agency/portfolio">
              Voir le portefeuille <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {hasProperties ? (
            <ul className="divide-y divide-border">
              {topProps.map((p, idx) => (
                <li
                  key={p.id}
                  className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-kaza-blue/10 text-sm font-bold text-kaza-blue">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-medium text-foreground">{p.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.viewsCount.toLocaleString("fr-FR")} vues ·{" "}
                        {p.address}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-kaza-navy">
                    {formatFcfa(p.price)}
                    <span className="text-xs font-normal text-muted-foreground">
                      {" "}
                      / mois
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-kaza-blue/10">
                <Building2 className="size-7 text-kaza-blue" />
              </div>
              <p className="mt-4 font-heading text-base font-semibold text-kaza-navy">
                Aucune annonce encore publiée
              </p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Démarrez votre portefeuille pour suivre vos annonces les plus
                performantes ici.
              </p>
              <Button
                asChild
                className="mt-5 bg-kaza-navy text-white hover:bg-kaza-navy/90"
              >
                <Link href="/owner/properties/new">
                  <Plus className="mr-2 size-4" />
                  Publier ma première annonce
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
