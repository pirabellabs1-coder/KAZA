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
// RESTE DE L'AFRIQUE — couverture panafricaine (villes principales)
// Pas de quartiers détaillés (neighborhoods: []) — densifiés au fil de l'eau.
// Helper pour créer une ville "simple" sans quartiers.
// ---------------------------------------------------------------------------

const city = (
  countryCode: string,
  slug: string,
  name: string,
  isCapital: boolean,
  population: number,
  lat: number,
  lng: number,
): City => ({
  slug,
  name,
  countryCode,
  isCapital,
  population,
  lat,
  lng,
  neighborhoods: [],
});

// Afrique du Nord
const ALGERIA_CITIES: City[] = [
  city("DZ", "alger", "Alger", true, 3_415_000, 36.7538, 3.0588),
  city("DZ", "oran", "Oran", false, 1_560_000, 35.6971, -0.6308),
  city("DZ", "constantine", "Constantine", false, 938_000, 36.365, 6.6147),
  city("DZ", "annaba", "Annaba", false, 464_000, 36.9, 7.7667),
  city("DZ", "blida", "Blida", false, 332_000, 36.4703, 2.8277),
  city("DZ", "batna", "Batna", false, 290_000, 35.5556, 6.1742),
  city("DZ", "setif", "Sétif", false, 288_000, 36.19, 5.41),
  city("DZ", "tlemcen", "Tlemcen", false, 173_000, 34.8783, -1.315),
];

const EGYPT_CITIES: City[] = [
  city("EG", "le-caire", "Le Caire", true, 9_540_000, 30.0444, 31.2357),
  city("EG", "alexandrie", "Alexandrie", false, 5_200_000, 31.2001, 29.9187),
  city("EG", "gizeh", "Gizeh", false, 4_360_000, 30.0131, 31.2089),
  city("EG", "chubra-el-kheima", "Choubra El-Kheima", false, 1_160_000, 30.1286, 31.2422),
  city("EG", "port-said", "Port-Saïd", false, 750_000, 31.2653, 32.3019),
  city("EG", "suez", "Suez", false, 745_000, 29.9668, 32.5498),
  city("EG", "louxor", "Louxor", false, 507_000, 25.6872, 32.6396),
  city("EG", "assouan", "Assouan", false, 290_000, 24.0889, 32.8998),
];

const LIBYA_CITIES: City[] = [
  city("LY", "tripoli", "Tripoli", true, 1_150_000, 32.8872, 13.1913),
  city("LY", "benghazi", "Benghazi", false, 650_000, 32.1167, 20.0667),
  city("LY", "misrata", "Misrata", false, 280_000, 32.3754, 15.0925),
  city("LY", "zaouïa", "Zaouïa", false, 200_000, 32.7522, 12.7269),
  city("LY", "bayda", "Bayda", false, 160_000, 32.7627, 21.755),
  city("LY", "sebha", "Sebha", false, 130_000, 27.0377, 14.4283),
];

const MOROCCO_CITIES: City[] = [
  city("MA", "casablanca", "Casablanca", false, 3_360_000, 33.5731, -7.5898),
  city("MA", "rabat", "Rabat", true, 580_000, 34.0209, -6.8416),
  city("MA", "fes", "Fès", false, 1_110_000, 34.0181, -5.0078),
  city("MA", "marrakech", "Marrakech", false, 928_000, 31.6295, -7.9811),
  city("MA", "tanger", "Tanger", false, 947_000, 35.7595, -5.834),
  city("MA", "meknes", "Meknès", false, 632_000, 33.8935, -5.5473),
  city("MA", "agadir", "Agadir", false, 421_000, 30.4278, -9.5981),
  city("MA", "oujda", "Oujda", false, 494_000, 34.6814, -1.9086),
  city("MA", "kenitra", "Kénitra", false, 431_000, 34.261, -6.5802),
];

const TUNISIA_CITIES: City[] = [
  city("TN", "tunis", "Tunis", true, 1_056_000, 36.8065, 10.1815),
  city("TN", "sfax", "Sfax", false, 330_000, 34.7406, 10.7603),
  city("TN", "sousse", "Sousse", false, 271_000, 35.8256, 10.6411),
  city("TN", "kairouan", "Kairouan", false, 187_000, 35.6781, 10.0963),
  city("TN", "bizerte", "Bizerte", false, 143_000, 37.2744, 9.8739),
  city("TN", "gabes", "Gabès", false, 152_000, 33.8815, 10.0982),
  city("TN", "ariana", "Ariana", false, 114_000, 36.8625, 10.1956),
];

const SUDAN_CITIES: City[] = [
  city("SD", "khartoum", "Khartoum", true, 5_270_000, 15.5007, 32.5599),
  city("SD", "omdourman", "Omdourman", false, 2_400_000, 15.6445, 32.4777),
  city("SD", "port-soudan", "Port-Soudan", false, 490_000, 19.6175, 37.2164),
  city("SD", "kassala", "Kassala", false, 420_000, 15.451, 36.4),
  city("SD", "el-obeid", "El-Obeid", false, 408_000, 13.1843, 30.2167),
  city("SD", "nyala", "Nyala", false, 565_000, 12.0489, 24.8807),
];

// Afrique de l'Ouest (compléments)
const CAPE_VERDE_CITIES: City[] = [
  city("CV", "praia", "Praia", true, 159_000, 14.9315, -23.5125),
  city("CV", "mindelo", "Mindelo", false, 70_000, 16.8901, -24.9804),
  city("CV", "santa-maria", "Santa Maria", false, 25_000, 16.6033, -22.9035),
  city("CV", "assomada", "Assomada", false, 12_000, 15.1, -23.6833),
  city("CV", "espargos", "Espargos", false, 17_000, 16.7567, -22.9494),
];

const GAMBIA_CITIES: City[] = [
  city("GM", "banjul", "Banjul", true, 31_000, 13.4549, -16.579),
  city("GM", "serekunda", "Serekunda", false, 340_000, 13.4382, -16.6781),
  city("GM", "brikama", "Brikama", false, 90_000, 13.2715, -16.6485),
  city("GM", "bakau", "Bakau", false, 44_000, 13.4781, -16.6819),
  city("GM", "farafenni", "Farafenni", false, 30_000, 13.5667, -15.6),
];

const GUINEA_CITIES: City[] = [
  city("GN", "conakry", "Conakry", true, 1_660_000, 9.6412, -13.5784),
  city("GN", "nzerekore", "Nzérékoré", false, 195_000, 7.7562, -8.818),
  city("GN", "kankan", "Kankan", false, 200_000, 10.3854, -9.3057),
  city("GN", "kindia", "Kindia", false, 181_000, 10.0567, -12.8654),
  city("GN", "labe", "Labé", false, 200_000, 11.3182, -12.2833),
  city("GN", "boke", "Boké", false, 65_000, 10.9333, -14.3),
];

const GUINEA_BISSAU_CITIES: City[] = [
  city("GW", "bissau", "Bissau", true, 492_000, 11.8636, -15.5977),
  city("GW", "bafata", "Bafatá", false, 23_000, 12.1667, -14.6667),
  city("GW", "gabu", "Gabú", false, 15_000, 12.2833, -14.2167),
  city("GW", "bissora", "Bissorã", false, 12_000, 12.2233, -15.4475),
  city("GW", "bolama", "Bolama", false, 11_000, 11.5775, -15.4769),
];

const LIBERIA_CITIES: City[] = [
  city("LR", "monrovia", "Monrovia", true, 1_020_000, 6.3007, -10.7969),
  city("LR", "gbarnga", "Gbarnga", false, 56_000, 6.9956, -9.4722),
  city("LR", "kakata", "Kakata", false, 49_000, 6.5306, -10.3531),
  city("LR", "buchanan", "Buchanan", false, 35_000, 5.8808, -10.0467),
  city("LR", "harper", "Harper", false, 33_000, 4.375, -7.7169),
];

const MALI_CITIES: City[] = [
  city("ML", "bamako", "Bamako", true, 2_710_000, 12.6392, -8.0029),
  city("ML", "sikasso", "Sikasso", false, 226_000, 11.3176, -5.6665),
  city("ML", "segou", "Ségou", false, 158_000, 13.4317, -6.2658),
  city("ML", "mopti", "Mopti", false, 148_000, 14.4843, -4.1828),
  city("ML", "koutiala", "Koutiala", false, 142_000, 12.39, -5.4642),
  city("ML", "kayes", "Kayes", false, 127_000, 14.4469, -11.4456),
  city("ML", "gao", "Gao", false, 87_000, 16.2666, -0.0414),
];

const MAURITANIA_CITIES: City[] = [
  city("MR", "nouakchott", "Nouakchott", true, 1_315_000, 18.0735, -15.9582),
  city("MR", "nouadhibou", "Nouadhibou", false, 118_000, 20.9311, -17.0347),
  city("MR", "kiffa", "Kiffa", false, 50_000, 16.6203, -11.4044),
  city("MR", "kaedi", "Kaédi", false, 56_000, 16.1517, -13.5042),
  city("MR", "rosso", "Rosso", false, 49_000, 16.5138, -15.805),
  city("MR", "zouerate", "Zouérate", false, 45_000, 22.7355, -12.4793),
];

const NIGER_CITIES: City[] = [
  city("NE", "niamey", "Niamey", true, 1_330_000, 13.5128, 2.1126),
  city("NE", "zinder", "Zinder", false, 322_000, 13.8053, 8.9881),
  city("NE", "maradi", "Maradi", false, 267_000, 13.5, 7.1017),
  city("NE", "agadez", "Agadez", false, 124_000, 16.9742, 7.9865),
  city("NE", "tahoua", "Tahoua", false, 149_000, 14.8888, 5.2692),
  city("NE", "dosso", "Dosso", false, 89_000, 13.049, 3.1937),
];

const SIERRA_LEONE_CITIES: City[] = [
  city("SL", "freetown", "Freetown", true, 1_055_000, 8.4844, -13.2344),
  city("SL", "bo", "Bo", false, 174_000, 7.9647, -11.7383),
  city("SL", "kenema", "Kenema", false, 188_000, 7.8767, -11.19),
  city("SL", "makeni", "Makeni", false, 126_000, 8.8833, -12.05),
  city("SL", "koidu", "Koidu", false, 124_000, 8.6439, -10.9714),
];

// Afrique centrale
const ANGOLA_CITIES: City[] = [
  city("AO", "luanda", "Luanda", true, 2_570_000, -8.839, 13.2894),
  city("AO", "huambo", "Huambo", false, 595_000, -12.7761, 15.7392),
  city("AO", "lobito", "Lobito", false, 357_000, -12.3644, 13.5364),
  city("AO", "benguela", "Benguela", false, 555_000, -12.5783, 13.4072),
  city("AO", "lubango", "Lubango", false, 330_000, -14.9177, 13.4925),
  city("AO", "cabinda", "Cabinda", false, 624_000, -5.55, 12.2),
  city("AO", "malanje", "Malanje", false, 455_000, -9.5402, 16.341),
];

const CAMEROON_CITIES: City[] = [
  city("CM", "yaounde", "Yaoundé", true, 2_770_000, 3.848, 11.5021),
  city("CM", "douala", "Douala", false, 2_770_000, 4.0511, 9.7679),
  city("CM", "garoua", "Garoua", false, 436_000, 9.3017, 13.3921),
  city("CM", "bamenda", "Bamenda", false, 393_000, 5.9597, 10.1453),
  city("CM", "maroua", "Maroua", false, 320_000, 10.591, 14.3158),
  city("CM", "bafoussam", "Bafoussam", false, 348_000, 5.4781, 10.4176),
  city("CM", "ngaoundere", "Ngaoundéré", false, 231_000, 7.3167, 13.5833),
];

const CENTRAFRIQUE_CITIES: City[] = [
  city("CF", "bangui", "Bangui", true, 889_000, 4.3947, 18.5582),
  city("CF", "bimbo", "Bimbo", false, 267_000, 4.2575, 18.4158),
  city("CF", "berberati", "Berbérati", false, 76_000, 4.2613, 15.7906),
  city("CF", "carnot", "Carnot", false, 45_000, 4.9385, 15.8786),
  city("CF", "bambari", "Bambari", false, 41_000, 5.7689, 20.6792),
];

const CHAD_CITIES: City[] = [
  city("TD", "ndjamena", "N'Djaména", true, 1_530_000, 12.1348, 15.0557),
  city("TD", "moundou", "Moundou", false, 142_000, 8.5667, 16.0833),
  city("TD", "sarh", "Sarh", false, 110_000, 9.1429, 18.3923),
  city("TD", "abeche", "Abéché", false, 95_000, 13.8292, 20.8324),
  city("TD", "kelo", "Kélo", false, 60_000, 9.3094, 15.8064),
];

const CONGO_CITIES: City[] = [
  city("CG", "brazzaville", "Brazzaville", true, 1_830_000, -4.2634, 15.2429),
  city("CG", "pointe-noire", "Pointe-Noire", false, 1_140_000, -4.7889, 11.8653),
  city("CG", "dolisie", "Dolisie", false, 128_000, -4.1989, 12.6661),
  city("CG", "nkayi", "Nkayi", false, 72_000, -4.1828, 13.2872),
  city("CG", "ouesso", "Ouésso", false, 28_000, 1.6136, 16.0517),
];

const DRC_CITIES: City[] = [
  city("CD", "kinshasa", "Kinshasa", true, 14_970_000, -4.4419, 15.2663),
  city("CD", "lubumbashi", "Lubumbashi", false, 2_580_000, -11.6609, 27.4794),
  city("CD", "mbuji-mayi", "Mbuji-Mayi", false, 2_770_000, -6.1361, 23.5897),
  city("CD", "kananga", "Kananga", false, 1_590_000, -5.8964, 22.4173),
  city("CD", "kisangani", "Kisangani", false, 1_260_000, 0.5152, 25.1909),
  city("CD", "bukavu", "Bukavu", false, 1_130_000, -2.5083, 28.8608),
  city("CD", "goma", "Goma", false, 670_000, -1.6792, 29.2228),
];

const EQ_GUINEA_CITIES: City[] = [
  city("GQ", "malabo", "Malabo", true, 297_000, 3.7549, 8.7371),
  city("GQ", "bata", "Bata", false, 250_000, 1.8639, 9.765),
  city("GQ", "ebebiyin", "Ebebiyín", false, 47_000, 2.151, 11.3263),
  city("GQ", "mongomo", "Mongomo", false, 12_000, 1.6276, 11.3164),
  city("GQ", "oyala", "Ciudad de la Paz", false, 10_000, 1.6, 10.6),
];

const GABON_CITIES: City[] = [
  city("GA", "libreville", "Libreville", true, 845_000, 0.4162, 9.4673),
  city("GA", "port-gentil", "Port-Gentil", false, 136_000, -0.7193, 8.7815),
  city("GA", "franceville", "Franceville", false, 110_000, -1.6333, 13.5833),
  city("GA", "oyem", "Oyem", false, 60_000, 1.5993, 11.5793),
  city("GA", "moanda", "Moanda", false, 59_000, -1.5667, 13.2),
];

const SAO_TOME_CITIES: City[] = [
  city("ST", "sao-tome", "São Tomé", true, 90_000, 0.3365, 6.7273),
  city("ST", "santo-antonio", "Santo António", false, 1_200, 1.6383, 7.4194),
  city("ST", "neves", "Neves", false, 7_000, 0.3597, 6.5511),
  city("ST", "santana", "Santana", false, 7_000, 0.2536, 6.7464),
  city("ST", "trindade", "Trindade", false, 6_500, 0.3, 6.6833),
];

// Afrique de l'Est
const BURUNDI_CITIES: City[] = [
  city("BI", "gitega", "Gitega", true, 135_000, -3.4271, 29.9246),
  city("BI", "bujumbura", "Bujumbura", false, 1_010_000, -3.3614, 29.3599),
  city("BI", "muyinga", "Muyinga", false, 71_000, -2.8451, 30.3414),
  city("BI", "ngozi", "Ngozi", false, 40_000, -2.9075, 29.8306),
  city("BI", "ruyigi", "Ruyigi", false, 38_000, -3.4764, 30.2486),
];

const COMOROS_CITIES: City[] = [
  city("KM", "moroni", "Moroni", true, 111_000, -11.7172, 43.2473),
  city("KM", "mutsamudu", "Mutsamudu", false, 30_000, -12.1675, 44.3964),
  city("KM", "fomboni", "Fomboni", false, 14_000, -12.28, 43.7425),
  city("KM", "domoni", "Domoni", false, 13_000, -12.2569, 44.5314),
];

const DJIBOUTI_CITIES: City[] = [
  city("DJ", "djibouti", "Djibouti", true, 624_000, 11.5721, 43.1456),
  city("DJ", "ali-sabieh", "Ali Sabieh", false, 40_000, 11.1558, 42.7125),
  city("DJ", "tadjourah", "Tadjourah", false, 25_000, 11.7833, 42.8833),
  city("DJ", "obock", "Obock", false, 18_000, 11.965, 43.2864),
  city("DJ", "dikhil", "Dikhil", false, 24_000, 11.1072, 42.3706),
];

const ERITREA_CITIES: City[] = [
  city("ER", "asmara", "Asmara", true, 963_000, 15.3229, 38.9251),
  city("ER", "keren", "Keren", false, 146_000, 15.7778, 38.4511),
  city("ER", "massawa", "Massawa", false, 53_000, 15.6097, 39.4503),
  city("ER", "assab", "Assab", false, 28_000, 13.0089, 42.7394),
  city("ER", "mendefera", "Mendefera", false, 25_000, 14.8869, 38.815),
];

const ETHIOPIA_CITIES: City[] = [
  city("ET", "addis-abeba", "Addis-Abeba", true, 3_400_000, 9.03, 38.74),
  city("ET", "dire-dawa", "Dire Dawa", false, 440_000, 9.5931, 41.8661),
  city("ET", "mekele", "Mekele", false, 310_000, 13.4969, 39.4769),
  city("ET", "gondar", "Gondar", false, 324_000, 12.6, 37.4667),
  city("ET", "hawassa", "Hawassa", false, 315_000, 7.0621, 38.4764),
  city("ET", "bahir-dar", "Bahir Dar", false, 318_000, 11.5936, 37.3908),
  city("ET", "adama", "Adama", false, 324_000, 8.54, 39.27),
];

const KENYA_CITIES: City[] = [
  city("KE", "nairobi", "Nairobi", true, 4_400_000, -1.2921, 36.8219),
  city("KE", "mombasa", "Mombasa", false, 1_210_000, -4.0435, 39.6682),
  city("KE", "kisumu", "Kisumu", false, 610_000, -0.0917, 34.768),
  city("KE", "nakuru", "Nakuru", false, 570_000, -0.3031, 36.08),
  city("KE", "eldoret", "Eldoret", false, 475_000, 0.5143, 35.2698),
  city("KE", "thika", "Thika", false, 280_000, -1.0333, 37.0693),
  city("KE", "malindi", "Malindi", false, 120_000, -3.2175, 40.1191),
];

const MADAGASCAR_CITIES: City[] = [
  city("MG", "antananarivo", "Antananarivo", true, 1_400_000, -18.8792, 47.5079),
  city("MG", "toamasina", "Toamasina", false, 326_000, -18.1492, 49.4023),
  city("MG", "antsirabe", "Antsirabe", false, 257_000, -19.8659, 47.0333),
  city("MG", "fianarantsoa", "Fianarantsoa", false, 191_000, -21.4536, 47.0858),
  city("MG", "mahajanga", "Mahajanga", false, 246_000, -15.7167, 46.3167),
  city("MG", "toliara", "Toliara", false, 169_000, -23.3568, 43.6674),
  city("MG", "antsiranana", "Antsiranana", false, 116_000, -12.2787, 49.2917),
];

const MALAWI_CITIES: City[] = [
  city("MW", "lilongwe", "Lilongwe", true, 1_120_000, -13.9626, 33.7741),
  city("MW", "blantyre", "Blantyre", false, 1_060_000, -15.7861, 35.0058),
  city("MW", "mzuzu", "Mzuzu", false, 221_000, -11.4656, 34.0207),
  city("MW", "zomba", "Zomba", false, 105_000, -15.3833, 35.3333),
  city("MW", "kasungu", "Kasungu", false, 58_000, -13.0333, 33.4833),
];

const MAURITIUS_CITIES: City[] = [
  city("MU", "port-louis", "Port-Louis", true, 149_000, -20.1609, 57.5012),
  city("MU", "beau-bassin-rose-hill", "Beau Bassin-Rose Hill", false, 104_000, -20.2333, 57.4667),
  city("MU", "vacoas-phoenix", "Vacoas-Phoenix", false, 106_000, -20.2981, 57.4783),
  city("MU", "curepipe", "Curepipe", false, 78_000, -20.3188, 57.5261),
  city("MU", "quatre-bornes", "Quatre Bornes", false, 80_000, -20.2654, 57.4791),
];

const MOZAMBIQUE_CITIES: City[] = [
  city("MZ", "maputo", "Maputo", true, 1_120_000, -25.9692, 32.5732),
  city("MZ", "matola", "Matola", false, 1_030_000, -25.9622, 32.4589),
  city("MZ", "nampula", "Nampula", false, 743_000, -15.1165, 39.2666),
  city("MZ", "beira", "Beira", false, 530_000, -19.8436, 34.8389),
  city("MZ", "chimoio", "Chimoio", false, 372_000, -19.1164, 33.4833),
  city("MZ", "nacala", "Nacala", false, 225_000, -14.5428, 40.6728),
];

const RWANDA_CITIES: City[] = [
  city("RW", "kigali", "Kigali", true, 1_320_000, -1.9441, 30.0619),
  city("RW", "butare", "Butare", false, 89_000, -2.5967, 29.7394),
  city("RW", "gisenyi", "Gisenyi", false, 136_000, -1.7021, 29.2564),
  city("RW", "ruhengeri", "Ruhengeri", false, 86_000, -1.4997, 29.6342),
  city("RW", "muhanga", "Muhanga", false, 60_000, -2.0853, 29.7564),
];

const SEYCHELLES_CITIES: City[] = [
  city("SC", "victoria", "Victoria", true, 27_000, -4.6191, 55.4513),
  city("SC", "anse-boileau", "Anse Boileau", false, 4_000, -4.7167, 55.485),
  city("SC", "beau-vallon", "Beau Vallon", false, 4_500, -4.6167, 55.4333),
  city("SC", "takamaka", "Takamaka", false, 3_000, -4.7667, 55.5167),
];

const SOMALIA_CITIES: City[] = [
  city("SO", "mogadiscio", "Mogadiscio", true, 2_590_000, 2.0469, 45.3182),
  city("SO", "hargeisa", "Hargeisa", false, 1_200_000, 9.56, 44.065),
  city("SO", "bosaso", "Bosaso", false, 700_000, 11.2842, 49.1816),
  city("SO", "kismayo", "Kismayo", false, 234_000, -0.3582, 42.5454),
  city("SO", "baidoa", "Baidoa", false, 145_000, 3.1136, 43.6498),
];

const SOUTH_SUDAN_CITIES: City[] = [
  city("SS", "djouba", "Djouba", true, 525_000, 4.8594, 31.5713),
  city("SS", "ouaou", "Wau", false, 233_000, 7.7022, 27.99),
  city("SS", "malakal", "Malakal", false, 147_000, 9.5334, 31.6605),
  city("SS", "yei", "Yei", false, 185_000, 4.0905, 30.6781),
  city("SS", "aweil", "Aweil", false, 53_000, 8.7619, 27.3992),
];

const TANZANIA_CITIES: City[] = [
  city("TZ", "dar-es-salaam", "Dar es Salaam", false, 4_360_000, -6.7924, 39.2083),
  city("TZ", "dodoma", "Dodoma", true, 411_000, -6.163, 35.7516),
  city("TZ", "mwanza", "Mwanza", false, 706_000, -2.5164, 32.9175),
  city("TZ", "arusha", "Arusha", false, 416_000, -3.3869, 36.683),
  city("TZ", "zanzibar", "Zanzibar", false, 405_000, -6.1659, 39.2026),
  city("TZ", "mbeya", "Mbeya", false, 385_000, -8.9094, 33.4608),
  city("TZ", "morogoro", "Morogoro", false, 315_000, -6.8278, 37.6591),
];

const UGANDA_CITIES: City[] = [
  city("UG", "kampala", "Kampala", true, 1_650_000, 0.3476, 32.5825),
  city("UG", "gulu", "Gulu", false, 150_000, 2.7747, 32.2999),
  city("UG", "lira", "Lira", false, 119_000, 2.2499, 32.8999),
  city("UG", "mbarara", "Mbarara", false, 196_000, -0.6072, 30.6545),
  city("UG", "jinja", "Jinja", false, 72_000, 0.4244, 33.2042),
  city("UG", "mbale", "Mbale", false, 96_000, 1.082, 34.1758),
];

// Afrique australe
const BOTSWANA_CITIES: City[] = [
  city("BW", "gaborone", "Gaborone", true, 246_000, -24.6282, 25.9231),
  city("BW", "francistown", "Francistown", false, 100_000, -21.17, 27.5083),
  city("BW", "molepolole", "Molepolole", false, 67_000, -24.4067, 25.495),
  city("BW", "maun", "Maun", false, 60_000, -19.9833, 23.4167),
  city("BW", "serowe", "Serowe", false, 50_000, -22.3875, 26.7106),
];

const ESWATINI_CITIES: City[] = [
  city("SZ", "mbabane", "Mbabane", true, 95_000, -26.3054, 31.1367),
  city("SZ", "manzini", "Manzini", false, 110_000, -26.4833, 31.3667),
  city("SZ", "lobamba", "Lobamba", true, 11_000, -26.4465, 31.2079),
  city("SZ", "nhlangano", "Nhlangano", false, 9_000, -27.1167, 31.2),
  city("SZ", "siteki", "Siteki", false, 7_000, -26.45, 31.95),
];

const LESOTHO_CITIES: City[] = [
  city("LS", "maseru", "Maseru", true, 330_000, -29.31, 27.4833),
  city("LS", "teyateyaneng", "Teyateyaneng", false, 76_000, -29.15, 27.75),
  city("LS", "mafeteng", "Mafeteng", false, 57_000, -29.8231, 27.2425),
  city("LS", "hlotse", "Hlotse", false, 47_000, -28.8833, 28.05),
  city("LS", "mohales-hoek", "Mohale's Hoek", false, 28_000, -30.1531, 27.4783),
];

const NAMIBIA_CITIES: City[] = [
  city("NA", "windhoek", "Windhoek", true, 431_000, -22.5594, 17.0832),
  city("NA", "rundu", "Rundu", false, 119_000, -17.9333, 19.7667),
  city("NA", "walvis-bay", "Walvis Bay", false, 86_000, -22.9575, 14.5053),
  city("NA", "swakopmund", "Swakopmund", false, 75_000, -22.6792, 14.5272),
  city("NA", "oshakati", "Oshakati", false, 37_000, -17.7883, 15.7044),
];

const SOUTH_AFRICA_CITIES: City[] = [
  city("ZA", "johannesburg", "Johannesburg", false, 5_780_000, -26.2041, 28.0473),
  city("ZA", "le-cap", "Le Cap", true, 4_620_000, -33.9249, 18.4241),
  city("ZA", "durban", "Durban", false, 3_440_000, -29.8587, 31.0218),
  city("ZA", "pretoria", "Pretoria", true, 2_470_000, -25.7479, 28.2293),
  city("ZA", "port-elizabeth", "Gqeberha (Port Elizabeth)", false, 1_150_000, -33.9608, 25.6022),
  city("ZA", "bloemfontein", "Bloemfontein", true, 556_000, -29.0852, 26.1596),
  city("ZA", "east-london", "East London", false, 478_000, -33.0153, 27.9116),
  city("ZA", "polokwane", "Polokwane", false, 130_000, -23.9045, 29.4689),
];

const ZAMBIA_CITIES: City[] = [
  city("ZM", "lusaka", "Lusaka", true, 2_470_000, -15.3875, 28.3228),
  city("ZM", "kitwe", "Kitwe", false, 504_000, -12.8024, 28.2132),
  city("ZM", "ndola", "Ndola", false, 528_000, -12.9587, 28.6366),
  city("ZM", "kabwe", "Kabwe", false, 202_000, -14.4469, 28.4464),
  city("ZM", "chingola", "Chingola", false, 157_000, -12.5289, 27.8492),
  city("ZM", "livingstone", "Livingstone", false, 134_000, -17.8419, 25.8543),
];

const ZIMBABWE_CITIES: City[] = [
  city("ZW", "harare", "Harare", true, 1_540_000, -17.8292, 31.0522),
  city("ZW", "bulawayo", "Bulawayo", false, 665_000, -20.1325, 28.6265),
  city("ZW", "chitungwiza", "Chitungwiza", false, 371_000, -18.0127, 31.0756),
  city("ZW", "mutare", "Mutare", false, 224_000, -18.9707, 32.6709),
  city("ZW", "gweru", "Gweru", false, 158_000, -19.45, 29.8167),
  city("ZW", "kwekwe", "Kwekwe", false, 100_000, -18.9281, 29.8149),
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

  // === Reste de l'Afrique (pas encore opérationnel mais sélectionnable) ===

  // Afrique de l'Ouest (compléments)
  { code: "CV", name: "Cap-Vert", flag: "🇨🇻", currency: "CVE", languages: ["Portugais"], cities: CAPE_VERDE_CITIES, priority: 20, status: "soon" },
  { code: "GM", name: "Gambie", flag: "🇬🇲", currency: "GMD", languages: ["Anglais"], cities: GAMBIA_CITIES, priority: 21, status: "soon" },
  { code: "GN", name: "Guinée", flag: "🇬🇳", currency: "GNF", languages: ["Français"], cities: GUINEA_CITIES, priority: 22, status: "soon" },
  { code: "GW", name: "Guinée-Bissau", flag: "🇬🇼", currency: "XOF", languages: ["Portugais"], cities: GUINEA_BISSAU_CITIES, priority: 23, status: "soon" },
  { code: "LR", name: "Liberia", flag: "🇱🇷", currency: "LRD", languages: ["Anglais"], cities: LIBERIA_CITIES, priority: 24, status: "soon" },
  { code: "ML", name: "Mali", flag: "🇲🇱", currency: "XOF", languages: ["Français"], cities: MALI_CITIES, priority: 25, status: "soon" },
  { code: "MR", name: "Mauritanie", flag: "🇲🇷", currency: "MRU", languages: ["Arabe", "Français"], cities: MAURITANIA_CITIES, priority: 26, status: "soon" },
  { code: "NE", name: "Niger", flag: "🇳🇪", currency: "XOF", languages: ["Français"], cities: NIGER_CITIES, priority: 27, status: "soon" },
  { code: "SL", name: "Sierra Leone", flag: "🇸🇱", currency: "SLE", languages: ["Anglais"], cities: SIERRA_LEONE_CITIES, priority: 28, status: "soon" },

  // Afrique du Nord
  { code: "DZ", name: "Algérie", flag: "🇩🇿", currency: "DZD", languages: ["Arabe", "Français"], cities: ALGERIA_CITIES, priority: 30, status: "soon" },
  { code: "EG", name: "Égypte", flag: "🇪🇬", currency: "EGP", languages: ["Arabe"], cities: EGYPT_CITIES, priority: 31, status: "soon" },
  { code: "LY", name: "Libye", flag: "🇱🇾", currency: "LYD", languages: ["Arabe"], cities: LIBYA_CITIES, priority: 32, status: "soon" },
  { code: "MA", name: "Maroc", flag: "🇲🇦", currency: "MAD", languages: ["Arabe", "Français"], cities: MOROCCO_CITIES, priority: 33, status: "soon" },
  { code: "SD", name: "Soudan", flag: "🇸🇩", currency: "SDG", languages: ["Arabe", "Anglais"], cities: SUDAN_CITIES, priority: 34, status: "soon" },
  { code: "TN", name: "Tunisie", flag: "🇹🇳", currency: "TND", languages: ["Arabe", "Français"], cities: TUNISIA_CITIES, priority: 35, status: "soon" },

  // Afrique centrale
  { code: "AO", name: "Angola", flag: "🇦🇴", currency: "AOA", languages: ["Portugais"], cities: ANGOLA_CITIES, priority: 40, status: "soon" },
  { code: "CM", name: "Cameroun", flag: "🇨🇲", currency: "XAF", languages: ["Français", "Anglais"], cities: CAMEROON_CITIES, priority: 41, status: "soon" },
  { code: "CF", name: "Centrafrique", flag: "🇨🇫", currency: "XAF", languages: ["Français"], cities: CENTRAFRIQUE_CITIES, priority: 42, status: "soon" },
  { code: "TD", name: "Tchad", flag: "🇹🇩", currency: "XAF", languages: ["Français", "Arabe"], cities: CHAD_CITIES, priority: 43, status: "soon" },
  { code: "CG", name: "Congo", flag: "🇨🇬", currency: "XAF", languages: ["Français"], cities: CONGO_CITIES, priority: 44, status: "soon" },
  { code: "CD", name: "RD Congo", flag: "🇨🇩", currency: "CDF", languages: ["Français"], cities: DRC_CITIES, priority: 45, status: "soon" },
  { code: "GQ", name: "Guinée équatoriale", flag: "🇬🇶", currency: "XAF", languages: ["Espagnol", "Français"], cities: EQ_GUINEA_CITIES, priority: 46, status: "soon" },
  { code: "GA", name: "Gabon", flag: "🇬🇦", currency: "XAF", languages: ["Français"], cities: GABON_CITIES, priority: 47, status: "soon" },
  { code: "ST", name: "Sao Tomé-et-Principe", flag: "🇸🇹", currency: "STN", languages: ["Portugais"], cities: SAO_TOME_CITIES, priority: 48, status: "soon" },

  // Afrique de l'Est
  { code: "BI", name: "Burundi", flag: "🇧🇮", currency: "BIF", languages: ["Français", "Kirundi"], cities: BURUNDI_CITIES, priority: 50, status: "soon" },
  { code: "KM", name: "Comores", flag: "🇰🇲", currency: "KMF", languages: ["Français", "Arabe"], cities: COMOROS_CITIES, priority: 51, status: "soon" },
  { code: "DJ", name: "Djibouti", flag: "🇩🇯", currency: "DJF", languages: ["Français", "Arabe"], cities: DJIBOUTI_CITIES, priority: 52, status: "soon" },
  { code: "ER", name: "Érythrée", flag: "🇪🇷", currency: "ERN", languages: ["Tigrinya", "Arabe"], cities: ERITREA_CITIES, priority: 53, status: "soon" },
  { code: "ET", name: "Éthiopie", flag: "🇪🇹", currency: "ETB", languages: ["Amharique"], cities: ETHIOPIA_CITIES, priority: 54, status: "soon" },
  { code: "KE", name: "Kenya", flag: "🇰🇪", currency: "KES", languages: ["Anglais", "Swahili"], cities: KENYA_CITIES, priority: 55, status: "soon" },
  { code: "MG", name: "Madagascar", flag: "🇲🇬", currency: "MGA", languages: ["Français", "Malgache"], cities: MADAGASCAR_CITIES, priority: 56, status: "soon" },
  { code: "MW", name: "Malawi", flag: "🇲🇼", currency: "MWK", languages: ["Anglais", "Chichewa"], cities: MALAWI_CITIES, priority: 57, status: "soon" },
  { code: "MU", name: "Maurice", flag: "🇲🇺", currency: "MUR", languages: ["Anglais", "Français"], cities: MAURITIUS_CITIES, priority: 58, status: "soon" },
  { code: "MZ", name: "Mozambique", flag: "🇲🇿", currency: "MZN", languages: ["Portugais"], cities: MOZAMBIQUE_CITIES, priority: 59, status: "soon" },
  { code: "RW", name: "Rwanda", flag: "🇷🇼", currency: "RWF", languages: ["Français", "Anglais", "Kinyarwanda"], cities: RWANDA_CITIES, priority: 60, status: "soon" },
  { code: "SC", name: "Seychelles", flag: "🇸🇨", currency: "SCR", languages: ["Français", "Anglais"], cities: SEYCHELLES_CITIES, priority: 61, status: "soon" },
  { code: "SO", name: "Somalie", flag: "🇸🇴", currency: "SOS", languages: ["Somali", "Arabe"], cities: SOMALIA_CITIES, priority: 62, status: "soon" },
  { code: "SS", name: "Soudan du Sud", flag: "🇸🇸", currency: "SSP", languages: ["Anglais"], cities: SOUTH_SUDAN_CITIES, priority: 63, status: "soon" },
  { code: "TZ", name: "Tanzanie", flag: "🇹🇿", currency: "TZS", languages: ["Swahili", "Anglais"], cities: TANZANIA_CITIES, priority: 64, status: "soon" },
  { code: "UG", name: "Ouganda", flag: "🇺🇬", currency: "UGX", languages: ["Anglais", "Swahili"], cities: UGANDA_CITIES, priority: 65, status: "soon" },

  // Afrique australe
  { code: "BW", name: "Botswana", flag: "🇧🇼", currency: "BWP", languages: ["Anglais", "Tswana"], cities: BOTSWANA_CITIES, priority: 70, status: "soon" },
  { code: "SZ", name: "Eswatini", flag: "🇸🇿", currency: "SZL", languages: ["Anglais", "Swati"], cities: ESWATINI_CITIES, priority: 71, status: "soon" },
  { code: "LS", name: "Lesotho", flag: "🇱🇸", currency: "LSL", languages: ["Anglais", "Sotho"], cities: LESOTHO_CITIES, priority: 72, status: "soon" },
  { code: "NA", name: "Namibie", flag: "🇳🇦", currency: "NAD", languages: ["Anglais"], cities: NAMIBIA_CITIES, priority: 73, status: "soon" },
  { code: "ZA", name: "Afrique du Sud", flag: "🇿🇦", currency: "ZAR", languages: ["Anglais"], cities: SOUTH_AFRICA_CITIES, priority: 74, status: "soon" },
  { code: "ZM", name: "Zambie", flag: "🇿🇲", currency: "ZMW", languages: ["Anglais"], cities: ZAMBIA_CITIES, priority: 75, status: "soon" },
  { code: "ZW", name: "Zimbabwe", flag: "🇿🇼", currency: "ZWL", languages: ["Anglais"], cities: ZIMBABWE_CITIES, priority: 76, status: "soon" },
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
