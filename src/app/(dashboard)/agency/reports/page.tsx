import type { Metadata } from "next";
import {
  Calendar as CalendarIcon,
  Mail,
  ShieldCheck,
  Sparkles,
  Plus,
  Archive,
  Newspaper,
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
import { cn } from "@/lib/utils";

// Fallback vide — à brancher quand la table agency_profiles sera en place.
const AGENCY_PROFILE = {
  email: "",
};

export const metadata: Metadata = {
  title: "Rapports — KAZA Pro Agence",
  description:
    "Générez et téléchargez vos rapports d'activité, financiers et de performance.",
};

// ---------------------------------------------------------------------------
// Options statiques (formulaire de génération)
// ---------------------------------------------------------------------------

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
      {/* HEADER */}
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
          <Button variant="outline" size="sm" disabled>
            <Archive className="size-4" /> Voir l&apos;archive
          </Button>
          <Button className="bg-kaza-blue hover:bg-kaza-blue/90" size="sm">
            <Plus className="size-4" /> Nouveau rapport
          </Button>
        </div>
      </div>

      {/* RAPPORTS PRÊTS — empty state */}
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
            0 disponible
          </Badge>
        </div>

        <Card className="rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-kaza-blue/10">
              <Newspaper className="size-7 text-kaza-blue" />
            </div>
            <p className="mt-4 font-heading text-base font-semibold text-kaza-navy">
              Aucun rapport généré pour le moment
            </p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Les rapports périodiques apparaîtront ici dès la fin du premier
              cycle de génération (mensuel, hebdomadaire ou personnalisé).
            </p>
          </CardContent>
        </Card>
      </section>

      {/* GÉNÉRER UN RAPPORT PERSONNALISÉ */}
      <Card className="rounded-2xl border-kaza-blue/20 bg-gradient-to-br from-kaza-blue/5 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading">
            <Sparkles className="size-5 text-kaza-blue" /> Générer un rapport
            personnalisé
          </CardTitle>
          <CardDescription>
            Choisissez le type, la période et le format. Le rapport sera
            disponible sous 60 secondes.
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
                    className="pl-9"
                    aria-label="Date de début"
                  />
                </div>
                <div className="relative">
                  <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="date"
                    name="to"
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

      {/* RAPPORTS PLANIFIÉS — empty state */}
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
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-kaza-blue/10">
              <Mail className="size-6 text-kaza-blue" />
            </div>
            <p className="mt-3 font-heading text-base font-semibold text-kaza-navy">
              Aucun rapport planifié
            </p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Programmez l&apos;envoi automatique de rapports (hebdo, mensuel)
              aux membres de votre équipe.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ARCHIVE — empty state */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading">
            <Archive className="size-5 text-kaza-blue" /> Archive
          </CardTitle>
          <CardDescription>
            Tous vos rapports générés — conservation 10 ans.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-kaza-blue/10">
              <Archive className="size-6 text-kaza-blue" />
            </div>
            <p className="mt-3 font-heading text-base font-semibold text-kaza-navy">
              Archive vide
            </p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Vos rapports archivés s&apos;afficheront ici dès qu&apos;un
              premier rapport aura été généré.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* CONFORMITÉ & RGPD */}
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
              Tous les rapports respectent la réglementation OHADA et l&apos;APDP
              Bénin. Les données personnelles incluses sont anonymisées dans les
              exports publics. Conservation 10 ans conformément au Code Général
              des Impôts. Pour exercer vos droits RGPD, contactez{" "}
              <a
                href={`mailto:dpo@${AGENCY_PROFILE.email.split("@")[1] ?? "kaza.africa"}`}
                className="font-medium text-kaza-blue underline-offset-2 hover:underline"
              >
                dpo@{AGENCY_PROFILE.email.split("@")[1] ?? "kaza.africa"}
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
