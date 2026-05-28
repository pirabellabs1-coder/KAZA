// =============================================================================
// KAZA — Référentiel géographique Afrique de l'Ouest
// Pays → Villes → Quartiers (utilisé partout : filtres search, création bien,
// pages /pays/[code], pages /villes/[slug], etc.)
// =============================================================================

export interface Neighborhood {
  slug: string;
  name: string;
  /** Indice prix moyen (1=économique, 5=premium) */
  priceTier: 1 | 2 | 3 | 4 | 5;
  /** Tags pour faceting */
  tags: ("residentiel" | "affaires" | "etudiant" | "balneaire" | "historique" | "commercial")[];
}

export interface City {
  slug: string;
  name: string;
  countryCode: string;
  isCapital: boolean;
  population: number;
  neighborhoods: Neighborhood[];
  /** Coordonnées GPS centre-ville */
  lat: number;
  lng: number;
}

export interface Country {
  code: string; // ISO alpha-2
  name: string;
  flag: string; // emoji
  currency: string; // ISO
  languages: string[];
  cities: City[];
  /** Pays prioritaire (Bénin par défaut), affiché en premier dans les filtres */
  priority: number;
  /** Pays actuellement opérationnel ou "Bientôt" */
  status: "live" | "soon";
}

// ---------------------------------------------------------------------------
// BÉNIN — couverture la plus dense (pays d'origine KAZA)
// ---------------------------------------------------------------------------

const COTONOU_NEIGHBORHOODS: Neighborhood[] = [
  { slug: "haie-vive", name: "Haie Vive", priceTier: 5, tags: ["residentiel", "balneaire"] },
  { slug: "cadjehoun", name: "Cadjèhoun", priceTier: 5, tags: ["residentiel"] },
  { slug: "fidjrosse", name: "Fidjrossè", priceTier: 4, tags: ["balneaire", "residentiel"] },
  { slug: "cocotiers", name: "Les Cocotiers", priceTier: 5, tags: ["balneaire", "residentiel"] },
  { slug: "ganhi", name: "Ganhi", priceTier: 4, tags: ["affaires", "commercial"] },
  { slug: "akpakpa", name: "Akpakpa", priceTier: 2, tags: ["residentiel"] },
  { slug: "agla", name: "Agla", priceTier: 3, tags: ["residentiel"] },
  { slug: "menontin", name: "Menontin", priceTier: 3, tags: ["residentiel"] },
  { slug: "vedoko", name: "Vêdoko", priceTier: 2, tags: ["residentiel"] },
  { slug: "saint-michel", name: "Saint-Michel", priceTier: 4, tags: ["residentiel", "historique"] },
  { slug: "missebo", name: "Missèbo", priceTier: 2, tags: ["commercial", "historique"] },
  { slug: "dantokpa", name: "Dantokpa", priceTier: 2, tags: ["commercial"] },
  { slug: "zongo", name: "Zongo", priceTier: 3, tags: ["residentiel", "commercial"] },
  { slug: "jericho", name: "Jericho", priceTier: 4, tags: ["residentiel"] },
];

const CALAVI_NEIGHBORHOODS: Neighborhood[] = [
  { slug: "godomey", name: "Godomey", priceTier: 3, tags: ["residentiel"] },
  { slug: "akassato", name: "Akassato", priceTier: 3, tags: ["residentiel"] },
  { slug: "abomey-calavi-centre", name: "Centre Abomey-Calavi", priceTier: 3, tags: ["residentiel"] },
  { slug: "zogbadje", name: "Zogbadjè", priceTier: 2, tags: ["etudiant", "residentiel"] },
  { slug: "houedo", name: "Houèdo", priceTier: 2, tags: ["residentiel"] },
  { slug: "tankpe", name: "Tankpè", priceTier: 2, tags: ["residentiel"] },
  { slug: "kpota", name: "Kpota", priceTier: 3, tags: ["residentiel"] },
];

const PORTO_NOVO_NEIGHBORHOODS: Neighborhood[] = [
  { slug: "houinmey", name: "Houinmey", priceTier: 3, tags: ["residentiel", "historique"] },
  { slug: "agonsa", name: "Agonsa", priceTier: 2, tags: ["residentiel"] },
  { slug: "dowa", name: "Dowa", priceTier: 2, tags: ["residentiel"] },
  { slug: "centre-ville", name: "Centre-ville", priceTier: 4, tags: ["affaires", "historique"] },
  { slug: "ouando", name: "Ouando", priceTier: 3, tags: ["residentiel"] },
];

const PARAKOU_NEIGHBORHOODS: Neighborhood[] = [
  { slug: "centre", name: "Centre", priceTier: 4, tags: ["affaires", "commercial"] },
  { slug: "tourou", name: "Tourou", priceTier: 3, tags: ["residentiel"] },
  { slug: "okedama", name: "Okédama", priceTier: 2, tags: ["residentiel"] },
  { slug: "albarika", name: "Albarika", priceTier: 2, tags: ["residentiel", "commercial"] },
];

const BENIN_CITIES: City[] = [
  {
    slug: "cotonou",
    name: "Cotonou",
    countryCode: "BJ",
    isCapital: false,
    population: 780_000,
    lat: 6.3703,
    lng: 2.3912,
    neighborhoods: COTONOU_NEIGHBORHOODS,
  },
  {
    slug: "porto-novo",
    name: "Porto-Novo",
    countryCode: "BJ",
    isCapital: true,
    population: 264_000,
    lat: 6.4969,
    lng: 2.6289,
    neighborhoods: PORTO_NOVO_NEIGHBORHOODS,
  },
  {
    slug: "abomey-calavi",
    name: "Abomey-Calavi",
    countryCode: "BJ",
    isCapital: false,
    population: 656_000,
    lat: 6.4485,
    lng: 2.3556,
    neighborhoods: CALAVI_NEIGHBORHOODS,
  },
  {
    slug: "parakou",
    name: "Parakou",
    countryCode: "BJ",
    isCapital: false,
    population: 256_000,
    lat: 9.3372,
    lng: 2.6303,
    neighborhoods: PARAKOU_NEIGHBORHOODS,
  },
  {
    slug: "bohicon",
    name: "Bohicon",
    countryCode: "BJ",
    isCapital: false,
    population: 171_000,
    lat: 7.1786,
    lng: 2.0667,
    neighborhoods: [
      { slug: "centre", name: "Centre", priceTier: 3, tags: ["affaires"] },
      { slug: "gare", name: "Quartier Gare", priceTier: 2, tags: ["commercial"] },
    ],
  },
  {
    slug: "abomey",
    name: "Abomey",
    countryCode: "BJ",
    isCapital: false,
    population: 92_000,
    lat: 7.1856,
    lng: 1.9911,
    neighborhoods: [
      { slug: "centre-historique", name: "Centre historique", priceTier: 3, tags: ["historique"] },
      { slug: "dovi", name: "Dovi", priceTier: 2, tags: ["residentiel"] },
    ],
  },
  {
    slug: "ouidah",
    name: "Ouidah",
    countryCode: "BJ",
    isCapital: false,
    population: 76_000,
    lat: 6.3622,
    lng: 2.0853,
    neighborhoods: [
      { slug: "plage", name: "Plage", priceTier: 4, tags: ["balneaire"] },
      { slug: "centre", name: "Centre", priceTier: 3, tags: ["historique"] },
    ],
  },
  {
    slug: "natitingou",
    name: "Natitingou",
    countryCode: "BJ",
    isCapital: false,
    population: 105_000,
    lat: 10.3041,
    lng: 1.3796,
    neighborhoods: [
      { slug: "centre", name: "Centre", priceTier: 3, tags: ["affaires"] },
    ],
  },
];

// ---------------------------------------------------------------------------
// TOGO
// ---------------------------------------------------------------------------

const TOGO_CITIES: City[] = [
  {
    slug: "lome",
    name: "Lomé",
    countryCode: "TG",
    isCapital: true,
    population: 1_745_000,
    lat: 6.1725,
    lng: 1.2314,
    neighborhoods: [
      { slug: "bè", name: "Bè", priceTier: 3, tags: ["residentiel"] },
      { slug: "tokoin", name: "Tokoin", priceTier: 3, tags: ["residentiel"] },
      { slug: "kodjoviakope", name: "Kodjoviakopé", priceTier: 5, tags: ["residentiel", "balneaire"] },
      { slug: "agoe", name: "Agoè", priceTier: 3, tags: ["residentiel"] },
      { slug: "doulassame", name: "Doulassamé", priceTier: 3, tags: ["affaires"] },
      { slug: "nyekonakpoe", name: "Nyékonakpoè", priceTier: 4, tags: ["residentiel"] },
      { slug: "hedzranawoe", name: "Hédzranawoé", priceTier: 4, tags: ["residentiel"] },
    ],
  },
  {
    slug: "sokode",
    name: "Sokodé",
    countryCode: "TG",
    isCapital: false,
    population: 117_000,
    lat: 8.9833,
    lng: 1.1333,
    neighborhoods: [
      { slug: "centre", name: "Centre", priceTier: 3, tags: ["affaires"] },
      { slug: "kpangalam", name: "Kpangalam", priceTier: 2, tags: ["residentiel"] },
    ],
  },
  {
    slug: "kara",
    name: "Kara",
    countryCode: "TG",
    isCapital: false,
    population: 109_000,
    lat: 9.5511,
    lng: 1.1861,
    neighborhoods: [
      { slug: "centre", name: "Centre", priceTier: 3, tags: ["affaires"] },
    ],
  },
];

// ---------------------------------------------------------------------------
// CÔTE D'IVOIRE
// ---------------------------------------------------------------------------

const COTE_IVOIRE_CITIES: City[] = [
  {
    slug: "abidjan",
    name: "Abidjan",
    countryCode: "CI",
    isCapital: false,
    population: 4_700_000,
    lat: 5.3600,
    lng: -4.0083,
    neighborhoods: [
      { slug: "cocody", name: "Cocody", priceTier: 5, tags: ["residentiel"] },
      { slug: "plateau", name: "Plateau", priceTier: 5, tags: ["affaires"] },
      { slug: "marcory", name: "Marcory", priceTier: 4, tags: ["residentiel", "balneaire"] },
      { slug: "treichville", name: "Treichville", priceTier: 3, tags: ["residentiel", "commercial"] },
      { slug: "yopougon", name: "Yopougon", priceTier: 2, tags: ["residentiel"] },
      { slug: "abobo", name: "Abobo", priceTier: 2, tags: ["residentiel"] },
      { slug: "adjame", name: "Adjamé", priceTier: 3, tags: ["commercial"] },
      { slug: "riviera", name: "Riviera", priceTier: 5, tags: ["residentiel"] },
      { slug: "deux-plateaux", name: "Deux Plateaux", priceTier: 5, tags: ["residentiel"] },
    ],
  },
  {
    slug: "yamoussoukro",
    name: "Yamoussoukro",
    countryCode: "CI",
    isCapital: true,
    population: 362_000,
    lat: 6.8276,
    lng: -5.2893,
    neighborhoods: [
      { slug: "centre", name: "Centre", priceTier: 4, tags: ["affaires"] },
      { slug: "habitat", name: "Habitat", priceTier: 3, tags: ["residentiel"] },
    ],
  },
  {
    slug: "bouake",
    name: "Bouaké",
    countryCode: "CI",
    isCapital: false,
    population: 832_000,
    lat: 7.6906,
    lng: -5.0307,
    neighborhoods: [
      { slug: "centre", name: "Centre", priceTier: 3, tags: ["affaires"] },
      { slug: "kennedy", name: "Kennedy", priceTier: 3, tags: ["residentiel"] },
    ],
  },
  {
    slug: "san-pedro",
    name: "San-Pédro",
    countryCode: "CI",
    isCapital: false,
    population: 350_000,
    lat: 4.7485,
    lng: -6.6363,
    neighborhoods: [
      { slug: "plage", name: "Plage", priceTier: 4, tags: ["balneaire"] },
      { slug: "centre", name: "Centre", priceTier: 3, tags: ["affaires"] },
    ],
  },
];

// ---------------------------------------------------------------------------
// SÉNÉGAL
// ---------------------------------------------------------------------------

const SENEGAL_CITIES: City[] = [
  {
    slug: "dakar",
    name: "Dakar",
    countryCode: "SN",
    isCapital: true,
    population: 3_140_000,
    lat: 14.7167,
    lng: -17.4677,
    neighborhoods: [
      { slug: "almadies", name: "Almadies", priceTier: 5, tags: ["balneaire", "residentiel"] },
      { slug: "ngor", name: "Ngor", priceTier: 5, tags: ["balneaire"] },
      { slug: "yoff", name: "Yoff", priceTier: 4, tags: ["residentiel"] },
      { slug: "plateau", name: "Plateau", priceTier: 5, tags: ["affaires"] },
      { slug: "mermoz", name: "Mermoz", priceTier: 4, tags: ["residentiel"] },
      { slug: "fann", name: "Fann", priceTier: 5, tags: ["residentiel"] },
      { slug: "medina", name: "Médina", priceTier: 3, tags: ["historique"] },
      { slug: "ouakam", name: "Ouakam", priceTier: 4, tags: ["residentiel"] },
      { slug: "sicap", name: "Sicap", priceTier: 4, tags: ["residentiel"] },
    ],
  },
  {
    slug: "thies",
    name: "Thiès",
    countryCode: "SN",
    isCapital: false,
    population: 320_000,
    lat: 14.7886,
    lng: -16.9260,
    neighborhoods: [
      { slug: "centre", name: "Centre", priceTier: 3, tags: ["affaires"] },
    ],
  },
  {
    slug: "saint-louis",
    name: "Saint-Louis",
    countryCode: "SN",
    isCapital: false,
    population: 256_000,
    lat: 16.0179,
    lng: -16.4896,
    neighborhoods: [
      { slug: "ile", name: "Île", priceTier: 4, tags: ["historique"] },
      { slug: "sor", name: "Sor", priceTier: 3, tags: ["residentiel"] },
    ],
  },
];

// ---------------------------------------------------------------------------
// BURKINA FASO
// ---------------------------------------------------------------------------

const BURKINA_CITIES: City[] = [
  {
    slug: "ouagadougou",
    name: "Ouagadougou",
    countryCode: "BF",
    isCapital: true,
    population: 2_415_000,
    lat: 12.3714,
    lng: -1.5197,
    neighborhoods: [
      { slug: "ouaga-2000", name: "Ouaga 2000", priceTier: 5, tags: ["residentiel"] },
      { slug: "zone-du-bois", name: "Zone du Bois", priceTier: 5, tags: ["residentiel"] },
      { slug: "koulouba", name: "Koulouba", priceTier: 4, tags: ["affaires"] },
      { slug: "patte-doie", name: "Patte d'Oie", priceTier: 4, tags: ["residentiel"] },
      { slug: "dapoya", name: "Dapoya", priceTier: 3, tags: ["affaires"] },
      { slug: "bilbalogo", name: "Bilbalogo", priceTier: 3, tags: ["residentiel"] },
    ],
  },
  {
    slug: "bobo-dioulasso",
    name: "Bobo-Dioulasso",
    countryCode: "BF",
    isCapital: false,
    population: 1_117_000,
    lat: 11.1781,
    lng: -4.2972,
    neighborhoods: [
      { slug: "centre", name: "Centre", priceTier: 3, tags: ["affaires"] },
      { slug: "sarfalao", name: "Sarfalao", priceTier: 2, tags: ["residentiel"] },
    ],
  },
];

// ---------------------------------------------------------------------------
// GHANA
// ---------------------------------------------------------------------------

const GHANA_CITIES: City[] = [
  {
    slug: "accra",
    name: "Accra",
    countryCode: "GH",
    isCapital: true,
    population: 2_400_000,
    lat: 5.6037,
    lng: -0.1870,
    neighborhoods: [
      { slug: "east-legon", name: "East Legon", priceTier: 5, tags: ["residentiel"] },
      { slug: "airport-residential", name: "Airport Residential", priceTier: 5, tags: ["residentiel"] },
      { slug: "cantonments", name: "Cantonments", priceTier: 5, tags: ["residentiel"] },
      { slug: "labone", name: "Labone", priceTier: 4, tags: ["residentiel"] },
      { slug: "osu", name: "Osu", priceTier: 4, tags: ["affaires", "commercial"] },
      { slug: "tema", name: "Tema", priceTier: 3, tags: ["residentiel"] },
    ],
  },
  {
    slug: "kumasi",
    name: "Kumasi",
    countryCode: "GH",
    isCapital: false,
    population: 3_490_000,
    lat: 6.6885,
    lng: -1.6244,
    neighborhoods: [
      { slug: "centre", name: "Centre", priceTier: 3, tags: ["affaires"] },
      { slug: "asokwa", name: "Asokwa", priceTier: 3, tags: ["residentiel"] },
    ],
  },
];

// ---------------------------------------------------------------------------
// NIGERIA — Lagos focus
// ---------------------------------------------------------------------------

const NIGERIA_CITIES: City[] = [
  {
    slug: "lagos",
    name: "Lagos",
    countryCode: "NG",
    isCapital: false,
    population: 15_388_000,
    lat: 6.5244,
    lng: 3.3792,
    neighborhoods: [
      { slug: "ikoyi", name: "Ikoyi", priceTier: 5, tags: ["residentiel", "affaires"] },
      { slug: "victoria-island", name: "Victoria Island", priceTier: 5, tags: ["affaires", "balneaire"] },
      { slug: "lekki", name: "Lekki", priceTier: 5, tags: ["residentiel", "balneaire"] },
      { slug: "ikeja", name: "Ikeja", priceTier: 4, tags: ["affaires"] },
      { slug: "yaba", name: "Yaba", priceTier: 3, tags: ["etudiant", "commercial"] },
      { slug: "surulere", name: "Surulere", priceTier: 3, tags: ["residentiel"] },
    ],
  },
  {
    slug: "abuja",
    name: "Abuja",
    countryCode: "NG",
    isCapital: true,
    population: 3_840_000,
    lat: 9.0765,
    lng: 7.3986,
    neighborhoods: [
      { slug: "asokoro", name: "Asokoro", priceTier: 5, tags: ["residentiel"] },
      { slug: "maitama", name: "Maitama", priceTier: 5, tags: ["residentiel"] },
      { slug: "wuse", name: "Wuse", priceTier: 4, tags: ["affaires"] },
      { slug: "garki", name: "Garki", priceTier: 4, tags: ["affaires"] },
    ],
  },
];

// ---------------------------------------------------------------------------
// EXPORT — Référentiel pays
// ---------------------------------------------------------------------------

export const COUNTRIES: Country[] = [
  {
    code: "BJ",
    name: "Bénin",
    flag: "🇧🇯",
    currency: "XOF",
    languages: ["Français"],
    cities: BENIN_CITIES,
    priority: 1,
    status: "live",
  },
  {
    code: "CI",
    name: "Côte d'Ivoire",
    flag: "🇨🇮",
    currency: "XOF",
    languages: ["Français"],
    cities: COTE_IVOIRE_CITIES,
    priority: 2,
    status: "live",
  },
  {
    code: "SN",
    name: "Sénégal",
    flag: "🇸🇳",
    currency: "XOF",
    languages: ["Français", "Wolof"],
    cities: SENEGAL_CITIES,
    priority: 3,
    status: "live",
  },
  {
    code: "TG",
    name: "Togo",
    flag: "🇹🇬",
    currency: "XOF",
    languages: ["Français"],
    cities: TOGO_CITIES,
    priority: 4,
    status: "live",
  },
  {
    code: "BF",
    name: "Burkina Faso",
    flag: "🇧🇫",
    currency: "XOF",
    languages: ["Français"],
    cities: BURKINA_CITIES,
    priority: 5,
    status: "live",
  },
  {
    code: "GH",
    name: "Ghana",
    flag: "🇬🇭",
    currency: "GHS",
    languages: ["Anglais"],
    cities: GHANA_CITIES,
    priority: 6,
    status: "soon",
  },
  {
    code: "NG",
    name: "Nigeria",
    flag: "🇳🇬",
    currency: "NGN",
    languages: ["Anglais"],
    cities: NIGERIA_CITIES,
    priority: 7,
    status: "soon",
  },
];

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

export const getCountryByCode = (code: string): Country | undefined =>
  COUNTRIES.find((c) => c.code === code);

export const getCityBySlug = (
  countryCode: string,
  citySlug: string,
): City | undefined =>
  getCountryByCode(countryCode)?.cities.find((c) => c.slug === citySlug);

export const getNeighborhood = (
  countryCode: string,
  citySlug: string,
  neighborhoodSlug: string,
): Neighborhood | undefined =>
  getCityBySlug(countryCode, citySlug)?.neighborhoods.find(
    (n) => n.slug === neighborhoodSlug,
  );

/** Toutes les villes tout pays confondu, triées par population */
export const getAllCities = (): City[] =>
  COUNTRIES.flatMap((c) => c.cities).sort(
    (a, b) => b.population - a.population,
  );

/** Pays opérationnels uniquement */
export const getLiveCountries = (): Country[] =>
  COUNTRIES.filter((c) => c.status === "live").sort(
    (a, b) => a.priority - b.priority,
  );

/** Liste plate "Cotonou, Bénin" pour autocomplete */
export const getLocationSuggestions = (): {
  label: string;
  countryCode: string;
  citySlug: string;
  city: string;
  country: string;
  flag: string;
}[] =>
  COUNTRIES.flatMap((country) =>
    country.cities.map((city) => ({
      label: `${city.name}, ${country.name}`,
      countryCode: country.code,
      citySlug: city.slug,
      city: city.name,
      country: country.name,
      flag: country.flag,
    })),
  );
