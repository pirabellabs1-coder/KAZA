"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  Download,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  ArrowUpRight,
  Clock,
  Camera,
  Eye,
  MessageSquare,
  Star,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast-helper";
import { formatPrice } from "@/lib/utils";

type Period = "MONTH" | "QUARTER" | "YEAR";

const PERIOD_DATA: Record<
  Period,
  {
    label: string;
    revenue: number;
    revenueDelta: number;
    expenses: number;
    expensesDelta: number;
    net: number;
    netDelta: number;
  }
> = {
  MONTH: {
    label: "Mai 2026",
    revenue: 1490000,
    revenueDelta: 12.4,
    expenses: 215000,
    expensesDelta: -4.8,
    net: 1275000,
    netDelta: 15.2,
  },
  QUARTER: {
    label: "T2 2026 (avr · mai · juin)",
    revenue: 4380000,
    revenueDelta: 8.7,
    expenses: 695000,
    expensesDelta: 2.1,
    net: 3685000,
    netDelta: 9.9,
  },
  YEAR: {
    label: "Année 2026",
    revenue: 17280000,
    revenueDelta: 18.3,
    expenses: 2840000,
    expensesDelta: 6.4,
    net: 14440000,
    netDelta: 21.0,
  },
};

type AdPerf = {
  id: string;
  title: string;
  photoSeed: number;
  views: number;
  requests: number;
  rating: number;
};

const AD_PERFORMANCE: AdPerf[] = [
  {
    id: "p-101",
    title: "Villa Fidjrossè 4 pièces",
    photoSeed: 1011,
    views: 1842,
    requests: 47,
    rating: 4.8,
  },
  {
    id: "p-102",
    title: "Studio Cadjehoun",
    photoSeed: 1012,
    views: 2310,
    requests: 38,
    rating: 4.5,
  },
  {
    id: "p-103",
    title: "Appartement Akpakpa 3 pièces",
    photoSeed: 1015,
    views: 1280,
    requests: 22,
    rating: 4.2,
  },
  {
    id: "p-104",
    title: "Maison Calavi 5 pièces",
    photoSeed: 1018,
    views: 980,
    requests: 31,
    rating: 5.0,
  },
  {
    id: "p-105",
    title: "Studio meublé Haie Vive",
    photoSeed: 1024,
    views: 1654,
    requests: 19,
    rating: 4.6,
  },
  {
    id: "p-106",
    title: "Duplex Cotonou Centre",
    photoSeed: 1031,
    views: 765,
    requests: 9,
    rating: 4.0,
  },
];

const FISCAL_MONTHS = [
  { label: "Mai 2026", revenue: 1490000 },
  { label: "Avr. 2026", revenue: 1450000 },
  { label: "Mars 2026", revenue: 1440000 },
  { label: "Févr. 2026", revenue: 1380000 },
  { label: "Janv. 2026", revenue: 1420000 },
  { label: "Déc. 2025", revenue: 1510000 },
  { label: "Nov. 2025", revenue: 1390000 },
  { label: "Oct. 2025", revenue: 1370000 },
  { label: "Sept. 2025", revenue: 1340000 },
  { label: "Août 2025", revenue: 1290000 },
  { label: "Juil. 2025", revenue: 1310000 },
  { label: "Juin 2025", revenue: 1360000 },
];

const INSIGHTS = [
  {
    id: "ins-1",
    title: "Augmentez le prix de Villa Fidjrossè",
    detail:
      "Marché tendu dans le quartier : +15 % de loyer reste compétitif et génère +52 500 FCFA/mois.",
    accent: "text-kaza-green",
    bg: "bg-kaza-green/10",
    icon: ArrowUpRight,
    cta: "Simuler la hausse",
  },
  {
    id: "ins-2",
    title: "Répondez plus vite aux demandes",
    detail:
      "Temps de réponse moyen : 48 h. Les annonces avec < 24 h convertissent 2× plus.",
    accent: "text-kaza-blue",
    bg: "bg-kaza-blue/10",
    icon: Clock,
    cta: "Voir les demandes",
  },
  {
    id: "ins-3",
    title: "Ajoutez plus de photos à Studio Cadjehoun",
    detail:
      "Seulement 4 photos. Les annonces avec 8+ photos reçoivent +35 % de visites.",
    accent: "text-amber-700",
    bg: "bg-amber-100",
    icon: Camera,
    cta: "Ajouter des photos",
  },
];

function DeltaPill({ value }: { value: number }) {
  const positive = value >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        positive
          ? "bg-kaza-green/10 text-kaza-green"
          : "bg-rose-100 text-rose-700"
      }`}
    >
      <Icon className="size-3" />
      {positive ? "+" : ""}
      {value.toFixed(1)} %
    </span>
  );
}

export default function OwnerReportsPage() {
  const [period, setPeriod] = useState<Period>("MONTH");
  const data = PERIOD_DATA[period];

  const handleExport = () =>
    toast.success(`Export PDF "${data.label}" en cours (démo)`);

  const handleMonthlyReport = (label: string) =>
    toast.success(`Rapport ${label} téléchargé (démo)`);

  const enriched = useMemo(
    () =>
      AD_PERFORMANCE.map((p) => ({
        ...p,
        conversion: p.views > 0 ? (p.requests / p.views) * 100 : 0,
      })),
    [],
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Rapports & analytics
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vision financière et performance de vos biens en un coup d&apos;œil.
        </p>
      </div>

      {/* Export comptable */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Export comptable
            </h2>
            <p className="text-xs text-muted-foreground">
              {data.label} · synthèse Revenus / Charges / Bénéfice
            </p>
          </div>
          <div className="flex gap-2">
            <Select
              value={period}
              onValueChange={(v) => setPeriod(v as Period)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MONTH">Ce mois</SelectItem>
                <SelectItem value="QUARTER">Trimestre</SelectItem>
                <SelectItem value="YEAR">Année</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleExport}
              className="bg-kaza-blue hover:bg-kaza-blue/90"
            >
              <Download className="mr-2 size-4" />
              Télécharger PDF
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-l-4 border-l-kaza-green">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-wider">
                Revenus
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-3xl font-bold text-foreground">
                {formatPrice(data.revenue)}
              </p>
              <div className="mt-2">
                <DeltaPill value={data.revenueDelta} />
                <span className="ml-2 text-xs text-muted-foreground">
                  vs période précédente
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-kaza-warning">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-wider">
                Charges
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-3xl font-bold text-foreground">
                {formatPrice(data.expenses)}
              </p>
              <div className="mt-2">
                <DeltaPill value={data.expensesDelta} />
                <span className="ml-2 text-xs text-muted-foreground">
                  vs période précédente
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-kaza-blue">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-wider">
                Bénéfice net
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-3xl font-bold text-kaza-blue">
                {formatPrice(data.net)}
              </p>
              <div className="mt-2">
                <DeltaPill value={data.netDelta} />
                <span className="ml-2 text-xs text-muted-foreground">
                  vs période précédente
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Performance des annonces */}
      <section className="space-y-4">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Performance des annonces
          </h2>
          <p className="text-xs text-muted-foreground">
            Vues, demandes et conversion par bien (30 derniers jours).
          </p>
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Bien
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Vues
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Demandes
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Conversion
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Note
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {enriched.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b transition-colors last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                            <Image
                              src={`https://picsum.photos/seed/${p.photoSeed}/96/96`}
                              alt=""
                              fill
                              sizes="48px"
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <p className="text-sm font-medium">{p.title}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold">
                        {p.views.toLocaleString("fr-FR")}
                      </td>
                      <td className="px-4 py-3 text-sm">{p.requests}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={
                            p.conversion >= 3
                              ? "border-kaza-green text-kaza-green"
                              : p.conversion >= 1.5
                                ? "border-amber-400 text-amber-700"
                                : "border-rose-300 text-rose-700"
                          }
                        >
                          {p.conversion.toFixed(2)} %
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Star className="size-3.5 fill-kaza-warning text-kaza-warning" />
                          <span className="text-sm font-medium">
                            {p.rating.toFixed(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Voir les stats"
                            onClick={() =>
                              toast.info(`Statistiques détaillées de ${p.title}`)
                            }
                          >
                            <Eye className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Voir les demandes"
                            onClick={() =>
                              toast.info(`${p.requests} demandes pour ${p.title}`)
                            }
                          >
                            <MessageSquare className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <ul className="divide-y md:hidden">
              {enriched.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 p-3"
                >
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted">
                    <Image
                      src={`https://picsum.photos/seed/${p.photoSeed}/96/96`}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.views.toLocaleString("fr-FR")} vues · {p.requests}{" "}
                      demandes
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          p.conversion >= 3
                            ? "border-kaza-green text-kaza-green"
                            : p.conversion >= 1.5
                              ? "border-amber-400 text-amber-700"
                              : "border-rose-300 text-rose-700"
                        }
                      >
                        {p.conversion.toFixed(2)} %
                      </Badge>
                      <span className="inline-flex items-center gap-0.5 text-xs">
                        <Star className="size-3 fill-kaza-warning text-kaza-warning" />
                        {p.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Rapports fiscaux */}
      <section className="space-y-4">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Rapports fiscaux
          </h2>
          <p className="text-xs text-muted-foreground">
            12 derniers mois · documents PDF prêts pour votre comptable.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
          {FISCAL_MONTHS.map((m) => (
            <Card key={m.label}>
              <CardContent className="space-y-2 p-3 text-center">
                <p className="text-xs font-semibold capitalize text-kaza-navy">
                  {m.label}
                </p>
                <p className="text-sm font-bold text-foreground">
                  {formatPrice(m.revenue)}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleMonthlyReport(m.label)}
                >
                  <Download className="mr-1 size-3.5" />
                  PDF
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Insights */}
      <section className="space-y-4">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Insights
          </h2>
          <p className="text-xs text-muted-foreground">
            Conseils personnalisés pour optimiser vos revenus.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {INSIGHTS.map((i) => {
            const Icon = i.icon;
            return (
              <Card key={i.id} className="flex flex-col">
                <CardHeader>
                  <div
                    className={`flex size-10 items-center justify-center rounded-lg ${i.bg} ${i.accent}`}
                  >
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="text-base">{i.title}</CardTitle>
                  <CardDescription className="text-xs leading-relaxed">
                    {i.detail}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => toast.info(`${i.cta} — bientôt disponible`)}
                  >
                    <Lightbulb className="mr-1.5 size-4" />
                    {i.cta}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
