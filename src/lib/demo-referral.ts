// =============================================================================
// KAZA — Demo store : parrainage (programme "Invitez et gagnez")
//
// Persistance localStorage du code parrainage et de la liste des filleuls.
// SSR-safe : retourne les seeds côté serveur.
// =============================================================================

export type ReferralStatus = "pending" | "signed_up" | "completed";

export interface Referral {
  id: string;
  code: string;
  inviteeEmail: string;
  inviteeName?: string;
  status: ReferralStatus;
  invitedAt: string; // ISO
  rewardEarned?: number;
}

export const REFERRAL_KEY = "kaza-referrals";
export const REFERRAL_CODE_KEY = "kaza-referral-code";
export const REFERRAL_REWARD_POINTS = 500;

// -----------------------------------------------------------------------------
// Seed — 6 filleuls (3 inscrits, 1 complété, 2 pending)
// -----------------------------------------------------------------------------

const now = Date.now();
const ago = (ms: number): string => new Date(now - ms).toISOString();
const DAY = 24 * 60 * 60 * 1000;

const SEED_CODE_FALLBACK = "MARIE-2026";

export const SEED_REFERRALS: Referral[] = [
  {
    id: "ref-001",
    code: SEED_CODE_FALLBACK,
    inviteeEmail: "fatou.diallo@example.com",
    inviteeName: "Fatou Diallo",
    status: "completed",
    invitedAt: ago(60 * DAY),
    rewardEarned: REFERRAL_REWARD_POINTS,
  },
  {
    id: "ref-002",
    code: SEED_CODE_FALLBACK,
    inviteeEmail: "kofi.mensah@example.com",
    inviteeName: "Kofi Mensah",
    status: "signed_up",
    invitedAt: ago(45 * DAY),
  },
  {
    id: "ref-003",
    code: SEED_CODE_FALLBACK,
    inviteeEmail: "aicha.toure@example.com",
    inviteeName: "Aïcha Touré",
    status: "signed_up",
    invitedAt: ago(30 * DAY),
  },
  {
    id: "ref-004",
    code: SEED_CODE_FALLBACK,
    inviteeEmail: "samuel.adebayo@example.com",
    inviteeName: "Samuel Adebayo",
    status: "signed_up",
    invitedAt: ago(20 * DAY),
  },
  {
    id: "ref-005",
    code: SEED_CODE_FALLBACK,
    inviteeEmail: "khadija.bensalah@example.com",
    inviteeName: "Khadija Bensalah",
    status: "pending",
    invitedAt: ago(8 * DAY),
  },
  {
    id: "ref-006",
    code: SEED_CODE_FALLBACK,
    inviteeEmail: "yannick.kouadio@example.com",
    inviteeName: "Yannick Kouadio",
    status: "pending",
    invitedAt: ago(2 * DAY),
  },
];

// -----------------------------------------------------------------------------
// Helpers SSR-safe
// -----------------------------------------------------------------------------

function isBrowser(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

function sanitizeAlpha(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

/**
 * Code parrainage = uppercase 5 premiers chars alphanumériques du userId + année.
 * Persisté en localStorage pour rester stable entre rechargements.
 */
export function getMyReferralCode(userId: string): string {
  const year = new Date().getFullYear();
  const safe = sanitizeAlpha(userId).slice(0, 5).padEnd(5, "X") || "USER0";
  const fallback = `${safe}-${year}`;

  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(REFERRAL_CODE_KEY);
    if (raw) return raw;
    window.localStorage.setItem(REFERRAL_CODE_KEY, fallback);
    return fallback;
  } catch {
    return fallback;
  }
}

export function getReferrals(): Referral[] {
  if (!isBrowser()) return [...SEED_REFERRALS];
  try {
    const raw = window.localStorage.getItem(REFERRAL_KEY);
    if (!raw) {
      window.localStorage.setItem(REFERRAL_KEY, JSON.stringify(SEED_REFERRALS));
      return [...SEED_REFERRALS];
    }
    const parsed = JSON.parse(raw) as Referral[];
    if (!Array.isArray(parsed)) return [...SEED_REFERRALS];
    return parsed;
  } catch {
    return [...SEED_REFERRALS];
  }
}

function writeReferrals(referrals: Referral[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(REFERRAL_KEY, JSON.stringify(referrals));
  } catch {
    // ignore quota errors
  }
}

export function inviteByEmail(email: string, name?: string): Referral {
  const trimmed = email.trim().toLowerCase();
  const code =
    (isBrowser() && window.localStorage.getItem(REFERRAL_CODE_KEY)) ||
    SEED_CODE_FALLBACK;

  const referral: Referral = {
    id: `ref-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    code,
    inviteeEmail: trimmed,
    inviteeName: name?.trim() || undefined,
    status: "pending",
    invitedAt: new Date().toISOString(),
  };
  const current = getReferrals();
  writeReferrals([referral, ...current]);
  return referral;
}

export function getReferralStats(): {
  invited: number;
  signedUp: number;
  completed: number;
  pointsEarned: number;
} {
  const referrals = getReferrals();
  const signedUp = referrals.filter(
    (r) => r.status === "signed_up" || r.status === "completed",
  ).length;
  const completed = referrals.filter((r) => r.status === "completed").length;
  const pointsEarned = referrals.reduce(
    (sum, r) => sum + (r.rewardEarned ?? 0),
    0,
  );
  return {
    invited: referrals.length,
    signedUp,
    completed,
    pointsEarned,
  };
}

// -----------------------------------------------------------------------------
// Labels & formatters
// -----------------------------------------------------------------------------

export const REFERRAL_STATUS_LABELS: Record<ReferralStatus, string> = {
  pending: "En attente",
  signed_up: "Inscrit",
  completed: "Location signée",
};

export const REFERRAL_STATUS_CLASSES: Record<ReferralStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  signed_up: "bg-kaza-blue/10 text-kaza-blue",
  completed: "bg-kaza-green/10 text-kaza-green",
};

export function formatReferralDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}
