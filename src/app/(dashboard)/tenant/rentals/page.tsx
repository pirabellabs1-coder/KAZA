import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import {
  Building2,
  CalendarDays,
  CreditCard,
  FileText,
  MapPin,
  Search,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import {
  listTenantRentals,
  type TenantRentalItem,
} from "@/lib/queries/tenant-activity";
import { formatPrice, formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Mes Locations",
};

const ACTIVE_STATUSES = new Set(["ACTIVE", "PENDING"]);

function statusBadge(status: TenantRentalItem["status"]) {
  switch (status) {
    case "ACTIVE":
      return { label: "Active", className: "bg-kaza-green text-white" };
    case "PENDING":
      return {
        label: "En attente",
        className: "border-amber-500 bg-amber-500/10 text-amber-700",
      };
    case "COMPLETED":
    case "ENDED":
      return { label: "Terminée", className: "bg-muted text-muted-foreground" };
    case "TERMINATED":
    case "CANCELLED":
      return {
        label: "Annulée",
        className: "border-gray-300 bg-gray-100 text-gray-600",
      };
    default:
      return { label: status, className: "bg-muted text-muted-foreground" };
  }
}

function computeNextPayment(startDate: string): string {
  const start = new Date(startDate);
  const now = new Date();
  // Suppose un loyer payé le même jour du mois que la date de début.
  const next = new Date(
    now.getFullYear(),
    now.getMonth(),
    start.getDate(),
  );
  if (next < now) next.setMonth(next.getMonth() + 1);
  return formatDate(next);
}

export default async function TenantRentalsPage() {
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login?redirect=/tenant/rentals");

  const rentals = await listTenantRentals(user.id);
  const current = rentals.filter((r) => ACTIVE_STATUSES.has(r.status));
  const past = rentals.filter((r) => !ACTIVE_STATUSES.has(r.status));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-kaza-navy sm:text-3xl">
            Mes locations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rentals.length === 0
              ? "Gérez l'ensemble de vos contrats et paiements"
              : `${rentals.length} contrat${rentals.length > 1 ? "s" : ""} au total · ${current.length} en cours`}
          </p>
        </div>
        {rentals.length > 0 && (
          <Button asChild className="bg-kaza-blue hover:bg-kaza-blue/90">
            <Link href="/properties">
              <Search className="mr-1.5 size-4" />
              Trouver un nouveau logement
            </Link>
          </Button>
        )}
      </div>

      {rentals.length === 0 ? (
        <EmptyStateRentals />
      ) : (
        <Tabs defaultValue="current">
          <TabsList>
            <TabsTrigger value="current">
              Actuelles
              <span className="ml-1.5 rounded-full bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">
                {current.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="past">
              Terminées
              <span className="ml-1.5 rounded-full bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">
                {past.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="mt-6">
            <RentalGrid rentals={current} emptyLabel="Aucune location active." />
          </TabsContent>
          <TabsContent value="past" className="mt-6">
            <RentalGrid rentals={past} emptyLabel="Aucune location terminée." />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function RentalGrid({
  rentals,
  emptyLabel,
}: {
  rentals: TenantRentalItem[];
  emptyLabel: string;
}) {
  if (rentals.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/40 py-12 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {rentals.map((rental) => (
        <RentalCard key={rental.id} rental={rental} />
      ))}
    </div>
  );
}

function RentalCard({ rental }: { rental: TenantRentalItem }) {
  const badge = statusBadge(rental.status);
  const isActive = rental.status === "ACTIVE";
  const isPending = rental.status === "PENDING";

  return (
    <Card className="overflow-hidden rounded-2xl transition-shadow hover:shadow-lg">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          <div className="relative h-48 w-full shrink-0 overflow-hidden sm:h-auto sm:w-48">
            <Image
              src={rental.property.primaryPhotoUrl}
              alt={rental.property.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 192px"
            />
            <Badge className={`absolute left-3 top-3 ${badge.className}`}>
              {badge.label}
            </Badge>
          </div>

          <div className="flex-1 p-4 sm:p-5">
            <h3 className="font-heading text-lg font-semibold text-kaza-navy">
              {rental.property.title}
            </h3>
            <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5" />
              {rental.property.address}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-3">
              <div className="flex items-center gap-1.5 text-sm">
                <CalendarDays className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">
                    Période
                  </p>
                  <p className="text-xs font-medium">
                    {formatDate(rental.startDate)}
                    {rental.endDate ? ` → ${formatDate(rental.endDate)}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <CreditCard className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">
                    Loyer
                  </p>
                  <p className="text-xs font-semibold text-kaza-navy">
                    {formatPrice(rental.monthlyRent)}/mois
                  </p>
                </div>
              </div>
            </div>

            {isActive && (
              <div className="mt-3 rounded-lg bg-kaza-blue/5 px-3 py-2 text-xs">
                <span className="text-muted-foreground">
                  Prochain paiement :
                </span>{" "}
                <span className="font-semibold text-kaza-navy">
                  {computeNextPayment(rental.startDate)}
                </span>
              </div>
            )}

            {isPending && (
              <div className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
                Candidature acceptée. Réglez le 1<sup>er</sup> loyer pour
                finaliser votre location et devenir locataire en titre.
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/contracts/${rental.id}`}>
                  <FileText className="mr-1.5 size-3.5" />
                  Contrat
                </Link>
              </Button>
              {(isActive || isPending) && (
                <Button
                  size="sm"
                  className="bg-kaza-blue hover:bg-kaza-blue/90"
                  asChild
                >
                  <Link
                    href={`/tenant/payments/checkout?rentalId=${rental.id}`}
                  >
                    {isPending ? "Payer pour finaliser" : "Payer le loyer"}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyStateRentals() {
  return (
    <div className="rounded-3xl border border-dashed border-gray-200 bg-gradient-to-br from-white via-kaza-blue/5 to-kaza-navy/5 py-16 text-center sm:py-24">
      <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-lg">
        <Building2 className="size-12 text-gray-300" strokeWidth={1.5} />
      </div>
      <h2 className="font-heading text-xl font-semibold text-kaza-navy sm:text-2xl">
        Aucune location en cours
      </h2>
      <p className="mx-auto mt-3 max-w-md px-6 text-sm text-muted-foreground">
        Vous n&apos;avez pas encore de contrat de location actif. Parcourez les
        annonces pour trouver votre prochain logement.
      </p>
      <div className="mt-8">
        <Button
          asChild
          size="lg"
          className="bg-kaza-blue hover:bg-kaza-blue/90"
        >
          <Link href="/properties">
            <Search className="mr-2 size-4" />
            Rechercher un bien
          </Link>
        </Button>
      </div>
    </div>
  );
}
