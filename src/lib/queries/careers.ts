import "server-only";

import { createClient } from "@/lib/supabase/server";

// =============================================================================
// Kaabo — Queries Careers (server-side)
// Lecture des offres d'emploi `job_offers`.
// - `listPublishedJobOffers`  : page publique /carrieres
// - `getJobOfferBySlug`       : page publique /carrieres/[slug]
// - `listAllJobOffers`        : back-office admin /admin/careers
//
// Les types Supabase auto-générés ne connaissent pas encore la table
// `job_offers` (migration récente). On bypass volontairement via `as any` —
// la sécurité reste assurée par les policies RLS.
// =============================================================================

export interface JobOffer {
  id: string;
  slug: string;
  title: string;
  department: string;
  location: string;
  contract: "CDI" | "CDD" | "STAGE" | "FREELANCE" | "ALTERNANCE";
  level: string | null;
  summary: string;
  description: string;
  requirements: string | null;
  benefits: string | null;
  salaryRange: string | null;
  applyEmail: string;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface JobOfferRow {
  id: string;
  slug: string;
  title: string;
  department: string;
  location: string;
  contract: JobOffer["contract"];
  level: string | null;
  summary: string;
  description: string;
  requirements: string | null;
  benefits: string | null;
  salary_range: string | null;
  apply_email: string;
  status: JobOffer["status"];
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: JobOfferRow): JobOffer {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    department: row.department,
    location: row.location,
    contract: row.contract,
    level: row.level,
    summary: row.summary,
    description: row.description,
    requirements: row.requirements,
    benefits: row.benefits,
    salaryRange: row.salary_range,
    applyEmail: row.apply_email,
    status: row.status,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Liste les offres publiées, triées de la plus récente à la plus ancienne.
 * Renvoie un tableau vide en cas d'erreur ou d'absence de données.
 */
export async function listPublishedJobOffers(): Promise<JobOffer[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("job_offers")
    .select("*")
    .eq("status", "PUBLISHED")
    .order("published_at", { ascending: false });

  if (error) {
    console.warn("[careers] listPublishedJobOffers:", error.message);
    return [];
  }

  return ((data ?? []) as JobOfferRow[]).map(mapRow);
}

/**
 * Récupère une offre par son slug (toutes statuts confondus côté admin,
 * mais RLS ne renvoie que PUBLISHED aux visiteurs anonymes).
 */
export async function getJobOfferBySlug(slug: string): Promise<JobOffer | null> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("job_offers")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    if (error) console.warn("[careers] getJobOfferBySlug:", error.message);
    return null;
  }

  return mapRow(data as JobOfferRow);
}

/** Récupère une offre par son ID (édition admin). `null` si introuvable. */
export async function getJobOfferById(id: string): Promise<JobOffer | null> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("job_offers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    if (error) console.warn("[careers] getJobOfferById:", error.message);
    return null;
  }

  return mapRow(data as JobOfferRow);
}

/**
 * Liste toutes les offres pour le back-office admin (toutes statuts).
 * Le passage des policies RLS garantit que seuls les ADMIN voient cette
 * liste complète.
 */
export async function listAllJobOffers(): Promise<JobOffer[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("job_offers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[careers] listAllJobOffers:", error.message);
    return [];
  }

  return ((data ?? []) as JobOfferRow[]).map(mapRow);
}
