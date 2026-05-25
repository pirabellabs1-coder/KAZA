import type { Metadata } from "next";
import { Heart } from "lucide-react";
import { PropertyCard } from "@/components/property/property-card";
import { EmptyState } from "@/components/shared/empty-state";
import {
  getSavedPropertyIds,
  getPropertyById as mockGetPropertyById,
} from "@/lib/mock-data";
import { fetchWithFallback } from "@/lib/data-fetcher";
import { createClient } from "@/lib/supabase/server";
import type { PropertyWithPhotos } from "@/types/properties";

export const metadata: Metadata = {
  title: "Propriétés Sauvegardées",
};

const MOCK_TENANT_ID = "u-004-tenant-thomas";

async function loadSavedProperties(): Promise<PropertyWithPhotos[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("saved_properties")
    .select(
      `
      property:properties (
        *,
        photos:property_photos (*)
      )
    `,
    )
    .eq("user_id", user.id);

  const rows = (data ?? []) as Array<{ property: PropertyWithPhotos | null }>;
  return rows.map((r) => r.property).filter(Boolean) as PropertyWithPhotos[];
}

function loadMockSaved(): PropertyWithPhotos[] {
  const ids = getSavedPropertyIds(MOCK_TENANT_ID);
  return ids
    .map((id) => mockGetPropertyById(id))
    .filter((p): p is PropertyWithPhotos => Boolean(p));
}

export default async function TenantSavedPage() {
  const savedProperties = await fetchWithFallback(loadSavedProperties, loadMockSaved);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Propriétés Sauvegardées
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {savedProperties.length} bien
          {savedProperties.length > 1 ? "s" : ""} sauvegardé
          {savedProperties.length > 1 ? "s" : ""}
        </p>
      </div>

      {savedProperties.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {savedProperties.map((property) => (
            <PropertyCard
              key={property.id}
              id={property.id}
              title={property.title}
              price={property.price}
              address={property.address}
              bedrooms={property.bedrooms ?? 0}
              bathrooms={property.bathrooms ?? 0}
              squareMeters={property.square_meters ?? 0}
              imageUrl={
                property.photos[0]?.photo_url ||
                "https://picsum.photos/seed/kaza-placeholder/800/600"
              }
              propertyType={property.property_type}
              isFavorite={true}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Heart}
          title="Aucun bien sauvegardé"
          description="Parcourez les annonces et ajoutez vos biens favoris pour les retrouver facilement ici."
        />
      )}
    </div>
  );
}
