import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Eye,
  FileText,
  HelpCircle,
  Home,
  PlusCircle,
  Scale,
  Sofa,
  Sparkles,
  Store,
  Users,
  type LucideIcon,
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
import { Separator } from "@/components/ui/separator";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import {
  CONTRACT_TEMPLATES,
  type ContractTemplate,
} from "@/lib/contracts/templates";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Bibliothèque de modèles de contrats",
};

const ICON_MAP: Record<string, LucideIcon> = {
  Sofa,
  Home,
  Users,
  Store,
};

const FAQ_ITEMS = [
  {
    q: "Quelle est la durée minimale légale d'un bail d'habitation au Bénin ?",
    a: "La Loi 2018-12 (art. 6 et 7) fixe les durées minimales suivantes : 3 ans pour un bail non meublé consenti par une personne physique, 6 ans pour un bail non meublé consenti par une personne morale, et 1 an pour un bail meublé.",
  },
  {
    q: "Quel est le montant maximum légal du dépôt de garantie ?",
    a: "L'article 19 de la Loi 2018-12 plafonne le dépôt de garantie à 1 mois de loyer hors charges pour un bail non meublé et à 2 mois pour un bail meublé. Pour les baux commerciaux OHADA, la pratique courante est de 3 mois.",
  },
  {
    q: "Quels sont les délais de préavis pour résilier un bail ?",
    a: "Pour le Locataire : 3 mois pour un bail non meublé, 1 mois pour un bail meublé. Pour le Bailleur : 6 mois (non meublé) ou 3 mois (meublé) avant l'échéance, et uniquement pour un motif légitime (reprise, vente, faute du locataire).",
  },
  {
    q: "Comment indexer légalement le loyer chaque année ?",
    a: "L'indexation s'effectue en fonction de la variation annuelle de l'Indice des Prix à la Consommation (IPC) publié par l'INSAE Bénin (art. 25 Loi 2018-12). Elle ne peut intervenir qu'une fois par an, à la date anniversaire du contrat, avec préavis écrit de 2 mois minimum.",
  },
  {
    q: "Une caution solidaire est-elle obligatoire ?",
    a: "Non, la caution solidaire n'est pas obligatoire mais fortement recommandée, en particulier pour les locataires étudiants ou en début de carrière. Elle doit faire l'objet d'un acte de cautionnement écrit, daté, signé et précisant le montant maximal garanti et la durée de l'engagement.",
  },
];

export default async function TemplatesGalleryPage() {
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login?redirect=/contracts/templates");

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild className="-ml-3">
          <Link href="/contracts">
            <ArrowLeft className="mr-1.5 size-4" />
            Retour aux contrats
          </Link>
        </Button>
        <div className="rounded-2xl border bg-gradient-to-br from-kaza-navy to-kaza-blue p-6 text-white sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BookOpen className="size-5" />
                <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
                  Bibliothèque Kaabo
                </span>
              </div>
              <h1 className="font-heading text-3xl font-bold sm:text-4xl">
                Modèles de contrats juridiques
              </h1>
              <p className="max-w-2xl text-sm text-white/85 sm:text-base">
                Modèles juridiques rédigés et conformes au droit béninois (Loi
                2018-12 portant régime juridique des baux à usage d&apos;habitation
                et Actes uniformes OHADA). Personnalisables, vérifiés, prêts à
                signer.
              </p>
            </div>
            <Button
              size="lg"
              className="bg-white text-kaza-navy hover:bg-white/90"
              asChild
            >
              <Link href="/contracts/new">
                <PlusCircle className="mr-2 size-4" />
                Nouveau contrat
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats légales */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBox icon={Scale} value="4" label="Modèles certifiés" />
        <StatBox icon={FileText} value="50+" label="Clauses légales" />
        <StatBox icon={Sparkles} value="100%" label="Conforme Loi 2018-12" />
        <StatBox icon={FileText} value="PDF" label="Export & e-signature" />
      </div>

      {/* Templates grid */}
      <section className="space-y-5">
        <div>
          <h2 className="font-heading text-2xl font-bold">
            Nos modèles juridiques
          </h2>
          <p className="text-sm text-muted-foreground">
            Sélectionnez le modèle adapté à votre type de location.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {CONTRACT_TEMPLATES.map((t) => (
            <TemplateDetailCard key={t.id} template={t} />
          ))}
        </div>
      </section>

      {/* Templates personnalisés */}
      <section>
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-kaza-blue/10 text-kaza-blue">
                <Sparkles className="size-6" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold">
                  Vos modèles personnalisés
                </h3>
                <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                  Créez vos propres modèles de contrat à partir d&apos;un modèle
                  existant, et réutilisez-les pour tous vos baux. Idéal pour les
                  agences et bailleurs multi-biens.
                </p>
              </div>
            </div>
            <Button
              asChild
              variant="outline"
              className="border-kaza-navy text-kaza-navy hover:bg-kaza-navy hover:text-white"
            >
              <Link href="/contracts/new">
                <PlusCircle className="mr-2 size-4" />
                Créer un modèle
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* FAQ légale */}
      <section className="space-y-5">
        <div className="flex items-center gap-2">
          <HelpCircle className="size-5 text-kaza-blue" />
          <h2 className="font-heading text-2xl font-bold">FAQ juridique</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {FAQ_ITEMS.map((item, i) => (
            <Card key={i} className="border-l-4 border-l-kaza-blue">
              <CardHeader className="pb-2">
                <CardTitle className="text-base leading-snug">
                  {item.q}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="rounded-2xl bg-muted/40 p-5 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Avertissement :</strong> Les
            modèles fournis sont des modèles types rédigés par des juristes,
            conformes au cadre légal béninois en vigueur au 27 mai 2026. Ils ne
            constituent pas un conseil juridique personnalisé. Pour des
            situations complexes (baux mixtes, sociétés, viager, etc.), nous
            vous recommandons de consulter un notaire ou un avocat. Kaabo
            propose un service de mise en relation avec des juristes
            partenaires.
          </p>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sous-composants
// ---------------------------------------------------------------------------

function StatBox({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
}) {
  return (
    <Card className="border-0 bg-white shadow-sm">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex size-10 items-center justify-center rounded-xl bg-kaza-blue/10 text-kaza-blue">
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function TemplateDetailCard({ template }: { template: ContractTemplate }) {
  const Icon = ICON_MAP[template.icon] ?? Home;
  const isRecommended = template.category === "RESIDENTIAL_UNFURNISHED";
  const categoryLabel = {
    RESIDENTIAL_FURNISHED: "Résidentiel meublé",
    RESIDENTIAL_UNFURNISHED: "Résidentiel non meublé",
    COLOCATION: "Colocation",
    COMMERCIAL: "Commercial OHADA",
  }[template.category];

  return (
    <Card className="flex h-full flex-col overflow-hidden border-2 transition-all hover:border-kaza-navy/30 hover:shadow-lg">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-kaza-navy text-white">
            <Icon className="size-7" />
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Badge
              variant="secondary"
              className="bg-kaza-blue/10 text-kaza-blue hover:bg-kaza-blue/10"
            >
              {categoryLabel}
            </Badge>
            {isRecommended && (
              <Badge className="bg-kaza-green text-white">Recommandé</Badge>
            )}
          </div>
        </div>
        <div>
          <CardTitle className="text-xl leading-tight">
            {template.name}
          </CardTitle>
          <CardDescription className="mt-2 text-sm leading-relaxed">
            {template.description}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col space-y-4">
        {/* Stats */}
        <div
          className={cn(
            "grid grid-cols-3 gap-2 rounded-xl bg-muted/50 p-3 text-center text-xs"
          )}
        >
          <div>
            <p className="font-semibold text-foreground">
              {template.defaultDurationMonths} mois
            </p>
            <p className="text-muted-foreground">Durée</p>
          </div>
          <div className="border-l border-r">
            <p className="font-semibold text-foreground">
              {template.defaultDepositMonths} mois
            </p>
            <p className="text-muted-foreground">Dépôt</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">
              {template.sections.length}
            </p>
            <p className="text-muted-foreground">Sections</p>
          </div>
        </div>

        {/* Base légale */}
        <div className="rounded-lg bg-muted/30 p-3 text-xs">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Base légale
          </p>
          <p className="leading-relaxed text-foreground/85">
            {template.legalBasis}
          </p>
        </div>

        {/* Sections preview */}
        <div className="text-xs">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Sections incluses ({template.sections.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {template.sections.slice(0, 6).map((s) => (
              <span
                key={s.id}
                className="rounded-full border bg-white px-2 py-0.5 text-[11px] text-foreground"
              >
                {s.title}
              </span>
            ))}
            {template.sections.length > 6 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                +{template.sections.length - 6} autres
              </span>
            )}
          </div>
        </div>

        <Separator className="mt-auto" />

        {/* Actions */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            asChild
            className="flex-1 bg-kaza-navy hover:bg-kaza-navy/90"
          >
            <Link href={`/contracts/new?template=${template.id}`}>
              Utiliser ce modèle
              <ArrowRight className="ml-1.5 size-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/contracts/ctr-003ijkl/preview?template=${template.id}`}>
              <Eye className="mr-1.5 size-4" />
              Aperçu
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
