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
  Star,
  Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getPropertyById } from "@/lib/queries/properties";
import { getPropertyReviews } from "@/lib/queries/reviews";
import { countPropertyVisitRequests } from "@/lib/queries/owner-activity";
import { formatPrice, formatDate } from "@/lib/utils";
import { notFound } from "next/navigation";
import { AnalyticsTab } from "./analytics-tab";
import { CalendarTab } from "./calendar-tab";
import { HistoryTab } from "./history-tab";

export const metadata: Metadata = {
  title: "Détail du bien",
};

interface PropertyDetailPageProps {
  params: Promise<{ id: string }>;
}

function RatingStars({ value, size = 4 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`size-${size} ${
            i <= value
              ? "fill-yellow-400 text-yellow-400"
              : "fill-muted text-muted"
          }`}
        />
      ))}
    </div>
  );
}

export default async function PropertyDetailPage({
  params,
}: PropertyDetailPageProps) {
  const { id } = await params;
  const property = await getPropertyById(id);

  if (!property) {
    notFound();
  }

  // Avis réels (table `ratings`) + nombre de demandes de visite réelles.
  const [reviewsData, visitRequestsCount] = await Promise.all([
    getPropertyReviews(id),
    countPropertyVisitRequests(id),
  ]);
  const reviews = reviewsData.reviews;
  const averageRating = reviewsData.averageRating;
  const totalReviews = reviewsData.totalCount;

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
          <Button variant="outline" size="sm" asChild>
            <Link href="/owner/promotion">
              <Megaphone className="mr-2 size-4" />
              Booster
            </Link>
          </Button>
          <Button size="sm" className="bg-kaza-blue hover:bg-kaza-blue/90" asChild>
            <Link href={`/owner/properties/${property.id}/edit`}>
              <Pencil className="mr-2 size-4" />
              Modifier
            </Link>
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
              <p className="text-lg font-bold">{property.viewsCount}</p>
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
                {formatDate(property.createdAt)}
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

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto sm:w-fit">
          <TabsTrigger value="overview">Apercu</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="calendar">Calendrier</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
          <TabsTrigger value="reviews">Avis</TabsTrigger>
        </TabsList>

        {/* Apercu */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Photos */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Photos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {property.photos.map((photoUrl, idx) => (
                    <div
                      key={`${photoUrl}-${idx}`}
                      className="relative aspect-video overflow-hidden rounded-lg bg-muted"
                    >
                      <Image
                        src={photoUrl}
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

            {/* Caracteristiques */}
            <Card>
              <CardHeader>
                <CardTitle>Caracteristiques</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Bed className="size-5 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {property.bedrooms ?? 0} chambre
                    {(property.bedrooms ?? 0) > 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Bath className="size-5 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {property.bathrooms ?? 0} salle
                    {(property.bathrooms ?? 0) > 1 ? "s" : ""} de bain
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Maximize className="size-5 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {property.sqm ?? 0} m²
                  </p>
                </div>

                <div className="border-t pt-4">
                  <p className="mb-2 text-sm font-medium">Equipements</p>
                  <div className="flex flex-wrap gap-1.5">
                    {property.amenities.map((amenity) => (
                      <Badge
                        key={amenity}
                        variant="secondary"
                        className="text-xs"
                      >
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

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
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics">
          <AnalyticsTab
            totalViews={property.viewsCount ?? 0}
            visitRequests={visitRequestsCount}
            reviewsCount={totalReviews}
            averageRating={averageRating}
          />
        </TabsContent>

        {/* Calendrier */}
        <TabsContent value="calendar">
          <CalendarTab propertyId={property.id} />
        </TabsContent>

        {/* Historique */}
        <TabsContent value="history">
          <HistoryTab />
        </TabsContent>

        {/* Avis */}
        <TabsContent value="reviews" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Note globale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
                <div className="text-center sm:text-left">
                  <p className="text-4xl font-bold text-foreground">
                    {averageRating.toFixed(1)}
                  </p>
                  <div className="mt-1 flex justify-center sm:justify-start">
                    <RatingStars value={Math.round(averageRating)} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {totalReviews} avis
                  </p>
                </div>
                <div className="flex-1 space-y-1.5">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = reviews.filter(
                      (r) => r.rating === stars,
                    ).length;
                    const pct =
                      totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                    return (
                      <div key={stars} className="flex items-center gap-3">
                        <span className="w-6 text-xs text-muted-foreground">
                          {stars}★
                        </span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-yellow-400"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-xs text-muted-foreground">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {reviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                Aucun avis pour le moment. Les locataires pourront laisser un
                avis une fois leur location terminée.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="space-y-3 pt-6">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {review.reviewerInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold">
                          {review.reviewerName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(review.createdAt)}
                        </p>
                      </div>
                    </div>
                    <RatingStars value={review.rating} size={3.5} />
                    <p className="text-sm text-muted-foreground">
                      {review.comment}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
