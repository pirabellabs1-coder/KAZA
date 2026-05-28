import type { Metadata } from "next";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Award,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Calendar,
  Home,
  ShieldCheck,
  FileSignature,
  UserCheck,
  Sparkles,
  ArrowRight,
  Lock,
  CreditCard,
  ChevronRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TENANT_PAYMENT_HISTORY,
  TENANT_EXPENSES_BREAKDOWN,
  TENANT_SAVINGS,
  formatFcfa,
  formatFcfaShort,
} from "@/lib/mock/admin-data";

export const metadata: Metadata = {
  title: "Mes analyses · KAZA",
  description:
    "Tableau de bord analytique du locataire : budget, paiements, économies et profil.",
};

// =============================================================================
// Données dérivées (calculs en mémoire)
// =============================================================================

const totalPaid12Months = TENANT_PAYMENT_HISTORY.reduce(
  (sum, m) => sum + m.paid,
  0
);
const currentRent = TENANT_PAYMENT_HISTORY[TENANT_PAYMENT_HISTORY.length - 1].paid;
const previousRent = TENANT_PAYMENT_HISTORY[0].paid;
const rentEvolution = ((currentRent - previousRent) / previousRent) * 100;
const totalExpenses = TENANT_EXPENSES_BREAKDOWN.reduce(
  (sum, e) => sum + e.amount,
  0
);

const NEIGHBORHOOD_COMPARISON = [
  { category: "Loyer", you: 380_000, average: 425_000 },
  { category: "Charges", you: 45_000, average: 52_000 },
  { category: "Électricité", you: 28_000, average: 34_000 },
  { category: "Internet", you: 18_000, average: 22_000 },
];

const RECENT_PAYMENTS = [
  { date: "1 Mai 2026", amount: 380_000, status: "Payé", method: "Mobile Money" },
  { date: "1 Avr. 2026", amount: 380_000, status: "Payé", method: "Carte" },
  { date: "1 Mars 2026", amount: 380_000, status: "Payé", method: "Mobile Money" },
  { date: "1 Févr. 2026", amount: 380_000, status: "Payé", method: "Mobile Money" },
  { date: "1 Janv. 2026", amount: 380_000, status: "Payé", method: "Virement" },
  { date: "1 Déc. 2025", amount: 380_000, status: "Payé", method: "Mobile Money" },
];

const SAVINGS_BREAKDOWN = [
  { label: "Commissions évitées (agences)", value: 320_000, color: "#1976D2" },
  { label: "Frais d'agence économisés", value: 145_000, color: "#4CAF50" },
  { label: "Dépôt sécurisé en escrow", value: 75_000, color: "#F59E0B" },
];

const PROFILE_CRITERIA = [
  { label: "Identité vérifiée", done: true },
  { label: "Paiements à temps (12/12)", done: true },
  { label: "Avis propriétaires 5★", done: true },
  { label: "Garant certifié", done: false },
];

const SAVINGS_TIPS = [
  {
    title: "Négocier en mai",
    description:
      "Les loyers baissent en moyenne de 5% en mai. Approchez votre propriétaire.",
    icon: TrendingDown,
    color: "from-emerald-50 to-emerald-100/50",
    iconColor: "text-emerald-600",
  },
  {
    title: "Payer trimestriel",
    description:
      "Économisez 3% en groupant 3 mois. Demandez à votre bailleur.",
    icon: PiggyBank,
    color: "from-blue-50 to-blue-100/50",
    iconColor: "text-blue-600",
  },
  {
    title: "Parrainer un ami",
    description:
      "1 parrainage = 5 000 pts soit 2 500 FCFA crédités sur votre wallet.",
    icon: Sparkles,
    color: "from-amber-50 to-amber-100/50",
    iconColor: "text-amber-600",
  },
  {
    title: "Optimiser l'électricité",
    description:
      "Climatiseur Inverter = -40% conso. ROI en 8 mois sur Cadjèhoun.",
    icon: Lightbulb,
    color: "from-violet-50 to-violet-100/50",
    iconColor: "text-violet-600",
  },
];

const TENANT_JOURNEY = [
  { label: "Inscription", date: "Mai 2025", icon: UserCheck, done: true },
  { label: "Vérification ID", date: "Mai 2025", icon: ShieldCheck, done: true },
  { label: "1er bien visité", date: "Juin 2025", icon: Home, done: true },
  { label: "Contrat signé", date: "Juin 2025", icon: FileSignature, done: true },
  { label: "Renouvellement", date: "Juin 2026", icon: Calendar, done: false },
];

const RECOMMENDED_PROPERTIES = [
  {
    title: "T3 lumineux Cocotiers",
    price: 320_000,
    saving: 60_000,
    rooms: "3 chambres · 85 m²",
  },
  {
    title: "Studio meublé Ganhi",
    price: 195_000,
    saving: 185_000,
    rooms: "Studio · 32 m²",
  },
  {
    title: "T2 Cadjèhoun rénové",
    price: 285_000,
    saving: 95_000,
    rooms: "2 chambres · 65 m²",
  },
];

// =============================================================================
// COMPOSANTS — Graphiques SVG
// =============================================================================

function PaymentBarChart() {
  const max = Math.max(...TENANT_PAYMENT_HISTORY.map((d) => d.paid));
  const chartHeight = 220;
  const chartWidth = 720;
  const barWidth = chartWidth / TENANT_PAYMENT_HISTORY.length - 12;

  return (
    <svg
      viewBox={`0 0 ${chartWidth} ${chartHeight + 50}`}
      className="h-64 w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Gridlines */}
      {[0.25, 0.5, 0.75, 1].map((ratio) => (
        <line
          key={ratio}
          x1="0"
          y1={chartHeight - chartHeight * ratio + 10}
          x2={chartWidth}
          y2={chartHeight - chartHeight * ratio + 10}
          stroke="#F3F4F6"
          strokeWidth="1"
        />
      ))}

      {TENANT_PAYMENT_HISTORY.map((d, i) => {
        const h = (d.paid / max) * chartHeight;
        const x = i * (chartWidth / TENANT_PAYMENT_HISTORY.length) + 6;
        const y = chartHeight - h + 10;
        const isCurrent = d.paid === currentRent && i >= 6;
        return (
          <g key={d.month}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={h}
              fill={isCurrent ? "#1976D2" : "#90CAF9"}
              rx="4"
            />
            <text
              x={x + barWidth / 2}
              y={chartHeight + 30}
              textAnchor="middle"
              fontSize="11"
              fill="#6B7280"
              fontWeight="500"
            >
              {d.month}
            </text>
            <text
              x={x + barWidth / 2}
              y={y - 6}
              textAnchor="middle"
              fontSize="10"
              fill="#1A3A52"
              fontWeight="600"
            >
              {formatFcfaShort(d.paid)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function ExpensesDonut() {
  const radius = 75;
  const innerRadius = 50;
  const cx = 110;
  const cy = 110;
  let cumulative = 0;

  const arcs = TENANT_EXPENSES_BREAKDOWN.map((e) => {
    const value = e.amount / totalExpenses;
    const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    cumulative += value;
    const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;

    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);
    const xi1 = cx + innerRadius * Math.cos(endAngle);
    const yi1 = cy + innerRadius * Math.sin(endAngle);
    const xi2 = cx + innerRadius * Math.cos(startAngle);
    const yi2 = cy + innerRadius * Math.sin(startAngle);
    const largeArc = value > 0.5 ? 1 : 0;

    return {
      color: e.color,
      d: `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${xi1} ${yi1} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${xi2} ${yi2} Z`,
    };
  });

  return (
    <svg viewBox="0 0 220 220" className="h-56 w-56">
      {arcs.map((a, i) => (
        <path key={i} d={a.d} fill={a.color} />
      ))}
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        fontSize="11"
        fill="#6B7280"
      >
        Total mensuel
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        fontSize="16"
        fontWeight="700"
        fill="#1A3A52"
      >
        {formatFcfaShort(totalExpenses)}
      </text>
    </svg>
  );
}

function NeighborhoodComparison() {
  const max = Math.max(
    ...NEIGHBORHOOD_COMPARISON.flatMap((c) => [c.you, c.average])
  );
  return (
    <div className="space-y-5">
      {NEIGHBORHOOD_COMPARISON.map((c) => {
        const youW = (c.you / max) * 100;
        const avgW = (c.average / max) * 100;
        const diff = ((c.you - c.average) / c.average) * 100;
        return (
          <div key={c.category}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-kaza-navy">
                {c.category}
              </span>
              <span
                className={`text-xs font-bold ${
                  diff < 0 ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {diff < 0 ? "−" : "+"}
                {Math.abs(diff).toFixed(0)}% vs quartier
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-14 text-xs font-medium text-muted-foreground">
                  Vous
                </span>
                <div className="relative h-5 flex-1 rounded-full bg-muted">
                  <div
                    className="h-5 rounded-full bg-gradient-to-r from-kaza-blue to-kaza-navy"
                    style={{ width: `${youW}%` }}
                  />
                </div>
                <span className="w-20 text-right text-xs font-bold text-kaza-navy">
                  {formatFcfaShort(c.you)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-14 text-xs text-muted-foreground">
                  Cadjèhoun
                </span>
                <div className="relative h-5 flex-1 rounded-full bg-muted">
                  <div
                    className="h-5 rounded-full bg-gradient-to-r from-slate-300 to-slate-400"
                    style={{ width: `${avgW}%` }}
                  />
                </div>
                <span className="w-20 text-right text-xs text-muted-foreground">
                  {formatFcfaShort(c.average)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ScoreCircle({ score }: { score: number }) {
  const radius = 60;
  const c = 2 * Math.PI * radius;
  const offset = c - (score / 100) * c;
  return (
    <svg viewBox="0 0 150 150" className="h-32 w-32">
      <circle
        cx="75"
        cy="75"
        r={radius}
        stroke="#E5E7EB"
        strokeWidth="12"
        fill="none"
      />
      <circle
        cx="75"
        cy="75"
        r={radius}
        stroke="#4CAF50"
        strokeWidth="12"
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 75 75)"
      />
      <text
        x="75"
        y="72"
        textAnchor="middle"
        fontSize="28"
        fontWeight="700"
        fill="#1A3A52"
      >
        {score}
      </text>
      <text
        x="75"
        y="92"
        textAnchor="middle"
        fontSize="11"
        fill="#6B7280"
      >
        /100
      </text>
    </svg>
  );
}

// =============================================================================
// PAGE
// =============================================================================

export default function TenantAnalyticsPage() {
  return (
    <div className="space-y-8">
      {/* HEADER */}
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="size-3.5" />
          <span>Espace privé locataire</span>
        </div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-kaza-navy md:text-4xl">
          Mon tableau de bord locataire
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          Suivez votre budget, vos paiements et vos économies réalisées grâce à
          KAZA en toute transparence.
        </p>
      </header>

      {/* KPI CARDS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-none bg-gradient-to-br from-kaza-navy to-[#0F2336] text-white shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-white/80">
                Total payé 12 mois
              </CardDescription>
              <Wallet className="size-4 text-white/70" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="font-heading text-2xl font-bold">
              {formatFcfa(totalPaid12Months)}
            </p>
            <svg viewBox="0 0 100 30" className="h-8 w-full">
              <polyline
                fill="none"
                stroke="#4CAF50"
                strokeWidth="2"
                points={TENANT_PAYMENT_HISTORY.map((d, i) => {
                  const max = Math.max(
                    ...TENANT_PAYMENT_HISTORY.map((m) => m.paid)
                  );
                  const x = (i / (TENANT_PAYMENT_HISTORY.length - 1)) * 100;
                  const y = 28 - (d.paid / max) * 24;
                  return `${x},${y}`;
                }).join(" ")}
              />
            </svg>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Loyer mensuel actuel</CardDescription>
              <Home className="size-4 text-kaza-blue" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="font-heading text-2xl font-bold text-kaza-navy">
              {formatFcfa(currentRent)}
            </p>
            <Badge
              variant="secondary"
              className="bg-amber-50 text-amber-700 hover:bg-amber-50"
            >
              <TrendingUp className="mr-1 size-3" />+
              {rentEvolution.toFixed(1)}% vs 12 mois
            </Badge>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Économies vs agences</CardDescription>
              <PiggyBank className="size-4 text-kaza-green" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="font-heading text-2xl font-bold text-kaza-green">
              {formatFcfa(TENANT_SAVINGS[0].value)}
            </p>
            <Badge
              variant="secondary"
              className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
            >
              <TrendingUp className="mr-1 size-3" />
              +12% trimestre
            </Badge>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Score locataire</CardDescription>
              <Award className="size-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="font-heading text-2xl font-bold text-kaza-navy">
              92<span className="text-base text-muted-foreground">/100</span>
            </p>
            <Badge className="bg-kaza-green/10 text-kaza-green hover:bg-kaza-green/10">
              Excellent
            </Badge>
          </CardContent>
        </Card>
      </section>

      {/* GRAPHIQUE 1 — Historique paiements */}
      <Card className="rounded-2xl border-none shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="font-heading text-kaza-navy">
                Historique de mes paiements
              </CardTitle>
              <CardDescription>
                12 derniers mois — augmentation après renouvellement en
                décembre 2025
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-kaza-blue/30 text-kaza-blue">
              {formatFcfa(totalPaid12Months)} total
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <PaymentBarChart />
        </CardContent>
      </Card>

      {/* GRAPHIQUE 2 + 3 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-none shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-kaza-navy">
              Dépenses ce mois
            </CardTitle>
            <CardDescription>Répartition par catégorie</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-6 lg:flex-row">
              <ExpensesDonut />
              <ul className="flex-1 space-y-3">
                {TENANT_EXPENSES_BREAKDOWN.map((e) => {
                  const pct = (e.amount / totalExpenses) * 100;
                  return (
                    <li key={e.category} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span
                            className="size-3 rounded-full"
                            style={{ backgroundColor: e.color }}
                          />
                          <span className="font-medium text-kaza-navy">
                            {e.category}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-muted-foreground">
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                      <div className="ml-5 text-xs text-muted-foreground">
                        {formatFcfa(e.amount)}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-kaza-navy">
              Comparaison quartier Cadjèhoun
            </CardTitle>
            <CardDescription>
              Vos coûts vs moyenne des locataires du même quartier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NeighborhoodComparison />
          </CardContent>
        </Card>
      </div>

      {/* TIMELINE PAIEMENTS RÉCENTS + ÉCONOMIES */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl border-none shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading text-kaza-navy">
              Mes paiements récents
            </CardTitle>
            <CardDescription>6 dernières transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {RECENT_PAYMENTS.map((p) => (
                <li
                  key={p.date}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-muted/30 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100">
                      <CheckCircle2 className="size-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-kaza-navy">
                        {p.date}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.method}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-kaza-navy">
                      {formatFcfa(p.amount)}
                    </p>
                    <Badge className="mt-0.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                      {p.status}
                    </Badge>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <PiggyBank className="size-5 text-kaza-green" />
              <CardTitle className="font-heading text-kaza-navy">
                Mes économies
              </CardTitle>
            </div>
            <CardDescription>Réalisées grâce à KAZA</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="font-heading text-4xl font-bold text-kaza-green">
                {formatFcfa(540_000)}
              </p>
              <p className="text-xs text-muted-foreground">Sur 12 mois</p>
            </div>
            <div className="space-y-3">
              {SAVINGS_BREAKDOWN.map((s) => {
                const pct = (s.value / 540_000) * 100;
                return (
                  <div key={s.label}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{s.label}</span>
                      <span className="font-bold text-kaza-navy">
                        {formatFcfaShort(s.value)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white">
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: s.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PROFIL + CONSEILS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl border-none shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-kaza-navy">
              Mon profil locataire
            </CardTitle>
            <CardDescription>Confiance auprès des propriétaires</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <ScoreCircle score={92} />
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                Excellent
              </Badge>
              <ul className="w-full space-y-2">
                {PROFILE_CRITERIA.map((c) => (
                  <li
                    key={c.label}
                    className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm"
                  >
                    <span className="text-kaza-navy">{c.label}</span>
                    {c.done ? (
                      <CheckCircle2 className="size-4 text-emerald-600" />
                    ) : (
                      <XCircle className="size-4 text-amber-500" />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading text-kaza-navy">
              Conseils pour économiser
            </CardTitle>
            <CardDescription>
              4 astuces personnalisées selon votre profil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {SAVINGS_TIPS.map((t) => (
                <div
                  key={t.title}
                  className={`rounded-xl bg-gradient-to-br ${t.color} p-4`}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-full bg-white shadow-sm">
                      <t.icon className={`size-4 ${t.iconColor}`} />
                    </div>
                    <p className="text-sm font-bold text-kaza-navy">
                      {t.title}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PARCOURS TIMELINE */}
      <Card className="rounded-2xl border-none shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-kaza-navy">
            Mon parcours sur KAZA
          </CardTitle>
          <CardDescription>De l&apos;inscription au renouvellement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute left-0 right-0 top-5 h-0.5 bg-gradient-to-r from-kaza-green via-kaza-blue to-muted" />
            <ol className="relative grid grid-cols-2 gap-4 md:grid-cols-5">
              {TENANT_JOURNEY.map((j) => (
                <li
                  key={j.label}
                  className="flex flex-col items-center text-center"
                >
                  <div
                    className={`relative z-10 flex size-10 items-center justify-center rounded-full border-4 border-white shadow-md ${
                      j.done
                        ? "bg-kaza-green text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <j.icon className="size-4" />
                  </div>
                  <p className="mt-2 text-sm font-semibold text-kaza-navy">
                    {j.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{j.date}</p>
                </li>
              ))}
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* RECOMMANDATIONS */}
      <Card className="rounded-2xl border-none bg-gradient-to-br from-kaza-blue/5 to-white shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="font-heading text-kaza-navy">
                Si vous déménagez bientôt
              </CardTitle>
              <CardDescription>
                3 biens similaires moins chers à Cocotiers, sélectionnés pour vous
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/properties">
                Voir toutes les annonces
                <ChevronRight className="ml-1 size-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {RECOMMENDED_PROPERTIES.map((p) => (
              <div
                key={p.title}
                className="rounded-xl border border-border/50 bg-white p-4 transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex h-24 items-center justify-center rounded-lg bg-gradient-to-br from-kaza-navy/10 to-kaza-blue/10">
                  <Home className="size-8 text-kaza-blue" />
                </div>
                <p className="text-sm font-bold text-kaza-navy">{p.title}</p>
                <p className="text-xs text-muted-foreground">{p.rooms}</p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="font-heading text-lg font-bold text-kaza-navy">
                    {formatFcfaShort(p.price)} FCFA
                  </p>
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                    −{formatFcfaShort(p.saving)}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2 w-full text-kaza-blue hover:text-kaza-blue/80"
                >
                  Voir le bien
                  <ArrowRight className="ml-1 size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FOOTER */}
      <footer className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border/40 bg-muted/30 px-6 py-5 text-center text-xs text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-1.5">
          <Lock className="size-3.5" />
          <span>Données privées — vous seul y avez accès</span>
        </div>
        <span className="hidden sm:inline">·</span>
        <div className="flex items-center gap-1.5">
          <CreditCard className="size-3.5" />
          <span>Mise à jour temps réel</span>
        </div>
      </footer>
    </div>
  );
}
