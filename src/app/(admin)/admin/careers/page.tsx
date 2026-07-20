// =============================================================================
// Kaabo — Admin / Offres d'emploi (liste)
// Server component. Les actions Publier / Dépublier / Supprimer sont
// branchées via des <form action={serverAction}> ; aucun composant client
// nécessaire.
// =============================================================================

import Link from "next/link";
import {
  Briefcase,
  CheckCircle2,
  EyeOff,
  PencilLine,
  Plus,
  Trash2,
} from "lucide-react";

import {
  deleteJobOffer,
  publishJobOffer,
  unpublishJobOffer,
} from "@/actions/careers";
import { listAllJobOffers, type JobOffer } from "@/lib/queries/careers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<JobOffer["status"], string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publiée",
  CLOSED: "Fermée",
};

const STATUS_CLASSES: Record<JobOffer["status"], string> = {
  DRAFT: "bg-amber-100 text-amber-700 border-amber-200",
  PUBLISHED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CLOSED: "bg-gray-100 text-gray-700 border-gray-200",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Server actions wrappers : les <form action> attendent une signature
// `(formData: FormData) => Promise<void>`. On extrait l'id du FormData puis
// délègue aux server actions du module @/actions/careers.
async function handlePublish(formData: FormData) {
  "use server";
  const id = formData.get("id");
  if (typeof id === "string") {
    await publishJobOffer(id);
  }
}

async function handleUnpublish(formData: FormData) {
  "use server";
  const id = formData.get("id");
  if (typeof id === "string") {
    await unpublishJobOffer(id);
  }
}

async function handleDelete(formData: FormData) {
  "use server";
  const id = formData.get("id");
  if (typeof id === "string") {
    await deleteJobOffer(id);
  }
}

export default async function AdminCareersPage() {
  const offers = await listAllJobOffers();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-bold text-kaza-navy lg:text-3xl">
            Offres d&apos;emploi
          </h1>
          <p className="text-sm text-muted-foreground">
            Gérez les postes affichés publiquement sur{" "}
            <span className="font-medium text-kaza-navy">/carrieres</span>.
          </p>
        </div>
        <Button
          asChild
          className="bg-kaza-navy text-white hover:bg-kaza-navy/90"
        >
          <Link href="/admin/careers/new">
            <Plus className="mr-2 size-4" />
            Nouvelle offre
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Briefcase className="size-4 text-kaza-blue" />
            {offers.length} offre{offers.length > 1 ? "s" : ""} au total
          </CardTitle>
        </CardHeader>
        <CardContent>
          {offers.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-kaza-blue/10">
                <Briefcase className="size-6 text-kaza-blue" />
              </div>
              <p className="text-base font-semibold text-kaza-navy">
                Aucune offre d&apos;emploi
              </p>
              <p className="max-w-md text-sm text-muted-foreground">
                Créez votre première offre. Elle restera en brouillon tant que
                vous ne l&apos;aurez pas publiée.
              </p>
              <Button
                asChild
                className="mt-2 bg-kaza-navy text-white hover:bg-kaza-navy/90"
              >
                <Link href="/admin/careers/new">
                  <Plus className="mr-2 size-4" />
                  Créer une offre
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Département</TableHead>
                  <TableHead>Contrat</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date pub.</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers.map((offer) => (
                  <TableRow key={offer.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-kaza-navy">
                          {offer.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {offer.location}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{offer.department}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-kaza-blue/30 bg-kaza-blue/5 text-xs font-semibold text-kaza-blue"
                      >
                        {offer.contract}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs font-semibold",
                          STATUS_CLASSES[offer.status],
                        )}
                      >
                        {STATUS_LABELS[offer.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(offer.publishedAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          title="Éditer"
                        >
                          <Link href={`/admin/careers/${offer.id}`}>
                            <PencilLine className="size-4" />
                            <span className="sr-only">Éditer</span>
                          </Link>
                        </Button>
                        {offer.status === "PUBLISHED" ? (
                          <form action={handleUnpublish}>
                            <input
                              type="hidden"
                              name="id"
                              value={offer.id}
                            />
                            <Button
                              type="submit"
                              variant="ghost"
                              size="sm"
                              title="Dépublier"
                            >
                              <EyeOff className="size-4" />
                              <span className="sr-only">Dépublier</span>
                            </Button>
                          </form>
                        ) : (
                          <form action={handlePublish}>
                            <input
                              type="hidden"
                              name="id"
                              value={offer.id}
                            />
                            <Button
                              type="submit"
                              variant="ghost"
                              size="sm"
                              title="Publier"
                              className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                            >
                              <CheckCircle2 className="size-4" />
                              <span className="sr-only">Publier</span>
                            </Button>
                          </form>
                        )}
                        <form action={handleDelete}>
                          <input
                            type="hidden"
                            name="id"
                            value={offer.id}
                          />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            title="Supprimer"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="size-4" />
                            <span className="sr-only">Supprimer</span>
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
