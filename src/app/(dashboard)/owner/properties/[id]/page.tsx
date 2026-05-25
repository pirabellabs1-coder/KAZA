import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Eye,
  MapPin,
  Bed,
  Bath,
  Maximize,
  CalendarCheck,
  CreditCard,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPropertyById } from "@/lib/mock-data";
import { formatPrice, formatDate } from "@/lib/utils";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Détail du bien",
};

interface PropertyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PropertyDetailPage({
  params,
}: PropertyDetailPageProps) {
  const { id } = await params;
  const property = getPropertyById(id);

  if (!property) {
    notFound();
  }

  const thumbnailUrl =
    property.photos[0]?.photo_url || "https://picsum.photos/seed/kaza-placeholder/800/600";
  const statusLabel = property.status === "RENTED" ? "Loué" : "Vacant";
  const statusColor =
    property.status === "RENTED"
      ? "bg-kaza-green text-white"
      : "border-kaza-warning bg-kaza-warning/10 text-kaza-warning";

  return (
    <div className="space-y-6">
      {/* Back & actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/owner/properties">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
              {property.title}
            </h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="size-3.5" />
              {property.address}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Pencil className="mr-2 size-4" />
            Modifier
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="py-4">
          <CardContent className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <CreditCard className="size-5 text-kaza-navy" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Loyer mensuel</p>
              <p className="text-lg font-bold">{formatPrice(property.price)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardContent className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Eye className="size-5 text-kaza-navy" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Vues</p>
              <p className="text-lg font-bold">{property.views_count}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardContent className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <CalendarCheck className="size-5 text-kaza-navy" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Publié le</p>
              <p className="text-sm font-semibold">
                {formatDate(property.created_at)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardContent className="flex items-center gap-3">
            <Badge className={statusColor}>{statusLabel}</Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Property images */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {property.photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative aspect-video overflow-hidden rounded-lg bg-muted"
                >
                  <Image
                    src={photo.photo_url}
                    alt={property.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Property details */}
        <Card>
          <CardHeader>
            <CardTitle>Caractéristiques</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Bed className="size-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {property.bedrooms ?? 0} chambre
                  {(property.bedrooms ?? 0) > 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Bath className="size-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {property.bathrooms ?? 0} salle
                  {(property.bathrooms ?? 0) > 1 ? "s" : ""} de bain
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Maximize className="size-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {property.square_meters ?? 0} m²
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="mb-2 text-sm font-medium">Équipements</p>
              <div className="flex flex-wrap gap-1.5">
                {property.amenities.map((amenity) => (
                  <Badge key={amenity} variant="secondary" className="text-xs">
                    {amenity}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {property.description}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
