"use client";

import {
  FileText,
  Upload,
  ClipboardCheck,
  Shield,
  Receipt,
  Home,
  FileArchive,
  Plus,
  Sparkles,
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
import { toast } from "@/components/ui/toast-helper";

// =============================================================================
// Templates de contrats — modèles légaux conformes droit béninois,
// disponibles à la personnalisation. Ce ne sont pas des données utilisateur.
// =============================================================================

type ContractTemplate = {
  id: string;
  title: string;
  description: string;
  badge?: string;
};

const CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    id: "tpl-standard",
    title: "Bail standard",
    description:
      "Contrat de location nu de 12 à 36 mois. Conforme à la loi béninoise n°2018-12.",
    badge: "Populaire",
  },
  {
    id: "tpl-meuble",
    title: "Bail meublé",
    description:
      "Location meublée avec inventaire détaillé. Idéal pour expatriés et professionnels.",
  },
  {
    id: "tpl-saisonnier",
    title: "Bail saisonnier",
    description:
      "Location courte durée (1 à 12 semaines). Adapté aux séjours touristiques.",
  },
];

// =============================================================================
// Documents légaux — checklist statique ; le statut "à jour / manquant" sera
// branché quand on aura une table `owner_documents` (téléversement Storage).
// =============================================================================

type LegalDoc = {
  id: string;
  title: string;
  description: string;
  icon: typeof Shield;
};

const LEGAL_DOCS: LegalDoc[] = [
  {
    id: "legal-attest",
    title: "Attestation de propriété",
    description: "Titre foncier et acte notarié des biens.",
    icon: Home,
  },
  {
    id: "legal-quit",
    title: "Quittances de loyer",
    description: "Justificatifs émis pour vos locataires.",
    icon: Receipt,
  },
  {
    id: "legal-fisc",
    title: "Reçus fiscaux",
    description: "Déclarations et paiements de l'impôt foncier.",
    icon: FileText,
  },
  {
    id: "legal-assur",
    title: "Assurance habitation",
    description: "Police PNO en cours de validité.",
    icon: Shield,
  },
];

export default function OwnerDocumentsPage() {
  const handleCustomize = (label: string) =>
    toast.info(`Personnalisation de "${label}" — éditeur en préparation.`);

  const handleUpload = (label: string) =>
    toast.info(`Téléversement de "${label}" — module à venir.`);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Mes documents
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Templates, états des lieux, documents légaux et archives.
        </p>
      </div>

      {/* Templates de contrats */}
      <section className="space-y-4">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Templates de contrats
          </h2>
          <p className="text-xs text-muted-foreground">
            Modèles prêts à personnaliser pour vos baux.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {CONTRACT_TEMPLATES.map((tpl) => (
            <Card key={tpl.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-kaza-blue/10 text-kaza-blue">
                    <FileText className="size-5" />
                  </div>
                  {tpl.badge && (
                    <Badge className="bg-kaza-green text-white hover:bg-kaza-green/90">
                      <Sparkles className="size-3" />
                      {tpl.badge}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-base">{tpl.title}</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  {tpl.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Button
                  size="sm"
                  className="w-full bg-kaza-blue hover:bg-kaza-blue/90"
                  onClick={() => handleCustomize(tpl.title)}
                >
                  Personnaliser
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* États des lieux */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground">
              États des lieux
            </h2>
            <p className="text-xs text-muted-foreground">
              Entrées et sorties consignées avec photos.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              toast.info("Le module EDL avec photos arrive bientôt.")
            }
          >
            <Plus className="mr-1.5 size-4" />
            Nouvel EDL
          </Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <ClipboardCheck className="size-10 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              Aucun état des lieux enregistré
            </p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Les EDL d&apos;entrée et de sortie s&apos;ajouteront automatiquement
              quand vous démarrerez ou clôturerez une location.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Documents légaux */}
      <section className="space-y-4">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Documents légaux
          </h2>
          <p className="text-xs text-muted-foreground">
            Pièces officielles obligatoires pour exercer en tant que bailleur.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {LEGAL_DOCS.map((doc) => {
            const Icon = doc.icon;
            return (
              <Card key={doc.id}>
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {doc.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {doc.description}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        À téléverser
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleUpload(doc.title)}
                    >
                      <Upload className="mr-1.5 size-3.5" />
                      Téléverser
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Archives */}
      <section className="space-y-4">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Archives
          </h2>
          <p className="text-xs text-muted-foreground">
            Factures, rapports et échanges (à venir).
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <FileArchive className="size-10 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              Aucune archive pour le moment
            </p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Téléversez vos factures, rapports de gestion et échanges. Ils
              seront retrouvables ici par date et catégorie.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
