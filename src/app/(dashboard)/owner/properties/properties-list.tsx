"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  MapPin,
  Bed,
  Bath,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPrice, formatDate } from "@/lib/utils";
import type { PropertyWithPhotos } from "@/types/properties";

interface OwnerPropertiesListProps {
  properties: PropertyWithPhotos[];
}

function getStatusBadge(status: string) {
  switch (status) {
    case "RENTED":
      return (
        <Badge className="bg-kaza-green text-white hover:bg-kaza-green/90">
          Loué
        </Badge>
      );
    case "AVAILABLE":
      return (
        <Badge className="border-kaza-warning bg-kaza-warning/10 text-kaza-warning hover:bg-kaza-warning/20">
          Vacant
        </Badge>
      );
    case "ARCHIVED":
      return <Badge variant="secondary">Archivé</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function PropertyRow({ property }: { property: PropertyWithPhotos }) {
  const thumbnailUrl =
    property.photos[0]?.photo_url || "/images/property-placeholder.jpg";

  return (
    <tr className="border-b transition-colors hover:bg-muted/50">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
            <Image
              src={thumbnailUrl}
              alt={property.title}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{property.title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {property.property_type === "APARTMENT"
                ? "Appartement"
                : property.property_type === "HOUSE"
                ? "Maison"
                : property.property_type === "STUDIO"
                ? "Studio"
                : "Chambre"}
            </p>
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">{property.address}</span>
        </div>
      </td>
      <td className="p-4">{getStatusBadge(property.status)}</td>
      <td className="p-4">
        <span className="text-sm font-medium">
          {formatPrice(property.price)}
        </span>
        <span className="text-xs text-muted-foreground">/mois</span>
      </td>
      <td className="p-4 text-sm text-muted-foreground">
        {formatDate(property.updated_at)}
      </td>
      <td className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/owner/properties/${property.id}`}>
                <Eye className="mr-2 size-4" />
                Voir les détails
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Pencil className="mr-2 size-4" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <Trash2 className="mr-2 size-4" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

function PropertyMobileCard({ property }: { property: PropertyWithPhotos }) {
  const thumbnailUrl =
    property.photos[0]?.photo_url || "/images/property-placeholder.jpg";

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex gap-3">
        <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
          <Image
            src={thumbnailUrl}
            alt={property.title}
            fill
            className="object-cover"
            sizes="96px"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-sm font-semibold">
              {property.title}
            </h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-xs">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/owner/properties/${property.id}`}>
                    <Eye className="mr-2 size-4" />
                    Voir les détails
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Pencil className="mr-2 size-4" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">
                  <Trash2 className="mr-2 size-4" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3" />
            <span className="truncate">{property.address}</span>
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Bed className="size-3" />
              {property.bedrooms ?? 0}
            </span>
            <span className="flex items-center gap-1">
              <Bath className="size-3" />
              {property.bathrooms ?? 0}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t pt-3">
        <span className="text-sm font-semibold">
          {formatPrice(property.price)}
          <span className="text-xs font-normal text-muted-foreground">
            /mois
          </span>
        </span>
        {getStatusBadge(property.status)}
      </div>
    </div>
  );
}

export function OwnerPropertiesList({ properties }: OwnerPropertiesListProps) {
  const rentedProperties = properties.filter((p) => p.status === "RENTED");
  const vacantProperties = properties.filter((p) => p.status === "AVAILABLE");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Mes Propriétés
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {properties.length} bien{properties.length > 1 ? "s" : ""} au total
          </p>
        </div>
        <Button asChild>
          <Link href="/owner/properties/new">
            <Plus className="mr-2 size-4" />
            Ajouter un bien
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">
            Tout ({properties.length})
          </TabsTrigger>
          <TabsTrigger value="rented">
            Loué ({rentedProperties.length})
          </TabsTrigger>
          <TabsTrigger value="vacant">
            Vacant ({vacantProperties.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <PropertyListView properties={properties} />
        </TabsContent>

        <TabsContent value="rented">
          <PropertyListView properties={rentedProperties} />
        </TabsContent>

        <TabsContent value="vacant">
          <PropertyListView properties={vacantProperties} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PropertyListView({ properties }: { properties: PropertyWithPhotos[] }) {
  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-16 text-center">
        <p className="text-sm text-muted-foreground">
          Aucun bien dans cette catégorie.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Bien
              </th>
              <th className="p-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Localisation
              </th>
              <th className="p-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Statut
              </th>
              <th className="p-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Loyer Mensuel
              </th>
              <th className="p-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Dernière mise à jour
              </th>
              <th className="p-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {properties.map((property) => (
              <PropertyRow key={property.id} property={property} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {properties.map((property) => (
          <PropertyMobileCard key={property.id} property={property} />
        ))}
      </div>
    </>
  );
}
