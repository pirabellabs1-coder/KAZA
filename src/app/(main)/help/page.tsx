import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CreditCard,
  FileSignature,
  GraduationCap,
  Mail,
  MessageCircle,
  Phone,
  Search,
  ShieldCheck,
  UserCheck,
  UserCircle2,
  Sparkles,
  CircleDot,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { BlogPreviewCard } from "@/components/marketing/blog-preview-card";
import { RevealOnScroll } from "@/components/shared/reveal-on-scroll";
import { FadeIn } from "@/components/shared/fade-in";
import { GlassPanel } from "@/components/shared/glass-panel";
import { AnimatedGradientBg } from "@/components/shared/animated-gradient-bg";
import { BLOG_ARTICLES } from "@/lib/blog-data";

export const metadata: Metadata = {
  title: "Centre d'aide — KAZA",
  description:
    "Trouvez en quelques secondes les réponses à vos questions sur KAZA : compte, recherche, visite, paiement, contrat, sécurité et colocation étudiante.",
  openGraph: {
    title: "Centre d'aide KAZA",
    description:
      "Toutes les réponses pour utiliser KAZA en toute sérénité. Articles, contact direct et support 7j/7.",
    type: "website",
  },
};

// =============================================================================
// Catégories d'aide (8)
// =============================================================================

type HelpCategory = {
  slug: string;
  title: string;
  description: string;
  articles: number;
  icon: LucideIcon;
  color: string;
  iconColor: string;
};

const HELP_CATEGORIES: HelpCategory[] = [
  {
    slug: "compte",
    title: "Compte & profil",
    description: "Création, connexion, mot de passe, suppression de compte.",
    articles: 14,
    icon: UserCircle2,
    color: "from-kaza-blue/15 to-kaza-blue/5",
    iconColor: "text-kaza-blue",
  },
  {
    slug: "identite",
    title: "Vérification d'identité",
    description: "KYC, pièce d'identité, selfie, badge vérifié.",
    articles: 9,
    icon: UserCheck,
    color: "from-kaza-green/15 to-kaza-green/5",
    iconColor: "text-kaza-green",
  },
  {
    slug: "recherche",
    title: "Recherche d'annonces",
    description: "Filtres, alertes, favoris, carte, suggestions.",
    articles: 18,
    icon: Search,
    color: "from-amber-100 to-amber-50",
    iconColor: "text-amber-700",
  },
  {
    slug: "visite",
    title: "Visites & rendez-vous",
    description: "Demande de visite, créneaux, visite virtuelle 360°.",
    articles: 11,
    icon: CalendarCheck,
    color: "from-violet-100 to-violet-50",
    iconColor: "text-violet-700",
  },
  {
    slug: "paiement",
    title: "Paiements & loyers",
    description: "KAZA Pay, KAZA Wallet, escrow, factures, reçus.",
    articles: 22,
    icon: CreditCard,
    color: "from-rose-100 to-rose-50",
    iconColor: "text-rose-700",
  },
  {
    slug: "contrat",
    title: "Contrats & bail",
    description: "Signature électronique, durée, résiliation, garant.",
    articles: 16,
    icon: FileSignature,
    color: "from-cyan-100 to-cyan-50",
    iconColor: "text-cyan-700",
  },
  {
    slug: "securite",
    title: "Sécurité & confiance",
    description: "Arnaques, signalement, données personnelles, RGPD.",
    articles: 12,
    icon: ShieldCheck,
    color: "from-emerald-100 to-emerald-50",
    iconColor: "text-emerald-700",
  },
  {
    slug: "etudiant",
    title: "Colocation étudiante",
    description: "Matching, charges partagées, règlement intérieur.",
    articles: 10,
    icon: GraduationCap,
    color: "from-indigo-100 to-indigo-50",
    iconColor: "text-indigo-700",
  },
];

// =============================================================================
// Articles populaires (top 5 du blog)
// =============================================================================

const popularArticles = BLOG_ARTICLES.slice(0, 5);

// =============================================================================
// Options de contact direct
// =============================================================================

const CONTACT_OPTIONS = [
  {
    icon: MessageCircle,
    title: "Chat en direct",
    description: "Discutez avec un conseiller, 7j/7 de 8h à 22h.",
    cta: "Démarrer le chat",
    href: "#chat",
    accent: "bg-kaza-blue text-white hover:bg-kaza-navy",
    bg: "from-kaza-blue/15 to-kaza-blue/5",
    iconColor: "text-kaza-blue",
  },
  {
    icon: Mail,
    title: "Support par email",
    description: "Réponse garantie sous 4 heures ouvrées.",
    cta: "contact@pirabellabs.com",
    href: "mailto:contact@pirabellabs.com",
    accent: "bg-kaza-green text-white hover:bg-kaza-green/90",
    bg: "from-kaza-green/15 to-kaza-green/5",
    iconColor: "text-kaza-green",
  },
  {
    icon: MessageCircle,
    title: "Formulaire de contact",
    description: "Décrivez votre demande, réponse rapide garantie.",
    cta: "Nous écrire",
    href: "/contact",
    accent: "bg-amber-500 text-white hover:bg-amber-600",
    bg: "from-amber-100 to-amber-50",
    iconColor: "text-amber-700",
  },
];

export default function HelpPage() {
  return (
    <div className="overflow-hidden">
      {/* ===== HERO ================================================== */}
      <AnimatedGradientBg className="relative flex min-h-[60vh] items-center">
        <div className="relative mx-auto w-full max-w-5xl px-4 py-24 text-center lg:px-8">
          <FadeIn>
            <Badge className="mb-6 border-kaza-blue/20 bg-kaza-blue/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-kaza-blue uppercase">
              <Sparkles className="mr-2 size-3.5" />
              Centre d&apos;aide
            </Badge>
          </FadeIn>
          <FadeIn delay={100}>
            <h1 className="font-heading text-4xl font-bold leading-[1.05] tracking-tight text-kaza-navy sm:text-5xl lg:text-7xl">
              Comment pouvons-nous vous{" "}
              <span className="bg-gradient-to-r from-kaza-blue via-kaza-green to-kaza-blue bg-clip-text text-transparent">
                aider
              </span>{" "}
              ?
            </h1>
          </FadeIn>
          <FadeIn delay={200}>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Articles, guides, support 7j/7 — tout ce qu&apos;il faut pour
              utiliser KAZA en toute sérénité.
            </p>
          </FadeIn>

          <FadeIn delay={300}>
            <div className="mt-10">
              <GlassPanel
                intensity="strong"
                tint="white"
                className="mx-auto max-w-2xl rounded-full border-white/30 bg-white/70 p-2 shadow-xl"
              >
                <form
                  role="search"
                  aria-label="Rechercher dans l'aide"
                  className="flex items-center gap-2"
                >
                  <Search
                    className="ml-4 size-5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    type="search"
                    placeholder="Rechercher un article, un guide…"
                    className="h-12 flex-1 border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
                  />
                  <Button
                    type="submit"
                    size="lg"
                    className="h-12 rounded-full bg-kaza-navy px-6 text-white hover:bg-kaza-blue"
                  >
                    Rechercher
                  </Button>
                </form>
              </GlassPanel>
            </div>
          </FadeIn>
        </div>
      </AnimatedGradientBg>

      {/* ===== 8 CATÉGORIES ========================================= */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <RevealOnScroll>
            <div className="mb-16 text-center">
              <p className="mb-3 text-xs font-semibold tracking-widest text-kaza-blue uppercase">
                Explorer par thème
              </p>
              <h2 className="font-heading text-3xl font-bold text-kaza-navy sm:text-4xl lg:text-5xl">
                Choisissez une catégorie
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                Plus de 100 articles pour répondre à toutes vos questions.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HELP_CATEGORIES.map((cat, i) => {
              const Icon = cat.icon;
              return (
                <RevealOnScroll key={cat.slug} delay={i * 60}>
                  <Link
                    href={`/faq#${cat.slug}`}
                    className="group block h-full focus-visible:rounded-3xl focus-visible:ring-2 focus-visible:ring-kaza-blue focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    <Card
                      className={
                        "h-full rounded-3xl border-gray-100 bg-gradient-to-br p-8 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl " +
                        cat.color
                      }
                    >
                      <div
                        className={
                          "mb-5 inline-flex size-16 items-center justify-center rounded-2xl bg-white shadow-sm transition-transform group-hover:scale-110 " +
                          cat.iconColor
                        }
                      >
                        <Icon className="size-8" />
                      </div>
                      <h3 className="font-heading text-lg font-bold text-kaza-navy transition-colors group-hover:text-kaza-blue">
                        {cat.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {cat.description}
                      </p>
                      <div className="mt-6 flex items-center justify-between">
                        <Badge
                          variant="secondary"
                          className="bg-white/90 text-xs font-semibold"
                        >
                          {cat.articles} articles
                        </Badge>
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-kaza-blue">
                          Voir
                          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </Card>
                  </Link>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== ARTICLES POPULAIRES ================================== */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <RevealOnScroll>
            <div className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="mb-3 text-xs font-semibold tracking-widest text-kaza-blue uppercase">
                  Les plus consultés
                </p>
                <h2 className="font-heading text-3xl font-bold text-kaza-navy sm:text-4xl lg:text-5xl">
                  Articles populaires
                </h2>
              </div>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full"
              >
                <Link href="/blog">
                  Tous les articles
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          </RevealOnScroll>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {popularArticles.map((article, i) => (
              <RevealOnScroll key={article.slug} delay={i * 80}>
                <BlogPreviewCard
                  slug={article.slug}
                  title={article.title}
                  excerpt={article.excerpt}
                  category={article.category}
                  readingTime={article.readingTime}
                  publishedAt={article.publishedAt}
                  imageUrl={article.imageUrl}
                  className="h-full rounded-3xl"
                />
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CONTACT DIRECT ======================================= */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <RevealOnScroll>
            <div className="mb-16 text-center">
              <p className="mb-3 text-xs font-semibold tracking-widest text-kaza-blue uppercase">
                Contact direct
              </p>
              <h2 className="font-heading text-3xl font-bold text-kaza-navy sm:text-4xl lg:text-5xl">
                Parlez directement à notre équipe
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                Nos conseillers vous accompagnent en français et en anglais,
                partout en Afrique.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid gap-6 md:grid-cols-3">
            {CONTACT_OPTIONS.map((option, i) => {
              const Icon = option.icon;
              return (
                <RevealOnScroll key={option.title} delay={i * 100}>
                  <Card
                    className={
                      "group h-full overflow-hidden rounded-3xl border-gray-100 bg-gradient-to-br p-8 text-center shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl " +
                      option.bg
                    }
                  >
                    <div
                      className={
                        "mx-auto mb-6 inline-flex size-20 items-center justify-center rounded-2xl bg-white shadow-lg transition-transform group-hover:scale-110 " +
                        option.iconColor
                      }
                    >
                      <Icon className="size-10" />
                    </div>
                    <h3 className="font-heading text-2xl font-bold text-kaza-navy">
                      {option.title}
                    </h3>
                    <p className="mt-3 text-base text-muted-foreground">
                      {option.description}
                    </p>
                    <Button
                      asChild
                      size="lg"
                      className={"mt-6 rounded-full " + option.accent}
                    >
                      <a href={option.href}>
                        {option.cta}
                        <ArrowRight className="ml-2 size-4" />
                      </a>
                    </Button>
                  </Card>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== STATUS PLATEFORME ==================================== */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-12">
        <div className="mx-auto max-w-5xl px-4 lg:px-8">
          <RevealOnScroll>
            <Link
              href="/status"
              className="group block focus-visible:rounded-3xl focus-visible:ring-2 focus-visible:ring-kaza-green focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <Card className="flex flex-col items-center justify-between gap-4 rounded-3xl border-kaza-green/30 bg-gradient-to-br from-emerald-50 to-kaza-green/5 p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl sm:flex-row sm:gap-6 sm:p-8">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="flex size-12 items-center justify-center rounded-full bg-kaza-green text-white shadow-lg">
                      <CircleDot className="size-5" />
                    </div>
                    <div className="absolute inset-0 size-12 animate-ping rounded-full bg-kaza-green/40" />
                  </div>
                  <div>
                    <p className="font-heading text-base font-bold text-kaza-navy">
                      Tous systèmes opérationnels
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Consultez l&apos;état en temps réel sur la page Statut
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-kaza-green">
                  Voir le statut détaillé
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Card>
            </Link>
          </RevealOnScroll>
        </div>
      </section>

      {/* ===== CTA FINAL ============================================ */}
      <CtaBanner
        title="Toujours bloqué ?"
        description="Contactez notre support 24/7 — notre équipe est là pour vous accompagner à chaque étape."
        primaryAction={{ label: "Nous contacter", href: "/contact" }}
        secondaryAction={{ label: "Voir la FAQ complète", href: "/faq" }}
      />
    </div>
  );
}
