// =============================================================================
// KAZA — Page Recherche luxe-pro (refonte complète)
// Server Component avec searchParams pour filtres GET
// Sections : Hero premium, tabs pays, villes populaires, filtres sticky,
// résultats (grid/liste/carte placeholder), alertes, top quartiers, FAQ, etc.
// =============================================================================

import type { Metadata } from "next";
import Link from "next/link";
import {
  Bath,
  Bed,
  Bell,
  Building2,
  Tag,
  Camera,
  ChevronRight,
  Compass,
  Crown,
  Filter,
  Globe2,
  Heart,
  Home as HomeIcon,
  LayoutGrid,
  List,
  MapPin,
  Map as MapIcon,
  Maximize,
  Megaphone,
  ScrollText,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Video,
  Wallet,
} from "lucide-react";

import {
  COUNTRIES,
  getCountryByCode,
  getAllCities,
  type Neighborhood,
} from "@/lib/geo/locations";
import { formatFcfa } from "@/lib/utils";
import {
  listPublicProperties,
  type PublicProperty,
} from "@/lib/queries/properties";
import { getGeoStats } from "@/lib/queries/geo-stats";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CountryFlag, GlobeFlag } from "@/components/shared/country-flag";
import { PageTracker } from "@/components/analytics/page-tracker";
import { SearchSaveActions } from "@/components/property/search-save-actions";

// SEO longue traîne : le titre et la description s'adaptent aux filtres de
// l'URL (pays / ville / type / budget) pour cibler des requêtes précises type
// « Appartements à Dakar ». Fallback générique si aucun filtre.
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;

  const selectedCountry =
    params.country && params.country !== "all"
      ? getCountryByCode(params.country)
      : undefined;
  const selectedCity = selectedCountry?.cities.find(
    (c) => c.slug === params.city,
  );
  const cityName = selectedCity?.name ?? params.q?.trim();
  const countryName = selectedCountry?.name;

  const normalizedType = normalizePropertyType(params.type);
  const typeLabel = normalizedType
    ? METADATA_TYPE_LABELS[normalizedType]
    : undefined;
  const maxPriceNum = params.maxPrice ? Number(params.maxPrice) : undefined;
  const hasMaxPrice =
    maxPriceNum !== undefined && Number.isFinite(maxPriceNum) && maxPriceNum > 0;

  const noun = typeLabel ?? "Logements";
  const place = cityName
    ? ` à ${cityName}`
    : countryName
      ? ` en ${countryName}`
      : "";

  let title: string;
  let description: string;

  if (cityName || countryName || typeLabel) {
    title = `${noun}${place} - KAZA`;
    description = `${noun} à louer${place} : annonces immobilières vérifiées${
      hasMaxPrice ? ` jusqu'à ${formatFcfa(maxPriceNum!)}` : ""
    }. Filtrez par quartier, prix et équipements sur KAZA.`;
  } else {
    title = "Rechercher un logement en Afrique";
    description =
      "Annonces immobilières vérifiées partout en Afrique. Filtres avancés par pays, ville, quartier, prix et équipements.";
  }

  return {
    title,
    description: description.slice(0, 160),
    alternates: { canonical: "/search" },
    openGraph: {
      title,
      description: description.slice(0, 160),
      url: "/search",
      type: "website",
    },
  };
}

// Libellés FR des types de bien pour les métadonnées SEO (singulier→pluriel).
const METADATA_TYPE_LABELS: Record<string, string> = {
  APARTMENT: "Appartements",
  HOUSE: "Maisons",
  VILLA: "Villas",
  STUDIO: "Studios",
  ROOM: "Chambres",
  COMMERCIAL: "Bureaux & commerces",
  LAND: "Terrains",
};

// -----------------------------------------------------------------------------
// Types & helpers
// -----------------------------------------------------------------------------

interface SearchParams {
  q?: string;
  country?: string;
  city?: string;
  neighborhood?: string;
  type?: string;
  listingType?: string;
  minPrice?: string;
  maxPrice?: string;
  minSurface?: string;
  maxSurface?: string;
  rooms?: string;
  bedrooms?: string;
  sort?: string;
  view?: string;
  page?: string;
  perPage?: string;
  // amenities (csv)
  amenities?: string;
  // targets (csv)
  targets?: string;
  // characteristics
  premium?: string;
  vr360?: string;
  video?: string;
  recent?: string;
}

const PROPERTY_TYPES = [
  { value: "all", label: "Tous types", icon: Building2 },
  { value: "APARTMENT", label: "Appartement", icon: Building2 },
  { value: "HOUSE", label: "Maison", icon: HomeIcon },
  { value: "VILLA", label: "Villa", icon: HomeIcon },
  { value: "STUDIO", label: "Studio", icon: Building2 },
  { value: "ROOM", label: "Chambre", icon: Building2 },
  { value: "COMMERCIAL", label: "Bureau / Commerce", icon: Building2 },
  { value: "LAND", label: "Terrain", icon: MapPin },
];

// Mapping helper : tolère les anciennes valeurs FR du mock vers les enums DB.
const LEGACY_TYPE_MAP: Record<string, string> = {
  APPARTEMENT: "APARTMENT",
  MAISON: "HOUSE",
  BUREAU: "COMMERCIAL",
  TERRAIN: "LAND",
};

function normalizePropertyType(value: string | undefined): string | undefined {
  if (!value || value === "all" || value === "") return undefined;
  return LEGACY_TYPE_MAP[value] ?? value;
}

const SORT_OPTIONS = [
  { value: "relevance", label: "Pertinence" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
  { value: "surface_desc", label: "Surface (grand → petit)" },
  { value: "recent", label: "Plus récent" },
  { value: "rating", label: "Mieux notés" },
];

const VIEWS = [
  { value: "grid", label: "Grille", icon: LayoutGrid },
  { value: "list", label: "Liste", icon: List },
  { value: "map", label: "Carte", icon: MapIcon },
];

const POPULAR_SEARCHES = [
  { label: "Studio Cotonou", country: "BJ", city: "cotonou", type: "STUDIO" },
  { label: "Appart Abidjan", country: "CI", city: "abidjan", type: "APARTMENT" },
  { label: "Villa Dakar", country: "SN", city: "dakar", type: "VILLA" },
  { label: "Studio Lagos", country: "NG", city: "lagos", type: "STUDIO" },
  { label: "Appart Le Caire", country: "EG", city: "le-caire", type: "APARTMENT" },
  { label: "Villa Casablanca", country: "MA", city: "casablanca", type: "VILLA" },
];

// Villes proposées par défaut quand la plateforme n'a pas encore assez
// d'annonces pour calculer des recherches populaires réelles (pan-africain).
const POPULAR_FALLBACK_CITIES = [
  "Cotonou",
  "Abidjan",
  "Dakar",
  "Lagos",
  "Accra",
  "Lomé",
  "Le Caire",
  "Casablanca",
];

const AMENITIES = [
  { key: "furnished", label: "Meublé" },
  { key: "ac", label: "Climatisation" },
  { key: "parking", label: "Parking" },
  { key: "pool", label: "Piscine" },
  { key: "garden", label: "Jardin" },
  { key: "terrace", label: "Terrasse" },
  { key: "balcony", label: "Balcon" },
  { key: "elevator", label: "Ascenseur" },
  { key: "internet", label: "Internet" },
  { key: "security", label: "Sécurité 24/7" },
  { key: "pets", label: "Animaux OK" },
  { key: "smoking", label: "Fumeur OK" },
];

const TARGETS = [
  { key: "etudiant", label: "Étudiant" },
  { key: "famille", label: "Famille" },
  { key: "pro", label: "Professionnel" },
  { key: "expat", label: "Expatrié" },
  { key: "court", label: "Court terme" },
  { key: "long", label: "Long terme" },
];

const TRUST_BADGES = [
  { icon: ShieldCheck, label: "Identités vérifiées" },
  { icon: Wallet, label: "Paiement sécurisé" },
  { icon: Compass, label: "Visites organisées" },
  { icon: ScrollText, label: "Contrats juridiques" },
];

const PRICE_PRESETS = [
  { value: "150000", label: "≤ 150 k" },
  { value: "300000", label: "≤ 300 k" },
  { value: "500000", label: "≤ 500 k" },
  { value: "1000000", label: "≤ 1 M" },
  { value: "2000000", label: "≤ 2 M" },
  { value: "5000000", label: "≤ 5 M" },
];

// Les compteurs par pays/ville sont chargés en live depuis Supabase
// (fonction getGeoStats). Ces deux Records vides sont remplacés à chaque
// request par le résultat de la requête.
const COUNTRY_COUNTS_FALLBACK: Record<string, number> = {
  BJ: 0,
  CI: 0,
  SN: 0,
  TG: 0,
  BF: 0,
  GH: 0,
  NG: 0,
};

const CITY_COUNTS_FALLBACK: Record<string, number> = {};

const PRICE_TIER_LABEL: Record<number, string> = {
  1: "€",
  2: "€€",
  3: "€€",
  4: "€€€",
  5: "€€€€",
};

const PRICE_TIER_COLOR: Record<number, string> = {
  1: "text-emerald-600",
  2: "text-emerald-600",
  3: "text-kaza-blue",
  4: "text-amber-600",
  5: "text-rose-600",
};

function buildSearchUrl(
  base: SearchParams,
  patch: Partial<Record<keyof SearchParams, string | undefined>>,
): string {
  const sp = new URLSearchParams();
  const merged = { ...base, ...patch };
  Object.entries(merged).forEach(([k, v]) => {
    if (v !== undefined && v !== "" && v !== null) sp.set(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `/search?${qs}` : "/search";
}

// Helpers d'affichage : on extrait "ville, quartier" depuis l'adresse libre.
function splitAddress(address: string): { city: string; neighborhood: string } {
  if (!address) return { city: "", neighborhood: "" };
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return { city: "", neighborhood: "" };
  if (parts.length === 1) return { city: parts[0], neighborhood: "" };
  // Dernier segment = ville, premier = quartier
  return {
    neighborhood: parts[0],
    city: parts[parts.length - 1],
  };
}

// -----------------------------------------------------------------------------
// PAGE
// -----------------------------------------------------------------------------

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const country = params.country ?? "all";
  const citySlug = params.city ?? "";
  const view = params.view ?? "grid";
  const sort = params.sort ?? "relevance";
  const perPage = parseInt(params.perPage ?? "24", 10);
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  // Tous les pays africains sont sélectionnables à la recherche.
  const allCountries = [...COUNTRIES].sort((a, b) =>
    a.name.localeCompare(b.name, "fr"),
  );
  const selectedCountry = country === "all" ? null : getCountryByCode(country);
  const selectedCity = selectedCountry?.cities.find((c) => c.slug === citySlug);

  // Filtres dérivés des searchParams pour la requête Supabase
  const normalizedType = normalizePropertyType(params.type);
  // Transaction : louer (RENT) ou acheter (SALE).
  const listingTypeFilter =
    params.listingType === "SALE" || params.listingType === "RENT"
      ? params.listingType
      : undefined;
  const minPriceNum = params.minPrice ? Number(params.minPrice) : undefined;
  const maxPriceNum = params.maxPrice ? Number(params.maxPrice) : undefined;
  const bedroomsNum = params.bedrooms ? Number(params.bedrooms) : undefined;
  // Ville : on utilise le nom de la ville sélectionnée (filtre ilike sur address).
  const cityNameFilter = selectedCity?.name ?? params.q ?? undefined;

  // Stats géographiques live (counts par pays/ville + prix moyen)
  const geoStats = await getGeoStats();
  const COUNTRY_COUNTS = { ...COUNTRY_COUNTS_FALLBACK, ...geoStats.countryCounts };
  const CITY_COUNTS = { ...CITY_COUNTS_FALLBACK, ...geoStats.cityCounts };
  const AVG_PRICE_BY_CITY = geoStats.cityAvgPrice;

  // Pays de lancement (couverture active). Le sélecteur visuel n'affiche que
  // ces pays + tout pays ayant réellement des biens — pour éviter une longue
  // liste de pays à « 0 bien » qui donne l'impression d'une plateforme vide.
  const LAUNCH_COUNTRIES = new Set(["BJ", "CI", "TG", "SN", "NE"]);
  const displayedCountries = allCountries.filter(
    (c) => LAUNCH_COUNTRIES.has(c.code) || (COUNTRY_COUNTS[c.code] ?? 0) > 0,
  );

  // Recherches populaires réelles : villes ayant le plus d'annonces publiées.
  const allCitiesRef = getAllCities();
  const cityNameBySlug = new Map(allCitiesRef.map((c) => [c.slug, c.name]));
  // Map nom de ville → code pays, pour afficher le drapeau du pays (et non une
  // couleur) à côté de chaque recherche populaire.
  const cityCountryByName = new Map(
    allCitiesRef.map((c) => [c.name.toLowerCase(), c.countryCode]),
  );
  const realPopular = Object.entries(geoStats.cityCounts)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([slug]) => cityNameBySlug.get(slug))
    .filter((x): x is string => Boolean(x));
  const popularSearches =
    realPopular.length > 0 ? realPopular : POPULAR_FALLBACK_CITIES;

  // Vraie source : Supabase. Tri serveur = created_at DESC (cf. helper).
  const properties = await listPublicProperties({
    limit: Math.min(perPage * page, 96),
    type: normalizedType,
    minPrice:
      minPriceNum !== undefined && Number.isFinite(minPriceNum)
        ? minPriceNum
        : undefined,
    maxPrice:
      maxPriceNum !== undefined && Number.isFinite(maxPriceNum)
        ? maxPriceNum
        : undefined,
    minBedrooms:
      bedroomsNum !== undefined && Number.isFinite(bedroomsNum)
        ? bedroomsNum
        : undefined,
    city: cityNameFilter,
    listingType: listingTypeFilter,
  });
  const totalResults = properties.length;

  return (
    <div className="bg-gray-50">
      {/* Tracking PAGE_VIEW (client, best-effort) */}
      <PageTracker path="/search" />
      {/* =========================================================== */}
      {/* HERO HEADER — gradient navy avec barre de recherche premium  */}
      {/* =========================================================== */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-kaza-navy via-[#0E2A40] to-kaza-blue py-14 lg:py-20">
        {/* Décor blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-kaza-blue/30 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -right-32 h-[32rem] w-[32rem] rounded-full bg-kaza-green/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.05),transparent_50%)]"
        />

        <div className="relative z-10 mx-auto max-w-7xl px-4 lg:px-8">
          {/* Breadcrumb */}
          <nav
            aria-label="Fil d'Ariane"
            className="mb-5 flex items-center gap-1.5 text-xs text-white/70"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-1 transition-colors hover:text-white"
            >
              <HomeIcon className="size-3.5" />
              Accueil
            </Link>
            <ChevronRight className="size-3" />
            <span className="text-white/95">Recherche</span>
            {selectedCountry && (
              <>
                <ChevronRight className="size-3" />
                <span className="text-white/95">{selectedCountry.name}</span>
              </>
            )}
            {selectedCity && (
              <>
                <ChevronRight className="size-3" />
                <span className="text-white/95">{selectedCity.name}</span>
              </>
            )}
          </nav>

          {/* Titre */}
          <div className="max-w-4xl">
            <Badge className="mb-4 border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
              <Sparkles className="mr-1.5 size-3.5 text-kaza-green" />
              KAZA Search — la plus large couverture en Afrique de l&apos;Ouest
            </Badge>
            <h1 className="font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Trouvez votre prochain{" "}
              <span className="bg-gradient-to-r from-kaza-green to-emerald-300 bg-clip-text text-transparent">
                chez-vous
              </span>
            </h1>
            <p className="mt-4 max-w-2xl text-base text-white/80 sm:text-lg">
              {geoStats.total > 0 ? (
                <>
                  <span className="font-bold text-white">
                    {geoStats.total.toLocaleString("fr-FR")} bien
                    {geoStats.total > 1 ? "s" : ""} vérifié
                    {geoStats.total > 1 ? "s" : ""}
                  </span>{" "}
                  en Afrique de l&apos;Ouest. Propriétaires de confiance,
                  paiement sécurisé, contrats juridiques.
                </>
              ) : (
                <>
                  La première plateforme immobilière d&apos;Afrique de
                  l&apos;Ouest. Propriétaires de confiance, paiement sécurisé,
                  contrats juridiques.
                </>
              )}
            </p>
          </div>

          {/* Barre de recherche premium — 4 selects + bouton */}
          <form
            method="GET"
            action="/search"
            className="mt-10 rounded-3xl border border-white/15 bg-white/95 p-3 shadow-2xl backdrop-blur-xl"
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[1.1fr_1.1fr_1fr_1fr_auto]">
              {/* Pays */}
              <label className="group flex items-center gap-3 rounded-2xl border border-transparent bg-gray-50 px-4 py-3 transition-colors hover:border-kaza-blue/30 hover:bg-white">
                <Globe2 className="size-5 shrink-0 text-kaza-blue" />
                <div className="flex-1">
                  <span className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Pays
                  </span>
                  <select
                    name="country"
                    defaultValue={country}
                    className="w-full appearance-none bg-transparent text-sm font-medium text-foreground outline-none"
                  >
                    <option value="all">Tous pays</option>
                    {allCountries.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </label>

              {/* Ville (cascade) */}
              <label className="group flex items-center gap-3 rounded-2xl border border-transparent bg-gray-50 px-4 py-3 transition-colors hover:border-kaza-blue/30 hover:bg-white">
                <MapPin className="size-5 shrink-0 text-kaza-blue" />
                <div className="flex-1">
                  <span className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Ville
                  </span>
                  <select
                    name="city"
                    defaultValue={citySlug}
                    className="w-full appearance-none bg-transparent text-sm font-medium text-foreground outline-none"
                  >
                    <option value="">Toutes villes</option>
                    {selectedCountry?.cities.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                        {c.isCapital ? " ★" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </label>

              {/* Transaction louer/acheter */}
              <label className="group flex items-center gap-3 rounded-2xl border border-transparent bg-gray-50 px-4 py-3 transition-colors hover:border-kaza-blue/30 hover:bg-white">
                <Tag className="size-5 shrink-0 text-kaza-blue" />
                <div className="flex-1">
                  <span className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Transaction
                  </span>
                  <select
                    name="listingType"
                    defaultValue={params.listingType ?? "all"}
                    className="w-full appearance-none bg-transparent text-sm font-medium text-foreground outline-none"
                  >
                    <option value="all">Louer ou acheter</option>
                    <option value="RENT">À louer</option>
                    <option value="SALE">À vendre</option>
                  </select>
                </div>
              </label>

              {/* Type bien */}
              <label className="group flex items-center gap-3 rounded-2xl border border-transparent bg-gray-50 px-4 py-3 transition-colors hover:border-kaza-blue/30 hover:bg-white">
                <Building2 className="size-5 shrink-0 text-kaza-blue" />
                <div className="flex-1">
                  <span className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Type
                  </span>
                  <select
                    name="type"
                    defaultValue={params.type ?? "all"}
                    className="w-full appearance-none bg-transparent text-sm font-medium text-foreground outline-none"
                  >
                    {PROPERTY_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </label>

              {/* Budget */}
              <label className="group flex items-center gap-3 rounded-2xl border border-transparent bg-gray-50 px-4 py-3 transition-colors hover:border-kaza-blue/30 hover:bg-white">
                <Wallet className="size-5 shrink-0 text-kaza-blue" />
                <div className="flex-1">
                  <span className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Budget max
                  </span>
                  <select
                    name="maxPrice"
                    defaultValue={params.maxPrice ?? ""}
                    className="w-full appearance-none bg-transparent text-sm font-medium text-foreground outline-none"
                  >
                    <option value="">Sans limite</option>
                    {PRICE_PRESETS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label} FCFA
                      </option>
                    ))}
                  </select>
                </div>
              </label>

              {/* CTA */}
              <Button
                type="submit"
                size="lg"
                className="h-full min-h-[64px] rounded-2xl bg-kaza-green px-8 text-base font-semibold shadow-lg shadow-kaza-green/30 hover:bg-kaza-green/90"
              >
                <Search className="mr-2 size-5" />
                Rechercher
              </Button>
            </div>

            {/* Recherches populaires */}
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 px-2 pt-4">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Tendances
              </span>
              {POPULAR_SEARCHES.map((s) => (
                <Link
                  key={s.label}
                  href={buildSearchUrl(
                    {},
                    {
                      country: s.country,
                      city: s.city,
                      type: s.type,
                    },
                  )}
                  className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:border-kaza-blue hover:bg-kaza-blue/5 hover:text-kaza-blue"
                >
                  <TrendingUp className="size-3" />
                  {s.label}
                </Link>
              ))}
            </div>
          </form>

          {/* Badges trust */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {TRUST_BADGES.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.label}
                  className="inline-flex items-center gap-2 text-sm font-medium text-white/90"
                >
                  <Icon className="size-4 text-kaza-green" />
                  {b.label}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================== */}
      {/* TABS PAYS — sélecteur de marché horizontal scrollable        */}
      {/* =========================================================== */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto py-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* Tous */}
            <Link
              href={buildSearchUrl({}, { country: "all" })}
              className={`group flex shrink-0 flex-col items-center gap-1 rounded-2xl border-b-4 px-5 py-3 transition-all ${
                country === "all"
                  ? "border-kaza-green bg-kaza-blue/5"
                  : "border-transparent hover:border-gray-200 hover:bg-gray-50"
              }`}
            >
              <GlobeFlag className="size-7" />
              <span className="text-sm font-semibold text-foreground">
                Tous
              </span>
              <span className="text-[11px] text-muted-foreground">
                {Object.values(COUNTRY_COUNTS).reduce((a, b) => a + b, 0).toLocaleString("fr-FR")} biens
              </span>
            </Link>

            {/* Pays couverts — sélectionnables */}
            {displayedCountries.map((c) => {
              const active = country === c.code;
              return (
                <Link
                  key={c.code}
                  href={buildSearchUrl({}, { country: c.code })}
                  className={`group flex shrink-0 flex-col items-center gap-1 rounded-2xl border-b-4 px-5 py-3 transition-all ${
                    active
                      ? "border-kaza-green bg-kaza-blue/5"
                      : "border-transparent hover:border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <CountryFlag code={c.code} className="h-5 w-7" title={c.name} />
                  <span className="text-sm font-semibold text-foreground">
                    {c.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {COUNTRY_COUNTS[c.code]?.toLocaleString("fr-FR") ?? 0} biens
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================== */}
      {/* SECTION VILLES POPULAIRES (si pays sélectionné)              */}
      {/* =========================================================== */}
      {selectedCountry && selectedCountry.cities.length > 0 && (
        <section className="border-b border-gray-200 bg-gray-50 py-8">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <h2 className="font-heading text-xl font-bold sm:text-2xl">
                  Villes en {selectedCountry.name}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedCountry.cities.length} villes couvertes ·{" "}
                  {COUNTRY_COUNTS[selectedCountry.code]?.toLocaleString("fr-FR")} biens
                </p>
              </div>
              <Link
                href={`/pays/${selectedCountry.code.toLowerCase()}`}
                className="hidden text-sm font-semibold text-kaza-blue hover:underline sm:inline"
              >
                Voir le pays →
              </Link>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {selectedCountry.cities.map((city) => (
                <Link
                  key={city.slug}
                  href={buildSearchUrl(
                    {},
                    { country: selectedCountry.code, city: city.slug },
                  )}
                  className={`group relative flex w-56 shrink-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all hover:-translate-y-1 hover:border-kaza-blue/40 hover:shadow-xl ${
                    citySlug === city.slug ? "ring-2 ring-kaza-green" : ""
                  }`}
                >
                  {/* Bandeau = drapeau du pays (et non une couleur aléatoire) */}
                  <div className="relative flex h-28 items-end justify-between overflow-hidden p-3">
                    <CountryFlag
                      code={selectedCountry.code}
                      shape="rect"
                      title={selectedCountry.name}
                      className="absolute inset-0 size-full rounded-none ring-0"
                    />
                    {/* Voile sombre pour garder le nom de ville lisible */}
                    <div
                      aria-hidden
                      className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10"
                    />
                    {city.isCapital && (
                      <Badge className="absolute right-2 top-2 z-10 border-amber-200 bg-amber-100 px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wider text-amber-800">
                        <Crown className="mr-1 size-2.5" />
                        Capitale
                      </Badge>
                    )}
                    <div className="relative z-10 text-white drop-shadow-lg">
                      <div className="text-2xl font-bold">{city.name}</div>
                    </div>
                  </div>
                  <div className="space-y-1 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">
                        {CITY_COUNTS[city.slug]?.toLocaleString("fr-FR") ?? "—"}{" "}
                        biens
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {(city.population / 1000).toFixed(0)}k hab.
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Loyer moyen :{" "}
                      <span className="font-semibold text-foreground">
                        {AVG_PRICE_BY_CITY[city.slug]
                          ? `${(AVG_PRICE_BY_CITY[city.slug] / 1000).toFixed(0)} k FCFA`
                          : "—"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================== */}
      {/* LAYOUT PRINCIPAL — Filtres + Résultats                       */}
      {/* =========================================================== */}
      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
          {/* ====================== FILTRES SIDEBAR ====================== */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-3xl border border-gray-200 bg-white shadow-sm">
              <form method="GET" action="/search" className="flex flex-col">
                {/* En-tête filtres */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Résultats
                    </p>
                    <p className="font-heading text-lg font-bold text-kaza-navy">
                      {totalResults.toLocaleString("fr-FR")} biens
                    </p>
                  </div>
                  <Link
                    href="/search"
                    className="text-xs font-semibold text-kaza-blue hover:underline"
                  >
                    Réinitialiser
                  </Link>
                </div>

                {/* Hidden: garde le contexte */}
                <input type="hidden" name="country" value={country} />
                <input type="hidden" name="city" value={citySlug} />

                <div className="space-y-5 px-5 py-5">
                  {/* Localisation */}
                  <FilterSection title="Localisation" icon={MapPin}>
                    <div className="space-y-2">
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-muted-foreground">
                          Pays
                        </span>
                        <select
                          name="country"
                          defaultValue={country}
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-kaza-blue focus:outline-none"
                        >
                          <option value="all">Tous</option>
                          {allCountries.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-muted-foreground">
                          Ville
                        </span>
                        <select
                          name="city"
                          defaultValue={citySlug}
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-kaza-blue focus:outline-none"
                        >
                          <option value="">Toutes</option>
                          {selectedCountry?.cities.map((c) => (
                            <option key={c.slug} value={c.slug}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      {/* Quartiers */}
                      {selectedCity && selectedCity.neighborhoods.length > 0 && (
                        <div>
                          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                            Quartiers ({selectedCity.neighborhoods.length})
                          </span>
                          <div className="max-h-44 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50 p-2">
                            {selectedCity.neighborhoods.map((n: Neighborhood) => (
                              <label
                                key={n.slug}
                                className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-white"
                              >
                                <span className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    name="neighborhood"
                                    value={n.slug}
                                    className="rounded border-gray-300 text-kaza-blue focus:ring-kaza-blue"
                                  />
                                  <span className="text-sm text-foreground">
                                    {n.name}
                                  </span>
                                </span>
                                <span
                                  className={`text-xs font-bold ${PRICE_TIER_COLOR[n.priceTier]}`}
                                  title={`Prix tier ${n.priceTier}/5`}
                                >
                                  {PRICE_TIER_LABEL[n.priceTier]}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Distance du centre */}
                      <label className="block pt-2">
                        <span className="mb-1 flex items-center justify-between text-xs font-medium">
                          <span className="text-muted-foreground">
                            Distance du centre
                          </span>
                          <span className="font-semibold text-foreground">
                            10 km
                          </span>
                        </span>
                        <input
                          type="range"
                          min="0"
                          max="50"
                          defaultValue="10"
                          className="w-full accent-kaza-blue"
                        />
                      </label>
                    </div>
                  </FilterSection>

                  {/* Transaction louer/acheter */}
                  <FilterSection title="Transaction" icon={Tag}>
                    <div className="space-y-1.5">
                      {[
                        { value: "all", label: "Louer ou acheter" },
                        { value: "RENT", label: "À louer" },
                        { value: "SALE", label: "À vendre" },
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 hover:bg-gray-50"
                        >
                          <input
                            type="radio"
                            name="listingType"
                            value={opt.value}
                            defaultChecked={
                              (params.listingType ?? "all") === opt.value
                            }
                            className="border-gray-300 text-kaza-blue focus:ring-kaza-blue"
                          />
                          <span className="text-sm">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </FilterSection>

                  {/* Type */}
                  <FilterSection title="Type de bien" icon={Building2}>
                    <div className="space-y-1.5">
                      {PROPERTY_TYPES.slice(1).map((t) => (
                        <label
                          key={t.value}
                          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            name="type"
                            value={t.value}
                            className="rounded border-gray-300 text-kaza-blue focus:ring-kaza-blue"
                          />
                          <span className="text-sm">{t.label}</span>
                        </label>
                      ))}
                    </div>
                  </FilterSection>

                  {/* Prix */}
                  <FilterSection title="Prix mensuel (FCFA)" icon={Wallet}>
                    <div className="space-y-3">
                      <input
                        type="range"
                        min="50000"
                        max="5000000"
                        step="50000"
                        defaultValue={params.maxPrice ?? "1000000"}
                        className="w-full accent-kaza-blue"
                        name="maxPrice"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          name="minPrice"
                          placeholder="Min"
                          defaultValue={params.minPrice ?? ""}
                          className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:border-kaza-blue focus:outline-none"
                        />
                        <span className="text-muted-foreground">—</span>
                        <input
                          type="number"
                          name="maxPriceInput"
                          placeholder="Max"
                          defaultValue={params.maxPrice ?? ""}
                          className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:border-kaza-blue focus:outline-none"
                        />
                      </div>
                    </div>
                  </FilterSection>

                  {/* Surface */}
                  <FilterSection title="Surface (m²)" icon={Maximize}>
                    <div className="space-y-3">
                      <input
                        type="range"
                        min="10"
                        max="1000"
                        step="10"
                        defaultValue={params.maxSurface ?? "200"}
                        className="w-full accent-kaza-blue"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          name="minSurface"
                          placeholder="Min"
                          defaultValue={params.minSurface ?? ""}
                          className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:border-kaza-blue focus:outline-none"
                        />
                        <span className="text-muted-foreground">—</span>
                        <input
                          type="number"
                          name="maxSurface"
                          placeholder="Max"
                          defaultValue={params.maxSurface ?? ""}
                          className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:border-kaza-blue focus:outline-none"
                        />
                      </div>
                    </div>
                  </FilterSection>

                  {/* Pièces */}
                  <FilterSection title="Pièces" icon={LayoutGrid}>
                    <div className="flex flex-wrap gap-1.5">
                      {["1", "2", "3", "4", "5+"].map((n) => {
                        const active = params.rooms === n;
                        return (
                          <Link
                            key={n}
                            href={buildSearchUrl(params, { rooms: active ? undefined : n })}
                            className={`min-w-10 rounded-full border px-3 py-1.5 text-center text-xs font-semibold transition-colors ${
                              active
                                ? "border-kaza-blue bg-kaza-blue text-white"
                                : "border-gray-200 bg-white text-foreground hover:border-kaza-blue hover:bg-kaza-blue/5"
                            }`}
                          >
                            {n}
                          </Link>
                        );
                      })}
                    </div>
                  </FilterSection>

                  {/* Chambres */}
                  <FilterSection title="Chambres" icon={Bed}>
                    <div className="flex flex-wrap gap-1.5">
                      {["1", "2", "3", "4", "5+"].map((n) => {
                        const active = params.bedrooms === n;
                        return (
                          <Link
                            key={n}
                            href={buildSearchUrl(params, { bedrooms: active ? undefined : n })}
                            className={`min-w-10 rounded-full border px-3 py-1.5 text-center text-xs font-semibold transition-colors ${
                              active
                                ? "border-kaza-blue bg-kaza-blue text-white"
                                : "border-gray-200 bg-white text-foreground hover:border-kaza-blue hover:bg-kaza-blue/5"
                            }`}
                          >
                            {n}
                          </Link>
                        );
                      })}
                    </div>
                  </FilterSection>

                  {/* Équipements */}
                  <FilterSection title="Équipements" icon={Sparkles}>
                    <div className="grid grid-cols-2 gap-1.5">
                      {AMENITIES.map((a) => (
                        <label
                          key={a.key}
                          className="flex cursor-pointer items-center gap-2 rounded-md border border-gray-100 px-2 py-1.5 text-xs hover:border-kaza-blue/30 hover:bg-kaza-blue/5"
                        >
                          <input
                            type="checkbox"
                            name="amenities"
                            value={a.key}
                            className="rounded border-gray-300 text-kaza-blue focus:ring-kaza-blue"
                          />
                          <span>{a.label}</span>
                        </label>
                      ))}
                    </div>
                  </FilterSection>

                  {/* Cibles */}
                  <FilterSection title="Pour qui ?" icon={HomeIcon}>
                    <div className="flex flex-wrap gap-1.5">
                      {TARGETS.map((t) => (
                        <label
                          key={t.key}
                          className="cursor-pointer rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-kaza-blue hover:bg-kaza-blue/5 [&:has(input:checked)]:border-kaza-blue [&:has(input:checked)]:bg-kaza-blue [&:has(input:checked)]:text-white"
                        >
                          <input
                            type="checkbox"
                            name="targets"
                            value={t.key}
                            className="sr-only"
                          />
                          {t.label}
                        </label>
                      ))}
                    </div>
                  </FilterSection>

                  {/* Caractéristiques */}
                  <FilterSection title="Caractéristiques" icon={Crown}>
                    <div className="space-y-2">
                      {[
                        { key: "premium", label: "Premium uniquement", icon: Crown },
                        { key: "vr360", label: "Vue 360°", icon: Camera },
                        { key: "video", label: "Vidéo disponible", icon: Video },
                        { key: "recent", label: "Récent (< 30j)", icon: TrendingUp },
                      ].map((c) => {
                        const Icon = c.icon;
                        return (
                          <label
                            key={c.key}
                            className="flex cursor-pointer items-center justify-between gap-2 rounded-md border border-gray-100 px-3 py-2 hover:border-kaza-blue/30 hover:bg-kaza-blue/5"
                          >
                            <span className="flex items-center gap-2 text-sm">
                              <Icon className="size-4 text-kaza-blue" />
                              {c.label}
                            </span>
                            <input
                              type="checkbox"
                              name={c.key}
                              value="1"
                              className="rounded border-gray-300 text-kaza-blue focus:ring-kaza-blue"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </FilterSection>
                </div>

                {/* Bouton appliquer sticky */}
                <div className="sticky bottom-0 border-t border-gray-100 bg-white p-4">
                  <Button
                    type="submit"
                    className="w-full bg-kaza-navy text-white hover:bg-kaza-navy/90"
                  >
                    Appliquer les filtres
                  </Button>
                </div>
              </form>
            </div>
          </aside>

          {/* ====================== RÉSULTATS ====================== */}
          <div>
            {/* Toolbar */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 lg:hidden"
                >
                  <Filter className="size-4" />
                  Filtres
                </Button>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {totalResults.toLocaleString("fr-FR")} biens
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedCity?.name ??
                      selectedCountry?.name ??
                      "Tous pays"}
                    {selectedCountry &&
                      ` · ${selectedCountry.name}`}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  defaultValue={sort}
                  name="sort"
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-foreground hover:border-kaza-blue focus:border-kaza-blue focus:outline-none"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      Tri : {o.label}
                    </option>
                  ))}
                </select>

                {/* View switcher */}
                <div className="hidden items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 sm:flex">
                  {VIEWS.map((v) => {
                    const Icon = v.icon;
                    const active = view === v.value;
                    return (
                      <Link
                        key={v.value}
                        href={buildSearchUrl(params, { view: v.value })}
                        className={`flex size-8 items-center justify-center rounded-md transition-colors ${
                          active
                            ? "bg-kaza-navy text-white"
                            : "text-muted-foreground hover:bg-gray-100"
                        }`}
                        title={v.label}
                      >
                        <Icon className="size-4" />
                      </Link>
                    );
                  })}
                </div>

                <SearchSaveActions
                  criteria={{
                    country: country !== "all" ? country : undefined,
                    city: selectedCity?.name ?? undefined,
                    type: params.type,
                    minPrice: params.minPrice,
                    maxPrice: params.maxPrice,
                    bedrooms: params.bedrooms,
                    q: params.q,
                    targets: params.targets,
                  }}
                />
              </div>
            </div>

            {/* Vue conditionnelle */}
            {properties.length === 0 ? (
              <SearchEmptyState />
            ) : (
              <>
                {view === "grid" && (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {properties.map((p) => (
                      <PropertyGridCard key={p.id} property={p} />
                    ))}
                  </div>
                )}

                {view === "list" && (
                  <div className="space-y-4">
                    {properties.map((p) => (
                      <PropertyListRow key={p.id} property={p} />
                    ))}
                  </div>
                )}
              </>
            )}

            {view === "map" && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
                {/* Fausse carte */}
                <div className="relative h-[600px] overflow-hidden rounded-2xl border border-gray-200 bg-[#E8F4F8]">
                  {/* Grille subtile */}
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      backgroundImage:
                        "linear-gradient(rgba(25,118,210,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(25,118,210,0.08) 1px, transparent 1px)",
                      backgroundSize: "40px 40px",
                    }}
                  />
                  {/* Trait "route" */}
                  <svg
                    className="absolute inset-0 size-full"
                    viewBox="0 0 600 600"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M 0 300 Q 150 200 300 280 T 600 250"
                      fill="none"
                      stroke="#1976D2"
                      strokeOpacity="0.15"
                      strokeWidth="3"
                    />
                    <path
                      d="M 100 0 Q 200 200 250 400 T 400 600"
                      fill="none"
                      stroke="#1976D2"
                      strokeOpacity="0.12"
                      strokeWidth="2"
                    />
                  </svg>

                  {/* Marqueurs prix */}
                  {properties.slice(0, 12).map((p, i) => {
                    const positions = [
                      { x: 18, y: 30 },
                      { x: 35, y: 22 },
                      { x: 52, y: 45 },
                      { x: 70, y: 30 },
                      { x: 25, y: 60 },
                      { x: 42, y: 70 },
                      { x: 60, y: 65 },
                      { x: 78, y: 55 },
                      { x: 15, y: 80 },
                      { x: 38, y: 88 },
                      { x: 65, y: 82 },
                      { x: 85, y: 75 },
                    ];
                    const pos = positions[i];
                    const isPremium = p.viewsCount > 1000;
                    return (
                      <div
                        key={p.id}
                        className="absolute -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                      >
                        <div
                          className={`flex items-center gap-1 rounded-full border-2 border-white px-2.5 py-1 text-xs font-bold text-white shadow-lg hover:scale-110 cursor-pointer transition-transform ${
                            isPremium ? "bg-amber-500" : "bg-kaza-navy"
                          }`}
                        >
                          {isPremium && <Crown className="size-3" />}
                          {Math.round(p.price / 1000)}k
                        </div>
                      </div>
                    );
                  })}

                  {/* Compass */}
                  <div className="absolute right-4 top-4 flex size-12 items-center justify-center rounded-full border-2 border-white bg-white/80 shadow-lg backdrop-blur">
                    <Compass className="size-6 text-kaza-navy" />
                  </div>
                  {/* Légende */}
                  <div className="absolute bottom-4 left-4 rounded-xl border border-white/50 bg-white/90 px-3 py-2 text-xs shadow-lg backdrop-blur">
                    <p className="font-semibold text-foreground">
                      {properties.length} biens affichés
                    </p>
                    <p className="text-muted-foreground">
                      Cliquez sur un marqueur
                    </p>
                  </div>
                </div>

                {/* Sidebar bien hovered */}
                <div className="space-y-3">
                  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Survolez un marqueur
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      Le bien correspondant s&apos;affichera ici avec photos,
                      caractéristiques et bouton de contact direct.
                    </p>
                  </div>
                  {properties.slice(0, 3).map((p) => (
                    <PropertyMapMiniCard key={p.id} property={p} />
                  ))}
                </div>
              </div>
            )}

            {/* Pagination */}
            <nav
              aria-label="Pagination"
              className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-3"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">
                  Afficher
                </span>
                {[24, 48, 96].map((n) => {
                  const active = perPage === n;
                  return (
                    <Link
                      key={n}
                      href={buildSearchUrl(params, { perPage: String(n) })}
                      className={`rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
                        active
                          ? "bg-kaza-navy text-white"
                          : "text-muted-foreground hover:bg-gray-100"
                      }`}
                    >
                      {n}
                    </Link>
                  );
                })}
                <span className="text-xs text-muted-foreground">par page</span>
              </div>

              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1}>
                  ←
                </Button>
                {[1, 2, 3].map((p) => (
                  <Button
                    key={p}
                    variant={p === page ? "default" : "outline"}
                    size="sm"
                    className={p === page ? "bg-kaza-navy" : ""}
                    asChild
                  >
                    <Link href={buildSearchUrl(params, { page: String(p) })}>
                      {p}
                    </Link>
                  </Button>
                ))}
                <span className="px-1 text-sm text-muted-foreground">…</span>
                <Button variant="outline" size="sm" asChild>
                  <Link href={buildSearchUrl(params, { page: "12" })}>12</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={buildSearchUrl(params, { page: String(page + 1) })}>
                    →
                  </Link>
                </Button>
              </div>
            </nav>
          </div>
        </div>
      </section>

      {/* =========================================================== */}
      {/* CTA ALERTE PERSONNALISÉE                                     */}
      {/* =========================================================== */}
      <section className="bg-gradient-to-br from-black via-[#0c1a26] to-kaza-navy py-16 text-white">
        <div className="mx-auto max-w-5xl px-4 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-8 rounded-3xl bg-white/5 p-8 ring-1 ring-white/10 backdrop-blur lg:grid-cols-[1fr_auto] lg:p-12">
            <div>
              <Badge className="mb-3 border-kaza-green/30 bg-kaza-green/15 px-3 py-1 text-xs font-semibold text-kaza-green">
                <Bell className="mr-1.5 size-3" />
                Alerte gratuite
              </Badge>
              <h2 className="font-heading text-2xl font-bold sm:text-3xl">
                Vous ne trouvez pas votre bonheur ?
              </h2>
              <p className="mt-2 max-w-xl text-white/80">
                Créez une alerte personnalisée et recevez par email ou SMS les
                nouveaux biens qui correspondent à vos critères, dès leur
                publication.
              </p>
            </div>
            <SearchSaveActions
              alertOnly
              criteria={{
                country: country !== "all" ? country : undefined,
                city: selectedCity?.name ?? undefined,
                type: params.type,
                minPrice: params.minPrice,
                maxPrice: params.maxPrice,
                bedrooms: params.bedrooms,
                q: params.q,
                targets: params.targets,
              }}
            />
          </div>
        </div>
      </section>

      {/* =========================================================== */}
      {/* RECHERCHES RÉCENTES                                          */}
      {/* =========================================================== */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mb-6">
            <span className="text-xs font-semibold uppercase tracking-widest text-kaza-blue">
              Inspiration
            </span>
            <h2 className="mt-2 font-heading text-2xl font-bold sm:text-3xl">
              Recherches populaires
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {popularSearches.map((city) => {
              const countryCode = cityCountryByName.get(city.toLowerCase());
              return (
                <Link
                  key={city}
                  href={`/search?q=${encodeURIComponent(city)}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-foreground transition-all hover:-translate-y-0.5 hover:border-kaza-blue hover:bg-kaza-blue/5 hover:text-kaza-blue hover:shadow-md"
                >
                  {countryCode ? (
                    <CountryFlag
                      code={countryCode}
                      className="h-3.5 w-5"
                      title={city}
                    />
                  ) : (
                    <Search className="size-3.5" />
                  )}
                  {city}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================== */}
      {/* TOP QUARTIERS PAR PAYS                                       */}
      {/* =========================================================== */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mb-10 text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-kaza-blue">
              Tendances marché
            </span>
            <h2 className="mt-2 font-heading text-3xl font-bold sm:text-4xl">
              Top quartiers par pays
            </h2>
            <p className="mt-2 text-muted-foreground">
              Les quartiers les plus recherchés ces 30 derniers jours
            </p>
          </div>

          {Object.keys(geoStats.topNeighborhoodsByCountry).length === 0 ? (
            <div className="mx-auto max-w-2xl rounded-2xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
              <Building2 className="mx-auto size-10 text-muted-foreground" />
              <h3 className="mt-3 font-heading text-lg font-bold text-kaza-navy">
                Données quartiers à venir
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Les top quartiers seront calculés en temps réel dès que la
                plateforme aura assez d&apos;annonces réelles.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {COUNTRIES.filter(
                (c) => (geoStats.topNeighborhoodsByCountry[c.code]?.length ?? 0) > 0,
              )
                .slice(0, 3)
                .map((country) => {
                  const list = geoStats.topNeighborhoodsByCountry[country.code]!;
                  return (
                    <div
                      key={country.code}
                      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                    >
                      <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
                        <CountryFlag
                          code={country.code}
                          className="h-5 w-7"
                          title={country.name}
                        />
                        <h3 className="font-heading text-lg font-bold">
                          {country.name}
                        </h3>
                      </div>
                      <ul className="space-y-2.5">
                        {list.map((n, i) => (
                          <li key={`${country.code}-${n.name}-${i}`}>
                            <Link
                              href={buildSearchUrl(
                                {},
                                {
                                  country: country.code,
                                  city: n.city.toLowerCase(),
                                  q: n.name,
                                },
                              )}
                              className="group flex items-center justify-between gap-2 rounded-lg p-2 transition-colors hover:bg-gray-50"
                            >
                              <div className="flex items-center gap-3">
                                <span className="flex size-7 items-center justify-center rounded-full bg-kaza-blue/10 text-xs font-bold text-kaza-blue">
                                  #{i + 1}
                                </span>
                                <div>
                                  <p className="text-sm font-semibold text-foreground group-hover:text-kaza-blue">
                                    {n.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {n.city} · {n.count} bien
                                    {n.count > 1 ? "s" : ""}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-foreground">
                                  {n.avgPrice > 0
                                    ? `${Math.round(n.avgPrice / 1000)} k`
                                    : "—"}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  Loyer moyen
                                </p>
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </section>

      {/* =========================================================== */}
      {/* POURQUOI KAZA                                                */}
      {/* =========================================================== */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mb-12 text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-kaza-blue">
              Confiance
            </span>
            <h2 className="mt-2 font-heading text-3xl font-bold sm:text-4xl">
              Pourquoi rechercher sur KAZA ?
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: ShieldCheck,
                title: "Identités vérifiées",
                desc: "Tous nos propriétaires et agences sont vérifiés (KYC, RCCM). Plus de mauvaise surprise.",
                color: "bg-emerald-100 text-emerald-700",
              },
              {
                icon: Wallet,
                title: "Paiement sécurisé",
                desc: "Wallet KAZA + Mobile Money. Caution séquestrée, libération à l'état des lieux.",
                color: "bg-blue-100 text-blue-700",
              },
              {
                icon: Compass,
                title: "Visites organisées",
                desc: "Planning intégré, rappels SMS, géolocalisation. Plus de RDV manqués.",
                color: "bg-amber-100 text-amber-700",
              },
              {
                icon: ScrollText,
                title: "Contrats juridiques",
                desc: "Baux conformes OHADA / Bénin. Signature électronique légale et archivée.",
                color: "bg-purple-100 text-purple-700",
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="group rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-kaza-blue/40 hover:shadow-xl"
                >
                  <div
                    className={`mb-4 inline-flex size-12 items-center justify-center rounded-xl ${card.color}`}
                  >
                    <Icon className="size-6" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-foreground">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {card.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================== */}
      {/* FAQ RECHERCHE                                                */}
      {/* =========================================================== */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-3xl px-4 lg:px-8">
          <div className="mb-10 text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-kaza-blue">
              FAQ
            </span>
            <h2 className="mt-2 font-heading text-3xl font-bold sm:text-4xl">
              Questions fréquentes
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "Les biens affichés sont-ils tous vérifiés ?",
                a: "Oui. Chaque annonce est vérifiée par notre équipe : photos authentiques, propriétaire identifié, prix conforme au marché. Le badge KAZA Verified garantit la fiabilité.",
              },
              {
                q: "Puis-je rechercher dans plusieurs pays à la fois ?",
                a: "Oui, en sélectionnant 🌍 Tous pays dans le filtre principal. Vous pouvez aussi combiner plusieurs villes via les filtres avancés.",
              },
              {
                q: "Comment fonctionne la sauvegarde de recherche ?",
                a: "Cliquez sur Sauvegarder pour conserver vos critères. Activez les alertes pour être notifié dès qu'un nouveau bien correspond.",
              },
              {
                q: "Les prix incluent-ils les charges ?",
                a: "La plupart des annonces précisent si les charges sont incluses. Vérifiez le détail dans la fiche du bien.",
              },
              {
                q: "Puis-je visiter un bien à distance ?",
                a: "Oui ! De nombreuses annonces proposent une visite virtuelle 360° ou vidéo. Cherchez les filtres Vue 360° et Vidéo disponible.",
              },
            ].map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-gray-200 bg-white p-5 transition-colors hover:border-kaza-blue/30"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-foreground">
                  {item.q}
                  <ChevronRight className="size-4 shrink-0 transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================== */}
      {/* CTA PROPRIÉTAIRE                                             */}
      {/* =========================================================== */}
      <section className="bg-gradient-to-r from-kaza-green via-emerald-500 to-kaza-green py-16 text-white">
        <div className="mx-auto max-w-5xl px-4 text-center lg:px-8">
          <Badge className="mb-4 border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            <Crown className="mr-1.5 size-3" />
            Propriétaires & Agences
          </Badge>
          <h2 className="font-heading text-3xl font-bold sm:text-4xl">
            Vous êtes propriétaire ?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-white/90">
            Publiez votre annonce gratuitement en 5 minutes. Atteignez plus de
            120 000 locataires actifs sur KAZA.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              className="bg-white text-kaza-navy hover:bg-white/90"
              asChild
            >
              <Link href="/owner/properties/new">
                <HomeIcon className="mr-2 size-5" />
                Publier mon annonce
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/40 bg-white/10 text-white backdrop-blur hover:bg-white/20"
              asChild
            >
              <Link href="/pricing">Voir nos forfaits</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

// -----------------------------------------------------------------------------
// SOUS-COMPOSANTS (Server)
// -----------------------------------------------------------------------------

function SearchEmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto mb-5 inline-flex size-16 items-center justify-center rounded-2xl bg-kaza-blue/10">
        <Search className="size-8 text-kaza-blue" />
      </div>
      <h3 className="font-heading text-xl font-bold text-kaza-navy">
        Aucun bien ne correspond à votre recherche
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Essayez d&apos;élargir vos filtres (budget, type, ville) ou parcourez
        toutes nos annonces disponibles.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button
          asChild
          size="lg"
          className="bg-kaza-blue hover:bg-kaza-blue/90"
        >
          <Link href="/properties">Voir toutes les annonces</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/search">Réinitialiser la recherche</Link>
        </Button>
      </div>
    </div>
  );
}

function FilterSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-gray-100 pb-4 last:border-b-0">
      <h3 className="mb-2.5 flex items-center gap-2 text-sm font-bold text-foreground">
        <Icon className="size-4 text-kaza-blue" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function PropertyGridCard({ property }: { property: PublicProperty }) {
  const { city, neighborhood } = splitAddress(property.address);
  const isPremium = property.viewsCount > 1000;
  const photo = property.primaryPhotoUrl ?? "";
  const rating = 4.7;

  return (
    <Link
      href={`/properties/${property.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-kaza-blue/30 hover:shadow-xl"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo}
          alt={property.title}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* Badges top */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {property.isBoosted && (
            <Badge className="border-0 bg-amber-500 text-xs font-semibold text-white shadow-md">
              <Megaphone className="mr-1 size-3" />
              Sponsorisé
            </Badge>
          )}
          {isPremium && (
            <Badge className="border-amber-200 bg-amber-100 text-xs font-semibold text-amber-800">
              <Crown className="mr-1 size-3" />
              Premium
            </Badge>
          )}
          {property.owner?.isVerified && (
            <Badge className="border-emerald-200 bg-emerald-100 text-xs font-semibold text-emerald-800">
              <ShieldCheck className="mr-1 size-3" />
              Vérifié
            </Badge>
          )}
        </div>
        {/* Favori */}
        <button
          type="button"
          aria-label="Ajouter aux favoris"
          className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-white/95 text-foreground shadow-md backdrop-blur transition-all hover:scale-110 hover:text-rose-500"
        >
          <Heart className="size-4" />
        </button>
        {/* Prix overlay */}
        <div className="absolute bottom-3 left-3 rounded-xl bg-black/70 px-3 py-1.5 text-white backdrop-blur">
          <p className="font-heading text-base font-bold">
            {formatFcfa(property.price)}
            {property.listingType !== "SALE" && (
              <span className="ml-1 text-xs font-normal opacity-80">/mois</span>
            )}
          </p>
        </div>
        {property.listingType === "SALE" && (
          <div className="absolute left-3 top-3 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
            À vendre
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3.5" />
          <span className="truncate">
            {neighborhood ? `${neighborhood}, ` : ""}
            {city || property.address}
          </span>
        </div>
        <h3 className="line-clamp-2 font-heading font-semibold text-foreground group-hover:text-kaza-blue">
          {property.title}
        </h3>
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Bed className="size-3.5" /> {property.bedrooms}
          </span>
          <span className="inline-flex items-center gap-1">
            <Bath className="size-3.5" /> {property.bathrooms}
          </span>
          <span className="inline-flex items-center gap-1">
            <Maximize className="size-3.5" /> {property.sqm} m²
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
          <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
            <Star className="size-3.5 fill-amber-500 text-amber-500" />
            {rating.toFixed(1)}
          </span>
          <span className="text-muted-foreground">
            {property.viewsCount.toLocaleString("fr-FR")} vues
          </span>
        </div>
      </div>
    </Link>
  );
}

function PropertyListRow({ property }: { property: PublicProperty }) {
  const { city, neighborhood } = splitAddress(property.address);
  const isPremium = property.viewsCount > 1000;
  const photo = property.primaryPhotoUrl ?? "";
  const description =
    property.description?.trim() ||
    (property.type === "VILLA"
      ? "Villa spacieuse et lumineuse, idéale pour famille. Quartier résidentiel calme."
      : property.type === "STUDIO"
        ? "Studio meublé fonctionnel, parfait pour étudiants ou jeune actif."
        : "Bien dans un quartier dynamique avec toutes commodités à proximité.");
  const rating = 4.7;

  return (
    <Link
      href={`/properties/${property.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:border-kaza-blue/30 hover:shadow-lg sm:flex-row"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100 sm:aspect-auto sm:w-80 sm:shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo}
          alt={property.title}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {property.isBoosted && (
            <Badge className="border-0 bg-amber-500 text-xs font-semibold text-white shadow-md">
              <Megaphone className="mr-1 size-3" />
              Sponsorisé
            </Badge>
          )}
          {isPremium && (
            <Badge className="border-amber-200 bg-amber-100 text-xs font-semibold text-amber-800">
              <Crown className="mr-1 size-3" />
              Premium
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-4 p-5 sm:flex-row">
        <div className="flex-1">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5" />
            {neighborhood ? `${neighborhood}, ` : ""}
            {city || property.address}
          </div>
          <h3 className="font-heading text-lg font-bold text-foreground group-hover:text-kaza-blue">
            {property.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {description}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">
              <Bed className="size-3.5" /> {property.bedrooms} ch.
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">
              <Bath className="size-3.5" /> {property.bathrooms} sdb.
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">
              <Maximize className="size-3.5" /> {property.sqm} m²
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              <Star className="size-3 fill-amber-500 text-amber-500" />
              {rating.toFixed(1)}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end justify-between gap-3 border-t border-gray-100 pt-3 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
          <div className="text-right">
            <p className="font-heading text-2xl font-bold text-kaza-navy">
              {formatFcfa(property.price)}
            </p>
            <p className="text-xs text-muted-foreground">
              {property.listingType === "SALE" ? "prix de vente" : "par mois"}
            </p>
          </div>
          <Button
            size="sm"
            className="w-full bg-kaza-navy hover:bg-kaza-navy/90 sm:w-auto"
          >
            Voir le bien
          </Button>
        </div>
      </div>
    </Link>
  );
}

function PropertyMapMiniCard({ property }: { property: PublicProperty }) {
  const { city, neighborhood } = splitAddress(property.address);
  const photo = property.primaryPhotoUrl ?? "";
  return (
    <Link
      href={`/properties/${property.id}`}
      className="flex gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm transition-all hover:border-kaza-blue/40 hover:shadow-md"
    >
      <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo}
          alt={property.title}
          className="size-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-xs font-medium text-muted-foreground">
          {neighborhood ? `${neighborhood}, ` : ""}
          {city || property.address}
        </p>
        <p className="line-clamp-1 text-sm font-semibold">{property.title}</p>
        <p className="mt-1 text-sm font-bold text-kaza-navy">
          {formatFcfa(property.price)}
        </p>
      </div>
    </Link>
  );
}

