import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  GraduationCap,
  Handshake,
  Home,
  KeyRound,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { GradientCard } from "@/components/marketing/gradient-card";
import { FeatureHighlight } from "@/components/marketing/feature-highlight";

import { FadeIn } from "@/components/shared/fade-in";
import { RevealOnScroll } from "@/components/shared/reveal-on-scroll";
import { GlassPanel } from "@/components/shared/glass-panel";

export const metadata: Metadata = {
  title: "Logement étudiant premium — Colocations vérifiées près des campus",
  description:
    "Trouvez votre colocation idéale partout en Afrique avec KAZA Student Living : annonces vérifiées, baux numériques, matching colocataires près de votre université.",
};

// -----------------------------------------------------------------------------
// Données locales (présentation marketing — pas de logique métier)
// -----------------------------------------------------------------------------

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=2000&q=80";

// Grandes villes universitaires d'Afrique (illustratif, pan-africain).
const UNIVERSITIES = [
  { letters: "COT", name: "Cotonou", color: "#1A3A52" },
  { letters: "ABJ", name: "Abidjan", color: "#1976D2" },
  { letters: "DKR", name: "Dakar", color: "#0F62B5" },
  { letters: "LOS", name: "Lagos", color: "#4CAF50" },
  { letters: "ACC", name: "Accra", color: "#D81B23" },
  { letters: "CAI", name: "Le Caire", color: "#FFB800" },
];

const HOW_IT_WORKS = [
  {
    icon: Search,
    number: "01",
    title: "Cherchez",
    description:
      "Filtrez par université, budget et style de vie. Les colocations vérifiées de notre réseau vous attendent.",
    variant: "navy" as const,
  },
  {
    icon: Sparkles,
    number: "02",
    title: "Matchez",
    description:
      "Notre algorithme calcule votre compatibilité avec les colocataires actuels (rythme, études, ambiance).",
    variant: "blue" as const,
  },
  {
    icon: Compass,
    number: "03",
    title: "Visitez",
    description:
      "Tour virtuel 360° depuis votre téléphone ou rendez-vous physique avec le coloc référent.",
    variant: "green" as const,
  },
  {
    icon: KeyRound,
    number: "04",
    title: "Emménagez",
    description:
      "Signature électronique du bail, dépôt sécurisé via KAZA Pay, clés remises sous 48h.",
    variant: "sunset" as const,
  },
];

// Pôles étudiants par grande ville africaine — chaque carte mène à une vraie
// recherche filtrée (q=ville, public étudiant).
const CAMPUS_AREAS = [
  {
    query: "cotonou",
    city: "Cotonou",
    country: "Bénin",
    detail: "Campus & quartiers étudiants",
  },
  {
    query: "abidjan",
    city: "Abidjan",
    country: "Côte d'Ivoire",
    detail: "Cocody, Yopougon & alentours",
  },
  {
    query: "dakar",
    city: "Dakar",
    country: "Sénégal",
    detail: "Proche des universités",
  },
  {
    query: "lagos",
    city: "Lagos",
    country: "Nigeria",
    detail: "Yaba, Akoka & campus",
  },
];

const FAQ_ITEMS = [
  {
    q: "Qui peut publier ou rejoindre une colocation sur KAZA ?",
    a: "Toute personne majeure inscrite à un établissement d'enseignement supérieur reconnu peut publier ou rejoindre une colocation. Votre statut étudiant est vérifié via votre carte étudiante ou attestation de scolarité.",
  },
  {
    q: "Comment se déroule le matching entre colocataires ?",
    a: "Notre algorithme analyse votre profil (rythme de vie, études, préférences) et calcule un score de compatibilité avec les colocataires en place. Vous voyez les profils anonymisés avant de demander à rejoindre.",
  },
  {
    q: "Quel est le budget minimum pour une chambre en colocation ?",
    a: "À partir de 25 000 FCFA par mois charges incluses dans certaines colocations proches des campus. Le prix médian se situe entre 35 000 et 50 000 FCFA selon la ville et le standing.",
  },
  {
    q: "Le bail est-il sécurisé légalement ?",
    a: "Oui. Chaque colocation utilise un bail numérique conforme au droit en vigueur, signé électroniquement avec valeur opposable. Un PDF horodaté vous est remis et archivé.",
  },
  {
    q: "Que se passe-t-il en cas de conflit avec un colocataire ?",
    a: "KAZA propose un service de médiation gratuit avec un référent dédié. En cas de blocage, une procédure de sortie anticipée est prévue dans le contrat, sans pénalité pour le coloc lésé.",
  },
  {
    q: "Comment sont calculées les charges partagées ?",
    a: "Eau, électricité et internet sont répartis automatiquement entre les colocataires actifs via votre tableau de bord. Vous recevez un récap mensuel et payez votre part en un clic.",
  },
];

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

export default function StudentLivingPage() {
  return (
    <div className="bg-white">
      {/* ============================================================== */}
      {/* 1. HERO IMMERSIF                                                */}
      {/* ============================================================== */}
      <section className="relative h-[80vh] min-h-[640px] w-full overflow-hidden">
        <Image
          src={HERO_IMAGE}
          alt="Étudiants africains modernes en colocation"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        {/* Overlay gradient noir + navy */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-black/80 via-kaza-navy/70 to-black/85"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
        />

        <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col items-center justify-center px-4 text-center text-white lg:px-8">
          <FadeIn delay={50}>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-gradient-to-r from-amber-400/20 via-yellow-300/20 to-amber-400/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200 backdrop-blur-md">
              <GraduationCap className="size-4" />
              Logement étudiant premium
            </span>
          </FadeIn>

          <FadeIn delay={150}>
            <h1 className="mt-6 max-w-4xl font-heading text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Votre{" "}
              <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
                colocation idéale
              </span>{" "}
              près du campus
            </h1>
          </FadeIn>

          <FadeIn delay={300}>
            <p className="mt-6 max-w-2xl text-base text-white/85 sm:text-lg">
              Trouvez votre chambre vérifiée près de votre université, partout en
              Afrique. Matching avec des colocataires sérieux, baux numériques
              sécurisés et charges partagées automatiquement.
              <br className="hidden sm:block" />
              Vivez votre vie étudiante l&apos;esprit libre.
            </p>
          </FadeIn>

          {/* Search bar glass */}
          <FadeIn delay={450} className="mt-10 w-full max-w-3xl">
            <GlassPanel
              tint="white"
              intensity="strong"
              className="border-white/30 bg-white/15 p-3 shadow-2xl"
            >
              <form
                action="/search"
                method="get"
                className="flex flex-col gap-3 sm:flex-row sm:items-stretch"
              >
                <input type="hidden" name="targets" value="etudiant" />
                <div className="relative flex-1">
                  <GraduationCap
                    aria-hidden
                    className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-kaza-blue"
                  />
                  <Input
                    name="q"
                    aria-label="Ville, université ou quartier"
                    placeholder="Ville, université ou quartier…"
                    className="h-12 border-white/40 bg-white pl-11 text-base text-kaza-navy placeholder:text-slate-500 focus-visible:ring-amber-300"
                  />
                </div>
                <select
                  name="maxPrice"
                  aria-label="Budget maximum"
                  defaultValue=""
                  className="h-12 w-full rounded-md border border-white/40 bg-white px-3 text-base text-kaza-navy focus:outline-none focus:ring-2 focus:ring-amber-300 sm:w-52"
                >
                  <option value="">Budget max</option>
                  <option value="30000">Jusqu&apos;à 30 000 FCFA</option>
                  <option value="50000">Jusqu&apos;à 50 000 FCFA</option>
                  <option value="75000">Jusqu&apos;à 75 000 FCFA</option>
                  <option value="100000">Jusqu&apos;à 100 000 FCFA</option>
                </select>
                <Button
                  type="submit"
                  className="h-12 bg-amber-400 px-8 text-base font-semibold text-kaza-navy shadow-lg hover:bg-amber-300"
                >
                  <Search className="mr-2 size-5" />
                  Chercher
                </Button>
              </form>
              <p className="mt-4 text-center text-sm text-white/80">
                Vous avez une chambre à partager ?{" "}
                <Link
                  href="/student-living/new"
                  className="font-semibold text-amber-300 underline-offset-2 hover:underline"
                >
                  Publier une annonce de colocation
                </Link>
              </p>
            </GlassPanel>
          </FadeIn>

          {/* Trust badges */}
          <FadeIn delay={600} className="mt-8">
            <div className="flex flex-wrap items-center justify-center gap-3">
              {[
                { icon: ShieldCheck, label: "100% vérifiés" },
                { icon: Home, label: "Annonces près des campus" },
                { icon: GraduationCap, label: "Communauté étudiante" },
              ].map((b) => (
                <span
                  key={b.label}
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-medium text-white backdrop-blur-md sm:text-sm"
                >
                  <b.icon className="size-4 text-amber-300" />
                  {b.label}
                </span>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Section "Stats animées" retirée — réactivée quand des indicateurs
          réels (étudiants logés, colocations actives) seront disponibles. */}

      {/* ============================================================== */}
      {/* 3. UNIVERSITÉS PARTENAIRES                                      */}
      {/* ============================================================== */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <RevealOnScroll>
            <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-kaza-blue">
              Villes universitaires
            </p>
            <h2 className="mt-3 text-center font-heading text-3xl font-bold tracking-tight text-kaza-navy sm:text-4xl">
              Présents dans les grandes villes universitaires d&apos;Afrique
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
              Nos équipes terrain ont cartographié chaque quartier étudiant pour
              vous proposer la chambre la plus proche de vos amphis.
            </p>
          </RevealOnScroll>

          <div className="mt-14 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
            {UNIVERSITIES.map((uni, i) => (
              <RevealOnScroll key={uni.letters} delay={i * 60} direction="zoom">
                <div className="group flex flex-col items-center gap-3 rounded-3xl border bg-white p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                  <div
                    className="flex size-16 items-center justify-center rounded-2xl text-base font-bold text-white shadow-md transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: uni.color }}
                    aria-hidden
                  >
                    {uni.letters}
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {uni.name}
                  </p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Section "Colocations à la une" retirée — sera réactivée quand des
          annonces de colocation réelles seront publiées via Supabase. */}

      {/* ============================================================== */}
      {/* 5. COMMENT ÇA MARCHE                                            */}
      {/* ============================================================== */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <RevealOnScroll>
            <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-kaza-blue">
              Comment ça marche
            </p>
            <h2 className="mt-3 text-center font-heading text-3xl font-bold tracking-tight text-kaza-navy sm:text-4xl">
              4 étapes pour emménager sereinement
            </h2>
          </RevealOnScroll>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((step, i) => (
              <RevealOnScroll key={step.title} delay={i * 120} direction="up">
                <GradientCard
                  variant={step.variant}
                  className="h-full p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
                >
                  <span className="font-heading text-5xl font-bold text-white/20">
                    {step.number}
                  </span>
                  <div className="mt-4 inline-flex size-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                    <step.icon className="size-7 text-white" />
                  </div>
                  <h3 className="mt-5 font-heading text-2xl font-bold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/85">
                    {step.description}
                  </p>
                </GradientCard>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 6. VIVRE PRÈS DE VOTRE CAMPUS                                   */}
      {/* ============================================================== */}
      <section className="bg-gradient-to-b from-white to-kaza-navy/[0.04] py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <RevealOnScroll>
            <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-kaza-blue">
              Vivre près de votre campus
            </p>
            <h2 className="mt-3 text-center font-heading text-3xl font-bold tracking-tight text-kaza-navy sm:text-4xl">
              Une chambre à pied de vos amphis
            </h2>
          </RevealOnScroll>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {CAMPUS_AREAS.map((area, i) => (
              <RevealOnScroll key={area.query} delay={i * 90} direction="up">
                <Link
                  href={`/search?q=${area.query}&targets=etudiant`}
                  className="group flex h-full flex-col gap-3 rounded-3xl border bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
                >
                  <h3 className="font-heading text-lg font-bold leading-tight text-kaza-navy">
                    {area.city}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    <MapPin className="mr-1 inline size-3" />
                    {area.country}
                  </p>
                  <p className="mt-auto text-xs font-medium text-kaza-green">
                    {area.detail}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-kaza-blue">
                    Voir les annonces
                    <ArrowRight className="size-3" />
                  </span>
                </Link>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Section "Témoignages étudiants" retirée — réactivée quand de vrais
          avis seront publiés (cf. queries/reviews). */}

      {/* ============================================================== */}
      {/* 8. SÉCURITÉ ÉTUDIANTE                                           */}
      {/* ============================================================== */}
      <section className="bg-gradient-to-br from-kaza-navy via-[#0F2A40] to-kaza-blue py-24 text-white">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <RevealOnScroll>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">
                Sécurité étudiante
              </p>
              <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                Une vie étudiante l&apos;esprit libre
              </h2>
              <p className="mt-4 text-white/75">
                Trois garde-fous pour que votre colocation reste un plaisir, pas
                un casse-tête.
              </p>
            </div>
          </RevealOnScroll>

          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {[
              {
                icon: "ShieldCheck",
                title: "Identités vérifiées",
                description:
                  "Chaque colocataire valide sa pièce d'identité et son statut étudiant. Fini les profils douteux.",
                metric: "100% des comptes contrôlés",
              },
              {
                icon: "FileSignature",
                title: "Bail numérique légal",
                description:
                  "Contrat conforme au droit en vigueur signé électroniquement, opposable et archivé en PDF.",
                metric: "Signature en 5 minutes",
              },
              {
                icon: "MessagesSquare",
                title: "Médiation conflits",
                description:
                  "Un référent KAZA intervient en 24h en cas de désaccord pour préserver l'ambiance maison.",
                metric: "Résolution < 24h",
              },
            ].map((f, i) => (
              <RevealOnScroll key={f.title} delay={i * 100} direction="up">
                <div className="h-full rounded-3xl border border-white/15 bg-white/[0.05] p-2 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-300/40 hover:bg-white/[0.08]">
                  <div className="rounded-[20px] bg-white/[0.02] p-4">
                    <FeatureHighlight
                      icon={f.icon}
                      title={f.title}
                      description={f.description}
                      metric={f.metric}
                      className="text-white hover:bg-transparent [&_h3]:text-white [&_p]:text-white/80"
                    />
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 9. FAQ ÉTUDIANT                                                 */}
      {/* ============================================================== */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-4 lg:px-8">
          <RevealOnScroll>
            <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-kaza-blue">
              Questions fréquentes
            </p>
            <h2 className="mt-3 text-center font-heading text-3xl font-bold tracking-tight text-kaza-navy sm:text-4xl">
              Tout savoir avant de vous lancer
            </h2>
          </RevealOnScroll>

          <RevealOnScroll delay={150}>
            <Accordion type="single" collapsible className="mt-12 space-y-4">
              {FAQ_ITEMS.map((item, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className="overflow-hidden rounded-2xl border bg-white px-6 shadow-sm transition-shadow data-[state=open]:shadow-md"
                >
                  <AccordionTrigger className="py-5 text-left font-heading text-base font-semibold text-kaza-navy hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </RevealOnScroll>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 10. CTA FINAL                                                   */}
      {/* ============================================================== */}
      <section className="px-4 pb-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <RevealOnScroll direction="zoom">
            <GradientCard
              variant="green"
              className="overflow-hidden p-12 text-center sm:p-20"
            >
              <div className="mx-auto flex max-w-3xl flex-col items-center">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-md">
                  <Handshake className="size-4" />
                  Rejoignez la communauté
                </span>
                <h2 className="mt-6 font-heading text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Prêt à trouver votre coloc ?
                </h2>
                <p className="mt-6 max-w-2xl text-base text-white/90 sm:text-lg">
                  Créez votre profil étudiant gratuitement, accédez aux
                  colocations vérifiées de notre réseau et matchez avec des
                  colocataires compatibles dès aujourd&apos;hui.
                </p>
                <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                  <Button
                    asChild
                    size="lg"
                    className="h-14 bg-white px-8 text-base font-semibold text-kaza-green shadow-xl hover:bg-amber-50"
                  >
                    <Link href="/signup?role=student">
                      <Sparkles className="mr-2 size-5" />
                      Créer mon profil étudiant
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="h-14 border-white/40 bg-white/10 px-8 text-base font-semibold text-white backdrop-blur-md hover:bg-white/20 hover:text-white"
                  >
                    <Link href="/search?type=colocation">
                      Parcourir les colocations
                      <ArrowRight className="ml-2 size-5" />
                    </Link>
                  </Button>
                </div>

                <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/80">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="size-4" />
                    Inscription en 2 minutes
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="size-4" />
                    Aucun frais de service
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Star className="size-4 fill-amber-300 text-amber-300" />
                    Communauté étudiante grandissante
                  </span>
                </div>
              </div>
            </GradientCard>
          </RevealOnScroll>
        </div>
      </section>
    </div>
  );
}
