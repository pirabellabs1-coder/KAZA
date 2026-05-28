// =============================================================================
// KAZA — Demo availability blocks (mode démo, localStorage)
//
// Permet au propriétaire de bloquer des plages de dates pour un bien donné
// (maintenance, usage personnel, réservé, autre). Persistance localStorage,
// SSR-safe.
// =============================================================================

export type AvailabilityReason =
  | "maintenance"
  | "personal_use"
  | "reserved"
  | "other";

export interface AvailabilityBlock {
  id: string;
  propertyId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: AvailabilityReason;
  note?: string;
}

const KEY = "kaza-availability";

// -----------------------------------------------------------------------------
// Helpers dates relatives au mois courant
// -----------------------------------------------------------------------------

function isoDateForDayInCurrentMonth(day: number): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(Math.min(Math.max(day, 1), 28)).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isoFromOffsetDays(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// -----------------------------------------------------------------------------
// Seed — 3-4 blocages mock répartis sur les biens de démonstration
// -----------------------------------------------------------------------------

export const SEED_BLOCKS: AvailabilityBlock[] = [
  {
    id: "blk-001",
    propertyId: "prop-001",
    startDate: isoDateForDayInCurrentMonth(10),
    endDate: isoDateForDayInCurrentMonth(13),
    reason: "maintenance",
    note: "Travaux de peinture et réparation plomberie",
  },
  {
    id: "blk-002",
    propertyId: "prop-001",
    startDate: isoFromOffsetDays(20),
    endDate: isoFromOffsetDays(25),
    reason: "personal_use",
    note: "Visite famille — usage personnel",
  },
  {
    id: "blk-003",
    propertyId: "prop-002",
    startDate: isoDateForDayInCurrentMonth(5),
    endDate: isoDateForDayInCurrentMonth(7),
    reason: "reserved",
    note: "Réservation orale en attente de signature",
  },
  {
    id: "blk-004",
    propertyId: "prop-003",
    startDate: isoFromOffsetDays(14),
    endDate: isoFromOffsetDays(16),
    reason: "other",
  },
];

// -----------------------------------------------------------------------------
// Persistance
// -----------------------------------------------------------------------------

function isBrowser(): boolean {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

function readAll(): AvailabilityBlock[] {
  if (!isBrowser()) return [...SEED_BLOCKS];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      window.localStorage.setItem(KEY, JSON.stringify(SEED_BLOCKS));
      return [...SEED_BLOCKS];
    }
    const parsed = JSON.parse(raw) as AvailabilityBlock[];
    if (!Array.isArray(parsed)) return [...SEED_BLOCKS];
    return parsed;
  } catch {
    return [...SEED_BLOCKS];
  }
}

function writeAll(blocks: AvailabilityBlock[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(blocks));
  } catch {
    // ignore quota errors
  }
}

// -----------------------------------------------------------------------------
// API publique
// -----------------------------------------------------------------------------

export function getBlocksForProperty(
  propertyId: string,
): AvailabilityBlock[] {
  return readAll().filter((b) => b.propertyId === propertyId);
}

export function addBlock(
  block: Omit<AvailabilityBlock, "id">,
): AvailabilityBlock {
  const newBlock: AvailabilityBlock = {
    ...block,
    id: `blk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  };
  const all = readAll();
  writeAll([newBlock, ...all]);
  return newBlock;
}

export function removeBlock(id: string): void {
  const all = readAll();
  writeAll(all.filter((b) => b.id !== id));
}

/**
 * Retourne le blocage actif pour une date donnée d'un bien, sinon null.
 * Compare au format YYYY-MM-DD (lexicographiquement équivalent).
 */
export function isDateBlocked(
  propertyId: string,
  date: string,
): AvailabilityBlock | null {
  const blocks = getBlocksForProperty(propertyId);
  for (const b of blocks) {
    if (date >= b.startDate && date <= b.endDate) return b;
  }
  return null;
}

// -----------------------------------------------------------------------------
// Helpers UI
// -----------------------------------------------------------------------------

export const REASON_LABELS: Record<AvailabilityReason, string> = {
  maintenance: "Maintenance",
  personal_use: "Usage personnel",
  reserved: "Réservé",
  other: "Autre",
};

export function formatBlockDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}
