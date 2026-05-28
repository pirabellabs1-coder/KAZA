// =============================================================================
// KAZA - Marketing Data (landing premium)
// Données de référence pour la landing : stats, témoignages, villes, partenaires
// =============================================================================

export interface PlatformStat {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  description?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatarSeed: string;
  rating: number;
  quote: string;
  city: string;
  highlight?: string;
}

export interface City {
  slug: string;
  name: string;
  country: string;
  imageUrl: string;
  propertiesCount: number;
  averagePrice: number;
  description: string;
  neighborhoods: string[];
}

export interface Partner {
  name: string;
  category: "paiement" | "tech" | "presse" | "institution";
  logoLetters: string;
  brandColor: string;
  url?: string;
}

export interface FeatureHighlight {
  icon: string;
  title: string;
  description: string;
  metric?: string;
}

export interface BlogPreview {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readingTime: number;
  publishedAt: string;
  imageUrl: string;
}

export interface PressLogo {
  name: string;
  letters: string;
  color: string;
}

// =============================================================================
// PLATFORM_STATS — Chiffres clés affichés en hero / bandeau social proof
// =============================================================================

export const PLATFORM_STATS: PlatformStat[] = [
  {
    value: 12500,
    suffix: "+",
    label: "Annonces vérifiées",
    description: "Chaque bien est contrôlé par notre équipe terrain",
  },
  {
    value: 8,
    label: "Villes couvertes",
    description: "Du littoral à l'Atacora, partout au Bénin",
  },
  {
    value: 4.8,
    suffix: "/5",
    label: "Satisfaction utilisateurs",
    description: "Note moyenne sur plus de 6 200 avis",
  },
  {
    value: 2.4,
    suffix: "+",
    label: "biens vérifiés",
    description: "Via escrow KAZA Pay depuis 2024",
  },
];

// =============================================================================
// TESTIMONIALS — Voix utilisateurs (locataires, propriétaires, étudiants)
// =============================================================================

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "t-aminata-cotonou",
    name: "Aminata Dossou",
    role: "Locataire à Cotonou",
    avatarSeed: "Aminata+Dossou",
    rating: 5,
    quote:
      "J'ai trouvé mon appartement à Fidjrossè en trois jours. La visite virtuelle m'a évité deux déplacements inutiles, et le paiement de la caution via KAZA Pay était simple et rassurant.",
    city: "Cotonou",
    highlight: "Trouvé en 3 jours",
  },
  {
    id: "t-koffi-portonovo",
    name: "Koffi Adjovi",
    role: "Propriétaire à Porto-Novo",
    avatarSeed: "Koffi+Adjovi",
    rating: 5,
    quote:
      "En tant que bailleur, je galérais à filtrer les candidats. Avec KAZA, je reçois des dossiers complets et vérifiés. Mon studio à Hindé est resté vacant moins d'une semaine.",
    city: "Porto-Novo",
    highlight: "Vacance < 7 jours",
  },
  {
    id: "t-fatima-calavi",
    name: "Fatima Boukari",
    role: "Étudiante à Abomey-Calavi",
    avatarSeed: "Fatima+Boukari",
    rating: 5,
    quote:
      "La colocation que j'ai trouvée près de l'UAC est parfaite. Le système de matching avec d'autres étudiants m'a permis de tomber sur des colocataires sérieuses et sympas.",
    city: "Abomey-Calavi",
    highlight: "Matching colocation",
  },
  {
    id: "t-sebastien-cotonou",
    name: "Sébastien Houngbédji",
    role: "Locataire à Cotonou",
    avatarSeed: "Sebastien+Houngbedji",
    rating: 4,
    quote:
      "L'escrow m'a vraiment rassuré pour ma première location. Mon argent n'est libéré qu'après l'état des lieux. C'est une vraie révolution pour le marché béninois.",
    city: "Cotonou",
    highlight: "Escrow sécurisé",
  },
  {
    id: "t-mariam-parakou",
    name: "Mariam Issaka",
    role: "Propriétaire à Parakou",
    avatarSeed: "Mariam+Issaka",
    rating: 5,
    quote:
      "Depuis Parakou, gérer mes trois logements à distance était un casse-tête. La messagerie temps réel et les contrats numériques de KAZA me font gagner des heures chaque semaine.",
    city: "Parakou",
    highlight: "Gestion à distance",
  },
  {
    id: "t-yves-calavi",
    name: "Yves Akakpo",
    role: "Étudiant à Abomey-Calavi",
    avatarSeed: "Yves+Akakpo",
    rating: 5,
    quote:
      "Premier loyer, premier bail, et tout s'est fait depuis mon téléphone. Le partage des charges avec mes colocs est automatique, plus de disputes en fin de mois.",
    city: "Abomey-Calavi",
    highlight: "Charges partagées auto",
  },
  {
    id: "t-josephine-portonovo",
    name: "Joséphine Ahouangonou",
    role: "Locataire à Porto-Novo",
    avatarSeed: "Josephine+Ahouangonou",
    rating: 4,
    quote:
      "La carte interactive et les filtres par quartier m'ont permis de cibler exactement ce que je cherchais à Tokpota. L'équipe support a répondu en moins d'une heure à mes questions.",
    city: "Porto-Novo",
    highlight: "Support réactif",
  },
  {
    id: "t-emmanuel-cotonou",
    name: "Emmanuel Tchégnon",
    role: "Propriétaire à Cotonou",
    avatarSeed: "Emmanuel+Tchegnon",
    rating: 5,
    quote:
      "Les annonces vérifiées, c'est un vrai plus. Les locataires arrivent en visite confiants, et la signature électronique du bail nous évite les allers-retours chez le notaire.",
    city: "Cotonou",
    highlight: "Signature électronique",
  },
];

// =============================================================================
// CITIES — Villes couvertes au Bénin avec données marché
// =============================================================================

export const CITIES: City[] = [
  {
    slug: "cotonou",
    name: "Cotonou",
    country: "Bénin",
    imageUrl:
      "https://images.unsplash.com/photo-1568454537842-d933259bb258?auto=format&fit=crop&w=800&q=80",
    propertiesCount: 3500,
    averagePrice: 180000,
    description:
      "Capitale économique du Bénin, cœur d'affaires et bord de mer atlantique.",
    neighborhoods: [
      "Fidjrossè",
      "Cadjèhoun",
      "Akpakpa",
      "Cocotiers",
      "Haie Vive",
      "Gbégamey",
    ],
  },
  {
    slug: "porto-novo",
    name: "Porto-Novo",
    country: "Bénin",
    imageUrl:
      "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=800&q=80",
    propertiesCount: 1850,
    averagePrice: 110000,
    description:
      "Capitale politique au charme colonial, à 30 minutes de Cotonou.",
    neighborhoods: ["Hindé", "Tokpota", "Ouando", "Djègan-Daho", "Houinmè"],
  },
  {
    slug: "abomey-calavi",
    name: "Abomey-Calavi",
    country: "Bénin",
    imageUrl:
      "https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=800&q=80",
    propertiesCount: 2200,
    averagePrice: 95000,
    description:
      "Ville étudiante par excellence, abrite la plus grande université du pays.",
    neighborhoods: [
      "Godomey",
      "Akassato",
      "Tankpè",
      "Zogbadjè",
      "Womey",
      "Kpota",
    ],
  },
  {
    slug: "parakou",
    name: "Parakou",
    country: "Bénin",
    imageUrl:
      "https://images.unsplash.com/photo-1604357209793-fca5dca89f97?auto=format&fit=crop&w=800&q=80",
    propertiesCount: 920,
    averagePrice: 75000,
    description:
      "Carrefour du Nord, capitale économique du Borgou et plaque tournante régionale.",
    neighborhoods: ["Titirou", "Banikanni", "Ladjifarani", "Zongo", "Albarika"],
  },
  {
    slug: "bohicon",
    name: "Bohicon",
    country: "Bénin",
    imageUrl:
      "https://images.unsplash.com/photo-1591800532321-46c1d57f2b25?auto=format&fit=crop&w=800&q=80",
    propertiesCount: 540,
    averagePrice: 65000,
    description:
      "Nœud routier stratégique entre le sud et le centre, proche d'Abomey.",
    neighborhoods: ["Lissèzoun", "Sokpon", "Agbangnizoun", "Ouassaho"],
  },
  {
    slug: "natitingou",
    name: "Natitingou",
    country: "Bénin",
    imageUrl:
      "https://images.unsplash.com/photo-1517059224940-d4af9eec41b7?auto=format&fit=crop&w=800&q=80",
    propertiesCount: 280,
    averagePrice: 55000,
    description:
      "Porte de l'Atacora, ville de montagnes et tourisme dans le nord-ouest.",
    neighborhoods: ["Yimporima", "Kantaborifa", "Bèrècingou", "Péporiyakou"],
  },
];

// =============================================================================
// PARTNERS — Écosystème paiement et tech qui propulse KAZA
// =============================================================================

export const PARTNERS: Partner[] = [
  {
    name: "KAZA Pay",
    category: "paiement",
    logoLetters: "FP",
    brandColor: "#00B6FF",
    url: "https://KAZA Pay.com",
  },
  {
    name: "KAZA Wallet",
    category: "paiement",
    logoLetters: "KK",
    brandColor: "#FFB800",
    url: "https://KAZA Wallet.me",
  },
  {
    name: "KAZA Pay",
    category: "paiement",
    logoLetters: "KAZA Pay",
    brandColor: "#FFC600",
    url: "https://KAZA Pay.bj",
  },
  {
    name: "KAZA Wallet",
    category: "paiement",
    logoLetters: "MOV",
    brandColor: "#1A1A1A",
    url: "https://KAZA Wallet-africa.bj",
  },
  {
    name: "Supabase",
    category: "tech",
    logoLetters: "SB",
    brandColor: "#3ECF8E",
    url: "https://supabase.com",
  },
  {
    name: "Vercel",
    category: "tech",
    logoLetters: "V",
    brandColor: "#000000",
    url: "https://vercel.com",
  },
  {
    name: "Twilio",
    category: "tech",
    logoLetters: "TW",
    brandColor: "#F22F46",
    url: "https://twilio.com",
  },
  {
    name: "Resend",
    category: "tech",
    logoLetters: "RS",
    brandColor: "#000000",
    url: "https://resend.com",
  },
];

// =============================================================================
// FEATURES — Bénéfices clés mis en avant sur la landing
// =============================================================================

export const FEATURES: FeatureHighlight[] = [
  {
    icon: "ShieldCheck",
    title: "Identités vérifiées",
    description:
      "Chaque compte est validé par pièce d'identité et numéro de téléphone. Fini les arnaques au faux propriétaire.",
    metric: "100% des comptes vérifiés",
  },
  {
    icon: "Wallet",
    title: "Paiements sécurisés",
    description:
      "paiement intégré intégré (KAZA Pay, KAZA Wallet) et système d'escrow : votre argent n'est libéré qu'après l'état des lieux.",
    metric: "Escrow paiement intégré",
  },
  {
    icon: "FileSignature",
    title: "Contrats numériques",
    description:
      "Bail conforme au droit béninois, signé électroniquement en quelques minutes. PDF archivé et opposable.",
    metric: "Signature électronique légale",
  },
  {
    icon: "MessagesSquare",
    title: "Messagerie temps réel",
    description:
      "Échangez directement avec propriétaires ou candidats locataires, sans donner votre numéro personnel.",
    metric: "Réponse moyenne < 2h",
  },
  {
    icon: "Star",
    title: "Avis vérifiés",
    description:
      "Seuls les utilisateurs ayant réellement loué peuvent laisser un avis. Une transparence totale sur les biens.",
    metric: "6 200+ avis authentiques",
  },
  {
    icon: "MapPin",
    title: "Géolocalisation précise",
    description:
      "Recherche par quartier, points d'intérêt à proximité (écoles, marchés, stations) et itinéraires intégrés.",
    metric: "8 villes cartographiées",
  },
];

// =============================================================================
// BLOG_PREVIEWS — Aperçu d'articles pour la section conseils
// =============================================================================

export const BLOG_PREVIEWS: BlogPreview[] = [
  {
    slug: "reussir-premiere-location-cotonou",
    title: "Comment réussir votre première location à Cotonou",
    excerpt:
      "Budget, documents, quartiers à privilégier : tout ce qu'il faut savoir avant de signer son premier bail dans la capitale économique.",
    category: "Guide",
    readingTime: 6,
    publishedAt: "2026-04-12T09:00:00.000Z",
    imageUrl:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80",
  },
  {
    slug: "etudiants-colocation-calavi-quartiers",
    title: "Étudiants : 5 quartiers idéaux pour la colocation à Calavi",
    excerpt:
      "De Godomey à Zogbadjè, notre sélection des meilleurs spots pour partager un loyer sans sacrifier la proximité avec l'UAC.",
    category: "Étudiant",
    readingTime: 4,
    publishedAt: "2026-04-28T10:30:00.000Z",
    imageUrl:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80",
  },
  {
    slug: "kaza-pay-vs-virement-guide",
    title: "paiement intégré vs virement bancaire : le guide complet",
    excerpt:
      "Frais, délais, plafonds, sécurité : on compare les deux modes de paiement les plus utilisés pour régler son loyer au Bénin.",
    category: "Paiements",
    readingTime: 8,
    publishedAt: "2026-05-05T08:15:00.000Z",
    imageUrl:
      "https://images.unsplash.com/photo-1556742400-b5b7c5121f9c?auto=format&fit=crop&w=800&q=80",
  },
  {
    slug: "nouvelles-regles-bail-benin-2026",
    title: "Les nouvelles règles du bail au Bénin en 2026",
    excerpt:
      "Caution plafonnée, état des lieux obligatoire, durée minimale : décryptage de la réforme qui change la vie des locataires.",
    category: "Légal",
    readingTime: 7,
    publishedAt: "2026-05-18T14:45:00.000Z",
    imageUrl:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=800&q=80",
  },
];

// =============================================================================
// PRESS — Médias qui ont parlé de KAZA
// =============================================================================

export const PRESS: PressLogo[] = [
  { name: "Jeune Afrique", letters: "JA", color: "#D81B23" },
  { name: "RFI Afrique", letters: "RFI", color: "#E50007" },
  { name: "BBC Afrique", letters: "BBC", color: "#990000" },
  { name: "TV5 Monde", letters: "TV5", color: "#FF6E00" },
  { name: "La Nation Bénin", letters: "LN", color: "#003B7A" },
];
