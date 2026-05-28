// =============================================================================
// KAZA — Mock data ÉTENDU pour contrôle plateforme par admin
// Users avec statuts, agences, contrats, documents, audit log, monitoring,
// finance, compliance.
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
  country: string; // ISO
  city: string;
  totalSpentFcfa: number;
  reportsAgainst: number;
  trustScore: number; // 0-100
  hasTwoFactor: boolean;
  flag?: "fraud_suspect" | "vip" | "press" | "partner";
}

const FIRST_NAMES = ["Aïcha", "Komi", "Fatou", "Sébastien", "Sandra", "Yacine", "Mariam", "Léa", "Pierre", "Olivier", "Jules", "Esther", "Marc", "Maïmouna", "Christelle", "Awa", "Hassan", "Bintou", "Kofi", "Aminata"];
const LAST_NAMES = ["Toko", "Agbeko", "Diop", "Mahougnon", "Mensah", "Sow", "Tossou", "Adjovi", "Kpondéhou", "Houngbo", "Codjia", "Bessan", "Sossou", "Bio", "Adjovi", "Bessan", "Mensah", "Ouattara", "Diallo", "Kone"];
const CITIES = [["Cotonou","BJ"],["Abomey-Calavi","BJ"],["Porto-Novo","BJ"],["Parakou","BJ"],["Abidjan","CI"],["Dakar","SN"],["Lomé","TG"],["Ouagadougou","BF"]] as const;
const ROLES: UserRole[] = ["TENANT","TENANT","TENANT","OWNER","STUDENT","STUDENT","TENANT","OWNER","AGENCY","TENANT"];

function rand(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Génère 60 utilisateurs déterministes
export const ADMIN_USERS: AdminUser[] = Array.from({ length: 60 }, (_, i) => {
  const r = rand(i + 1);
  const r2 = rand(i + 100);
  const r3 = rand(i + 200);
  const firstName = FIRST_NAMES[Math.floor(r * FIRST_NAMES.length)]!;
  const lastName = LAST_NAMES[Math.floor(r2 * LAST_NAMES.length)]!;
  const [city, country] = CITIES[Math.floor(r3 * CITIES.length)]!;
  const role = ROLES[i % ROLES.length]!;
  const daysAgo = Math.floor(r * 365);
  const signup = new Date(2026, 4, 27); // 27 mai 2026
  signup.setDate(signup.getDate() - daysAgo);
  const lastLogin = new Date(2026, 4, 27);
  lastLogin.setDate(lastLogin.getDate() - Math.floor(r2 * 30));

  const statusRoll = rand(i + 300);
  const status: UserStatus =
    statusRoll > 0.95 ? "BANNED"
    : statusRoll > 0.9 ? "SUSPENDED"
    : statusRoll > 0.83 ? "PENDING_KYC"
    : "ACTIVE";

  return {
    id: `usr-${String(i + 1).padStart(4, "0")}`,
    firstName,
    lastName,
    email: `${firstName.toLowerCase().replace(/[^a-z]/g,"")}.${lastName.toLowerCase()}${i+1}@${["gmail.com","yahoo.fr","hotmail.com","orange.bj"][i%4]}`,
    phone: `+229 9${Math.floor(r*9)}${Math.floor(r2*9)}${Math.floor(r3*9)} ${Math.floor(r*99).toString().padStart(2,"0")} ${Math.floor(r2*99).toString().padStart(2,"0")} ${Math.floor(r3*99).toString().padStart(2,"0")}`,
    role,
    status,
    verification: statusRoll > 0.83 ? "PENDING" : statusRoll > 0.7 ? "REJECTED" : "VERIFIED",
    signupAt: signup.toISOString(),
    lastLoginAt: lastLogin.toISOString(),
    country,
    city,
    totalSpentFcfa: Math.floor(r * 5_000_000),
    reportsAgainst: Math.floor(r * 5),
    trustScore: Math.floor(40 + r * 60),
    hasTwoFactor: r > 0.6,
    flag: r > 0.95 ? "fraud_suspect" : r < 0.05 ? "vip" : undefined,
  };
});

// ---------------------------------------------------------------------------
// AGENCIES — référentiel admin
// ---------------------------------------------------------------------------

export type AgencyPlanKey = "STARTER" | "PREMIUM" | "ELITE";
export type AgencyStatus = "ACTIVE" | "SUSPENDED" | "PENDING_KYC" | "TRIAL";

export interface AdminAgency {
  id: string;
  name: string;
  legalName: string;
  city: string;
  country: string;
  plan: AgencyPlanKey;
  status: AgencyStatus;
  signedAt: string;
  rccm: string;
  ifu: string;
  teamSize: number;
  activeListings: number;
  monthlyRevenueFcfa: number;
  rating: number;
  complianceScore: number; // 0-100
  lastAuditAt: string;
  director: string;
}

export const ADMIN_AGENCIES: AdminAgency[] = [
  { id: "agc-001", name: "Premier Immobilier", legalName: "Premier Immobilier SARL", city: "Cotonou", country: "BJ", plan: "PREMIUM", status: "ACTIVE", signedAt: "2024-03-12", rccm: "RB/COT/2019/B/1842", ifu: "3201942000847", teamSize: 8, activeListings: 147, monthlyRevenueFcfa: 16_800_000, rating: 4.9, complianceScore: 96, lastAuditAt: "2026-04-15", director: "Aïcha Toko" },
  { id: "agc-002", name: "Atlantique Habitat", legalName: "Atlantique Habitat SAS", city: "Cotonou", country: "BJ", plan: "PREMIUM", status: "ACTIVE", signedAt: "2024-06-20", rccm: "RB/COT/2020/B/2104", ifu: "3202021011245", teamSize: 6, activeListings: 124, monthlyRevenueFcfa: 14_200_000, rating: 4.8, complianceScore: 92, lastAuditAt: "2026-03-22", director: "Brice Akpovi" },
  { id: "agc-003", name: "Cocotier Pro", legalName: "Cocotier Pro Sarl", city: "Cotonou", country: "BJ", plan: "STARTER", status: "ACTIVE", signedAt: "2025-01-10", rccm: "RB/COT/2022/B/3478", ifu: "3202262022589", teamSize: 4, activeListings: 98, monthlyRevenueFcfa: 11_500_000, rating: 4.7, complianceScore: 88, lastAuditAt: "2026-02-08", director: "Claire Sonon" },
  { id: "agc-004", name: "Tropic Immo", legalName: "Tropic Immo SARL", city: "Abomey-Calavi", country: "BJ", plan: "STARTER", status: "ACTIVE", signedAt: "2025-04-15", rccm: "RB/COT/2024/B/4521", ifu: "3202524033418", teamSize: 3, activeListings: 86, monthlyRevenueFcfa: 9_400_000, rating: 4.6, complianceScore: 84, lastAuditAt: "2026-04-02", director: "Bruno Adjovi" },
  { id: "agc-005", name: "Bénin Premium", legalName: "Bénin Premium Holding", city: "Porto-Novo", country: "BJ", plan: "PREMIUM", status: "PENDING_KYC", signedAt: "2026-04-28", rccm: "RB/COT/2026/B/5821", ifu: "3202663045712", teamSize: 5, activeListings: 72, monthlyRevenueFcfa: 7_800_000, rating: 4.7, complianceScore: 65, lastAuditAt: "2026-05-12", director: "Marius Padonou" },
  { id: "agc-006", name: "Abidjan Élite", legalName: "Abidjan Élite SARL", city: "Abidjan", country: "CI", plan: "ELITE", status: "TRIAL", signedAt: "2026-05-15", rccm: "CI/ABJ/2024/B/8941", ifu: "CI2024118744", teamSize: 12, activeListings: 215, monthlyRevenueFcfa: 28_500_000, rating: 4.8, complianceScore: 78, lastAuditAt: "2026-05-15", director: "Eulalie Kouassi" },
  { id: "agc-007", name: "Dakar Habitat", legalName: "Dakar Habitat Group", city: "Dakar", country: "SN", plan: "ELITE", status: "ACTIVE", signedAt: "2025-09-01", rccm: "SN/DKR/2023/B/4521", ifu: "SN2023041245", teamSize: 18, activeListings: 287, monthlyRevenueFcfa: 36_200_000, rating: 4.9, complianceScore: 94, lastAuditAt: "2026-03-30", director: "Mamadou Ndiaye" },
  { id: "agc-008", name: "Sketch Real Estate", legalName: "Sketch RE SAS", city: "Cotonou", country: "BJ", plan: "STARTER", status: "SUSPENDED", signedAt: "2025-08-12", rccm: "RB/COT/2025/B/6234", ifu: "3202575054128", teamSize: 2, activeListings: 0, monthlyRevenueFcfa: 0, rating: 2.4, complianceScore: 32, lastAuditAt: "2026-05-20", director: "Daniel Houénou" },
];

// ---------------------------------------------------------------------------
// CONTRACTS — vue admin de toutes les conventions plateforme
// ---------------------------------------------------------------------------

export type ContractStatus = "DRAFT" | "PENDING_SIGNATURE" | "ACTIVE" | "TERMINATED" | "DISPUTED" | "EXPIRED";

export interface AdminContract {
  id: string;
  number: string;
  type: "RESIDENTIAL_FURNISHED" | "RESIDENTIAL_UNFURNISHED" | "COLOCATION" | "COMMERCIAL";
  status: ContractStatus;
  ownerName: string;
  ownerId: string;
  tenantName: string;
  tenantId: string;
  agencyName?: string;
  agencyId?: string;
  propertyTitle: string;
  propertyCity: string;
  startDate: string;
  endDate: string;
  monthlyRentFcfa: number;
  depositFcfa: number;
  signedAt?: string;
  pdfUrl: string;
}

export const ADMIN_CONTRACTS: AdminContract[] = Array.from({ length: 24 }, (_, i) => {
  const r = rand(i + 500);
  const r2 = rand(i + 600);
  const types: AdminContract["type"][] = ["RESIDENTIAL_FURNISHED","RESIDENTIAL_UNFURNISHED","COLOCATION","COMMERCIAL"];
  const statuses: ContractStatus[] = ["ACTIVE","ACTIVE","ACTIVE","ACTIVE","PENDING_SIGNATURE","DRAFT","TERMINATED","DISPUTED","EXPIRED"];
  const type = types[Math.floor(r * types.length)]!;
  const status = statuses[i % statuses.length]!;
  const startDate = new Date(2026, 0, 1);
  startDate.setDate(startDate.getDate() + i * 7);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 12);
  const owner = ADMIN_USERS.filter((u) => u.role === "OWNER")[i % 6]!;
  const tenant = ADMIN_USERS.filter((u) => u.role === "TENANT")[i % 12]!;
  const agency = i % 3 === 0 ? ADMIN_AGENCIES[i % ADMIN_AGENCIES.length]! : null;

  return {
    id: `ctr-${String(i + 1).padStart(4, "0")}`,
    number: `KAZA-2026-${String(i + 1).padStart(4, "0")}`,
    type,
    status,
    ownerName: `${owner.firstName} ${owner.lastName}`,
    ownerId: owner.id,
    tenantName: `${tenant.firstName} ${tenant.lastName}`,
    tenantId: tenant.id,
    agencyName: agency?.name,
    agencyId: agency?.id,
    propertyTitle: ["Villa 5ch. Haie Vive","T4 Cadjèhoun","Maison Calavi","Studio Ganhi","T3 Cocotiers","Villa Fidjrossè"][i % 6]!,
    propertyCity: ["Cotonou","Cotonou","Calavi","Cotonou","Cotonou","Cotonou"][i % 6]!,
    startDate: startDate.toISOString().split("T")[0]!,
    endDate: endDate.toISOString().split("T")[0]!,
    monthlyRentFcfa: 200_000 + Math.floor(r2 * 800_000),
    depositFcfa: (200_000 + Math.floor(r2 * 800_000)) * 2,
    signedAt: status === "ACTIVE" || status === "TERMINATED" || status === "EXPIRED" || status === "DISPUTED" ? startDate.toISOString() : undefined,
    pdfUrl: `/contracts/${i + 1}/pdf`,
  };
});

// ---------------------------------------------------------------------------
// DOCUMENTS uploadés — admin moderation
// ---------------------------------------------------------------------------

export type DocumentType = "CNI" | "PASSPORT" | "PAYSLIP" | "TAX_NOTICE" | "GUARANTOR_PROOF" | "INSURANCE" | "RCCM" | "OTHER";
export type DocumentStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "EXPIRED";

export interface AdminDocument {
  id: string;
  type: DocumentType;
  status: DocumentStatus;
  userId: string;
  userName: string;
  uploadedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  fileSize: number; // bytes
  fileName: string;
  notes?: string;
}

export const ADMIN_DOCUMENTS: AdminDocument[] = Array.from({ length: 40 }, (_, i) => {
  const r = rand(i + 800);
  const types: DocumentType[] = ["CNI","PASSPORT","PAYSLIP","TAX_NOTICE","GUARANTOR_PROOF","INSURANCE","RCCM"];
  const statuses: DocumentStatus[] = ["APPROVED","APPROVED","APPROVED","PENDING_REVIEW","PENDING_REVIEW","REJECTED","EXPIRED"];
  const type = types[i % types.length]!;
  const status = statuses[i % statuses.length]!;
  const user = ADMIN_USERS[i % ADMIN_USERS.length]!;
  const uploaded = new Date(2026, 4, 27);
  uploaded.setDate(uploaded.getDate() - Math.floor(r * 60));
  return {
    id: `doc-${String(i + 1).padStart(4, "0")}`,
    type,
    status,
    userId: user.id,
    userName: `${user.firstName} ${user.lastName}`,
    uploadedAt: uploaded.toISOString(),
    reviewedAt: status === "APPROVED" || status === "REJECTED" ? new Date(uploaded.getTime() + 86_400_000).toISOString() : undefined,
    reviewedBy: status === "APPROVED" || status === "REJECTED" ? "Marie K. (Admin)" : undefined,
    fileSize: Math.floor(50_000 + r * 4_000_000),
    fileName: `${type.toLowerCase()}_${user.firstName.toLowerCase()}_${i+1}.pdf`,
    notes: status === "REJECTED" ? "Document illisible — re-soumettre une scan haute résolution." : undefined,
  };
});

// Demandes RGPD
export const GDPR_REQUESTS = [
  { id: "gdpr-1", userId: "usr-0014", userName: "Sandra Mensah", type: "EXPORT", requestedAt: "2026-05-22", status: "PENDING", deadline: "2026-06-21" },
  { id: "gdpr-2", userId: "usr-0027", userName: "Maïmouna Bio", type: "DELETION", requestedAt: "2026-05-18", status: "IN_PROGRESS", deadline: "2026-06-17" },
  { id: "gdpr-3", userId: "usr-0042", userName: "Hassan Diop", type: "RECTIFICATION", requestedAt: "2026-05-25", status: "PENDING", deadline: "2026-06-24" },
  { id: "gdpr-4", userId: "usr-0051", userName: "Pierre Houngbo", type: "EXPORT", requestedAt: "2026-05-12", status: "COMPLETED", deadline: "2026-06-11" },
];

// ---------------------------------------------------------------------------
// AUDIT LOG — actions admin tracées
// ---------------------------------------------------------------------------

export type AuditAction =
  | "USER_SUSPENDED" | "USER_BANNED" | "USER_REACTIVATED" | "USER_DELETED" | "USER_ROLE_CHANGED" | "USER_IMPERSONATED"
  | "PROPERTY_APPROVED" | "PROPERTY_REJECTED" | "PROPERTY_FEATURED" | "PROPERTY_HIDDEN"
  | "CONTRACT_TERMINATED" | "CONTRACT_VALIDATED"
  | "AGENCY_SUSPENDED" | "AGENCY_PLAN_CHANGED" | "AGENCY_KYC_APPROVED"
  | "PAYMENT_REFUNDED" | "WALLET_FROZEN" | "WALLET_UNFROZEN"
  | "FEATURE_FLAG_TOGGLED" | "EMAIL_TEMPLATE_EDITED"
  | "GDPR_EXPORT_GENERATED" | "GDPR_DELETION_PROCESSED";

export interface AuditLog {
  id: string;
  timestamp: string;
  adminId: string;
  adminName: string;
  action: AuditAction;
  targetType: "USER" | "PROPERTY" | "CONTRACT" | "AGENCY" | "PAYMENT" | "SYSTEM";
  targetId: string;
  targetLabel: string;
  reason?: string;
  ipAddress: string;
}

export const AUDIT_LOGS: AuditLog[] = [
  { id: "log-1", timestamp: "2026-05-27T14:32:18Z", adminId: "adm-001", adminName: "Marie K.", action: "USER_SUSPENDED", targetType: "USER", targetId: "usr-0042", targetLabel: "Hassan Diop", reason: "Fraude suspectée — 3 plaintes locataires", ipAddress: "196.199.84.12" },
  { id: "log-2", timestamp: "2026-05-27T13:18:42Z", adminId: "adm-002", adminName: "Jean A.", action: "PROPERTY_APPROVED", targetType: "PROPERTY", targetId: "prop-2381", targetLabel: "Villa Fidjrossè 5ch", ipAddress: "196.199.84.45" },
  { id: "log-3", timestamp: "2026-05-27T11:45:09Z", adminId: "adm-001", adminName: "Marie K.", action: "AGENCY_KYC_APPROVED", targetType: "AGENCY", targetId: "agc-005", targetLabel: "Bénin Premium", ipAddress: "196.199.84.12" },
  { id: "log-4", timestamp: "2026-05-27T10:22:33Z", adminId: "adm-003", adminName: "Aïcha O.", action: "PAYMENT_REFUNDED", targetType: "PAYMENT", targetId: "pay-8921", targetLabel: "Litige 245 000 FCFA — Locataire Mensah", reason: "Bail rompu par bailleur dans les 7j", ipAddress: "196.199.84.78" },
  { id: "log-5", timestamp: "2026-05-27T09:12:54Z", adminId: "adm-001", adminName: "Marie K.", action: "CONTRACT_TERMINATED", targetType: "CONTRACT", targetId: "ctr-0014", targetLabel: "KAZA-2026-0014", reason: "Demande conjointe parties", ipAddress: "196.199.84.12" },
  { id: "log-6", timestamp: "2026-05-26T18:45:21Z", adminId: "adm-002", adminName: "Jean A.", action: "USER_REACTIVATED", targetType: "USER", targetId: "usr-0017", targetLabel: "Yacine Sow", reason: "Vérification KYC complète", ipAddress: "196.199.84.45" },
  { id: "log-7", timestamp: "2026-05-26T16:32:11Z", adminId: "adm-001", adminName: "Marie K.", action: "FEATURE_FLAG_TOGGLED", targetType: "SYSTEM", targetId: "ff-new-search", targetLabel: "new_search_ui = ON (15% rollout)", ipAddress: "196.199.84.12" },
  { id: "log-8", timestamp: "2026-05-26T14:18:08Z", adminId: "adm-003", adminName: "Aïcha O.", action: "GDPR_EXPORT_GENERATED", targetType: "USER", targetId: "usr-0051", targetLabel: "Pierre Houngbo", ipAddress: "196.199.84.78" },
  { id: "log-9", timestamp: "2026-05-26T11:55:42Z", adminId: "adm-002", adminName: "Jean A.", action: "AGENCY_SUSPENDED", targetType: "AGENCY", targetId: "agc-008", targetLabel: "Sketch Real Estate", reason: "Faux profils détectés, compliance 32%", ipAddress: "196.199.84.45" },
  { id: "log-10", timestamp: "2026-05-26T09:32:17Z", adminId: "adm-001", adminName: "Marie K.", action: "USER_BANNED", targetType: "USER", targetId: "usr-0058", targetLabel: "Compte spam", reason: "30+ annonces frauduleuses en 48h", ipAddress: "196.199.84.12" },
  { id: "log-11", timestamp: "2026-05-25T17:42:08Z", adminId: "adm-002", adminName: "Jean A.", action: "PROPERTY_HIDDEN", targetType: "PROPERTY", targetId: "prop-1928", targetLabel: "Studio Akpakpa", reason: "Photos trompeuses signalées par locataires", ipAddress: "196.199.84.45" },
  { id: "log-12", timestamp: "2026-05-25T15:18:54Z", adminId: "adm-001", adminName: "Marie K.", action: "AGENCY_PLAN_CHANGED", targetType: "AGENCY", targetId: "agc-006", targetLabel: "Abidjan Élite STARTER → ELITE", ipAddress: "196.199.84.12" },
];

// ---------------------------------------------------------------------------
// MONITORING — métriques système temps réel
// ---------------------------------------------------------------------------

export const MONITORING_METRICS = {
  requestsPerSecond: Array.from({ length: 60 }, (_, i) => ({
    t: i,
    value: Math.round(80 + 40 * Math.sin(i / 5) + 20 * Math.cos(i / 3) + rand(i + 900) * 30),
  })),
  latency: {
    p50: 42,
    p95: 187,
    p99: 412,
  },
  errorRate: 0.34, // %
  uptime24h: 99.98,
  uptime30d: 99.92,
  activeConnections: 1_842,
  cacheHitRate: 94.2,
  dbQueriesPerSecond: 142,
};

export const SERVER_NODES = [
  { id: "node-1", name: "API-EU-1 (Paris)", region: "eu-west-3", status: "OK", cpu: 42, memory: 68, requests24h: 1_241_580 },
  { id: "node-2", name: "API-EU-2 (Paris)", region: "eu-west-3", status: "OK", cpu: 38, memory: 71, requests24h: 1_198_420 },
  { id: "node-3", name: "API-AF-1 (Lagos)", region: "af-south-1", status: "OK", cpu: 51, memory: 64, requests24h: 845_120 },
  { id: "node-4", name: "DB-Primary (Paris)", region: "eu-west-3", status: "OK", cpu: 28, memory: 52, requests24h: 5_842_120 },
  { id: "node-5", name: "DB-Replica-1", region: "eu-west-3", status: "OK", cpu: 18, memory: 41, requests24h: 3_245_810 },
  { id: "node-6", name: "Redis Cache", region: "eu-west-3", status: "OK", cpu: 8, memory: 22, requests24h: 12_485_320 },
];

export const ERROR_LOG = [
  { id: "err-1", timestamp: "2026-05-27T14:18:42Z", level: "ERROR", service: "API", message: "POST /api/properties → DB connection timeout", count: 3 },
  { id: "err-2", timestamp: "2026-05-27T12:45:18Z", level: "WARN", service: "Push notifications", message: "FCM token expired for 12 users", count: 12 },
  { id: "err-3", timestamp: "2026-05-27T11:32:09Z", level: "ERROR", service: "Email", message: "Resend rate limit reached (1000/min)", count: 1 },
  { id: "err-4", timestamp: "2026-05-27T09:18:54Z", level: "INFO", service: "Cache", message: "Redis warmup completed in 3.2s", count: 1 },
];

// ---------------------------------------------------------------------------
// FINANCE — revenus, commissions, payouts
// ---------------------------------------------------------------------------

export const PLATFORM_FINANCE_30D = {
  grossRevenueFcfa: 178_500_000,
  commissionsFcfa: 105_400_000,
  subscriptionsFcfa: 54_700_000,
  boostsFcfa: 19_400_000,
  refundsFcfa: 2_840_000,
  netRevenueFcfa: 175_660_000,
  payoutsFcfa: 142_300_000,
  taxesFcfa: 28_500_000,
  ebitda: 31_400_000,
  ebitdaMargin: 17.9,
};

export const REVENUE_WATERFALL = [
  { label: "Commissions", value: 105_400_000, type: "positive" },
  { label: "Abonnements Pro", value: 54_700_000, type: "positive" },
  { label: "Boosts annonces", value: 19_400_000, type: "positive" },
  { label: "Recettes brutes", value: 178_500_000, type: "total" },
  { label: "Remboursements", value: -2_840_000, type: "negative" },
  { label: "Recettes nettes", value: 175_660_000, type: "total" },
  { label: "Reversements bailleurs", value: -142_300_000, type: "negative" },
  { label: "Taxes & TVA", value: -28_500_000, type: "negative" },
  { label: "EBITDA", value: 4_860_000, type: "total" },
];

export interface Payout {
  id: string;
  beneficiary: string;
  type: "OWNER" | "AGENCY";
  amountFcfa: number;
  status: "SCHEDULED" | "PROCESSING" | "PAID" | "FAILED";
  scheduledAt: string;
  paidAt?: string;
  method: string;
}

export const RECENT_PAYOUTS: Payout[] = [
  { id: "po-001", beneficiary: "Premier Immobilier", type: "AGENCY", amountFcfa: 16_800_000, status: "PROCESSING", scheduledAt: "2026-05-28", method: "Virement bancaire" },
  { id: "po-002", beneficiary: "Atlantique Habitat", type: "AGENCY", amountFcfa: 14_200_000, status: "SCHEDULED", scheduledAt: "2026-05-28", method: "Virement bancaire" },
  { id: "po-003", beneficiary: "Aïcha Toko", type: "OWNER", amountFcfa: 1_450_000, status: "PAID", scheduledAt: "2026-05-26", paidAt: "2026-05-26", method: "Mobile Money" },
  { id: "po-004", beneficiary: "Komi Agbeko", type: "OWNER", amountFcfa: 925_000, status: "PAID", scheduledAt: "2026-05-25", paidAt: "2026-05-25", method: "Virement bancaire" },
  { id: "po-005", beneficiary: "Sketch RE", type: "AGENCY", amountFcfa: 142_000, status: "FAILED", scheduledAt: "2026-05-24", method: "Virement bancaire" },
  { id: "po-006", beneficiary: "Dakar Habitat", type: "AGENCY", amountFcfa: 36_200_000, status: "PAID", scheduledAt: "2026-05-23", paidAt: "2026-05-23", method: "SWIFT" },
];

// ---------------------------------------------------------------------------
// COMPLIANCE — RGPD/APDP/OHADA
// ---------------------------------------------------------------------------

export const COMPLIANCE_SCORE = {
  global: 92,
  byArea: [
    { area: "Protection données (APDP/RGPD)", score: 94, status: "OK" },
    { area: "Conservation contrats (OHADA)", score: 88, status: "OK" },
    { area: "KYC utilisateurs", score: 91, status: "OK" },
    { area: "Lutte anti-fraude", score: 86, status: "WARN" },
    { area: "Transparence tarifaire", score: 100, status: "OK" },
    { area: "Accessibilité (RGAA)", score: 78, status: "WARN" },
    { area: "Sécurité (ISO 27001)", score: 96, status: "OK" },
    { area: "Conditions d'utilisation", score: 100, status: "OK" },
  ],
};

export const PENDING_COMPLIANCE_TASKS = [
  { id: "ct-1", title: "Audit annuel APDP (Autorité de Protection des Données)", dueDate: "2026-06-30", priority: "HIGH" },
  { id: "ct-2", title: "Renouvellement certification ISO 27001", dueDate: "2026-09-15", priority: "MEDIUM" },
  { id: "ct-3", title: "Mise à jour CGU — modifications Loi 2018-12", dueDate: "2026-06-12", priority: "HIGH" },
  { id: "ct-4", title: "Test pénétration trimestriel (pentest)", dueDate: "2026-06-30", priority: "MEDIUM" },
  { id: "ct-5", title: "Formation équipe — sensibilisation phishing", dueDate: "2026-07-15", priority: "LOW" },
];

// ---------------------------------------------------------------------------
// GEOGRAPHIC HEATMAP — distribution biens / users par pays
// ---------------------------------------------------------------------------

export const GEO_HEATMAP = [
  { country: "Bénin", code: "BJ", users: 18_240, listings: 3_215, revenueFcfa: 142_500_000, intensity: 100 },
  { country: "Côte d'Ivoire", code: "CI", users: 5_840, listings: 845, revenueFcfa: 28_400_000, intensity: 60 },
  { country: "Sénégal", code: "SN", users: 2_980, listings: 412, revenueFcfa: 14_800_000, intensity: 45 },
  { country: "Togo", code: "TG", users: 1_120, listings: 198, revenueFcfa: 6_200_000, intensity: 28 },
  { country: "Burkina Faso", code: "BF", users: 360, listings: 142, revenueFcfa: 4_100_000, intensity: 18 },
  { country: "Ghana", code: "GH", users: 0, listings: 0, revenueFcfa: 0, intensity: 5 },
  { country: "Nigeria", code: "NG", users: 0, listings: 0, revenueFcfa: 0, intensity: 5 },
];

// ---------------------------------------------------------------------------
// CAMPAIGNS — mass push/email
// ---------------------------------------------------------------------------

export interface Campaign {
  id: string;
  name: string;
  channel: "EMAIL" | "PUSH" | "SMS";
  status: "DRAFT" | "SCHEDULED" | "SENDING" | "SENT" | "CANCELLED";
  audience: string;
  audienceSize: number;
  sentAt?: string;
  scheduledAt?: string;
  openRate?: number;
  clickRate?: number;
}

export const CAMPAIGNS: Campaign[] = [
  { id: "cmp-1", name: "Nouveautés Mai 2026", channel: "EMAIL", status: "SENT", audience: "Tous utilisateurs actifs", audienceSize: 14_280, sentAt: "2026-05-15T09:00:00Z", openRate: 38.4, clickRate: 8.2 },
  { id: "cmp-2", name: "Soldes printemps -20%", channel: "PUSH", status: "SENT", audience: "Locataires inactifs 30j", audienceSize: 3_840, sentAt: "2026-05-10T18:00:00Z", openRate: 42.1, clickRate: 12.5 },
  { id: "cmp-3", name: "Rappel paiement loyer", channel: "SMS", status: "SCHEDULED", audience: "Locataires échéance J-3", audienceSize: 487, scheduledAt: "2026-05-29T08:00:00Z" },
  { id: "cmp-4", name: "Nouveau KAZA Pro Premium", channel: "EMAIL", status: "DRAFT", audience: "Propriétaires + Agences", audienceSize: 6_340 },
  { id: "cmp-5", name: "Maintenance prévue", channel: "PUSH", status: "SCHEDULED", audience: "Tous utilisateurs", audienceSize: 28_540, scheduledAt: "2026-05-31T22:00:00Z" },
];

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

export const formatFcfa = (value: number): string =>
  `${new Intl.NumberFormat("fr-FR").format(value)} FCFA`;

export const formatFcfaShort = (value: number): string => {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1)} Md`;
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)} M`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(0)} k`;
  return value.toString();
};

export const formatNumber = (value: number): string =>
  new Intl.NumberFormat("fr-FR").format(value);

export const formatBytes = (bytes: number): string => {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} Mo`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} ko`;
  return `${bytes} o`;
};

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
