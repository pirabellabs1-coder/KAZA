import type { Metadata } from "next";
import {
  Mail,
  ShieldCheck,
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
import { ReportGenerator } from "@/components/reports/report-generator";

export const metadata: Metadata = {
  title: "Rapports — Kaabo Pro Agence",
  description:
    "Générez et téléchargez vos rapports d'activité, financiers et de performance.",
};

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
          <Button
            className="bg-kaza-blue hover:bg-kaza-blue/90"
            size="sm"
            disabled
            title="La génération de rapports personnalisés arrive bientôt"
          >
            <Plus className="size-4" /> Nouveau rapport (bientôt)
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

      {/* GÉNÉRER UN RAPPORT — générateur réel (CSV/Excel) */}
      <ReportGenerator
        space="agency"
        types={[
          { value: "financial", label: "Financier (loyers)" },
          { value: "activity", label: "Activité (visites)" },
          { value: "commissions", label: "Commissions" },
        ]}
      />

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
          <Button
            variant="outline"
            size="sm"
            disabled
            title="L'envoi automatique de rapports par e-mail arrive bientôt"
          >
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
                href="mailto:immobilierkaza@gmail.com"
                className="font-medium text-kaza-blue underline-offset-2 hover:underline"
              >
                immobilierkaza@gmail.com
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
