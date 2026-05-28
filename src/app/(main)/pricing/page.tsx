import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Check,
  X,
  Sparkles,
  Crown,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { StatCounter } from "@/components/marketing/stat-counter";
import { TestimonialCard } from "@/components/marketing/testimonial-card";
import { FeatureHighlight } from "@/components/marketing/feature-highlight";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { RevealOnScroll } from "@/components/shared/reveal-on-scroll";
import { FadeIn } from "@/components/shared/fade-in";
import { TESTIMONIALS, FEATURES } from "@/lib/marketing-data";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import {
  getActiveSubscription,
  PLAN_DETAILS,
} from "@/lib/queries/subscriptions";
import { SubscribeButton } from "@/components/subscriptions/subscribe-button";
import { PricingToggle } from "./pricing-toggle";

const AGENCY_PLAN_KEYS = ["PRO_STARTER", "PRO_PREMIUM", "PRO_ELITE"] as const;
const PLUS_PLAN_KEYS = ["PLUS_MONTHLY", "PLUS_YEARLY"] as const;

const formatFcfaPrice = (value: number) =>
  `${new Intl.NumberFormat("fr-FR").format(value)} FCFA`;

export const metadata: Metadata = {
  title: "Tarifs — KAZA",
  description:
    "Une tarification limpide pour chaque profil. Gratuit pour les locataires et étudiants. Commission uniquement sur loyer perçu pour les propriétaires.",
  openGraph: {
    title: "Tarifs KAZA — Transparent, sans frais cachés",
    description:
      "Locataires : gratuit. Propriétaires : 0 FCFA + 5% sur loyer perçu ou Pro illimité à 15 000 FCFA/mois.",
    type: "website",
  },
};

type PricingPlan = {
  name: string;
  audience: string;
  price: string;
  priceDetail?: string;
  description: string;
  features: string[];
  cta: { label: string; href: string };
  highlighted?: boolean;
  premium?: boolean;
};

const plans: PricingPlan[] = [
  {
    name: "Locataire / Étudiant",
    audience: "Pour ceux qui cherchent un logement",
    price: "Gratuit",
    description: "Aucun frais d'inscription. Aucune surprise.",
    features: [
      "Recherche illimitée d'annonces vérifiées",
      "Messagerie directe avec les propriétaires",
      "Réservations sécurisées via escrow",
      "Favoris et alertes personnalisées",
      "Visites virtuelles 360° immersives",
      "Signature électronique des baux",
      "Support client 7j/7",
      "Application mobile native",
    ],
    cta: { label: "Créer mon compte gratuit", href: "/signup" },
  },
  {
    name: "Propriétaire Starter",
    audience: "Pour les bailleurs indépendants",
    price: "0 FCFA",
    priceDetail: "+ 5 % sur loyer perçu",
    description:
      "L'essentiel pour publier et louer vos premières annonces sans engagement.",
    features: [
      "Jusqu'à 5 annonces actives",
      "Vérification KYC gratuite",
      "Contrats de bail numériques signés",
      "Dashboard analytics de base",
      "Encaissement automatique des loyers",
      "Messagerie & dossiers candidats",
      "Relances automatiques en cas d'impayé",
      "Support standard sous 48h",
    ],
    cta: { label: "Commencer gratuitement", href: "/signup?role=owner" },
    highlighted: true,
  },
  {
    name: "Propriétaire Pro",
    audience: "Pour les agences et investisseurs",
    price: "15 000 FCFA",
    priceDetail: "/ mois + 3 % sur loyer",
    description:
      "L'expérience la plus complète pour gérer un parc immobilier ambitieux.",
    features: [
      "Annonces illimitées",
      "Mise en avant prioritaire dans la recherche",
      "Badge Pro vérifié sur vos annonces",
      "Support prioritaire sous 4h",
      "Export comptable (CSV, PDF)",
      "Statistiques avancées et reporting",
      "Gestion multi-utilisateurs",
      "Gestionnaire de compte dédié",
    ],
    cta: { label: "Passer à Pro", href: "/signup?role=owner&plan=pro" },
    premium: true,
  },
];

type ComparisonRow = {
  feature: string;
  tenant: boolean | string;
  starter: boolean | string;
  pro: boolean | string;
};

const comparison: ComparisonRow[] = [
  { feature: "Création de compte", tenant: "Gratuit", starter: "Gratuit", pro: "Gratuit" },
  { feature: "Nombre d'annonces actives", tenant: "—", starter: "5", pro: "Illimité" },
  { feature: "Commission sur loyer perçu", tenant: "—", starter: "5 %", pro: "3 %" },
  { feature: "Recherche d'annonces illimitée", tenant: true, starter: false, pro: false },
  { feature: "Messagerie intégrée", tenant: true, starter: true, pro: true },
  { feature: "Vérification KYC", tenant: true, starter: true, pro: true },
  { feature: "Visites virtuelles 360°", tenant: true, starter: true, pro: true },
  { feature: "Contrats numériques signés", tenant: true, starter: true, pro: true },
  { feature: "Escrow / séquestre sécurisé", tenant: true, starter: true, pro: true },
  { feature: "Encaissement automatique", tenant: "—", starter: true, pro: true },
  { feature: "Dashboard analytics", tenant: "—", starter: "De base", pro: "Avancé" },
  { feature: "Mise en avant des annonces", tenant: "—", starter: false, pro: true },
  { feature: "Badge Pro vérifié", tenant: "—", starter: false, pro: true },
  { feature: "Export comptable CSV / PDF", tenant: "—", starter: false, pro: true },
  { feature: "Gestion multi-utilisateurs", tenant: "—", starter: false, pro: true },
  { feature: "Support prioritaire (4h)", tenant: "—", starter: false, pro: true },
  { feature: "Gestionnaire de compte dédié", tenant: "—", starter: false, pro: true },
  { feature: "Accompagnement médiation litiges", tenant: true, starter: true, pro: true },
];

const pricingFaq = [
  {
    q: "Y a-t-il des frais cachés ?",
    a: "Aucun. Notre commission s'applique uniquement lorsque vous percevez un loyer. Pas de frais d'inscription, pas de frais de publication, pas de pénalité de résiliation.",
  },
  {
    q: "Comment fonctionne la commission de 5 % ou 3 % ?",
    a: "La commission est prélevée automatiquement à chaque encaissement de loyer via la plateforme. Vous recevez 95 % (Starter) ou 97 % (Pro) sur votre wallet KAZA Pay ou votre compte bancaire, et nous nous occupons du reste.",
  },
  {
    q: "Puis-je changer d'abonnement à tout moment ?",
    a: "Oui. Vous passez du plan Starter au plan Pro (ou inversement) depuis votre tableau de bord. Le changement prend effet immédiatement, sans frais ni interruption.",
  },
  {
    q: "L'abonnement annuel est-il avantageux ?",
    a: "Oui : en optant pour la facturation annuelle, vous bénéficiez de 2 mois offerts sur le plan Pro, soit 30 000 FCFA d'économies par an.",
  },
  {
    q: "Que se passe-t-il si mon locataire ne paie pas ?",
    a: "Aucune commission n'est facturée tant que le loyer n'est pas effectivement perçu. Notre système d'escrow et de relances automatiques protège vos revenus.",
  },
  {
    q: "Puis-je tester KAZA avant de m'engager ?",
    a: "Bien sûr. Le plan Starter est entièrement gratuit. Vous ne payez la commission qu'au premier loyer perçu — testez la plateforme sans aucun engagement.",
  },
];

export default async function PricingPage() {
  const ownerTestimonials = TESTIMONIALS.filter((t) =>
    t.role.toLowerCase().includes("propriétaire"),
  ).slice(0, 4);

  const user = await getCurrentDisplayUser();
  const subscription = user ? await getActiveSubscription(user.id) : null;
  const isAuthenticated = Boolean(user);
  const currentPlan = subscription?.plan ?? null;

  return (
    <div className="overflow-hidden">
      {/* ===== HERO LUXE ============================================== */}
      <section className="relative isolate flex min-h-[70vh] items-center overflow-hidden bg-kaza-navy text-white">
        <Image
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=80"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-30"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-br from-kaza-navy/95 via-kaza-navy/85 to-kaza-blue/60" />
        <div
          className="pointer-events-none absolute -top-32 -right-32 size-[28rem] rounded-full bg-kaza-green/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-32 size-[28rem] rounded-full bg-kaza-blue/30 blur-3xl"
          aria-hidden
        />

        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-24 text-center lg:px-8">
          <FadeIn>
            <Badge className="mb-6 border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-white uppercase backdrop-blur-md">
              <Sparkles className="mr-2 size-3.5" />
              Tarification
            </Badge>
          </FadeIn>
          <FadeIn delay={100}>
            <h1 className="font-heading text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-7xl">
              Des prix{" "}
              <span className="bg-gradient-to-r from-kaza-green via-emerald-300 to-kaza-green bg-clip-text text-transparent">
                transparents
              </span>
              <br />
              pour chaque profil
            </h1>
          </FadeIn>
          <FadeIn delay={200}>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80 sm:text-xl">
              Pas de frais cachés, pas de surprises. Vous ne payez que lorsque
              vous percevez vos loyers — c&apos;est aussi simple que ça.
            </p>
          </FadeIn>
          <FadeIn delay={300}>
            <div className="mt-10 flex justify-center">
              <PricingToggle />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ===== STATS CONFIANCE ====================================== */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <RevealOnScroll>
            <div className="mb-16 text-center">
              <p className="mb-3 text-xs font-semibold tracking-widest text-kaza-blue uppercase">
                Une plateforme de confiance
              </p>
              <h2 className="font-heading text-3xl font-bold text-kaza-navy sm:text-4xl lg:text-5xl">
                Des milliers de Béninois nous font déjà confiance
              </h2>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            <RevealOnScroll>
              <StatCounter
                value={1200}
                suffix="+"
                label="Propriétaires actifs"
                description="Sur l'ensemble du Bénin"
              />
            </RevealOnScroll>
            <RevealOnScroll delay={100}>
              <StatCounter
                value={8500}
                suffix="+"
                label="Locataires servis"
                description="Depuis le lancement"
              />
            </RevealOnScroll>
            <RevealOnScroll delay={200}>
              <StatCounter
                value={45000}
                prefix=""
                suffix=" FCFA"
                label="Économies moyennes"
                description="Par rapport aux agences classiques"
              />
            </RevealOnScroll>
            <RevealOnScroll delay={300}>
              <StatCounter
                value={4.8}
                suffix="/5"
                label="Note moyenne"
                description="Sur plus de 6 200 avis vérifiés"
              />
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* ===== PRICING CARDS PREMIUM ================================= */}
      <section className="relative bg-gradient-to-b from-gray-50 via-white to-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <RevealOnScroll>
            <div className="mb-16 text-center">
              <p className="mb-3 text-xs font-semibold tracking-widest text-kaza-blue uppercase">
                Nos formules
              </p>
              <h2 className="font-heading text-3xl font-bold text-kaza-navy sm:text-4xl lg:text-5xl">
                Choisissez le plan qui vous ressemble
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                Trois formules pour trois profils. Toutes incluent l&apos;essentiel
                KAZA.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid gap-8 lg:grid-cols-3">
            {plans.map((plan, idx) => (
              <RevealOnScroll key={plan.name} delay={idx * 120}>
                <Card
                  className={
                    "group relative flex h-full flex-col overflow-hidden rounded-3xl border bg-white p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl " +
                    (plan.highlighted
                      ? "border-2 border-kaza-blue shadow-xl ring-4 ring-kaza-blue/10"
                      : plan.premium
                        ? "border border-amber-200/60 shadow-xl"
                        : "border-gray-200 shadow-sm")
                  }
                >
                  {/* Premium glow */}
                  {plan.premium && (
                    <div
                      className="pointer-events-none absolute -top-32 -right-32 size-64 rounded-full bg-gradient-to-br from-amber-300/40 to-orange-400/20 blur-3xl"
                      aria-hidden
                    />
                  )}
                  {plan.highlighted && (
                    <div
                      className="pointer-events-none absolute -top-32 -left-32 size-64 rounded-full bg-gradient-to-br from-kaza-blue/30 to-kaza-green/20 blur-3xl"
                      aria-hidden
                    />
                  )}

                  {plan.highlighted && (
                    <Badge className="absolute top-6 right-6 bg-kaza-blue px-3 py-1 text-xs font-semibold text-white shadow-lg">
                      <Sparkles className="mr-1 size-3" /> Recommandé
                    </Badge>
                  )}
                  {plan.premium && (
                    <Badge className="absolute top-6 right-6 border border-amber-300/60 bg-gradient-to-br from-amber-400 to-orange-500 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                      <Crown className="mr-1 size-3" /> Premium
                    </Badge>
                  )}

                  <div className="relative">
                    <h3 className="font-heading text-2xl font-bold text-kaza-navy">
                      {plan.name}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {plan.audience}
                    </p>

                    <div className="mt-8 border-b border-gray-100 pb-8">
                      <div className="flex items-baseline gap-2">
                        <span className="font-heading text-5xl font-extrabold text-kaza-navy lg:text-6xl">
                          {plan.price}
                        </span>
                      </div>
                      {plan.priceDetail && (
                        <p className="mt-2 text-base font-medium text-kaza-blue">
                          {plan.priceDetail}
                        </p>
                      )}
                      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                        {plan.description}
                      </p>
                    </div>

                    <ul className="mt-8 space-y-4 text-sm">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <span
                            className={
                              "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full " +
                              (plan.premium
                                ? "bg-amber-100 text-amber-600"
                                : plan.highlighted
                                  ? "bg-kaza-blue/10 text-kaza-blue"
                                  : "bg-kaza-green/10 text-kaza-green")
                            }
                          >
                            <Check className="size-3" strokeWidth={3} />
                          </span>
                          <span className="text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="relative mt-auto pt-10">
                    <Button
                      asChild
                      size="lg"
                      className={
                        "group/btn h-14 w-full rounded-2xl text-base font-semibold transition-all " +
                        (plan.premium
                          ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 hover:shadow-xl"
                          : plan.highlighted
                            ? "bg-kaza-blue text-white shadow-lg hover:bg-kaza-navy hover:shadow-xl"
                            : "bg-kaza-navy text-white hover:bg-kaza-blue")
                      }
                    >
                      <Link href={plan.cta.href}>
                        {plan.cta.label}
                        <ArrowRight className="ml-2 size-4 transition-transform group-hover/btn:translate-x-1" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ABONNEMENTS RÉELS (KAZA Pro + KAZA Plus) ============== */}
      <section
        id="souscrire"
        className="relative bg-white py-24"
      >
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <RevealOnScroll>
            <div className="mb-12 text-center">
              <p className="mb-3 text-xs font-semibold tracking-widest text-kaza-blue uppercase">
                Souscription directe
              </p>
              <h2 className="font-heading text-3xl font-bold text-kaza-navy sm:text-4xl lg:text-5xl">
                Choisissez votre abonnement KAZA
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                Activation immédiate. Résiliable à tout moment depuis votre
                espace.
              </p>
            </div>
          </RevealOnScroll>

          {/* KAZA Pro (agences) */}
          <RevealOnScroll>
            <div className="mb-6 flex items-center gap-2">
              <Crown className="size-5 text-kaza-blue" />
              <h3 className="font-heading text-xl font-bold text-kaza-navy">
                KAZA Pro — Agences &amp; investisseurs
              </h3>
            </div>
          </RevealOnScroll>
          <div className="mb-16 grid gap-6 lg:grid-cols-3">
            {AGENCY_PLAN_KEYS.map((planKey) => {
              const plan = PLAN_DETAILS[planKey];
              const isCurrent = currentPlan === planKey;
              const isPremium = planKey === "PRO_PREMIUM";
              return (
                <RevealOnScroll key={planKey}>
                  <Card
                    className={
                      "relative flex h-full flex-col rounded-3xl border bg-white p-8 transition-all hover:-translate-y-1 hover:shadow-xl " +
                      (isPremium
                        ? "border-2 border-kaza-blue shadow-lg ring-2 ring-kaza-blue/10"
                        : "border-gray-200 shadow-sm")
                    }
                  >
                    {isPremium && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-kaza-blue text-white">
                        <Sparkles className="mr-1 size-3" />
                        Recommandé
                      </Badge>
                    )}
                    <h4 className="font-heading text-xl font-bold text-kaza-navy">
                      {plan.name}
                    </h4>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="font-heading text-4xl font-extrabold text-kaza-navy">
                        {formatFcfaPrice(plan.priceMonthly)}
                      </span>
                      <span className="text-sm text-muted-foreground">/ mois</span>
                    </div>
                    <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className="mt-0.5 size-4 shrink-0 text-kaza-green" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <SubscribeButton
                      plan={planKey}
                      label={`Choisir ${plan.name.replace(/^KAZA Pro /, "")}`}
                      isAuthenticated={isAuthenticated}
                      isCurrentPlan={isCurrent}
                      signupRoleSuffix="&role=agency"
                      className={
                        "mt-8 h-12 w-full rounded-2xl text-base font-semibold " +
                        (isPremium
                          ? "bg-kaza-blue text-white hover:bg-kaza-navy"
                          : "bg-kaza-navy text-white hover:bg-kaza-blue")
                      }
                    />
                  </Card>
                </RevealOnScroll>
              );
            })}
          </div>

          {/* KAZA Plus (locataires) */}
          <RevealOnScroll>
            <div className="mb-6 flex items-center gap-2">
              <Sparkles className="size-5 text-amber-500" />
              <h3 className="font-heading text-xl font-bold text-kaza-navy">
                KAZA Plus — Locataires &amp; étudiants
              </h3>
            </div>
          </RevealOnScroll>
          <div className="grid gap-6 md:grid-cols-2">
            {PLUS_PLAN_KEYS.map((planKey) => {
              const plan = PLAN_DETAILS[planKey];
              const isCurrent = currentPlan === planKey;
              const isYearly = planKey === "PLUS_YEARLY";
              return (
                <RevealOnScroll key={planKey}>
                  <Card
                    className={
                      "relative flex h-full flex-col rounded-3xl border bg-gradient-to-br p-8 transition-all hover:-translate-y-1 hover:shadow-xl " +
                      (isYearly
                        ? "border-2 border-amber-400 from-amber-50 to-yellow-50/40 shadow-lg ring-2 ring-amber-200/40"
                        : "border-gray-200 from-white to-white shadow-sm")
                    }
                  >
                    {isYearly && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 border-0 bg-gradient-to-r from-amber-400 to-amber-500 text-kaza-navy">
                        <Crown className="mr-1 size-3" />
                        2 mois offerts
                      </Badge>
                    )}
                    <h4 className="font-heading text-xl font-bold text-kaza-navy">
                      {plan.name}
                    </h4>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="font-heading text-4xl font-extrabold text-kaza-navy">
                        {formatFcfaPrice(
                          plan.priceYearly ?? plan.priceMonthly,
                        )}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {isYearly ? "/ an" : "/ mois"}
                      </span>
                    </div>
                    {isYearly && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        soit {formatFcfaPrice(plan.priceMonthly)} / mois
                      </p>
                    )}
                    <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className="mt-0.5 size-4 shrink-0 text-amber-500" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <SubscribeButton
                      plan={planKey}
                      label={
                        isYearly ? "Choisir Annuel" : "Choisir Mensuel"
                      }
                      isAuthenticated={isAuthenticated}
                      isCurrentPlan={isCurrent}
                      className={
                        "mt-8 h-12 w-full rounded-2xl text-base font-semibold " +
                        (isYearly
                          ? "border-0 bg-gradient-to-r from-amber-400 to-amber-500 text-kaza-navy hover:from-amber-300 hover:to-amber-400"
                          : "bg-kaza-navy text-white hover:bg-kaza-blue")
                      }
                    />
                  </Card>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== TABLEAU COMPARATIF STICKY ============================== */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-4 lg:px-8">
          <RevealOnScroll>
            <div className="mb-12 text-center">
              <p className="mb-3 text-xs font-semibold tracking-widest text-kaza-blue uppercase">
                Comparatif détaillé
              </p>
              <h2 className="font-heading text-3xl font-bold text-kaza-navy sm:text-4xl lg:text-5xl">
                Toutes les fonctionnalités en un coup d&apos;œil
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                Comparez les trois plans pour choisir celui qui correspond à
                votre profil.
              </p>
            </div>
          </RevealOnScroll>

          <RevealOnScroll>
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-gradient-to-br from-kaza-navy to-kaza-blue text-white">
                    <tr>
                      <th className="px-6 py-5 font-heading text-base font-semibold">
                        Fonctionnalité
                      </th>
                      <th className="px-6 py-5 text-center font-heading text-base font-semibold">
                        Locataire
                      </th>
                      <th className="px-6 py-5 text-center font-heading text-base font-semibold">
                        <span className="inline-flex items-center gap-2">
                          Starter
                          <Sparkles className="size-4 text-kaza-green" />
                        </span>
                      </th>
                      <th className="px-6 py-5 text-center font-heading text-base font-semibold">
                        <span className="inline-flex items-center gap-2">
                          Pro
                          <Crown className="size-4 text-amber-300" />
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.map((row, idx) => (
                      <tr
                        key={row.feature}
                        className={
                          "border-t border-gray-100 transition-colors hover:bg-kaza-blue/5 " +
                          (idx % 2 === 0 ? "bg-white" : "bg-gray-50/50")
                        }
                      >
                        <td className="px-6 py-4 font-medium text-kaza-navy">
                          {row.feature}
                        </td>
                        {(["tenant", "starter", "pro"] as const).map((key) => {
                          const value = row[key];
                          return (
                            <td key={key} className="px-6 py-4 text-center">
                              {typeof value === "boolean" ? (
                                value ? (
                                  <Check className="mx-auto size-5 text-kaza-green" />
                                ) : (
                                  <X className="mx-auto size-5 text-gray-300" />
                                )
                              ) : (
                                <span
                                  className={
                                    key === "pro"
                                      ? "font-semibold text-kaza-navy"
                                      : "text-muted-foreground"
                                  }
                                >
                                  {value}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ===== TÉMOIGNAGES PROPRIÉTAIRES ============================= */}
      <section className="bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <RevealOnScroll>
            <div className="mb-16 text-center">
              <p className="mb-3 text-xs font-semibold tracking-widest text-kaza-blue uppercase">
                Ils nous font confiance
              </p>
              <h2 className="font-heading text-3xl font-bold text-kaza-navy sm:text-4xl lg:text-5xl">
                Des propriétaires qui ont fait le bon choix
              </h2>
            </div>
          </RevealOnScroll>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ownerTestimonials.map((t, i) => (
              <RevealOnScroll key={t.id} delay={i * 100}>
                <TestimonialCard
                  name={t.name}
                  role={t.role}
                  avatarSeed={t.avatarSeed}
                  rating={t.rating}
                  quote={t.quote}
                  city={t.city}
                  highlight={t.highlight}
                  className="h-full"
                />
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ===== POURQUOI KAZA ========================================= */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <RevealOnScroll>
            <div className="mb-16 text-center">
              <p className="mb-3 text-xs font-semibold tracking-widest text-kaza-blue uppercase">
                Pourquoi KAZA
              </p>
              <h2 className="font-heading text-3xl font-bold text-kaza-navy sm:text-4xl lg:text-5xl">
                La plateforme pensée pour le marché africain
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                Six raisons concrètes qui font de KAZA le partenaire
                immobilier le plus complet du Bénin.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <RevealOnScroll key={f.title} delay={i * 80}>
                <div className="h-full rounded-3xl border border-gray-100 bg-white p-2 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
                  <FeatureHighlight
                    icon={f.icon}
                    title={f.title}
                    description={f.description}
                    metric={f.metric}
                  />
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ TARIFICATION ====================================== */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-24">
        <div className="mx-auto max-w-4xl px-4 lg:px-8">
          <RevealOnScroll>
            <div className="mb-12 text-center">
              <p className="mb-3 text-xs font-semibold tracking-widest text-kaza-blue uppercase">
                Questions fréquentes
              </p>
              <h2 className="font-heading text-3xl font-bold text-kaza-navy sm:text-4xl lg:text-5xl">
                Les réponses à vos questions
              </h2>
            </div>
          </RevealOnScroll>

          <RevealOnScroll>
            <div className="rounded-3xl border border-gray-200 bg-white p-2 shadow-xl sm:p-8">
              <Accordion type="single" collapsible className="w-full">
                {pricingFaq.map((item, i) => (
                  <AccordionItem
                    key={i}
                    value={`item-${i}`}
                    className="border-b border-gray-100 last:border-0"
                  >
                    <AccordionTrigger className="py-5 text-left text-base font-semibold text-kaza-navy hover:text-kaza-blue">
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
        </div>
      </section>

      {/* ===== CTA FINAL ============================================== */}
      <CtaBanner
        title="Prêt à publier votre premier bien ?"
        description="KAZA vous accompagne pour gérer vos biens en toute simplicité, avec des paiements sécurisés et des contrats juridiques."
        primaryAction={{ label: "Créer un compte", href: "/signup" }}
        secondaryAction={{ label: "Parler à un expert", href: "/contact" }}
      />
    </div>
  );
}
