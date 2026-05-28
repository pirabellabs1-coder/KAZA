import type { Metadata } from "next";
import {
  Wallet,
  PiggyBank,
  TrendingDown,
  Users,
  Target,
  Lightbulb,
  GraduationCap,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  STUDENT_MONTHLY_EXPENSES,
  STUDENT_BUDGET_TRACKING,
  formatFcfa,
  formatFcfaShort,
} from "@/lib/mock/admin-data";

export const metadata: Metadata = {
  title: "Mes finances — Étudiant",
  description: "Budget, dépenses partagées colocation et projections.",
};

const SAVED_SINCE_START = 95_000;
const SAVE_GOAL = 100_000;

const SHARED_RECENT = [
  { desc: "Courses Dantokpa", date: "25 mai", paidBy: "Vous", total: 18_500, share: 6_167 },
  { desc: "Facture internet", date: "22 mai", paidBy: "Aminata", total: 25_000, share: 8_333 },
  { desc: "Cadeau anniv coloc", date: "20 mai", paidBy: "Koffi", total: 15_000, share: 5_000 },
  { desc: "Gaz cuisine", date: "18 mai", paidBy: "Vous", total: 8_500, share: 2_833 },
  { desc: "Réparation robinet", date: "15 mai", paidBy: "Aminata", total: 12_000, share: 4_000 },
  { desc: "Courses Erevan", date: "12 mai", paidBy: "Vous", total: 22_400, share: 7_467 },
];

const BUDGET_CATS = [
  { label: "Logement", current: 75_000, target: 75_000, fixed: true },
  { label: "Nourriture", current: 51_000, target: 55_000 },
  { label: "Transport", current: 24_000, target: 25_000 },
  { label: "Autres", current: 21_000, target: 25_000 },
];

const TIPS = [
  { title: "Carte SOTRA étudiante", saving: "-50% transport", icon: "🚌" },
  { title: "Cuisiner ensemble", saving: "-30% nourriture", icon: "🍳" },
  { title: "Marché Dantokpa", saving: "-25% courses", icon: "🛒" },
  { title: "Netflix split coloc", saving: "-66% abonnements", icon: "📺" },
];

const last = STUDENT_MONTHLY_EXPENSES[STUDENT_MONTHLY_EXPENSES.length - 1]!;
const lastMonthTotal = last.food + last.rent + last.transport + last.other;
const lastBreakdown = [
  { cat: "Loyer", value: last.rent, color: "#1A3A52" },
  { cat: "Nourriture", value: last.food, color: "#1976D2" },
  { cat: "Transport", value: last.transport, color: "#4CAF50" },
  { cat: "Autres", value: last.other, color: "#F59E0B" },
];

// Budget circle
const budgetPct = Math.round(
  (STUDENT_BUDGET_TRACKING.spent / STUDENT_BUDGET_TRACKING.monthlyBudget) * 100,
);
const budgetColor =
  budgetPct < 80 ? "#10B981" : budgetPct < 95 ? "#F59E0B" : "#EF4444";

// Stacked bar
const maxStacked = Math.max(
  ...STUDENT_MONTHLY_EXPENSES.map((m) => m.food + m.rent + m.transport + m.other),
);

export default function StudentFinancePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-kaza-navy">
            Mes finances étudiant
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Budget, dépenses partagées colocation et projection rentrée.
          </p>
        </div>
        <Badge className="w-fit bg-kaza-blue/10 text-kaza-blue">
          <GraduationCap className="mr-1 size-3.5" />
          Compte étudiant gratuit
        </Badge>
      </header>

      {/* KPI 2-cols */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          {
            label: "Budget mensuel",
            value: formatFcfa(STUDENT_BUDGET_TRACKING.monthlyBudget),
            sub: "Cible perso",
            icon: Target,
            color: "bg-kaza-navy/10 text-kaza-navy",
          },
          {
            label: "Dépensé ce mois",
            value: formatFcfa(STUDENT_BUDGET_TRACKING.spent),
            sub: `${budgetPct}% du budget`,
            icon: Wallet,
            color: "bg-kaza-blue/10 text-kaza-blue",
          },
          {
            label: "Restant",
            value: formatFcfa(STUDENT_BUDGET_TRACKING.remaining),
            sub: `${STUDENT_BUDGET_TRACKING.daysLeft} jours restants`,
            icon: PiggyBank,
            color: "bg-emerald-100 text-emerald-600",
          },
          {
            label: "Économies rentrée",
            value: formatFcfa(SAVED_SINCE_START),
            sub: `${Math.round((SAVED_SINCE_START / SAVE_GOAL) * 100)}% de l'objectif`,
            icon: TrendingDown,
            color: "bg-amber-100 text-amber-600",
          },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="rounded-xl shadow-sm">
              <CardContent className="flex items-start gap-3 p-4">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${k.color}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {k.label}
                  </p>
                  <p className="mt-0.5 font-heading text-lg font-bold text-kaza-navy">
                    {k.value}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {k.sub}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* Graphes 2-cols */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Stacked bar 5 mois */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-base text-kaza-navy">
              Dépenses 5 derniers mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <svg
                viewBox="0 0 500 220"
                className="h-48 w-full min-w-[400px]"
                role="img"
              >
                {[0.25, 0.5, 0.75].map((p) => (
                  <line
                    key={p}
                    x1="40"
                    x2="500"
                    y1={200 * p}
                    y2={200 * p}
                    stroke="#E5E7EB"
                    strokeDasharray="4 4"
                  />
                ))}
                {STUDENT_MONTHLY_EXPENSES.map((m, i) => {
                  const colWidth = (500 - 40) / STUDENT_MONTHLY_EXPENSES.length;
                  const x = 40 + i * colWidth + 8;
                  const w = colWidth - 16;
                  const segments: Array<[number, string]> = [
                    [m.rent, "#1A3A52"],
                    [m.food, "#1976D2"],
                    [m.transport, "#4CAF50"],
                    [m.other, "#F59E0B"],
                  ];
                  let cumul = 0;
                  return (
                    <g key={i}>
                      {segments.map(([val, color], idx) => {
                        const h = (val / maxStacked) * 170;
                        const y = 200 - 20 - h - cumul;
                        cumul += h;
                        return (
                          <rect
                            key={idx}
                            x={x}
                            y={y}
                            width={w}
                            height={h}
                            fill={color}
                            rx={idx === 0 ? 0 : 0}
                          />
                        );
                      })}
                      <text
                        x={x + w / 2}
                        y={195}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#6B7280"
                      >
                        {m.month}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-[11px]">
              {[
                ["Loyer", "#1A3A52"],
                ["Nourriture", "#1976D2"],
                ["Transport", "#4CAF50"],
                ["Autres", "#F59E0B"],
              ].map(([lbl, color]) => (
                <span key={lbl} className="flex items-center gap-1.5">
                  <span
                    className="size-3 rounded-sm"
                    style={{ background: color }}
                  />
                  {lbl}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cercle budget en cours */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-base text-kaza-navy">
              Budget en cours · {last.month}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <svg viewBox="0 0 200 200" className="size-44 shrink-0">
                <circle
                  cx={100}
                  cy={100}
                  r={75}
                  stroke="#E5E7EB"
                  strokeWidth={18}
                  fill="none"
                />
                <circle
                  cx={100}
                  cy={100}
                  r={75}
                  stroke={budgetColor}
                  strokeWidth={18}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 75}
                  strokeDashoffset={2 * Math.PI * 75 * (1 - budgetPct / 100)}
                  transform="rotate(-90 100 100)"
                />
                <text
                  x={100}
                  y={95}
                  textAnchor="middle"
                  fontSize="28"
                  fontWeight="bold"
                  fill="#1A3A52"
                >
                  {budgetPct}%
                </text>
                <text
                  x={100}
                  y={118}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#6B7280"
                >
                  dépensé
                </text>
              </svg>
              <div className="flex-1 space-y-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Dépensé</p>
                  <p className="font-semibold text-kaza-navy">
                    {formatFcfa(STUDENT_BUDGET_TRACKING.spent)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Restant</p>
                  <p className="font-semibold text-emerald-600">
                    {formatFcfa(STUDENT_BUDGET_TRACKING.remaining)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Projection</p>
                  <p className="text-xs text-foreground">
                    {STUDENT_BUDGET_TRACKING.projectedEnd}
                  </p>
                </div>
                <div className="rounded-md bg-muted/50 p-2 text-xs">
                  Dernier mois ({last.month}) :{" "}
                  <strong className="text-kaza-navy">
                    {formatFcfa(lastMonthTotal)}
                  </strong>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Cagnotte coloc commune */}
      <Card className="rounded-xl border-kaza-blue/20 bg-gradient-to-br from-kaza-blue/5 to-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-base text-kaza-navy">
            <Users className="size-4 text-kaza-blue" />
            Cagnotte commune colocation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Solde commun
              </p>
              <p className="mt-1 font-heading text-2xl font-bold text-kaza-navy">
                {formatFcfa(24_500)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Courses · Internet · Charges partagées
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Vous devez
              </p>
              <p className="mt-1 font-heading text-2xl font-bold text-amber-600">
                {formatFcfa(6_000)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">À 3 colocs</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button className="w-full bg-kaza-navy hover:bg-kaza-navy/90">
                Régler maintenant
              </Button>
              <Button variant="outline" className="w-full">
                Voir détail
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dépenses partagées récentes */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-base text-kaza-navy">
            Dépenses partagées récentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2">Description</th>
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Payé par</th>
                  <th className="pb-2 text-right">Total</th>
                  <th className="pb-2 text-right">Ma part</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {SHARED_RECENT.map((s, i) => (
                  <tr key={i}>
                    <td className="py-2 font-medium text-foreground">
                      {s.desc}
                    </td>
                    <td className="py-2 text-muted-foreground">{s.date}</td>
                    <td className="py-2">
                      <Badge
                        variant="secondary"
                        className={
                          s.paidBy === "Vous"
                            ? "bg-emerald-100 text-emerald-700"
                            : ""
                        }
                      >
                        {s.paidBy}
                      </Badge>
                    </td>
                    <td className="py-2 text-right text-kaza-navy">
                      {formatFcfa(s.total)}
                    </td>
                    <td className="py-2 text-right font-semibold text-kaza-navy">
                      {formatFcfa(s.share)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Cibles budget */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-base text-kaza-navy">
            Mes cibles budget mensuel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {BUDGET_CATS.map((c) => {
            const pct = Math.round((c.current / c.target) * 100);
            const color =
              c.fixed
                ? "bg-kaza-navy"
                : pct < 90
                  ? "bg-emerald-500"
                  : pct < 100
                    ? "bg-amber-500"
                    : "bg-red-500";
            return (
              <div key={c.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{c.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatFcfaShort(c.current)} / {formatFcfaShort(c.target)} ·{" "}
                    <strong className="text-kaza-navy">{pct}%</strong>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full transition-all ${color}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Astuces économies */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-base text-kaza-navy">
            <Lightbulb className="size-4 text-amber-500" />
            Astuces économies étudiantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {TIPS.map((t) => (
              <div
                key={t.title}
                className="rounded-lg border border-border bg-muted/30 p-3"
              >
                <p className="text-2xl">{t.icon}</p>
                <p className="mt-1 text-sm font-semibold text-kaza-navy">
                  {t.title}
                </p>
                <p className="mt-0.5 text-xs font-medium text-emerald-600">
                  {t.saving}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Objectif rentrée */}
      <Card className="rounded-xl border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
            <div className="flex-1">
              <p className="font-heading text-base font-bold text-kaza-navy">
                🎯 Objectif rentrée septembre 2026
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Vous êtes à <strong className="text-emerald-700">{formatFcfa(SAVED_SINCE_START)}</strong>{" "}
                sur {formatFcfa(SAVE_GOAL)} ={" "}
                <strong className="text-emerald-700">
                  {Math.round((SAVED_SINCE_START / SAVE_GOAL) * 100)}%
                </strong>{" "}
                — Plus que {formatFcfa(SAVE_GOAL - SAVED_SINCE_START)} à mettre
                de côté.
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-emerald-100">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{
                    width: `${Math.round((SAVED_SINCE_START / SAVE_GOAL) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bourse ANBPE */}
      <Card className="rounded-xl border-border bg-muted/30 shadow-sm">
        <CardContent className="flex items-start gap-3 p-4">
          <GraduationCap className="mt-0.5 size-5 shrink-0 text-kaza-blue" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-kaza-navy">
              Bourse étudiante Bénin
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Si vous êtes boursier, KAZA partenarise avec l&apos;ANBPE pour
              faciliter le paiement de votre loyer dès le début du trimestre.
            </p>
          </div>
          <Button variant="outline" size="sm">
            En savoir plus
            <ArrowRight className="ml-1 size-3.5" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
