"use client";

import {
  FileText,
  Download,
  Upload,
  Eye,
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

type EdlEntry = {
  id: string;
  property: string;
  date: string;
  type: "ENTREE" | "SORTIE";
  tenant: string;
};

const EDL_LIST: EdlEntry[] = [
  {
    id: "edl-001",
    property: "Villa Fidjrossè 4 pièces",
    date: "2025-01-15",
    type: "ENTREE",
    tenant: "Fatou Diallo",
  },
  {
    id: "edl-002",
    property: "Studio Cadjehoun",
    date: "2024-08-31",
    type: "SORTIE",
    tenant: "Aïcha Bello",
  },
  {
    id: "edl-003",
    property: "Studio Cadjehoun",
    date: "2024-09-01",
    type: "ENTREE",
    tenant: "Kossi Adjovi",
  },
  {
    id: "edl-004",
    property: "Appartement Akpakpa 3 pièces",
    date: "2025-02-28",
    type: "SORTIE",
    tenant: "Kwame Asante",
  },
  {
    id: "edl-005",
    property: "Maison Calavi 5 pièces",
    date: "2024-06-01",
    type: "ENTREE",
    tenant: "Yaovi Komlan",
  },
];

type LegalDoc = {
  id: string;
  title: string;
  description: string;
  icon: typeof Shield;
  status: "OK" | "MANQUANT";
};

const LEGAL_DOCS: LegalDoc[] = [
  {
    id: "legal-attest",
    title: "Attestation de propriété",
    description: "Titre foncier et acte notarié des biens.",
    icon: Home,
    status: "OK",
  },
  {
    id: "legal-quit",
    title: "Quittances de loyer",
    description: "Justificatifs émis pour vos locataires.",
    icon: Receipt,
    status: "OK",
  },
  {
    id: "legal-fisc",
    title: "Reçus fiscaux",
    description: "Déclarations et paiements de l'impôt foncier.",
    icon: FileText,
    status: "MANQUANT",
  },
  {
    id: "legal-assur",
    title: "Assurance habitation",
    description: "Police PNO en cours de validité.",
    icon: Shield,
    status: "OK",
  },
];

type Archive = {
  id: string;
  name: string;
  date: string;
  size: string;
  category: "facture" | "rapport" | "echange";
};

const ARCHIVES: Archive[] = [
  {
    id: "arc-001",
    name: "Facture-plombier-mars-2026.pdf",
    date: "2026-03-12",
    size: "184 Ko",
    category: "facture",
  },
  {
    id: "arc-002",
    name: "Rapport-gestion-T4-2025.pdf",
    date: "2026-01-08",
    size: "612 Ko",
    category: "rapport",
  },
  {
    id: "arc-003",
    name: "Echange-mail-locataire-fidjrosse.eml",
    date: "2025-12-20",
    size: "23 Ko",
    category: "echange",
  },
  {
    id: "arc-004",
    name: "Facture-electricite-SBEE-nov-2025.pdf",
    date: "2025-11-30",
    size: "98 Ko",
    category: "facture",
  },
  {
    id: "arc-005",
    name: "Rapport-vacance-locative-2025.pdf",
    date: "2025-10-15",
    size: "344 Ko",
    category: "rapport",
  },
  {
    id: "arc-006",
    name: "Facture-peinture-akpakpa.pdf",
    date: "2025-09-04",
    size: "156 Ko",
    category: "facture",
  },
  {
    id: "arc-007",
    name: "Echange-agence-recherche-locataire.pdf",
    date: "2025-08-22",
    size: "412 Ko",
    category: "echange",
  },
  {
    id: "arc-008",
    name: "Rapport-annuel-2024.pdf",
    date: "2025-01-15",
    size: "1.2 Mo",
    category: "rapport",
  },
];

function formatDateFr(d: string): string {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function categoryLabel(c: Archive["category"]): string {
  return c === "facture"
    ? "Facture"
    : c === "rapport"
      ? "Rapport"
      : "Échange";
}

export default function OwnerDocumentsPage() {
  const downloadDemo = (label: string) =>
    toast.success(`Téléchargement de "${label}" lancé (démo)`);

  const customizeDemo = (label: string) =>
    toast.info(`Ouverture de l'éditeur "${label}" (bientôt disponible)`);

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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Templates de contrats
            </h2>
            <p className="text-xs text-muted-foreground">
              Modèles prêts à personnaliser pour vos baux.
            </p>
          </div>
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
              <CardContent className="mt-auto flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-kaza-blue hover:bg-kaza-blue/90"
                  onClick={() => customizeDemo(tpl.title)}
                >
                  Personnaliser
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadDemo(tpl.title)}
                  aria-label={`Télécharger ${tpl.title}`}
                >
                  <Download className="size-4" />
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
          <CardContent className="p-0">
            <ul className="divide-y">
              {EDL_LIST.map((edl) => (
                <li
                  key={edl.id}
                  className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-muted/30"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-kaza-navy/10 text-kaza-navy">
                      <ClipboardCheck className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {edl.property}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {edl.tenant} · {formatDateFr(edl.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge
                      className={
                        edl.type === "ENTREE"
                          ? "bg-kaza-green text-white hover:bg-kaza-green/90"
                          : "bg-kaza-warning text-white hover:bg-kaza-warning/90"
                      }
                    >
                      {edl.type === "ENTREE" ? "Entrée" : "Sortie"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Voir l'EDL"
                      onClick={() => downloadDemo(`EDL ${edl.property}`)}
                    >
                      <Eye className="size-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
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
                  <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
                      doc.status === "OK"
                        ? "bg-kaza-green/10 text-kaza-green"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
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
                      <Badge
                        variant={doc.status === "OK" ? "default" : "outline"}
                        className={
                          doc.status === "OK"
                            ? "bg-kaza-green text-white hover:bg-kaza-green/90"
                            : "border-amber-300 text-amber-700"
                        }
                      >
                        {doc.status === "OK" ? "À jour" : "Manquant"}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() =>
                          toast.success(`${doc.title} téléversé (démo)`)
                        }
                      >
                        <Upload className="mr-1.5 size-3.5" />
                        Téléverser
                      </Button>
                      {doc.status === "OK" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => downloadDemo(doc.title)}
                        >
                          <Eye className="mr-1.5 size-3.5" />
                          Voir
                        </Button>
                      )}
                    </div>
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
            Factures, rapports et échanges des 24 derniers mois.
          </p>
        </div>
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {ARCHIVES.map((file) => (
                <li
                  key={file.id}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-muted/30"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <FileArchive className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">
                        {file.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {categoryLabel(file.category)} · {formatDateFr(file.date)}{" "}
                        · {file.size}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Télécharger"
                    onClick={() => downloadDemo(file.name)}
                  >
                    <Download className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
