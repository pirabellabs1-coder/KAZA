import type { Metadata } from "next";
import Link from "next/link";
import {
  Wallet,
  CreditCard,
  TrendingDown,
  Award,
  Calendar,
  PiggyBank,
  FileText,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Download,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TENANT_PAYMENT_HISTORY,
  TENANT_EXPENSES_BREAKDOWN,
  formatFcfa,
  formatFcfaShort,
} from "@/lib/mock/admin-data";

export const metadata: Metadata = {
  title: "Mes finances — Locataire",
  description:
    "Suivi des paiements, budget logement, économies et provisions.",
};

const CURRENT_RENT = 380_000;
const TOTAL_12M = TENANT_PAYMENT_HISTORY.reduce((sum, m) => sum + m.paid, 0);
const SAVINGS = 540_000;
const PAYMENT_SCORE = 98;

const UPCOMING = [
  {
    title: "Loyer juin",
    amount: 380_000,
    dueDate: "1er juin 2026",
    inDays: 4,
    severity: "warn" as const,
  },
  {
    title: "Charges trimestrielles",
    amount: 135_000,
    dueDate: "15 juin 2026",
    inDays: 18,
    severity: "info" as const,
  },
  {
    title: "Renouvellement bail",
    amount: null,
    dueDate: "15 mai 2027",
    inDays: 353,
    severity: "info" as const,
  },
];

const RECENT_PAYMENTS = TENANT_PAYMENT_HISTORY.slice(-6).reverse().map(
  (p, i) => ({
    month: p.month,
    amount: p.paid,
    status: "PAID" as const,
    method: i % 3 === 0 ? "KAZA Wallet" : i % 3 === 1 ? "Carte" : "Virement",
    date: `01 ${p.month.toLowerCase()}`,
  }),
);

const SAVINGS_BREAKDOWN = [
  { label: "Pas de frais d'agence", value: 350_000, icon: Award },
  { label: "Dépôt sécurisé KAZA Wallet", value: 120_000, icon: Wallet },
  { label: "Programme parrainage", value: 70_000, icon: PiggyBank },
];

const GOOD_TO_KNOW = [
  {
    title: "Caution restituée en 30j",
    description: "Délai légal maximum après état des lieux de sortie",
  },
  {
    title: "Indexation IPC plafonnée",
    description: "Évolution du loyer indexée sur l'IPC Bénin (INSAE)",
  },
  {
    title: "Préavis 1 ou 2 mois",
    description: "1 mois pour studios meublés, 2 mois pour non meublés",
  },
  {
    title: "Wallet KAZA = 0 frais",
    description: "Aucune commission sur les versements ni retraits",
  },
];

const maxPayment = Math.max(...TENANT_PAYMENT_HISTORY.map((m) => m.paid));
const totalExpenses = TENANT_EXPENSES_BREAKDOWN.reduce(
  (s, c) => s + c.amount,
  0,
);

export default function TenantFinancePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-kaza-navy">
            Mes finances locataire
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Suivi des paiements, budget logement et économies réalisées.
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="mr-2 size-4" />
          Exporter mes paiements
        </Button>
      </header>

      {/* KPI row 2-cols */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          {
            label: "Loyer mensuel actuel",
            value: formatFcfa(CURRENT_RENT),
            sub: "Bail en cours",
            icon: CreditCard,
            color: "bg-kaza-blue/10 text-kaza-blue",
          },
          {
            label: "Total payé 12 mois",
            value: formatFcfa(TOTAL_12M),
            sub: "Cumul de l'année écoulée",
            icon: Wallet,
            color: "bg-kaza-navy/10 text-kaza-navy",
          },
          {
            label: "Économisé vs agences",
            value: formatFcfa(SAVINGS),
            sub: "+12% vs trimestre précédent",
            icon: TrendingDown,
            color: "bg-emerald-100 text-emerald-600",
          },
          {
            label: "Score paiement",
            value: `${PAYMENT_SCORE}/100`,
            sub: "Excellent payeur",
            icon: Award,
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
        {/* Bar chart 12 mois */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-base text-kaza-navy">
              Historique paiements 12 mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <svg
                viewBox="0 0 720 200"
                className="h-44 w-full min-w-[600px]"
                role="img"
                aria-label="Bar chart historique paiements"
              >
                {[0.25, 0.5, 0.75].map((p) => (
                  <line
                    key={p}
                    x1="40"
                    x2="720"
                    y1={200 * p}
                    y2={200 * p}
                    stroke="#E5E7EB"
                    strokeDasharray="4 4"
                  />
                ))}
                {TENANT_PAYMENT_HISTORY.map((m, i) => {
                  const colWidth = (720 - 40) / TENANT_PAYMENT_HISTORY.length;
                  const x = 40 + i * colWidth + 4;
                  const w = colWidth - 8;
                  const h = (m.paid / maxPayment) * 160;
                  const y = 200 - h - 20;
                  const isRecent = i >= 6;
                  return (
                    <g key={i}>
                      <rect
                        x={x}
                        y={y}
                        width={w}
                        height={h}
                        fill={isRecent ? "#1976D2" : "#90CAF9"}
                        rx={4}
                      />
                      <text
                        x={x + w / 2}
                        y={195}
                        textAnchor="middle"
                        fontSize="9"
                        fill="#6B7280"
                      >
                        {m.month.replace(/\s.+$/, "")}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </CardContent>
        </Card>

        {/* Donut breakdown */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-base text-kaza-navy">
              Répartition mensuelle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <svg viewBox="0 0 200 200" className="size-44 shrink-0">
                {(() => {
                  const radius = 70;
                  const c = 2 * Math.PI * radius;
                  let offset = 0;
                  return TENANT_EXPENSES_BREAKDOWN.map((cat) => {
                    const pct = cat.amount / totalExpenses;
                    const dash = pct * c;
                    const el = (
                      <circle
                        key={cat.category}
                        r={radius}
                        cx={100}
                        cy={100}
                        fill="transparent"
                        stroke={cat.color}
                        strokeWidth={28}
                        strokeDasharray={`${dash} ${c - dash}`}
                        strokeDashoffset={-offset}
                        transform="rotate(-90 100 100)"
                      />
                    );
                    offset += dash;
                    return el;
                  });
                })()}
                <text
                  x={100}
                  y={97}
                  textAnchor="middle"
                  fontSize="14"
                  fontWeight="bold"
                  fill="#1A3A52"
                >
                  {formatFcfaShort(totalExpenses)}
                </text>
                <text
                  x={100}
                  y={113}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#6B7280"
                >
                  par mois
                </text>
              </svg>
              <ul className="flex-1 space-y-1.5 text-xs">
                {TENANT_EXPENSES_BREAKDOWN.map((cat) => (
                  <li key={cat.category} className="flex items-center gap-2">
                    <span
                      className="size-3 rounded-sm"
                      style={{ background: cat.color }}
                    />
                    <span className="flex-1 text-foreground">{cat.category}</span>
                    <span className="font-semibold text-kaza-navy">
                      {formatFcfaShort(cat.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Prochaines échéances */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-base text-kaza-navy">
            <Calendar className="size-4 text-kaza-blue" />
            Prochaines échéances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {UPCOMING.map((u) => (
              <div
                key={u.title}
                className={`rounded-lg border p-3 ${
                  u.severity === "warn"
                    ? "border-amber-200 bg-amber-50"
                    : "border-border bg-muted/30"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {u.title}
                </p>
                {u.amount && (
                  <p className="mt-1 font-heading text-lg font-bold text-kaza-navy">
                    {formatFcfa(u.amount)}
                  </p>
                )}
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {u.dueDate} · Dans {u.inDays}{" "}
                  {u.inDays === 1 ? "jour" : "jours"}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Paiements récents */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 font-heading text-base text-kaza-navy">
              <Receipt className="size-4 text-kaza-blue" />
              Mes paiements récents
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/tenant/payments">Tout l&apos;historique →</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2">Mois</th>
                  <th className="pb-2">Montant</th>
                  <th className="pb-2">Mode</th>
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Statut</th>
                  <th className="pb-2 text-right">Reçu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {RECENT_PAYMENTS.map((p, i) => (
                  <tr key={i}>
                    <td className="py-2 font-medium text-foreground">
                      {p.month}
                    </td>
                    <td className="py-2 font-semibold text-kaza-navy">
                      {formatFcfa(p.amount)}
                    </td>
                    <td className="py-2 text-muted-foreground">{p.method}</td>
                    <td className="py-2 text-muted-foreground">{p.date}</td>
                    <td className="py-2">
                      <Badge className="bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="mr-1 size-3" /> Payé
                      </Badge>
                    </td>
                    <td className="py-2 text-right">
                      <Button variant="ghost" size="sm">
                        <Download className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Économies réalisées */}
      <Card className="rounded-xl border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-base text-kaza-navy">
            <PiggyBank className="size-4 text-emerald-600" />
            Mes économies depuis l&apos;inscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Total économisé
              </p>
              <p className="mt-1 font-heading text-2xl font-bold text-emerald-700">
                {formatFcfa(SAVINGS)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                vs passage par une agence classique
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Décomposition
              </p>
              <ul className="space-y-2">
                {SAVINGS_BREAKDOWN.map((s) => {
                  const Icon = s.icon;
                  return (
                    <li
                      key={s.label}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="flex items-center gap-2 text-sm text-foreground">
                        <Icon className="size-4 text-emerald-600" />
                        {s.label}
                      </span>
                      <span className="font-semibold text-emerald-700">
                        -{formatFcfa(s.value)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provisions & projections */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-base text-kaza-navy">
            Projections
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border border-kaza-blue/20 bg-kaza-blue/5 p-3">
            <p className="text-sm font-semibold text-kaza-navy">
              ✨ Bonus fidélité
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Si vous payez à temps 12 mois consécutifs : -5% sur votre
              renouvellement = {" "}
              <strong className="text-kaza-navy">
                {formatFcfa(Math.round(CURRENT_RENT * 0.05))} d&apos;économie
                mensuelle
              </strong>
              .
            </p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm font-semibold text-kaza-navy">
              📈 Évolution prévisionnelle
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Indexation IPC INSAE Bénin estimée +2%/an. Loyer projeté à{" "}
              <strong className="text-kaza-navy">
                {formatFcfa(Math.round(CURRENT_RENT * 1.02))}
              </strong>{" "}
              en 2027.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Bon à savoir */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-base text-kaza-navy">
            <FileText className="size-4 text-kaza-blue" />
            Vos droits de locataire (Loi 2018-12 Bénin)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {GOOD_TO_KNOW.map((g) => (
              <div
                key={g.title}
                className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-kaza-blue" />
                <div>
                  <p className="text-sm font-semibold text-kaza-navy">
                    {g.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {g.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
