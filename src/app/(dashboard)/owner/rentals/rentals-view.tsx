"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  CalendarDays,
  MapPin,
  Wallet,
} from "lucide-react";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, getInitials } from "@/lib/utils";
import type { OwnerRental } from "@/lib/queries/owner-activity";

type Filter = "ACTIVE" | "PENDING" | "PAST";

function formatFcfa(value: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(value)} FCFA`;
}

function rentalStatusBadge(status: string) {
  switch (status) {
    case "ACTIVE":
      return (
        <Badge className="bg-kaza-green text-white hover:bg-kaza-green/90">
          Active
        </Badge>
      );
    case "PENDING":
      return (
        <Badge className="border-kaza-warning bg-kaza-warning/10 text-kaza-warning">
          En attente
        </Badge>
      );
    case "COMPLETED":
      return <Badge variant="secondary">Terminée</Badge>;
    case "CANCELLED":
    case "TERMINATED":
      return <Badge variant="destructive">{status === "TERMINATED" ? "Résiliée" : "Annulée"}</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function initialsFromName(name: string): string {
  const parts = name.split(/\s+/);
  const first = parts[0] ?? "";
  const last = parts[1] ?? parts[0] ?? "";
  return getInitials(first, last);
}

function durationLabel(startDate: string, endDate: string | null): string {
  if (!startDate) return "—";
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const months = Math.max(
    1,
    Math.round(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30),
    ),
  );
  if (months < 12) return `${months} mois`;
  const years = Math.floor(months / 12);
  const remaining = months % 12;
  if (remaining === 0) return `${years} an${years > 1 ? "s" : ""}`;
  return `${years} an${years > 1 ? "s" : ""} et ${remaining} mois`;
}

interface OwnerRentalsViewProps {
  rentals: OwnerRental[];
  /**
   * Base d'URL de la fiche bail (ex: "/agency/rentals"). Si fournie, chaque
   * carte affiche un lien « Voir le détail » vers `${detailHrefBase}/${id}`.
   */
  detailHrefBase?: string;
}

export function OwnerRentalsView({
  rentals,
  detailHrefBase,
}: OwnerRentalsViewProps) {
  const [filter, setFilter] = useState<Filter>("ACTIVE");

  const counts = useMemo(() => {
    let active = 0;
    let pending = 0;
    let past = 0;
    for (const r of rentals) {
      if (r.status === "ACTIVE") active += 1;
      else if (r.status === "PENDING") pending += 1;
      else past += 1;
    }
    return { active, pending, past };
  }, [rentals]);

  const filtered = useMemo(() => {
    if (filter === "ACTIVE") return rentals.filter((r) => r.status === "ACTIVE");
    if (filter === "PENDING")
      return rentals.filter((r) => r.status === "PENDING");
    return rentals.filter(
      (r) =>
        r.status === "COMPLETED" ||
        r.status === "CANCELLED" ||
        r.status === "TERMINATED",
    );
  }, [filter, rentals]);

  const totalMonthlyRevenue = useMemo(
    () =>
      rentals
        .filter((r) => r.status === "ACTIVE")
        .reduce((sum, r) => sum + r.monthlyRent, 0),
    [rentals],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-kaza-navy">
            Locations en cours
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rentals.length === 0
              ? "Vos baux signés et locations actives apparaîtront ici."
              : `${counts.active} location${counts.active > 1 ? "s" : ""} active${counts.active > 1 ? "s" : ""} · ${formatFcfa(totalMonthlyRevenue)} / mois`}
          </p>
        </div>
      </div>

      {/* Tabs */}
      {rentals.length > 0 && (
        <Tabs
          value={filter}
          onValueChange={(v) => setFilter(v as Filter)}
          className="w-full"
        >
          <TabsList>
            <TabsTrigger value="ACTIVE">Actives ({counts.active})</TabsTrigger>
            <TabsTrigger value="PENDING">
              En attente ({counts.pending})
            </TabsTrigger>
            <TabsTrigger value="PAST">Terminées ({counts.past})</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {filtered.length === 0 ? (
        <EmptyRentalsCard />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((rental) => (
            <Card
              key={rental.id}
              className="rounded-2xl border-0 shadow-sm transition hover:shadow-md"
            >
              <CardContent className="space-y-4 p-5">
                {/* Top : tenant + status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-kaza-navy text-xs text-white">
                        {initialsFromName(rental.tenantName) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-kaza-navy">
                        {rental.tenantName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {rental.tenantEmail || "Email non renseigné"}
                      </p>
                    </div>
                  </div>
                  {rentalStatusBadge(rental.status)}
                </div>

                {/* Property */}
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="line-clamp-1 text-sm font-medium">
                    {rental.propertyTitle}
                  </p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3 shrink-0" />
                    <span className="line-clamp-1">
                      {rental.propertyAddress || "Adresse inconnue"}
                    </span>
                  </div>
                </div>

                {/* Metrics row */}
                <div className="grid grid-cols-3 gap-3 border-t pt-3">
                  <div>
                    <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                      <CalendarDays className="size-3" />
                      Début
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {rental.startDate ? formatDate(rental.startDate) : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Durée
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {durationLabel(rental.startDate, rental.endDate)}
                    </p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                      <Wallet className="size-3" />
                      Loyer
                    </p>
                    <p className="mt-1 text-sm font-semibold text-kaza-navy">
                      {formatFcfa(rental.monthlyRent)}
                    </p>
                  </div>
                </div>

                {detailHrefBase && (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Link href={`${detailHrefBase}/${rental.id}`}>
                      Voir le détail
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyRentalsCard() {
  return (
    <Card className="rounded-2xl border-2 border-dashed bg-gradient-to-br from-white via-muted/20 to-kaza-blue/[0.04] shadow-sm">
      <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-kaza-blue/10">
          <Building2 className="size-8 text-kaza-blue" />
        </div>
        <h2 className="mt-6 font-heading text-xl font-bold text-kaza-navy">
          Aucune location en cours
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Vos baux signés apparaîtront ici. Pour démarrer, publiez une annonce
          et acceptez la première candidature de locataire.
        </p>
      </CardContent>
    </Card>
  );
}
