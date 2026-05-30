import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FileText, FileSignature, Download, FolderArchive } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { listAgencyDocuments } from "@/lib/queries/agency-b2b";

export const metadata: Metadata = {
  title: "Documents — KAZA Pro",
  description:
    "Contrats de bail et contrats de mandat de votre agence, centralisés.",
};

export const dynamic = "force-dynamic";

const ALLOWED = new Set(["AGENCY", "ADMIN"]);

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Brouillon",
  PENDING_TENANT: "En attente locataire",
  PENDING_OWNER: "En attente bailleur",
  SIGNED: "Signé",
  CANCELLED: "Annulé",
  PENDING: "En attente",
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
  TERMINATED: "Résilié",
  EXPIRED: "Expiré",
};

function frDate(v: string): string {
  return new Date(v).toLocaleDateString("fr-FR");
}

export default async function AgencyDocumentsPage() {
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login");
  if (!ALLOWED.has(user.role)) redirect("/dashboard");

  const docs = await listAgencyDocuments(user.id);
  const baux = docs.filter((d) => d.kind === "BAIL");
  const mandats = docs.filter((d) => d.kind === "MANDAT");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-bold text-kaza-navy sm:text-3xl">
          Documents
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Contrats de bail et de mandat de votre agence, centralisés et
          téléchargeables.
        </p>
      </header>

      {docs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-kaza-blue/10">
              <FolderArchive className="size-7 text-kaza-blue" aria-hidden="true" />
            </div>
            <p className="font-heading text-lg font-semibold text-kaza-navy">
              Aucun document pour le moment
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              Les contrats de bail (générés à la signature d&apos;une location) et
              vos contrats de mandat apparaîtront ici.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <DocSection
            title="Contrats de bail"
            icon={<FileText className="size-5 text-kaza-blue" />}
            docs={baux}
            statusLabel={STATUS_LABEL}
            frDate={frDate}
          />
          <DocSection
            title="Contrats de mandat"
            icon={<FileSignature className="size-5 text-kaza-green" />}
            docs={mandats}
            statusLabel={STATUS_LABEL}
            frDate={frDate}
          />
        </>
      )}
    </div>
  );
}

function DocSection({
  title,
  icon,
  docs,
  statusLabel,
  frDate,
}: {
  title: string;
  icon: React.ReactNode;
  docs: Awaited<ReturnType<typeof listAgencyDocuments>>;
  statusLabel: Record<string, string>;
  frDate: (v: string) => string;
}) {
  if (docs.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-foreground">
        {icon}
        {title}
        <Badge variant="outline" className="ml-1 text-xs">
          {docs.length}
        </Badge>
      </h2>
      <div className="grid gap-3">
        {docs.map((d) => (
          <Card key={`${d.kind}-${d.id}`}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{d.label}</p>
                <p className="text-xs text-muted-foreground">
                  {d.reference} · {frDate(d.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-xs">
                  {statusLabel[d.status] ?? d.status}
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
    </section>
  );
}
