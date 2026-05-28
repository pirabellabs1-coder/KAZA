// =============================================================================
// KAZA - Demo notifications (Wave 8)
//
// Catalogue de 20 notifications mockees + helpers de persistance localStorage.
// Toutes les helpers sont SSR-safe (early return si window indisponible).
// =============================================================================

export type DemoNotificationType =
  | "payment"
  | "visit"
  | "message"
  | "property"
  | "contract"
  | "student"
  | "identity"
  | "system"
  | "marketing";

export type DemoNotificationPriority = "low" | "normal" | "high";

export interface DemoNotification {
  id: string;
  type: DemoNotificationType;
  title: string;
  body: string;
  link?: string;
  iconName: string; // nom d'icone lucide-react
  read: boolean;
  createdAt: string; // ISO
  priority: DemoNotificationPriority;
}

const KEY = "kaza-notifications";

// Helper pour generer une date ISO situee N minutes dans le passe sans creer de
// difference entre serveur et client : on accepte simplement Date.now().
const now = Date.now();
const ago = (ms: number): string => new Date(now - ms).toISOString();

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export const SEED_NOTIFICATIONS: DemoNotification[] = [
  {
    id: "n-001",
    type: "payment",
    title: "Paiement recu",
    body: "Thomas Adjovi a paye 150 000 FCFA pour Appartement Fidjrosse (loyer Juin 2026).",
    link: "/owner/payments",
    iconName: "CreditCard",
    read: false,
    createdAt: ago(8 * MIN),
    priority: "high",
  },
  {
    id: "n-002",
    type: "visit",
    title: "Nouvelle demande de visite",
    body: "Aicha souhaite visiter votre Villa Calavi le 28 mai a 16h00.",
    link: "/owner/visits",
    iconName: "CalendarCheck",
    read: false,
    createdAt: ago(35 * MIN),
    priority: "high",
  },
  {
    id: "n-003",
    type: "message",
    title: "Nouveau message de Marie",
    body: "« Bonjour, est-ce que l'appartement est encore disponible pour juillet ? »",
    link: "/messages/conv-001",
    iconName: "MessageSquare",
    read: false,
    createdAt: ago(2 * HOUR),
    priority: "normal",
  },
  {
    id: "n-004",
    type: "property",
    title: "Annonce approuvee",
    body: "Votre annonce Studio meuble Akpakpa a ete validee par l'equipe KAZA.",
    link: "/owner/properties",
    iconName: "BadgeCheck",
    read: false,
    createdAt: ago(5 * HOUR),
    priority: "normal",
  },
  {
    id: "n-005",
    type: "contract",
    title: "Contrat signe",
    body: "Le contrat de location avec Fatou Diallo est desormais signe electroniquement.",
    link: "/owner/contracts",
    iconName: "FileSignature",
    read: false,
    createdAt: ago(7 * HOUR),
    priority: "high",
  },
  {
    id: "n-006",
    type: "student",
    title: "Nouveau match colocataire",
    body: "Kossi (UAC, Informatique) correspond a 92 % a votre profil de colocation.",
    link: "/student/matches",
    iconName: "Users",
    read: false,
    createdAt: ago(9 * HOUR),
    priority: "normal",
  },
  {
    id: "n-007",
    type: "identity",
    title: "Identite verifiee",
    body: "Felicitations, votre carte nationale d'identite a ete validee.",
    link: "/profile",
    iconName: "ShieldCheck",
    read: false,
    createdAt: ago(14 * HOUR),
    priority: "normal",
  },
  {
    id: "n-008",
    type: "payment",
    title: "Paiement en attente",
    body: "Le paiement de 200 000 FCFA pour Villa Calavi est en cours de verification.",
    link: "/owner/payments",
    iconName: "Hourglass",
    read: true,
    createdAt: ago(26 * HOUR),
    priority: "normal",
  },
  {
    id: "n-009",
    type: "visit",
    title: "Visite confirmee",
    body: "Votre visite de l'Appartement Ganhi est confirmee pour demain a 10h.",
    link: "/tenant/visits",
    iconName: "CalendarCheck",
    read: false,
    createdAt: ago(30 * HOUR),
    priority: "high",
  },
  {
    id: "n-010",
    type: "message",
    title: "Reponse de Jean Dupont",
    body: "« Oui le studio est libre, je peux vous le faire visiter samedi. »",
    link: "/messages/conv-002",
    iconName: "MessageSquare",
    read: true,
    createdAt: ago(36 * HOUR),
    priority: "normal",
  },
  {
    id: "n-011",
    type: "system",
    title: "Verification d'identite requise",
    body: "Telechargez votre CNI pour finaliser la verification de votre compte.",
    link: "/profile",
    iconName: "AlertTriangle",
    read: false,
    createdAt: ago(2 * DAY),
    priority: "high",
  },
  {
    id: "n-012",
    type: "payment",
    title: "Recu disponible",
    body: "Votre recu de paiement pour Mai 2026 est pret a etre telecharge (PDF).",
    link: "/tenant/payments",
    iconName: "FileText",
    read: true,
    createdAt: ago(3 * DAY),
    priority: "low",
  },
  {
    id: "n-013",
    type: "property",
    title: "Annonce expiree",
    body: "Votre annonce Chambre etudiante UAC est expiree. Renouvelez-la pour rester visible.",
    link: "/owner/properties",
    iconName: "Clock",
    read: false,
    createdAt: ago(4 * DAY),
    priority: "normal",
  },
  {
    id: "n-014",
    type: "visit",
    title: "Rappel : visite demain",
    body: "Rappel — votre visite Villa Akpakpa avec Mamadou est prevue demain a 15h.",
    link: "/owner/visits",
    iconName: "Bell",
    read: false,
    createdAt: ago(4 * DAY + 4 * HOUR),
    priority: "normal",
  },
  {
    id: "n-015",
    type: "contract",
    title: "Action requise sur un contrat",
    body: "Veuillez signer le contrat de location pour le studio Cadjehoun.",
    link: "/tenant/contracts",
    iconName: "FileSignature",
    read: false,
    createdAt: ago(5 * DAY),
    priority: "high",
  },
  {
    id: "n-016",
    type: "student",
    title: "Nouvelle annonce de colocation",
    body: "Une chambre se libere dans la colocation 4 personnes a Haie-Vive (180 000 FCFA).",
    link: "/student/rooms",
    iconName: "Home",
    read: true,
    createdAt: ago(6 * DAY),
    priority: "low",
  },
  {
    id: "n-017",
    type: "marketing",
    title: "Astuce KAZA",
    body: "Ajoutez 5 photos minimum a votre annonce pour multiplier par 3 les demandes de visite.",
    link: "/owner/properties",
    iconName: "Sparkles",
    read: true,
    createdAt: ago(7 * DAY),
    priority: "low",
  },
  {
    id: "n-018",
    type: "payment",
    title: "Echeance de loyer dans 3 jours",
    body: "Le loyer de Mai pour l'Appartement Fidjrosse est du le 30 mai 2026.",
    link: "/tenant/payments",
    iconName: "AlarmClock",
    read: false,
    createdAt: ago(8 * DAY),
    priority: "high",
  },
  {
    id: "n-019",
    type: "system",
    title: "Mise a jour des conditions",
    body: "Les conditions generales d'utilisation ont ete mises a jour. Consultez-les.",
    link: "/legal/terms",
    iconName: "ScrollText",
    read: true,
    createdAt: ago(10 * DAY),
    priority: "low",
  },
  {
    id: "n-020",
    type: "marketing",
    title: "Parrainez un proprietaire",
    body: "Parrainez un proprietaire et recevez 5 000 FCFA de credit a la premiere mise en ligne.",
    link: "/referral",
    iconName: "Gift",
    read: true,
    createdAt: ago(14 * DAY),
    priority: "low",
  },
];

// =============================================================================
// Helpers de persistance localStorage
// =============================================================================

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readRaw(): DemoNotification[] | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed as DemoNotification[];
  } catch {
    return null;
  }
}

function writeRaw(items: DemoNotification[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // ignore quota errors
  }
}

/**
 * Retourne les notifications stockees. Au premier appel, seed localStorage
 * avec `SEED_NOTIFICATIONS`. Renvoie le seed quand on est cote serveur.
 */
export function getStoredNotifications(): DemoNotification[] {
  const stored = readRaw();
  if (stored) return stored;
  if (isBrowser()) {
    writeRaw(SEED_NOTIFICATIONS);
  }
  return SEED_NOTIFICATIONS;
}

export function markAsRead(id: string): void {
  if (!isBrowser()) return;
  const items = getStoredNotifications().map((n) =>
    n.id === id ? { ...n, read: true } : n,
  );
  writeRaw(items);
}

export function markAllAsRead(): void {
  if (!isBrowser()) return;
  const items = getStoredNotifications().map((n) => ({ ...n, read: true }));
  writeRaw(items);
}

export function deleteNotification(id: string): void {
  if (!isBrowser()) return;
  const items = getStoredNotifications().filter((n) => n.id !== id);
  writeRaw(items);
}

/** Reinitialise au seed. Pratique pour la demo / debug. */
export function resetNotifications(): void {
  if (!isBrowser()) return;
  writeRaw(SEED_NOTIFICATIONS);
}
