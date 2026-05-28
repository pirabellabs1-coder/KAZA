import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Compass,
  Globe2,
  GraduationCap,
  HeartHandshake,
  Home,
  Mail,
  MapPin,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

import { GradientCard } from "@/components/marketing/gradient-card";
import { StatCounter } from "@/components/marketing/stat-counter";
import { TestimonialCard } from "@/components/marketing/testimonial-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/shared/fade-in";
import { RevealOnScroll } from "@/components/shared/reveal-on-scroll";

export const metadata: Metadata = {
  title: "Carrières — Construisons l'avenir de l'immobilier africain",
  description:
    "Rejoignez la révolution immobilière en Afrique. 12 talents, 6 nationalités, remote-first, BSPCE pour tous. Découvrez nos postes ouverts chez KAZA.",
  openGraph: {
    title: "Carrières chez KAZA",
    description:
      "Rejoignez l'équipe KAZA et construisez la plus grande plateforme d'immobilier d'Afrique.",
    type: "website",
  },
};

// =============================================================================
// JOBS — exporté pour [slug]/page.tsx (NE PAS RENOMMER)
// =============================================================================

export const JOBS = [
  {
    slug: "senior-frontend-engineer",
    title: "Senior Frontend Engineer",
    location: "Cotonou / Remote",
    type: "CDI",
    team: "Engineering",
    summary:
      "Vous architecturez et faites évoluer notre application Next.js 15 utilisée par des dizaines de milliers de visiteurs chaque mois.",
  },
  {
    slug: "senior-backend-engineer",
    title: "Senior Backend Engineer",
    location: "Cotonou / Remote",
    type: "CDI",
    team: "Engineering",
    summary:
      "Vous concevez nos API, schémas Postgres/PostGIS et l'intégration avec KAZA Pay, Twilio et Resend.",
  },
  {
    slug: "product-designer",
    title: "Product Designer",
    location: "Lomé / Remote",
    type: "CDI",
    team: "Design",
    summary:
      "Vous portez la voix de nos utilisateurs et façonnez l'expérience de bout en bout — du parcours locataire au tableau de bord propriétaire.",
  },
  {
    slug: "growth-marketing-manager",
    title: "Growth Marketing Manager",
    location: "Cotonou",
    type: "CDI",
    team: "Marketing",
    summary:
      "Vous pilotez l'acquisition, la rétention et nos partenariats locaux pour faire passer KAZA à l'échelle.",
  },
  {
    slug: "customer-success",
    title: "Customer Success",
    location: "Cotonou",
    type: "CDI",
    team: "Operations",
    summary:
      "Vous accompagnez nos utilisateurs propriétaires et locataires, résolvez les litiges et collectez les insights produit.",
  },
  {
    slug: "account-executive",
    title: "Account Executive",
    location: "Abidjan",
    type: "CDI",
    team: "Sales",
    summary:
      "Vous ouvrez le marché ivoirien : agences immobilières, résidences universitaires, gestionnaires de patrimoine.",
  },
];

// =============================================================================
// Constantes
// =============================================================================

const PERKS = [
  {
    variant: "navy" as const,
    icon: HeartHandshake,
    title: "Mission à impact",
    description:
      "Transformez l'accès au logement pour des millions d'Africains. Chaque ligne de code, chaque visite vendue, chaque litige résolu compte.",
  },
  {
    variant: "blue" as const,
    icon: Globe2,
    title: "Équipe panafricaine",
    description:
      "12 talents répartis entre Cotonou, Lomé, Abidjan et Dakar. Six nationalités, une seule ambition.",
  },
  {
    variant: "green" as const,
    icon: TrendingUp,
    title: "BSPCE pour tous",
    description:
      "Tous les employés participent au capital de l'aventure. Salaires compétitifs marché + équité réelle.",
  },
  {
    variant: "navy" as const,
    icon: Home,
    title: "Remote-first",
    description:
      "Hubs physiques à Cotonou et Lomé, télétravail intégral possible. Équipement fourni, internet pris en charge.",
  },
  {
    variant: "blue" as const,
    icon: GraduationCap,
    title: "Apprentissage continu",
    description:
      "Budget formation annuel, conférences, mentorat. Nous investissons en vous comme vous investissez en nous.",
  },
  {
    variant: "green" as const,
    icon: Sparkles,
    title: "Salaires compétitifs",
    description:
      "Grille transparente alignée sur le marché tech panafricain. Revue annuelle systématique.",
  },
];

const TEAMS = [
  "Tous",
  "Engineering",
  "Design",
  "Marketing",
  "Sales",
  "Operations",
];

const PROCESS_STEPS = [
  {
    number: "01",
    title: "Candidature",
    description: "Envoyez CV + quelques lignes. Nous répondons sous 48h.",
  },
  {
    number: "02",
    title: "Entretien découverte",
    description: "30 min en visio avec la Talent Manager pour faire connaissance.",
  },
  {
    number: "03",
    title: "Test métier",
    description: "Mise en situation courte sur un cas réel, pertinente et payée.",
  },
  {
    number: "04",
    title: "Décision en 5 jours",
    description: "Retour final sous 5 jours ouvrés. Offre détaillée par écrit.",
  },
];

const TESTIMONIALS = [
  {
    id: "team-aicha",
    name: "Aïcha Soglo",
    role: "Tech Lead Engineering",
    avatarSeed: "Aicha+Soglo",
    rating: 5,
    quote:
      "Une stack moderne, une équipe brillante et une mission qui a du sens pour le continent. Je n'ai jamais autant appris en aussi peu de temps.",
    city: "Cotonou",
    highlight: "Stack moderne",
  },
  {
    id: "team-mehdi",
    name: "Mehdi Toure",
    role: "Senior Product Designer",
    avatarSeed: "Mehdi+Toure",
    rating: 5,
    quote:
      "Le ratio impact / autonomie est imbattable. Mes choix de design touchent des milliers d'utilisateurs chaque semaine, sans bureaucratie inutile.",
    city: "Lomé",
    highlight: "Impact réel",
  },
  {
    id: "team-leila",
    name: "Leïla Benali",
    role: "Head of Customer Success",
    avatarSeed: "Leila+Benali",
    rating: 5,
    quote:
      "Travailler à 100% remote depuis Abidjan tout en faisant partie d'une équipe ultra-soudée : c'est ce que je cherchais depuis dix ans.",
    city: "Abidjan",
    highlight: "Remote-first",
  },
];

const TEAM_HERO_IMAGE =
  "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=2000&q=80";

// =============================================================================
// Page
// =============================================================================

export default function CarrieresPage() {
  return (
    <div className="bg-white">
      {/* ============== HERO IMMERSIF ====================================== */}
      <section className="relative h-[80vh] min-h-[640px] w-full overflow-hidden">
        <Image
          src={TEAM_HERO_IMAGE}
          alt="L'équipe KAZA en réunion"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/55 to-black/85"
        />
        <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-20 lg:px-8 lg:pb-28">
          <FadeIn>
            <Badge className="mb-6 inline-flex border-0 bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-md">
              <Briefcase className="mr-2 size-3 text-kaza-green" />
              Recrutement ouvert
            </Badge>
            <h1 className="max-w-4xl font-heading text-5xl font-bold leading-[1.05] text-white drop-shadow-lg sm:text-6xl lg:text-7xl">
              Construisons l&apos;
              <span className="bg-gradient-to-r from-kaza-green to-white bg-clip-text text-transparent">
                avenir
              </span>{" "}
              de l&apos;immobilier africain ensemble
            </h1>
            <p className="mt-8 max-w-2xl text-lg text-white/85 sm:text-xl">
              Nous construisons la plus grande plateforme d&apos;immobilier
              d&apos;Afrique de l&apos;Ouest. Si vous voulez avoir un impact
              tangible et mesurable, vous êtes au bon endroit.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-full bg-kaza-green px-7 text-base font-semibold shadow-xl hover:bg-kaza-green/90"
              >
                <a href="#postes-ouverts">
                  Voir les {JOBS.length} postes ouverts
                  <ArrowRight className="ml-2 size-4" />
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-full border-white/40 bg-white/10 px-7 text-base font-semibold text-white backdrop-blur-md hover:bg-white/20"
              >
                <a href="#culture">
                  <Compass className="mr-2 size-4" />
                  Notre culture
                </a>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ============== STATS ÉQUIPE ======================================= */}
      <section className="bg-white py-24" id="culture">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <FadeIn>
            <div className="mb-14 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-kaza-blue">
                L&apos;équipe
              </p>
              <h2 className="font-heading text-3xl font-bold text-kaza-navy sm:text-4xl lg:text-5xl">
                Une équipe à taille humaine,
                <br />
                une ambition continentale
              </h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            <RevealOnScroll>
              <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-xl">
                <StatCounter
                  value={12}
                  label="Talents passionnés"
                  description="À temps plein, en croissance"
                />
              </div>
            </RevealOnScroll>
            <RevealOnScroll delay={100}>
              <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-xl">
                <StatCounter
                  value={6}
                  label="Nationalités"
                  description="Bénin, Togo, Sénégal, Côte d'Ivoire…"
                />
              </div>
            </RevealOnScroll>
            <RevealOnScroll delay={200}>
              <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-xl">
                <StatCounter
                  value={100}
                  suffix="%"
                  label="Remote-first"
                  description="Hubs physiques à Cotonou & Lomé"
                />
              </div>
            </RevealOnScroll>
            <RevealOnScroll delay={300}>
              <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-xl">
                <StatCounter
                  value={100}
                  suffix="%"
                  label="BSPCE pour tous"
                  description="Participation au capital systématique"
                />
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* ============== POURQUOI KAZA ====================================== */}
      <section className="bg-gradient-to-b from-[#F4F7FB] to-white py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <FadeIn>
            <div className="mb-12 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-kaza-blue">
                Notre proposition
              </p>
              <h2 className="font-heading text-3xl font-bold text-kaza-navy sm:text-4xl lg:text-5xl">
                Pourquoi rejoindre KAZA
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
                Six raisons concrètes qui font la différence au quotidien.
              </p>
            </div>
          </FadeIn>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PERKS.map((perk, i) => (
              <RevealOnScroll key={perk.title} delay={i * 80}>
                <GradientCard
                  variant={perk.variant}
                  className="h-full rounded-3xl p-8"
                >
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md">
                    <perk.icon className="size-6" aria-hidden="true" />
                  </div>
                  <h3 className="mt-6 font-heading text-2xl font-bold">
                    {perk.title}
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-white/85">
                    {perk.description}
                  </p>
                </GradientCard>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ============== POSTES OUVERTS ===================================== */}
      <section
        id="postes-ouverts"
        className="bg-white py-24 scroll-mt-20"
      >
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <FadeIn>
            <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-kaza-blue">
                  Opportunités
                </p>
                <h2 className="font-heading text-3xl font-bold text-kaza-navy sm:text-4xl lg:text-5xl">
                  Postes ouverts
                </h2>
                <p className="mt-3 text-base text-muted-foreground">
                  {JOBS.length} opportunités à pourvoir. Réponse garantie sous
                  48h.
                </p>
              </div>
            </div>
          </FadeIn>

          {/* Filtres équipes (visuel, pas de JS pour rester RSC) */}
          <div className="-mx-4 mb-10 overflow-x-auto px-4">
            <div className="flex min-w-max items-center gap-2 sm:flex-wrap">
              <span className="mr-2 hidden text-xs font-semibold uppercase tracking-widest text-muted-foreground sm:inline">
                Équipes
              </span>
              {TEAMS.map((team, i) => (
                <span
                  key={team}
                  className={
                    i === 0
                      ? "rounded-full bg-kaza-navy px-5 py-2 text-sm font-semibold text-white shadow-sm"
                      : "rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-medium text-kaza-navy transition hover:border-kaza-blue hover:text-kaza-blue"
                  }
                >
                  {team}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {JOBS.map((job, i) => (
              <RevealOnScroll key={job.slug} delay={i * 60}>
                <Link
                  href={`/carrieres/${job.slug}`}
                  className="group block focus-visible:outline-none"
                >
                  <article className="relative h-full overflow-hidden rounded-3xl border border-gray-100 bg-white p-8 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-kaza-blue/30 hover:shadow-2xl">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <Badge
                          variant="outline"
                          className="rounded-full border-kaza-blue/30 bg-kaza-blue/5 text-xs font-semibold text-kaza-blue"
                        >
                          {job.team}
                        </Badge>
                        <h3 className="mt-4 font-heading text-2xl font-bold leading-tight text-kaza-navy transition-colors group-hover:text-kaza-blue">
                          {job.title}
                        </h3>
                      </div>
                      <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-kaza-blue/5 text-kaza-blue transition-all group-hover:bg-kaza-blue group-hover:text-white">
                        <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="size-3.5" />
                        {job.location}
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="font-semibold text-kaza-navy">
                        {job.type}
                      </span>
                    </div>
                    <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                      {job.summary}
                    </p>
                    <p className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-kaza-blue">
                      Voir le poste
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </p>
                  </article>
                </Link>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ============== PROCESSUS ========================================== */}
      <section className="bg-gradient-to-br from-kaza-navy via-[#0F2A40] to-kaza-navy py-24 text-white">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <FadeIn>
            <div className="mb-14 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-kaza-green">
                Processus de recrutement
              </p>
              <h2 className="font-heading text-3xl font-bold sm:text-4xl lg:text-5xl">
                Simple, transparent, rapide
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-white/75">
                Quatre étapes maximum, décision finale en moins de cinq jours
                ouvrés. Promis.
              </p>
            </div>
          </FadeIn>

          <div className="relative grid gap-8 lg:grid-cols-4">
            {/* Ligne horizontale décorative */}
            <div
              aria-hidden="true"
              className="absolute left-0 right-0 top-12 hidden h-px bg-gradient-to-r from-transparent via-white/20 to-transparent lg:block"
            />

            {PROCESS_STEPS.map((step, i) => (
              <RevealOnScroll key={step.number} delay={i * 100}>
                <div className="relative flex flex-col items-center text-center lg:items-start lg:text-left">
                  <div className="relative z-10 mb-6 flex size-24 items-center justify-center rounded-3xl border border-white/20 bg-gradient-to-br from-kaza-blue/40 to-kaza-navy backdrop-blur-md">
                    <span className="font-heading text-2xl font-bold text-white">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="font-heading text-xl font-bold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/75">
                    {step.description}
                  </p>
                </div>
              </RevealOnScroll>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-3 text-sm text-white/75">
            <CheckCircle2 className="size-5 text-kaza-green" />
            <span>Test métier toujours rémunéré · Process inclusif · Feedback détaillé</span>
          </div>
        </div>
      </section>

      {/* ============== TÉMOIGNAGES ======================================== */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <FadeIn>
            <div className="mb-12 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-kaza-blue">
                Voix de l&apos;équipe
              </p>
              <h2 className="font-heading text-3xl font-bold text-kaza-navy sm:text-4xl lg:text-5xl">
                Ils ont rejoint KAZA
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
                Trois témoignages au-delà des fiches de poste, pour vous donner
                un avant-goût.
              </p>
            </div>
          </FadeIn>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((t, i) => {
              const { id: _id, ...cardProps } = t;
              void _id;
              return (
                <RevealOnScroll key={t.id} delay={i * 100}>
                  <TestimonialCard {...cardProps} />
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============== CTA CANDIDATURE SPONTANÉE ========================== */}
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
          <div className="mx-auto mb-6 inline-flex size-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md">
            <Mail className="size-7 text-kaza-green" aria-hidden="true" />
          </div>
          <h2 className="font-heading text-4xl font-bold sm:text-5xl lg:text-6xl">
            Aucun poste qui vous correspond ?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/85 sm:text-xl">
            Envoyez-nous votre candidature spontanée. Nous embauchons en continu
            et adorons découvrir des profils atypiques.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full bg-kaza-green px-8 text-base font-semibold hover:bg-kaza-green/90"
            >
              <a href="mailto:careers@kaza.africa?subject=Candidature%20spontan%C3%A9e">
                <Mail className="mr-2 size-4" />
                careers@kaza.africa
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-full border-white/40 bg-white/5 px-8 text-base font-semibold text-white backdrop-blur-md hover:bg-white/15"
            >
              <Link href="/about">
                <BookOpen className="mr-2 size-4" />
                Notre histoire
              </Link>
            </Button>
          </div>
          <p className="mt-6 text-xs text-white/55">
            <Users className="mr-1 inline size-3" />
            Réponse garantie sous 5 jours ouvrés.
          </p>
        </div>
      </section>
    </div>
  );
}
