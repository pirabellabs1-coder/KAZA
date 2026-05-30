import type { Metadata } from "next";
import {
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  CalendarDays,
  ClipboardList,
  CreditCard,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = {
  title: "Demandes de Colocation",
};

// Aucune fausse demande : les demandes de colocation réelles de l'étudiant
// s'afficheront ici (table roommate_members / colocation_requests). En attendant
// un branchement complet, on n'injecte AUCUNE donnée fictive — l'EmptyState
// honnête ci-dessous s'affiche tant qu'il n'y a pas de demande réelle.
const placeholderRequests: Array<{
  id: string;
  listingTitle: string;
  address: string;
  price: number;
  status: "APPROVED" | "PENDING" | "REJECTED";
  appliedDate: string;
  responseDate: string | null;
}> = [];

function getRequestStatusBadge(status: string) {
  switch (status) {
    case "PENDING":
      return (
        <Badge className="gap-1 border-kaza-warning bg-kaza-warning/10 text-kaza-warning">
          <Clock className="size-3" />
          En attente
        </Badge>
      );
    case "APPROVED":
      return (
        <Badge className="gap-1 bg-kaza-green text-white">
          <CheckCircle className="size-3" />
          Acceptée
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="size-3" />
          Refusée
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function formatDateShort(dateStr: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

export default function StudentRequestsPage() {
  const requests = placeholderRequests;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Mes Demandes
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Suivez l&apos;état de vos demandes de colocation
        </p>
      </div>

      {requests.length > 0 ? (
        <div className="space-y-3">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2 sm:justify-start">
                      <h3 className="text-sm font-semibold">
                        {request.listingTitle}
                      </h3>
                      <div className="sm:hidden">
                        {getRequestStatusBadge(request.status)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3 shrink-0" />
                      <span className="truncate">{request.address}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CreditCard className="size-3" />
                        {new Intl.NumberFormat("fr-FR").format(request.price)}{" "}
                        XOF/mois
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarDays className="size-3" />
                        Envoyée le {formatDateShort(request.appliedDate)}
                      </span>
                      {request.responseDate && (
                        <span className="text-xs">
                          Répondue le {formatDateShort(request.responseDate)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="hidden sm:block">
                    {getRequestStatusBadge(request.status)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="Aucune demande envoyée"
          description="Vous n'avez envoyé aucune demande de colocation. Parcourez les annonces pour trouver des colocataires compatibles."
          actionLabel="Voir les colocations"
        />
      )}
    </div>
  );
}
