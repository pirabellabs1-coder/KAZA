import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Plus, Sparkles } from "lucide-react";
import { PropertyCard } from "@/components/property/property-card";
import { Button } from "@/components/ui/button";
import { listPublicProperties } from "@/lib/queries/properties";
import { getCurrentUser } from "@/lib/supabase/queries/users";

export const metadata: Metadata = {
  title: "Propriétés",
  description: "Découvrez toutes les propriétés disponibles sur KAZA.",
};

export default async function PropertiesPage() {
  const [properties, currentUser] = await Promise.all([
    listPublicProperties({ limit: 60 }),
    getCurrentUser().catch(() => null),
  ]);

  const canPublish = currentUser && currentUser.role !== "TENANT";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <h1 className="mb-2 font-heading text-3xl font-bold">
        Toutes les propriétés
      </h1>
      <p className="mb-8 text-muted-foreground">
        {properties.length} annonce{properties.length > 1 ? "s" : ""} disponible
        {properties.length > 1 ? "s" : ""}
      </p>

      {properties.length === 0 ? (
        <EmptyState canPublish={Boolean(canPublish)} />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              id={property.id}
              title={property.title}
              price={property.price}
              listingType={property.listingType}
              address={property.address}
              bedrooms={property.bedrooms}
              bathrooms={property.bathrooms}
              squareMeters={property.sqm}
              imageUrl={
                property.primaryPhotoUrl ||
                "/images/property-placeholder.jpg"
              }
              propertyType={property.type}
              isVerified={property.owner?.isVerified ?? false}
              isFeatured={property.viewsCount > 1000}
              isBoosted={property.isBoosted}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ canPublish }: { canPublish: boolean }) {
  return (
    <div className="mx-auto mt-8 max-w-2xl rounded-3xl border border-dashed border-gray-200 bg-gradient-to-br from-white to-gray-50/80 p-10 text-center shadow-sm">
      <div className="mx-auto mb-6 inline-flex size-20 items-center justify-center rounded-2xl bg-kaza-blue/10">
        <Building2 className="size-10 text-kaza-blue" />
      </div>
      <h2 className="font-heading text-2xl font-bold text-kaza-navy">
        Aucune annonce pour le moment
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
        Soyez le premier à publier sur KAZA — votre annonce sera visible
        immédiatement par des milliers de candidats locataires.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {canPublish ? (
          <Button
            asChild
            size="lg"
            className="gap-2 bg-kaza-blue hover:bg-kaza-blue/90"
          >
            <Link href="/owner/properties/new">
              <Plus className="size-4" />
              Publier une annonce
            </Link>
          </Button>
        ) : (
          <Button
            asChild
            size="lg"
            className="gap-2 bg-kaza-blue hover:bg-kaza-blue/90"
          >
            <Link href="/signup">
              <Sparkles className="size-4" />
              Devenir propriétaire
            </Link>
          </Button>
        )}
        <Button asChild size="lg" variant="outline">
          <Link href="/search">Explorer la recherche</Link>
        </Button>
      </div>
    </div>
  );
}
