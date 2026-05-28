import type { Metadata } from "next";
import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  Users,
  Award,
  Lightbulb,
  Calendar,
  ChefHat,
  Bus,
  Tv,
  ShoppingBasket,
  GraduationCap,
  PiggyBank,
  Target,
  Sparkles,
  ArrowRight,
  Lock,
  CheckCircle2,
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
  STUDENT_MONTHLY_EXPENSES,
  STUDENT_ROOMMATE_COMPATIBILITY,
  STUDENT_BUDGET_TRACKING,
  formatFcfa,
  formatFcfaShort,
} from "@/lib/mock/admin-data";

export const metadata: Metadata = {
  title: "Mes analyses · KAZA",
  description:
    "Tableau de bord étudiant : budget, colocation et vie pratique.",
};

// =============================================================================
// DATA DÉRIVÉE
// =============================================================================

const budgetPct =
  (STUDENT_BUDGET_TRACKING.spent / STUDENT_BUDGET_TRACKING.monthlyBudget) *
  100;
const lastMonth = STUDENT_MONTHLY_EXPENSES[STUDENT_MONTHLY_EXPENSES.length - 1];
const lastMonthCategories = [
  { category: "Loyer", amount: lastMonth.rent, color: "#1A3A52" },
  { category: "Alimentation", amount: lastMonth.food, color: "#1976D2" },
  { category: "Transport", amount: lastMonth.transport, color: "#4CAF50" },
  { category: "Autres", amount: lastMonth.other, color: "#F59E0B" },
];
const lastMonthTotal = lastMonthCategories.reduce(
  (sum, c) => sum + c.amount,
  0
);
const avgCompatibility = Math.round(
  STUDENT_ROOMMATE_COMPATIBILITY.reduce((s, r) => s + r.compatibility, 0) /
    STUDENT_ROOMMATE_COMPATIBILITY.length
);

const BUDGET_TIPS = [
  {
    title: "Cuisiner soi-même",
    description: "Préparer ses repas réduit le poste food de 30% en moyenne.",
    icon: ChefHat,
    bg: "from-blue-50 to-blue-100/40",
    iconColor: "text-kaza-blue",
  },
  {
    title: "Carte étudiante SOTRA",
    description: "−50% sur les bus avec votre carte UAC ou EPAC valide.",
    icon: Bus,
    bg: "from-emerald-50 to-emerald-100/40",
    iconColor: "text-emerald-600",
  },
  {
    title: "Partager Netflix",
    description:
      "Split à 4 entre colocs = 1 500 FCFA chacun au lieu de 6 000.",
    icon: Tv,
    bg: "from-violet-50 to-violet-100/40",
    iconColor: "text-violet-600",
  },
  {
    title: "Marché Dantokpa",
    description:
      "Faire ses courses au grand marché = −40% vs supermarchés.",
    icon: ShoppingBasket,
    bg: "from-amber-50 to-amber-100/40",
    iconColor: "text-amber-600",
  },
];

const UPCOMING_EVENTS = [
  {
    date: "28 Mai",
    title: "Examens partiels UAC",
    type: "Études",
    color: "bg-violet-100 text-violet-700",
  },
  {
    date: "1 Juin",
    title: "Loyer dû (part 75 000 FCFA)",
    type: "Paiement",
    color: "bg-amber-100 text-amber-700",
  },
  {
    date: "3 Juin",
    title: "Visite coloc candidat Koffi",
    type: "Coloc",
    color: "bg-blue-100 text-blue-700",
  },
  {
    date: "5 Juin",
    title: "Match coloc nouveau profil",
    type: "Matching",
    color: "bg-pink-100 text-pink-700",
  },
  {
    date: "10 Juin",
    title: "Rendez-vous notaire (bail)",
    type: "Admin",
    color: "bg-slate-100 text-slate-700",
  },
];

const OBJECTIVES = [
  {
    label: "Économiser 50k avant rentrée",
    current: 32,
    target: 50,
    unit: "k FCFA",
    color: "#4CAF50",
  },
  {
    label: "Maintenir budget 8/8 mois",
    current: 8,
    target: 8,
    unit: "mois",
    color: "#1976D2",
  },
  {
    label: "Trouver un coloc avant juin",
    current: 3,
    target: 4,
    unit: "candidats",
    color: "#F59E0B",
  },
];

const COMMUNITY_STATS = [
  { label: "Étudiants actifs", value: "1 240", icon: GraduationCap },
  { label: "Colocations en cours", value: "380", icon: Users },
  { label: "Satisfaction", value: "92%", icon: Sparkles },
];

// Calendrier : génération heatmap dépenses (mai 2026)
const CALENDAR_DAYS = Array.from({ length: 31 }, (_, i) => {
  const day = i + 1;
  // intensité pseudo-aléatoire mais déterministe selon jour
  const spend = Math.floor((Math.sin(day * 1.7) + 1) * 5_000);
  return { day, spend };
});

// =============================================================================
// COMPOSANTS — Graphiques SVG
// =============================================================================

function StackedBarChart() {
  const chartWidth = 600;
  const chartHeight = 240;
  const padding = 20;
  const drawableHeight = chartHeight - padding * 2;

  const max = Math.max(
    ...STUDENT_MONTHLY_EXPENSES.map(
      (m) => m.food + m.rent + m.transport + m.other
    )
  );
  const barWidth = chartWidth / STUDENT_MONTHLY_EXPENSES.length - 24;
  const categories = [
    { key: "rent" as const, color: "#1A3A52", label: "Loyer" },
    { key: "food" as const, color: "#1976D2", label: "Alimentation" },
    { key: "transport" as const, color: "#4CAF50", label: "Transport" },
    { key: "other" as const, color: "#F59E0B", label: "Autres" },
  ];

  return (
    <div className="space-y-4">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight + 30}`}
        className="h-64 w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {[0.25, 0.5, 0.75, 1].map((r) => (
          <line
            key={r}
            x1="0"
            y1={chartHeight - drawableHeight * r - padding}
            x2={chartWidth}
            y2={chartHeight - drawableHeight * r - padding}
            stroke="#F3F4F6"
            strokeWidth="1"
          />
        ))}

        {STUDENT_MONTHLY_EXPENSES.map((d, i) => {
          const x =
            i * (chartWidth / STUDENT_MONTHLY_EXPENSES.length) + 12;
          let cumul = 0;
          return (
            <g key={d.month}>
              {categories.map((cat) => {
                const h = (d[cat.key] / max) * drawableHeight;
                const y = chartHeight - padding - h - cumul;
                cumul += h;
                return (
                  <rect
                    key={cat.key}
                    x={x}
                    y={y}
                    width={barWidth}
                    height={h}
                    fill={cat.color}
                    rx="2"
                  />
                );
              })}
              <text
                x={x + barWidth / 2}
                y={chartHeight + 15}
                textAnchor="middle"
                fontSize="11"
                fontWeight="500"
                fill="#6B7280"
              >
                {d.month}
              </text>
            </g>
          );
        })}
      </svg>
      <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        {categories.map((c) => (
          <li key={c.key} className="flex items-center gap-2 text-xs">
            <span
              className="size-3 rounded"
              style={{ backgroundColor: c.color }}
            />
            <span className="font-medium text-kaza-navy">{c.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExpensesDonut() {
  const radius = 75;
  const innerRadius = 50;
  const cx = 110;
  const cy = 110;
  let cumulative = 0;

  const arcs = lastMonthCategories.map((e) => {
    const value = e.amount / lastMonthTotal;
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
        Ce mois
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        fontSize="16"
        fontWeight="700"
        fill="#1A3A52"
      >
        {formatFcfaShort(lastMonthTotal)}
      </text>
    </svg>
  );
}

function CircleProgress({
  percent,
  color,
  size = 150,
  label,
  sublabel,
}: {
  percent: number;
  color: string;
  size?: number;
  label: string;
  sublabel: string;
}) {
  const radius = 60;
  const c = 2 * Math.PI * radius;
  const offset = c - (Math.min(percent, 100) / 100) * c;
  return (
    <svg
      viewBox="0 0 150 150"
      style={{ width: size, height: size }}
      className="shrink-0"
    >
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
        stroke={color}
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
        fontSize="24"
        fontWeight="700"
        fill="#1A3A52"
      >
        {label}
      </text>
      <text
        x="75"
        y="92"
        textAnchor="middle"
        fontSize="11"
        fill="#6B7280"
      >
        {sublabel}
      </text>
    </svg>
  );
}

function SmallCircle({ percent, color }: { percent: number; color: string }) {
  const radius = 30;
  const c = 2 * Math.PI * radius;
  const offset = c - (percent / 100) * c;
  return (
    <svg viewBox="0 0 80 80" className="size-16">
      <circle
        cx="40"
        cy="40"
        r={radius}
        stroke="#E5E7EB"
        strokeWidth="7"
        fill="none"
      />
      <circle
        cx="40"
        cy="40"
        r={radius}
        stroke={color}
        strokeWidth="7"
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 40 40)"
      />
      <text
        x="40"
        y="44"
        textAnchor="middle"
        fontSize="16"
        fontWeight="700"
        fill="#1A3A52"
      >
        {percent}
      </text>
    </svg>
  );
}

// =============================================================================
// PAGE
// =============================================================================

export default function StudentAnalyticsPage() {
  const budgetColor =
    budgetPct < 80
      ? "#4CAF50"
      : budgetPct < 95
      ? "#F59E0B"
      : "#EF4444";

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <GraduationCap className="size-3.5" />
          <span>Espace étudiant KAZA</span>
        </div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-kaza-navy md:text-4xl">
          Mon tableau de bord étudiant
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          Suivez votre budget, votre vie en colocation et vos prochains
          événements en un coup d&apos;œil.
        </p>
      </header>

      {/* KPI CARDS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-none bg-gradient-to-br from-kaza-navy to-[#0F2336] text-white shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-white/80">
                Budget mensuel restant
              </CardDescription>
              <Wallet className="size-4 text-white/70" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-2xl font-bold">
              {formatFcfaShort(STUDENT_BUDGET_TRACKING.remaining)} FCFA
            </p>
            <p className="mt-1 text-xs text-white/70">
              sur {formatFcfaShort(STUDENT_BUDGET_TRACKING.monthlyBudget)} FCFA
            </p>
            <div className="mt-3 h-1.5 rounded-full bg-white/20">
              <div
                className="h-1.5 rounded-full bg-kaza-green"
                style={{
                  width: `${(STUDENT_BUDGET_TRACKING.remaining / STUDENT_BUDGET_TRACKING.monthlyBudget) * 100}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Dépenses moy. / jour</CardDescription>
              <TrendingUp className="size-4 text-kaza-blue" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-2xl font-bold text-kaza-navy">
              {formatFcfa(STUDENT_BUDGET_TRACKING.averageDaily)}
            </p>
            <Badge className="mt-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
              À l&apos;équilibre
            </Badge>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Compatibilité colocs</CardDescription>
              <Users className="size-4 text-kaza-green" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-2xl font-bold text-kaza-navy">
              {avgCompatibility}%
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {STUDENT_ROOMMATE_COMPATIBILITY.length} propositions
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Score profil coloc</CardDescription>
              <Award className="size-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-2xl font-bold text-kaza-navy">
              88<span className="text-base text-muted-foreground">/100</span>
            </p>
            <Badge className="mt-1 bg-kaza-blue/10 text-kaza-blue hover:bg-kaza-blue/10">
              Très bon
            </Badge>
          </CardContent>
        </Card>
      </section>

      {/* GRAPHIQUE 1 — Stacked bar 5 mois */}
      <Card className="rounded-2xl border-none shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-kaza-navy">
            Mes dépenses par catégorie
          </CardTitle>
          <CardDescription>5 derniers mois — vue empilée</CardDescription>
        </CardHeader>
        <CardContent>
          <StackedBarChart />
        </CardContent>
      </Card>

      {/* BUDGET + DONUT */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl border-none bg-gradient-to-br from-white via-blue-50/40 to-white shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-kaza-navy">
              Budget en cours
            </CardTitle>
            <CardDescription>Mai 2026</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <CircleProgress
                percent={budgetPct}
                color={budgetColor}
                label={`${Math.round(budgetPct)}%`}
                sublabel="dépensé"
              />
              <div className="text-center">
                <p className="font-heading text-2xl font-bold text-kaza-navy">
                  {formatFcfaShort(STUDENT_BUDGET_TRACKING.spent)} /{" "}
                  {formatFcfaShort(STUDENT_BUDGET_TRACKING.monthlyBudget)} FCFA
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {STUDENT_BUDGET_TRACKING.daysLeft} jours restants ·
                  Projection :{" "}
                  <span className="font-semibold text-emerald-600">
                    {STUDENT_BUDGET_TRACKING.projectedEnd}
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading text-kaza-navy">
              Répartition de ce mois
            </CardTitle>
            <CardDescription>
              Détail par catégorie sur le mois en cours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-6 lg:flex-row">
              <ExpensesDonut />
              <ul className="flex-1 space-y-3">
                {lastMonthCategories.map((c) => {
                  const pct = (c.amount / lastMonthTotal) * 100;
                  return (
                    <li key={c.category} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span
                            className="size-3 rounded-full"
                            style={{ backgroundColor: c.color }}
                          />
                          <span className="font-medium text-kaza-navy">
                            {c.category}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-muted-foreground">
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                      <div className="ml-5 text-xs text-muted-foreground">
                        {formatFcfa(c.amount)}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TOP COLOCS */}
      <Card className="rounded-2xl border-none shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="font-heading text-kaza-navy">
                Top colocataires compatibles
              </CardTitle>
              <CardDescription>
                Classement selon votre profil et vos habitudes
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/student/roommate-matching">
                Voir tous
                <ArrowRight className="ml-1 size-3.5" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STUDENT_ROOMMATE_COMPATIBILITY.map((r) => {
              const initials = r.name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .toUpperCase();
              return (
                <div
                  key={r.name}
                  className="flex flex-col items-center gap-3 rounded-xl border border-border/50 bg-white p-4 text-center transition-shadow hover:shadow-md"
                >
                  <div className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-kaza-blue to-kaza-navy text-base font-bold text-white">
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-kaza-navy">
                      {r.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.age} ans · {r.university}
                    </p>
                  </div>
                  <SmallCircle
                    percent={r.compatibility}
                    color={
                      r.compatibility >= 90
                        ? "#4CAF50"
                        : r.compatibility >= 80
                        ? "#1976D2"
                        : "#F59E0B"
                    }
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                  >
                    Voir profil
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* CONSEILS BUDGET */}
      <Card className="rounded-2xl border-none shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="size-5 text-amber-500" />
            <CardTitle className="font-heading text-kaza-navy">
              Conseils budget étudiant
            </CardTitle>
          </div>
          <CardDescription>
            4 astuces locales pour vivre mieux à Cotonou
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {BUDGET_TIPS.map((t) => (
              <div
                key={t.title}
                className={`rounded-xl bg-gradient-to-br ${t.bg} p-4`}
              >
                <div className="mb-3 flex size-9 items-center justify-center rounded-full bg-white shadow-sm">
                  <t.icon className={`size-4 ${t.iconColor}`} />
                </div>
                <p className="text-sm font-bold text-kaza-navy">{t.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* TIMELINE + CAGNOTTE */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl border-none shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading text-kaza-navy">
              Mes prochains événements
            </CardTitle>
            <CardDescription>5 événements à venir</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {UPCOMING_EVENTS.map((e) => (
                <li
                  key={e.title}
                  className="flex items-center gap-4 rounded-xl border border-border/50 bg-muted/30 px-4 py-3"
                >
                  <div className="flex size-12 flex-col items-center justify-center rounded-lg bg-kaza-navy text-white">
                    <span className="text-[10px] font-medium uppercase">
                      {e.date.split(" ")[1]}
                    </span>
                    <span className="font-heading text-base font-bold leading-none">
                      {e.date.split(" ")[0]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-kaza-navy">
                      {e.title}
                    </p>
                    <Badge
                      variant="secondary"
                      className={`mt-1 ${e.color} border-none`}
                    >
                      {e.type}
                    </Badge>
                  </div>
                  <Calendar className="size-4 text-muted-foreground" />
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none bg-gradient-to-br from-amber-50 via-white to-amber-50/30 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <PiggyBank className="size-5 text-amber-600" />
              <CardTitle className="font-heading text-kaza-navy">
                Cagnotte commune
              </CardTitle>
            </div>
            <CardDescription>Courses partagées colocs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Total cagnotte
              </p>
              <p className="font-heading text-3xl font-bold text-amber-700">
                {formatFcfa(24_500)}
              </p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-white p-3">
              <p className="text-xs text-muted-foreground">Vous devez</p>
              <p className="font-heading text-xl font-bold text-amber-700">
                {formatFcfa(6_000)}
              </p>
            </div>
            <Button className="w-full bg-amber-600 hover:bg-amber-700">
              Régler maintenant
              <ArrowRight className="ml-1 size-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* CALENDRIER HEATMAP */}
      <Card className="rounded-2xl border-none shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-kaza-navy">
            Calendrier des dépenses · Mai 2026
          </CardTitle>
          <CardDescription>
            Heatmap quotidienne (intensité ∝ montant dépensé)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-semibold uppercase text-muted-foreground">
              {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {CALENDAR_DAYS.map((d) => {
                const intensity = Math.min(d.spend / 10_000, 1);
                const bg = `rgba(25, 118, 210, ${0.1 + intensity * 0.7})`;
                return (
                  <div
                    key={d.day}
                    className="flex aspect-square flex-col items-center justify-center rounded-lg text-[11px] font-semibold text-kaza-navy transition-transform hover:scale-105"
                    style={{ backgroundColor: bg }}
                    title={`${formatFcfa(d.spend)} le ${d.day} mai`}
                  >
                    <span>{d.day}</span>
                    <span className="text-[9px] font-medium text-kaza-navy/70">
                      {formatFcfaShort(d.spend)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-end gap-2 text-xs text-muted-foreground">
              <span>Moins</span>
              {[0.15, 0.3, 0.5, 0.7, 0.85].map((i) => (
                <span
                  key={i}
                  className="size-3 rounded"
                  style={{ backgroundColor: `rgba(25, 118, 210, ${i})` }}
                />
              ))}
              <span>Plus</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* OBJECTIFS */}
      <Card className="rounded-2xl border-none shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="size-5 text-kaza-blue" />
            <CardTitle className="font-heading text-kaza-navy">
              Mes objectifs
            </CardTitle>
          </div>
          <CardDescription>3 objectifs personnels en cours</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {OBJECTIVES.map((o) => {
            const pct = Math.min((o.current / o.target) * 100, 100);
            return (
              <div key={o.label}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-kaza-navy">
                    {o.label}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">
                    {o.current}/{o.target} {o.unit}
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-muted">
                  <div
                    className="h-2.5 rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: o.color }}
                  />
                </div>
                <p className="mt-1 text-right text-xs text-muted-foreground">
                  {pct.toFixed(0)}% complété
                  {pct === 100 && (
                    <CheckCircle2 className="ml-1 inline size-3 text-emerald-600" />
                  )}
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* COMMUNAUTÉ */}
      <Card className="rounded-2xl border-none bg-gradient-to-br from-kaza-navy/5 via-white to-kaza-blue/5 shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-kaza-navy">
            Communauté étudiants KAZA
          </CardTitle>
          <CardDescription>
            Vous n&apos;êtes pas seul — rejoignez la communauté
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {COMMUNITY_STATS.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm"
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-kaza-blue/10">
                  <s.icon className="size-6 text-kaza-blue" />
                </div>
                <div>
                  <p className="font-heading text-2xl font-bold text-kaza-navy">
                    {s.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FOOTER */}
      <footer className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border/40 bg-muted/30 px-6 py-5 text-center text-xs text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-1.5">
          <Lock className="size-3.5" />
          <span>Pour gérer vos finances avec sérénité</span>
        </div>
        <span className="hidden sm:inline">·</span>
        <div className="flex items-center gap-1.5">
          <GraduationCap className="size-3.5" />
          <span>Compte étudiant KAZA gratuit à vie</span>
        </div>
      </footer>
    </div>
  );
}
