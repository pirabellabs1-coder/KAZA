// =============================================================================
// Kaabo - Blog Data
// Articles complets pour le blog magazine Kaabo. Stockés en HTML formaté
// pour rendu direct via dangerouslySetInnerHTML dans la page article.
//
// Source unique : src/lib/blog/seed/articles.json (10 articles enrichis ≥ 2000
// mots, générés/édités puis assemblés via scripts/assemble-articles.js). Ce même
// JSON sert de fallback statique ET de source de seed pour la table `articles`.
// =============================================================================

import seedArticles from "./blog/seed/articles.json";

export interface BlogArticle {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  authorRole: string;
  authorAvatarSeed: string;
  publishedAt: string; // ISO
  readingTime: number; // minutes
  imageUrl: string;
  content: string; // HTML
  tags: string[];
}

// -----------------------------------------------------------------------------
// BLOG_ARTICLES — 10 articles éditoriaux complets (≥ 2000 mots), chargés depuis
// le JSON source. Triés du plus récent au plus ancien pour l'affichage.
// -----------------------------------------------------------------------------

export const BLOG_ARTICLES: BlogArticle[] = (seedArticles as BlogArticle[])
  .slice()
  .sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

export function getArticleBySlug(slug: string): BlogArticle | undefined {
  return BLOG_ARTICLES.find((article) => article.slug === slug);
}

export function getRelatedArticles(slug: string, limit = 3): BlogArticle[] {
  const current = getArticleBySlug(slug);
  if (!current) {
    return BLOG_ARTICLES.slice(0, limit);
  }
  const scored = BLOG_ARTICLES.filter((a) => a.slug !== slug)
    .map((article) => {
      const sharedTags = article.tags.filter((t) => current.tags.includes(t)).length;
      const sameCategory = article.category === current.category ? 2 : 0;
      return { article, score: sharedTags + sameCategory };
    })
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.article);
}

export function getFeaturedArticle(): BlogArticle {
  return BLOG_ARTICLES[0];
}

export function getAllCategories(): string[] {
  return Array.from(new Set(BLOG_ARTICLES.map((a) => a.category)));
}
