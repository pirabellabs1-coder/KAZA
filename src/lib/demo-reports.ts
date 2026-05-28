// =============================================================================
// KAZA — Demo user reports (mode démo, localStorage)
//
// Permet aux utilisateurs de signaler une annonce, un profil, un message ou
// un avis. Les signalements sont persistés dans le localStorage et consultables
// depuis /reports.
// =============================================================================

export type ReportTargetType = "property" | "user" | "message" | "review";

export type ReportReason =
  | "inappropriate"
  | "spam"
  | "scam"
  | "fake"
  | "harassment"
  | "illegal"
  | "other";

export type ReportStatus = "pending" | "reviewed" | "resolved" | "dismissed";

export interface UserReport {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  targetLabel: string; // ex: "Annonce Villa Fidjrossè"
  reason: ReportReason;
  description: string;
  reporterId: string;
  reportedAt: string; // ISO
  status: ReportStatus;
  adminNote?: string;
}

const KEY = "kaza-reports";

// -----------------------------------------------------------------------------
// Seed — 5 signalements de démonstration
// -----------------------------------------------------------------------------

const now = Date.now();
const ago = (ms: number): string => new Date(now - ms).toISOString();
const DAY = 24 * 60 * 60 * 1000;

export const SEED_REPORTS: UserReport[] = [
  {
    id: "rep-001",
    targetType: "property",
    targetId: "prop-009",
    targetLabel: "Annonce Villa Fidjrossè à prix cassé",
    reason: "scam",
    description:
      "Prix anormalement bas (50 000 FCFA pour une villa de 5 pièces), le propriétaire demande un acompte avant même la visite. Tentative d'arnaque évidente.",
    reporterId: "u-005-tenant-thomas",
    reportedAt: ago(2 * DAY),
    status: "reviewed",
    adminNote:
      "Merci pour le signalement. L'annonce est en cours d'examen approfondi par notre équipe sécurité.",
  },
  {
    id: "rep-002",
    targetType: "user",
    targetId: "u-099-suspect",
    targetLabel: "Profil de Karim B.",
    reason: "harassment",
    description:
      "Cet utilisateur m'envoie des messages insistants après que j'ai décliné sa proposition de visite. Comportement intrusif.",
    reporterId: "u-005-tenant-thomas",
    reportedAt: ago(5 * DAY),
    status: "resolved",
    adminNote:
      "Le compte a été suspendu après vérification. Merci d'avoir contribué à la sécurité de KAZA.",
  },
  {
    id: "rep-003",
    targetType: "message",
    targetId: "msg-456",
    targetLabel: "Message dans la conversation #conv-012",
    reason: "spam",
    description:
      "Reçu un message promotionnel pour un service externe non lié à la location. Sollicitation commerciale non désirée.",
    reporterId: "u-005-tenant-thomas",
    reportedAt: ago(7 * DAY),
    status: "pending",
  },
  {
    id: "rep-004",
    targetType: "review",
    targetId: "rev-321",
    targetLabel: "Avis sur Appartement Cocotiers",
    reason: "fake",
    description:
      "Cet avis 1 étoile a été posté par quelqu'un qui n'a jamais loué le bien. Le contenu ne correspond pas du tout à la réalité.",
    reporterId: "u-005-tenant-thomas",
    reportedAt: ago(12 * DAY),
    status: "dismissed",
    adminNote:
      "Après vérification, l'auteur de l'avis a bien été locataire entre janvier et mars. L'avis est maintenu mais nous restons attentifs.",
  },
  {
    id: "rep-005",
    targetType: "property",
    targetId: "prop-010",
    targetLabel: "Annonce Studio Akpakpa",
    reason: "inappropriate",
    description:
      "Les photos affichent des éléments choquants sans rapport avec le bien proposé. Contenu inapproprié à modérer rapidement.",
    reporterId: "u-005-tenant-thomas",
    reportedAt: ago(20 * DAY),
    status: "resolved",
    adminNote:
      "Annonce retirée et propriétaire averti. Merci pour votre vigilance.",
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

function readAll(): UserReport[] {
  if (!isBrowser()) return [...SEED_REPORTS];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      window.localStorage.setItem(KEY, JSON.stringify(SEED_REPORTS));
      return [...SEED_REPORTS];
    }
    const parsed = JSON.parse(raw) as UserReport[];
    if (!Array.isArray(parsed)) return [...SEED_REPORTS];
    return parsed;
  } catch {
    return [...SEED_REPORTS];
  }
}

function writeAll(reports: UserReport[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(reports));
  } catch {
    // ignore quota
  }
}

// -----------------------------------------------------------------------------
// API publique
// -----------------------------------------------------------------------------

export function getMyReports(): UserReport[] {
  return readAll().sort(
    (a, b) =>
      new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime(),
  );
}

export function addReport(
  report: Omit<UserReport, "id" | "reportedAt" | "status">,
): UserReport {
  const newReport: UserReport = {
    ...report,
    id: `rep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    reportedAt: new Date().toISOString(),
    status: "pending",
  };
  const all = readAll();
  writeAll([newReport, ...all]);
  return newReport;
}

// -----------------------------------------------------------------------------
// Helpers UI
// -----------------------------------------------------------------------------

export const REASON_META: Record<
  ReportReason,
  { label: string; description: string; iconName: string }
> = {
  inappropriate: {
    label: "Contenu inapproprié",
    description: "Images, textes ou commentaires choquants ou offensants.",
    iconName: "AlertTriangle",
  },
  spam: {
    label: "Spam",
    description: "Sollicitations commerciales ou contenu répétitif.",
    iconName: "Megaphone",
  },
  scam: {
    label: "Arnaque",
    description: "Tentative de fraude, prix suspects, faux loyer.",
    iconName: "ShieldAlert",
  },
  fake: {
    label: "Faux profil / fausse annonce",
    description: "Information mensongère, photos volées, identité usurpée.",
    iconName: "UserX",
  },
  harassment: {
    label: "Harcèlement",
    description: "Messages insistants, menaces ou intimidations.",
    iconName: "AlertCircle",
  },
  illegal: {
    label: "Activité illégale",
    description: "Violation de la loi, contenu interdit, trafic.",
    iconName: "Gavel",
  },
  other: {
    label: "Autre motif",
    description: "Précisez le contexte dans la description.",
    iconName: "HelpCircle",
  },
};

export const STATUS_META: Record<
  ReportStatus,
  { label: string; classes: string; iconName: string }
> = {
  pending: {
    label: "En attente",
    classes: "bg-kaza-warning/15 text-kaza-warning border-kaza-warning/30",
    iconName: "Clock",
  },
  reviewed: {
    label: "Examiné",
    classes: "bg-kaza-blue/15 text-kaza-blue border-kaza-blue/30",
    iconName: "Eye",
  },
  resolved: {
    label: "Résolu",
    classes: "bg-kaza-green/15 text-kaza-green border-kaza-green/30",
    iconName: "CheckCircle2",
  },
  dismissed: {
    label: "Rejeté",
    classes: "bg-muted text-muted-foreground border-border",
    iconName: "XCircle",
  },
};

export const TARGET_TYPE_LABELS: Record<ReportTargetType, string> = {
  property: "Annonce",
  user: "Utilisateur",
  message: "Message",
  review: "Avis",
};

export function formatReportDate(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
