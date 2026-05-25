import type { Metadata } from "next";
import Link from "next/link";
import { PropertyCard } from "@/components/property/property-card";
import { getAvailableProperties } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Propriétés",
  description: "Découvrez toutes les propriétés disponibles sur KAZA.",
};

export default function PropertiesPage() {
  const properties = getAvailableProperties();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <h1 className="mb-2 font-heading text-3xl font-bold">
        Toutes les propriétés
      </h1>
      <p className="mb-8 text-muted-foreground">
        {properties.length} annonces disponibles
      </p>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {properties.map((property) => (
          <PropertyCard
            key={property.id}
            id={property.id}
            title={property.title}
            price={property.price}
            address={property.address}
            bedrooms={property.bedrooms}
            bathrooms={property.bathrooms}
            squareMeters={property.square_meters}
            imageUrl={
              property.photos[0]?.photo_url ||
              "https://picsum.photos/seed/kaza-placeholder/800/600"
            }
            propertyType={property.property_type}
            rating={4.5 + Math.random() * 0.5}
            isVerified
          />
        ))}
      </div>
    </div>
  );
}
