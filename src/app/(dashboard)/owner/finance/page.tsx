import type { Metadata } from "next";
import {
  ArrowUpRight,
  Building2,
  Calculator,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Download,
  FileSpreadsheet,
  FileText,
  Info,
  Landmark,
  Receipt,
  ScrollText,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  OWNER_MONTHLY_REVENUE,
  formatFcfa,
  formatFcfaShort,
} from "@/lib/mock/admin-data";

export const metadata: Metadata = {
  title: "Finances propriétaire",
};

// =============================================================================
// MOCK LOCAL — données spécifiques à la page finance owner
// =============================================================================

const RENT_DUE_THIS_MONTH = [
  {
    id: "rd-1",
    tenant: "Mariam Adjovi",
    property: "T4 Cadjèhoun",
    expected: 425_000,
    status: "RECEIVED" as const,
    dueDate: "2026-05-01",
  },
  {
    id: "rd-2",
    tenant: "Sébastien Mahougnon",
    property: "Studio meublé Ganhi",
    expected: 165_000,
    status: "PENDING" as const,
    dueDate: "2026-05-05",
  },
  {
    id: "rd-3",
    tenant: "Awa Diop",
    property: "Villa 5ch. Haie Vive",
    expected: 1_250_000,
    status: "RECEIVED" as const,
    dueDate: "2026-05-01",
  },
  {
    id: "rd-4",
    tenant: "Pierre Houngbo",
    property: "T3 Cocotiers",
    expected: 520_000,
    status: "LATE" as const,
    dueDate: "2026-04-28",
  },
];

const OWNER_PAYOUTS = [
  { id: "po-101", date: "2026-05-26", amount: 1_450_000, method: "KAZA Wallet", status: "PAID" as const },
  { id: "po-102", date: "2026-04-26", amount: 1_380_000, method: "Virement bancaire", status: "PAID" as const },
  { id: "po-103", date: "2026-03-26", amount: 1_280_000, method: "KAZA Wallet", status: "PAID" as const },
  { id: "po-104", date: "2026-02-26", amount: 1_310_000, method: "Virement bancaire", status: "PAID" as const },
  { id: "po-105", date: "2026-05-28", amount: 425_000, method: "KAZA Wallet", status: "PROCESSING" as const },
  { id: "po-106", date: "2026-06-01", amount: 1_450_000, method: "Virement bancaire", status: "SCHEDULED" as const },
];

const DONUT_BREAKDOWN = [
  { label: "Loyer perçu", percentage: 90, color: "#1976D2", amount: 1_305_000 },
  { label: "Charges récupérables", percentage: 8, color: "#4CAF50", amount: 116_000 },
  { label: "Compensation dégâts", percentage: 2, color: "#F59E0B", amount: 29_000 },
];

const JUSTIFICATIFS = [
  { id: "j-1", title: "Quittances de loyer", icon: Receipt, count: 36, description: "12 mois · 3 locataires" },
  { id: "j-2", title: "Reçus de paiement", icon: ScrollText, count: 14, description: "14 versements 12 mois" },
  { id: "j-3", title: "Attestation fiscale", icon: FileText, count: 1, description: "DGI Bénin 2025" },
  { id: "j-4", title: "Relevé d'imposition", icon: Landmark, count: 1, description: "Année fiscale 2025" },
];

// =============================================================================
// PAGE
// =============================================================================

export default function OwnerFinancePage() {
  const data = OWNER_MONTHLY_REVENUE;
  const totalRev = data.reduce((s, d) => s + d.revenue, 0);
  const maxRev = Math.max(...data.map((d) => d.revenue));

  const grossRevenue = totalRev; // 15 080 000 attendu
  const deductibles = 1_200_000;
  const taxableIncome = grossRevenue - deductibles;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-kaza-blue">
            Comptabilité
          </p>
          <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
            Finances propriétaire
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Suivi des revenus locatifs, payouts et fiscalité.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm">
            <FileText className="mr-2 size-4" /> PDF annuel
          </Button>
          <Button size="sm" className="bg-kaza-navy text-white hover:bg-kaza-navy/90">
            <FileSpreadsheet className="mr-2 size-4" /> Exporter compta
          </Button>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KpiCard
          label="Revenus 12 mois"
          value={`${formatFcfaShort(grossRevenue)} FCFA`}
          subtitle="+12% vs N-1"
          subtitleType="positive"
          icon={Wallet}
        />
        <KpiCard
          label="Loyers à percevoir ce mois"
          value={formatFcfa(1_450_000)}
          subtitle="3 locataires actifs"
          icon={CalendarClock}
        />
        <KpiCard
          label="Payouts reçus"
          value={`${formatFcfaShort(14_200_000)} FCFA`}
          subtitle="11 versements 12 mois"
          icon={CheckCircle2}
          subtitleType="positive"
        />
        <KpiCard
          label="Taxes estimées"
          value={formatFcfa(1_508_000)}
          subtitle="À provisionner"
          icon={Landmark}
          subtitleType="warning"
        />
      </div>

      {/* GRAPHIQUE 1 — Revenus mensuels (aire courbée) */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="font-heading text-base">Revenus mensuels — 12 mois</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Loyers nets perçus, valeurs en FCFA
              </p>
            </div>
            <Badge variant="outline" className="border-kaza-blue text-kaza-blue">
              Total : {formatFcfa(totalRev)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <svg viewBox="0 0 760 280" className="min-w-[600px] w-full">
              <defs>
                <linearGradient id="ownerRevArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1976D2" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#1976D2" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {[0.25, 0.5, 0.75, 1].map((p) => (
                <line
                  key={p}
                  x1="60"
                  x2="740"
                  y1={40 + 200 * (1 - p)}
                  y2={40 + 200 * (1 - p)}
                  stroke="#E5E7EB"
                  strokeDasharray="4 4"
                />
              ))}
              {[0, 0.25, 0.5, 0.75, 1].map((p) => (
                <text
                  key={p}
                  x="54"
                  y={40 + 200 * (1 - p) + 4}
                  textAnchor="end"
                  className="fill-muted-foreground"
                  fontSize="10"
                >
                  {formatFcfaShort(maxRev * p)}
                </text>
              ))}
              {(() => {
                const slot = (740 - 60) / (data.length - 1);
                const points = data.map((d, i) => {
                  const x = 60 + i * slot;
                  const y = 40 + 200 - (d.revenue / maxRev) * 200;
                  return [x, y] as const;
                });
                const line = points
                  .map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`)
                  .join(" ");
                const area = `${line} L ${points[points.length - 1][0]} 240 L ${points[0][0]} 240 Z`;
                return (
                  <>
                    <path d={area} fill="url(#ownerRevArea)" />
                    <path
                      d={line}
                      fill="none"
                      stroke="#1976D2"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {points.map((p, i) => (
                      <g key={i}>
                        <circle
                          cx={p[0]}
                          cy={p[1]}
                          r={4}
                          fill="#fff"
                          stroke="#1976D2"
                          strokeWidth={2}
                        />
                        <text
                          x={p[0]}
                          y={p[1] - 10}
                          textAnchor="middle"
                          fontSize="9"
                          className="fill-kaza-navy"
                          fontWeight="600"
                        >
                          {formatFcfaShort(data[i]!.revenue)}
                        </text>
                      </g>
                    ))}
                  </>
                );
              })()}
              {data.map((d, i) => {
                const slot = (740 - 60) / (data.length - 1);
                const x = 60 + i * slot;
                return (
                  <text
                    key={d.month}
                    x={x}
                    y={262}
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

      {/* GRAPHIQUE 2 — Décomposition mensuelle (donut) + Table loyers du mois */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-heading text-base">
              Décomposition du mois
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Répartition des recettes
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <Donut data={DONUT_BREAKDOWN} totalLabel="Total" totalValue={formatFcfaShort(1_450_000)} />
              <div className="w-full space-y-2">
                {DONUT_BREAKDOWN.map((s) => (
                  <div key={s.label} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-3 rounded-sm"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="font-medium">{s.label}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="font-mono">{formatFcfaShort(s.amount)}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {s.percentage}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table loyers du mois */}
        <Card className="rounded-2xl shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading text-base">
              Loyers du mois en cours
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Mai 2026 — statut au {new Date().toLocaleDateString("fr-FR")}
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 font-medium">Locataire</th>
                    <th className="pb-2 font-medium">Propriété</th>
                    <th className="pb-2 text-right font-medium">Attendu</th>
                    <th className="pb-2 font-medium">Statut</th>
                    <th className="pb-2 font-medium">Échéance</th>
                    <th className="pb-2 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {RENT_DUE_THIS_MONTH.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 font-medium">{r.tenant}</td>
                      <td className="py-2.5 text-muted-foreground">{r.property}</td>
                      <td className="py-2.5 text-right font-mono">
                        {formatFcfa(r.expected)}
                      </td>
                      <td className="py-2.5">
                        <RentStatusBadge status={r.status} />
                      </td>
                      <td className="py-2.5 text-muted-foreground">
                        {new Date(r.dueDate).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="py-2.5 text-right">
                        <Button size="sm" variant="outline" className="h-7 text-[11px]">
                          {r.status === "RECEIVED" ? "Voir détail" : "Relancer"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section "Mes payouts" */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="font-heading text-base">Mes payouts</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Versements depuis votre KAZA Wallet vers compte bancaire
              </p>
            </div>
            <Badge variant="outline" className="border-kaza-green text-kaza-green">
              {formatFcfa(14_200_000)} reçus 12 mois
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 text-right font-medium">Montant</th>
                  <th className="pb-2 font-medium">Méthode</th>
                  <th className="pb-2 font-medium">Statut</th>
                  <th className="pb-2 text-right font-medium">Justificatif</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {OWNER_PAYOUTS.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 text-muted-foreground">
                      {new Date(p.date).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="py-2.5 text-right font-mono font-semibold text-kaza-green">
                      {formatFcfa(p.amount)}
                    </td>
                    <td className="py-2.5 text-muted-foreground">{p.method}</td>
                    <td className="py-2.5">
                      <PayoutStatusBadge status={p.status} />
                    </td>
                    <td className="py-2.5 text-right">
                      <Button size="sm" variant="ghost" className="h-7 text-[11px]">
                        <Download className="mr-1 size-3" />
                        Téléchar.
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Section "Fiscalité Bénin" */}
      <div>
        <h2 className="mb-3 font-heading text-base font-semibold text-foreground">
          Fiscalité Bénin
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Building2 className="size-3.5" />
                Recettes brutes 12 mois
              </div>
              <p className="mt-2 font-heading text-lg font-bold text-foreground">
                {formatFcfa(grossRevenue)}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Loyers + charges récupérables
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calculator className="size-3.5" />
                Charges déductibles
              </div>
              <p className="mt-2 font-heading text-lg font-bold text-foreground">
                {formatFcfa(deductibles)}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Frais agence, travaux, assurance
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm border-kaza-blue/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-kaza-blue">
                <Landmark className="size-3.5" />
                Revenus imposables
              </div>
              <p className="mt-2 font-heading text-lg font-bold text-kaza-navy">
                {formatFcfa(taxableIncome)}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Base de calcul de l&apos;impôt foncier
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <Info className="mt-0.5 size-5 shrink-0 text-amber-600" />
          <div className="text-sm text-amber-900">
            <p className="font-semibold">À retenir — Fiscalité immobilière Bénin</p>
            <p className="mt-1 text-amber-800">
              Au Bénin, les revenus fonciers sont imposés au taux de 25%.
              Déclaration annuelle à la DGI avant le 31 mars. KAZA vous
              accompagne dans la préparation de votre déclaration.
            </p>
          </div>
        </div>
      </div>

      {/* Section "Justificatifs" */}
      <div>
        <h2 className="mb-3 font-heading text-base font-semibold text-foreground">
          Justificatifs
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {JUSTIFICATIFS.map((j) => (
            <Card key={j.id} className="rounded-2xl shadow-sm">
              <CardContent className="p-4">
                <div className="flex size-9 items-center justify-center rounded-lg bg-kaza-navy/5 text-kaza-navy">
                  <j.icon className="size-4" />
                </div>
                <p className="mt-3 font-heading text-sm font-semibold">
                  {j.title}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {j.description}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 h-8 w-full text-xs"
                >
                  <Download className="mr-1.5 size-3.5" />
                  ZIP 12 mois
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Footer info */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <ClipboardList className="size-3.5" />
          Données issues de votre activité KAZA Wallet
        </span>
        <span className="flex items-center gap-1.5">
          <TrendingUp className="size-3.5 text-kaza-green" />
          Croissance annuelle +12%
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function KpiCard({
  label,
  value,
  subtitle,
  subtitleType = "neutral",
  icon: Icon,
}: {
  label: string;
  value: string;
  subtitle?: string;
  subtitleType?: "positive" | "negative" | "warning" | "neutral";
  icon: React.ComponentType<{ className?: string }>;
}) {
  const subColor =
    subtitleType === "positive"
      ? "text-kaza-green"
      : subtitleType === "negative"
        ? "text-red-600"
        : subtitleType === "warning"
          ? "text-amber-600"
          : "text-muted-foreground";

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <div className="flex size-7 items-center justify-center rounded-lg bg-slate-100">
            <Icon className="size-3.5 text-kaza-navy" />
          </div>
        </div>
        <p className="mt-2 font-heading text-lg font-bold text-foreground">
          {value}
        </p>
        {subtitle && (
          <p className={`mt-1 text-[11px] font-semibold ${subColor}`}>
            {subtitleType === "positive" && (
              <ArrowUpRight className="mr-0.5 inline size-3" />
            )}
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function RentStatusBadge({
  status,
}: {
  status: "RECEIVED" | "PENDING" | "LATE";
}) {
  const config = {
    RECEIVED: { label: "Reçu", className: "bg-emerald-100 text-emerald-700" },
    PENDING: { label: "En attente", className: "bg-amber-100 text-amber-700" },
    LATE: { label: "En retard", className: "bg-red-100 text-red-700" },
  }[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}

function PayoutStatusBadge({
  status,
}: {
  status: "PAID" | "PROCESSING" | "SCHEDULED";
}) {
  const config = {
    PAID: { label: "Payé", className: "bg-emerald-100 text-emerald-700" },
    PROCESSING: { label: "En cours", className: "bg-blue-100 text-blue-700" },
    SCHEDULED: { label: "Programmé", className: "bg-slate-100 text-slate-700" },
  }[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}

function Donut({
  data,
  totalLabel,
  totalValue,
}: {
  data: { label: string; percentage: number; color: string }[];
  totalLabel: string;
  totalValue: string;
}) {
  const size = 180;
  const radius = 70;
  const stroke = 22;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="#F1F5F9"
        strokeWidth={stroke}
      />
      {data.map((d, i) => {
        const dash = (d.percentage / 100) * circumference;
        const seg = (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={d.color}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${circumference}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="butt"
          />
        );
        offset += dash;
        return seg;
      })}
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        className="fill-muted-foreground"
        fontSize="10"
      >
        {totalLabel}
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        className="fill-foreground"
        fontSize="16"
        fontWeight="700"
      >
        {totalValue}
      </text>
    </svg>
  );
}
