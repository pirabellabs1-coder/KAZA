import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  CalendarDays,
  CreditCard,
  FileText,
  Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import {
  getRentalsByTenantId,
  getPropertyById,
  getUserById,
} from "@/lib/mock-data";
import { formatPrice, formatDate, getInitials } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Mes Locations",
};

const MOCK_TENANT_ID = "u-004-tenant-thomas";

export default function TenantRentalsPage() {
  const rentals = getRentalsByTenantId(MOCK_TENANT_ID);

  if (rentals.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Mes Locations
          </h1>
        </div>
        <EmptyState
          icon={Building2}
          title="Aucune location active"
          description="Vous n'avez pas encore de location en cours. Parcourez les annonces pour trouver votre prochain logement."
          actionLabel="Rechercher un bien"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Mes Locations
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {rentals.length} location{rentals.length > 1 ? "s" : ""} en cours
        </p>
      </div>

      {/* Rental cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        {rentals.map((rental) => {
          const property = getPropertyById(rental.property_id);
          const owner = property
            ? getUserById(property.owner_id)
            : undefined;
          const thumbnailUrl =
            property?.photos[0]?.photo_url ||
            "https://picsum.photos/seed/kaza-placeholder/800/600";

          return (
            <Card key={rental.id}>
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  {/* Property image */}
                  <div className="relative h-48 w-full shrink-0 overflow-hidden rounded-t-xl sm:h-auto sm:w-48 sm:rounded-l-xl sm:rounded-t-none">
                    <Image
                      src={thumbnailUrl}
                      alt={property?.title || "Propriété"}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 192px"
                    />
                    <Badge
                      className="absolute left-3 top-3 bg-kaza-green text-white"
                    >
                      Active
                    </Badge>
                  </div>

                  {/* Info */}
                  <div className="flex-1 p-4 sm:p-5">
                    <h3 className="text-lg font-semibold">
                      {property?.title || "Bien inconnu"}
                    </h3>
                    <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="size-3.5" />
                      {property?.address}
                    </div>

                    {/* Owner info */}
                    {owner && (
                      <div className="mt-3 flex items-center gap-2">
                        <Avatar size="sm">
                          <AvatarImage
                            src={owner.profile_photo_url || undefined}
                          />
                          <AvatarFallback className="bg-kaza-navy text-white text-[10px]">
                            {getInitials(
                              owner.first_name,
                              owner.last_name
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs font-medium">
                            {owner.first_name} {owner.last_name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Propriétaire
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Details */}
                    <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-3">
                      <div className="flex items-center gap-1.5 text-sm">
                        <CalendarDays className="size-4 text-muted-foreground" />
                        <div>
                          <p className="text-[10px] uppercase text-muted-foreground">
                            Début
                          </p>
                          <p className="text-xs font-medium">
                            {formatDate(rental.start_date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm">
                        <CreditCard className="size-4 text-muted-foreground" />
                        <div>
                          <p className="text-[10px] uppercase text-muted-foreground">
                            Loyer
                          </p>
                          <p className="text-xs font-semibold">
                            {formatPrice(rental.monthly_rent)}/mois
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/contracts?rentalId=${rental.id}`}>
                          <FileText className="mr-1.5 size-3.5" />
                          Contrat
                        </Link>
                      </Button>
                      <Button size="sm" className="bg-kaza-blue hover:bg-kaza-blue/90" asChild>
                        <Link href={`/tenant/payments/checkout?rentalId=${rental.id}`}>
                          Payer le loyer
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
