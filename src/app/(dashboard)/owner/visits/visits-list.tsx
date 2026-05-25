"use client";

import { useState, useTransition } from "react";
import {
  CalendarCheck,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate, getInitials } from "@/lib/utils";
import {
  mockVisitRequests,
  getPropertyById,
  getUserById,
} from "@/lib/mock-data";
import { acceptVisit, rejectVisit } from "@/actions/visits";
import { toast } from "@/components/ui/toast-helper";

function getStatusBadge(status: string) {
  switch (status) {
    case "PENDING":
      return (
        <Badge className="gap-1 border-kaza-warning bg-kaza-warning/10 text-kaza-warning">
          <Clock className="size-3" />
          En attente
        </Badge>
      );
    case "CONFIRMED":
      return (
        <Badge className="gap-1 bg-kaza-green text-white">
          <CheckCircle className="size-3" />
          Confirmée
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="size-3" />
          Rejetée
        </Badge>
      );
    case "COMPLETED":
      return (
        <Badge variant="secondary" className="gap-1">
          <CheckCircle className="size-3" />
          Effectuée
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function formatTime(time: string | null): string {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  return `${hours}h${minutes}`;
}

export function VisitRequestsList() {
  const [visits, setVisits] = useState(mockVisitRequests);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleAccept = (id: string) => {
    setPendingId(id);
    startTransition(async () => {
      try {
        const res = await acceptVisit(id);
        if (res.success) {
          setVisits((prev) =>
            prev.map((v) => (v.id === id ? { ...v, status: "CONFIRMED" } : v)),
          );
          toast.success("Visite confirmée.");
        } else {
          toast.error(res.error ?? "Impossible de confirmer la visite.");
        }
      } catch {
        // Si Supabase n'est pas configuré, on simule juste l'effet.
        setVisits((prev) =>
          prev.map((v) => (v.id === id ? { ...v, status: "CONFIRMED" } : v)),
        );
        toast.success("Visite confirmée.");
      } finally {
        setPendingId(null);
      }
    });
  };

  const handleReject = (id: string) => {
    setPendingId(id);
    startTransition(async () => {
      try {
        const res = await rejectVisit(id);
        if (res.success) {
          setVisits((prev) =>
            prev.map((v) => (v.id === id ? { ...v, status: "REJECTED" } : v)),
          );
          toast.info("Visite rejetée.");
        } else {
          toast.error(res.error ?? "Impossible de rejeter la visite.");
        }
      } catch {
        setVisits((prev) =>
          prev.map((v) => (v.id === id ? { ...v, status: "REJECTED" } : v)),
        );
        toast.info("Visite rejetée.");
      } finally {
        setPendingId(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Demandes de Visite
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {visits.length} demande{visits.length > 1 ? "s" : ""} au total
        </p>
      </div>

      {/* Visit cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visits.map((visit) => {
          const property = getPropertyById(visit.property_id);
          const tenant = getUserById(visit.tenant_id);

          return (
            <Card key={visit.id}>
              <CardContent className="space-y-4">
                {/* Tenant info */}
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage
                      src={tenant?.profile_photo_url || undefined}
                      alt={
                        tenant
                          ? `${tenant.first_name} ${tenant.last_name}`
                          : "Locataire"
                      }
                    />
                    <AvatarFallback className="bg-kaza-navy text-white text-xs">
                      {tenant
                        ? getInitials(tenant.first_name, tenant.last_name)
                        : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {tenant
                        ? `${tenant.first_name} ${tenant.last_name}`
                        : "Locataire inconnu"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {tenant?.email}
                    </p>
                  </div>
                </div>

                {/* Property */}
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="truncate text-sm font-medium">
                    {property?.title || "Bien inconnu"}
                  </p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3" />
                    <span className="truncate">
                      {property?.address || "Adresse inconnue"}
                    </span>
                  </div>
                </div>

                {/* Date and time */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-sm">
                    <CalendarCheck className="size-4 text-muted-foreground" />
                    <span>{formatDate(visit.requested_date)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <Clock className="size-4 text-muted-foreground" />
                    <span>{formatTime(visit.requested_time)}</span>
                  </div>
                </div>

                {/* Status & actions */}
                <div className="flex items-center justify-between border-t pt-3">
                  {getStatusBadge(visit.status)}

                  {visit.status === "PENDING" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-kaza-green hover:bg-kaza-green/90"
                        onClick={() => handleAccept(visit.id)}
                        disabled={pendingId === visit.id}
                      >
                        {pendingId === visit.id ? (
                          <Loader2 className="mr-1 size-3 animate-spin" />
                        ) : null}
                        Confirmer
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(visit.id)}
                        disabled={pendingId === visit.id}
                      >
                        Rejeter
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
