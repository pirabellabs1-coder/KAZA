import "server-only";

import type { MetadataRoute } from "next";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { JOBS } from "@/app/(main)/carrieres/page";

// =============================================================================
// KAZA - Sitemap dynamique
// Wave 4 - Aminata Traore
//
// Construit le sitemap a partir de :
//  - URLs statiques marketing / legales / auth
//  - URLs dynamiques des proprietes ACTIVES (Supabase + fallback mock)
//  - URLs dynamiques des offres d'emploi (export `JOBS` de carrieres/page)
// =============================================================================

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://kaza.africa";

// Regenere le sitemap au plus une fois par heure (ISR). Evite un hit DB a
// chaque requete tout en gardant les nouvelles annonces indexables rapidement.
export const revalidate = 3600;

type SitemapEntry = MetadataRoute.Sitemap[number];

// ---------------------------------------------------------------------------
// URLs statiques
// ---------------------------------------------------------------------------

const STATIC_PAGES: Array<{
  path: string;
  changeFrequency: SitemapEntry["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "daily", priority: 1.0 },
  { path: "/search", changeFrequency: "daily", priority: 0.9 },
  { path: "/properties", changeFrequency: "daily", priority: 0.9 },
  { path: "/maisons", changeFrequency: "daily", priority: 0.8 },
  { path: "/appartements", changeFrequency: "daily", priority: 0.8 },
  { path: "/colocation", changeFrequency: "weekly", priority: 0.7 },
  { path: "/student-living", changeFrequency: "weekly", priority: 0.8 },
  { path: "/properties/compare", changeFrequency: "monthly", priority: 0.5 },
  { path: "/neighborhoods/compare", changeFrequency: "monthly", priority: 0.5 },
  { path: "/about", changeFrequency: "monthly", priority: 0.5 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.6 },
  { path: "/pro", changeFrequency: "monthly", priority: 0.6 },
  { path: "/plus", changeFrequency: "monthly", priority: 0.6 },
  { path: "/partners", changeFrequency: "monthly", priority: 0.5 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.5 },
  { path: "/help", changeFrequency: "monthly", priority: 0.5 },
  { path: "/guide-proprietaire", changeFrequency: "monthly", priority: 0.5 },
  { path: "/securite", changeFrequency: "monthly", priority: 0.5 },
  { path: "/how-it-works", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.4 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.6 },
  { path: "/status", changeFrequency: "daily", priority: 0.3 },
  { path: "/carrieres", changeFrequency: "weekly", priority: 0.6 },
  { path: "/legal/cgu", changeFrequency: "yearly", priority: 0.3 },
  { path: "/legal/mentions-legales", changeFrequency: "yearly", priority: 0.3 },
  { path: "/legal/confidentialite", changeFrequency: "yearly", priority: 0.3 },
  { path: "/legal/cookies", changeFrequency: "yearly", priority: 0.3 },
  { path: "/login", changeFrequency: "yearly", priority: 0.4 },
  { path: "/signup", changeFrequency: "yearly", priority: 0.4 },
];

// ---------------------------------------------------------------------------
// Loaders dynamiques
// ---------------------------------------------------------------------------

interface PropertySitemapRow {
  id: string;
  updated_at: string | null;
}

async function loadActiveProperties(): Promise<PropertySitemapRow[]> {
  try {
    const supabase = createAdminClient() as unknown as SupabaseClient;
    const { data, error } = await supabase
      .from("properties")
      .select("id, updated_at")
      .eq("status", "AVAILABLE");

    if (error) {
      console.warn("[sitemap] supabase error", error.message);
      return [];
    }
    return (data ?? []) as PropertySitemapRow[];
  } catch (err) {
    console.warn("[sitemap] failed to fetch properties", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Sitemap
// ---------------------------------------------------------------------------

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticUrls: SitemapEntry[] = STATIC_PAGES.map(
    ({ path, changeFrequency, priority }) => ({
      url: `${BASE_URL}${path}`,
      lastModified: now,
      changeFrequency,
      priority,
    })
  );

  const properties = await loadActiveProperties();
  const propertyUrls: SitemapEntry[] = properties.map((property) => ({
    url: `${BASE_URL}/properties/${property.id}`,
    lastModified: property.updated_at ? new Date(property.updated_at) : now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const jobUrls: SitemapEntry[] = JOBS.map((job) => ({
    url: `${BASE_URL}/carrieres/${job.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...staticUrls, ...propertyUrls, ...jobUrls];
}
