import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  FileSignature,
  Home,
  Sofa,
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
  getTemplateById,
  type ContractTemplate,
} from "@/lib/contracts/templates";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Nouveau contrat — Choix du modèle",
};

const ICON_MAP: Record<string, LucideIcon> = {
  Sofa,
  Home,
  Users,
  Store,
};

const STEPS = [
  { id: 1, label: "Modèle", description: "Choix du type de bail" },
  { id: 2, label: "Bien", description: "Désignation du logement" },
  { id: 3, label: "Locataire", description: "Identification" },
  { id: 4, label: "Modalités", description: "Loyer et durée" },
  { id: 5, label: "Récapitulatif", description: "Validation et création" },
];

export default async function NewContractPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string; step?: string }>;
}) {
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login?redirect=/contracts/new");

  const params = await searchParams;
  const currentStep = params.template ? 2 : 1;
  const selectedTemplate = params.template
    ? getTemplateById(params.template)
    : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/contracts">
              <ArrowLeft className="mr-1.5 size-4" />
              Retour
            </Link>
          </Button>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/contracts/templates">Voir tous les modèles</Link>
        </Button>
      </div>

      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">
          Créer un nouveau contrat de bail
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Suivez les 5 étapes pour générer un contrat conforme à la Loi 2018-12 et au droit OHADA.
        </p>
      </div>

      {/* Stepper */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm sm:p-6">
        <ol className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {STEPS.map((step, idx) => {
            const isComplete = step.id < currentStep;
            const isActive = step.id === currentStep;
            const isLast = idx === STEPS.length - 1;
            return (
              <li
                key={step.id}
                className="flex flex-1 items-start gap-3 sm:flex-col sm:items-center sm:text-center"
              >
                <div className="flex flex-col items-center sm:w-full">
                  <div className="flex w-full items-center">
                    <span
                      className={cn(
                        "hidden h-px flex-1 sm:block",
                        isComplete || isActive ? "bg-kaza-navy" : "bg-border",
                        idx === 0 && "invisible"
                      )}
                    />
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold",
                        isComplete &&
                          "border-kaza-green bg-kaza-green text-white",
                        isActive &&
                          "border-kaza-navy bg-kaza-navy text-white",
                        !isComplete &&
                          !isActive &&
                          "border-border bg-white text-muted-foreground"
                      )}
                    >
                      {isComplete ? <Check className="size-4" /> : step.id}
                    </span>
                    <span
                      className={cn(
                        "hidden h-px flex-1 sm:block",
                        isComplete ? "bg-kaza-navy" : "bg-border",
                        isLast && "invisible"
                      )}
                    />
                  </div>
                </div>
                <div className="sm:mt-2">
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      isActive ? "text-kaza-navy" : "text-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Step 1 - Template selection */}
      {currentStep === 1 && (
        <section className="space-y-5">
          <div>
            <h2 className="font-heading text-xl font-bold">
              Étape 1 — Choisissez votre modèle de contrat
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sélectionnez le type de bail le mieux adapté à votre situation.
              Vous pourrez personnaliser toutes les clauses à l&apos;étape suivante.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {CONTRACT_TEMPLATES.map((t) => (
              <TemplateCard key={t.id} template={t} />
            ))}
          </div>
        </section>
      )}

      {/* Steps 2-5 placeholders */}
      {currentStep >= 2 && selectedTemplate && (
        <section className="space-y-6">
          <div className="rounded-2xl border-2 border-kaza-blue/20 bg-kaza-blue/5 p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-kaza-green" />
              <div>
                <p className="text-sm font-semibold text-kaza-navy">
                  Modèle sélectionné : {selectedTemplate.name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {selectedTemplate.description}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <Badge variant="secondary">
                    Durée {selectedTemplate.defaultDurationMonths} mois
                  </Badge>
                  <Badge variant="secondary">
                    Dépôt {selectedTemplate.defaultDepositMonths} mois
                  </Badge>
                  <Badge variant="secondary">
                    {selectedTemplate.sections.length} sections
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <PlaceholderStep
            stepNum={2}
            title="Sélection du bien à louer"
            description="Choisissez la propriété concernée dans votre portefeuille. Les informations seront pré-remplies automatiquement dans le contrat."
            fields={[
              "Recherche de propriété (autocomplete)",
              "Type, surface, nombre de pièces (auto)",
              "Adresse complète (auto)",
              "Photo principale (auto)",
            ]}
            active
          />

          {/* Step 3 */}
          <PlaceholderStep
            stepNum={3}
            title="Identification du locataire"
            description="Saisissez les informations légales du futur occupant. Un garant peut être ajouté en option."
            fields={[
              "Nom complet, date de naissance, lieu de naissance",
              "Numéro CNI / Passeport",
              "Profession, employeur, revenu mensuel",
              "Téléphone, email",
              "Garant solidaire (optionnel)",
            ]}
          />

          {/* Step 4 */}
          <PlaceholderStep
            stepNum={4}
            title="Modalités financières et durée"
            description="Définissez le loyer, les charges, le dépôt de garantie et la durée du bail."
            fields={[
              "Loyer mensuel HT (XOF)",
              "Provision mensuelle pour charges",
              `Dépôt de garantie (recommandé : ${selectedTemplate.defaultDepositMonths} mois)`,
              `Durée du bail (par défaut : ${selectedTemplate.defaultDurationMonths} mois)`,
              "Date de début (date de prise d'effet)",
              "Date de fin (auto-calculée)",
              "Mode de paiement principal",
              "Frais de dossier (optionnel)",
            ]}
          />

          {/* Step 5 */}
          <PlaceholderStep
            stepNum={5}
            title="Récapitulatif et création"
            description="Vérifiez toutes les informations avant de créer le brouillon de contrat. Vous pourrez encore tout modifier dans l'éditeur."
            fields={[
              "Aperçu des parties (bailleur / locataire / garant)",
              "Aperçu du bien et des modalités",
              "Liste des sections du contrat",
              "Conformité légale (checklist)",
            ]}
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Button variant="outline" asChild>
              <Link href="/contracts/new">
                <ArrowLeft className="mr-1.5 size-4" />
                Changer de modèle
              </Link>
            </Button>
            <Button
              className="bg-kaza-navy hover:bg-kaza-navy/90"
              size="lg"
              asChild
            >
              <Link
                href={`/contracts/ctr-003ijkl/edit?template=${selectedTemplate.id}`}
              >
                <FileSignature className="mr-2 size-4" />
                Créer le brouillon et accéder à l&apos;éditeur
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sous-composants
// ---------------------------------------------------------------------------

function TemplateCard({ template }: { template: ContractTemplate }) {
  const Icon = ICON_MAP[template.icon] ?? Home;
  const isRecommended = template.category === "RESIDENTIAL_UNFURNISHED";

  return (
    <Link
      href={`/contracts/new?template=${template.id}`}
      className="group block"
    >
      <Card className="h-full overflow-hidden border-2 transition-all hover:-translate-y-1 hover:border-kaza-navy/40 hover:shadow-lg">
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-kaza-navy text-white">
              <Icon className="size-7" />
            </div>
            {isRecommended && (
              <Badge className="bg-kaza-green text-white">Recommandé</Badge>
            )}
          </div>
          <div>
            <CardTitle className="text-lg leading-tight">
              {template.name}
            </CardTitle>
            <CardDescription className="mt-2 text-sm leading-relaxed">
              {template.description}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted/50 p-3 text-center text-xs">
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
          <p className="rounded-lg bg-kaza-blue/5 px-3 py-2 text-xs leading-relaxed text-kaza-navy/80">
            <span className="font-semibold">Base légale :</span>{" "}
            {template.legalBasis}
          </p>
          <div className="flex items-center justify-between text-sm font-medium text-kaza-blue transition-colors group-hover:text-kaza-navy">
            <span>Utiliser ce modèle</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function PlaceholderStep({
  stepNum,
  title,
  description,
  fields,
  active = false,
}: {
  stepNum: number;
  title: string;
  description: string;
  fields: string[];
  active?: boolean;
}) {
  return (
    <Card
      className={cn(
        "border-2 transition-opacity",
        active ? "border-kaza-blue/30" : "border-dashed opacity-60"
      )}
    >
      <CardHeader>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-full text-sm font-bold",
              active
                ? "bg-kaza-blue text-white"
                : "bg-muted text-muted-foreground"
            )}
          >
            {stepNum}
          </span>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {fields.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <Circle className="mt-1 size-3 shrink-0 text-muted-foreground/40" />
              {f}
            </li>
          ))}
        </ul>
        {!active && (
          <>
            <Separator className="my-4" />
            <p className="text-xs text-muted-foreground">
              Cette étape sera accessible après validation des précédentes.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
