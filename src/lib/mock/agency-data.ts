// =============================================================================
// KAZA — Données mockées partagées de l'espace AGENCE
// Pas de Supabase pour ces pages : démo riche en attendant le branchement réel.
// =============================================================================

export const AGENCY_PROFILE = {
  name: "Premier Immobilier",
  legalName: "Premier Immobilier SARL",
  city: "Cotonou",
  address: "Lot 1247, Rue 2.012, Quartier Cadjèhoun, Cotonou",
  phone: "+229 21 30 45 67",
  email: "contact@premier-immobilier.bj",
  website: "https://premier-immobilier.bj",
  rccm: "RB/COT/2019/B/1842",
  ifu: "3201942000847",
  oapi: "BJ/OAPI/2020/118",
  memberSince: "2024-03-12",
  plan: "KAZA Pro Premium",
  planMonthlyFcfa: 145_000,
  description:
    "Agence indépendante créée en 2019. Spécialisée dans la location haut de gamme et la gestion locative à Cotonou, Calavi et Porto-Novo.",
  logoColor: "bg-kaza-navy",
  managerName: "Aïcha Toko",
  team: 8,
  managedProperties: 147,
};

export type AgentRole =
  | "Directrice"
  | "Manager"
  | "Agent senior"
  | "Agent"
  | "Stagiaire"
  | "Comptable"
  | "Gestionnaire";

export interface AgentMember {
  id: string;
  name: string;
  role: AgentRole;
  email: string;
  phone: string;
  initials: string;
  color: string;
  hiredAt: string;
  status: "active" | "leave" | "invited";
  propertiesAssigned: number;
  visitsThisMonth: number;
  signaturesYTD: number;
  caGeneratedFcfa: number;
  rating: number;
  permissions: string[];
}

export const AGENCY_TEAM: AgentMember[] = [
  {
    id: "a-001",
    name: "Aïcha Toko",
    role: "Directrice",
    email: "aicha@premier-immobilier.bj",
    phone: "+229 97 11 22 33",
    initials: "AT",
    color: "bg-kaza-navy",
    hiredAt: "2019-04-01",
    status: "active",
    propertiesAssigned: 24,
    visitsThisMonth: 32,
    signaturesYTD: 41,
    caGeneratedFcfa: 18_400_000,
    rating: 4.9,
    permissions: ["admin", "billing", "team", "analytics", "properties"],
  },
  {
    id: "a-002",
    name: "Komi Agbeko",
    role: "Agent senior",
    email: "komi@premier-immobilier.bj",
    phone: "+229 96 44 55 66",
    initials: "KA",
    color: "bg-kaza-blue",
    hiredAt: "2020-09-10",
    status: "active",
    propertiesAssigned: 32,
    visitsThisMonth: 58,
    signaturesYTD: 67,
    caGeneratedFcfa: 24_200_000,
    rating: 4.8,
    permissions: ["properties", "visits", "tenants"],
  },
  {
    id: "a-003",
    name: "Sandra Mensah",
    role: "Agent",
    email: "sandra@premier-immobilier.bj",
    phone: "+229 95 77 88 99",
    initials: "SM",
    color: "bg-kaza-green",
    hiredAt: "2022-01-15",
    status: "active",
    propertiesAssigned: 21,
    visitsThisMonth: 41,
    signaturesYTD: 38,
    caGeneratedFcfa: 14_100_000,
    rating: 4.7,
    permissions: ["properties", "visits"],
  },
  {
    id: "a-004",
    name: "Olivier Houngbo",
    role: "Agent",
    email: "olivier@premier-immobilier.bj",
    phone: "+229 94 12 34 56",
    initials: "OH",
    color: "bg-amber-500",
    hiredAt: "2022-06-20",
    status: "active",
    propertiesAssigned: 19,
    visitsThisMonth: 35,
    signaturesYTD: 29,
    caGeneratedFcfa: 11_750_000,
    rating: 4.6,
    permissions: ["properties", "visits"],
  },
  {
    id: "a-005",
    name: "Yacine Sow",
    role: "Gestionnaire",
    email: "yacine@premier-immobilier.bj",
    phone: "+229 99 22 11 00",
    initials: "YS",
    color: "bg-purple-500",
    hiredAt: "2021-03-08",
    status: "active",
    propertiesAssigned: 27,
    visitsThisMonth: 12,
    signaturesYTD: 22,
    caGeneratedFcfa: 9_800_000,
    rating: 4.5,
    permissions: ["properties", "tenants", "contracts"],
  },
  {
    id: "a-006",
    name: "Mariam Tossou",
    role: "Agent",
    email: "mariam@premier-immobilier.bj",
    phone: "+229 98 65 43 21",
    initials: "MT",
    color: "bg-rose-500",
    hiredAt: "2023-11-02",
    status: "active",
    propertiesAssigned: 14,
    visitsThisMonth: 27,
    signaturesYTD: 14,
    caGeneratedFcfa: 5_200_000,
    rating: 4.4,
    permissions: ["properties", "visits"],
  },
  {
    id: "a-007",
    name: "Léa Adjovi",
    role: "Stagiaire",
    email: "lea@premier-immobilier.bj",
    phone: "+229 97 88 99 11",
    initials: "LA",
    color: "bg-cyan-600",
    hiredAt: "2026-02-01",
    status: "active",
    propertiesAssigned: 6,
    visitsThisMonth: 9,
    signaturesYTD: 3,
    caGeneratedFcfa: 1_100_000,
    rating: 4.2,
    permissions: ["visits"],
  },
  {
    id: "a-008",
    name: "Pierre Kpondéhou",
    role: "Comptable",
    email: "pierre@premier-immobilier.bj",
    phone: "+229 96 77 44 22",
    initials: "PK",
    color: "bg-emerald-600",
    hiredAt: "2020-01-12",
    status: "active",
    propertiesAssigned: 0,
    visitsThisMonth: 0,
    signaturesYTD: 0,
    caGeneratedFcfa: 0,
    rating: 4.8,
    permissions: ["billing", "analytics"],
  },
];

// ---------------------------------------------------------------------------
// PORTFOLIO — Biens gérés par l'agence
// ---------------------------------------------------------------------------

export type PropertyStatus = "AVAILABLE" | "RESERVED" | "RENTED" | "OFF_MARKET";
export type PropertyType = "APPARTEMENT" | "MAISON" | "VILLA" | "STUDIO" | "BUREAU";

export interface AgencyProperty {
  id: string;
  title: string;
  type: PropertyType;
  city: string;
  neighborhood: string;
  bedrooms: number;
  bathrooms: number;
  surface: number;
  priceMonthlyFcfa: number;
  status: PropertyStatus;
  agentId: string;
  publishedAt: string;
  views: number;
  contacts: number;
  visits: number;
  rating: number;
  photo: string;
  premium: boolean;
}

export const AGENCY_PROPERTIES: AgencyProperty[] = [
  {
    id: "p-001",
    title: "Villa 5 ch. piscine, Haie Vive",
    type: "VILLA",
    city: "Cotonou",
    neighborhood: "Haie Vive",
    bedrooms: 5,
    bathrooms: 4,
    surface: 320,
    priceMonthlyFcfa: 1_250_000,
    status: "AVAILABLE",
    agentId: "a-001",
    publishedAt: "2026-04-12",
    views: 4_215,
    contacts: 87,
    visits: 32,
    rating: 4.9,
    photo: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&q=80",
    premium: true,
  },
  {
    id: "p-002",
    title: "Appartement T4 Cadjèhoun",
    type: "APPARTEMENT",
    city: "Cotonou",
    neighborhood: "Cadjèhoun",
    bedrooms: 3,
    bathrooms: 2,
    surface: 145,
    priceMonthlyFcfa: 425_000,
    status: "RENTED",
    agentId: "a-002",
    publishedAt: "2026-01-08",
    views: 2_840,
    contacts: 62,
    visits: 18,
    rating: 4.7,
    photo: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&q=80",
    premium: true,
  },
  {
    id: "p-003",
    title: "Maison 4 ch. avec jardin, Calavi",
    type: "MAISON",
    city: "Calavi",
    neighborhood: "Akassato",
    bedrooms: 4,
    bathrooms: 3,
    surface: 240,
    priceMonthlyFcfa: 380_000,
    status: "AVAILABLE",
    agentId: "a-003",
    publishedAt: "2026-03-22",
    views: 1_956,
    contacts: 48,
    visits: 22,
    rating: 4.6,
    photo: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&q=80",
    premium: false,
  },
  {
    id: "p-004",
    title: "Studio meublé centre-ville",
    type: "STUDIO",
    city: "Cotonou",
    neighborhood: "Ganhi",
    bedrooms: 1,
    bathrooms: 1,
    surface: 35,
    priceMonthlyFcfa: 165_000,
    status: "AVAILABLE",
    agentId: "a-004",
    publishedAt: "2026-05-02",
    views: 3_120,
    contacts: 71,
    visits: 19,
    rating: 4.5,
    photo: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=80",
    premium: false,
  },
  {
    id: "p-005",
    title: "Villa moderne Fidjrossè",
    type: "VILLA",
    city: "Cotonou",
    neighborhood: "Fidjrossè",
    bedrooms: 6,
    bathrooms: 5,
    surface: 410,
    priceMonthlyFcfa: 1_650_000,
    status: "RESERVED",
    agentId: "a-001",
    publishedAt: "2026-02-18",
    views: 2_705,
    contacts: 41,
    visits: 14,
    rating: 4.8,
    photo: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80",
    premium: true,
  },
  {
    id: "p-006",
    title: "T3 vue mer Cocotiers",
    type: "APPARTEMENT",
    city: "Cotonou",
    neighborhood: "Les Cocotiers",
    bedrooms: 2,
    bathrooms: 2,
    surface: 110,
    priceMonthlyFcfa: 520_000,
    status: "AVAILABLE",
    agentId: "a-002",
    publishedAt: "2026-04-28",
    views: 2_215,
    contacts: 55,
    visits: 21,
    rating: 4.7,
    photo: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&q=80",
    premium: true,
  },
  {
    id: "p-007",
    title: "Bureau 80m² Ganhi",
    type: "BUREAU",
    city: "Cotonou",
    neighborhood: "Ganhi",
    bedrooms: 0,
    bathrooms: 1,
    surface: 80,
    priceMonthlyFcfa: 290_000,
    status: "AVAILABLE",
    agentId: "a-005",
    publishedAt: "2026-03-15",
    views: 845,
    contacts: 22,
    visits: 7,
    rating: 4.4,
    photo: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80",
    premium: false,
  },
  {
    id: "p-008",
    title: "Maison F3 Akpakpa",
    type: "MAISON",
    city: "Cotonou",
    neighborhood: "Akpakpa",
    bedrooms: 3,
    bathrooms: 2,
    surface: 130,
    priceMonthlyFcfa: 220_000,
    status: "RENTED",
    agentId: "a-006",
    publishedAt: "2026-01-25",
    views: 1_410,
    contacts: 38,
    visits: 15,
    rating: 4.5,
    photo: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=400&q=80",
    premium: false,
  },
  {
    id: "p-009",
    title: "Villa familiale Porto-Novo",
    type: "VILLA",
    city: "Porto-Novo",
    neighborhood: "Houinmey",
    bedrooms: 5,
    bathrooms: 4,
    surface: 280,
    priceMonthlyFcfa: 680_000,
    status: "AVAILABLE",
    agentId: "a-003",
    publishedAt: "2026-04-03",
    views: 1_220,
    contacts: 31,
    visits: 11,
    rating: 4.6,
    photo: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&q=80",
    premium: false,
  },
  {
    id: "p-010",
    title: "Loft design Haie Vive",
    type: "APPARTEMENT",
    city: "Cotonou",
    neighborhood: "Haie Vive",
    bedrooms: 2,
    bathrooms: 2,
    surface: 95,
    priceMonthlyFcfa: 580_000,
    status: "RESERVED",
    agentId: "a-002",
    publishedAt: "2026-04-22",
    views: 3_645,
    contacts: 82,
    visits: 28,
    rating: 4.9,
    photo: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80",
    premium: true,
  },
  {
    id: "p-011",
    title: "Appartement T2 économique",
    type: "APPARTEMENT",
    city: "Calavi",
    neighborhood: "Godomey",
    bedrooms: 1,
    bathrooms: 1,
    surface: 55,
    priceMonthlyFcfa: 135_000,
    status: "AVAILABLE",
    agentId: "a-006",
    publishedAt: "2026-05-10",
    views: 1_088,
    contacts: 29,
    visits: 12,
    rating: 4.3,
    photo: "https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=400&q=80",
    premium: false,
  },
  {
    id: "p-012",
    title: "Villa avec terrasse Agla",
    type: "VILLA",
    city: "Cotonou",
    neighborhood: "Agla",
    bedrooms: 4,
    bathrooms: 3,
    surface: 220,
    priceMonthlyFcfa: 780_000,
    status: "OFF_MARKET",
    agentId: "a-004",
    publishedAt: "2026-02-08",
    views: 985,
    contacts: 18,
    visits: 6,
    rating: 4.4,
    photo: "https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=400&q=80",
    premium: false,
  },
];

// ---------------------------------------------------------------------------
// LEADS — CRM-lite : prospects entrants
// ---------------------------------------------------------------------------

export type LeadStage =
  | "NEW"
  | "CONTACTED"
  | "QUALIFIED"
  | "VISIT_SCHEDULED"
  | "OFFER"
  | "WON"
  | "LOST";

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: "Site KAZA" | "Réseaux sociaux" | "Bouche-à-oreille" | "Pub Google" | "Évènement";
  budgetFcfa: number;
  propertyInterestId?: string;
  stage: LeadStage;
  assignedAgentId: string;
  createdAt: string;
  lastActivityAt: string;
  notes: string;
  score: number;
}

export const AGENCY_LEADS: Lead[] = [
  {
    id: "l-001",
    name: "Fatou Diop",
    email: "fatou.diop@gmail.com",
    phone: "+229 97 33 44 55",
    source: "Site KAZA",
    budgetFcfa: 450_000,
    propertyInterestId: "p-002",
    stage: "VISIT_SCHEDULED",
    assignedAgentId: "a-002",
    createdAt: "2026-05-18",
    lastActivityAt: "2026-05-25",
    notes: "Cherche T4 pour famille de 4. Visite prévue samedi 30 mai à 10h.",
    score: 92,
  },
  {
    id: "l-002",
    name: "Sébastien Mahougnon",
    email: "seb.mahougnon@yahoo.fr",
    phone: "+229 96 11 22 88",
    source: "Réseaux sociaux",
    budgetFcfa: 1_200_000,
    propertyInterestId: "p-001",
    stage: "OFFER",
    assignedAgentId: "a-001",
    createdAt: "2026-05-12",
    lastActivityAt: "2026-05-26",
    notes: "Cadre expatrié, offre à 1.15M négociation en cours.",
    score: 88,
  },
  {
    id: "l-003",
    name: "Awa Bessan",
    email: "awa.bessan@hotmail.com",
    phone: "+229 95 67 89 12",
    source: "Pub Google",
    budgetFcfa: 180_000,
    stage: "QUALIFIED",
    assignedAgentId: "a-006",
    createdAt: "2026-05-22",
    lastActivityAt: "2026-05-24",
    notes: "Étudiante. Cherche studio meublé proximité UAC.",
    score: 64,
  },
  {
    id: "l-004",
    name: "Komla Ayessou",
    email: "komla.a@orange.bj",
    phone: "+229 99 44 55 77",
    source: "Bouche-à-oreille",
    budgetFcfa: 350_000,
    propertyInterestId: "p-003",
    stage: "CONTACTED",
    assignedAgentId: "a-003",
    createdAt: "2026-05-24",
    lastActivityAt: "2026-05-25",
    notes: "Premier appel ok, attend visite samedi.",
    score: 71,
  },
  {
    id: "l-005",
    name: "Christelle Adjovi",
    email: "c.adjovi@gmail.com",
    phone: "+229 97 22 11 33",
    source: "Site KAZA",
    budgetFcfa: 600_000,
    propertyInterestId: "p-006",
    stage: "WON",
    assignedAgentId: "a-002",
    createdAt: "2026-04-28",
    lastActivityAt: "2026-05-20",
    notes: "Contrat signé le 20 mai. CA réalisé 520k.",
    score: 100,
  },
  {
    id: "l-006",
    name: "Marc-Aurèle Sossou",
    email: "marc.sossou@yahoo.fr",
    phone: "+229 96 88 99 00",
    source: "Site KAZA",
    budgetFcfa: 250_000,
    stage: "NEW",
    assignedAgentId: "a-006",
    createdAt: "2026-05-26",
    lastActivityAt: "2026-05-26",
    notes: "Demande info via formulaire, pas encore contacté.",
    score: 45,
  },
  {
    id: "l-007",
    name: "Maïmouna Bio",
    email: "maimouna.bio@gmail.com",
    phone: "+229 95 44 88 22",
    source: "Évènement",
    budgetFcfa: 800_000,
    propertyInterestId: "p-005",
    stage: "LOST",
    assignedAgentId: "a-001",
    createdAt: "2026-04-15",
    lastActivityAt: "2026-05-08",
    notes: "Choix concurrent. À recontacter dans 6 mois.",
    score: 0,
  },
  {
    id: "l-008",
    name: "Jules Codjia",
    email: "jules.c@protonmail.com",
    phone: "+229 99 88 77 66",
    source: "Pub Google",
    budgetFcfa: 280_000,
    propertyInterestId: "p-011",
    stage: "VISIT_SCHEDULED",
    assignedAgentId: "a-006",
    createdAt: "2026-05-19",
    lastActivityAt: "2026-05-25",
    notes: "Visite 28 mai 15h. Budget serré, négociation possible.",
    score: 78,
  },
];

// ---------------------------------------------------------------------------
// CALENDAR — Multi-agent
// ---------------------------------------------------------------------------

export type EventType = "VISIT" | "SIGNATURE" | "MEETING" | "INSPECTION";

export interface AgencyEvent {
  id: string;
  date: string;
  time: string;
  duration: number;
  type: EventType;
  title: string;
  agentId: string;
  propertyId?: string;
  contact: string;
  notes?: string;
}

export const AGENCY_CALENDAR: AgencyEvent[] = [
  {
    id: "e-001",
    date: "2026-05-27",
    time: "09:00",
    duration: 60,
    type: "VISIT",
    title: "Visite Villa Haie Vive",
    agentId: "a-001",
    propertyId: "p-001",
    contact: "Sébastien Mahougnon",
    notes: "Apporter le PDF de présentation premium",
  },
  {
    id: "e-002",
    date: "2026-05-27",
    time: "11:00",
    duration: 45,
    type: "VISIT",
    title: "T4 Cadjèhoun — Famille Diop",
    agentId: "a-002",
    propertyId: "p-002",
    contact: "Fatou Diop",
  },
  {
    id: "e-003",
    date: "2026-05-27",
    time: "14:30",
    duration: 30,
    type: "SIGNATURE",
    title: "Signature bail Loft Haie Vive",
    agentId: "a-002",
    propertyId: "p-010",
    contact: "M. & Mme Akpovi",
  },
  {
    id: "e-004",
    date: "2026-05-28",
    time: "10:00",
    duration: 60,
    type: "VISIT",
    title: "Maison Calavi",
    agentId: "a-003",
    propertyId: "p-003",
    contact: "Komla Ayessou",
  },
  {
    id: "e-005",
    date: "2026-05-28",
    time: "15:00",
    duration: 45,
    type: "VISIT",
    title: "Studio centre-ville",
    agentId: "a-004",
    propertyId: "p-004",
    contact: "Awa Bessan",
  },
  {
    id: "e-006",
    date: "2026-05-29",
    time: "09:30",
    duration: 90,
    type: "MEETING",
    title: "Réunion hebdomadaire équipe",
    agentId: "a-001",
    contact: "Toute l'équipe",
    notes: "Salle de réunion principale",
  },
  {
    id: "e-007",
    date: "2026-05-29",
    time: "14:00",
    duration: 60,
    type: "INSPECTION",
    title: "État des lieux sortie — Akpakpa",
    agentId: "a-005",
    propertyId: "p-008",
    contact: "M. Tossou",
  },
  {
    id: "e-008",
    date: "2026-05-30",
    time: "10:00",
    duration: 60,
    type: "VISIT",
    title: "T4 Cadjèhoun (suite)",
    agentId: "a-002",
    propertyId: "p-002",
    contact: "Fatou Diop",
  },
  {
    id: "e-009",
    date: "2026-05-30",
    time: "11:30",
    duration: 45,
    type: "VISIT",
    title: "Studio Godomey",
    agentId: "a-006",
    propertyId: "p-011",
    contact: "Jules Codjia",
  },
  {
    id: "e-010",
    date: "2026-05-31",
    time: "15:00",
    duration: 60,
    type: "SIGNATURE",
    title: "Bail Villa Fidjrossè",
    agentId: "a-001",
    propertyId: "p-005",
    contact: "Famille Vodounou",
  },
];

// ---------------------------------------------------------------------------
// FINANCIAL — Revenus mensuels et historique
// ---------------------------------------------------------------------------

export const MONTHLY_REVENUE = [
  { month: "Juin 25", value: 8_200, signatures: 4, visits: 142 },
  { month: "Juil. 25", value: 9_100, signatures: 5, visits: 168 },
  { month: "Août 25", value: 10_300, signatures: 6, visits: 195 },
  { month: "Sept. 25", value: 9_800, signatures: 5, visits: 184 },
  { month: "Oct. 25", value: 11_200, signatures: 7, visits: 211 },
  { month: "Nov. 25", value: 12_500, signatures: 8, visits: 232 },
  { month: "Déc. 25", value: 11_800, signatures: 7, visits: 218 },
  { month: "Janv. 26", value: 13_400, signatures: 9, visits: 248 },
  { month: "Févr. 26", value: 14_200, signatures: 10, visits: 261 },
  { month: "Mars 26", value: 15_100, signatures: 11, visits: 278 },
  { month: "Avr. 26", value: 15_900, signatures: 11, visits: 289 },
  { month: "Mai 26", value: 16_800, signatures: 12, visits: 304 },
];

export const CONVERSION_FUNNEL = [
  { label: "Vues annonces", value: 28_540, color: "#1A3A52" },
  { label: "Contacts entrants", value: 1_842, color: "#1976D2" },
  { label: "Visites planifiées", value: 528, color: "#4CAF50" },
  { label: "Offres reçues", value: 187, color: "#F59E0B" },
  { label: "Contrats signés", value: 84, color: "#10B981" },
];

export const OCCUPANCY_BY_TYPE = [
  { type: "Appartements", total: 42, rented: 31, color: "#1976D2" },
  { type: "Maisons", total: 35, rented: 27, color: "#4CAF50" },
  { type: "Villas", total: 28, rented: 19, color: "#1A3A52" },
  { type: "Studios", total: 31, rented: 23, color: "#F59E0B" },
  { type: "Bureaux", total: 11, rented: 8, color: "#8B5CF6" },
];

export const LEAD_SOURCES = [
  { source: "Site KAZA", count: 412, percentage: 48 },
  { source: "Réseaux sociaux", count: 198, percentage: 23 },
  { source: "Pub Google", count: 142, percentage: 16 },
  { source: "Bouche-à-oreille", count: 78, percentage: 9 },
  { source: "Évènement", count: 31, percentage: 4 },
];

// ---------------------------------------------------------------------------
// BILLING — Facturation et abonnement
// ---------------------------------------------------------------------------

export interface Invoice {
  id: string;
  number: string;
  date: string;
  amountFcfa: number;
  status: "PAID" | "PENDING" | "OVERDUE";
  description: string;
  paymentMethod: string;
}

export const AGENCY_INVOICES: Invoice[] = [
  {
    id: "inv-2026-05",
    number: "KAZA-2026-0578",
    date: "2026-05-01",
    amountFcfa: 145_000,
    status: "PAID",
    description: "Abonnement KAZA Pro Premium — Mai 2026",
    paymentMethod: "Virement bancaire",
  },
  {
    id: "inv-2026-04",
    number: "KAZA-2026-0461",
    date: "2026-04-01",
    amountFcfa: 145_000,
    status: "PAID",
    description: "Abonnement KAZA Pro Premium — Avril 2026",
    paymentMethod: "Carte bancaire",
  },
  {
    id: "inv-2026-03",
    number: "KAZA-2026-0344",
    date: "2026-03-01",
    amountFcfa: 145_000,
    status: "PAID",
    description: "Abonnement KAZA Pro Premium — Mars 2026",
    paymentMethod: "Virement bancaire",
  },
  {
    id: "inv-2026-02",
    number: "KAZA-2026-0227",
    date: "2026-02-01",
    amountFcfa: 145_000,
    status: "PAID",
    description: "Abonnement KAZA Pro Premium — Février 2026",
    paymentMethod: "Carte bancaire",
  },
  {
    id: "inv-2026-01",
    number: "KAZA-2026-0110",
    date: "2026-01-01",
    amountFcfa: 145_000,
    status: "PAID",
    description: "Abonnement KAZA Pro Premium — Janvier 2026",
    paymentMethod: "Virement bancaire",
  },
  {
    id: "inv-extra-04",
    number: "KAZA-2026-0489",
    date: "2026-04-18",
    amountFcfa: 28_000,
    status: "PAID",
    description: "Boost annonce Villa Fidjrossè — 7 jours",
    paymentMethod: "Carte bancaire",
  },
];

export const AGENCY_PLAN = {
  name: "KAZA Pro Premium",
  monthlyFcfa: 145_000,
  yearlyFcfa: 1_450_000,
  nextBillingDate: "2026-06-01",
  paymentMethod: "Virement bancaire SGB",
  quota: {
    activeListings: { used: 147, max: 200 },
    teamMembers: { used: 8, max: 15 },
    boostsPerMonth: { used: 4, max: 10 },
    storageGB: { used: 12.4, max: 50 },
  },
  features: [
    "Jusqu'à 200 annonces actives",
    "15 membres d'équipe",
    "10 boosts annonce / mois inclus",
    "Page agence personnalisée",
    "Analytics avancées + export PDF",
    "Support prioritaire 7j/7",
    "API d'export",
    "Badge \"Agence vérifiée\"",
  ],
};

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

export const formatFcfa = (value: number): string =>
  `${new Intl.NumberFormat("fr-FR").format(value)} FCFA`;

export const formatFcfaShort = (value: number): string => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)} k`;
  return value.toString();
};

export const getAgentById = (id: string): AgentMember | undefined =>
  AGENCY_TEAM.find((a) => a.id === id);

export const getPropertyById = (id: string): AgencyProperty | undefined =>
  AGENCY_PROPERTIES.find((p) => p.id === id);

export const STATUS_LABELS: Record<PropertyStatus, string> = {
  AVAILABLE: "Disponible",
  RESERVED: "Réservé",
  RENTED: "Loué",
  OFF_MARKET: "Hors marché",
};

export const STATUS_COLORS: Record<PropertyStatus, string> = {
  AVAILABLE: "bg-emerald-100 text-emerald-700",
  RESERVED: "bg-amber-100 text-amber-700",
  RENTED: "bg-kaza-blue/10 text-kaza-blue",
  OFF_MARKET: "bg-muted text-muted-foreground",
};

export const STAGE_LABELS: Record<LeadStage, string> = {
  NEW: "Nouveau",
  CONTACTED: "Contacté",
  QUALIFIED: "Qualifié",
  VISIT_SCHEDULED: "Visite planifiée",
  OFFER: "Offre",
  WON: "Gagné",
  LOST: "Perdu",
};

export const STAGE_COLORS: Record<LeadStage, string> = {
  NEW: "bg-slate-100 text-slate-700",
  CONTACTED: "bg-blue-100 text-blue-700",
  QUALIFIED: "bg-indigo-100 text-indigo-700",
  VISIT_SCHEDULED: "bg-amber-100 text-amber-700",
  OFFER: "bg-orange-100 text-orange-700",
  WON: "bg-emerald-100 text-emerald-700",
  LOST: "bg-rose-100 text-rose-700",
};
