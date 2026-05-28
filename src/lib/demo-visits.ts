// =============================================================================
// KAZA — Demo visits store (mode démo, localStorage)
//
// Permet aux pages /tenant/visits, /owner/calendar et au tunnel
// "Demander une visite" de fonctionner sans Supabase. Les visites créées
// par l'utilisateur sont persistées dans le localStorage du navigateur.
// =============================================================================

export type DemoVisitStatus =
  | "PENDING"
  | "CONFIRMED"
  | "REJECTED"
  | "COMPLETED"
  | "CANCELLED";

export interface DemoVisit {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  ownerName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  message?: string;
  status: DemoVisitStatus;
  createdAt: string; // ISO
}

const STORAGE_KEY = "kaza-demo-visits";

// -----------------------------------------------------------------------------
// Helpers de dates (mois courant pour des mocks toujours pertinents)
// -----------------------------------------------------------------------------

function isoDateForDayInCurrentMonth(day: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(Math.min(Math.max(day, 1), 28)).padStart(2, "0");
  return `${year}-${month}-${d}`;
}

function isoFromOffsetDays(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// -----------------------------------------------------------------------------
// Données de seed — visites variées côté locataire
// -----------------------------------------------------------------------------

export const SEED_VISITS: DemoVisit[] = [
  {
    id: "vis-seed-001",
    propertyId: "prop-001",
    propertyTitle: "Appartement Cocotiers 3 pièces",
    propertyAddress: "Rue 12.345, Cocotiers, Cotonou",
    ownerName: "Jean Dupont",
    date: isoFromOffsetDays(2),
    time: "14:00",
    message: "Je suis disponible toute l'après-midi, merci d'avance.",
    status: "PENDING",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    id: "vis-seed-002",
    propertyId: "prop-002",
    propertyTitle: "Villa Fidjrossè avec piscine",
    propertyAddress: "Quartier Fidjrossè, Cotonou",
    ownerName: "Jean Dupont",
    date: isoFromOffsetDays(5),
    time: "11:00",
    status: "CONFIRMED",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: "vis-seed-003",
    propertyId: "prop-003",
    propertyTitle: "Studio Cadjehoun",
    propertyAddress: "Boulevard du 30 août, Cadjehoun, Cotonou",
    ownerName: "Amina Koné",
    date: isoFromOffsetDays(-3),
    time: "09:00",
    status: "REJECTED",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
  },
  {
    id: "vis-seed-004",
    propertyId: "prop-004",
    propertyTitle: "Maison Akpakpa 4 pièces",
    propertyAddress: "Quartier Akpakpa, Cotonou",
    ownerName: "Mariam Adjovi",
    date: isoFromOffsetDays(-10),
    time: "16:00",
    status: "COMPLETED",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
  },
];

// -----------------------------------------------------------------------------
// Données de seed — calendrier propriétaire (8 visites étalées sur le mois)
// -----------------------------------------------------------------------------

export const OWNER_CALENDAR_SEED: DemoVisit[] = [
  {
    id: "ocv-001",
    propertyId: "prop-001",
    propertyTitle: "Appartement Cocotiers 3 pièces",
    propertyAddress: "Rue 12.345, Cocotiers, Cotonou",
    ownerName: "Vous",
    date: isoDateForDayInCurrentMonth(3),
    time: "09:00",
    status: "CONFIRMED",
    createdAt: new Date().toISOString(),
  },
  {
    id: "ocv-002",
    propertyId: "prop-002",
    propertyTitle: "Villa Fidjrossè avec piscine",
    propertyAddress: "Quartier Fidjrossè, Cotonou",
    ownerName: "Vous",
    date: isoDateForDayInCurrentMonth(6),
    time: "14:00",
    status: "PENDING",
    createdAt: new Date().toISOString(),
  },
  {
    id: "ocv-003",
    propertyId: "prop-003",
    propertyTitle: "Studio Cadjehoun",
    propertyAddress: "Boulevard du 30 août, Cadjehoun, Cotonou",
    ownerName: "Vous",
    date: isoDateForDayInCurrentMonth(8),
    time: "11:00",
    status: "CONFIRMED",
    createdAt: new Date().toISOString(),
  },
  {
    id: "ocv-004",
    propertyId: "prop-001",
    propertyTitle: "Appartement Cocotiers 3 pièces",
    propertyAddress: "Rue 12.345, Cocotiers, Cotonou",
    ownerName: "Vous",
    date: isoDateForDayInCurrentMonth(12),
    time: "16:00",
    status: "PENDING",
    createdAt: new Date().toISOString(),
  },
  {
    id: "ocv-005",
    propertyId: "prop-004",
    propertyTitle: "Maison Akpakpa 4 pièces",
    propertyAddress: "Quartier Akpakpa, Cotonou",
    ownerName: "Vous",
    date: isoDateForDayInCurrentMonth(15),
    time: "09:00",
    status: "CONFIRMED",
    createdAt: new Date().toISOString(),
  },
  {
    id: "ocv-006",
    propertyId: "prop-002",
    propertyTitle: "Villa Fidjrossè avec piscine",
    propertyAddress: "Quartier Fidjrossè, Cotonou",
    ownerName: "Vous",
    date: isoDateForDayInCurrentMonth(18),
    time: "11:00",
    status: "PENDING",
    createdAt: new Date().toISOString(),
  },
  {
    id: "ocv-007",
    propertyId: "prop-003",
    propertyTitle: "Studio Cadjehoun",
    propertyAddress: "Boulevard du 30 août, Cadjehoun, Cotonou",
    ownerName: "Vous",
    date: isoDateForDayInCurrentMonth(22),
    time: "14:00",
    status: "CONFIRMED",
    createdAt: new Date().toISOString(),
  },
  {
    id: "ocv-008",
    propertyId: "prop-004",
    propertyTitle: "Maison Akpakpa 4 pièces",
    propertyAddress: "Quartier Akpakpa, Cotonou",
    ownerName: "Vous",
    date: isoDateForDayInCurrentMonth(26),
    time: "16:00",
    status: "CONFIRMED",
    createdAt: new Date().toISOString(),
  },
];

// -----------------------------------------------------------------------------
// Stockage localStorage
// -----------------------------------------------------------------------------

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/**
 * Récupère les visites stockées par l'utilisateur.
 * SSR-safe : retourne SEED_VISITS si pas de window.
 */
export function getStoredVisits(): DemoVisit[] {
  if (!isBrowser()) return SEED_VISITS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_VISITS));
      return [...SEED_VISITS];
    }
    const parsed = JSON.parse(raw) as DemoVisit[];
    if (!Array.isArray(parsed)) return [...SEED_VISITS];
    return parsed;
  } catch {
    return [...SEED_VISITS];
  }
}

function writeVisits(visits: DemoVisit[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(visits));
  } catch {
    // ignore quota errors
  }
}

/**
 * Ajoute une visite et retourne l'objet final (avec id + createdAt).
 */
export function addStoredVisit(
  visit: Omit<DemoVisit, "id" | "createdAt">,
): DemoVisit {
  const newVisit: DemoVisit = {
    ...visit,
    id: `vis-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  const current = getStoredVisits();
  writeVisits([newVisit, ...current]);
  return newVisit;
}

/**
 * Met à jour le statut d'une visite existante.
 */
export function updateStoredVisitStatus(
  id: string,
  status: DemoVisitStatus,
): void {
  const current = getStoredVisits();
  const next = current.map((v) => (v.id === id ? { ...v, status } : v));
  writeVisits(next);
}

/**
 * Retourne les visites du calendrier propriétaire (seed statique).
 * (Non persisté car les actions propriétaires sont locales à la page.)
 */
export function getOwnerCalendarVisits(): DemoVisit[] {
  return OWNER_CALENDAR_SEED;
}

// -----------------------------------------------------------------------------
// Formatters partagés
// -----------------------------------------------------------------------------

export function formatVisitDate(dateIso: string): string {
  // dateIso = YYYY-MM-DD → forcer en local pour éviter le shift UTC.
  const [y, m, d] = dateIso.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatVisitTimeSlot(time: string): string {
  const [h] = time.split(":");
  const start = parseInt(h ?? "0", 10);
  const end = start + 2;
  return `${String(start).padStart(2, "0")}h-${String(end).padStart(2, "0")}h`;
}

export const VISIT_TIME_SLOTS = [
  { value: "09:00", label: "09h-11h" },
  { value: "11:00", label: "11h-13h" },
  { value: "14:00", label: "14h-16h" },
  { value: "16:00", label: "16h-18h" },
] as const;
