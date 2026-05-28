// =============================================================================
// KAZA — Mock data partagé pour l'espace ADMIN
// =============================================================================

export const PLATFORM_OVERVIEW = {
  totalUsers: 28_540,
  activeUsers30d: 14_280,
  totalProperties: 4_872,
  activeProperties: 3_215,
  totalAgencies: 187,
  totalRevenue30dFcfa: 142_500_000,
  pendingVerifications: 47,
  openDisputes: 12,
  platformUptime: 99.92,
  serverHealth: "OK",
};

export const USER_GROWTH = [
  { month: "Juin 25", users: 8_240, agencies: 92 },
  { month: "Juil. 25", users: 10_180, agencies: 104 },
  { month: "Août 25", users: 12_450, agencies: 118 },
  { month: "Sept. 25", users: 14_220, agencies: 127 },
  { month: "Oct. 25", users: 16_580, agencies: 138 },
  { month: "Nov. 25", users: 18_940, agencies: 149 },
  { month: "Déc. 25", users: 20_750, agencies: 156 },
  { month: "Janv. 26", users: 22_180, agencies: 163 },
  { month: "Févr. 26", users: 23_950, agencies: 170 },
  { month: "Mars 26", users: 25_440, agencies: 175 },
  { month: "Avr. 26", users: 27_120, agencies: 181 },
  { month: "Mai 26", users: 28_540, agencies: 187 },
];

export const PLATFORM_REVENUE = [
  { month: "Juin 25", subscriptions: 28_500_000, commissions: 42_100_000, boosts: 6_800_000 },
  { month: "Juil. 25", subscriptions: 32_400_000, commissions: 48_900_000, boosts: 7_900_000 },
  { month: "Août 25", subscriptions: 35_200_000, commissions: 54_300_000, boosts: 9_100_000 },
  { month: "Sept. 25", subscriptions: 36_800_000, commissions: 58_700_000, boosts: 9_800_000 },
  { month: "Oct. 25", subscriptions: 39_100_000, commissions: 64_200_000, boosts: 11_400_000 },
  { month: "Nov. 25", subscriptions: 41_500_000, commissions: 70_500_000, boosts: 12_800_000 },
  { month: "Déc. 25", subscriptions: 43_200_000, commissions: 68_900_000, boosts: 11_200_000 },
  { month: "Janv. 26", subscriptions: 45_800_000, commissions: 78_400_000, boosts: 13_500_000 },
  { month: "Févr. 26", subscriptions: 47_900_000, commissions: 84_100_000, boosts: 14_700_000 },
  { month: "Mars 26", subscriptions: 50_100_000, commissions: 91_800_000, boosts: 16_200_000 },
  { month: "Avr. 26", subscriptions: 52_400_000, commissions: 98_300_000, boosts: 17_800_000 },
  { month: "Mai 26", subscriptions: 54_700_000, commissions: 105_400_000, boosts: 19_400_000 },
];

export const USER_DISTRIBUTION = [
  { role: "Locataires", count: 18_420, percentage: 64.5, color: "#1976D2" },
  { role: "Propriétaires", count: 5_840, percentage: 20.5, color: "#4CAF50" },
  { role: "Étudiants", count: 3_780, percentage: 13.2, color: "#F59E0B" },
  { role: "Agences", count: 500, percentage: 1.8, color: "#1A3A52" },
];

export const PROPERTIES_BY_CITY = [
  { city: "Cotonou", count: 2_104, percentage: 43.2 },
  { city: "Calavi", count: 845, percentage: 17.3 },
  { city: "Porto-Novo", count: 612, percentage: 12.6 },
  { city: "Parakou", count: 425, percentage: 8.7 },
  { city: "Bohicon", count: 318, percentage: 6.5 },
  { city: "Abomey", count: 215, percentage: 4.4 },
  { city: "Autres", count: 353, percentage: 7.3 },
];

export const DAILY_ACTIVITY = [
  { day: "Lun", signups: 142, listings: 38, contracts: 12, payments: 240 },
  { day: "Mar", signups: 168, listings: 45, contracts: 18, payments: 285 },
  { day: "Mer", signups: 195, listings: 52, contracts: 22, payments: 312 },
  { day: "Jeu", signups: 182, listings: 48, contracts: 19, payments: 298 },
  { day: "Ven", signups: 220, listings: 61, contracts: 28, payments: 358 },
  { day: "Sam", signups: 248, listings: 47, contracts: 24, payments: 285 },
  { day: "Dim", signups: 95, listings: 22, contracts: 8, payments: 124 },
];

export const TOP_AGENCIES = [
  { name: "Premier Immobilier", city: "Cotonou", listings: 147, ca: 16_800_000, rating: 4.9 },
  { name: "Atlantique Habitat", city: "Cotonou", listings: 124, ca: 14_200_000, rating: 4.8 },
  { name: "Cocotier Pro", city: "Cotonou", listings: 98, ca: 11_500_000, rating: 4.7 },
  { name: "Tropic Immo", city: "Calavi", listings: 86, ca: 9_400_000, rating: 4.6 },
  { name: "Bénin Premium", city: "Porto-Novo", listings: 72, ca: 7_800_000, rating: 4.7 },
];

export const RECENT_ALERTS = [
  { id: "al-1", type: "warning", title: "Pic d'inscriptions inhabituel", description: "+340% sur 1h depuis 14h00, vérifier bot-detection", time: "Il y a 12 min" },
  { id: "al-2", type: "info", title: "Maintenance API prévue", description: "Lundi 1er juin 02h-04h (UTC), notification utilisateurs envoyée", time: "Il y a 1h" },
  { id: "al-3", type: "error", title: "Échec paiement webhook", description: "3 paiements en attente de réconciliation manuelle", time: "Il y a 2h" },
  { id: "al-4", type: "success", title: "Cache Redis optimisé", description: "Temps de réponse moyen ↓ 18% sur /search", time: "Il y a 4h" },
];

export const SYSTEM_HEALTH = [
  { service: "API Server", status: "OK", uptime: 99.98, latency: 142 },
  { service: "Base de données", status: "OK", uptime: 99.95, latency: 28 },
  { service: "Storage S3", status: "OK", uptime: 100, latency: 89 },
  { service: "Push notifications", status: "DEGRADED", uptime: 98.2, latency: 320 },
  { service: "Email Resend", status: "OK", uptime: 99.91, latency: 410 },
  { service: "Cache Redis", status: "OK", uptime: 99.99, latency: 8 },
];

// =============================================================================
// MOCK DATA — OWNER analytics
// =============================================================================

export const OWNER_MONTHLY_REVENUE = [
  { month: "Juin 25", revenue: 850_000, occupancy: 72 },
  { month: "Juil. 25", revenue: 920_000, occupancy: 75 },
  { month: "Août 25", revenue: 950_000, occupancy: 78 },
  { month: "Sept. 25", revenue: 920_000, occupancy: 76 },
  { month: "Oct. 25", revenue: 1_050_000, occupancy: 82 },
  { month: "Nov. 25", revenue: 1_150_000, occupancy: 85 },
  { month: "Déc. 25", revenue: 1_080_000, occupancy: 81 },
  { month: "Janv. 26", revenue: 1_240_000, occupancy: 88 },
  { month: "Févr. 26", revenue: 1_310_000, occupancy: 89 },
  { month: "Mars 26", revenue: 1_280_000, occupancy: 87 },
  { month: "Avr. 26", revenue: 1_380_000, occupancy: 91 },
  { month: "Mai 26", revenue: 1_450_000, occupancy: 92 },
];

export const OWNER_VISITS_FUNNEL = [
  { stage: "Vues annonces", value: 4_215, color: "#1A3A52" },
  { stage: "Contacts reçus", value: 284, color: "#1976D2" },
  { stage: "Visites confirmées", value: 87, color: "#4CAF50" },
  { stage: "Offres reçues", value: 32, color: "#F59E0B" },
  { stage: "Contrats signés", value: 14, color: "#10B981" },
];

export const OWNER_TOP_PROPERTIES = [
  { title: "Villa 5ch. Haie Vive", views: 1_245, contacts: 42, visits: 18, revenue: 1_250_000 },
  { title: "T4 Cadjèhoun", views: 892, contacts: 31, visits: 14, revenue: 425_000 },
  { title: "Studio meublé Ganhi", views: 745, contacts: 28, visits: 11, revenue: 165_000 },
  { title: "T3 Cocotiers", views: 612, contacts: 22, visits: 9, revenue: 520_000 },
  { title: "Maison Calavi", views: 488, contacts: 18, visits: 7, revenue: 380_000 },
];

export const OWNER_REVIEWS_BREAKDOWN = [
  { rating: 5, count: 142 },
  { rating: 4, count: 58 },
  { rating: 3, count: 12 },
  { rating: 2, count: 3 },
  { rating: 1, count: 1 },
];

// =============================================================================
// MOCK DATA — TENANT analytics (suivi budget et logements)
// =============================================================================

export const TENANT_PAYMENT_HISTORY = [
  { month: "Juin 25", paid: 350_000 },
  { month: "Juil. 25", paid: 350_000 },
  { month: "Août 25", paid: 350_000 },
  { month: "Sept. 25", paid: 350_000 },
  { month: "Oct. 25", paid: 350_000 },
  { month: "Nov. 25", paid: 350_000 },
  { month: "Déc. 25", paid: 380_000 },
  { month: "Janv. 26", paid: 380_000 },
  { month: "Févr. 26", paid: 380_000 },
  { month: "Mars 26", paid: 380_000 },
  { month: "Avr. 26", paid: 380_000 },
  { month: "Mai 26", paid: 380_000 },
];

export const TENANT_EXPENSES_BREAKDOWN = [
  { category: "Loyer", amount: 380_000, color: "#1976D2" },
  { category: "Charges", amount: 45_000, color: "#4CAF50" },
  { category: "Électricité", amount: 28_000, color: "#F59E0B" },
  { category: "Eau", amount: 12_000, color: "#06B6D4" },
  { category: "Internet", amount: 18_000, color: "#8B5CF6" },
];

export const TENANT_SAVINGS = [
  { label: "Économisé vs agences", value: 540_000, period: "12 mois" },
  { label: "Visites effectuées", value: 7, period: "Total" },
  { label: "Score profil locataire", value: 92, period: "/100" },
  { label: "Délai moyen réponse", value: 3.2, period: "h" },
];

// =============================================================================
// MOCK DATA — STUDENT analytics (coloc, budget, vie étudiante)
// =============================================================================

export const STUDENT_MONTHLY_EXPENSES = [
  { month: "Janv.", food: 45_000, rent: 75_000, transport: 18_000, other: 22_000 },
  { month: "Févr.", food: 48_000, rent: 75_000, transport: 22_000, other: 18_000 },
  { month: "Mars", food: 52_000, rent: 75_000, transport: 20_000, other: 24_000 },
  { month: "Avr.", food: 47_000, rent: 75_000, transport: 19_000, other: 28_000 },
  { month: "Mai", food: 51_000, rent: 75_000, transport: 24_000, other: 21_000 },
];

export const STUDENT_ROOMMATE_COMPATIBILITY = [
  { name: "Aminata K.", compatibility: 94, age: 21, university: "UAC" },
  { name: "Koffi B.", compatibility: 88, age: 22, university: "UAC" },
  { name: "Esther A.", compatibility: 82, age: 20, university: "EPAC" },
  { name: "Yacine D.", compatibility: 78, age: 23, university: "UAC" },
];

export const STUDENT_BUDGET_TRACKING = {
  monthlyBudget: 180_000,
  spent: 142_000,
  remaining: 38_000,
  daysLeft: 8,
  averageDaily: 4_733,
  projectedEnd: "À l'équilibre",
};

// =============================================================================
// HELPERS
// =============================================================================

export const formatFcfa = (value: number): string =>
  `${new Intl.NumberFormat("fr-FR").format(value)} FCFA`;

export const formatFcfaShort = (value: number): string => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} Md`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)} k`;
  return value.toString();
};

export const formatNumber = (value: number): string =>
  new Intl.NumberFormat("fr-FR").format(value);
