import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// =============================================================================
// KAZA — Queries Admin (server-side)
// Toutes les fonctions retournent des données prêtes à afficher (jamais throw).
// Tableaux vides ou compteurs à 0 en cas d'erreur / aucune donnée.
// =============================================================================

const DEFAULT_PHOTO =
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Types publics
// ---------------------------------------------------------------------------

export type AdminUserRole = "TENANT" | "OWNER" | "STUDENT" | "ADMIN";
export type AdminUserVerification =
  | "UNVERIFIED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export interface AdminUserRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: AdminUserRole;
  isVerified: boolean;
  verificationStatus: AdminUserVerification;
  address: string | null;
  profilePhotoUrl: string | null;
  ratingAverage: number | null;
  createdAt: string;
  updatedAt: string;
}

export type AdminPropertyStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "AVAILABLE"
  | "RENTED"
  | "UNAVAILABLE"
  | "ARCHIVED";

export interface AdminPropertyRow {
  id: string;
  title: string;
  description: string | null;
  price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  squareMeters: number | null;
  address: string | null;
  status: AdminPropertyStatus;
  propertyType: string;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
  primaryPhotoUrl: string;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: AdminUserRole;
    isVerified: boolean;
  } | null;
}

export interface AdminStats {
  totalUsers: number;
  usersByRole: Record<AdminUserRole, number>;
  totalProperties: number;
  propertiesByStatus: Record<AdminPropertyStatus, number>;
  activeRentals: number;
  totalRevenue30d: number;
  totalVisits30d: number;
  pendingVerifications: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROLE_VALUES: AdminUserRole[] = ["TENANT", "OWNER", "STUDENT", "ADMIN"];
const STATUS_VALUES: AdminPropertyStatus[] = [
  "DRAFT",
  "PENDING_REVIEW",
  "AVAILABLE",
  "RENTED",
  "UNAVAILABLE",
  "ARCHIVED",
];

function coerceRole(value: unknown): AdminUserRole {
  return typeof value === "string" && (ROLE_VALUES as string[]).includes(value)
    ? (value as AdminUserRole)
    : "TENANT";
}

function coerceVerification(value: unknown): AdminUserVerification {
  return value === "PENDING" ||
    value === "APPROVED" ||
    value === "REJECTED" ||
    value === "UNVERIFIED"
    ? value
    : "UNVERIFIED";
}

function coerceStatus(value: unknown): AdminPropertyStatus {
  return typeof value === "string" &&
    (STATUS_VALUES as string[]).includes(value)
    ? (value as AdminPropertyStatus)
    : "DRAFT";
}

// ---------------------------------------------------------------------------
// USERS
// ---------------------------------------------------------------------------

/**
 * Liste tous les utilisateurs avec filtres optionnels.
 * Tri : created_at desc.
 */
export async function listAllUsers(
  filters: {
    role?: AdminUserRole | "all";
    /** Filtrage statut KYC (PENDING/APPROVED/REJECTED/UNVERIFIED) */
    status?: AdminUserVerification | "all";
    search?: string;
    limit?: number;
  } = {},
): Promise<AdminUserRow[]> {
  const supabase = await createClient();
  let q = supabase
    .from("users")
    .select(
      `id, first_name, last_name, email, phone, role,
       is_verified, verification_status, address, profile_photo_url,
       rating_average, created_at, updated_at`,
    )
    .order("created_at", { ascending: false })
    .limit(filters.limit ?? 500);

  if (filters.role && filters.role !== "all") {
    q = q.eq("role", filters.role);
  }
  if (filters.status && filters.status !== "all") {
    q = q.eq("verification_status", filters.status);
  }
  if (filters.search && filters.search.trim()) {
    const s = filters.search.trim();
    q = q.or(
      `first_name.ilike.%${s}%,last_name.ilike.%${s}%,email.ilike.%${s}%`,
    );
  }

  const { data, error } = await q;
  if (error) {
    console.error("[queries/admin] listAllUsers:", error.message);
    return [];
  }

  return (data ?? []).map((u): AdminUserRow => ({
    id: u.id as string,
    firstName: (u.first_name as string) ?? "",
    lastName: (u.last_name as string) ?? "",
    email: (u.email as string) ?? "",
    phone: (u.phone as string | null) ?? null,
    role: coerceRole(u.role),
    isVerified: Boolean(u.is_verified),
    verificationStatus: coerceVerification(u.verification_status),
    address: (u.address as string | null) ?? null,
    profilePhotoUrl: (u.profile_photo_url as string | null) ?? null,
    ratingAverage:
      typeof u.rating_average === "number" ? u.rating_average : null,
    createdAt: u.created_at as string,
    updatedAt: u.updated_at as string,
  }));
}

// ---------------------------------------------------------------------------
// PROPERTIES
// ---------------------------------------------------------------------------

/**
 * Liste toutes les annonces (tout statut), avec owner + première photo.
 * Tri : created_at desc.
 */
export async function listAllProperties(
  filters: {
    status?: AdminPropertyStatus | "all";
    search?: string;
    limit?: number;
  } = {},
): Promise<AdminPropertyRow[]> {
  const supabase = await createClient();
  let q = supabase
    .from("properties")
    .select(
      `
      id, title, description, price, bedrooms, bathrooms,
      square_meters, address, status, property_type,
      views_count, created_at, updated_at,
      photos:property_photos(photo_url, display_order),
      owner:users!owner_id(id, first_name, last_name, email, role, is_verified)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(filters.limit ?? 500);

  if (filters.status && filters.status !== "all") {
    q = q.eq("status", filters.status);
  }
  if (filters.search && filters.search.trim()) {
    const s = filters.search.trim();
    q = q.or(`title.ilike.%${s}%,address.ilike.%${s}%`);
  }

  const { data, error } = await q;
  if (error) {
    console.error("[queries/admin] listAllProperties:", error.message);
    return [];
  }

  return (data ?? []).map((p): AdminPropertyRow => {
    const photos = (p.photos as unknown as
      | Array<{ photo_url: string; display_order: number }>
      | null)
      ?.slice()
      ?.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
      ?.map((ph) => ph.photo_url) ?? [];
    const ownerRow = Array.isArray(p.owner) ? p.owner[0] : p.owner;
    return {
      id: p.id as string,
      title: (p.title as string) ?? "",
      description: (p.description as string | null) ?? null,
      price: Number(p.price ?? 0),
      bedrooms: (p.bedrooms as number | null) ?? null,
      bathrooms: (p.bathrooms as number | null) ?? null,
      squareMeters: (p.square_meters as number | null) ?? null,
      address: (p.address as string | null) ?? null,
      status: coerceStatus(p.status),
      propertyType: (p.property_type as string) ?? "APARTMENT",
      viewsCount: (p.views_count as number) ?? 0,
      createdAt: p.created_at as string,
      updatedAt: p.updated_at as string,
      primaryPhotoUrl: photos[0] ?? DEFAULT_PHOTO,
      owner: ownerRow
        ? {
            id: ownerRow.id as string,
            firstName: (ownerRow.first_name as string) ?? "",
            lastName: (ownerRow.last_name as string) ?? "",
            email: (ownerRow.email as string) ?? "",
            role: coerceRole(ownerRow.role),
            isVerified: Boolean(ownerRow.is_verified),
          }
        : null,
    };
  });
}

/**
 * Annonces à modérer en priorité :
 *  - status = PENDING_REVIEW
 *  - OU status = DRAFT créés dans les 7 derniers jours (potentiels oublis)
 * Tri : plus anciennes d'abord pour épuiser la file.
 */
export async function listPropertiesToReview(
  limit = 12,
): Promise<AdminPropertyRow[]> {
  const supabase = await createClient();
  const since = new Date(Date.now() - SEVEN_DAYS_MS).toISOString();

  const { data, error } = await supabase
    .from("properties")
    .select(
      `
      id, title, description, price, bedrooms, bathrooms,
      square_meters, address, status, property_type,
      views_count, created_at, updated_at,
      photos:property_photos(photo_url, display_order),
      owner:users!owner_id(id, first_name, last_name, email, role, is_verified)
    `,
    )
    .or(`status.eq.PENDING_REVIEW,and(status.eq.DRAFT,created_at.gte.${since})`)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("[queries/admin] listPropertiesToReview:", error.message);
    return [];
  }

  return (data ?? []).map((p): AdminPropertyRow => {
    const photos = (p.photos as unknown as
      | Array<{ photo_url: string; display_order: number }>
      | null)
      ?.slice()
      ?.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
      ?.map((ph) => ph.photo_url) ?? [];
    const ownerRow = Array.isArray(p.owner) ? p.owner[0] : p.owner;
    return {
      id: p.id as string,
      title: (p.title as string) ?? "",
      description: (p.description as string | null) ?? null,
      price: Number(p.price ?? 0),
      bedrooms: (p.bedrooms as number | null) ?? null,
      bathrooms: (p.bathrooms as number | null) ?? null,
      squareMeters: (p.square_meters as number | null) ?? null,
      address: (p.address as string | null) ?? null,
      status: coerceStatus(p.status),
      propertyType: (p.property_type as string) ?? "APARTMENT",
      viewsCount: (p.views_count as number) ?? 0,
      createdAt: p.created_at as string,
      updatedAt: p.updated_at as string,
      primaryPhotoUrl: photos[0] ?? DEFAULT_PHOTO,
      owner: ownerRow
        ? {
            id: ownerRow.id as string,
            firstName: (ownerRow.first_name as string) ?? "",
            lastName: (ownerRow.last_name as string) ?? "",
            email: (ownerRow.email as string) ?? "",
            role: coerceRole(ownerRow.role),
            isVerified: Boolean(ownerRow.is_verified),
          }
        : null,
    };
  });
}

// ---------------------------------------------------------------------------
// STATS
// ---------------------------------------------------------------------------

/**
 * Stats agrégées pour le dashboard admin.
 * En cas d'erreur sur une métrique, on retombe à 0 plutôt que de tout casser.
 */
export async function getAdminStats(): Promise<AdminStats> {
  const supabase = await createClient();
  const since = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();

  // Compteurs head:true → on ne récupère que le count, pas les rows.
  const [
    totalUsersRes,
    tenantsRes,
    ownersRes,
    studentsRes,
    adminsRes,
    totalPropsRes,
    propsDraftRes,
    propsPendingRes,
    propsAvailableRes,
    propsRentedRes,
    propsUnavailableRes,
    propsArchivedRes,
    activeRentalsRes,
    pendingVerifRes,
    visits30dRes,
    payments30dRes,
  ] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "TENANT"),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "OWNER"),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "STUDENT"),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "ADMIN"),
    supabase.from("properties").select("id", { count: "exact", head: true }),
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("status", "DRAFT"),
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("status", "PENDING_REVIEW"),
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("status", "AVAILABLE"),
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("status", "RENTED"),
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("status", "UNAVAILABLE"),
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("status", "ARCHIVED"),
    supabase
      .from("rentals")
      .select("id", { count: "exact", head: true })
      .eq("status", "ACTIVE"),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("verification_status", "PENDING"),
    supabase
      .from("visit_requests")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since),
    // Pour la somme des paiements complétés sur 30j on a besoin des amounts.
    supabase
      .from("payments")
      .select("amount")
      .eq("status", "COMPLETED")
      .gte("created_at", since),
  ]);

  const totalRevenue30d =
    payments30dRes.data?.reduce(
      (sum, row) => sum + Number((row as { amount: number }).amount ?? 0),
      0,
    ) ?? 0;

  return {
    totalUsers: totalUsersRes.count ?? 0,
    usersByRole: {
      TENANT: tenantsRes.count ?? 0,
      OWNER: ownersRes.count ?? 0,
      STUDENT: studentsRes.count ?? 0,
      ADMIN: adminsRes.count ?? 0,
    },
    totalProperties: totalPropsRes.count ?? 0,
    propertiesByStatus: {
      DRAFT: propsDraftRes.count ?? 0,
      PENDING_REVIEW: propsPendingRes.count ?? 0,
      AVAILABLE: propsAvailableRes.count ?? 0,
      RENTED: propsRentedRes.count ?? 0,
      UNAVAILABLE: propsUnavailableRes.count ?? 0,
      ARCHIVED: propsArchivedRes.count ?? 0,
    },
    activeRentals: activeRentalsRes.count ?? 0,
    totalRevenue30d,
    totalVisits30d: visits30dRes.count ?? 0,
    pendingVerifications: pendingVerifRes.count ?? 0,
  };
}

// ---------------------------------------------------------------------------
// VERIFICATIONS
// ---------------------------------------------------------------------------

/**
 * Utilisateurs avec un dossier KYC en attente d'examen (verification_status = PENDING).
 * Tri : updated_at desc (les plus récemment soumis en premier).
 */
export async function listPendingVerifications(
  limit = 100,
): Promise<AdminUserRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select(
      `id, first_name, last_name, email, phone, role,
       is_verified, verification_status, address, profile_photo_url,
       rating_average, created_at, updated_at`,
    )
    .eq("verification_status", "PENDING")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[queries/admin] listPendingVerifications:", error.message);
    return [];
  }

  return (data ?? []).map((u): AdminUserRow => ({
    id: u.id as string,
    firstName: (u.first_name as string) ?? "",
    lastName: (u.last_name as string) ?? "",
    email: (u.email as string) ?? "",
    phone: (u.phone as string | null) ?? null,
    role: coerceRole(u.role),
    isVerified: Boolean(u.is_verified),
    verificationStatus: coerceVerification(u.verification_status),
    address: (u.address as string | null) ?? null,
    profilePhotoUrl: (u.profile_photo_url as string | null) ?? null,
    ratingAverage:
      typeof u.rating_average === "number" ? u.rating_average : null,
    createdAt: u.created_at as string,
    updatedAt: u.updated_at as string,
  }));
}

// ---------------------------------------------------------------------------
// AGENCIES (users where role = 'AGENCY' + abonnement actif)
// ---------------------------------------------------------------------------

export interface AdminAgencyRow {
  id: string;
  /** Raison sociale dérivée des champs first_name / last_name (ou email). */
  name: string;
  email: string;
  phone: string | null;
  /** Champ `address` du profil — peut être null si non renseigné. */
  city: string | null;
  isVerified: boolean;
  verificationStatus: AdminUserVerification;
  /** Date d'inscription (created_at de l'utilisateur). */
  signedAt: string;
  activeProperties: number;
  monthlyPlanFcfa: number;
  planName: string | null;
  subscriptionStatus: string | null;
}

/**
 * Liste tous les utilisateurs `AGENCY` avec leur abonnement actif et leur
 * nombre d'annonces AVAILABLE. Tri : inscription la plus récente d'abord.
 */
export async function listAllAgencies(): Promise<AdminAgencyRow[]> {
  const supabase = await createClient();
  // `subscriptions` (migration 00011) n'est pas dans les types générés ;
  // `AGENCY` est autorisé par le trigger auth (00010) mais hors enum initial.
  // On caste pour bypass le typage strict — runtime OK.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("users")
    .select(
      `
      id, first_name, last_name, email, phone, address,
      is_verified, verification_status, created_at,
      subscriptions(plan, status, monthly_price, started_at, current_period_end)
    `,
    )
    .eq("role", "AGENCY")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[queries/admin] listAllAgencies:", error.message);
    return [];
  }

  const rows = (data ?? []) as Array<Record<string, unknown>>;

  // Compter les properties AVAILABLE en une seule requête (évite N+1).
  const agencyIds = rows.map((a) => a.id as string);
  const counts: Record<string, number> = {};
  if (agencyIds.length > 0) {
    const { data: props, error: propsError } = await supabase
      .from("properties")
      .select("owner_id")
      .in("owner_id", agencyIds)
      .eq("status", "AVAILABLE");

    if (propsError) {
      console.error(
        "[queries/admin] listAllAgencies properties:",
        propsError.message,
      );
    } else {
      for (const p of props ?? []) {
        const ownerId = (p as { owner_id: string }).owner_id;
        counts[ownerId] = (counts[ownerId] ?? 0) + 1;
      }
    }
  }

  return rows.map((a): AdminAgencyRow => {
    const subsRaw = (a as { subscriptions?: unknown }).subscriptions;
    const subs = Array.isArray(subsRaw)
      ? (subsRaw as Array<{
          plan: string;
          status: string;
          monthly_price: number | string | null;
        }>)
      : [];
    const sub =
      subs.find((s) => s.status === "ACTIVE" || s.status === "TRIAL") ?? null;

    const fullName = `${(a.first_name as string) ?? ""} ${
      (a.last_name as string) ?? ""
    }`.trim();

    return {
      id: a.id as string,
      name: fullName || (a.email as string),
      email: (a.email as string) ?? "",
      phone: (a.phone as string | null) ?? null,
      city: (a.address as string | null) ?? null,
      isVerified: Boolean(a.is_verified),
      verificationStatus: coerceVerification(a.verification_status),
      signedAt: a.created_at as string,
      activeProperties: counts[a.id as string] ?? 0,
      monthlyPlanFcfa: sub ? Number(sub.monthly_price ?? 0) : 0,
      planName: sub?.plan ?? null,
      subscriptionStatus: sub?.status ?? null,
    };
  });
}

// ---------------------------------------------------------------------------
// CONTRACTS (vue admin transversale)
// ---------------------------------------------------------------------------

export type AdminContractStatus =
  | "DRAFT"
  | "PENDING_TENANT"
  | "PENDING_OWNER"
  | "SIGNED"
  | "CANCELLED";

export interface AdminContractRow {
  id: string;
  rentalId: string | null;
  propertyTitle: string;
  propertyAddress: string;
  ownerName: string;
  tenantName: string;
  monthlyRent: number;
  startDate: string;
  endDate: string | null;
  status: AdminContractStatus;
  signedAt: string | null;
  createdAt: string;
}

/**
 * Liste tous les contrats (toute la plateforme) avec le bien, le bailleur
 * et le locataire associés. Tri : les plus récents d'abord.
 */
export async function listAllContracts(): Promise<AdminContractRow[]> {
  const supabase = await createClient();
  // `contracts.status` est ajouté par la migration 00006 via ALTER TABLE et
  // n'est donc pas dans les types Supabase générés depuis le schéma initial.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("contracts")
    .select(
      `
      id, rental_id, status, signed_at, created_at,
      rental:rentals!rental_id(
        monthly_rent, start_date, end_date,
        property:properties!property_id(
          title, address,
          owner:users!owner_id(first_name, last_name)
        ),
        tenant:users!tenant_id(first_name, last_name)
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[queries/admin] listAllContracts:", error.message);
    return [];
  }

  const CONTRACT_STATUSES: AdminContractStatus[] = [
    "DRAFT",
    "PENDING_TENANT",
    "PENDING_OWNER",
    "SIGNED",
    "CANCELLED",
  ];

  function coerceContractStatus(v: unknown): AdminContractStatus {
    return typeof v === "string" &&
      (CONTRACT_STATUSES as string[]).includes(v)
      ? (v as AdminContractStatus)
      : "DRAFT";
  }

  // Les types Supabase générés ne reflètent pas toujours les colonnes ajoutées
  // par les migrations ultérieures (00006 : `contracts.status`, `signed_at`).
  // On caste pour éviter les faux positifs SelectQueryError.
  const rows = (data ?? []) as unknown as Array<Record<string, unknown>>;

  return rows.map((c): AdminContractRow => {
    const rentalRaw = (c as { rental?: unknown }).rental;
    const rental = Array.isArray(rentalRaw)
      ? (rentalRaw[0] as Record<string, unknown> | undefined)
      : (rentalRaw as Record<string, unknown> | undefined);

    const propertyRaw = rental?.property;
    const property = Array.isArray(propertyRaw)
      ? (propertyRaw[0] as Record<string, unknown> | undefined)
      : (propertyRaw as Record<string, unknown> | undefined);

    const ownerRaw = property?.owner;
    const owner = Array.isArray(ownerRaw)
      ? (ownerRaw[0] as Record<string, unknown> | undefined)
      : (ownerRaw as Record<string, unknown> | undefined);

    const tenantRaw = rental?.tenant;
    const tenant = Array.isArray(tenantRaw)
      ? (tenantRaw[0] as Record<string, unknown> | undefined)
      : (tenantRaw as Record<string, unknown> | undefined);

    const ownerName = `${(owner?.first_name as string) ?? ""} ${
      (owner?.last_name as string) ?? ""
    }`.trim();
    const tenantName = `${(tenant?.first_name as string) ?? ""} ${
      (tenant?.last_name as string) ?? ""
    }`.trim();

    return {
      id: c.id as string,
      rentalId: (c.rental_id as string | null) ?? null,
      propertyTitle: (property?.title as string) ?? "—",
      propertyAddress: (property?.address as string) ?? "",
      ownerName: ownerName || "—",
      tenantName: tenantName || "—",
      monthlyRent: Number(rental?.monthly_rent ?? 0),
      startDate: (rental?.start_date as string) ?? "",
      endDate: (rental?.end_date as string | null) ?? null,
      status: coerceContractStatus(c.status),
      signedAt: (c.signed_at as string | null) ?? null,
      createdAt: c.created_at as string,
    };
  });
}

// ---------------------------------------------------------------------------
// DOCUMENTS — identity_verifications (vue admin)
// ---------------------------------------------------------------------------

export interface AdminDocumentRow {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  /** Type brut côté DB : 'national_id' | 'passport' | 'driver_license' | 'voter_card'. */
  documentType: string;
  /** Numéro saisi par l'utilisateur (optionnel). */
  documentNumber: string | null;
  /** Téléphone vérifié par OTP. */
  phoneNumber: string | null;
  status: AdminUserVerification;
  submittedAt: string;
  reviewedAt: string | null;
  /** Motif de rejet (rejection_reason côté DB). */
  reviewerNotes: string | null;
  /** Email confirmé au moment de la soumission (email_verified côté DB). */
  emailVerified: boolean;
  /** Documents administratifs additionnels avec signed URLs (10 min). */
  extraDocuments: Array<{ kind: string; label: string; url: string | null }>;
  /** Signed URLs (10 min) pour visualisation des pièces — bucket privé. */
  documentFrontUrl: string | null;
  documentBackUrl: string | null;
  selfieUrl: string | null;
}

const IDENTITY_BUCKET = "identity-documents";
const SIGNED_URL_TTL_SECONDS = 60 * 10; // 10 min

/**
 * Liste toutes les vérifications d'identité soumises sur la plateforme.
 * Tri : les plus récemment soumises d'abord.
 *
 * Pour chaque ligne, génère des Signed URLs (TTL 10 min) sur le bucket privé
 * `identity-documents` afin que l'admin puisse visualiser les pièces sans
 * réauthentification client. On utilise le service_role (bypass RLS) car
 * l'accès à cette query est déjà restreint par le layout admin + middleware.
 */
export async function listAllIdentityVerifications(): Promise<
  AdminDocumentRow[]
> {
  const supabase = await createClient();
  // Table introduite par la migration 00005 et absente des types Supabase
  // générés : on bypass le typage strict via un cast `any` ciblé.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("identity_verifications")
    .select(
      `
      id, user_id, document_type, document_number, phone_number, status,
      submitted_at, reviewed_at, rejection_reason, email_verified, extra_documents,
      document_front_url, document_back_url, selfie_url,
      user:users!user_id(first_name, last_name, email)
    `,
    )
    .order("submitted_at", { ascending: false });

  if (error) {
    console.error(
      "[queries/admin] listAllIdentityVerifications:",
      error.message,
    );
    return [];
  }

  // Cast pour shunter les types Supabase générés (relation `user:users!user_id`
  // non reconnue à la compilation, runtime OK).
  const rows = (data ?? []) as unknown as Array<Record<string, unknown>>;

  // Génère les signed URLs en parallèle via le service_role.
  let adminStorage: ReturnType<typeof createAdminClient> | null = null;
  try {
    adminStorage = createAdminClient();
  } catch (err) {
    console.warn(
      "[queries/admin] service role unavailable, signed URLs skipped:",
      err,
    );
  }

  const sign = async (path: unknown): Promise<string | null> => {
    if (!adminStorage || typeof path !== "string" || !path) return null;
    const { data: signed, error: signErr } = await adminStorage.storage
      .from(IDENTITY_BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
    if (signErr || !signed?.signedUrl) return null;
    return signed.signedUrl;
  };

  return await Promise.all(
    rows.map(async (d): Promise<AdminDocumentRow> => {
      const userRaw = (d as { user?: unknown }).user;
      const user = Array.isArray(userRaw)
        ? (userRaw[0] as Record<string, unknown> | undefined)
        : (userRaw as Record<string, unknown> | undefined);

      const fullName = `${(user?.first_name as string) ?? ""} ${
        (user?.last_name as string) ?? ""
      }`.trim();

      // Documents administratifs additionnels (JSONB : [{ kind, label, url }]).
      const rawExtras = Array.isArray(d.extra_documents)
        ? (d.extra_documents as Array<Record<string, unknown>>)
        : [];

      const [frontUrl, backUrl, selfieUrl, ...extraSigned] = await Promise.all([
        sign(d.document_front_url),
        sign(d.document_back_url),
        sign(d.selfie_url),
        ...rawExtras.map((ex) => sign(ex.url)),
      ]);

      const extraDocuments = rawExtras.map((ex, i) => ({
        kind: typeof ex.kind === "string" ? ex.kind : "other",
        label: typeof ex.label === "string" ? ex.label : "Document",
        url: extraSigned[i] ?? null,
      }));

      return {
        id: d.id as string,
        userId: d.user_id as string,
        userName: fullName || "—",
        userEmail: (user?.email as string) ?? "",
        documentType: (d.document_type as string) ?? "OTHER",
        documentNumber: (d.document_number as string | null) ?? null,
        phoneNumber: (d.phone_number as string | null) ?? null,
        status: coerceVerification(d.status),
        submittedAt: d.submitted_at as string,
        reviewedAt: (d.reviewed_at as string | null) ?? null,
        reviewerNotes: (d.rejection_reason as string | null) ?? null,
        emailVerified: Boolean(d.email_verified),
        extraDocuments,
        documentFrontUrl: frontUrl,
        documentBackUrl: backUrl,
        selfieUrl,
      };
    }),
  );
}
