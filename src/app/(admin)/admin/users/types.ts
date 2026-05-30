// =============================================================================
// KAZA — Types et constantes UI pour la page Admin > Utilisateurs.
// Source réelle des comptes : table public.users (via @/lib/queries/admin).
// =============================================================================

export type UserStatus = "ACTIVE" | "SUSPENDED" | "BANNED" | "PENDING_KYC" | "DELETED";
export type UserRole = "OWNER" | "TENANT" | "STUDENT" | "AGENCY" | "ADMIN";
export type VerificationStatus = "VERIFIED" | "PENDING" | "REJECTED" | "NOT_SUBMITTED";

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  verification: VerificationStatus;
  signupAt: string;
  lastLoginAt: string;
  country: string;
  city: string;
  totalSpentFcfa: number;
  reportsAgainst: number;
  trustScore: number;
  hasTwoFactor: boolean;
  /** Classement dérivé (calculé côté backend) : VIP ou suspicion de fraude. */
  flag?: "vip" | "fraud_suspect" | null;
}

export const STATUS_COLORS_USER: Record<UserStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  SUSPENDED: "bg-amber-100 text-amber-700",
  BANNED: "bg-red-100 text-red-700",
  PENDING_KYC: "bg-blue-100 text-blue-700",
  DELETED: "bg-slate-100 text-slate-500",
};

export const STATUS_LABELS_USER: Record<UserStatus, string> = {
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
  BANNED: "Banni",
  PENDING_KYC: "KYC en attente",
  DELETED: "Supprimé",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  OWNER: "Propriétaire",
  TENANT: "Locataire",
  STUDENT: "Étudiant",
  AGENCY: "Agence",
  ADMIN: "Admin",
};
