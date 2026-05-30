import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Coins,
  FileText,
  Mail,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { getAgencyRentalDetail } from "@/lib/queries/agency-b2b";
import { formatFcfa } from "@/lib/utils";

import { TerminateRentalButton, RemindPaymentButton } from "./rental-actions";

export const metadata: Metadata = {
  title: "Détail du bail — KAZA Pro",
};

export const dynamic = "force-dynamic";

const ALLOWED = new Set(["AGENCY", "ADMIN"]);

const RENTAL_STATUS: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: "En cours", className: "bg-kaza-green/15 text-kaza-green" },
  PENDING: { label: "En attente", className: "bg-amber-100 text-amber-800" },
  COMPLETED: { label: "Terminé", className: "bg-slate-200 text-slate-600" },
  CANCELLED: { label: "Annulé", className: "bg-rose-100 text-rose-700" },
  TERMINATED: { label: "Résilié", className: "bg-rose-100 text-rose-700" },
};

const PAY_STATUS: Record<string, { label: string; className: string }> = {
  COMPLETED: { label: "Payé", className: "bg-kaza-green/15 text-kaza-green" },
  PENDING: { label: "En attente", className: "bg-amber-100 text-amber-800" },
  PROCESSING: { label: "En cours", className: "bg-blue-100 text-blue-700" },
  FAILED: { label: "Échoué", className: "bg-rose-100 text-rose-700" },
  REFUNDED: { label: "Remboursé", className: "bg-slate-200 text-slate-600" },
};

function frDate(v: string | null): string {
  return v ? new Date(v).toLocaleDateString("fr-FR") : "—";
}

export default async function AgencyRentalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login");
  if (!ALLOWED.has(user.role)) redirect("/dashboard");

  const rental = await getAgencyRentalDetail(user.id, id);
  if (!rental) notFound();

  const st = RENTAL_STATUS[rental.status] ?? {
    label: rental.status,
    className: "bg-slate-100 text-slate-600",
  };
  const ended = rental.status === "TERMINATED" || rental.status === "COMPLETED";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5">
        <Link href="/agency/rentals">
          <ArrowLeft className="size-4" /> Tous les baux
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-kaza-navy">
            <Building2 className="size-6 text-kaza-blue" />
            {rental.propertyTitle}
          </h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <User className="size-4" />
            <Link
              href={`/agency/tenants/${rental.tenantId}`}
              className="hover:text-kaza-navy hover:underline"
            >
              {rental.tenantName}
            </Link>
          </p>
        </div>
        <Badge className={st.className}>{st.label}</Badge>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Coins className="size-4 text-kaza-blue" /> Loyer mensuel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-2xl font-bold text-kaza-navy">
              {formatFcfa(rental.monthlyRent)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="size-4 text-kaza-green" /> Caution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-2xl font-bold text-kaza-navy">
              {rental.securityDeposit != null
                ? formatFcfa(rental.securityDeposit)
                : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Coins className="size-4 text-kaza-green" /> Total encaissé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-2xl font-bold text-kaza-navy">
              {formatFcfa(rental.totalCollected)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bail + locataire */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Début :</span>
            <span className="font-medium">{frDate(rental.startDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Fin :</span>
            <span className="font-medium">{frDate(rental.endDate)}</span>
          </div>
          {rental.tenantEmail ? (
            <a
              href={`mailto:${rental.tenantEmail}`}
              className="flex items-center gap-2 text-muted-foreground hover:text-kaza-navy"
            >
              <Mail className="size-4" /> {rental.tenantEmail}
            </a>
          ) : null}
          {rental.tenantPhone ? (
            <a
              href={`tel:${rental.tenantPhone}`}
              className="flex items-center gap-2 text-muted-foreground hover:text-kaza-navy"
            >
              <Phone className="size-4" /> {rental.tenantPhone}
            </a>
          ) : null}
          {rental.contractUrl ? (
            <a
              href={rental.contractUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-kaza-blue hover:underline sm:col-span-2"
            >
              <FileText className="size-4" /> Voir le contrat de bail
              {rental.contractStatus ? ` (${rental.contractStatus})` : ""}
            </a>
          ) : null}
        </CardContent>
      </Card>

      {/* Paiements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Paiements
            {rental.latePayments.length > 0 && (
              <Badge className="ml-2 bg-rose-100 text-rose-700">
                {rental.latePayments.length} en retard
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {rental.payments.length === 0 ? (
            <p className="px-6 text-sm text-muted-foreground">
              Aucun paiement enregistré pour ce bail.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rental.payments.map((p) => {
                    const ps = PAY_STATUS[p.status] ?? {
                      label: p.status,
                      className: "bg-slate-100 text-slate-600",
                    };
                    const isLate =
                      p.status === "PENDING" || p.status === "FAILED";
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="text-muted-foreground">
                          {frDate(p.paidAt ?? p.createdAt)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatFcfa(p.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge className={ps.className}>{ps.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {isLate ? (
                            <RemindPaymentButton paymentId={p.id} />
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <TerminateRentalButton rentalId={rental.id} disabled={ended} />
        <Button asChild variant="outline" className="gap-2">
          <Link href="/contracts/templates">
            <FileText className="size-4" /> Éditeur de contrat
          </Link>
        </Button>
      </div>
    </div>
  );
}
