import "server-only";

import {
  listPublishedArticles,
  getPublishedArticleBySlug,
  type Article,
} from "@/lib/queries/articles";
import { BLOG_ARTICLES, type BlogArticle } from "@/lib/blog-data";

// =============================================================================
// Kaabo — Source unifiée du blog public.
// Les articles rédigés en base (admin/contributeurs) sont prioritaires ; les
// articles statiques historiques complètent la liste tant que peu d'articles
// réels existent. Mapping DB `Article` → forme `BlogArticle` attendue par l'UI.
// =============================================================================

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1200&q=80";

function toBlogArticle(a: Article): BlogArticle {
  const author = a.authorName || "Équipe Kaabo";
  return {
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt || "",
    category: a.category || "Actualités",
    author,
    authorRole: a.authorRole || "Rédaction Kaabo",
    authorAvatarSeed: author.replace(/\s+/g, "+"),
    publishedAt: a.publishedAt || a.createdAt,
    readingTime: a.readMinutes || 3,
    imageUrl: a.coverImageUrl || DEFAULT_COVER,
    content: a.content || "",
    tags: a.category ? [a.category] : [],
  };
}

/** Liste complète du blog : articles DB publiés (récents d'abord) + statiques. */
export async function getBlogList(): Promise<BlogArticle[]> {
  const dbArticles = (await listPublishedArticles(100)).map(toBlogArticle);
  const seen = new Set(dbArticles.map((a) => a.slug));
  const staticOnes = BLOG_ARTICLES.filter((a) => !seen.has(a.slug));
  return [...dbArticles, ...staticOnes];
}

/** Récupère un article par slug : DB publié d'abord, sinon statique. */
export async function getBlogArticle(slug: string): Promise<BlogArticle | null> {
  const db = await getPublishedArticleBySlug(slug);
  if (db) return toBlogArticle(db);
  return BLOG_ARTICLES.find((a) => a.slug === slug) ?? null;
}
