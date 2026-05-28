import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  ShieldCheck,
  LineChart,
  Code2,
  Headphones,
  Palette,
  Check,
  X,
  Sparkles,
  PlayCircle,
  ArrowRight,
  Rocket,
  Database,
  Globe,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { StatCounter } from "@/components/marketing/stat-counter";
import { TestimonialCard } from "@/components/marketing/testimonial-card";
import { GradientCard } from "@/components/marketing/gradient-card";
import { RevealOnScroll } from "@/components/shared/reveal-on-scroll";
import { FadeIn } from "@/components/shared/fade-in";
import { GlassPanel } from "@/components/shared/glass-panel";

import { ProDemoForm } from "./pro-demo-form";

export const metadata: Metadata = {
  title: "KAZA Pro — Solution premium pour agences immobilières",
  description:
    "KAZA Pro : plateforme PropTech enterprise pour les agences immobilières en Afrique de l'Ouest. Multi-utilisateurs, analytics, API, support 24/7 et white-label.",
  openGraph: {
    title: "KAZA Pro — la solution PropTech pour les agences immobilières",
    description:
      "Gérez votre agence, votre équipe et votre parc immobilier sur une seule plateforme premium.",
    type: "website",
  },
};

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80";

const formatPrice = (value: number) =>
  `${new Intl.NumberFormat("fr-FR").format(value)} FCFA`;

// =============================================================================
// Logos agences clientes (mock visible en bas du hero)
// =============================================================================

const HERO_AGENCIES = [
  { name: "Premier Immobilier", letters: "PI", color: "#1A3A52" },
  { name: "Bénin Habitat", letters: "BH", color: "#1976D2" },
  { name: "Atlantique Real", letters: "AR", color: "#4CAF50" },
  { name: "Coastline Properties", letters: "CP", color: "#D97706" },
];

// =============================================================================
// Features
// =============================================================================

type ProFeature = {
  title: string;
  description: string;
  icon: typeof Building2;
  variant: "navy" | "blue" | "green" | "sunset";
  metric: string;
};

const proFeatures: ProFeature[] = [
  {
    icon: Users,
    title: "Multi-utilisateurs",
    description:
      "Invitez jusqu'à 50 agents et collaborateurs sur un même espace agence, avec gestion centralisée.",
    metric: "Jusqu'à 50 agents",
    variant: "navy",
  },
  {
    icon: ShieldCheck,
    title: "Permissions par rôle",
    description:
      "Trois niveaux d'accès — Admin, Manager, Agent — pour contrôler finement ce que chacun voit et peut modifier.",
    metric: "3 niveaux d'accès",
    variant: "blue",
  },
  {
    icon: LineChart,
    title: "Analytics avancées",
    description:
      "Suivez en temps réel la performance de chaque agent, les conversions visites et votre chiffre d'affaires mensuel.",
    metric: "Reporting temps réel",
    variant: "green",
  },
  {
    icon: Code2,
    title: "API REST + Webhooks",
    description:
      "Connectez KAZA Pro à votre CRM, ERP ou ATS via notre API documentée et nos webhooks en temps réel.",
    metric: "API 100% REST",
    variant: "blue",
  },
  {
    icon: Headphones,
    title: "Support dédié 24/7",
    description:
      "Un gestionnaire de compte attitré, joignable par WhatsApp, email et téléphone, jour comme nuit.",
    metric: "Réponse < 1h",
    variant: "navy",
  },
  {
    icon: Palette,
    title: "White-label Enterprise",
    description:
      "Personnalisez l'expérience à votre marque : logo, domaine, couleurs, e-mails et signatures de contrats.",
    metric: "Sur mesure",
    variant: "sunset",
  },
];

// =============================================================================
// Plans
// =============================================================================

type ProPlan = {
  name: string;
  tagline: string;
  price: string;
  priceDetail: string;
  description: string;
  features: string[];
  ctaLabel: string;
  highlighted?: boolean;
  badge?: string;
};

const proPlans: ProPlan[] = [
  {
    name: "Agence Starter",
    tagline: "Pour démarrer en confiance",
    price: formatPrice(50000),
    priceDetail: "/ mois",
    description: "L'essentiel pour digitaliser une agence indépendante.",
    features: [
      "Jusqu'à 50 annonces actives",
      "5 utilisateurs inclus",
      "Tableau de bord agence",
      "Support email sous 24h",
      "Export CSV mensuel",
    ],
    ctaLabel: "Commencer Starter",
  },
  {
    name: "Agence Pro",
    tagline: "La référence des agences en croissance",
    price: formatPrice(150000),
    priceDetail: "/ mois",
    description: "La meilleure expérience pour scaler votre activité.",
    features: [
      "Jusqu'à 200 annonces actives",
      "20 utilisateurs inclus",
      "Analytics avancées + reporting",
      "Support prioritaire (réponse < 4h)",
      "Mise en avant des annonces",
      "Badge Agence Vérifiée",
    ],
    ctaLabel: "Demander une démo Pro",
    highlighted: true,
    badge: "Recommandé",
  },
  {
    name: "Enterprise",
    tagline: "Sur-mesure pour les réseaux nationaux",
    price: "Sur devis",
    priceDetail: "annonces illimitées",
    description: "Pour les grands groupes et les réseaux multi-agences.",
    features: [
      "Annonces & utilisateurs illimités",
      "White-label complet",
      "API REST + webhooks dédiés",
      "Gestionnaire de compte dédié",
      "SLA contractuel 99,9%",
      "Onboarding sur site & formations",
    ],
    ctaLabel: "Parler à un expert",
  },
];

type ProComparisonRow = {
  feature: string;
  starter: boolean | string;
  pro: boolean | string;
  enterprise: boolean | string;
};

const proComparison: ProComparisonRow[] = [
  { feature: "Annonces actives", starter: "50", pro: "200", enterprise: "Illimité" },
  { feature: "Utilisateurs équipe", starter: "5", pro: "20", enterprise: "Illimité" },
  { feature: "Tableau de bord agence", starter: true, pro: true, enterprise: true },
  { feature: "Badge Agence Vérifiée", starter: true, pro: true, enterprise: true },
  { feature: "Analytics agence", starter: "De base", pro: "Avancé", enterprise: "Sur-mesure" },
  { feature: "Export comptable", starter: true, pro: true, enterprise: true },
  { feature: "Mise en avant annonces", starter: false, pro: "5 / mois", enterprise: "Illimité" },
  { feature: "API REST + webhooks", starter: false, pro: true, enterprise: true },
  { feature: "Permissions granulaires", starter: false, pro: true, enterprise: true },
  { feature: "Support prioritaire", starter: "Email 24h", pro: "Chat 4h", enterprise: "24/7 < 1h" },
  { feature: "Gestionnaire dédié", starter: false, pro: false, enterprise: true },
  { feature: "White-label complet", starter: false, pro: false, enterprise: true },
  { feature: "SLA contractuel 99,9%", starter: false, pro: false, enterprise: true },
  { feature: "Onboarding sur site", starter: false, pro: false, enterprise: true },
  { feature: "Formations équipe", starter: false, pro: "Webinar", enterprise: "Sur site" },
];

// =============================================================================
// Témoignages
// =============================================================================

const proTestimonials = [
  {
    name: "Aïcha Toko",
    role: "Directrice, Premier Immobilier",
    city: "Cotonou",
    avatarSeed: "Aicha Toko",
    rating: 5,
    quote:
      "KAZA Pro nous a fait gagner 12h par semaine sur la gestion des visites. Mes 8 agents travaillent enfin sur la même base de données, en temps réel.",
    highlight: "12h par semaine",
  },
  {
    name: "Olivier Hounkpatin",
    role: "Gérant, Imoba Patrimoine",
    city: "Porto-Novo",
    avatarSeed: "Olivier Hounkpatin",
    rating: 5,
    quote:
      "L'API nous a permis de connecter KAZA à notre CRM existant en moins d'une semaine. Le support technique est tout simplement exceptionnel.",
    highlight: "moins d'une semaine",
  },
  {
    name: "Mariam Tossou",
    role: "Co-fondatrice, AgenceCalavi",
    city: "Calavi",
    avatarSeed: "Mariam Tossou",
    rating: 5,
    quote:
      "Le white-label est bluffant : nos clients voient notre marque, et nous bénéficions de la puissance technique de KAZA en arrière-plan.",
    highlight: "white-label",
  },
];

// =============================================================================
// Étapes d'onboarding
// =============================================================================

const ONBOARDING_STEPS = [
  {
    step: "01",
    title: "Démo personnalisée",
    description:
      "Un expert KAZA Pro analyse vos besoins et vous présente la plateforme adaptée à votre agence.",
    icon: PlayCircle,
  },
  {
    step: "02",
    title: "Onboarding équipe",
    description:
      "Formation initiale de vos agents, paramétrage des rôles et création de votre espace agence.",
    icon: Users,
  },
  {
    step: "03",
    title: "Migration de vos annonces",
    description:
      "Nous importons votre catalogue existant (CSV, API, scraping) et vérifions chaque annonce.",
    icon: Database,
  },
  {
    step: "04",
    title: "Mise en ligne",
    description:
      "Votre agence est visible sur KAZA, intégrée à votre site et à vos canaux marketing.",
    icon: Rocket,
  },
];

// =============================================================================
// FAQ Pro
// =============================================================================

const PRO_FAQ = [
  {
    q: "Puis-je migrer mes annonces existantes depuis un autre logiciel ?",
    a: "Oui. Notre équipe Onboarding prend en charge la migration de votre catalogue (CSV, Excel, API ou export d'un CRM). La migration est incluse dans tous nos plans, sans frais cachés.",
  },
  {
    q: "Combien d'utilisateurs puis-je ajouter à mon agence ?",
    a: "Le plan Starter permet 5 utilisateurs, le plan Pro jusqu'à 20, et l'Enterprise est illimité. Chaque utilisateur reçoit un compte personnel avec ses propres permissions (Admin, Manager ou Agent).",
  },
  {
    q: "Comment fonctionne l'API REST de KAZA Pro ?",
    a: "L'API REST permet de synchroniser vos annonces, contacts et transactions avec votre CRM ou ERP. Nous fournissons une documentation complète, des SDK Node.js et Python, ainsi qu'un environnement de sandbox.",
  },
  {
    q: "Y a-t-il un engagement contractuel ?",
    a: "Les plans Starter et Pro sont sans engagement (résiliables à tout moment). Le plan Enterprise s'accompagne d'un contrat annuel avec SLA garanti à 99,9% et conditions négociables.",
  },
  {
    q: "Le white-label est-il vraiment personnalisable ?",
    a: "Oui, intégralement. Logo, palette de couleurs, domaine personnalisé (agence.votredomaine.com), e-mails transactionnels, modèles de contrats : tout porte votre marque.",
  },
];

// =============================================================================
// Helpers
// =============================================================================

function renderCell(value: boolean | string) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="mx-auto size-5 text-kaza-green" aria-label="Inclus" />
    ) : (
      <X className="mx-auto size-5 text-gray-300" aria-label="Non inclus" />
    );
  }
  return <span className="font-medium text-kaza-navy">{value}</span>;
}

// =============================================================================
// Page
// =============================================================================

export default function ProPage() {
  return (
    <div className="overflow-hidden">
      {/* ===== HERO IMMERSIF h-[85vh] ===================================== */}
      <section className="relative flex min-h-[85vh] w-full items-center justify-center overflow-hidden bg-kaza-navy text-white">
        <Image
          src={HERO_IMAGE}
          alt="Bureau d'agence immobilière moderne"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-40"
        />
        {/* Overlay gradient noir → kaza-navy */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-kaza-navy/85 to-kaza-navy" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(76,175,80,0.18),transparent_55%)]" />

        <div className="relative mx-auto max-w-6xl px-4 py-24 text-center lg:px-8">
          <FadeIn>
            <Badge className="mb-6 border-0 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-kaza-navy shadow-lg">
              <Sparkles className="mr-1.5 size-3.5" />
              PropTech Enterprise
            </Badge>
          </FadeIn>

          <FadeIn delay={120}>
            <h1 className="font-heading text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              KAZA Pro pour les{" "}
              <span className="bg-gradient-to-r from-kaza-green via-emerald-300 to-kaza-blue bg-clip-text text-transparent">
                agences immobilières
              </span>
            </h1>
          </FadeIn>

          <FadeIn delay={240}>
            <p className="mx-auto mt-8 max-w-2xl text-lg text-white/85 sm:text-xl">
              Une plateforme tout-en-un pour piloter votre équipe, votre parc
              d&apos;annonces, vos visites et vos contrats. Conçue pour les agences
              ambitieuses qui dominent leur marché.
            </p>
          </FadeIn>

          <FadeIn delay={360}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="rounded-full border border-white/20 bg-white/15 px-8 text-base font-semibold text-white shadow-2xl backdrop-blur-md transition-all hover:bg-white/25 hover:shadow-amber-500/20"
              >
                <a href="#demo">
                  Demander une démo
                  <ArrowRight className="ml-2 size-4" />
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-white/30 bg-transparent px-8 text-base text-white backdrop-blur-md hover:bg-white/10 hover:text-white"
              >
                <a href="#tarifs">Voir les tarifs</a>
              </Button>
            </div>
          </FadeIn>

          {/* Logos agences clientes */}
          <FadeIn delay={500}>
            <div className="mt-16">
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
                Déjà 120+ agences nous font confiance
              </p>
              <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
                {HERO_AGENCIES.map((agency) => (
                  <div
                    key={agency.name}
                    className="flex items-center gap-2.5 opacity-80 transition-opacity hover:opacity-100"
                  >
                    <span
                      className="flex size-10 items-center justify-center rounded-full text-xs font-bold text-white ring-2 ring-white/20"
                      style={{ backgroundColor: agency.color }}
                      aria-hidden="true"
                    >
                      {agency.letters}
                    </span>
                    <span className="text-sm font-medium text-white/85">
                      {agency.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ===== STATS bandeau gradient subtil =============================== */}
      <section className="relative bg-gradient-to-br from-white via-blue-50/40 to-emerald-50/40 py-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid grid-cols-2 gap-10 sm:gap-14 lg:grid-cols-4">
            <RevealOnScroll>
              <StatCounter value={120} suffix="+" label="Agences clientes" description="Au Bénin & Afrique de l'Ouest" />
            </RevealOnScroll>
            <RevealOnScroll delay={100}>
              <StatCounter value={8500} suffix="+" label="Annonces gérées" description="Mises à jour temps réel" />
            </RevealOnScroll>
            <RevealOnScroll delay={200}>
              <StatCounter value={92} suffix="%" label="Satisfaction clients" description="Mesurée chaque trimestre" />
            </RevealOnScroll>
            <RevealOnScroll delay={300}>
              <StatCounter value={24} suffix="/7" label="Support dédié" description="Réponse garantie < 1h" />
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* ===== 6 FEATURES GRID 3 COLS ===================================== */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <RevealOnScroll>
            <div className="mb-16 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-kaza-blue">
                Fonctionnalités
              </p>
              <h2 className="mt-3 font-heading text-4xl font-bold tracking-tight text-kaza-navy sm:text-5xl">
                Tout ce dont une agence{" "}
                <span className="bg-gradient-to-r from-kaza-blue to-kaza-green bg-clip-text text-transparent">
                  moderne
                </span>{" "}
                a besoin
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
                Six outils premium pensés pour faire grandir votre agence sans
                complexité technique.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {proFeatures.map((feature, idx) => {
              const Icon = feature.icon;
              const isGradient = idx % 2 === 1;

              return (
                <RevealOnScroll key={feature.title} delay={idx * 80}>
                  {isGradient ? (
                    <GradientCard
                      variant={feature.variant}
                      className="group h-full rounded-3xl p-8 shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
                    >
                      <div className="flex size-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                        <Icon className="size-7" />
                      </div>
                      <h3 className="mt-6 font-heading text-2xl font-bold">
                        {feature.title}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-white/85">
                        {feature.description}
                      </p>
                      <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-white/70">
                        {feature.metric}
                      </p>
                    </GradientCard>
                  ) : (
                    <article className="group flex h-full flex-col rounded-3xl border border-gray-100 bg-white p-8 shadow-md transition-all duration-500 hover:-translate-y-2 hover:border-kaza-blue/30 hover:shadow-2xl">
                      <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-kaza-blue/15 to-kaza-green/15 text-kaza-blue transition-transform group-hover:scale-110">
                        <Icon className="size-7" />
                      </div>
                      <h3 className="mt-6 font-heading text-2xl font-bold text-kaza-navy">
                        {feature.title}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {feature.description}
                      </p>
                      <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-kaza-green">
                        {feature.metric}
                      </p>
                    </article>
                  )}
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== TARIFS 3 PLANS PREMIUM ====================================== */}
      <section
        id="tarifs"
        className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-24"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 top-32 size-96 rounded-full bg-kaza-blue/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 bottom-32 size-96 rounded-full bg-kaza-green/10 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
          <RevealOnScroll>
            <div className="mb-16 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-kaza-blue">
                Tarifs
              </p>
              <h2 className="mt-3 font-heading text-4xl font-bold tracking-tight text-kaza-navy sm:text-5xl">
                Choisissez la formule{" "}
                <span className="bg-gradient-to-r from-amber-500 to-kaza-blue bg-clip-text text-transparent">
                  adaptée
                </span>{" "}
                à votre agence
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
                Trois plans transparents. Pas de frais cachés. Tous les plans
                incluent la migration de vos annonces.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid gap-8 lg:grid-cols-3">
            {proPlans.map((plan, idx) => (
              <RevealOnScroll key={plan.name} delay={idx * 100}>
                <div
                  className={
                    "relative flex h-full flex-col rounded-3xl p-10 transition-all duration-500 hover:-translate-y-2 " +
                    (plan.highlighted
                      ? "border-2 border-kaza-blue bg-white shadow-2xl ring-4 ring-kaza-blue/10 lg:scale-105"
                      : "border border-gray-200 bg-white shadow-md hover:shadow-2xl")
                  }
                >
                  {plan.badge && (
                    <Badge className="absolute -top-4 left-1/2 -translate-x-1/2 border-0 bg-gradient-to-r from-kaza-blue to-kaza-green px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white shadow-lg">
                      <Sparkles className="mr-1 size-3" />
                      {plan.badge}
                    </Badge>
                  )}

                  <div className="mb-6">
                    <h3 className="font-heading text-2xl font-bold text-kaza-navy">
                      {plan.name}
                    </h3>
                    <p className="mt-1 text-sm text-kaza-blue">{plan.tagline}</p>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="font-heading text-5xl font-bold text-kaza-navy">
                      {plan.price}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {plan.priceDetail}
                    </span>
                  </div>

                  <p className="mt-4 text-sm text-muted-foreground">
                    {plan.description}
                  </p>

                  <ul className="mt-8 flex-1 space-y-3.5 text-sm">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-3">
                        <span
                          className={
                            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full " +
                            (plan.highlighted
                              ? "bg-gradient-to-br from-kaza-blue to-kaza-green text-white"
                              : "bg-kaza-green/15 text-kaza-green")
                          }
                        >
                          <Check className="size-3.5" />
                        </span>
                        <span className="text-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    asChild
                    size="lg"
                    className={
                      "mt-10 w-full rounded-full text-base font-semibold " +
                      (plan.highlighted
                        ? "bg-gradient-to-r from-kaza-blue to-kaza-green text-white shadow-lg hover:from-kaza-blue/90 hover:to-kaza-green/90"
                        : "bg-kaza-navy text-white hover:bg-kaza-navy/90")
                    }
                  >
                    <a href="#demo">{plan.ctaLabel}</a>
                  </Button>
                </div>
              </RevealOnScroll>
            ))}
          </div>

          {/* Comparatif détaillé 15 lignes */}
          <RevealOnScroll>
            <div className="mt-24">
              <h3 className="text-center font-heading text-3xl font-bold text-kaza-navy">
                Comparatif détaillé des 3 formules
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
                Une vision claire de ce que chaque plan vous apporte.
              </p>
              <div className="mt-10 overflow-x-auto rounded-3xl border border-gray-100 bg-white shadow-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gradient-to-r from-kaza-navy via-[#0F2A40] to-kaza-navy text-white">
                    <tr>
                      <th className="px-6 py-5 font-semibold">Fonctionnalité</th>
                      <th className="px-6 py-5 text-center font-semibold">Starter</th>
                      <th className="px-6 py-5 text-center font-semibold">
                        <span className="inline-flex items-center gap-1.5">
                          <Sparkles className="size-4 text-amber-300" />
                          Pro
                        </span>
                      </th>
                      <th className="px-6 py-5 text-center font-semibold">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proComparison.map((row, idx) => (
                      <tr
                        key={row.feature}
                        className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/60"}
                      >
                        <td className="px-6 py-4 font-medium text-foreground">
                          {row.feature}
                        </td>
                        <td className="px-6 py-4 text-center">{renderCell(row.starter)}</td>
                        <td className="px-6 py-4 text-center">{renderCell(row.pro)}</td>
                        <td className="px-6 py-4 text-center">{renderCell(row.enterprise)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ===== TÉMOIGNAGES AGENCES ========================================= */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <RevealOnScroll>
            <div className="mb-16 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-kaza-blue">
                Témoignages
              </p>
              <h2 className="mt-3 font-heading text-4xl font-bold tracking-tight text-kaza-navy sm:text-5xl">
                Des agences béninoises{" "}
                <span className="bg-gradient-to-r from-kaza-green to-kaza-blue bg-clip-text text-transparent">
                  qui ont franchi le pas
                </span>
              </h2>
            </div>
          </RevealOnScroll>
          <div className="grid gap-8 md:grid-cols-3">
            {proTestimonials.map((t, idx) => (
              <RevealOnScroll key={t.name} delay={idx * 100}>
                <TestimonialCard {...t} className="h-full rounded-3xl shadow-md hover:shadow-2xl" />
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ===== COMMENT ÇA MARCHE — 4 étapes ================================ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-kaza-navy via-[#0F2A40] to-kaza-navy py-24 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-32 size-96 rounded-full bg-kaza-green/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-32 size-96 rounded-full bg-kaza-blue/25 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
          <RevealOnScroll>
            <div className="mb-16 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-kaza-green">
                Mise en route
              </p>
              <h2 className="mt-3 font-heading text-4xl font-bold tracking-tight sm:text-5xl">
                Comment{" "}
                <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">
                  ça marche
                </span>
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg text-white/75">
                De la démo à la mise en ligne, 4 étapes simples accompagnées par
                votre équipe KAZA dédiée.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ONBOARDING_STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <RevealOnScroll key={step.step} delay={idx * 120}>
                  <GlassPanel
                    tint="navy"
                    intensity="strong"
                    className="h-full rounded-3xl p-8 transition-transform hover:-translate-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-heading text-5xl font-bold text-white/15">
                        {step.step}
                      </span>
                      <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-kaza-green to-kaza-blue text-white shadow-lg">
                        <Icon className="size-6" />
                      </div>
                    </div>
                    <h3 className="mt-6 font-heading text-xl font-bold text-white">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-white/75">
                      {step.description}
                    </p>
                  </GlassPanel>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== CTA "Demander une démo" ===================================== */}
      <section id="demo" className="relative bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-kaza-navy via-[#0F2A40] to-kaza-navy p-2 shadow-2xl">
            <div className="grid gap-12 rounded-[2.25rem] bg-kaza-navy/95 p-8 text-white sm:p-12 lg:grid-cols-2 lg:p-16">
              <div>
                <Badge className="mb-5 border-kaza-green/40 bg-kaza-green/15 text-kaza-green">
                  <Sparkles className="mr-1 size-3" />
                  Démo personnalisée
                </Badge>
                <h2 className="font-heading text-4xl font-bold sm:text-5xl">
                  Parlons de{" "}
                  <span className="bg-gradient-to-r from-amber-300 to-kaza-green bg-clip-text text-transparent">
                    votre agence
                  </span>
                </h2>
                <p className="mt-5 text-lg text-white/80">
                  Réservez une démo personnalisée de 30 minutes avec notre équipe
                  Pro. Nous vous montrerons comment KAZA peut s&apos;intégrer à
                  votre flux actuel et accélérer votre croissance.
                </p>
                <ul className="mt-10 space-y-4 text-sm text-white/85">
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-kaza-green/20 text-kaza-green">
                      <Check className="size-3.5" />
                    </span>
                    Démo adaptée à votre taille d&apos;agence
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-kaza-green/20 text-kaza-green">
                      <Check className="size-3.5" />
                    </span>
                    Devis et plan de migration sous 48h
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-kaza-green/20 text-kaza-green">
                      <Check className="size-3.5" />
                    </span>
                    Aucun engagement, aucune carte requise
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-kaza-green/20 text-kaza-green">
                      <Check className="size-3.5" />
                    </span>
                    Migration de vos annonces incluse
                  </li>
                </ul>

                <div className="mt-10 flex items-center gap-3 text-sm text-white/70">
                  <Globe className="size-5" />
                  <span>+229 60 00 00 00 · pro@kaza.africa</span>
                </div>
              </div>

              <ProDemoForm />
            </div>
          </div>
        </div>
      </section>

      {/* ===== FAQ Pro ===================================================== */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-24">
        <div className="mx-auto max-w-3xl px-4 lg:px-8">
          <RevealOnScroll>
            <div className="mb-12 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-kaza-blue">
                FAQ
              </p>
              <h2 className="mt-3 font-heading text-4xl font-bold tracking-tight text-kaza-navy sm:text-5xl">
                Vos questions, nos réponses
              </h2>
            </div>
          </RevealOnScroll>

          <RevealOnScroll>
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl sm:p-10">
              <Accordion type="single" collapsible className="w-full">
                {PRO_FAQ.map((item, idx) => (
                  <AccordionItem key={item.q} value={`item-${idx}`}>
                    <AccordionTrigger className="text-left font-heading text-base font-semibold text-kaza-navy sm:text-lg">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-base leading-relaxed text-muted-foreground">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </RevealOnScroll>

          <RevealOnScroll>
            <div className="mt-10 text-center">
              <p className="text-muted-foreground">
                Une autre question ?{" "}
                <Link
                  href="mailto:pro@kaza.africa"
                  className="font-semibold text-kaza-blue underline-offset-4 hover:underline"
                >
                  Écrivez-nous à pro@kaza.africa
                </Link>
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </section>
    </div>
  );
}
