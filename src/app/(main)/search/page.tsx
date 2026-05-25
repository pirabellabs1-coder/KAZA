import type { Metadata } from "next";
import Link from "next/link";
import { PropertyCard } from "@/components/property/property-card";
import { PropertyFilters } from "@/components/property/property-filters";
import { PropertySearchBar } from "@/components/property/property-search-bar";
import { getAvailableProperties } from "@/lib/mock-data";
import { LayoutGrid, List, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchWithFallback } from "@/lib/data-fetcher";
import { searchProperties } from "@/lib/supabase/queries/properties";

export const metadata: Metadata = {
  title: "Rechercher",
  description:
    "Trouvez votre logement idéal au Bénin. Filtrez par prix, type, localisation.",
};

const PER_PAGE = 12;

interface SearchPageParams {
  q?: string;
  location?: string;
  type?: string;
  budget?: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  page?: string;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchPageParams>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const minPrice = sp.minPrice ? parseInt(sp.minPrice, 10) : undefined;
  const maxPrice = sp.maxPrice ? parseInt(sp.maxPrice, 10) : undefined;
  const bedrooms = sp.bedrooms ? parseInt(sp.bedrooms, 10) : undefined;

  const result = await fetchWithFallback(
    () =>
      searchProperties({
        q: sp.q,
        city: sp.location,
        type: sp.type,
        minPrice,
        maxPrice,
        bedrooms,
        page,
        perPage: PER_PAGE,
      }),
    () => {
      const all = getAvailableProperties();
      return { items: all, total: all.length, page, perPage: PER_PAGE };
    },
  );

  const { items: properties, total } = result;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const buildPageUrl = (p: number) => {
    const params = new URLSearchParams();
    Object.entries(sp).forEach(([k, v]) => {
      if (v && k !== "page") params.set(k, String(v));
    });
    params.set("page", String(p));
    return `/search?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Search Header */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 lg:px-8">
          <PropertySearchBar variant="compact" />
        </div>

        {/* Filter pills (mobile) */}
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-4 lg:hidden lg:px-8">
          <PropertyFilters />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        {/* Results header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">
              {sp.location ? `Propriétés à ${sp.location}` : "Toutes les propriétés"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {total} annonce{total > 1 ? "s" : ""} disponible{total > 1 ? "s" : ""}
            </p>
          </div>

          <div className="hidden items-center gap-1 rounded-lg border bg-white p-1 sm:flex">
            <Button variant="secondary" size="icon-sm">
              <List className="size-4" />
            </Button>
            <Button variant="ghost" size="icon-sm">
              <LayoutGrid className="size-4" />
            </Button>
            <Button variant="ghost" size="icon-sm">
              <Map className="size-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex gap-8">
          {/* Desktop Filters Sidebar */}
          <div className="hidden lg:block">
            <PropertyFilters />
          </div>

          {/* Results Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
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

            {/* Pagination */}
            {totalPages > 1 ? (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
                  {page > 1 ? <Link href={buildPageUrl(page - 1)}>Précédent</Link> : <span>Précédent</span>}
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    size="sm"
                    variant={p === page ? "default" : "outline"}
                    className={p === page ? "bg-kaza-navy" : ""}
                    asChild
                  >
                    <Link href={buildPageUrl(p)}>{p}</Link>
                  </Button>
                ))}
                <Button variant="outline" size="sm" disabled={page >= totalPages} asChild={page < totalPages}>
                  {page < totalPages ? <Link href={buildPageUrl(page + 1)}>Suivant</Link> : <span>Suivant</span>}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
