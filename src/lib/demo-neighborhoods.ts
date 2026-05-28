// =============================================================================
// KAZA - Données démo des quartiers du Bénin
// Vague 10 - Moussa Keïta
//
// Catalogue des principaux quartiers de Cotonou, Porto-Novo, Calavi et Parakou
// avec scores qualité de vie, prix de location moyens et équipements.
// Données mockées à des fins de démonstration du comparateur de quartiers.
// =============================================================================

export interface Neighborhood {
  slug: string;
  name: string;
  city: string;
  cityName: string;
  population: number;
  averagePrice: number; // FCFA loyer m² moyen
  scores: {
    safety: number; // 0-10
    schools: number; // 0-10
    transport: number; // 0-10
    healthcare: number; // 0-10
    nightlife: number; // 0-10
    family: number; // 0-10
    shopping: number; // 0-10
  };
  highlights: string[];
  concerns: string[];
  imageUrl: string;
  amenitiesCount: {
    schools: number;
    hospitals: number;
    markets: number;
    restaurants: number;
  };
}

export const NEIGHBORHOODS: Neighborhood[] = [
  // ============== COTONOU ==============
  {
    slug: "fidjrosse",
    name: "Fidjrossè",
    city: "cotonou",
    cityName: "Cotonou",
    population: 45_000,
    averagePrice: 2800,
    scores: {
      safety: 7,
      schools: 7,
      transport: 8,
      healthcare: 6,
      nightlife: 9,
      family: 7,
      shopping: 8,
    },
    highlights: [
      "Plage à 5 minutes",
      "Vie nocturne animée",
      "Restaurants et bars trendy",
      "Cadre balnéaire",
    ],
    concerns: ["Embouteillages en soirée", "Loyers en hausse rapide"],
    imageUrl: "https://picsum.photos/seed/kaza-nb-fidjrosse/800/600",
    amenitiesCount: { schools: 12, hospitals: 3, markets: 4, restaurants: 38 },
  },
  {
    slug: "cocotiers",
    name: "Les Cocotiers",
    city: "cotonou",
    cityName: "Cotonou",
    population: 22_000,
    averagePrice: 3500,
    scores: {
      safety: 9,
      schools: 8,
      transport: 7,
      healthcare: 8,
      nightlife: 5,
      family: 9,
      shopping: 7,
    },
    highlights: [
      "Quartier résidentiel haut de gamme",
      "Calme et sécurisé",
      "Écoles internationales",
      "Ambassades à proximité",
    ],
    concerns: ["Loyers élevés", "Peu d'animation en soirée"],
    imageUrl: "https://picsum.photos/seed/kaza-nb-cocotiers/800/600",
    amenitiesCount: { schools: 9, hospitals: 4, markets: 2, restaurants: 22 },
  },
  {
    slug: "akpakpa",
    name: "Akpakpa",
    city: "cotonou",
    cityName: "Cotonou",
    population: 95_000,
    averagePrice: 1800,
    scores: {
      safety: 5,
      schools: 6,
      transport: 9,
      healthcare: 5,
      nightlife: 6,
      family: 6,
      shopping: 8,
    },
    highlights: [
      "Marché Dantokpa à 10 minutes",
      "Bonne desserte transports",
      "Loyers abordables",
      "Pôle commercial dynamique",
    ],
    concerns: ["Densité urbaine forte", "Bruit et pollution", "Sécurité variable selon les rues"],
    imageUrl: "https://picsum.photos/seed/kaza-nb-akpakpa/800/600",
    amenitiesCount: { schools: 18, hospitals: 5, markets: 7, restaurants: 45 },
  },
  {
    slug: "cadjehoun",
    name: "Cadjèhoun",
    city: "cotonou",
    cityName: "Cotonou",
    population: 38_000,
    averagePrice: 3200,
    scores: {
      safety: 8,
      schools: 9,
      transport: 8,
      healthcare: 9,
      nightlife: 6,
      family: 9,
      shopping: 8,
    },
    highlights: [
      "Près de l'aéroport",
      "Cliniques privées de qualité",
      "Écoles renommées",
      "Quartier d'affaires",
    ],
    concerns: ["Bruit aérien occasionnel", "Trafic dense aux heures de pointe"],
    imageUrl: "https://picsum.photos/seed/kaza-nb-cadjehoun/800/600",
    amenitiesCount: { schools: 14, hospitals: 6, markets: 3, restaurants: 31 },
  },
  {
    slug: "haie-vive",
    name: "Haie Vive",
    city: "cotonou",
    cityName: "Cotonou",
    population: 18_000,
    averagePrice: 4000,
    scores: {
      safety: 9,
      schools: 8,
      transport: 7,
      healthcare: 8,
      nightlife: 7,
      family: 9,
      shopping: 8,
    },
    highlights: [
      "Quartier expatrié le plus prisé",
      "Restaurants gastronomiques",
      "Sécurité renforcée 24h/24",
      "Cadre verdoyant",
    ],
    concerns: ["Coût de la vie élevé", "Communauté très internationale"],
    imageUrl: "https://picsum.photos/seed/kaza-nb-haievive/800/600",
    amenitiesCount: { schools: 7, hospitals: 3, markets: 2, restaurants: 28 },
  },
  {
    slug: "ganhi",
    name: "Ganhi",
    city: "cotonou",
    cityName: "Cotonou",
    population: 30_000,
    averagePrice: 2600,
    scores: {
      safety: 7,
      schools: 7,
      transport: 9,
      healthcare: 7,
      nightlife: 7,
      family: 7,
      shopping: 9,
    },
    highlights: [
      "Hyper-centre administratif",
      "Banques et bureaux",
      "Excellente connexion réseau",
      "Centre commercial proche",
    ],
    concerns: ["Bruit urbain", "Stationnement difficile"],
    imageUrl: "https://picsum.photos/seed/kaza-nb-ganhi/800/600",
    amenitiesCount: { schools: 10, hospitals: 4, markets: 3, restaurants: 36 },
  },
  {
    slug: "godomey",
    name: "Godomey",
    city: "cotonou",
    cityName: "Cotonou",
    population: 120_000,
    averagePrice: 1500,
    scores: {
      safety: 6,
      schools: 6,
      transport: 7,
      healthcare: 5,
      nightlife: 5,
      family: 7,
      shopping: 6,
    },
    highlights: [
      "Loyers très abordables",
      "Périphérie en plein essor",
      "Accès rapide vers Calavi",
      "Espaces verts disponibles",
    ],
    concerns: ["Infrastructures en cours", "Inondations en saison des pluies"],
    imageUrl: "https://picsum.photos/seed/kaza-nb-godomey/800/600",
    amenitiesCount: { schools: 22, hospitals: 4, markets: 6, restaurants: 24 },
  },
  // ============== PORTO-NOVO ==============
  {
    slug: "porto-novo-centre",
    name: "Centre-ville",
    city: "porto-novo",
    cityName: "Porto-Novo",
    population: 55_000,
    averagePrice: 1700,
    scores: {
      safety: 8,
      schools: 8,
      transport: 6,
      healthcare: 7,
      nightlife: 4,
      family: 8,
      shopping: 7,
    },
    highlights: [
      "Capitale administrative",
      "Patrimoine historique",
      "Musées et culture",
      "Ambiance paisible",
    ],
    concerns: ["Vie nocturne limitée", "Transports moins fréquents"],
    imageUrl: "https://picsum.photos/seed/kaza-nb-portonovo/800/600",
    amenitiesCount: { schools: 16, hospitals: 4, markets: 5, restaurants: 18 },
  },
  {
    slug: "hinde",
    name: "Hindé",
    city: "porto-novo",
    cityName: "Porto-Novo",
    population: 28_000,
    averagePrice: 1400,
    scores: {
      safety: 7,
      schools: 6,
      transport: 6,
      healthcare: 6,
      nightlife: 5,
      family: 7,
      shopping: 6,
    },
    highlights: [
      "Quartier traditionnel",
      "Marché local animé",
      "Loyers très accessibles",
      "Communauté soudée",
    ],
    concerns: ["Routes en mauvais état", "Coupures d'eau ponctuelles"],
    imageUrl: "https://picsum.photos/seed/kaza-nb-hinde/800/600",
    amenitiesCount: { schools: 9, hospitals: 2, markets: 3, restaurants: 11 },
  },
  // ============== CALAVI ==============
  {
    slug: "calavi-campus",
    name: "Campus Abomey-Calavi",
    city: "calavi",
    cityName: "Calavi",
    population: 65_000,
    averagePrice: 1200,
    scores: {
      safety: 7,
      schools: 10,
      transport: 7,
      healthcare: 6,
      nightlife: 8,
      family: 5,
      shopping: 6,
    },
    highlights: [
      "Université d'Abomey-Calavi",
      "Vie étudiante animée",
      "Loyers étudiants très bas",
      "Colocations nombreuses",
    ],
    concerns: ["Affluence en période universitaire", "Cadre peu familial"],
    imageUrl: "https://picsum.photos/seed/kaza-nb-campus/800/600",
    amenitiesCount: { schools: 25, hospitals: 3, markets: 5, restaurants: 32 },
  },
  {
    slug: "zogbo",
    name: "Zogbo",
    city: "calavi",
    cityName: "Calavi",
    population: 42_000,
    averagePrice: 1300,
    scores: {
      safety: 6,
      schools: 7,
      transport: 6,
      healthcare: 5,
      nightlife: 5,
      family: 7,
      shopping: 6,
    },
    highlights: [
      "Quartier résidentiel calme",
      "Espaces verts",
      "Loyers modérés",
      "Communauté familiale",
    ],
    concerns: ["Éloignement du centre Cotonou", "Transports limités le soir"],
    imageUrl: "https://picsum.photos/seed/kaza-nb-zogbo/800/600",
    amenitiesCount: { schools: 11, hospitals: 2, markets: 4, restaurants: 14 },
  },
  // ============== PARAKOU ==============
  {
    slug: "parakou-centre",
    name: "Centre Parakou",
    city: "parakou",
    cityName: "Parakou",
    population: 75_000,
    averagePrice: 1100,
    scores: {
      safety: 8,
      schools: 7,
      transport: 6,
      healthcare: 7,
      nightlife: 6,
      family: 8,
      shopping: 7,
    },
    highlights: [
      "Capitale du Nord-Bénin",
      "Cadre de vie agréable",
      "Loyers très accessibles",
      "Climat sec et tempéré",
    ],
    concerns: ["Éloigné de Cotonou (400 km)", "Moins d'opportunités d'emploi"],
    imageUrl: "https://picsum.photos/seed/kaza-nb-parakou/800/600",
    amenitiesCount: { schools: 19, hospitals: 5, markets: 6, restaurants: 17 },
  },
];

export function getNeighborhoodBySlug(slug: string): Neighborhood | undefined {
  return NEIGHBORHOODS.find((n) => n.slug === slug);
}
