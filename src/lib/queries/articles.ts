import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

// =============================================================================
// KAZA — Queries Articles (CMS blog). Table `articles` (migration 00044).
// Non encore typée dans src/types/supabase.ts → client générique (loose cast).
// =============================================================================

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string; // HTML enrichi
  coverImageUrl: string | null;
  category: string | null;
  status: "DRAFT" | "PUBLISHED";
  authorId: string | null;
  authorName: string | null; // signature affichée (byline) ou nom du compte
  authorRole: string | null; // fonction affichée sous la signature
  readMinutes: number | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ArticleRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  category: string | null;
  status: "DRAFT" | "PUBLISHED";
  author_id: string | null;
  author_name: string | null;
  author_role: string | null;
  read_minutes: number | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author?: { first_name?: string | null; last_name?: string | null } | null;
}

function mapRow(row: ArticleRow): Article {
  const a = row.author;
  const accountName = a
    ? `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim() || null
    : null;
  // La signature personnalisée (author_name) prime sur le nom du compte.
  const authorName = row.author_name?.trim() || accountName;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content ?? "",
    coverImageUrl: row.cover_image_url,
    category: row.category,
    status: row.status,
    authorId: row.author_id,
    authorName,
    authorRole: row.author_role?.trim() || null,
    readMinutes: row.read_minutes,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function loose(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

const SELECT =
  "id, slug, title, excerpt, content, cover_image_url, category, status, author_id, read_minutes, published_at, created_at, updated_at, author:users!articles_author_id_fkey(first_name, last_name)";

/** Liste les articles publiés, du plus récent au plus ancien. */
export async function listPublishedArticles(
  limit = 50,
): Promise<Article[]> {
  const supabase = await loose();
  const { data, error } = await supabase
    .from("articles")
    .select(SELECT)
    .eq("status", "PUBLISHED")
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.warn("[articles] listPublished:", error.message);
    return [];
  }
  return ((data ?? []) as unknown as ArticleRow[]).map(mapRow);
}

/** Récupère un article publié par son slug (null si introuvable / brouillon). */
export async function getPublishedArticleBySlug(
  slug: string,
): Promise<Article | null> {
  const supabase = await loose();
  const { data } = await supabase
    .from("articles")
    .select(SELECT)
    .eq("slug", slug)
    .eq("status", "PUBLISHED")
    .maybeSingle();
  return data ? mapRow(data as unknown as ArticleRow) : null;
}

/** Récupère un article par id (auteur/admin via RLS). */
export async function getArticleById(id: string): Promise<Article | null> {
  const supabase = await loose();
  const { data } = await supabase
    .from("articles")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();
  return data ? mapRow(data as unknown as ArticleRow) : null;
}

/**
 * Liste les articles visibles par l'utilisateur courant (ses propres articles
 * + tous si admin, grâce aux policies RLS). Inclut brouillons et publiés.
 */
export async function listEditableArticles(): Promise<Article[]> {
  const supabase = await loose();
  const { data, error } = await supabase
    .from("articles")
    .select(SELECT)
    .order("updated_at", { ascending: false });
  if (error) {
    console.warn("[articles] listEditable:", error.message);
    return [];
  }
  return ((data ?? []) as unknown as ArticleRow[]).map(mapRow);
}
