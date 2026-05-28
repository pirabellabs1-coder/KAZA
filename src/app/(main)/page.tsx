import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Home,
  Key,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PropertyCard } from "@/components/property/property-card";
import { PropertySearchBar } from "@/components/property/property-search-bar";
import {
  getPlatformStats,
  listPublicProperties,
} from "@/lib/queries/properties";
import { StatCounter } from "@/components/marketing/stat-counter";
import { GradientCard } from "@/components/marketing/gradient-card";
import { RevealOnScroll } from "@/components/shared/reveal-on-scroll";
import { FadeIn } from "@/components/shared/fade-in";
import { CountryFlag } from "@/components/shared/country-flag";
import { GlassPanel } from "@/components/shared/glass-panel";
import { PageTracker } from "@/components/analytics/page-tracker";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1920&q=80";

const STUDENT_IMAGES = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80",
];

const tenantSteps = [
  {
    step: "01",
    title: "Découvrez",
    description:
      "Parcourez des annonces vérifiées avec photos haute qualité et visites virtuelles immersives.",
  },
  {
    step: "02",
    title: "Réservez en sécurité",
    description:
      "Payez via notre tunnel d'escrow sécurisé. Vos fonds sont protégés jusqu'à l'emménagement.",
  },
  {
    step: "03",
    title: "Emménagez sereinement",
    description:
      "Signez votre contrat numérique et gérez votre location depuis votre espace personnel.",
  },
];

const ownerSteps = [
  {
    step: "01",
    title: "Publiez & sélectionnez",
    description:
      "Mettez votre bien en avant auprès de locataires vérifiés, avec une fiche premium en 5 minutes.",
  },
  {
    step: "02",
    title: "Gestion simplifiée",
    description:
      "Encaissement automatique des loyers, suivi des visites et reporting clair en un coup d'œil.",
  },
  {
    step: "03",
    title: "Maximisez vos revenus",
    description:
      "Tarification dynamique et analyses de marché pour optimiser le rendement de vos biens.",
  },
];

const studentSteps = [
  {
    step: "01",
    title: "Matching colocataires",
    description:
      "Notre algorithme vous propose des colocataires compatibles, vérifiés et notés par la communauté.",
  },
  {
    step: "02",
    title: "Frais partagés auto",
    description:
      "Loyer, eau, électricité, internet : tout se calcule et se répartit automatiquement chaque mois.",
  },
  {
    step: "03",
    title: "Bail numérique",
    description:
      "Signature électronique du bail, opposable et conforme au droit béninois. Plus de papiers perdus.",
  },
];

const studentBenefits = [
  { icon: CheckCircle2, label: "Colocataires vérifiés" },
  { icon: CheckCircle2, label: "Frais partagés automatiquement" },
  { icon: CheckCircle2, label: "Bail numérique légal" },
  { icon: CheckCircle2, label: "Proche des campus UAC, IRGIB, EPAC" },
];

export default async function HomePage() {
  const [stats, featuredProperties] = await Promise.all([
    getPlatformStats(),
    listPublicProperties({ limit: 6 }),
  ]);

  // Stats dynamiques calées sur Supabase. "Note moyenne" reste statique
  // tant que les reviews ne sont pas branchées.
  const platformStats: Array<{
    value: number;
    suffix?: string;
    prefix?: string;
    label: string;
    description?: string;
  }> = [
    {
      value: stats.totalAvailable,
      label: "Propriétés disponibles",
      description: "Annonces actives, vérifiées par notre équipe",
    },
    {
      value: stats.totalUsers,
      label: "Membres KAZA",
      description: "Propriétaires, locataires et étudiants inscrits",
    },
    {
      value: stats.totalCities,
      label: "Villes couvertes",
      description: "De Cotonou à Parakou, et au-delà",
    },
    {
      value: 4.8,
      suffix: "/5",
      label: "Note moyenne",
      description: "Basée sur les retours de nos utilisateurs",
    },
  ];

  const hasFeatured = featuredProperties.length > 0;

  return (
    <div className="bg-white">
      {/* Tracking PAGE_VIEW (client, best-effort) */}
      <PageTracker path="/" />
      {/* =================================================================== */}
      {/* 1. HERO IMMERSIF                                                     */}
      {/* =================================================================== */}
      <section className="relative isolate flex min-h-[85vh] flex-col items-center justify-center overflow-hidden bg-kaza-navy">
        {/* Background image */}
        <Image
          src={HERO_IMAGE}
          alt="Villa moderne en Afrique de l'Ouest"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        {/* Overlay gradient */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/55 to-kaza-navy/85"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-tr from-kaza-navy/70 via-transparent to-kaza-blue/30"
          aria-hidden="true"
        />

        {/* Content */}
        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center px-4 py-24 text-center lg:px-8 lg:py-32">
          <FadeIn>
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-md sm:text-sm">
              <CountryFlag code="BJ" className="h-3 w-4" />
              N°1 de l&apos;immobilier en Afrique de l&apos;Ouest
              <Sparkles className="size-3.5 text-kaza-green" aria-hidden />
            </span>
          </FadeIn>

          <FadeIn delay={150}>
            <h1 className="font-heading text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-7xl">
              Trouvez votre{" "}
              <span className="bg-gradient-to-r from-kaza-green via-emerald-400 to-kaza-blue bg-clip-text text-transparent">
                logement de rêve
              </span>
              <br className="hidden sm:block" /> au Bénin
            </h1>
          </FadeIn>

          <FadeIn delay={300}>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg lg:text-xl">
              Plus de 12 500 annonces vérifiées, Paiements 100% sécurisés
              et contrats numériques.
              <br className="hidden sm:block" />
              Toute la confiance d&apos;une plateforme moderne, sans
              intermédiaire.
            </p>
          </FadeIn>

          <FadeIn delay={450} className="w-full">
            <div className="mx-auto mt-10 max-w-4xl">
              <GlassPanel intensity="strong" tint="white" className="p-3 sm:p-4">
                <PropertySearchBar variant="hero" />
              </GlassPanel>
            </div>
          </FadeIn>

          <FadeIn delay={600}>
            <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-white/90">
              {[
                "12 500+ annonces vérifiées",
                "Paiements 100% sécurisés",
                "Contrats numériques légaux",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2
                    className="size-4 text-kaza-green"
                    aria-hidden
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </FadeIn>
        </div>

        {/* Marquee partenaires masqué tant qu'aucun partenaire réel n'est confirmé. */}
      </section>

      {/* =================================================================== */}
      {/* 2. STATS BANDEAU                                                     */}
      {/* =================================================================== */}
      <section className="relative border-b bg-gradient-to-r from-kaza-navy/5 via-white to-kaza-blue/5 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <RevealOnScroll direction="up">
            <div className="mb-12 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-kaza-blue">
                KAZA en chiffres
              </p>
              <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-kaza-navy sm:text-4xl">
                Une plateforme à l&apos;échelle de l&apos;Afrique
              </h2>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-12">
            {platformStats.map((stat, idx) => (
              <RevealOnScroll
                key={stat.label}
                direction="up"
                delay={100 * idx}
                className="text-center lg:text-left"
              >
                <StatCounter
                  value={stat.value}
                  suffix={stat.suffix}
                  prefix={stat.prefix}
                  label={stat.label}
                  description={stat.description}
                />
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Section "Features marketing" retirée — sera réactivée quand le
          contenu réel sera validé par l'équipe produit. */}

      {/* =================================================================== */}
      {/* 4. ANNONCES À LA UNE                                                 */}
      {/* =================================================================== */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <RevealOnScroll direction="up">
            <div className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-kaza-blue">
                  Sélection premium
                </p>
                <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-kaza-navy sm:text-4xl lg:text-5xl">
                  Annonces à la une
                </h2>
                <p className="mt-3 max-w-xl text-muted-foreground">
                  Une sélection de biens premium soigneusement vérifiés dans les
                  plus belles villes du Bénin.
                </p>
              </div>
              {hasFeatured ? (
                <Link
                  href="/search"
                  className="group inline-flex items-center gap-2 rounded-full border border-kaza-navy/20 px-5 py-2.5 text-sm font-semibold text-kaza-navy transition-all hover:border-kaza-navy hover:bg-kaza-navy hover:text-white"
                >
                  Voir toutes les annonces
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
              ) : null}
            </div>
          </RevealOnScroll>

          {hasFeatured ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProperties.map((property, idx) => (
                <RevealOnScroll
                  key={property.id}
                  direction="up"
                  delay={100 * (idx % 3)}
                >
                  <PropertyCard
                    id={property.id}
                    title={property.title}
                    price={property.price}
                    address={property.address}
                    bedrooms={property.bedrooms}
                    bathrooms={property.bathrooms}
                    squareMeters={property.sqm}
                    imageUrl={
                      property.primaryPhotoUrl ??
                      "https://picsum.photos/seed/kaza-default/800/600"
                    }
                    propertyType={property.type}
                    isVerified={property.owner?.isVerified ?? false}
                  />
                </RevealOnScroll>
              ))}
            </div>
          ) : (
            <RevealOnScroll direction="up">
              <div className="mx-auto max-w-2xl rounded-3xl border border-dashed border-kaza-blue/30 bg-white p-10 text-center shadow-sm">
                <div className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-full bg-kaza-blue/10 text-kaza-blue">
                  <Sparkles className="size-6" aria-hidden />
                </div>
                <h3 className="font-heading text-xl font-bold text-kaza-navy">
                  Bientôt sur KAZA
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Soyez le premier à publier votre bien et touchez une
                  communauté grandissante de locataires vérifiés au Bénin.
                </p>
                <Link
                  href="/signup?role=owner"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-kaza-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-kaza-navy/90"
                >
                  Publier une annonce
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </RevealOnScroll>
          )}
        </div>
      </section>

      {/* Section "Villes ciblées" retirée — sera réactivée quand un référentiel
          de villes alimenté par Supabase remplacera les anciennes données. */}

      {/* =================================================================== */}
      {/* 6. COMMENT ÇA MARCHE                                                 */}
      {/* =================================================================== */}
      <section className="relative overflow-hidden bg-gray-50 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <RevealOnScroll direction="up">
            <div className="mx-auto mb-16 max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-kaza-blue">
                Comment ça marche
              </p>
              <h2 className="mt-3 font-heading text-3xl font-bold leading-tight tracking-tight text-kaza-navy sm:text-4xl lg:text-5xl">
                Trois espaces, une expérience fluide
              </h2>
              <p className="mt-5 text-base text-muted-foreground sm:text-lg">
                Que vous cherchiez un logement, mettiez en location ou viviez en
                colocation étudiante, KAZA s&apos;adapte à votre projet.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Locataires */}
            <RevealOnScroll direction="up" delay={0}>
              <GradientCard
                variant="blue"
                className="flex h-full flex-col p-8 lg:p-10"
              >
                <div className="mb-6 flex size-14 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                  <Key className="size-7" aria-hidden />
                </div>
                <h3 className="font-heading text-2xl font-bold">
                  Pour les locataires
                </h3>
                <p className="mt-2 text-sm text-white/80">
                  Trouvez et louez votre prochain chez-vous en toute confiance.
                </p>

                <ul className="mt-8 flex-1 space-y-6">
                  {tenantSteps.map((step) => (
                    <li key={step.step} className="flex gap-4">
                      <span className="shrink-0 font-heading text-2xl font-bold text-white/40">
                        {step.step}
                      </span>
                      <div>
                        <h4 className="font-semibold">{step.title}</h4>
                        <p className="mt-1 text-sm text-white/75">
                          {step.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className="mt-8 w-full bg-white text-kaza-blue hover:bg-white/90"
                >
                  <Link href="/search">
                    Rechercher un logement
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </GradientCard>
            </RevealOnScroll>

            {/* Propriétaires */}
            <RevealOnScroll direction="up" delay={150}>
              <GradientCard
                variant="navy"
                className="flex h-full flex-col p-8 lg:p-10"
              >
                <div className="mb-6 flex size-14 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                  <Home className="size-7" aria-hidden />
                </div>
                <h3 className="font-heading text-2xl font-bold">
                  Pour les propriétaires
                </h3>
                <p className="mt-2 text-sm text-white/80">
                  Mettez vos biens en valeur et augmentez vos revenus locatifs.
                </p>

                <ul className="mt-8 flex-1 space-y-6">
                  {ownerSteps.map((step) => (
                    <li key={step.step} className="flex gap-4">
                      <span className="shrink-0 font-heading text-2xl font-bold text-white/40">
                        {step.step}
                      </span>
                      <div>
                        <h4 className="font-semibold">{step.title}</h4>
                        <p className="mt-1 text-sm text-white/75">
                          {step.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className="mt-8 w-full bg-kaza-green text-white hover:bg-kaza-green/90"
                >
                  <Link href="/signup?role=owner">
                    Publier une annonce
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </GradientCard>
            </RevealOnScroll>

            {/* Étudiants */}
            <RevealOnScroll direction="up" delay={300}>
              <GradientCard
                variant="green"
                className="flex h-full flex-col p-8 lg:p-10"
              >
                <div className="mb-6 flex size-14 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                  <GraduationCap className="size-7" aria-hidden />
                </div>
                <h3 className="font-heading text-2xl font-bold">
                  Pour les étudiants
                </h3>
                <p className="mt-2 text-sm text-white/80">
                  Colocations vérifiées, frais partagés, à deux pas du campus.
                </p>

                <ul className="mt-8 flex-1 space-y-6">
                  {studentSteps.map((step) => (
                    <li key={step.step} className="flex gap-4">
                      <span className="shrink-0 font-heading text-2xl font-bold text-white/40">
                        {step.step}
                      </span>
                      <div>
                        <h4 className="font-semibold">{step.title}</h4>
                        <p className="mt-1 text-sm text-white/75">
                          {step.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className="mt-8 w-full bg-white text-kaza-green hover:bg-white/90"
                >
                  <Link href="/student-living">
                    Trouver une colocation
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </GradientCard>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* Section "Témoignages" retirée — réactivée quand de vrais avis seront
          publiés sur la plateforme (cf. queries/reviews). */}

      {/* =================================================================== */}
      {/* 8. ESPACE ÉTUDIANT PREMIUM                                           */}
      {/* =================================================================== */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <RevealOnScroll direction="up">
            <GradientCard
              variant="navy"
              className="overflow-hidden p-8 sm:p-12 lg:p-16"
            >
              <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                {/* Texte */}
                <div>
                  <Badge className="mb-5 border-0 bg-kaza-green/20 text-kaza-green hover:bg-kaza-green/30">
                    <GraduationCap className="mr-1.5 size-3.5" />
                    KAZA ÉTUDIANT
                  </Badge>
                  <h2 className="font-heading text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
                    Des colocations sûres pour les{" "}
                    <span className="bg-gradient-to-r from-kaza-green to-emerald-300 bg-clip-text text-transparent">
                      étudiants africains
                    </span>
                  </h2>
                  <p className="mt-5 text-base text-white/80 sm:text-lg">
                    Trouvez une chambre près de votre campus, partagez les frais
                    avec des colocataires vérifiés et signez votre bail en
                    quelques clics depuis votre téléphone.
                  </p>

                  <ul className="mt-8 space-y-3">
                    {studentBenefits.map((benefit) => (
                      <li
                        key={benefit.label}
                        className="flex items-center gap-3 text-white/90"
                      >
                        <benefit.icon
                          className="size-5 shrink-0 text-kaza-green"
                          aria-hidden
                        />
                        <span className="text-sm sm:text-base">
                          {benefit.label}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-10 flex flex-wrap gap-3">
                    <Button
                      asChild
                      size="lg"
                      className="bg-kaza-green hover:bg-kaza-green/90"
                    >
                      <Link href="/student-living">
                        Trouver une colocation
                        <ArrowRight className="ml-2 size-4" />
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="border-white/40 bg-white/5 text-white backdrop-blur-sm hover:bg-white/15 hover:text-white"
                    >
                      <Link href="/signup?role=owner">
                        Publier une chambre
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Grille images */}
                <div className="relative">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="group relative h-44 overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10 lg:h-56">
                        <Image
                          src={STUDENT_IMAGES[0]}
                          alt="Étudiants en colocation"
                          fill
                          sizes="(max-width: 1024px) 50vw, 25vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      </div>
                      <div className="group relative h-32 overflow-hidden rounded-2xl shadow-xl ring-1 ring-white/10 lg:h-40">
                        <Image
                          src={STUDENT_IMAGES[1]}
                          alt="Espace de colocation moderne"
                          fill
                          sizes="(max-width: 1024px) 50vw, 25vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      </div>
                    </div>
                    <div className="space-y-4 pt-8">
                      <div className="group relative h-32 overflow-hidden rounded-2xl shadow-xl ring-1 ring-white/10 lg:h-40">
                        <Image
                          src={STUDENT_IMAGES[2]}
                          alt="Chambre étudiante meublée"
                          fill
                          sizes="(max-width: 1024px) 50vw, 25vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      </div>
                      <div className="group relative h-44 overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10 lg:h-56">
                        <Image
                          src={STUDENT_IMAGES[3]}
                          alt="Salon commun lumineux"
                          fill
                          sizes="(max-width: 1024px) 50vw, 25vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Badge prix glass */}
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 lg:-bottom-6 lg:left-auto lg:right-2 lg:translate-x-0">
                    <GlassPanel
                      intensity="strong"
                      tint="white"
                      className="px-5 py-3 text-center"
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-kaza-navy/70">
                        À partir de
                      </p>
                      <p className="font-heading text-xl font-bold text-kaza-navy">
                        25 000 FCFA
                        <span className="text-xs font-medium text-kaza-navy/60">
                          {" "}
                          /mois
                        </span>
                      </p>
                    </GlassPanel>
                  </div>
                </div>
              </div>
            </GradientCard>
          </RevealOnScroll>
        </div>
      </section>

      {/* Sections "Blog preview", "Presse" et "Partenaires" retirées tant que
          les contenus réels ne sont pas validés (cf. roadmap CMS / partenariats). */}

      {/* =================================================================== */}
      {/* 12. CTA FINAL                                                        */}
      {/* =================================================================== */}
      <section className="relative isolate overflow-hidden bg-kaza-navy py-24 lg:py-32">
        {/* Décor */}
        <div
          className="absolute -top-32 left-1/2 -z-10 size-[40rem] -translate-x-1/2 rounded-full bg-kaza-blue/20 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute -bottom-32 right-0 -z-10 size-[30rem] rounded-full bg-kaza-green/20 blur-3xl"
          aria-hidden
        />

        <div className="mx-auto max-w-4xl px-4 text-center lg:px-8">
          <RevealOnScroll direction="up">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-md">
              <Users className="size-4 text-kaza-green" aria-hidden />
              Rejoignez la communauté KAZA
            </div>
            <h2 className="font-heading text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Prêt à trouver votre prochain{" "}
              <span className="bg-gradient-to-r from-kaza-green to-emerald-300 bg-clip-text text-transparent">
                chez-vous ?
              </span>
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base text-white/80 sm:text-lg">
              Inscrivez-vous gratuitement et accédez à des milliers
              d&apos;annonces vérifiées. Sans engagement, sans carte bancaire.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="bg-kaza-green text-white shadow-2xl shadow-kaza-green/30 hover:bg-kaza-green/90"
              >
                <Link href="/search">
                  Rechercher un logement
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white bg-transparent text-white hover:bg-white hover:text-kaza-navy"
              >
                <Link href="/signup?role=owner">Publier une annonce</Link>
              </Button>
            </div>

            <p className="mt-6 text-xs text-white/60">
              Inscription gratuite · Pas de carte bancaire requise · Désabonnement
              en 1 clic
            </p>
          </RevealOnScroll>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 13. NEWSLETTER                                                       */}
      {/* =================================================================== */}
      <section className="border-t bg-gradient-to-r from-gray-50 via-white to-gray-50 py-16">
        <div className="mx-auto max-w-4xl px-4 lg:px-8">
          <div className="flex flex-col items-center gap-6 rounded-3xl border bg-white p-8 shadow-sm sm:p-10 lg:flex-row lg:gap-12">
            <div className="flex-1 text-center lg:text-left">
              <h3 className="font-heading text-2xl font-bold tracking-tight text-kaza-navy sm:text-3xl">
                Restez à la pointe du marché
              </h3>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Recevez les nouvelles annonces premium et nos analyses du marché
                local directement par e-mail.
              </p>
            </div>
            <form
              className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:min-w-[420px]"
              aria-label="Inscription à la newsletter KAZA"
            >
              <input
                type="email"
                required
                placeholder="Votre adresse e-mail"
                aria-label="Adresse e-mail"
                className="flex-1 rounded-full border border-gray-200 bg-white px-5 py-3 text-sm outline-none transition-colors focus:border-kaza-blue focus:ring-2 focus:ring-kaza-blue/20"
              />
              <Button
                type="submit"
                className="rounded-full bg-kaza-navy px-6 hover:bg-kaza-navy/90"
              >
                Rejoindre KAZA
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
