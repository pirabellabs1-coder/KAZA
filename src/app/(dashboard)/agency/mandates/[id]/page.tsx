import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  FileSignature,
  Mail,
  Percent,
  Phone,
  Calendar,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { getAgencyMandate } from "@/lib/queries/agency-b2b";

export const metadata: Metadata = {
  title: "Détail du mandat — KAZA Pro",
};

export const dynamic = "force-dynamic";

const ALLOWED = new Set(["AGENCY", "ADMIN"]);

const TYPE_LABELS: Record<string, string> = {
  GESTION: "Gestion locative",
  LOCATION: "Mise en location",
  VENTE: "Vente",
  EXCLUSIF: "Mandat exclusif",
};

const STATUS_META: Record<string, { label: string; className: string }> = {
  PENDING: { label: "En attente", className: "bg-amber-100 text-amber-800" },
  ACTIVE: { label: "Actif", className: "bg-kaza-green/15 text-kaza-green" },
  SUSPENDED: { label: "Suspendu", className: "bg-slate-200 text-slate-700" },
  TERMINATED: { label: "Résilié", className: "bg-rose-100 text-rose-700" },
  EXPIRED: { label: "Expiré", className: "bg-slate-100 text-slate-500" },
};

function frDate(v: string | null): string {
  return v ? new Date(v).toLocaleDateString("fr-FR") : "—";
}

export default async function MandateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login");
  if (!ALLOWED.has(user.role)) redirect("/dashboard");

  const mandate = await getAgencyMandate(user.id, id);
  if (!mandate) notFound();

  const meta = STATUS_META[mandate.status] ?? STATUS_META.PENDING;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5">
        <Link href="/agency/mandates">
          <ArrowLeft className="size-4" /> Tous les mandats
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-kaza-navy">
            {mandate.ownerName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {TYPE_LABELS[mandate.mandateType] ?? mandate.mandateType}
            {mandate.isExclusive ? " · Exclusif" : ""}
          </p>
        </div>
        <Badge className={meta.className}>{meta.label}</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Commission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="flex items-center gap-2 font-heading text-2xl font-bold text-kaza-navy">
              <Percent className="size-5 text-kaza-blue" />
              {mandate.commissionRate}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Bien concerné
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Building2 className="size-4 text-kaza-blue" />
              {mandate.propertyTitle ?? "Aucun bien précis"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mandant</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {mandate.ownerEmail ? (
            <a
              href={`mailto:${mandate.ownerEmail}`}
              className="flex items-center gap-2 text-muted-foreground hover:text-kaza-navy"
            >
              <Mail className="size-4" /> {mandate.ownerEmail}
            </a>
          ) : null}
          {mandate.ownerPhone ? (
            <a
              href={`tel:${mandate.ownerPhone}`}
              className="flex items-center gap-2 text-muted-foreground hover:text-kaza-navy"
            >
              <Phone className="size-4" /> {mandate.ownerPhone}
            </a>
          ) : null}
          {!mandate.ownerEmail && !mandate.ownerPhone ? (
            <p className="text-muted-foreground">
              Coordonnées du mandant non renseignées.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conditions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Début :</span>
            <span className="font-medium">{frDate(mandate.startDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Fin :</span>
            <span className="font-medium">{frDate(mandate.endDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <FileSignature className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Signé le :</span>
            <span className="font-medium">{frDate(mandate.signedAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Créé le :</span>
            <span className="font-medium">{frDate(mandate.createdAt)}</span>
          </div>
          {mandate.notes ? (
            <div className="sm:col-span-2">
              <p className="mb-1 text-muted-foreground">Notes</p>
              <p className="whitespace-pre-line rounded-lg bg-muted/40 p-3">
                {mandate.notes}
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button asChild className="gap-2">
          <Link href="/contracts/templates">
            <FileSignature className="size-4" />
            Générer le contrat de mandat
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/agency/commissions">Voir mes commissions</Link>
        </Button>
      </div>
    </div>
  );
}
