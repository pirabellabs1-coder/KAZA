// =============================================================================
// KAZA — Admin / Demandes de partenariat (liste)
// Server component. Affiche les candidatures soumises via /partners#candidature
// (table `partner_applications`). Lecture seule : la prise de contact se fait
// par email (l'action publique notifie déjà l'équipe + le candidat).
// =============================================================================

import { Handshake, Mail, Phone } from "lucide-react";

import { PARTNER_TYPE_LABELS } from "@/lib/partners/constants";
import {
  listPartnerApplications,
  type PartnerApplicationStatus,
} from "@/lib/queries/partners-admin";
import { getCountryByCode } from "@/lib/geo/locations";
import { Badge } from "@/components/ui/badge";
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

const STATUS_LABELS: Record<PartnerApplicationStatus, string> = {
  PENDING: "En attente",
  REVIEWING: "En cours d'examen",
  APPROVED: "Approuvée",
  REJECTED: "Refusée",
};

const STATUS_CLASSES: Record<PartnerApplicationStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  REVIEWING: "bg-blue-100 text-blue-700 border-blue-200",
  APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatLocation(city: string, countryCode: string): string {
  const country = getCountryByCode(countryCode);
  return country ? `${city}, ${country.name}` : `${city} (${countryCode})`;
}

export default async function AdminPartnersPage() {
  const applications = await listPartnerApplications();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-kaza-navy lg:text-3xl">
          Demandes de partenariat
        </h1>
        <p className="text-sm text-muted-foreground">
          Candidatures reçues via la page publique{" "}
          <span className="font-medium text-kaza-navy">/partners</span>. Chaque
          candidature déclenche déjà un email à l&apos;équipe et une
          confirmation au candidat.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Handshake className="size-4 text-kaza-blue" />
            {applications.length} demande{applications.length > 1 ? "s" : ""} au
            total
          </CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-kaza-blue/10">
                <Handshake className="size-6 text-kaza-blue" />
              </div>
              <p className="text-base font-semibold text-kaza-navy">
                Aucune demande de partenariat
              </p>
              <p className="max-w-md text-sm text-muted-foreground">
                Les candidatures soumises depuis la page{" "}
                <span className="font-medium text-kaza-navy">
                  /partners#candidature
                </span>{" "}
                apparaîtront ici dès leur réception.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Société</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Localisation</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Reçue le</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <span className="font-medium text-kaza-navy">
                        {app.companyName}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm text-kaza-navy">
                          {app.contactName}
                        </span>
                        <a
                          href={`mailto:${app.email}`}
                          className="inline-flex items-center gap-1 text-xs text-kaza-blue hover:underline"
                        >
                          <Mail className="size-3" />
                          {app.email}
                        </a>
                        {app.phone && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="size-3" />
                            {app.phone}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-kaza-blue/30 bg-kaza-blue/5 text-xs font-semibold text-kaza-blue"
                      >
                        {PARTNER_TYPE_LABELS[app.partnerType] ??
                          app.partnerType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatLocation(app.city, app.countryCode)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs font-semibold",
                          STATUS_CLASSES[app.status] ??
                            "bg-gray-100 text-gray-700 border-gray-200",
                        )}
                      >
                        {STATUS_LABELS[app.status] ?? app.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(app.createdAt)}
                      </span>
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
