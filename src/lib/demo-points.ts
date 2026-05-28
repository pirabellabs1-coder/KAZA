// =============================================================================
// KAZA — Demo store : KAZA Points (loyauté)
//
// Persistance localStorage des points et de l'historique de transactions.
// SSR-safe : toutes les helpers retournent les seeds par défaut côté serveur.
// =============================================================================

export type PointsCategory =
  | "signup"
  | "visit"
  | "payment"
  | "review"
  | "referral"
  | "redeem";

export interface PointsTransaction {
  id: string;
  type: "earn" | "spend";
  amount: number;
  reason: string;
  date: string; // ISO
  category: PointsCategory;
}

export const KEY = "kaza-points";
export const POINTS_BALANCE_KEY = "kaza-points-balance";
export const POINT_VALUE_FCFA = 5; // 1 point = 5 FCFA

// -----------------------------------------------------------------------------
// Seed démo (~10 transactions variées)
// -----------------------------------------------------------------------------

const now = Date.now();
const ago = (ms: number): string => new Date(now - ms).toISOString();
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export const SEED_TRANSACTIONS: PointsTransaction[] = [
  {
    id: "pts-001",
    type: "earn",
    amount: 500,
    reason: "Bienvenue sur KAZA",
    date: ago(90 * DAY),
    category: "signup",
  },
  {
    id: "pts-002",
    type: "earn",
    amount: 100,
    reason: "Profil complété à 100%",
    date: ago(85 * DAY),
    category: "signup",
  },
  {
    id: "pts-003",
    type: "earn",
    amount: 200,
    reason: "Identité vérifiée",
    date: ago(80 * DAY),
    category: "signup",
  },
  {
    id: "pts-004",
    type: "earn",
    amount: 50,
    reason: "Première visite effectuée",
    date: ago(60 * DAY),
    category: "visit",
  },
  {
    id: "pts-005",
    type: "earn",
    amount: 50,
    reason: "Visite — Villa Fidjrossè",
    date: ago(45 * DAY),
    category: "visit",
  },
  {
    id: "pts-006",
    type: "earn",
    amount: 25,
    reason: "Avis publié — Studio Cocotiers",
    date: ago(40 * DAY),
    category: "review",
  },
  {
    id: "pts-007",
    type: "earn",
    amount: 500,
    reason: "Parrainage utilisé — Marie K.",
    date: ago(30 * DAY),
    category: "referral",
  },
  {
    id: "pts-008",
    type: "earn",
    amount: 1000,
    reason: "Location signée — Appartement Cocotiers",
    date: ago(20 * DAY),
    category: "payment",
  },
  {
    id: "pts-009",
    type: "spend",
    amount: 500,
    reason: "Échange — Bon de réduction 2 000 FCFA",
    date: ago(10 * DAY),
    category: "redeem",
  },
  {
    id: "pts-010",
    type: "earn",
    amount: 25,
    reason: "Avis publié — Villa Fidjrossè",
    date: ago(3 * DAY),
    category: "review",
  },
];

const INITIAL_BALANCE = 850;

// -----------------------------------------------------------------------------
// Helpers SSR-safe
// -----------------------------------------------------------------------------

function isBrowser(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

function readTransactions(): PointsTransaction[] {
  if (!isBrowser()) return [...SEED_TRANSACTIONS];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      window.localStorage.setItem(KEY, JSON.stringify(SEED_TRANSACTIONS));
      return [...SEED_TRANSACTIONS];
    }
    const parsed = JSON.parse(raw) as PointsTransaction[];
    if (!Array.isArray(parsed)) return [...SEED_TRANSACTIONS];
    return parsed;
  } catch {
    return [...SEED_TRANSACTIONS];
  }
}

function writeTransactions(transactions: PointsTransaction[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(transactions));
  } catch {
    // ignore quota errors
  }
}

function readBalance(): number {
  if (!isBrowser()) return INITIAL_BALANCE;
  try {
    const raw = window.localStorage.getItem(POINTS_BALANCE_KEY);
    if (raw === null) {
      window.localStorage.setItem(POINTS_BALANCE_KEY, String(INITIAL_BALANCE));
      return INITIAL_BALANCE;
    }
    const value = parseInt(raw, 10);
    return Number.isFinite(value) ? value : INITIAL_BALANCE;
  } catch {
    return INITIAL_BALANCE;
  }
}

function writeBalance(value: number): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(POINTS_BALANCE_KEY, String(value));
  } catch {
    // ignore quota errors
  }
}

// -----------------------------------------------------------------------------
// API publique
// -----------------------------------------------------------------------------

export function getPointsBalance(): number {
  return readBalance();
}

export function getTransactions(): PointsTransaction[] {
  return readTransactions();
}

export function addPoints(
  amount: number,
  reason: string,
  category: PointsCategory,
): PointsTransaction {
  const tx: PointsTransaction = {
    id: `pts-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: "earn",
    amount: Math.abs(amount),
    reason,
    date: new Date().toISOString(),
    category,
  };
  const current = readTransactions();
  writeTransactions([tx, ...current]);
  writeBalance(readBalance() + tx.amount);
  return tx;
}

/**
 * Tente de dépenser `amount` points. Retourne `false` si solde insuffisant.
 */
export function spendPoints(amount: number, reason: string): boolean {
  const balance = readBalance();
  const cost = Math.abs(amount);
  if (balance < cost) return false;

  const tx: PointsTransaction = {
    id: `pts-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: "spend",
    amount: cost,
    reason,
    date: new Date().toISOString(),
    category: "redeem",
  };
  const current = readTransactions();
  writeTransactions([tx, ...current]);
  writeBalance(balance - cost);
  return true;
}

// -----------------------------------------------------------------------------
// Formatters partagés
// -----------------------------------------------------------------------------

export function formatPoints(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value);
}

export function pointsToFcfa(points: number): string {
  return new Intl.NumberFormat("fr-FR").format(points * POINT_VALUE_FCFA);
}

export function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / MIN);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.round(h / 24);
  if (d < 7) return `il y a ${d} j`;
  const w = Math.round(d / 7);
  if (w < 4) return `il y a ${w} sem`;
  const mo = Math.round(d / 30);
  return `il y a ${mo} mois`;
}
