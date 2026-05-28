import type { Metadata } from "next";
import {
  Newspaper,
  FileText,
  TrendingUp,
  Users,
  Building2,
  Receipt,
  Download,
  FileSpreadsheet,
  Calendar as CalendarIcon,
  Mail,
  ShieldCheck,
  Clock,
  Sparkles,
  Plus,
  Archive,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { AGENCY_PROFILE } from "@/lib/mock/agency-data";

export const metadata: Metadata = {
  title: "Rapports — KAZA Pro Agence",
  description:
    "Générez et téléchargez vos rapports d'activité, financiers et de performance.",
};

// ---------------------------------------------------------------------------
// Données mockées (statiques pour cette page)
// ---------------------------------------------------------------------------

const READY_REPORTS = [
  {
    id: "r-pnl-05",
    title: "P&L Mai 2026",
    description: "Compte de résultat consolidé du mois en cours.",
    icon: Receipt,
    color: "bg-emerald-100 text-emerald-700",
    generatedAt: "2026-05-27 06:00",
    size: "1,2 Mo",
  },
  {
    id: "r-activity-05",
    title: "Rapport activité mensuel",
    description: "Synthèse des visites, signatures et leads de mai 2026.",
    icon: Newspaper,
    color: "bg-blue-100 text-blue-700",
    generatedAt: "2026-05-27 06:05",
    size: "2,8 Mo",
  },
  {
    id: "r-commissions-05",
    title: "Commissions agents Mai 2026",
    description: "Détail des commissions individuelles par agent.",
    icon: Users,
    color: "bg-purple-100 text-purple-700",
    generatedAt: "2026-05-27 06:10",
    size: "640 Ko",
  },
  {
    id: "r-perf-q1",
    title: "Performance annonces Q1 2026",
    description: "Top annonces, vues, contacts et taux de conversion.",
    icon: TrendingUp,
    color: "bg-amber-100 text-amber-700",
    generatedAt: "2026-04-02 09:30",
    size: "3,4 Mo",
  },
  {
    id: "r-pipeline-05",
    title: "Pipeline leads détaillé",
    description: "État du CRM par étape, par agent et par source.",
    icon: FileText,
    color: "bg-rose-100 text-rose-700",
    generatedAt: "2026-05-26 18:00",
    size: "1,7 Mo",
  },
  {
    id: "r-portfolio",
    title: "État du portefeuille",
    description: "Inventaire complet des 147 biens gérés au 27 mai.",
    icon: Building2,
    color: "bg-cyan-100 text-cyan-700",
    generatedAt: "2026-05-27 06:15",
    size: "4,1 Mo",
  },
];

const SCHEDULED_REPORTS = [
  {
    id: "s-1",
    name: "Rapport hebdo équipe",
    frequency: "Tous les lundis 08h00",
    recipients: "aicha@premier-immobilier.bj",
    format: "PDF",
    status: "Actif",
  },
  {
    id: "s-2",
    name: "Synthèse commissions",
    frequency: "1er du mois 06h00",
    recipients: "pierre@premier-immobilier.bj",
    format: "Excel",
    status: "Actif",
  },
  {
    id: "s-3",
    name: "Pipeline leads",
    frequency: "Tous les vendredis 17h00",
    recipients: "aicha@, komi@, sandra@",
    format: "PDF",
    status: "Actif",
  },
  {
    id: "s-4",
    name: "État du portefeuille",
    frequency: "Le 15 de chaque mois 09h00",
    recipients: "direction@premier-immobilier.bj",
    format: "Excel",
    status: "En pause",
  },
];

const ARCHIVED_REPORTS = [
  {
    id: "a-1",
    date: "2026-05-26",
    type: "Activité hebdo",
    generatedBy: "Aïcha Toko",
    size: "1,4 Mo",
    format: "PDF",
  },
  {
    id: "a-2",
    date: "2026-05-20",
    type: "Pipeline leads",
    generatedBy: "Automatique",
    size: "1,6 Mo",
    format: "PDF",
  },
  {
    id: "a-3",
    date: "2026-05-15",
    type: "État portefeuille",
    generatedBy: "Automatique",
    size: "4,0 Mo",
    format: "Excel",
  },
  {
    id: "a-4",
    date: "2026-05-13",
    type: "Activité hebdo",
    generatedBy: "Aïcha Toko",
    size: "1,3 Mo",
    format: "PDF",
  },
  {
    id: "a-5",
    date: "2026-05-06",
    type: "Activité hebdo",
    generatedBy: "Aïcha Toko",
    size: "1,3 Mo",
    format: "PDF",
  },
  {
    id: "a-6",
    date: "2026-05-01",
    type: "P&L Avril 2026",
    generatedBy: "Pierre Kpondéhou",
    size: "1,1 Mo",
    format: "PDF",
  },
  {
    id: "a-7",
    date: "2026-05-01",
    type: "Commissions Avril",
    generatedBy: "Pierre Kpondéhou",
    size: "580 Ko",
    format: "Excel",
  },
  {
    id: "a-8",
    date: "2026-04-29",
    type: "Activité hebdo",
    generatedBy: "Aïcha Toko",
    size: "1,2 Mo",
    format: "PDF",
  },
  {
    id: "a-9",
    date: "2026-04-22",
    type: "Activité hebdo",
    generatedBy: "Aïcha Toko",
    size: "1,2 Mo",
    format: "PDF",
  },
  {
    id: "a-10",
    date: "2026-04-15",
    type: "État portefeuille",
    generatedBy: "Automatique",
    size: "3,9 Mo",
    format: "Excel",
  },
];

const REPORT_TYPES = [
  { value: "financial", label: "Financier" },
  { value: "activity", label: "Activité" },
  { value: "performance", label: "Performance" },
  { value: "commissions", label: "Commissions" },
  { value: "custom", label: "Personnalisé" },
];

const FORMAT_OPTIONS = [
  { value: "pdf", label: "PDF", desc: "Pour partage et impression" },
  { value: "excel", label: "Excel", desc: "Pour analyse et retraitement" },
  { value: "csv", label: "CSV", desc: "Pour import dans d'autres outils" },
];

const INCLUDE_OPTIONS = [
  { id: "charts", label: "Graphiques", default: true },
  { id: "tables", label: "Tableaux détaillés", default: true },
  { id: "annexes", label: "Annexes", default: false },
  { id: "branding", label: "Logo agence", default: true },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AgencyReportsPage() {
  return (
    <div className="space-y-8">
      {/* ============================================================== */}
      {/* HEADER                                                          */}
      {/* ============================================================== */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-kaza-navy">
            Rapports
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Générez des rapports professionnels et exportez vers Excel ou PDF.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Archive className="size-4" /> Voir l'archive
          </Button>
          <Button className="bg-kaza-blue hover:bg-kaza-blue/90" size="sm">
            <Plus className="size-4" /> Nouveau rapport
          </Button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* RAPPORTS PRÊTS                                                  */}
      {/* ============================================================== */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-xl font-bold text-kaza-navy">
              Rapports prêts à télécharger
            </h2>
            <p className="text-sm text-muted-foreground">
              Générés automatiquement chaque jour à 06h00.
            </p>
          </div>
          <Badge variant="secondary" className="bg-kaza-blue/10 text-kaza-blue">
            {READY_REPORTS.length} disponibles
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {READY_REPORTS.map((r) => {
            const Icon = r.icon;
            return (
              <Card
                key={r.id}
                className="rounded-2xl border bg-card shadow-sm transition-all hover:border-kaza-blue/40 hover:shadow-md"
              >
                <CardContent className="flex h-full flex-col p-5">
                  <div className="flex items-start justify-between">
                    <span
                      className={cn(
                        "flex size-11 items-center justify-center rounded-xl",
                        r.color,
                      )}
                    >
                      <Icon className="size-5" />
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {r.size}
                    </Badge>
                  </div>
                  <div className="mt-4 flex-1">
                    <h3 className="font-heading text-base font-bold text-kaza-navy">
                      {r.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {r.description}
                    </p>
                    <p className="mt-3 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="size-3" />
                      Généré le {r.generatedAt}
                    </p>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-2 border-t pt-4">
                    <Button variant="outline" size="sm">
                      <FileText className="size-4" /> PDF
                    </Button>
                    <Button
                      size="sm"
                      className="bg-kaza-green text-white hover:bg-kaza-green/90"
                    >
                      <FileSpreadsheet className="size-4" /> Excel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ============================================================== */}
      {/* GÉNÉRER UN RAPPORT PERSONNALISÉ                                 */}
      {/* ============================================================== */}
      <Card className="rounded-2xl border-kaza-blue/20 bg-gradient-to-br from-kaza-blue/5 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading">
            <Sparkles className="size-5 text-kaza-blue" /> Générer un rapport personnalisé
          </CardTitle>
          <CardDescription>
            Choisissez le type, la période et le format. Le rapport sera disponible
            sous 60 secondes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-6 lg:grid-cols-2">
            {/* Type de rapport */}
            <div className="space-y-2">
              <label
                htmlFor="report-type"
                className="text-sm font-semibold text-kaza-navy"
              >
                Type de rapport
              </label>
              <select
                id="report-type"
                name="type"
                defaultValue="activity"
                className="flex h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm focus:border-kaza-blue focus:outline-none focus:ring-2 focus:ring-kaza-blue/20"
              >
                {REPORT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Période */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-kaza-navy">
                Période
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="date"
                    name="from"
                    defaultValue="2026-05-01"
                    className="pl-9"
                    aria-label="Date de début"
                  />
                </div>
                <div className="relative">
                  <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="date"
                    name="to"
                    defaultValue="2026-05-27"
                    className="pl-9"
                    aria-label="Date de fin"
                  />
                </div>
              </div>
            </div>

            {/* Format */}
            <div className="space-y-2 lg:col-span-1">
              <p className="text-sm font-semibold text-kaza-navy">Format</p>
              <div className="space-y-2">
                {FORMAT_OPTIONS.map((opt, idx) => (
                  <label
                    key={opt.value}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border bg-white p-3 transition-colors hover:border-kaza-blue/40",
                      idx === 0 && "border-kaza-blue ring-1 ring-kaza-blue/20",
                    )}
                  >
                    <input
                      type="radio"
                      name="format"
                      value={opt.value}
                      defaultChecked={idx === 0}
                      className="mt-0.5 accent-kaza-blue"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {opt.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Inclure */}
            <div className="space-y-2 lg:col-span-1">
              <p className="text-sm font-semibold text-kaza-navy">Inclure</p>
              <div className="grid grid-cols-2 gap-2">
                {INCLUDE_OPTIONS.map((opt) => (
                  <label
                    key={opt.id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border bg-white p-3 hover:border-kaza-blue/40"
                  >
                    <input
                      type="checkbox"
                      name={opt.id}
                      defaultChecked={opt.default}
                      className="size-4 accent-kaza-blue"
                    />
                    <span className="text-sm text-foreground">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Action */}
            <div className="flex items-center justify-end gap-2 lg:col-span-2">
              <Button type="button" variant="outline">
                Réinitialiser
              </Button>
              <Button type="submit" className="bg-kaza-blue hover:bg-kaza-blue/90">
                <Sparkles className="size-4" /> Générer le rapport
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ============================================================== */}
      {/* RAPPORTS PLANIFIÉS                                              */}
      {/* ============================================================== */}
      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 font-heading">
              <Mail className="size-5 text-kaza-blue" /> Rapports planifiés
            </CardTitle>
            <CardDescription>
              Rapports envoyés automatiquement par e-mail.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Plus className="size-4" /> Planifier
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Fréquence</TableHead>
                <TableHead>Destinataires</TableHead>
                <TableHead>Format</TableHead>
                <TableHead className="text-right">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SCHEDULED_REPORTS.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium text-foreground">
                    {r.name}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3.5" />
                      {r.frequency}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.recipients}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{r.format}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      className={cn(
                        r.status === "Actif"
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-100",
                      )}
                    >
                      {r.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ============================================================== */}
      {/* ARCHIVE                                                         */}
      {/* ============================================================== */}
      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 font-heading">
              <Archive className="size-5 text-kaza-blue" /> Archive
            </CardTitle>
            <CardDescription>
              Les 10 derniers rapports générés. Conservation 10 ans.
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm">
            Voir tout
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Généré par</TableHead>
                <TableHead>Format</TableHead>
                <TableHead className="text-right">Taille</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ARCHIVED_REPORTS.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm font-medium text-kaza-navy tabular-nums">
                    {new Date(r.date).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-sm text-foreground">
                    {r.type}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.generatedBy}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{r.format}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground tabular-nums">
                    {r.size}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Download className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ============================================================== */}
      {/* CONFORMITÉ & RGPD                                               */}
      {/* ============================================================== */}
      <Card className="rounded-2xl border-muted bg-muted/30">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-kaza-navy/10 text-kaza-navy">
            <ShieldCheck className="size-5" />
          </span>
          <div className="flex-1 space-y-2">
            <h3 className="font-heading text-base font-bold text-kaza-navy">
              Conformité & RGPD
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Tous les rapports respectent la réglementation OHADA et l'APDP Bénin.
              Les données personnelles incluses sont anonymisées dans les exports
              publics. Conservation 10 ans conformément au Code Général des Impôts.
              Pour exercer vos droits RGPD, contactez{" "}
              <a
                href={`mailto:dpo@${AGENCY_PROFILE.email.split("@")[1]}`}
                className="font-medium text-kaza-blue underline-offset-2 hover:underline"
              >
                dpo@{AGENCY_PROFILE.email.split("@")[1]}
              </a>
              .
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Badge variant="outline" className="border-kaza-navy/30 text-kaza-navy">
                <ShieldCheck className="size-3" /> RGPD compliant
              </Badge>
              <Badge variant="outline" className="border-kaza-navy/30 text-kaza-navy">
                Norme OHADA
              </Badge>
              <Badge variant="outline" className="border-kaza-navy/30 text-kaza-navy">
                APDP Bénin
              </Badge>
              <Badge variant="outline" className="border-kaza-navy/30 text-kaza-navy">
                Chiffrement AES-256
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
