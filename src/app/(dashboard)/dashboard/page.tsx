import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowRight,
  Bell,
  Building2,
  CalendarCheck,
  CreditCard,
  FileText,
  Heart,
  MessagesSquare,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { StatsCard } from "@/components/dashboard/stats-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { listOwnerVisits, type OwnerVisit } from "@/lib/queries/owner-activity";
import {
  getOwnerDashboardAnalytics,
  type OwnerReviewsBreakdownPoint,
  type OwnerTopProperty,
  type OwnerVisitsFunnelPoint,
} from "@/lib/queries/owner-dashboard";
import type { MonthlyRevenuePoint } from "@/lib/queries/owner-revenue";
import {
  listSavedProperties,
  listTenantMessages,
  listStudentColocations,
} from "@/lib/queries/tenant-activity";
import {
  getTenantFinanceSummary,
  type TenantFinanceSummary,
} from "@/lib/queries/tenant-finance";
import { getAdminStats } from "@/lib/queries/admin";
import {
  formatFcfa,
  formatFcfaShort,
  formatNumber,
  formatPrice,
  settleAll,
} from "@/lib/utils";

// Repli finance (degradation gracieuse) si la requete Supabase echoue.
const EMPTY_FINANCE: TenantFinanceSummary = {
  currentRent: 0,
  totalPaid: 0,
  totalPaid12m: 0,
  walletBalance: 0,
  activeRentals: 0,
  payments: [],
  monthlyHistory: [],
};

export const metadata: Metadata = {
  title: "Tableau de bord",
};

// Statut de vérification d'identité réel (table public.users.is_verified).
async function fetchIsVerified(userId: string): Promise<boolean> {
  try {
    const supabase = (await createClient()) as unknown as {
      from: (t: string) => {
        select: (c: string) => {
          eq: (
            k: string,
            v: string,
          ) => { maybeSingle: () => Promise<{ data: { is_verified?: boolean } | null }> };
        };
      };
    };
    const { data } = await supabase
      .from("users")
      .select("is_verified")
      .eq("id", userId)
      .maybeSingle();
    return Boolean(data?.is_verified);
  } catch {
    return false;
  }
}

export default async function DashboardPage() {
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login?redirect=/dashboard");

  const role = user.role;

  // L'acheteur a son propre tableau de bord dédié.
  if (role === "BUYER") {
    redirect("/buyer");
  }

  if (role === "ADMIN") {
    return <AdminOverview firstName={user.firstName} />;
  }
  if (role === "OWNER") {
    const [visits, analytics] = await Promise.all([
      listOwnerVisits(user.id),
      getOwnerDashboardAnalytics(user.id),
    ]);
    // eslint-disable-next-line react-hooks/purity -- Server Component rendu une fois par requête ; horloge serveur acceptable
    const now = Date.now();
    const upcomingVisits = visits
      .filter(
        (v) =>
          (v.status === "PENDING" || v.status === "ACCEPTED") &&
          new Date(v.proposedDate).getTime() >= now,
      )
      .sort(
        (a, b) =>
          new Date(a.proposedDate).getTime() - new Date(b.proposedDate).getTime(),
      )
      .slice(0, 5);
    const pendingCount = visits.filter((v) => v.status === "PENDING").length;
    // Visites planifiées cette semaine (7 prochains jours, réel).
    const weekEnd = now + 7 * 24 * 60 * 60 * 1000;
    const visitsThisWeek = visits.filter((v) => {
      const t = new Date(v.proposedDate).getTime();
      return (
        (v.status === "PENDING" || v.status === "ACCEPTED") &&
        t >= now &&
        t <= weekEnd
      );
    }).length;
    return (
      <OwnerOverview
        firstName={user.firstName}
        upcomingVisits={upcomingVisits}
        pendingVisitsCount={pendingCount}
        visitsThisWeek={visitsThisWeek}
        monthlyRevenue={analytics.monthlyRevenue}
        reviewsBreakdown={analytics.reviewsBreakdown}
        topProperties={analytics.topProperties}
        visitsFunnel={analytics.visitsFunnel}
      />
    );
  }
  if (role === "STUDENT") {
    return <StudentOverview firstName={user.firstName} userId={user.id} />;
  }
  return <TenantOverview firstName={user.firstName} userId={user.id} />;
}

// =============================================================================
// OWNER — DASHBOARD RICHE (analytics + activité + raccourcis)
// =============================================================================
function OwnerOverview({
  firstName,
  upcomingVisits,
  pendingVisitsCount,
  visitsThisWeek,
  monthlyRevenue,
  reviewsBreakdown,
  topProperties,
  visitsFunnel,
}: {
  firstName: string;
  upcomingVisits: OwnerVisit[];
  visitsThisWeek: number;
  pendingVisitsCount: number;
  monthlyRevenue: MonthlyRevenuePoint[];
  reviewsBreakdown: OwnerReviewsBreakdownPoint[];
  topProperties: OwnerTopProperty[];
  visitsFunnel: OwnerVisitsFunnelPoint[];
}) {
  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const currentMonthLabel = new Date().toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  const data = monthlyRevenue;
  const maxRev = data.length > 0 ? Math.max(...data.map((d) => d.revenue)) : 0;
  const currentRev = data.length > 0 ? data[data.length - 1].revenue : 0;
  const prevRev = data.length > 1 ? data[data.length - 2].revenue : 0;
  const revGrowth =
    prevRev > 0 ? (((currentRev - prevRev) / prevRev) * 100).toFixed(1) : "0.0";
  const currentOcc = data.length > 0 ? data[data.length - 1].occupancy : 0;
  const prevOcc = data.length > 1 ? data[data.length - 2].occupancy : 0;
  const occGrowth = currentOcc - prevOcc;

  // KPI sparklines : 8 derniers mois (fallback vide → [0])
  const sparkRev = data.length > 0 ? data.slice(-8).map((d) => d.revenue) : [0];
  const sparkOcc = data.length > 0 ? data.slice(-8).map((d) => d.occupancy) : [0];

  const totalReviews = reviewsBreakdown.reduce((s, r) => s + r.count, 0);
  const avgRating =
    totalReviews > 0
      ? (
          reviewsBreakdown.reduce(
            (s, r) => s + r.rating * r.count,
            0,
          ) / totalReviews
        ).toFixed(1)
      : "0.0";

  // Funnel : conversion entre étapes
  const funnel = visitsFunnel;
  const maxFunnel = funnel.length > 0 ? Math.max(...funnel.map((f) => f.value)) : 0;

  // Donut avis
  const reviews = reviewsBreakdown;
  const donutTotal = totalReviews;
  let donutCumul = 0;
  const donutSegments = reviews.map((r) => {
    const start = donutCumul;
    // eslint-disable-next-line react-hooks/immutability -- accumulateur local pour le calcul du donut (cumul d'angles), pur pour des données identiques
    donutCumul += r.count;
    const startAngle = donutTotal > 0 ? (start / donutTotal) * 360 : 0;
    const endAngle = donutTotal > 0 ? (donutCumul / donutTotal) * 360 : 0;
    return { ...r, startAngle, endAngle };
  });

  return (
    <div className="space-y-8">
      {/* Header personnalisé */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-kaza-green">
            Espace propriétaire
          </p>
          <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
            Bonjour {firstName}, voici votre journée
          </h1>
          <p className="mt-1 text-sm capitalize text-muted-foreground">
            {today}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/notifications">
              <Bell className="mr-2 size-4" /> Notifications
            </Link>
          </Button>
          <Button size="sm" className="bg-kaza-green hover:bg-kaza-green/90" asChild>
            <Link href="/owner/properties/new">
              <Building2 className="mr-2 size-4" /> Publier un bien
            </Link>
          </Button>
        </div>
      </div>

      {/* Action banner */}
      <Link
        href="/owner/visits?status=PENDING"
        className="group block overflow-hidden rounded-2xl bg-gradient-to-r from-kaza-navy via-[#1A3A52] to-kaza-blue p-5 text-white shadow-sm transition-shadow hover:shadow-md sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
              <CalendarCheck className="size-6" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-white/70">
                Action requise
              </p>
              <p className="font-heading text-lg font-semibold sm:text-xl">
                {pendingVisitsCount > 0
                  ? `Vous avez ${pendingVisitsCount} demande${pendingVisitsCount > 1 ? "s" : ""} de visite en attente`
                  : "Aucune demande de visite en attente"}
              </p>
              <p className="text-sm text-white/80">
                {pendingVisitsCount > 0
                  ? "Les locataires attendent votre réponse."
                  : "Vous serez notifié dès qu'un locataire demandera à visiter un bien."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-kaza-navy transition-transform group-hover:translate-x-1">
            Répondre maintenant
            <ArrowRight className="size-4" />
          </div>
        </div>
      </Link>

      {/* KPI cards row (4) avec sparklines */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Revenus mensuels"
          value={formatFcfa(currentRev)}
          delta={`+${revGrowth}%`}
          deltaType="positive"
          icon={Wallet}
          sparkData={sparkRev}
          sparkColor="#1976D2"
          accent="from-kaza-blue/10 to-blue-50"
        />
        <KpiCard
          label="Taux d'occupation"
          value={`${currentOcc}%`}
          delta={`${occGrowth >= 0 ? "+" : ""}${occGrowth}pt`}
          deltaType={occGrowth >= 0 ? "positive" : "negative"}
          icon={TrendingUp}
          sparkData={sparkOcc}
          sparkColor="#4CAF50"
          accent="from-kaza-green/10 to-emerald-50"
        />
        <KpiCard
          label="Visites planifiées"
          value={String(visitsThisWeek)}
          delta="cette semaine"
          deltaType="neutral"
          icon={CalendarCheck}
          sparkData={[]}
          sparkColor="#F59E0B"
          accent="from-amber-100 to-amber-50"
        />
        <KpiCard
          label="Note moyenne"
          value={totalReviews > 0 ? `${avgRating}/5` : "—"}
          delta={`sur ${totalReviews} avis`}
          deltaType="neutral"
          icon={Star}
          sparkData={[]}
          sparkColor="#1A3A52"
          accent="from-slate-100 to-slate-50"
        />
      </div>

      {/* GRAPHIQUE 1 — Revenus + Occupation (dual-axis) */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="font-heading text-lg">
              Revenus & taux d&apos;occupation — 12 mois
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Comparaison mensuelle revenus encaissés vs. taux d&apos;occupation
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm bg-kaza-blue" /> Revenus
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm bg-kaza-green" /> Occupation
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <svg viewBox="0 0 720 280" className="min-w-[600px] w-full">
              <defs>
                <linearGradient id="ownerRevBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1976D2" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#1976D2" stopOpacity="0.65" />
                </linearGradient>
              </defs>
              {/* Y-axis gridlines */}
              {[0.25, 0.5, 0.75, 1].map((p) => (
                <line
                  key={p}
                  x1="50"
                  x2="700"
                  y1={40 + 200 * (1 - p)}
                  y2={40 + 200 * (1 - p)}
                  stroke="#E5E7EB"
                  strokeDasharray="4 4"
                />
              ))}
              {/* Y-axis labels — revenu */}
              {[0, 0.25, 0.5, 0.75, 1].map((p) => (
                <text
                  key={p}
                  x="44"
                  y={40 + 200 * (1 - p) + 4}
                  textAnchor="end"
                  className="fill-muted-foreground"
                  fontSize="10"
                >
                  {formatFcfaShort(maxRev * p)}
                </text>
              ))}
              {/* Y-axis labels — occupation (right) */}
              {[0, 25, 50, 75, 100].map((p) => (
                <text
                  key={p}
                  x="708"
                  y={40 + 200 * (1 - p / 100) + 4}
                  textAnchor="start"
                  className="fill-muted-foreground"
                  fontSize="10"
                >
                  {p}%
                </text>
              ))}
              {/* Bars revenu */}
              {data.map((d, i) => {
                const slot = (700 - 50) / data.length;
                const barWidth = slot - 10;
                const barX = 50 + i * slot + 5;
                const barH = (d.revenue / maxRev) * 200;
                return (
                  <g key={d.month}>
                    <rect
                      x={barX}
                      y={40 + (200 - barH)}
                      width={barWidth}
                      height={barH}
                      fill="url(#ownerRevBar)"
                      rx={4}
                    />
                  </g>
                );
              })}
              {/* Line occupancy */}
              <polyline
                fill="none"
                stroke="#4CAF50"
                strokeWidth={2.5}
                points={data
                  .map((d, i) => {
                    const slot = (700 - 50) / data.length;
                    const x = 50 + i * slot + slot / 2;
                    const y = 40 + 200 - (d.occupancy / 100) * 200;
                    return `${x},${y}`;
                  })
                  .join(" ")}
              />
              {data.map((d, i) => {
                const slot = (700 - 50) / data.length;
                const x = 50 + i * slot + slot / 2;
                const y = 40 + 200 - (d.occupancy / 100) * 200;
                return (
                  <circle key={`o-${d.month}`} cx={x} cy={y} r={3.5} fill="#4CAF50" stroke="#fff" strokeWidth={1.5} />
                );
              })}
              {/* X-axis labels */}
              {data.map((d, i) => {
                const slot = (700 - 50) / data.length;
                const x = 50 + i * slot + slot / 2;
                return (
                  <text
                    key={`lbl-${d.month}`}
                    x={x}
                    y={260}
                    textAnchor="middle"
                    className="fill-muted-foreground"
                    fontSize="10"
                  >
                    {d.month.replace(" 25", "").replace(" 26", "")}
                  </text>
                );
              })}
            </svg>
          </div>
        </CardContent>
      </Card>

      {/* GRAPHIQUE 2 + DONUT avis */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Funnel visites */}
        <Card className="rounded-2xl shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading text-lg">
              Funnel de conversion — visites
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Du clic sur l&apos;annonce jusqu&apos;à la signature du contrat
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {funnel.map((step, i) => {
                const width = (step.value / maxFunnel) * 100;
                const conversion =
                  i > 0
                    ? ((step.value / funnel[i - 1].value) * 100).toFixed(1)
                    : null;
                return (
                  <div key={step.stage}>
                    {conversion && (
                      <p className="mb-1 text-xs text-muted-foreground">
                        ↳ {conversion}% des {funnel[i - 1].stage.toLowerCase()}{" "}
                        → {step.stage.toLowerCase()}
                      </p>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="w-40 shrink-0 text-sm font-medium">
                        {step.stage}
                      </div>
                      <div className="relative h-10 flex-1 overflow-hidden rounded-lg bg-slate-100">
                        <div
                          className="flex h-full items-center justify-end rounded-lg px-3 text-sm font-semibold text-white shadow-sm"
                          style={{
                            width: `${width}%`,
                            backgroundColor: step.color,
                          }}
                        >
                          {formatNumber(step.value)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Donut avis */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg">
              Distribution des avis
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatNumber(totalReviews)} avis reçus
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <svg viewBox="0 0 200 200" className="w-48">
                {donutSegments.map((seg, i) => {
                  const cx = 100;
                  const cy = 100;
                  const r = 70;
                  const inner = 45;
                  const startRad = ((seg.startAngle - 90) * Math.PI) / 180;
                  const endRad = ((seg.endAngle - 90) * Math.PI) / 180;
                  const x1 = cx + r * Math.cos(startRad);
                  const y1 = cy + r * Math.sin(startRad);
                  const x2 = cx + r * Math.cos(endRad);
                  const y2 = cy + r * Math.sin(endRad);
                  const xi1 = cx + inner * Math.cos(endRad);
                  const yi1 = cy + inner * Math.sin(endRad);
                  const xi2 = cx + inner * Math.cos(startRad);
                  const yi2 = cy + inner * Math.sin(startRad);
                  const largeArc =
                    seg.endAngle - seg.startAngle > 180 ? 1 : 0;
                  const colors: Record<number, string> = {
                    5: "#4CAF50",
                    4: "#1976D2",
                    3: "#F59E0B",
                    2: "#FB923C",
                    1: "#EF4444",
                  };
                  const d = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${xi1} ${yi1} A ${inner} ${inner} 0 ${largeArc} 0 ${xi2} ${yi2} Z`;
                  return (
                    <path
                      key={i}
                      d={d}
                      fill={colors[seg.rating]}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  );
                })}
                <text
                  x="100"
                  y="95"
                  textAnchor="middle"
                  className="fill-foreground"
                  fontSize="28"
                  fontWeight="700"
                >
                  {avgRating}
                </text>
                <text
                  x="100"
                  y="115"
                  textAnchor="middle"
                  className="fill-muted-foreground"
                  fontSize="11"
                >
                  / 5 étoiles
                </text>
              </svg>
              <div className="mt-4 w-full space-y-1.5">
                {reviews.map((r) => {
                  const pct = ((r.count / donutTotal) * 100).toFixed(0);
                  const colors: Record<number, string> = {
                    5: "bg-kaza-green",
                    4: "bg-kaza-blue",
                    3: "bg-amber-500",
                    2: "bg-orange-500",
                    1: "bg-red-500",
                  };
                  return (
                    <div
                      key={r.rating}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className={`size-2.5 rounded-sm ${colors[r.rating]}`} />
                        <span className="flex">
                          {Array.from({ length: r.rating }).map((_, idx) => (
                            <Star
                              key={idx}
                              className="size-3 fill-amber-400 text-amber-400"
                            />
                          ))}
                        </span>
                      </span>
                      <span className="text-muted-foreground">
                        {r.count} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABLE — Top 5 propriétés */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-heading text-lg">
              Top 5 propriétés du mois
            </CardTitle>
            <p className="mt-1 text-sm capitalize text-muted-foreground">
              Vos biens les plus performants en {currentMonthLabel}
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/owner/analytics">
              Voir analytics <ArrowRight className="ml-1 size-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {topProperties.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Building2 className="size-8 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                Pas encore de statistiques
              </p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Publiez vos biens et recevez vos premières vues, visites et
                paiements : le classement de performance s&apos;affichera ici.
              </p>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 font-medium">Propriété</th>
                  <th className="pb-2 text-right font-medium">Vues</th>
                  <th className="pb-2 text-right font-medium">Contacts</th>
                  <th className="pb-2 text-right font-medium">Visites</th>
                  <th className="pb-2 text-right font-medium">Revenu</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {topProperties.map((p, i) => (
                  <tr key={p.title} className="hover:bg-slate-50/60">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-kaza-navy/10 text-xs font-bold text-kaza-navy">
                          {i + 1}
                        </div>
                        <span className="font-medium">{p.title}</span>
                      </div>
                    </td>
                    <td className="py-3 text-right font-mono text-sm">
                      {formatNumber(p.views)}
                    </td>
                    <td className="py-3 text-right font-mono text-sm">
                      {p.contacts}
                    </td>
                    <td className="py-3 text-right font-mono text-sm">
                      {p.visits}
                    </td>
                    <td className="py-3 text-right font-mono text-sm font-semibold text-kaza-green">
                      {formatFcfa(p.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Prochaines visites (réelles) */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-heading text-lg">
            Prochaines visites
          </CardTitle>
          <Badge className="bg-kaza-blue/10 text-kaza-blue hover:bg-kaza-blue/10">
            {upcomingVisits.length}
          </Badge>
        </CardHeader>
        <CardContent>
          {upcomingVisits.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <CalendarCheck className="size-8 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                Aucune visite programmée
              </p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Les demandes de visite confirmées apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingVisits.map((v) => {
                const dt = new Date(v.proposedDate);
                const dateLabel = dt.toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                });
                const timeLabel = dt.toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <div
                    key={v.id}
                    className="rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-kaza-blue/30 hover:bg-kaza-blue/5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold capitalize text-kaza-navy">
                        {dateLabel}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {timeLabel}
                      </Badge>
                    </div>
                    <p className="mt-1.5 text-sm font-medium">
                      {v.requesterName || "Visiteur"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {v.propertyTitle}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                      <Badge
                        variant="outline"
                        className={
                          v.status === "ACCEPTED"
                            ? "border-emerald-300 text-emerald-700"
                            : "border-amber-300 text-amber-700"
                        }
                      >
                        {v.status === "ACCEPTED" ? "Confirmée" : "En attente"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Raccourcis 6 cards */}
      <div>
        <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">
          Raccourcis
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <ShortcutCard
            href="/owner/properties/new"
            icon={Building2}
            label="Ajouter annonce"
            color="bg-kaza-green"
          />
          <ShortcutCard
            href="/owner/visits"
            icon={CalendarCheck}
            label="Voir visites"
            color="bg-kaza-blue"
          />
          <ShortcutCard
            href="/owner/payments"
            icon={CreditCard}
            label="Paiements"
            color="bg-amber-500"
          />
          <ShortcutCard
            href="/owner/tenants"
            icon={Users}
            label="Locataires"
            color="bg-kaza-navy"
          />
          <ShortcutCard
            href="/owner/analytics"
            icon={TrendingUp}
            label="Analytics"
            color="bg-purple-600"
          />
          <ShortcutCard
            href="/owner/promotion"
            icon={Rocket}
            label="Booster"
            color="bg-pink-600"
          />
        </div>
      </div>

    </div>
  );
}

// =============================================================================
// Sub-component : KPI card avec sparkline
// =============================================================================
function KpiCard({
  label,
  value,
  delta,
  deltaType,
  icon: Icon,
  sparkData,
  sparkColor,
  accent,
}: {
  label: string;
  value: string;
  delta: string;
  deltaType: "positive" | "negative" | "neutral";
  icon: React.ComponentType<{ className?: string }>;
  sparkData: number[];
  sparkColor: string;
  accent: string;
}) {
  const w = 110;
  const h = 36;
  const min = Math.min(...sparkData);
  const max = Math.max(...sparkData);
  const range = max - min || 1;
  const pts = sparkData
    .map((v, i) => {
      const x = (i / (sparkData.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  const areaPts = `0,${h} ${pts} ${w},${h}`;

  const deltaColor =
    deltaType === "positive"
      ? "text-kaza-green"
      : deltaType === "negative"
        ? "text-red-600"
        : "text-muted-foreground";

  return (
    <Card className={`rounded-2xl bg-gradient-to-br ${accent} shadow-sm`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex size-9 items-center justify-center rounded-lg bg-white/70 shadow-sm">
            <Icon className="size-4 text-kaza-navy" />
          </div>
          <svg viewBox={`0 0 ${w} ${h}`} className="h-9 w-24">
            <defs>
              <linearGradient
                id={`spark-${label.replace(/\s/g, "")}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={sparkColor} stopOpacity="0.35" />
                <stop offset="100%" stopColor={sparkColor} stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon
              points={areaPts}
              fill={`url(#spark-${label.replace(/\s/g, "")})`}
            />
            <polyline
              points={pts}
              fill="none"
              stroke={sparkColor}
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="font-heading text-2xl font-bold text-foreground">
          {value}
        </p>
        <p className={`mt-1 text-xs font-medium ${deltaColor}`}>{delta}</p>
      </CardContent>
    </Card>
  );
}

function ShortcutCard({
  href,
  icon: Icon,
  label,
  color,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-kaza-blue/30 hover:shadow-md"
    >
      <div
        className={`flex size-10 items-center justify-center rounded-xl ${color} text-white shadow-sm`}
      >
        <Icon className="size-5" />
      </div>
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <ArrowRight className="ml-auto size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-kaza-blue" />
    </Link>
  );
}

// =============================================================================
// TENANT (inchangé)
// =============================================================================
async function TenantOverview({
  firstName,
  userId,
}: {
  firstName: string;
  userId: string;
}) {
  const [saved, conversations, finance, isVerified] = await settleAll(
    [
      listSavedProperties(userId),
      listTenantMessages(userId),
      getTenantFinanceSummary(userId),
      fetchIsVerified(userId),
    ] as const,
    [
      [] as Awaited<ReturnType<typeof listSavedProperties>>,
      [] as Awaited<ReturnType<typeof listTenantMessages>>,
      EMPTY_FINANCE,
      false,
    ] as const,
  );

  const favs = saved.length;
  const unreadMessages = conversations.reduce(
    (sum, c) => sum + (c.unreadCount ?? 0),
    0,
  );
  const upcomingPayments = finance.activeRentals;
  const upcomingAmount = finance.currentRent;

  return (
    <div className="space-y-6">
      <WelcomeBanner
        firstName={firstName}
        subtitle="Bienvenue dans votre espace locataire."
        roleLabel="Locataire"
        color="blue"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Favoris"
          value={favs}
          icon={Heart}
          subtitle="Biens sauvegardés"
        />
        <StatsCard
          title="Paiements à venir"
          value={upcomingPayments}
          icon={Wallet}
          subtitle={upcomingAmount > 0 ? formatPrice(upcomingAmount) : "Aucun"}
        />
        <StatsCard
          title="Messages non lus"
          value={unreadMessages}
          icon={MessagesSquare}
          subtitle={`${conversations.length} conversation${conversations.length > 1 ? "s" : ""}`}
        />
        <StatsCard
          title="Vérification"
          value={isVerified ? "✓" : "—"}
          icon={ShieldCheck}
          subtitle={isVerified ? "Identité vérifiée" : "Non vérifiée"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Suggestions pour vous</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/search">
                Voir plus <ArrowRight className="ml-1 size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Explorez des annonces correspondant à vos critères, suivez vos
              demandes de visite et finalisez vos paiements directement depuis
              votre tableau de bord.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Raccourcis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ShortcutLink href="/search" icon={Building2} label="Rechercher un bien" />
            <ShortcutLink href="/tenant/saved" icon={Heart} label="Mes favoris" />
            <ShortcutLink href="/tenant/rentals" icon={FileText} label="Mes locations" />
            <ShortcutLink href="/messages" icon={MessagesSquare} label="Messages" />
            <ShortcutLink
              href="/verify-identity"
              icon={ShieldCheck}
              label="Vérifier mon identité"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// =============================================================================
// STUDENT (inchangé)
// =============================================================================
async function StudentOverview({
  firstName,
  userId,
}: {
  firstName: string;
  userId: string;
}) {
  const [colocations, saved, conversations, isVerified] = await settleAll(
    [
      listStudentColocations(userId),
      listSavedProperties(userId),
      listTenantMessages(userId),
      fetchIsVerified(userId),
    ] as const,
    [
      [] as Awaited<ReturnType<typeof listStudentColocations>>,
      [] as Awaited<ReturnType<typeof listSavedProperties>>,
      [] as Awaited<ReturnType<typeof listTenantMessages>>,
      false,
    ] as const,
  );

  const myColocations = colocations.length;
  const favs = saved.length;
  const unreadMessages = conversations.reduce(
    (sum, c) => sum + (c.unreadCount ?? 0),
    0,
  );

  return (
    <div className="space-y-6">
      <WelcomeBanner
        firstName={firstName}
        subtitle="Vivez la colocation en toute simplicité."
        roleLabel="Étudiant"
        color="navy"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Mes colocations"
          value={myColocations}
          icon={Users}
          subtitle={myColocations > 0 ? "Annonces & groupes" : "Aucune pour l'instant"}
        />
        <StatsCard
          title="Favoris"
          value={favs}
          icon={Heart}
          subtitle="Logements sauvegardés"
        />
        <StatsCard
          title="Messages non lus"
          value={unreadMessages}
          icon={MessagesSquare}
          subtitle={`${conversations.length} conversation${conversations.length > 1 ? "s" : ""}`}
        />
        <StatsCard
          title="Vérification"
          value={isVerified ? "✓" : "—"}
          icon={ShieldCheck}
          subtitle={isVerified ? "Identité vérifiée" : "Non vérifiée"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Bienvenue dans la communauté Kaabo Étudiant</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Trouvez votre colocation près de votre campus, choisissez vos
              colocataires en fonction de leur profil et partagez les frais
              automatiquement chaque mois.
            </p>
            <Button asChild className="mt-2 bg-kaza-green hover:bg-kaza-green/90">
              <Link href="/student/roommate-matching">Trouver un colocataire</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Raccourcis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ShortcutLink
              href="/student-living"
              icon={Building2}
              label="Voir les colocations"
            />
            <ShortcutLink
              href="/student/colocations"
              icon={Users}
              label="Mes colocations"
            />
            <ShortcutLink
              href="/student/expenses"
              icon={Wallet}
              label="Frais partagés"
            />
            <ShortcutLink
              href="/student/chat"
              icon={MessagesSquare}
              label="Chat colocataires"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// =============================================================================
// ADMIN (inchangé)
// =============================================================================
async function AdminOverview({ firstName }: { firstName: string }) {
  const stats = await getAdminStats();
  const activeListings = stats.propertiesByStatus?.AVAILABLE ?? 0;

  return (
    <div className="space-y-6">
      <WelcomeBanner
        firstName={firstName}
        subtitle="Tableau de bord administrateur Kaabo."
        roleLabel="Administrateur"
        color="navy"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Utilisateurs"
          value={formatNumber(stats.totalUsers)}
          icon={Users}
          subtitle="Total inscrits"
        />
        <StatsCard
          title="Annonces actives"
          value={formatNumber(activeListings)}
          icon={Building2}
          subtitle="Publiées & disponibles"
        />
        <StatsCard
          title="Revenus 30j"
          value={formatFcfaShort(stats.totalRevenue30d)}
          icon={TrendingUp}
          subtitle="Paiements encaissés"
        />
        <StatsCard
          title="Vérifications en attente"
          value={stats.pendingVerifications}
          icon={ShieldCheck}
          subtitle="À traiter"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Accès rapides admin</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <ShortcutLink href="/admin" icon={TrendingUp} label="Dashboard admin" />
          <ShortcutLink
            href="/admin/properties"
            icon={Building2}
            label="Modération annonces"
          />
          <ShortcutLink href="/admin/users" icon={Users} label="Utilisateurs" />
          <ShortcutLink
            href="/admin/verifications"
            icon={ShieldCheck}
            label="Vérifications"
          />
          <ShortcutLink href="/admin/disputes" icon={FileText} label="Litiges" />
          <ShortcutLink href="/admin/settings" icon={Sparkles} label="Paramètres" />
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// Sub-components (legacy)
// =============================================================================
function WelcomeBanner({
  firstName,
  subtitle,
  roleLabel,
  color,
}: {
  firstName: string;
  subtitle: string;
  roleLabel: string;
  color: "navy" | "blue" | "green";
}) {
  const bg =
    color === "green"
      ? "from-kaza-green/10 to-emerald-50"
      : color === "blue"
        ? "from-kaza-blue/10 to-blue-50"
        : "from-kaza-navy/10 to-slate-50";
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${bg} p-6 sm:p-8`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Badge className="mb-2 bg-white text-kaza-navy hover:bg-white">
            {roleLabel}
          </Badge>
          <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
            Bonjour {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function ShortcutLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-lg border border-transparent p-3 transition-all hover:border-kaza-blue/30 hover:bg-kaza-blue/5"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-kaza-blue/10 text-kaza-blue transition-colors group-hover:bg-kaza-blue group-hover:text-white">
        <Icon className="size-4" />
      </div>
      <span className="text-sm font-medium">{label}</span>
      <ArrowRight className="ml-auto size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}
