import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Facebook,
  Linkedin,
  Link2,
  Sparkles,
  Twitter,
  User,
} from "lucide-react";

import { BlogPreviewCard } from "@/components/marketing/blog-preview-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/shared/fade-in";
import { RevealOnScroll } from "@/components/shared/reveal-on-scroll";
import {
  BLOG_ARTICLES,
  getArticleBySlug,
  getRelatedArticles,
} from "@/lib/blog-data";

// =============================================================================
// SEO & static params
// =============================================================================

export function generateStaticParams() {
  return BLOG_ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return { title: "Article introuvable | KAZA" };
  const canonical = `/blog/${slug}`;
  return {
    title: `${article.title} — Journal KAZA`,
    description: article.excerpt,
    alternates: { canonical },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url: canonical,
      type: "article",
      images: [article.imageUrl],
      authors: [article.author],
      publishedTime: article.publishedAt,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt,
      images: [article.imageUrl],
    },
  };
}

function formatLongDate(date: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

// =============================================================================
// Page
// =============================================================================

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const related = getRelatedArticles(slug, 3);
  const shareUrl = `https://kaza.africa/blog/${article.slug}`;

  return (
    <div className="bg-white">
      {/* ============== HERO ARTICLE ======================================= */}
      <section className="relative h-[60vh] min-h-[480px] w-full overflow-hidden">
        <Image
          src={article.imageUrl}
          alt={article.title}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-black/85"
        />
        <div className="relative mx-auto flex h-full max-w-5xl flex-col justify-end px-4 pb-16 lg:px-8 lg:pb-20">
          <FadeIn>
            <Link
              href="/blog"
              className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-white/80 transition-colors hover:text-white"
            >
              <ArrowLeft className="size-4" />
              Tous les articles
            </Link>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <Badge className="border-0 bg-white/95 px-3 py-1.5 text-xs font-semibold text-kaza-navy backdrop-blur-md">
                <Sparkles className="mr-1.5 size-3 text-kaza-green" />
                {article.category}
              </Badge>
              <span className="text-xs font-medium uppercase tracking-widest text-white/75">
                {formatLongDate(article.publishedAt)}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-white/75">
                <Clock className="size-3" aria-hidden="true" />
                {article.readingTime} min de lecture
              </span>
            </div>
            <h1 className="font-heading text-4xl font-bold leading-[1.1] text-white drop-shadow-lg sm:text-5xl lg:text-6xl">
              {article.title}
            </h1>
            <p className="mt-6 max-w-3xl text-lg text-white/85 sm:text-xl">
              {article.excerpt}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ============== LAYOUT ARTICLE ===================================== */}
      <section className="relative bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="relative grid gap-12 lg:grid-cols-[80px_minmax(0,1fr)]">
            {/* ---- Sticky social share (desktop) ---- */}
            <aside className="hidden lg:block">
              <div className="sticky top-32 flex flex-col items-center gap-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Partager
                </p>
                <SocialShareButton
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(article.title)}`}
                  label="Partager sur Twitter / X"
                  icon={Twitter}
                />
                <SocialShareButton
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                  label="Partager sur LinkedIn"
                  icon={Linkedin}
                />
                <SocialShareButton
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  label="Partager sur Facebook"
                  icon={Facebook}
                />
                <SocialShareButton
                  href={shareUrl}
                  label="Copier le lien"
                  icon={Link2}
                />
              </div>
            </aside>

            {/* ---- Corps de l'article ---- */}
            <article className="mx-auto w-full max-w-3xl">
              <div
                className="kaza-article-body text-base leading-relaxed text-foreground [&_.lead]:mb-8 [&_.lead]:text-xl [&_.lead]:font-medium [&_.lead]:leading-relaxed [&_.lead]:text-kaza-navy [&_h2]:mt-14 [&_h2]:mb-4 [&_h2]:font-heading [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-kaza-navy [&_h2]:sm:text-3xl [&_p]:mb-5 [&_p]:leading-[1.8] [&_ul]:my-6 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_li]:leading-relaxed [&_a]:text-kaza-blue [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-kaza-navy [&_strong]:font-semibold [&_strong]:text-kaza-navy"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(article.content),
                }}
              />

              {/* Tags */}
              {article.tags.length > 0 && (
                <div className="mt-12 flex flex-wrap gap-2 border-t border-gray-100 pt-8">
                  <span className="mr-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Tags
                  </span>
                  {article.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="rounded-full border-gray-200 px-3 py-1 text-xs font-medium text-kaza-navy"
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Partage mobile */}
              <div className="mt-10 flex items-center justify-center gap-3 lg:hidden">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Partager :
                </span>
                <SocialShareButton
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(article.title)}`}
                  label="Partager sur Twitter / X"
                  icon={Twitter}
                  compact
                />
                <SocialShareButton
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                  label="Partager sur LinkedIn"
                  icon={Linkedin}
                  compact
                />
                <SocialShareButton
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  label="Partager sur Facebook"
                  icon={Facebook}
                  compact
                />
              </div>

              {/* ---- Card auteur ---- */}
              <div className="mt-16 overflow-hidden rounded-3xl border border-gray-100 bg-gradient-to-br from-white via-[#F7F9FC] to-white p-8 shadow-sm">
                <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md">
                    <Image
                      src={`https://ui-avatars.com/api/?name=${article.authorAvatarSeed}&background=1A3A52&color=ffffff&size=160&bold=true`}
                      alt={article.author}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-widest text-kaza-blue">
                      À propos de l&apos;auteur
                    </p>
                    <h3 className="mt-2 font-heading text-xl font-bold text-kaza-navy">
                      {article.author}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {article.authorRole}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-foreground">
                      Contributeur·rice régulier·ère du journal KAZA. Suivez nos
                      publications pour des analyses de terrain et des conseils
                      pratiques.
                    </p>
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    className="shrink-0 gap-2 rounded-full"
                  >
                    <Link href="/blog">
                      <User className="size-4" />
                      Plus d&apos;articles
                    </Link>
                  </Button>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ============== ARTICLES SIMILAIRES ================================ */}
      {related.length > 0 && (
        <section className="bg-gradient-to-b from-white to-[#F4F7FB] py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <FadeIn>
              <div className="mb-12">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-kaza-blue">
                  Continuer la lecture
                </p>
                <h2 className="font-heading text-3xl font-bold text-kaza-navy sm:text-4xl lg:text-5xl">
                  Articles similaires
                </h2>
              </div>
            </FadeIn>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {related.map((rel, i) => (
                <RevealOnScroll key={rel.slug} delay={i * 80}>
                  <BlogPreviewCard
                    slug={rel.slug}
                    title={rel.title}
                    excerpt={rel.excerpt}
                    category={rel.category}
                    readingTime={rel.readingTime}
                    publishedAt={rel.publishedAt}
                    imageUrl={rel.imageUrl}
                    className="rounded-3xl"
                  />
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============== CTA REJOINDRE KAZA ================================= */}
      <section className="relative overflow-hidden bg-gradient-to-br from-kaza-navy via-[#0F2A40] to-kaza-blue py-24 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-32 size-[480px] rounded-full bg-kaza-green/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-32 size-[480px] rounded-full bg-kaza-blue/30 blur-3xl"
        />
        <div className="relative mx-auto max-w-4xl px-4 text-center lg:px-8">
          <Badge className="mb-6 border-0 bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-md">
            Passez à l&apos;action
          </Badge>
          <h2 className="font-heading text-4xl font-bold sm:text-5xl lg:text-6xl">
            Prêt à rejoindre KAZA ?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80 sm:text-xl">
            Trouvez votre logement, publiez votre bien ou pilotez votre
            patrimoine en quelques minutes — la plus grande plateforme
            immobilière d&apos;Afrique vous attend.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full bg-kaza-green px-8 text-base font-semibold hover:bg-kaza-green/90"
            >
              <Link href="/signup">
                Créer un compte gratuit
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-full border-white/40 bg-white/5 px-8 text-base font-semibold text-white backdrop-blur-md hover:bg-white/15"
            >
              <Link href="/search">Voir les annonces</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function SocialShareButton({
  href,
  label,
  icon: Icon,
  compact = false,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  compact?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={
        compact
          ? "inline-flex size-9 items-center justify-center rounded-full border border-gray-200 bg-white text-kaza-navy transition-all hover:scale-110 hover:border-kaza-blue hover:text-kaza-blue"
          : "inline-flex size-11 items-center justify-center rounded-full border border-gray-200 bg-white text-kaza-navy shadow-sm transition-all hover:scale-110 hover:border-kaza-blue hover:text-kaza-blue hover:shadow-md"
      }
    >
      <Icon className={compact ? "size-4" : "size-[18px]"} />
    </a>
  );
}
