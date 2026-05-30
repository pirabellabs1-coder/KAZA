// =============================================================================
// KAZA — Admin / Signalements (liste)
// Server component. Affiche les signalements de contenu soumis via le bouton
// public `ReportButton` (table `reports`). L'admin peut marquer un signalement
// comme traité (statut RESOLVED) via la server action `resolveReport`.
// =============================================================================

import { Flag } from "lucide-react";

import {
  listReports,
  type ReportStatus,
} from "@/lib/queries/reports-admin";
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

import { ResolveReportButton } from "./resolve-report-button";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<ReportStatus, string> = {
  PENDING: "En attente",
  REVIEWED: "Examiné",
  RESOLVED: "Traité",
  DISMISSED: "Rejeté",
};

const STATUS_CLASSES: Record<ReportStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  REVIEWED: "bg-blue-100 text-blue-700 border-blue-200",
  RESOLVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  DISMISSED: "bg-gray-100 text-gray-700 border-gray-200",
};

const TARGET_TYPE_LABELS: Record<string, string> = {
  property: "Annonce",
  review: "Avis",
  user: "Utilisateur",
  message: "Message",
  other: "Autre",
};

const REASON_LABELS: Record<string, string> = {
  fake: "Fausse annonce",
  fraud: "Fraude / arnaque",
  inappropriate: "Contenu inapproprié",
  spam: "Spam",
  other: "Autre",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isClosed(status: ReportStatus): boolean {
  return status === "RESOLVED" || status === "DISMISSED";
}

export default async function AdminReportsPage() {
  const reports = await listReports();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-kaza-navy lg:text-3xl">
          Signalements
        </h1>
        <p className="text-sm text-muted-foreground">
          Contenus signalés par les utilisateurs (annonces, avis, profils,
          messages). Examinez chaque signalement et marquez-le comme traité.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Flag className="size-4 text-kaza-blue" />
            {reports.length} signalement{reports.length > 1 ? "s" : ""} au total
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-kaza-blue/10">
                <Flag className="size-6 text-kaza-blue" />
              </div>
              <p className="text-base font-semibold text-kaza-navy">
                Aucun signalement
              </p>
              <p className="max-w-md text-sm text-muted-foreground">
                Les contenus signalés par les utilisateurs depuis la plateforme
                apparaîtront ici dès leur réception.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Cible</TableHead>
                  <TableHead>Raison</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Reçu le</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-kaza-blue/30 bg-kaza-blue/5 text-xs font-semibold text-kaza-blue"
                      >
                        {TARGET_TYPE_LABELS[report.targetType] ??
                          report.targetType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-xs text-kaza-navy">
                          {report.targetId ?? "—"}
                        </span>
                        {report.details && (
                          <span className="max-w-[280px] truncate text-xs text-muted-foreground">
                            {report.details}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {REASON_LABELS[report.reason] ?? report.reason}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs font-semibold",
                          STATUS_CLASSES[report.status] ??
                            "bg-gray-100 text-gray-700 border-gray-200",
                        )}
                      >
                        {STATUS_LABELS[report.status] ?? report.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(report.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {isClosed(report.status) ? (
                        <span className="text-xs text-muted-foreground">
                          Clôturé
                        </span>
                      ) : (
                        <ResolveReportButton reportId={report.id} />
                      )}
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
