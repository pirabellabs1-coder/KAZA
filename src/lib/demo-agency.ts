// =============================================================================
// KAZA — Demo store : Agences immobilières (B2B Pro)
//
// Persistance localStorage minimaliste pour la démo de l'espace agence.
// SSR-safe : toutes les helpers retournent les seeds par défaut côté serveur.
// =============================================================================

export type AgencyPlan = "starter" | "pro" | "enterprise";
export type AgencyRole = "agent" | "manager" | "admin";
export type AgencyMemberStatus = "active" | "pending" | "disabled";

export interface AgencyMember {
  id: string;
  name: string;
  email: string;
  role: AgencyRole;
  status: AgencyMemberStatus;
  listingsManaged: number;
  avatarSeed: string;
  joinedAt: string; // ISO
}

export interface Agency {
  id: string;
  name: string;
  plan: AgencyPlan;
  city: string;
  createdAt: string;
  activeListings: number;
  monthlyVisits: number;
  monthlyRevenue: number; // FCFA
  avgRating: number;
  members: AgencyMember[];
}

const AGENCY_KEY = "kaza-agency";

// -----------------------------------------------------------------------------
// Seed : Premier Immobilier (Cotonou) + 8 membres
// -----------------------------------------------------------------------------

const now = Date.now();
const DAY = 24 * 60 * 60 * 1000;
const iso = (msAgo: number): string => new Date(now - msAgo).toISOString();

const SEED_MEMBERS: AgencyMember[] = [
  {
    id: "ag-mem-001",
    name: "Adjoa Mensah",
    email: "adjoa.mensah@premier-immo.bj",
    role: "admin",
    status: "active",
    listingsManaged: 42,
    avatarSeed: "Adjoa+Mensah",
    joinedAt: iso(420 * DAY),
  },
  {
    id: "ag-mem-002",
    name: "Boris Akpovi",
    email: "boris.akpovi@premier-immo.bj",
    role: "manager",
    status: "active",
    listingsManaged: 38,
    avatarSeed: "Boris+Akpovi",
    joinedAt: iso(360 * DAY),
  },
  {
    id: "ag-mem-003",
    name: "Clarisse Hounsou",
    email: "clarisse.hounsou@premier-immo.bj",
    role: "manager",
    status: "active",
    listingsManaged: 31,
    avatarSeed: "Clarisse+Hounsou",
    joinedAt: iso(300 * DAY),
  },
  {
    id: "ag-mem-004",
    name: "Dieudonné Quenum",
    email: "dieudonne.quenum@premier-immo.bj",
    role: "agent",
    status: "active",
    listingsManaged: 22,
    avatarSeed: "Dieudonne+Quenum",
    joinedAt: iso(240 * DAY),
  },
  {
    id: "ag-mem-005",
    name: "Esther Tognon",
    email: "esther.tognon@premier-immo.bj",
    role: "agent",
    status: "active",
    listingsManaged: 19,
    avatarSeed: "Esther+Tognon",
    joinedAt: iso(180 * DAY),
  },
  {
    id: "ag-mem-006",
    name: "Florent Bossou",
    email: "florent.bossou@premier-immo.bj",
    role: "agent",
    status: "active",
    listingsManaged: 17,
    avatarSeed: "Florent+Bossou",
    joinedAt: iso(150 * DAY),
  },
  {
    id: "ag-mem-007",
    name: "Géraldine Sossa",
    email: "geraldine.sossa@premier-immo.bj",
    role: "agent",
    status: "active",
    listingsManaged: 14,
    avatarSeed: "Geraldine+Sossa",
    joinedAt: iso(95 * DAY),
  },
  {
    id: "ag-mem-008",
    name: "Hervé Adékambi",
    email: "herve.adekambi@premier-immo.bj",
    role: "agent",
    status: "pending",
    listingsManaged: 0,
    avatarSeed: "Herve+Adekambi",
    joinedAt: iso(2 * DAY),
  },
];

export const SEED_AGENCY: Agency = {
  id: "ag-001",
  name: "Premier Immobilier",
  plan: "pro",
  city: "Cotonou",
  createdAt: iso(540 * DAY),
  activeListings: 183,
  monthlyVisits: 412,
  monthlyRevenue: 24_780_000,
  avgRating: 4.7,
  members: SEED_MEMBERS,
};

// -----------------------------------------------------------------------------
// Helpers SSR-safe
// -----------------------------------------------------------------------------

function isBrowser(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

export function getAgency(): Agency {
  if (!isBrowser()) return { ...SEED_AGENCY };
  try {
    const raw = window.localStorage.getItem(AGENCY_KEY);
    if (!raw) {
      window.localStorage.setItem(AGENCY_KEY, JSON.stringify(SEED_AGENCY));
      return { ...SEED_AGENCY };
    }
    const parsed = JSON.parse(raw) as Agency;
    if (!parsed || !Array.isArray(parsed.members)) return { ...SEED_AGENCY };
    return parsed;
  } catch {
    return { ...SEED_AGENCY };
  }
}

export function saveAgency(agency: Agency): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(AGENCY_KEY, JSON.stringify(agency));
  } catch {
    // ignore quota errors
  }
}

export function inviteMember(input: {
  name: string;
  email: string;
  role: AgencyRole;
}): AgencyMember {
  const member: AgencyMember = {
    id: `ag-mem-${Date.now()}`,
    name: input.name,
    email: input.email,
    role: input.role,
    status: "pending",
    listingsManaged: 0,
    avatarSeed: input.name.replace(/\s+/g, "+"),
    joinedAt: new Date().toISOString(),
  };
  const agency = getAgency();
  agency.members = [member, ...agency.members];
  saveAgency(agency);
  return member;
}

export function updateMemberRole(memberId: string, role: AgencyRole): void {
  const agency = getAgency();
  agency.members = agency.members.map((m) =>
    m.id === memberId ? { ...m, role } : m,
  );
  saveAgency(agency);
}

export function setMemberStatus(
  memberId: string,
  status: AgencyMemberStatus,
): void {
  const agency = getAgency();
  agency.members = agency.members.map((m) =>
    m.id === memberId ? { ...m, status } : m,
  );
  saveAgency(agency);
}

// -----------------------------------------------------------------------------
// Libellés FR partagés
// -----------------------------------------------------------------------------

export const ROLE_LABELS: Record<AgencyRole, string> = {
  agent: "Agent",
  manager: "Manager",
  admin: "Admin agence",
};

export const STATUS_LABELS: Record<AgencyMemberStatus, string> = {
  active: "Actif",
  pending: "En attente",
  disabled: "Désactivé",
};

export const PLAN_LABELS: Record<AgencyPlan, string> = {
  starter: "Agence Starter",
  pro: "Agence Pro",
  enterprise: "Enterprise",
};

// -----------------------------------------------------------------------------
// Données dérivées pour les pages dashboard
// -----------------------------------------------------------------------------

export interface MonthlyRevenuePoint {
  month: string; // ex. "Juin"
  value: number; // FCFA
}

export const REVENUE_LAST_12_MONTHS: MonthlyRevenuePoint[] = [
  { month: "Juin", value: 14_200_000 },
  { month: "Juil.", value: 15_800_000 },
  { month: "Août", value: 13_900_000 },
  { month: "Sept.", value: 17_400_000 },
  { month: "Oct.", value: 18_950_000 },
  { month: "Nov.", value: 20_100_000 },
  { month: "Déc.", value: 19_500_000 },
  { month: "Janv.", value: 21_300_000 },
  { month: "Févr.", value: 22_780_000 },
  { month: "Mars", value: 23_100_000 },
  { month: "Avril", value: 23_950_000 },
  { month: "Mai", value: 24_780_000 },
];

export interface AgencyTopListing {
  id: string;
  title: string;
  city: string;
  views: number;
  requests: number;
  agent: string;
}

export const TOP_LISTINGS: AgencyTopListing[] = [
  {
    id: "lst-101",
    title: "Villa moderne 4 chambres — Fidjrossè",
    city: "Cotonou",
    views: 4_820,
    requests: 142,
    agent: "Adjoa Mensah",
  },
  {
    id: "lst-102",
    title: "Appartement standing — Haie Vive",
    city: "Cotonou",
    views: 3_640,
    requests: 118,
    agent: "Boris Akpovi",
  },
  {
    id: "lst-103",
    title: "Duplex meublé — Cocotiers",
    city: "Cotonou",
    views: 3_180,
    requests: 96,
    agent: "Clarisse Hounsou",
  },
  {
    id: "lst-104",
    title: "Studio neuf — Cadjèhoun",
    city: "Cotonou",
    views: 2_950,
    requests: 88,
    agent: "Dieudonné Quenum",
  },
  {
    id: "lst-105",
    title: "Maison familiale — Akpakpa",
    city: "Cotonou",
    views: 2_420,
    requests: 74,
    agent: "Esther Tognon",
  },
];

export interface TrafficSource {
  source: string;
  share: number; // % entier
  color: string;
}

export const TRAFFIC_SOURCES: TrafficSource[] = [
  { source: "Recherche KAZA", share: 46, color: "#1976D2" },
  { source: "Accès direct", share: 24, color: "#1A3A52" },
  { source: "Partages / Réseaux", share: 18, color: "#4CAF50" },
  { source: "Carte interactive", share: 12, color: "#F59E0B" },
];

export interface AgentPerformance {
  memberId: string;
  name: string;
  listings: number;
  views: number;
  requests: number;
  conversions: number;
}

export const AGENT_PERFORMANCE: AgentPerformance[] = [
  { memberId: "ag-mem-001", name: "Adjoa Mensah", listings: 42, views: 18_400, requests: 612, conversions: 38 },
  { memberId: "ag-mem-002", name: "Boris Akpovi", listings: 38, views: 16_120, requests: 524, conversions: 33 },
  { memberId: "ag-mem-003", name: "Clarisse Hounsou", listings: 31, views: 13_850, requests: 478, conversions: 29 },
  { memberId: "ag-mem-004", name: "Dieudonné Quenum", listings: 22, views: 9_240, requests: 312, conversions: 19 },
  { memberId: "ag-mem-005", name: "Esther Tognon", listings: 19, views: 8_120, requests: 268, conversions: 16 },
  { memberId: "ag-mem-006", name: "Florent Bossou", listings: 17, views: 7_410, requests: 240, conversions: 14 },
  { memberId: "ag-mem-007", name: "Géraldine Sossa", listings: 14, views: 5_980, requests: 198, conversions: 11 },
];

export function formatFcfa(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value) + " FCFA";
}

export function formatNumberFr(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value);
}
