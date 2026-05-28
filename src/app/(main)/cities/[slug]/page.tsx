import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Compass,
  GraduationCap,
  Heart,
  Home,
  MapPin,
  Search,
  Sparkles,
  TramFront,
} from "lucide-react";

import { BlogPreviewCard } from "@/components/marketing/blog-preview-card";
import { CityCard } from "@/components/marketing/city-card";
import { FeatureHighlight } from "@/components/marketing/feature-highlight";
import { StatCounter } from "@/components/marketing/stat-counter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/property/property-card";
import { FadeIn } from "@/components/shared/fade-in";
import { RevealOnScroll } from "@/components/shared/reveal-on-scroll";
import { BLOG_ARTICLES } from "@/lib/blog-data";
import { CITIES, type City } from "@/lib/marketing-data";
import { formatPrice } from "@/lib/utils";

// =============================================================================
// generateStaticParams + Metadata SEO
// =============================================================================

export function generateStaticParams() {
  return CITIES.map((city) => ({ slug: city.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const city = CITIES.find((c) => c.slug === slug);
  if (!city) return { title: "Ville introuvable | KAZA" };
  return {
    title: `Louer à ${city.name} — Annonces, quartiers et prix | KAZA`,
    description: `Découvrez ${city.propertiesCount.toLocaleString(
      "fr-FR",
    )} annonces vérifiées à ${city.name}. Prix moyen ${formatPrice(city.averagePrice)} /mois. Quartiers, marché, guides.`,
    openGraph: {
      title: `Louer à ${city.name} avec KAZA`,
      description: city.description,
      type: "website",
      images: [city.imageUrl],
    },
  };
}

// =============================================================================
// Mocks
// =============================================================================

function buildMockProperties(city: City) {
  const types = ["APARTMENT", "STUDIO", "VILLA", "HOUSE"] as const;
  const titles = [
    `Bel appartement lumineux à ${city.name}`,
    `Studio meublé moderne à ${city.name}`,
    `Villa familiale avec jardin à ${city.name}`,
    `Maison de charme en plein cœur de ${city.name}`,
  ];
  return Array.from({ length: 4 }, (_, i) => {
    const neighborhood =
      city.neighborhoods[i % city.neighborhoods.length] ?? city.name;
    return {
      id: `mock-${city.slug}-${i + 1}`,
      title: titles[i],
      price: Math.round((city.averagePrice * (0.8 + i * 0.15)) / 1000) * 1000,
      address: `${neighborhood}, ${city.name}`,
      bedrooms: 1 + (i % 3),
      bathrooms: 1 + (i % 2),
      squareMeters: 35 + i * 18,
      imageUrl: `https://picsum.photos/seed/${city.slug}-${i}/800/600`,
      propertyType: types[i % types.length],
      rating: 4.5 + (i % 5) * 0.1,
      reviewsCount: 12 + i * 7,
      isVerified: true,
      isFeatured: i === 0,
    };
  });
}

function buildNeighborhoodStats(city: City) {
  return city.neighborhoods.map((name, i) => ({
    name,
    count: Math.max(
      8,
      Math.round(
        (city.propertiesCount / city.neighborhoods.length) *
          (0.6 + (i % 4) * 0.18),
      ),
    ),
    averagePrice: Math.round(
      (city.averagePrice * (0.7 + (i % 5) * 0.12)) / 1000,
    ) * 1000,
    imageSeed: `${city.slug}-nb-${i}`,
  }));
}

function findRelatedArticles(cityName: string) {
  const needle = cityName.toLowerCase().split("-")[0];
  return BLOG_ARTICLES.filter((article) =>
    article.tags.some((tag) => tag.toLowerCase().includes(needle)),
  ).slice(0, 3);
}

// =============================================================================
// Page
// =============================================================================

export default async function CityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const city = CITIES.find((c) => c.slug === slug);
  if (!city) notFound();

  const mockProperties = buildMockProperties(city);
  const neighborhoodStats = buildNeighborhoodStats(city);
  const relatedArticles = findRelatedArticles(city.name);
  const otherCities = CITIES.filter((c) => c.slug !== city.slug).slice(0, 3);
  const estimatedPopulation = Math.round(city.propertiesCount * 350);

  return (
    <div className="bg-white">
      {/* ============== HERO PLEIN BLEED =================================== */}
      <section className="relative h-[70vh] min-h-[560px] w-full overflow-hidden">
        <Image
          src={city.imageUrl}
          alt={`Vue panoramique de ${city.name}, ${city.country}`}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/80"
        />
        <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-16 lg:px-8 lg:pb-24">
          <FadeIn>
            <nav
              aria-label="Fil d'Ariane"
              className="mb-6 flex items-center gap-2 text-sm text-white/80"
            >
              <Link href="/" className="hover:text-white">
                Accueil
              </Link>
              <span aria-hidden="true">/</span>
              <Link href="/cities" className="hover:text-white">
                Villes
              </Link>
              <span aria-hidden="true">/</span>
              <span className="font-medium text-white">{city.name}</span>
            </nav>

            <Badge className="mb-5 inline-flex border-0 bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-md">
              <MapPin className="mr-1.5 size-3" aria-hidden="true" />
              {city.country}
            </Badge>
            <h1 className="font-heading text-5xl font-bold leading-[1.05] text-white drop-shadow-lg sm:text-6xl lg:text-7xl">
              {city.name}
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-white/90 sm:text-xl">
              {city.description}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Badge className="border-0 bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-md">
                <Sparkles className="mr-2 size-3.5 text-kaza-green" />
                {city.propertiesCount.toLocaleString("fr-FR")} annonces
                disponibles
              </Badge>
              <Badge className="border-0 bg-kaza-green px-4 py-2 text-sm font-semibold text-white shadow-lg">
                {formatPrice(city.averagePrice)} /mois en moyenne
              </Badge>
              <Badge className="border-0 bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-md">
                {city.neighborhoods.length} quartiers couverts
              </Badge>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-full bg-kaza-green px-7 text-base font-semibold shadow-xl hover:bg-kaza-green/90"
              >
                <Link href={`/search?location=${city.slug}`}>
                  <Search className="mr-2 size-4" />
                  Voir les annonces
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-full border-white/40 bg-white/10 px-7 text-base font-semibold text-white backdrop-blur-md hover:bg-white/20"
              >
                <Link href="/neighborhoods/compare">
                  <Compass className="mr-2 size-4" />
                  Comparer les quartiers
                </Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ============== STATS PREMIUM ====================================== */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <FadeIn>
            <div className="mb-14 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-kaza-blue">
                Marché immobilier
              </p>
              <h2 className="font-heading text-3xl font-bold text-kaza-navy sm:text-4xl lg:text-5xl">
                {city.name} en chiffres
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
                Les données clés du marché locatif, mises à jour chaque
                trimestre par notre équipe terrain.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            <RevealOnScroll>
              <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-xl">
                <StatCounter
                  value={city.propertiesCount}
                  label="Annonces actives"
                  description="Vérifiées par nos équipes terrain"
                />
              </div>
            </RevealOnScroll>
            <RevealOnScroll delay={100}>
              <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-xl">
                <StatCounter
                  value={city.averagePrice}
                  suffix=" FCFA"
                  label="Prix moyen mensuel"
                  description="Tous types confondus"
                />
              </div>
            </RevealOnScroll>
            <RevealOnScroll delay={200}>
              <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-xl">
                <StatCounter
                  value={estimatedPopulation}
                  label="Population estimée"
                  description="Habitants dans la zone couverte"
                />
              </div>
            </RevealOnScroll>
            <RevealOnScroll delay={300}>
              <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-xl">
                <StatCounter
                  value={city.neighborhoods.length}
                  label="Quartiers couverts"
                  description="Cartographiés et notés par KAZA"
                />
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* ============== ANNONCES À LA UNE ================================== */}
      <section className="bg-gradient-to-b from-[#F4F7FB] to-white py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <FadeIn>
            <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-kaza-blue">
                  Sélection KAZA
                </p>
                <h2 className="font-heading text-3xl font-bold text-kaza-navy sm:text-4xl lg:text-5xl">
                  Annonces à la une à {city.name}
                </h2>
              </div>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full"
              >
                <Link href={`/search?location=${city.slug}`}>
                  Voir toutes les annonces
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {mockProperties.map((property, i) => (
              <RevealOnScroll key={property.id} delay={i * 80}>
                <PropertyCard {...property} />
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ============== QUARTIERS POPULAIRES =============================== */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <FadeIn>
            <div className="mb-12">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-kaza-blue">
                Géographie locale
              </p>
              <h2 className="font-heading text-3xl font-bold text-kaza-navy sm:text-4xl lg:text-5xl">
                Quartiers populaires de {city.name}
              </h2>
              <p className="mt-4 max-w-2xl text-base text-muted-foreground">
                Chaque quartier a sa personnalité, ses prix et ses atouts.
                Explorez ceux qui correspondent à votre mode de vie.
              </p>
            </div>
          </FadeIn>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {neighborhoodStats.slice(0, 6).map((nh, i) => (
              <RevealOnScroll key={nh.name} delay={i * 60}>
                <Link
                  href={`/search?location=${city.slug}&neighborhood=${encodeURIComponent(nh.name)}`}
                  className="group block focus-visible:outline-none"
                >
                  <article className="relative h-full overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl">
                    <div className="relative aspect-[16/10] w-full overflow-hidden">
                      <Image
                        src={`https://picsum.photos/seed/${nh.imageSeed}/800/500`}
                        alt={`Vue du quartier ${nh.name}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                      <h3 className="absolute bottom-4 left-5 right-5 font-heading text-2xl font-bold text-white drop-shadow-md">
                        {nh.name}
                      </h3>
                    </div>
                    <div className="flex items-center justify-between gap-3 p-6">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {nh.count.toLocaleString("fr-FR")} annonces · à partir
                          de{" "}
                          <span className="font-semibold text-kaza-navy">
                            {formatPrice(nh.averagePrice)}
                          </span>
                        </p>
                      </div>
                      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-kaza-blue/10 text-kaza-blue transition-all group-hover:bg-kaza-blue group-hover:text-white">
                        <ArrowRight className="size-4" />
                      </span>
                    </div>
                  </article>
                </Link>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ============== POURQUOI VIVRE À ================================== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-kaza-navy via-[#0F2A40] to-kaza-navy py-24 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-32 size-[480px] rounded-full bg-kaza-blue/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-32 size-[480px] rounded-full bg-kaza-green/15 blur-3xl"
        />
        <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
            <FadeIn>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-kaza-green">
                  L&apos;art de vivre
                </p>
                <h2 className="font-heading text-4xl font-bold leading-tight sm:text-5xl">
                  Pourquoi vivre à {city.name}
                </h2>
                <div className="mt-8 space-y-5 text-lg leading-relaxed text-white/85">
                  <p>
                    {city.name} séduit chaque année des milliers de nouveaux
                    habitants venus de tout le {city.country} et de la diaspora.
                    Entre dynamisme économique, qualité de vie et patrimoine
                    culturel, la ville offre un cadre rare où tradition et
                    modernité se conjuguent.
                  </p>
                  <p>
                    Les {city.neighborhoods.length} quartiers que nous couvrons
                    reflètent cette diversité : des zones résidentielles
                    paisibles aux pôles d&apos;activité animés, en passant par
                    les abords prisés des grands axes. Chacun trouve son
                    équilibre.
                  </p>
                  <p>
                    Notre équipe locale visite chaque bien, vérifie chaque
                    document et accompagne propriétaires comme locataires dans
                    leur projet. Vivre à {city.name} avec KAZA, c&apos;est
                    s&apos;épargner les mauvaises surprises et profiter
                    pleinement de la ville.
                  </p>
                </div>
              </div>
            </FadeIn>

            <div className="grid gap-5">
              <RevealOnScroll>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-2 backdrop-blur-md">
                  <FeatureHighlight
                    icon="ShieldCheck"
                    title="Sécurité renforcée"
                    description="Quartiers cartographiés, points d'intérêt et zones à privilégier identifiés par notre équipe terrain."
                    metric="Audit semestriel"
                    className="!bg-transparent hover:!bg-white/5 [&>h3]:!text-white [&>p]:!text-white/75 [&_div:first-child]:!bg-white/10 [&_div:first-child]:!text-white"
                  />
                </div>
              </RevealOnScroll>
              <RevealOnScroll delay={100}>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-2 backdrop-blur-md">
                  <div className="group flex flex-col gap-3 rounded-xl p-5 transition-colors hover:bg-white/5">
                    <div className="flex size-12 items-center justify-center rounded-full bg-white/10 text-white transition-transform group-hover:scale-110">
                      <TramFront className="size-6" aria-hidden="true" />
                    </div>
                    <h3 className="font-heading text-base font-semibold text-white">
                      Transports accessibles
                    </h3>
                    <p className="text-sm text-white/75">
                      Lignes urbaines, taxis-motos, points de stationnement
                      sécurisés : la mobilité à {city.name} cartographiée pour
                      chaque annonce.
                    </p>
                    <p className="mt-1 text-sm font-medium text-kaza-green">
                      Temps de trajet calculé
                    </p>
                  </div>
                </div>
              </RevealOnScroll>
              <RevealOnScroll delay={200}>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-2 backdrop-blur-md">
                  <div className="group flex flex-col gap-3 rounded-xl p-5 transition-colors hover:bg-white/5">
                    <div className="flex size-12 items-center justify-center rounded-full bg-white/10 text-white transition-transform group-hover:scale-110">
                      <GraduationCap className="size-6" aria-hidden="true" />
                    </div>
                    <h3 className="font-heading text-base font-semibold text-white">
                      Écoles et universités
                    </h3>
                    <p className="text-sm text-white/75">
                      Établissements à proximité, primaires, secondaires et
                      supérieurs : un critère décisif pour familles et étudiants.
                    </p>
                    <p className="mt-1 text-sm font-medium text-kaza-green">
                      Distance affichée sur chaque bien
                    </p>
                  </div>
                </div>
              </RevealOnScroll>
            </div>
          </div>
        </div>
      </section>

      {/* ============== COMPARER AVEC D'AUTRES VILLES ====================== */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <FadeIn>
            <div className="mb-12 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-kaza-blue">
                Élargir la recherche
              </p>
              <h2 className="font-heading text-3xl font-bold text-kaza-navy sm:text-4xl lg:text-5xl">
                Comparer avec d&apos;autres villes
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
                Confrontez {city.name} aux autres marchés couverts par KAZA.
              </p>
            </div>
          </FadeIn>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {otherCities.map((c, i) => (
              <RevealOnScroll key={c.slug} delay={i * 80}>
                <CityCard
                  slug={c.slug}
                  name={c.name}
                  country={c.country}
                  imageUrl={c.imageUrl}
                  propertiesCount={c.propertiesCount}
                  averagePrice={c.averagePrice}
                  neighborhoods={c.neighborhoods}
                />
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ============== ARTICLES BLOG ====================================== */}
      {relatedArticles.length > 0 && (
        <section className="bg-gradient-to-b from-white to-[#F4F7FB] py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <FadeIn>
              <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-kaza-blue">
                    À lire aussi
                  </p>
                  <h2 className="font-heading text-3xl font-bold text-kaza-navy sm:text-4xl lg:text-5xl">
                    Articles sur {city.name}
                  </h2>
                </div>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/blog">
                    <BookOpen className="mr-2 size-4" />
                    Tout le journal
                  </Link>
                </Button>
              </div>
            </FadeIn>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {relatedArticles.map((article, i) => (
                <RevealOnScroll key={article.slug} delay={i * 80}>
                  <BlogPreviewCard
                    slug={article.slug}
                    title={article.title}
                    excerpt={article.excerpt}
                    category={article.category}
                    readingTime={article.readingTime}
                    publishedAt={article.publishedAt}
                    imageUrl={article.imageUrl}
                    className="rounded-3xl"
                  />
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============== CTA RECHERCHE ====================================== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-kaza-navy via-[#0F2A40] to-kaza-blue py-24 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-32 -top-32 size-[480px] rounded-full bg-kaza-green/20 blur-3xl"
        />
        <div className="relative mx-auto max-w-4xl px-4 text-center lg:px-8">
          <div className="mx-auto mb-6 inline-flex size-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md">
            <Home className="size-7 text-kaza-green" aria-hidden="true" />
          </div>
          <h2 className="font-heading text-4xl font-bold sm:text-5xl lg:text-6xl">
            Prêt à trouver votre logement
            <br />à {city.name} ?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80 sm:text-xl">
            Plus de {city.propertiesCount.toLocaleString("fr-FR")} annonces
            vérifiées vous attendent. Filtrez par quartier, budget et équipements
            en quelques clics.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full bg-kaza-green px-8 text-base font-semibold hover:bg-kaza-green/90"
            >
              <Link href={`/search?location=${city.slug}`}>
                <Search className="mr-2 size-4" />
                Rechercher à {city.name}
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-full border-white/40 bg-white/5 px-8 text-base font-semibold text-white backdrop-blur-md hover:bg-white/15"
            >
              <Link href="/cities">
                <Heart className="mr-2 size-4" />
                Voir toutes les villes
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
