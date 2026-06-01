import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, MapPin, Search, ArrowRight, Crown } from "lucide-react";

import {
  COUNTRIES,
  getAllCities,
  getCountryByCode,
  type City,
  type Country,
} from "@/lib/geo/locations";
import { listPublicProperties } from "@/lib/queries/properties";
import { PropertyCard } from "@/components/property/property-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// =============================================================================
// KAZA — /cities/[slug]
// Page ville construite depuis le référentiel géographique (COUNTRIES). Affiche
// les annonces réelles publiées dans la ville (via listPublicProperties). Si
// aucune annonce, empty-state honnête + CTA recherche. SEO local par ville.
// =============================================================================

/** Retrouve une ville (et son pays) par slug dans le référentiel géo. */
function resolveCity(
  slug: string,
): { city: City; country: Country } | undefined {
  const city = getAllCities().find((c) => c.slug === slug);
  if (!city) return undefined;
  const country = getCountryByCode(city.countryCode);
  if (!country) return undefined;
  return { city, country };
}

export function generateStaticParams() {
  // On pré-génère les villes des pays opérationnels en priorité, plus les
  // capitales des autres pays, pour couvrir le SEO local des marchés clés.
  const cities = COUNTRIES.flatMap((country) =>
    country.cities
      .filter((c) => country.status === "live" || c.isCapital)
      .map((c) => ({ slug: c.slug })),
  );
  return cities;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resolved = resolveCity(slug);
  if (!resolved) return { title: "Ville introuvable | KAZA" };

  const { city, country } = resolved;
  const title = `Immobilier à ${city.name}, ${country.name} — Location | KAZA`;
  const description = `Louez un appartement, une maison ou une chambre à ${city.name} (${country.name}). Annonces immobilières vérifiées et paiement sécurisé sur KAZA.`;
  const canonical = `/cities/${slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      images: ["/images/hero-bg.jpg"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/images/hero-bg.jpg"],
    },
  };
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resolved = resolveCity(slug);
  if (!resolved) notFound();

  const { city, country } = resolved;

  // Annonces réelles de cette ville (filtre ilike sur l'adresse). Pas de
  // données fictives : si la requête échoue ou ne renvoie rien, on affiche un
  // empty-state honnête.
  const properties = await listPublicProperties({ city: city.name, limit: 12 });

  return (
    <div className="bg-white">
      {/* ===== HERO ============================================== */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-kaza-navy via-[#0E2A40] to-kaza-blue py-16 lg:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-kaza-blue/30 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -right-32 h-[32rem] w-[32rem] rounded-full bg-kaza-green/25 blur-3xl"
        />
        <div className="relative z-10 mx-auto max-w-5xl px-4 lg:px-8">
          <nav
            aria-label="Fil d'Ariane"
            className="mb-5 flex flex-wrap items-center gap-1.5 text-xs text-white/70"
          >
            <Link href="/" className="transition-colors hover:text-white">
              Accueil
            </Link>
            <span aria-hidden>/</span>
            <Link
              href={`/search?country=${country.code}`}
              className="transition-colors hover:text-white"
            >
              {country.name}
            </Link>
            <span aria-hidden>/</span>
            <span className="text-white/95">{city.name}</span>
          </nav>

          {city.isCapital && (
            <Badge className="mb-4 border-amber-200/30 bg-amber-100/15 px-3 py-1 text-xs font-semibold text-amber-200">
              <Crown className="mr-1.5 size-3" />
              Capitale
            </Badge>
          )}

          <h1 className="font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Immobilier à {city.name}
          </h1>
          <p className="mt-3 flex items-center gap-2 text-base text-white/80 sm:text-lg">
            <MapPin className="size-4 text-kaza-green" />
            {city.name}, {country.name}
          </p>
          <p className="mt-5 max-w-2xl text-base text-white/80 sm:text-lg">
            Découvrez les logements à louer à {city.name} : appartements,
            maisons, studios et chambres en colocation. Annonces vérifiées,
            propriétaires de confiance et paiement sécurisé.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="bg-kaza-green text-white hover:bg-kaza-green/90"
            >
              <Link
                href={`/search?country=${country.code}&city=${city.slug}`}
              >
                <Search className="mr-2 size-4" />
                Voir toutes les annonces à {city.name}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ===== ANNONCES RÉCENTES ================================= */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="mb-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-kaza-blue">
              Annonces à {city.name}
            </p>
            <h2 className="mt-2 font-heading text-3xl font-bold text-kaza-navy sm:text-4xl">
              Logements disponibles
            </h2>
          </div>
          {properties.length > 0 && (
            <Link
              href={`/search?country=${country.code}&city=${city.slug}`}
              className="group inline-flex items-center gap-2 rounded-full border border-kaza-navy/20 px-5 py-2.5 text-sm font-semibold text-kaza-navy transition-all hover:border-kaza-navy hover:bg-kaza-navy hover:text-white"
            >
              Voir plus
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </div>

        {properties.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((p) => (
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
                  p.primaryPhotoUrl ??
                  "https://picsum.photos/seed/kaza-placeholder/800/600"
                }
                propertyType={p.type}
                isVerified={p.owner?.isVerified ?? false}
                isBoosted={p.isBoosted}
              />
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-2xl rounded-3xl border border-dashed border-kaza-blue/30 bg-gradient-to-b from-gray-50 to-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-full bg-kaza-blue/10 text-kaza-blue">
              <Building2 className="size-6" aria-hidden />
            </div>
            <h3 className="font-heading text-xl font-bold text-kaza-navy">
              Pas encore d&apos;annonce à {city.name}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Aucune annonce n&apos;est publiée dans cette ville pour le moment.
              Lancez une recherche élargie ou créez une alerte pour être prévenu
              dès qu&apos;un bien correspond à vos critères.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button
                asChild
                className="bg-kaza-navy text-white hover:bg-kaza-navy/90"
              >
                <Link href={`/search?country=${country.code}`}>
                  <Search className="mr-2 size-4" />
                  Rechercher en {country.name}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/search">Toutes les annonces</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Quartiers de la ville (référentiel géo) */}
        {city.neighborhoods.length > 0 && (
          <div className="mt-16">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy sm:text-3xl">
              Quartiers de {city.name}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Explorez les annonces quartier par quartier.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {city.neighborhoods.map((n) => (
                <Link
                  key={n.slug}
                  href={`/search?country=${country.code}&city=${city.slug}&q=${encodeURIComponent(n.name)}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-foreground transition-all hover:-translate-y-0.5 hover:border-kaza-blue hover:bg-kaza-blue/5 hover:text-kaza-blue"
                >
                  <MapPin className="size-3.5" />
                  {n.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* JSON-LD — page de collection pour la ville */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: `Immobilier à ${city.name}, ${country.name}`,
            about: {
              "@type": "City",
              name: city.name,
              address: {
                "@type": "PostalAddress",
                addressLocality: city.name,
                addressCountry: country.code,
              },
            },
          }),
        }}
      />
    </div>
  );
}
