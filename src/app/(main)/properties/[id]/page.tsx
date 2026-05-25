import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Users,
  Bed,
  Bath,
  Maximize,
  Wifi,
  Share2,
  Heart,
  Star,
  CheckCircle,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PropertyGallery } from "@/components/property/property-gallery";
import { PropertyCard } from "@/components/property/property-card";
import { VirtualTour } from "@/components/property/virtual-tour";
import { RatingStars } from "@/components/shared/rating-stars";
import { VerificationBadge } from "@/components/shared/verification-badge";
import {
  getPropertyById as mockGetPropertyById,
  getFeaturedProperties,
  mockRatings,
  mockUsers,
} from "@/lib/mock-data";
import { formatPrice, formatDate, getInitials } from "@/lib/utils";
import { notFound } from "next/navigation";
import { fetchWithFallback } from "@/lib/data-fetcher";
import { getPropertyById as supabaseGetPropertyById } from "@/lib/supabase/queries/properties";

async function fetchProperty(id: string) {
  return fetchWithFallback(
    () => supabaseGetPropertyById(id),
    () => mockGetPropertyById(id) ?? null,
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const property = await fetchProperty(id);
  if (!property) return { title: "Propriété introuvable" };

  return {
    title: property.title,
    description: property.description?.slice(0, 160),
    openGraph: {
      title: `${property.title} - ${formatPrice(property.price)}/mois`,
      description: property.description?.slice(0, 160),
      images: property.photos[0]?.photo_url
        ? [property.photos[0].photo_url]
        : [],
    },
  };
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await fetchProperty(id);

  if (!property) {
    notFound();
  }

  const owner = mockUsers.find((u) => u.id === property.owner_id);
  const similarProperties = getFeaturedProperties().filter(
    (p) => p.id !== property.id
  );
  const propertyRatings = mockRatings.slice(0, 4);

  const galleryImages = property.photos.map((p) => ({
    url: p.photo_url,
    alt: property.title,
  }));

  const amenityIcons: Record<string, string> = {
    WiFi: "📶",
    Parking: "🅿️",
    "Cuisine équipée": "🍳",
    Climatisation: "❄️",
    Sécurité: "🔒",
    "Groupe électrogène": "⚡",
    Balcon: "🏗️",
    Jardin: "🌿",
    Piscine: "🏊",
    Forage: "💧",
    Meublé: "🛋️",
    "Eau chaude": "🚿",
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Gallery + Virtual Tour */}
      <div className="mx-auto max-w-7xl px-4 pt-6 lg:px-8">
        <VirtualTour
          images={galleryImages.map((g) => g.url)}
          videoUrl={undefined}
          embedUrl={undefined}
        />
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Left: Property Info */}
          <div>
            {/* Title & Actions */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="font-heading text-2xl font-bold sm:text-3xl">
                  {property.title}
                </h1>
                <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                  <MapPin className="size-4" />
                  <span>{property.address}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon">
                  <Share2 className="size-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Heart className="size-4" />
                </Button>
              </div>
            </div>

            {/* Specs */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <Users className="size-4 text-muted-foreground" />
                <span>{property.bedrooms + property.bathrooms} invités</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Bed className="size-4 text-muted-foreground" />
                <span>{property.bedrooms} chambres</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Bath className="size-4 text-muted-foreground" />
                <span>{property.bathrooms} sdb</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Maximize className="size-4 text-muted-foreground" />
                <span>{property.square_meters} m²</span>
              </div>
              {property.amenities.includes("WiFi") && (
                <div className="flex items-center gap-1.5">
                  <Wifi className="size-4 text-muted-foreground" />
                  <span>WiFi</span>
                </div>
              )}
            </div>

            <Separator className="my-6" />

            {/* Owner */}
            {owner && (
              <>
                <div className="flex items-center gap-4">
                  <Avatar className="size-12">
                    <AvatarFallback className="bg-kaza-navy text-white">
                      {getInitials(owner.first_name, owner.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        Géré par {owner.first_name} {owner.last_name}
                      </span>
                      <VerificationBadge status={owner.verification_status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Membre depuis {formatDate(owner.created_at)}
                    </p>
                  </div>
                </div>
                <Separator className="my-6" />
              </>
            )}

            {/* Description */}
            <div>
              <h2 className="mb-3 text-lg font-semibold">
                À propos de ce logement
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {property.description}
              </p>
            </div>

            <Separator className="my-6" />

            {/* Amenities */}
            <div>
              <h2 className="mb-4 text-lg font-semibold">
                Équipements
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {property.amenities.map((amenity) => (
                  <div
                    key={amenity}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span>{amenityIcons[amenity] || "✓"}</span>
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="my-6" />

            {/* Location placeholder */}
            <div>
              <h2 className="mb-4 text-lg font-semibold">
                Location / Emplacement
              </h2>
              <div className="flex h-[300px] items-center justify-center rounded-xl bg-muted">
                <div className="text-center text-muted-foreground">
                  <MapPin className="mx-auto mb-2 size-8" />
                  <p>{property.address}</p>
                  <p className="mt-1 text-xs">Carte interactive (Mapbox) - à venir</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Booking Card */}
          <div>
            <div className="sticky top-20 rounded-xl border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-bold">
                    {formatPrice(property.price)}
                  </span>
                  <span className="text-muted-foreground"> /mois</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="size-4 fill-kaza-warning text-kaza-warning" />
                  <span className="font-medium">4.92</span>
                  <span className="text-muted-foreground">
                    · {propertyRatings.length} avis
                  </span>
                </div>
              </div>

              <div className="mb-4 rounded-lg border">
                <div className="grid grid-cols-2 divide-x">
                  <div className="p-3">
                    <label className="text-[10px] font-semibold uppercase text-muted-foreground">
                      Emménagement
                    </label>
                    <p className="text-sm font-medium">Immédiat</p>
                  </div>
                  <div className="p-3">
                    <label className="text-[10px] font-semibold uppercase text-muted-foreground">
                      Durée min.
                    </label>
                    <p className="text-sm font-medium">12 mois</p>
                  </div>
                </div>
              </div>

              <Button className="mb-3 w-full bg-kaza-blue text-base hover:bg-kaza-blue/90">
                <Calendar className="mr-2 size-4" />
                Demander une visite
              </Button>

              <p className="mb-4 text-center text-xs text-muted-foreground">
                Aucun frais ne sera prélevé
              </p>

              <Separator className="my-4" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Loyer mensuel</span>
                  <span>{formatPrice(property.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Caution (2 mois)
                  </span>
                  <span>{formatPrice(property.price * 2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Commission KAZA
                  </span>
                  <span>{formatPrice(property.price * 0.05)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total à l&apos;entrée</span>
                  <span>
                    {formatPrice(property.price * 3 + property.price * 0.05)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Properties */}
        <Separator className="my-12" />
        <section>
          <h2 className="mb-6 font-heading text-2xl font-bold">
            Propriétés similaires
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similarProperties.slice(0, 3).map((p) => (
              <PropertyCard
                key={p.id}
                id={p.id}
                title={p.title}
                price={p.price}
                address={p.address}
                bedrooms={p.bedrooms}
                bathrooms={p.bathrooms}
                squareMeters={p.square_meters}
                imageUrl={
                  p.photos[0]?.photo_url || "https://picsum.photos/seed/kaza-placeholder/800/600"
                }
                propertyType={p.property_type}
                isVerified
              />
            ))}
          </div>
        </section>

        {/* Reviews */}
        <Separator className="my-12" />
        <section>
          <div className="mb-6 flex items-center gap-2">
            <Star className="size-6 fill-kaza-warning text-kaza-warning" />
            <h2 className="font-heading text-2xl font-bold">
              4.92 · {propertyRatings.length} avis
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {propertyRatings.map((rating) => {
              const rater = mockUsers.find((u) => u.id === rating.rater_id);
              return (
                <div key={rating.id} className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-kaza-navy text-white text-xs">
                        {rater
                          ? getInitials(rater.first_name, rater.last_name)
                          : "??"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {rater
                          ? `${rater.first_name} ${rater.last_name}`
                          : "Utilisateur"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(rating.created_at)}
                      </p>
                    </div>
                  </div>
                  <RatingStars rating={rating.rating} size="sm" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    {rating.comment}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "RealEstateListing",
            name: property.title,
            description: property.description,
            url: `${process.env.NEXT_PUBLIC_APP_URL || ""}/properties/${property.id}`,
            price: property.price,
            priceCurrency: "XOF",
            address: {
              "@type": "PostalAddress",
              streetAddress: property.address,
            },
            numberOfBedrooms: property.bedrooms,
            numberOfBathroomsTotal: property.bathrooms,
            floorSize: {
              "@type": "QuantitativeValue",
              value: property.square_meters,
              unitCode: "MTK",
            },
          }),
        }}
      />
    </div>
  );
}
