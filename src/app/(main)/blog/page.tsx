import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  GraduationCap,
  Mail,
  ScrollText,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { BlogPreviewCard } from "@/components/marketing/blog-preview-card";
import { InlineNewsletter } from "@/components/marketing/inline-newsletter";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/shared/fade-in";
import { RevealOnScroll } from "@/components/shared/reveal-on-scroll";
import {
  BLOG_ARTICLES,
  getAllCategories,
  getFeaturedArticle,
} from "@/lib/blog-data";

export const metadata: Metadata = {
  title: "Le journal KAZA — Magazine immobilier africain",
  description:
    "Insights, guides pratiques et analyses sur l'immobilier en Afrique : location, colocation, investissement, juridique et innovations.",
  openGraph: {
    title: "Le journal KAZA",
    description:
      "Le magazine éditorial de KAZA : conseils locataires, propriétaires, étudiants et analyses du marché immobilier africain.",
    type: "website",
  },
};

function formatLongDate(date: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

const POPULAR_CATEGORIES = [
  {
    label: "Guide locataire",
    description: "Premiers pas, dossier, sélection de quartier",
    icon: ScrollText,
    accent: "from-kaza-blue/15 to-kaza-blue/0 text-kaza-blue",
  },
  {
    label: "Étudiant",
    description: "Colocation, vie universitaire, budget léger",
    icon: GraduationCap,
    accent: "from-kaza-green/15 to-kaza-green/0 text-kaza-green",
  },
  {
    label: "Investissement",
    description: "Rendements, fiscalité, financement",
    icon: TrendingUp,
    accent: "from-amber-500/15 to-amber-500/0 text-amber-600",
  },
  {
    label: "Juridique & Paiements",
    description: "Bail, escrow, conformité Bénin 2026",
    icon: ShieldCheck,
    accent: "from-purple-500/15 to-purple-500/0 text-purple-600",
  },
];

export default function BlogPage() {
  const featured = getFeaturedArticle();
  const others = BLOG_ARTICLES.filter((a) => a.slug !== featured.slug);
  const categories = ["Tout", ...getAllCategories()];

  return (
    <div className="bg-white">
      {/* ============== HERO MAGAZINE ====================================== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F4F7FB] via-white to-[#F4F7FB]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-32 top-12 size-[420px] rounded-full bg-kaza-blue/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 bottom-12 size-[420px] rounded-full bg-kaza-green/10 blur-3xl"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-24 text-center lg:px-8 lg:py-32">
          <FadeIn>
            <Badge className="mb-6 inline-flex border-0 bg-kaza-navy/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-kaza-navy">
              <Sparkles className="mr-2 size-3 text-kaza-blue" aria-hidden="true" />
              Le journal KAZA
            </Badge>
            <h1 className="font-heading text-5xl font-bold leading-[1.05] text-kaza-navy sm:text-6xl lg:text-7xl">
              Le{" "}
              <span className="bg-gradient-to-r from-kaza-blue to-kaza-green bg-clip-text text-transparent">
                journal
              </span>{" "}
              KAZA
            </h1>
            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Insights, guides pratiques et actualités du marché immobilier
              africain — par celles et ceux qui le font bouger chaque jour.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ============== FILTRE CATÉGORIES =================================== */}
      <section className="border-y border-gray-100 bg-white py-6">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="-mx-4 overflow-x-auto px-4">
            <div className="flex min-w-max items-center gap-2 sm:flex-wrap">
              <span className="mr-2 hidden text-xs font-semibold uppercase tracking-widest text-muted-foreground sm:inline">
                Catégories
              </span>
              {categories.map((cat, i) => (
                <button
                  key={cat}
                  type="button"
                  className={
                    i === 0
                      ? "rounded-full bg-kaza-navy px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-kaza-blue"
                      : "rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-medium text-kaza-navy transition hover:border-kaza-blue hover:text-kaza-blue"
                  }
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============== ARTICLE FEATURED =================================== */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <FadeIn>
            <div className="mb-12 flex items-end justify-between">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-kaza-blue">
                  À la une
                </p>
                <h2 className="font-heading text-3xl font-bold text-kaza-navy sm:text-4xl lg:text-5xl">
                  L&apos;article du moment
                </h2>
              </div>
              <Link
                href={`/blog/${featured.slug}`}
                className="hidden text-sm font-semibold text-kaza-blue hover:underline sm:inline-flex sm:items-center sm:gap-1"
              >
                Lire la suite <ArrowRight className="size-4" />
              </Link>
            </div>
          </FadeIn>

          <Link
            href={`/blog/${featured.slug}`}
            className="group grid gap-0 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl lg:grid-cols-5"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden lg:col-span-3 lg:aspect-auto">
              <Image
                src={featured.imageUrl}
                alt={featured.title}
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              <Badge className="absolute left-5 top-5 border-0 bg-white/95 px-3 py-1.5 text-xs font-semibold text-kaza-navy backdrop-blur-md">
                <Sparkles className="mr-1.5 size-3 text-kaza-green" />
                {featured.category}
              </Badge>
            </div>
            <div className="flex flex-col justify-center gap-6 p-8 lg:col-span-2 lg:p-12">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-kaza-blue">
                Lecture du moment
              </p>
              <h3 className="font-heading text-3xl font-bold leading-tight text-kaza-navy transition-colors group-hover:text-kaza-blue sm:text-4xl">
                {featured.title}
              </h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                {featured.excerpt}
              </p>
              <div className="flex flex-wrap items-center gap-4 border-t border-gray-100 pt-5 text-sm text-muted-foreground">
                <span className="font-semibold text-kaza-navy">
                  {featured.author}
                </span>
                <span className="text-gray-300">•</span>
                <span>{formatLongDate(featured.publishedAt)}</span>
                <span className="text-gray-300">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-3.5" aria-hidden="true" />
                  {featured.readingTime} min
                </span>
              </div>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-kaza-blue">
                Lire l&apos;article
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1.5" />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* ============== GRILLE ARTICLES ==================================== */}
      <section className="bg-gradient-to-b from-white to-[#F7F9FC] py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <FadeIn>
            <div className="mb-12">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-kaza-blue">
                Tous les articles
              </p>
              <h2 className="font-heading text-3xl font-bold text-kaza-navy sm:text-4xl lg:text-5xl">
                Explorez nos analyses
              </h2>
              <p className="mt-4 max-w-2xl text-base text-muted-foreground">
                {others.length} articles édités par notre rédaction et nos
                experts partenaires.
              </p>
            </div>
          </FadeIn>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((article, i) => (
              <RevealOnScroll key={article.slug} delay={i * 80}>
                <BlogPreviewCard
                  slug={article.slug}
                  title={article.title}
                  excerpt={article.excerpt}
                  category={article.category}
                  readingTime={article.readingTime}
                  publishedAt={article.publishedAt}
                  imageUrl={article.imageUrl}
                  className="rounded-3xl"
                />
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ============== CATÉGORIES POPULAIRES ============================== */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <FadeIn>
            <div className="mb-12 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-kaza-blue">
                Univers éditorial
              </p>
              <h2 className="font-heading text-3xl font-bold text-kaza-navy sm:text-4xl lg:text-5xl">
                Catégories populaires
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
                Suivez les thématiques qui vous concernent et restez à la pointe
                des évolutions du marché.
              </p>
            </div>
          </FadeIn>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {POPULAR_CATEGORIES.map((cat, i) => (
              <RevealOnScroll key={cat.label} delay={i * 80}>
                <article className="group relative h-full overflow-hidden rounded-3xl border border-gray-100 bg-white p-8 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl">
                  <div
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${cat.accent} opacity-60 transition-opacity duration-500 group-hover:opacity-100`}
                    aria-hidden="true"
                  />
                  <div className="relative">
                    <div className="mb-5 inline-flex size-14 items-center justify-center rounded-2xl bg-white shadow-md">
                      <cat.icon className="size-6" aria-hidden="true" />
                    </div>
                    <h3 className="font-heading text-xl font-bold text-kaza-navy">
                      {cat.label}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {cat.description}
                    </p>
                    <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-kaza-navy">
                      Explorer
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </article>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ============== NEWSLETTER ========================================= */}
      <section className="relative overflow-hidden bg-kaza-navy py-24 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-24 size-[420px] rounded-full bg-kaza-blue/30 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -right-24 size-[420px] rounded-full bg-kaza-green/30 blur-3xl"
        />
        <div className="relative mx-auto max-w-3xl px-4 text-center lg:px-8">
          <div className="mx-auto mb-6 inline-flex size-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
            <Mail className="size-7 text-kaza-green" aria-hidden="true" />
          </div>
          <h2 className="font-heading text-4xl font-bold sm:text-5xl">
            Recevez nos meilleurs articles
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/75">
            Chaque mois, une sélection éditoriale et nos analyses de marché,
            directement dans votre boîte mail. Pas de spam, désabonnement en un
            clic.
          </p>
          <InlineNewsletter
            source="blog"
            theme="dark"
            className="mx-auto mt-10 max-w-md"
          />
          <p className="mt-5 text-xs text-white/55">
            Données chiffrées, jamais revendues. <Wallet className="ml-1 inline size-3 align-text-bottom" /> Conformité RGPD.
          </p>
        </div>
      </section>
    </div>
  );
}
