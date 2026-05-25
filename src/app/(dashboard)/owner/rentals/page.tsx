import type { Metadata } from "next";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  MapPin,
  CalendarDays,
  FileText,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchWithFallback } from "@/lib/data-fetcher";
import { createClient } from "@/lib/supabase/server";
import {
  mockRentals,
  getPropertyById,
  getUserById,
  getPropertiesByOwner,
} from "@/lib/mock-data";
import type { Rental } from "@/types/properties";
import type { User } from "@/types/users";
import { formatPrice, formatDate, getInitials } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Locations en Cours",
};

// Fallback dev quand Supabase est absent (cohérent avec les autres pages).
const MOCK_OWNER_ID = "u-002-owner-jean";

// Forme enrichie utilisée par l'UI (mêmes champs pour mock et Supabase).
type RentalRow = Rental & {
  property: {
    id: string;
    title: string;
    address: string;
  } | null;
  tenant: Pick<
    User,
    "id" | "first_name" | "last_name" | "phone" | "profile_photo_url"
  > | null;
};

// ---------------------------------------------------------------------------
// Chargement Supabase + fallback mock
// ---------------------------------------------------------------------------

async function loadOwnerRentals(): Promise<RentalRow[]> {
  // TODO: type manquant - le client typed Database ne fournit pas les
  // relations FK necessaires (`rentals.property`, `rentals.tenant`). On
  // utilise un client loose en attendant la regeneration des types.
  const supabase = (await createClient()) as unknown as SupabaseClient;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("rentals")
    .select(
      `
      *,
      property:properties!inner(id, title, address, owner_id),
      tenant:users!rentals_tenant_id_fkey(
        id, first_name, last_name, phone, profile_photo_url
      )
    `,
    )
    .eq("property.owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Lecture des locations impossible : ${error.message}`);
  }

  return (data ?? []) as unknown as RentalRow[];
}

function loadOwnerRentalsMock(): RentalRow[] {
  const ownerProperties = getPropertiesByOwner(MOCK_OWNER_ID);
  const ownerPropertyIds = new Set(ownerProperties.map((p) => p.id));

  return mockRentals
    .filter((r) => ownerPropertyIds.has(r.property_id))
    .map((rental) => {
      const property = getPropertyById(rental.property_id);
      const tenant = getUserById(rental.tenant_id);
      return {
        ...rental,
        property: property
          ? {
              id: property.id,
              title: property.title,
              address: property.address,
            }
          : null,
        tenant: tenant
          ? {
              id: tenant.id,
              first_name: tenant.first_name,
              last_name: tenant.last_name,
              phone: tenant.phone,
              profile_photo_url: tenant.profile_photo_url,
            }
          : null,
      };
    });
}

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------

function getRentalStatusBadge(status: string) {
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
    case "ENDED":
      return <Badge variant="secondary">Terminée</Badge>;
    case "CANCELLED":
      return <Badge variant="destructive">Annulée</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function OwnerRentalsPage() {
  const rentals = await fetchWithFallback<RentalRow[]>(
    () => loadOwnerRentals(),
    () => loadOwnerRentalsMock(),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Locations en Cours
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {rentals.length} location{rentals.length > 1 ? "s" : ""} active
          {rentals.length > 1 ? "s" : ""}
        </p>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Locataire
              </th>
              <th className="p-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Bien
              </th>
              <th className="p-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Date de début
              </th>
              <th className="p-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Loyer mensuel
              </th>
              <th className="p-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Statut
              </th>
              <th className="p-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Contrat
              </th>
            </tr>
          </thead>
          <tbody>
            {rentals.map((rental) => {
              const { property, tenant } = rental;

              return (
                <tr
                  key={rental.id}
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage
                          src={tenant?.profile_photo_url || undefined}
                        />
                        <AvatarFallback className="bg-kaza-navy text-white text-xs">
                          {tenant
                            ? getInitials(tenant.first_name, tenant.last_name)
                            : "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {tenant
                            ? `${tenant.first_name} ${tenant.last_name}`
                            : "Inconnu"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tenant?.phone}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-medium">
                      {property?.title || "Bien inconnu"}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3" />
                      {property?.address}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {formatDate(rental.start_date)}
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-medium">
                      {formatPrice(rental.monthly_rent)}
                    </span>
                  </td>
                  <td className="p-4">
                    {getRentalStatusBadge(rental.status)}
                  </td>
                  <td className="p-4">
                    <Button variant="outline" size="sm">
                      <FileText className="mr-1.5 size-3.5" />
                      Voir
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {rentals.map((rental) => {
          const { property, tenant } = rental;

          return (
            <Card key={rental.id}>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarImage
                        src={tenant?.profile_photo_url || undefined}
                      />
                      <AvatarFallback className="bg-kaza-navy text-white text-xs">
                        {tenant
                          ? getInitials(tenant.first_name, tenant.last_name)
                          : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {tenant
                          ? `${tenant.first_name} ${tenant.last_name}`
                          : "Inconnu"}
                      </p>
                    </div>
                  </div>
                  {getRentalStatusBadge(rental.status)}
                </div>

                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-sm font-medium">
                    {property?.title || "Bien inconnu"}
                  </p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3" />
                    {property?.address}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <CalendarDays className="size-4" />
                    {formatDate(rental.start_date)}
                  </div>
                  <span className="font-semibold">
                    {formatPrice(rental.monthly_rent)}
                    <span className="text-xs font-normal text-muted-foreground">
                      /mois
                    </span>
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
