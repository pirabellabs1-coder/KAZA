import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  FileText,
  FileSignature,
  Download,
  FolderArchive,
  Sparkles,
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
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { listAgencyDocuments } from "@/lib/queries/agency-b2b";

export const metadata: Metadata = {
  title: "Mes documents — KAZA",
  description: "Contrats de bail de vos biens et modèles de contrats.",
};

export const dynamic = "force-dynamic";

const OWNER_ROLES = new Set(["OWNER", "AGENCY", "ADMIN"]);

// Modèles légaux (conformes droit béninois) — ce ne sont pas des données
// utilisateur ; ils ouvrent l'éditeur de contrat réel (/contracts/templates).
const CONTRACT_TEMPLATES = [
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
] as const;

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Brouillon",
  PENDING_TENANT: "En attente locataire",
  PENDING_OWNER: "En attente bailleur",
  SIGNED: "Signé",
  CANCELLED: "Annulé",
};

function frDate(v: string): string {
  return new Date(v).toLocaleDateString("fr-FR");
}

export default async function OwnerDocumentsPage() {
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login");
  if (!OWNER_ROLES.has(user.role)) redirect("/dashboard");

  // Contrats de bail réels sur les biens du propriétaire (owner_id = user.id).
  const allDocs = await listAgencyDocuments(user.id);
  const baux = allDocs.filter((d) => d.kind === "BAIL");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Mes documents
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Contrats de bail de vos biens et modèles prêts à personnaliser.
        </p>
      </div>

      {/* Contrats de bail réels */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-foreground">
          <FileText className="size-5 text-kaza-blue" />
          Contrats de bail
          <Badge variant="outline" className="ml-1 text-xs">
            {baux.length}
          </Badge>
        </h2>

        {baux.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <FolderArchive className="size-10 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                Aucun contrat de bail pour l&apos;instant
              </p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Les contrats se créent automatiquement à la signature d&apos;une
                location. Ils apparaîtront ici, téléchargeables.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {baux.map((d) => (
              <Card key={d.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {d.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Contrat de bail · {frDate(d.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-xs">
                      {STATUS_LABEL[d.status] ?? d.status}
                    </Badge>
                    {d.url ? (
                      <Button asChild size="sm" variant="outline" className="gap-1.5">
                        <a href={d.url} target="_blank" rel="noreferrer">
                          <Download className="size-3.5" /> Télécharger
                        </a>
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        PDF non disponible
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Modèles de contrats — ouvrent l'éditeur réel */}
      <section className="space-y-4">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-foreground">
            <FileSignature className="size-5 text-kaza-green" />
            Modèles de contrats
          </h2>
          <p className="text-xs text-muted-foreground">
            Modèles prêts à personnaliser dans l&apos;éditeur de contrat KAZA.
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
                  asChild
                  size="sm"
                  className="w-full bg-kaza-blue hover:bg-kaza-blue/90"
                >
                  <Link href="/contracts/templates">Personnaliser</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
