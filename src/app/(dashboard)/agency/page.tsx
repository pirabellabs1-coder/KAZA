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
  FileSignature,
  UserPlus,
  CalendarCheck,
  MessageSquare,
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

export const metadata: Metadata = {
  title: "Dashboard Agence — KAZA Pro",
  description: "Pilotez votre agence immobilière en un coup d'œil.",
};

const formatFcfa = (value: number) =>
  `${new Intl.NumberFormat("fr-FR").format(value)} FCFA`;

// ────────────────────────────────────────────────────────────────────────────
// Mocks conservés — sections qui n'ont pas encore de table dédiée en base
// (équipe / pipeline CRM / activité / graphe historique CA 12 mois).
// ────────────────────────────────────────────────────────────────────────────

const teamMembers = [
  { name: "Aïcha Toko", role: "Directrice", initials: "AT", color: "bg-kaza-navy" },
  { name: "Komi Agbeko", role: "Agent senior", initials: "KA", color: "bg-kaza-blue" },
  { name: "Sandra Mensah", role: "Agent", initials: "SM", color: "bg-kaza-green" },
  { name: "Olivier Houngbo", role: "Agent", initials: "OH", color: "bg-amber-500" },
  { name: "Yacine Sow", role: "Gestionnaire", initials: "YS", color: "bg-purple-500" },
  { name: "Mariam Tossou", role: "Agent", initials: "MT", color: "bg-rose-500" },
  { name: "Léa Adjovi", role: "Stagiaire", initials: "LA", color: "bg-cyan-600" },
  { name: "Pierre Kpondéhou", role: "Comptable", initials: "PK", color: "bg-emerald-600" },
];

// Données mensuelles CA (en milliers de FCFA) — placeholder graphe
// TODO: remplacer par une vraie agrégation issue des paiements une fois la table consolidée.
const monthlyRevenue = [
  { month: "Juin 25", value: 8200 },
  { month: "Juil. 25", value: 9100 },
  { month: "Août 25", value: 10300 },
  { month: "Sept. 25", value: 9800 },
  { month: "Oct. 25", value: 11200 },
  { month: "Nov. 25", value: 12500 },
  { month: "Déc. 25", value: 11800 },
  { month: "Janv. 26", value: 13400 },
  { month: "Févr. 26", value: 14100 },
  { month: "Mars 26", value: 13900 },
  { month: "Avr. 26", value: 15200 },
  { month: "Mai 26", value: 16800 },
];

// Activité récente — placeholder, viendra d'une table activity_logs
const recentActivity = [
  {
    id: "act-1",
    type: "signature" as const,
    title: "Bail signé — Loft Haie Vive",
    agent: "Komi Agbeko",
    when: "Il y a 35 min",
    icon: FileSignature,
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    id: "act-2",
    type: "lead" as const,
    title: "Nouveau lead — Marc-Aurèle Sossou",
    agent: "Attribué à Mariam Tossou",
    when: "Il y a 2 h",
    icon: UserPlus,
    color: "bg-kaza-blue/15 text-kaza-blue",
  },
  {
    id: "act-3",
    type: "visit" as const,
    title: "Visite confirmée — Villa Fidjrossè",
    agent: "Aïcha Toko",
    when: "Il y a 3 h",
    icon: CalendarCheck,
    color: "bg-amber-100 text-amber-700",
  },
  {
    id: "act-4",
    type: "message" as const,
    title: "Message reçu — Famille Diop",
    agent: "Inbox équipe",
    when: "Il y a 5 h",
    icon: MessageSquare,
    color: "bg-purple-100 text-purple-700",
  },
  {
    id: "act-5",
    type: "lead" as const,
    title: "Lead qualifié — Awa Bessan",
    agent: "Mariam Tossou",
    when: "Hier, 18 h 12",
    icon: UserPlus,
    color: "bg-kaza-blue/15 text-kaza-blue",
  },
  {
    id: "act-6",
    type: "signature" as const,
    title: "Bail signé — T4 Cadjèhoun",
    agent: "Komi Agbeko",
    when: "Hier, 14 h 30",
    icon: FileSignature,
    color: "bg-emerald-100 text-emerald-700",
  },
];

// Pipeline CRM — placeholder
const pipelineStages = [
  { key: "NEW", label: "Nouveaux", count: 18, color: "bg-slate-400" },
  { key: "CONTACTED", label: "Contactés", count: 12, color: "bg-kaza-blue" },
  { key: "QUALIFIED", label: "Qualifiés", count: 9, color: "bg-indigo-500" },
  { key: "VISIT", label: "Visites planifiées", count: 14, color: "bg-amber-500" },
  { key: "OFFER", label: "Offres", count: 5, color: "bg-kaza-green" },
];

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

function buildSvgPath(
  values: number[],
  width: number,
  height: number,
  padding = 8,
) {
  if (values.length === 0) return "";
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const stepX = (width - padding * 2) / (values.length - 1);
  return values
    .map((v, i) => {
      const x = padding + i * stepX;
      const y =
        height - padding - ((v - min) / range) * (height - padding * 2);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

export default async function AgencyDashboardPage() {
  const user = await getCurrentDisplayUser();
  if (!user) {
    redirect("/login");
  }

  const [allProperties, stats] = await Promise.all([
    listPropertiesByOwner(user.id),
    getOwnerPortfolioStats(user.id),
  ]);

  const topProps = allProperties.slice(0, 5);
  const hasProperties = stats.total > 0;
  const activeListings = stats.available + stats.rented;

  // Quotas mock — viendront d'une table subscriptions à terme
  const quotaStats = [
    {
      label: "Annonces",
      used: activeListings,
      max: 200,
      unit: "",
      icon: Building2,
    },
    { label: "Équipe", used: 8, max: 15, unit: "", icon: Users },
    { label: "Boosts (mois)", used: 4, max: 10, unit: "", icon: Rocket },
    { label: "Stockage", used: 12.4, max: 50, unit: " GB", icon: HardDrive },
  ];

  const chartWidth = 720;
  const chartHeight = 220;
  const values = monthlyRevenue.map((m) => m.value);
  const linePath = buildSvgPath(values, chartWidth, chartHeight);
  const areaPath = `${linePath} L ${chartWidth - 8} ${chartHeight - 8} L 8 ${chartHeight - 8} Z`;
  const totalCa = values.reduce((acc, v) => acc + v, 0) * 1000;
  const maxStageCount = Math.max(...pipelineStages.map((s) => s.count));

  // Affichage du nom de l'agence — fallback "Premier Immobilier" tant que
  // la table agencies / le champ users.bio n'est pas exploité.
  // TODO: brancher sur public.users.bio ou table agencies dédiée.
  const agencyName =
    user.firstName && user.lastName
      ? `Agence ${user.firstName} ${user.lastName}`
      : "Agence Premier Immobilier";

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
              Cotonou · {teamMembers.length} collaborateurs · Membre KAZA Pro
              depuis 2024
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
          value={`${teamMembers.length} membres`}
          subtitle="Données plateforme"
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
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex -space-x-3">
              {teamMembers.slice(0, 6).map((m) => (
                <div
                  key={m.name}
                  title={`${m.name} — ${m.role}`}
                  className={`flex size-11 items-center justify-center rounded-full text-sm font-semibold text-white ring-2 ring-white ${m.color}`}
                >
                  {m.initials}
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
                  {teamMembers.length} membres
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Agents actifs</p>
                <p className="font-semibold text-kaza-navy">5</p>
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
        </CardContent>
      </Card>

      {/* Performance globale — graphe 12 mois (placeholder) */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="size-5 text-kaza-green" />
                Performance globale
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Revenus mensuels sur les 12 derniers mois — données de
                démonstration
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total 12 mois</p>
              <p className="font-heading text-2xl font-bold text-kaza-navy">
                {formatFcfa(totalCa)}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="h-56 w-full min-w-[600px]"
              role="img"
              aria-label="Graphique des revenus mensuels"
            >
              <defs>
                <linearGradient id="caGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1976D2" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#1976D2" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0.25, 0.5, 0.75].map((p) => (
                <line
                  key={p}
                  x1="8"
                  x2={chartWidth - 8}
                  y1={chartHeight * p}
                  y2={chartHeight * p}
                  stroke="#E5E7EB"
                  strokeDasharray="4 4"
                />
              ))}
              <path d={areaPath} fill="url(#caGradient)" />
              <path
                d={linePath}
                fill="none"
                stroke="#1976D2"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {values.map((v, i) => {
                const max = Math.max(...values);
                const min = Math.min(...values);
                const range = max - min || 1;
                const stepX = (chartWidth - 16) / (values.length - 1);
                const x = 8 + i * stepX;
                const y =
                  chartHeight -
                  8 -
                  ((v - min) / range) * (chartHeight - 16);
                return <circle key={i} cx={x} cy={y} r="3.5" fill="#1976D2" />;
              })}
            </svg>
            <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
              {monthlyRevenue.map((m) => (
                <span key={m.month} className="hidden sm:inline">
                  {m.month}
                </span>
              ))}
            </div>
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
            <ol className="relative space-y-5 border-l-2 border-border pl-6">
              {recentActivity.map((event) => {
                const Icon = event.icon;
                return (
                  <li key={event.id} className="relative">
                    <span
                      className={`absolute -left-[34px] flex size-7 items-center justify-center rounded-full ring-4 ring-white ${event.color}`}
                    >
                      <Icon className="size-3.5" />
                    </span>
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between">
                      <p className="text-sm font-medium text-foreground">
                        {event.title}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {event.when}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {event.agent}
                    </p>
                  </li>
                );
              })}
            </ol>
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
            <div className="space-y-4">
              {pipelineStages.map((stage) => {
                const percentage = Math.round(
                  (stage.count / maxStageCount) * 100,
                );
                return (
                  <div key={stage.key}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {stage.label}
                      </span>
                      <span className="font-heading text-sm font-bold text-kaza-navy">
                        {stage.count}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${stage.color}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-border pt-3 text-xs">
              <span className="text-muted-foreground">Total ouverts</span>
              <span className="font-semibold text-kaza-navy">
                {pipelineStages.reduce((acc, s) => acc + s.count, 0)} leads
              </span>
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
