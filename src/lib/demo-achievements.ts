// =============================================================================
// KAZA - Demo achievements / badges (Wave 10)
//
// Catalogue de 16 badges + helpers de persistance localStorage.
// SSR-safe (early return si window indisponible). Aucune dependance externe.
// =============================================================================

export type AchievementCategory =
  | "getting_started"
  | "social"
  | "transactions"
  | "reviews"
  | "special";

export type AchievementRarity = "common" | "rare" | "epic" | "legendary";

export interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string; // nom d'icone lucide-react
  category: AchievementCategory;
  pointsReward: number;
  rarity: AchievementRarity;
  unlockedAt?: string; // ISO si debloque
  progress?: { current: number; target: number };
}

const STORE_KEY = "kaza-achievements";

// Date stable pour le seed (les helpers utilisent Date.now() au runtime)
const SEED_DATE = "2026-05-20T10:00:00.000Z";
const RECENT_DATE = "2026-05-25T14:30:00.000Z";

export const ALL_ACHIEVEMENTS: Achievement[] = [
  // --- Getting started ---
  {
    id: "ach-001",
    code: "welcome",
    title: "Bienvenue",
    description: "Vous avez cree votre compte KAZA. Bienvenue dans la famille !",
    icon: "PartyPopper",
    category: "getting_started",
    pointsReward: 50,
    rarity: "common",
  },
  {
    id: "ach-002",
    code: "identity_verified",
    title: "Identite verifiee",
    description: "Votre piece d'identite a ete validee par notre equipe.",
    icon: "ShieldCheck",
    category: "getting_started",
    pointsReward: 100,
    rarity: "common",
  },
  {
    id: "ach-003",
    code: "profile_complete",
    title: "Profil complet",
    description: "Vous avez rempli tous les champs de votre profil utilisateur.",
    icon: "UserCheck",
    category: "getting_started",
    pointsReward: 50,
    rarity: "common",
  },
  // --- Social ---
  {
    id: "ach-004",
    code: "first_visit",
    title: "Premiere visite",
    description: "Vous avez effectue votre toute premiere visite de propriete.",
    icon: "Footprints",
    category: "social",
    pointsReward: 25,
    rarity: "common",
  },
  {
    id: "ach-005",
    code: "five_visits",
    title: "5 visites",
    description: "Vous avez visite 5 proprietes differentes. Toujours en quete !",
    icon: "MapPin",
    category: "social",
    pointsReward: 100,
    rarity: "rare",
    progress: { current: 2, target: 5 },
  },
  {
    id: "ach-006",
    code: "globe_trotter",
    title: "Globe-trotter",
    description: "Vous avez visite des proprietes dans 3 villes differentes.",
    icon: "Globe",
    category: "social",
    pointsReward: 200,
    rarity: "rare",
    progress: { current: 1, target: 3 },
  },
  {
    id: "ach-007",
    code: "first_referral",
    title: "Premier filleul",
    description: "Un de vos parrainages s'est inscrit sur KAZA. Merci !",
    icon: "Gift",
    category: "social",
    pointsReward: 100,
    rarity: "common",
  },
  {
    id: "ach-008",
    code: "influencer",
    title: "Influenceur",
    description: "10 filleuls se sont inscrits grace a votre code parrainage.",
    icon: "Megaphone",
    category: "social",
    pointsReward: 1000,
    rarity: "epic",
    progress: { current: 1, target: 10 },
  },
  // --- Reviews ---
  {
    id: "ach-009",
    code: "first_review",
    title: "Premier avis",
    description: "Vous avez laisse votre tout premier avis sur une propriete.",
    icon: "Star",
    category: "reviews",
    pointsReward: 25,
    rarity: "common",
  },
  {
    id: "ach-010",
    code: "constructive_critic",
    title: "Critique constructif",
    description: "5 avis donnes — la communaute compte sur vous.",
    icon: "MessageSquareQuote",
    category: "reviews",
    pointsReward: 100,
    rarity: "rare",
    progress: { current: 1, target: 5 },
  },
  // --- Transactions ---
  {
    id: "ach-011",
    code: "first_contract",
    title: "Premier contrat",
    description: "Vous avez signe votre tout premier contrat de location KAZA.",
    icon: "FileSignature",
    category: "transactions",
    pointsReward: 200,
    rarity: "rare",
  },
  {
    id: "ach-012",
    code: "first_rent_paid",
    title: "Premier loyer paye",
    description: "Votre premier loyer a ete regle via KAZA. Bravo !",
    icon: "Wallet",
    category: "transactions",
    pointsReward: 100,
    rarity: "rare",
  },
  {
    id: "ach-013",
    code: "loyal_tenant",
    title: "Locataire fidele",
    description: "12 paiements de loyer consecutifs sans retard. Exemplaire !",
    icon: "CalendarHeart",
    category: "transactions",
    pointsReward: 500,
    rarity: "epic",
    progress: { current: 3, target: 12 },
  },
  {
    id: "ach-014",
    code: "coloc_model",
    title: "Coloc model",
    description: "Note moyenne de 5 etoiles sur 5 colocations partagees.",
    icon: "Users",
    category: "transactions",
    pointsReward: 500,
    rarity: "epic",
    progress: { current: 0, target: 5 },
  },
  // --- Special ---
  {
    id: "ach-015",
    code: "beta_tester",
    title: "Beta tester",
    description: "Membre KAZA inscrit moins d'un mois apres le lancement.",
    icon: "FlaskConical",
    category: "special",
    pointsReward: 500,
    rarity: "legendary",
  },
  {
    id: "ach-016",
    code: "year_summit",
    title: "Sommet de l'annee",
    description: "Vous avez cumule plus de 10 000 points sur l'annee. Legende !",
    icon: "Trophy",
    category: "special",
    pointsReward: 2000,
    rarity: "legendary",
    progress: { current: 250, target: 10000 },
  },
];

// Codes debloques par defaut pour la demo (5 / 16)
const DEFAULT_UNLOCKED: Record<string, string> = {
  welcome: SEED_DATE,
  identity_verified: SEED_DATE,
  profile_complete: SEED_DATE,
  first_visit: RECENT_DATE,
  first_review: RECENT_DATE,
};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readUnlockedMap(): Record<string, string> | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) return null;
    return parsed as Record<string, string>;
  } catch {
    return null;
  }
}

function writeUnlockedMap(map: Record<string, string>): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(map));
  } catch {
    // ignore quota errors
  }
}

function getUnlockedMap(): Record<string, string> {
  const stored = readUnlockedMap();
  if (stored) return stored;
  if (isBrowser()) writeUnlockedMap(DEFAULT_UNLOCKED);
  return DEFAULT_UNLOCKED;
}

/**
 * Retourne la liste complete des 16 badges enrichie de leur etat de deblocage
 * (champ `unlockedAt` ajoute pour les badges decroches). En SSR, retombe sur
 * le seed `DEFAULT_UNLOCKED` pour assurer un rendu stable.
 */
export function getMyAchievements(): Achievement[] {
  const unlocked = getUnlockedMap();
  return ALL_ACHIEVEMENTS.map((a) => {
    const unlockedAt = unlocked[a.code];
    if (!unlockedAt) return a;
    // Quand un badge avec progression est debloque, on aligne current = target
    const progress = a.progress
      ? { current: a.progress.target, target: a.progress.target }
      : undefined;
    return { ...a, unlockedAt, progress };
  });
}

/**
 * Debloque un badge par son code et le persiste. Retourne le badge enrichi
 * ou null si le code est inconnu ou si le badge etait deja debloque.
 */
export function unlockAchievement(code: string): Achievement | null {
  const ach = ALL_ACHIEVEMENTS.find((a) => a.code === code);
  if (!ach) return null;
  const map = getUnlockedMap();
  if (map[code]) return null;
  const updated = { ...map, [code]: new Date().toISOString() };
  writeUnlockedMap(updated);
  return { ...ach, unlockedAt: updated[code] };
}

/** Reinitialise au seed de demo. */
export function resetAchievements(): void {
  if (!isBrowser()) return;
  writeUnlockedMap(DEFAULT_UNLOCKED);
}
