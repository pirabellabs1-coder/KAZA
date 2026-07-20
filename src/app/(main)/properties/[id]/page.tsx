import type { Metadata } from "next";
import {
  MapPin,
  Users,
  Bed,
  Bath,
  Maximize,
  Wifi,
  Star,
  MessageSquare,
  Compass,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RatingStars } from "@/components/shared/rating-stars";
import { PropertyCard } from "@/components/property/property-card";
import { VirtualTour } from "@/components/property/virtual-tour";
import { Panorama360Viewer } from "@/components/property/panorama-360-viewer";
import { PropertyActions } from "@/components/property/property-actions";
import { PropertyLocationMap } from "@/components/property/property-location-map";
import { VisitRequestButton } from "@/components/property/visit-request-button";
import { ApplyButton } from "@/components/property/apply-button";
import { MakeOfferButton } from "./make-offer-button";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { VerificationBadge } from "@/components/shared/verification-badge";
import { PropertyViewTracker } from "@/components/analytics/page-tracker";
import { formatPrice, formatDate, getInitials } from "@/lib/utils";
import { notFound } from "next/navigation";
import {
  getPropertyById,
  listPublicProperties,
} from "@/lib/queries/properties";
import { getPropertyReviews } from "@/lib/queries/reviews";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const property = await getPropertyById(id);
  if (!property) return { title: "Propriété introuvable" };

  const canonical = `/properties/${id}`;
  const priceSuffix = property.listingType === "SALE" ? "" : "/mois";
  const ogTitle = `${property.title} - ${formatPrice(property.price)}${priceSuffix}`;
  const description = property.description?.slice(0, 160);
  const images = property.primaryPhotoUrl ? [property.primaryPhotoUrl] : [];

  return {
    title: `${property.title} - ${formatPrice(property.price)}${priceSuffix} | Kaabo`,
    description,
    alternates: { canonical },
    openGraph: {
      title: ogTitle,
      description,
      url: canonical,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images,
    },
  };
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getPropertyById(id);

  if (!property) {
    notFound();
  }

  const owner = property.owner;

  // Auth resolue cote serveur pour eviter le flash bouton "Demander une visite"
  // -> redirect login si non connecte.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = Boolean(user);
  const isOwnProperty = user?.id === owner?.id;
  const isSale = property.listingType === "SALE";

  const ownerFullName = owner
    ? `${owner.firstName} ${owner.lastName}`
    : "Le proprietaire";

  // Propriétés similaires : on prend les dernières publiées hors la propriété actuelle.
  const similarRaw = await listPublicProperties({ limit: 6 });
  const similarProperties = similarRaw.filter((p) => p.id !== property.id);

  // Avis publiés sur cette propriété (note moyenne réelle + liste)
  const { reviews, averageRating, totalCount: reviewsCount } =
    await getPropertyReviews(property.id);

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

  // Statut de vérification dérivé du booléen (le badge attend une string enum).
  const ownerVerificationStatus = owner?.isVerified ? "APPROVED" : "PENDING";

  return (
    <div className="min-h-screen bg-white">
      {/* Tracking PROPERTY_VIEW (client, best-effort) */}
      <PropertyViewTracker propertyId={property.id} />
      {/* Gallery + Virtual Tour */}
      <div className="mx-auto max-w-7xl px-4 pt-6 lg:px-8">
        <VirtualTour
          images={property.photos}
          videoUrl={undefined}
          embedUrl={undefined}
        />
      </div>

      {/* Vue 360° (si disponible) */}
      {property.panoramaUrl && (
        <div className="mx-auto max-w-7xl px-4 pt-4 lg:px-8">
          <div className="mb-2 flex items-center gap-2">
            <Compass className="size-5 text-kaza-blue" />
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Visite virtuelle 360°
            </h2>
          </div>
          <Panorama360Viewer
            src={property.panoramaUrl}
            height={440}
            autoRotate
          />
        </div>
      )}

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
              <PropertyActions
                propertyId={property.id}
                propertyTitle={property.title}
                propertyAddress={property.address}
                ownerName={ownerFullName}
                isAuthenticated={isAuthenticated}
                isOwnProperty={isOwnProperty}
              />
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
                <span>{property.sqm} m²</span>
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
                      {getInitials(owner.firstName, owner.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        Géré par {owner.firstName} {owner.lastName}
                      </span>
                      <VerificationBadge status={ownerVerificationStatus} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Membre Kaabo · annonce publiée le{" "}
                      {formatDate(property.createdAt)}
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
            {property.amenities.length > 0 && (
              <>
                <div>
                  <h2 className="mb-4 text-lg font-semibold">Équipements</h2>
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
              </>
            )}

            {/* Emplacement — carte interactive réelle */}
            <div>
              <h2 className="mb-4 text-lg font-semibold">
                Localisation / Emplacement
              </h2>
              <PropertyLocationMap address={property.address} />
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
                  {!isSale && (
                    <span className="text-muted-foreground"> /mois</span>
                  )}
                  {isSale && (
                    <span className="ml-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      À vendre
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="size-4 fill-kaza-warning text-kaza-warning" />
                  {reviewsCount > 0 ? (
                    <>
                      <span className="font-medium">
                        {averageRating.toFixed(1)}
                      </span>
                      <span className="text-muted-foreground">
                        · {reviewsCount} avis
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="font-medium">—</span>
                      <span className="text-muted-foreground">· nouveau</span>
                    </>
                  )}
                </div>
              </div>

              {isSale ? (
                /* ============ ENCART VENTE ============ */
                <>
                  <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50/60 p-3">
                    <p className="text-xs font-semibold text-amber-700">
                      Bien à vendre
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Faites une offre : après accord du vendeur, vous versez un
                      acompte de réservation (Mobile Money) qui bloque le bien.
                      La vente est finalisée chez le notaire (OHADA).
                    </p>
                  </div>

                  {isOwnProperty ? (
                    <div className="mb-3 rounded-md border border-dashed border-muted-foreground/40 bg-muted/40 p-3 text-center text-xs text-muted-foreground">
                      Vous êtes le propriétaire de ce bien.
                    </div>
                  ) : (
                    <div className="mb-3 space-y-2">
                      <MakeOfferButton
                        propertyId={property.id}
                        propertyTitle={property.title}
                        askingPrice={property.price}
                        isAuthenticated={isAuthenticated}
                      />
                      <Button asChild variant="outline" className="w-full">
                        <Link
                          href={
                            owner?.id
                              ? `/messages?to=${owner.id}`
                              : "/messages"
                          }
                        >
                          Contacter le vendeur
                        </Link>
                      </Button>
                    </div>
                  )}

                  <p className="mb-1 text-center text-xs text-muted-foreground">
                    Prix affiché : {formatPrice(property.price)}
                  </p>
                </>
              ) : (
                /* ============ ENCART LOCATION ============ */
                <>
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

                  {isOwnProperty ? (
                    <div className="mb-3 rounded-md border border-dashed border-muted-foreground/40 bg-muted/40 p-3 text-center text-xs text-muted-foreground">
                      Vous êtes le propriétaire de ce bien.
                    </div>
                  ) : (
                    <div className="mb-3 space-y-2">
                      <VisitRequestButton
                        propertyId={property.id}
                        propertyTitle={property.title}
                        propertyAddress={property.address}
                        ownerName={ownerFullName}
                        isAuthenticated={isAuthenticated}
                        variant="large"
                      />
                      <ApplyButton
                        propertyId={property.id}
                        propertyTitle={property.title}
                        isAuthenticated={isAuthenticated}
                      />
                    </div>
                  )}

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
                        Commission Kaabo
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
                </>
              )}
            </div>
          </div>
        </div>

        {/* Reviews */}
        <Separator className="my-12" />
        <section>
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="font-heading text-2xl font-bold">
              Avis ({reviewsCount})
            </h2>
            {reviewsCount > 0 && (
              <div className="flex items-center gap-2">
                <Star className="size-5 fill-kaza-warning text-kaza-warning" />
                <span className="text-lg font-semibold">
                  {averageRating.toFixed(1)}
                </span>
                <span className="text-sm text-muted-foreground">
                  / 5
                </span>
              </div>
            )}
          </div>

          {reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <MessageSquare className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Aucun avis pour le moment
              </p>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                Soyez le premier à partager votre expérience après une
                location.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-xl border bg-card p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="size-10">
                      <AvatarFallback className="bg-kaza-navy text-sm text-white">
                        {review.reviewerInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold">
                          {review.reviewerName}
                        </p>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                      <div className="mt-1">
                        <RatingStars rating={review.rating} size="sm" />
                      </div>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Similar Properties */}
        {similarProperties.length > 0 && (
          <>
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
                    listingType={p.listingType}
                    address={p.address}
                    bedrooms={p.bedrooms}
                    bathrooms={p.bathrooms}
                    squareMeters={p.sqm}
                    imageUrl={
                      p.primaryPhotoUrl ||
                      "/images/property-placeholder.jpg"
                    }
                    propertyType={p.type}
                    isVerified={p.owner?.isVerified ?? false}
                  />
                ))}
              </div>
            </section>
          </>
        )}
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
              value: property.sqm,
              unitCode: "MTK",
            },
          }),
        }}
      />
    </div>
  );
}
