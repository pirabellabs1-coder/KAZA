import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Mail,
  Phone,
  Home,
  Coins,
  MessageSquare,
  ShieldAlert,
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
import { getAgencyTenantDetail } from "@/lib/queries/agency-b2b";
import { formatFcfa, getInitials } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Fiche locataire — KAZA",
};

export const dynamic = "force-dynamic";

const OWNER_ROLES = new Set(["OWNER", "AGENCY", "ADMIN"]);

const RENTAL_STATUS: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: "En cours", className: "bg-kaza-green/15 text-kaza-green" },
  PENDING: { label: "En attente", className: "bg-amber-100 text-amber-800" },
  COMPLETED: { label: "Terminé", className: "bg-slate-200 text-slate-600" },
  CANCELLED: { label: "Annulé", className: "bg-rose-100 text-rose-700" },
  TERMINATED: { label: "Résilié", className: "bg-rose-100 text-rose-700" },
};

export default async function OwnerTenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login");
  if (!OWNER_ROLES.has(user.role)) redirect("/dashboard");

  // owner_id des biens = id du propriétaire courant : requête déjà scopée.
  const tenant = await getAgencyTenantDetail(user.id, id);
  if (!tenant) notFound();

  const name = `${tenant.firstName} ${tenant.lastName}`.trim() || "Locataire";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5">
        <Link href="/owner/tenants">
          <ArrowLeft className="size-4" /> Tous mes locataires
        </Link>
      </Button>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-kaza-navy text-lg font-bold text-white">
          {getInitials(tenant.firstName || "L", tenant.lastName || " ")}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-bold text-kaza-navy">
              {name}
            </h1>
            {tenant.isVerified ? (
              <Badge className="gap-1 bg-kaza-green/15 text-kaza-green">
                <BadgeCheck className="size-3.5" /> Vérifié
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-muted-foreground">
                <ShieldAlert className="size-3.5" /> Non vérifié
              </Badge>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <a
              href={`mailto:${tenant.email}`}
              className="flex items-center gap-1 hover:text-kaza-navy"
            >
              <Mail className="size-3.5" /> {tenant.email}
            </a>
            {tenant.phone ? (
              <a
                href={`tel:${tenant.phone}`}
                className="flex items-center gap-1 hover:text-kaza-navy"
              >
                <Phone className="size-3.5" /> {tenant.phone}
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Home className="size-4 text-kaza-blue" /> Baux
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-2xl font-bold text-kaza-navy">
              {tenant.rentals.length}
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
              {formatFcfa(tenant.totalPaidFcfa)}
            </p>
            <p className="text-xs text-muted-foreground">
              {tenant.paymentsCount} paiement{tenant.paymentsCount > 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Baux chez vous</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tenant.rentals.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun bail enregistré pour ce locataire sur vos biens.
            </p>
          ) : (
            tenant.rentals.map((r) => {
              const st = RENTAL_STATUS[r.status] ?? {
                label: r.status,
                className: "bg-slate-100 text-slate-600",
              };
              return (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 p-3"
                >
                  <div>
                    <p className="font-medium text-foreground">{r.propertyTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.startDate
                        ? `Du ${new Date(r.startDate).toLocaleDateString("fr-FR")}`
                        : ""}
                      {r.endDate
                        ? ` au ${new Date(r.endDate).toLocaleDateString("fr-FR")}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-kaza-navy">
                      {formatFcfa(r.monthlyRent)}/mois
                    </span>
                    <Badge className={st.className}>{st.label}</Badge>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" className="gap-2">
          <Link href={`/messages?to=${tenant.id}`}>
            <MessageSquare className="size-4" /> Envoyer un message
          </Link>
        </Button>
        <Button asChild variant="outline" className="gap-2">
          <Link href="/owner/payments">
            <Coins className="size-4" /> Voir les paiements
          </Link>
        </Button>
      </div>
    </div>
  );
}
