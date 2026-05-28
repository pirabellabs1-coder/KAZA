import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Crown,
  Megaphone,
  LineChart,
  Headphones,
  ShieldCheck,
  FolderLock,
  ConciergeBell,
  Check,
  X,
  Sparkles,
  ArrowRight,
  Star,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { TestimonialCard } from "@/components/marketing/testimonial-card";
import { StatCounter } from "@/components/marketing/stat-counter";
import { RevealOnScroll } from "@/components/shared/reveal-on-scroll";
import { FadeIn } from "@/components/shared/fade-in";
import { GlassPanel } from "@/components/shared/glass-panel";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { getActiveSubscription } from "@/lib/queries/subscriptions";

import { PlusPricingToggle } from "./pricing-toggle";

export const metadata: Metadata = {
  title: "KAZA Plus — l'expérience premium de l'immobilier",
  description:
    "KAZA Plus : boost mensuel, analytics privées, support prioritaire 24/7, identité validée en 2h, stockage illimité et concierge personnel. 9 900 FCFA/mois ou 99 000 FCFA/an (2 mois offerts).",
  openGraph: {
    title: "KAZA Plus — l'expérience premium",
    description:
      "Tout KAZA, en mieux. 9 900 FCFA/mois ou 99 000 FCFA/an (2 mois offerts).",
    type: "website",
  },
};

// =============================================================================
// Constantes
// =============================================================================

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1920&q=80";

// =============================================================================
// Features Premium
// =============================================================================

type PlusFeature = {
  title: string;
  description: string;
  icon: typeof Megaphone;
  detail: string;
};

const plusFeatures: PlusFeature[] = [
  {
    icon: Megaphone,
    title: "Boost mensuel offert",
    description:
      "Une annonce ou une recherche mise en avant chaque mois pendant 7 jours en tête de liste.",
    detail: "1 boost premium / mois inclus",
  },
  {
    icon: LineChart,
    title: "Analytics privées avancées",
    description:
      "Statistiques détaillées : vues, contacts, taux de conversion et performances par annonce.",
    detail: "Tableau de bord temps réel",
  },
  {
    icon: Headphones,
    title: "Support prioritaire 24/7",
    description:
      "Une équipe dédiée joignable jour et nuit avec une réponse garantie en moins d'une heure.",
    detail: "Réponse < 1h, 24/7",
  },
  {
    icon: ShieldCheck,
    title: "Identité validée en 2h",
    description:
      "Procédure express avec badge Premium visible sur votre profil et toutes vos annonces.",
    detail: "vs 48h en version Free",
  },
  {
    icon: FolderLock,
    title: "Stockage docs illimité",
    description:
      "Contrats, justificatifs, photos et états des lieux : conservez tout en toute sécurité.",
    detail: "Sans aucune limite",
  },
  {
    icon: ConciergeBell,
    title: "Concierge personnel KAZA",
    description:
      "Un interlocuteur unique dédié à vos recherches, vos démarches et vos visites sur le terrain.",
    detail: "Service exclusif Plus",
  },
];

// =============================================================================
// Détails des privilèges (section "Vos privilèges en détail")
// =============================================================================

const PRIVILEGES_DETAILS = [
  {
    icon: Megaphone,
    title: "Visibilité maximale",
    text: "Votre annonce passe en tête des résultats pendant 7 jours, avec un badge Premium reconnaissable. En moyenne, +4x de vues et +3x de contacts qualifiés.",
  },
  {
    icon: LineChart,
    title: "Analytics professionnelles",
    text: "Visualisez l'audience de vos annonces, les heures de pic, les quartiers d'origine des visiteurs et le taux de conversion message/visite.",
  },
  {
    icon: Headphones,
    title: "Support VIP non-stop",
    text: "Chat, WhatsApp ou appel direct. Notre équipe Plus est joignable 24h/24, week-ends et jours fériés compris, avec un SLA de réponse sous 1h.",
  },
  {
    icon: ShieldCheck,
    title: "Validation express",
    text: "Votre dossier d'identité est traité en 2h ouvrées au lieu de 48h. Le badge Premium rassure instantanément vos interlocuteurs.",
  },
  {
    icon: FolderLock,
    title: "Coffre-fort numérique",
    text: "Stockage illimité et chiffré pour tous vos documents : baux, fiches de paie, états des lieux, photos. Accessible à vie tant que vous êtes Plus.",
  },
  {
    icon: ConciergeBell,
    title: "Concierge sur-mesure",
    text: "Un conseiller KAZA dédié vous accompagne : présélection d'annonces, prise de RDV, accompagnement aux visites et négociation à votre place.",
  },
];

// =============================================================================
// Témoignages
// =============================================================================

const plusTestimonials = [
  {
    name: "Fatou Adjovi",
    role: "Locataire Premium",
    city: "Cotonou",
    avatarSeed: "Fatou Adjovi",
    rating: 5,
    quote:
      "Mon concierge KAZA a trouvé mon appartement à Cadjèhoun en 4 jours. Le support 24/7 a tout géré, même les visites depuis Paris.",
    highlight: "en 4 jours",
  },
  {
    name: "Komlan Adjété",
    role: "Propriétaire Premium",
    city: "Calavi",
    avatarSeed: "Komlan Adjete",
    rating: 5,
    quote:
      "Le boost mensuel m'a permis de louer mes 3 studios en moins de 15 jours. Les analytics sont vraiment puissantes et utiles.",
    highlight: "moins de 15 jours",
  },
  {
    name: "Sandrine Boko",
    role: "Étudiante Premium",
    city: "Abomey-Calavi",
    avatarSeed: "Sandrine Boko",
    rating: 5,
    quote:
      "Identité validée en 90 minutes et badge Premium qui rassure mes futurs colocataires. Ça change vraiment tout au quotidien.",
    highlight: "90 minutes",
  },
];

// =============================================================================
// Comparatif Free vs Plus (12 lignes)
// =============================================================================

type PlusRow = { feature: string; free: boolean | string; plus: boolean | string };

const plusComparison: PlusRow[] = [
  { feature: "Recherche d'annonces vérifiées", free: true, plus: true },
  { feature: "Messagerie illimitée", free: true, plus: true },
  { feature: "Favoris", free: "Jusqu'à 20", plus: "Illimités" },
  { feature: "Alertes personnalisées", free: "3 actives", plus: "Illimitées" },
  { feature: "Boost mensuel offert", free: false, plus: true },
  { feature: "Analytics privées", free: false, plus: true },
  { feature: "Support prioritaire 24/7", free: "Email 48h", plus: "Chat + appel < 1h" },
  { feature: "Validation d'identité", free: "48 heures", plus: "2 heures" },
  { feature: "Badge Premium sur le profil", free: false, plus: true },
  { feature: "Stockage de documents", free: "500 Mo", plus: "Illimité" },
  { feature: "Concierge personnel", free: false, plus: true },
  { feature: "Accès aux ventes flash KAZA", free: false, plus: true },
];

// =============================================================================
// FAQ Plus
// =============================================================================

const PLUS_FAQ = [
  {
    q: "Puis-je résilier mon abonnement Plus à tout moment ?",
    a: "Oui, l'abonnement mensuel est sans engagement et résiliable d'un clic depuis votre espace. L'abonnement annuel reste actif jusqu'à son échéance, mais peut être non-renouvelé à tout moment.",
  },
  {
    q: "Que se passe-t-il si je passe de Plus à Free ?",
    a: "Vos données restent intactes. Vous perdez simplement l'accès aux fonctionnalités Premium (boost, concierge, badge). Vos documents stockés restent accessibles pendant 90 jours.",
  },
  {
    q: "Le concierge personnel parle-t-il français ?",
    a: "Oui, tous nos concierges sont francophones natifs basés au Bénin. Certains parlent également fon, yoruba ou anglais selon vos préférences.",
  },
  {
    q: "Combien de temps mon boost mensuel reste-t-il actif ?",
    a: "Chaque boost dure 7 jours pendant lesquels votre annonce ou recherche est mise en avant en tête de liste, avec un badge Premium reconnaissable.",
  },
  {
    q: "Quels modes de paiement sont acceptés pour Plus ?",
    a: "Tous les moyens disponibles sur KAZA : Mobile Money (MTN, Moov), carte bancaire et virement. La facturation est mensuelle ou annuelle au choix.",
  },
];

function renderPlusCell(value: boolean | string) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="mx-auto size-5 text-amber-500" aria-label="Inclus" />
    ) : (
      <X className="mx-auto size-5 text-gray-300" aria-label="Non inclus" />
    );
  }
  return <span className="text-sm font-medium text-kaza-navy">{value}</span>;
}

// =============================================================================
// Page
// =============================================================================

export default async function PlusPage() {
  const user = await getCurrentDisplayUser();
  const subscription = user ? await getActiveSubscription(user.id) : null;
  const isAuthenticated = Boolean(user);
  const isPlusMember =
    subscription?.plan === "PLUS_MONTHLY" || subscription?.plan === "PLUS_YEARLY";
  const memberSinceLabel = subscription
    ? new Date(subscription.startedAt).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="overflow-hidden">
      {/* ===== HERO h-[80vh] gradient or sunset ============================= */}
      <section className="relative flex min-h-[80vh] w-full items-center justify-center overflow-hidden bg-gradient-to-br from-amber-700 via-amber-500 to-yellow-400 text-white">
        <Image
          src={HERO_IMAGE}
          alt="Style de vie premium"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-35"
        />
        {/* Overlay gradient or → kaza-navy */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-amber-900/40 to-kaza-navy/85" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.4),transparent_50%)]" />

        <div className="relative mx-auto max-w-5xl px-4 py-24 text-center lg:px-8">
          <FadeIn>
            <Badge className="mb-6 border-0 bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-kaza-navy shadow-xl">
              <Crown className="mr-1.5 size-3.5" />
              Membres privilégiés
            </Badge>
          </FadeIn>

          <FadeIn delay={120}>
            <h1 className="font-heading text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              KAZA Plus — l&apos;expérience{" "}
              <span className="bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
                premium
              </span>{" "}
              de l&apos;immobilier
            </h1>
          </FadeIn>

          <FadeIn delay={240}>
            <p className="mx-auto mt-8 max-w-2xl text-lg text-white/90 sm:text-xl">
              Tout KAZA, en mieux. Visibilité boostée, support 24/7, concierge
              personnel et privilèges exclusifs réservés à nos membres Plus.
            </p>
          </FadeIn>

          <FadeIn delay={360}>
            {isPlusMember && memberSinceLabel ? (
              <div className="mt-10 flex flex-col items-center gap-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/50 bg-amber-400/15 px-5 py-2 text-sm font-semibold text-amber-100 backdrop-blur-md">
                  <Crown className="size-4" />
                  Vous êtes membre Plus depuis le {memberSinceLabel}
                </div>
                <Button
                  asChild
                  size="lg"
                  className="rounded-full border-0 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 px-8 text-base font-bold text-kaza-navy shadow-2xl transition-all hover:scale-105 hover:from-amber-300 hover:to-amber-400"
                >
                  <Link href="/profile">
                    Gérer mon abonnement
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full border-0 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 px-8 text-base font-bold text-kaza-navy shadow-2xl transition-all hover:scale-105 hover:from-amber-300 hover:to-amber-400 hover:shadow-amber-500/40"
                >
                  <a href="#tarifs">
                    <Crown className="mr-2 size-4" />
                    Devenir membre Plus
                  </a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full border-white/30 bg-white/10 px-8 text-base text-white backdrop-blur-md hover:bg-white/20 hover:text-white"
                >
                  <a href="#avantages">
                    Voir les avantages
                    <ArrowRight className="ml-2 size-4" />
                  </a>
                </Button>
              </div>
            )}
          </FadeIn>
        </div>
      </section>

      {/* ===== STATS Privilèges ============================================ */}
      <section className="relative bg-gradient-to-br from-white via-amber-50/30 to-yellow-50/30 py-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid grid-cols-2 gap-10 sm:gap-14 lg:grid-cols-4">
            <RevealOnScroll>
              <StatCounter value={5000} suffix="+" label="Membres Plus" description="Au Bénin et au-delà" />
            </RevealOnScroll>
            <RevealOnScroll delay={100}>
              <StatCounter value={150000} suffix=" FCFA" label="Économies moyennes" description="Par membre Plus / an" />
            </RevealOnScroll>
            <RevealOnScroll delay={200}>
              <StatCounter value={12} label="Avantages exclusifs" description="Réservés aux membres" />
            </RevealOnScroll>
            <RevealOnScroll delay={300}>
              <StatCounter value={24} suffix="/7" label="Concierge dédié" description="Réponse < 1h garantie" />
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* ===== 6 AVANTAGES cards premium gradient =========================== */}
      <section
        id="avantages"
        className="relative overflow-hidden bg-white py-24"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 top-1/4 size-96 rounded-full bg-amber-200/30 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 bottom-1/4 size-96 rounded-full bg-yellow-200/30 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
          <RevealOnScroll>
            <div className="mb-16 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">
                Avantages exclusifs
              </p>
              <h2 className="mt-3 font-heading text-4xl font-bold tracking-tight text-kaza-navy sm:text-5xl">
                Ce qui change quand vous êtes{" "}
                <span className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
                  Plus
                </span>
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
                Six privilèges Premium pensés pour transformer votre expérience
                immobilière au quotidien.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {plusFeatures.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <RevealOnScroll key={feature.title} delay={idx * 80}>
                  <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-amber-100 bg-gradient-to-br from-white via-amber-50/40 to-yellow-50/40 p-8 shadow-md transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-amber-200/40">
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -right-12 -top-12 size-32 rounded-full bg-gradient-to-br from-amber-300/30 to-yellow-300/0 blur-2xl"
                    />
                    <div className="relative flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 text-white shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3">
                      <Icon className="size-7" />
                    </div>
                    <h3 className="mt-6 font-heading text-2xl font-bold text-kaza-navy">
                      {feature.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                    <p className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-amber-600">
                      <Sparkles className="size-3" />
                      {feature.detail}
                    </p>
                  </article>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== PRICING 2 plans avec toggle ================================== */}
      <section
        id="tarifs"
        className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-24"
      >
        <div className="relative mx-auto max-w-5xl px-4 lg:px-8">
          <RevealOnScroll>
            <div className="mb-12 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">
                Tarification
              </p>
              <h2 className="mt-3 font-heading text-4xl font-bold tracking-tight text-kaza-navy sm:text-5xl">
                Un tarif simple,{" "}
                <span className="bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent">
                  deux engagements
                </span>{" "}
                au choix
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
                Choisissez la fréquence qui vous correspond. Annuel = 2 mois
                offerts.
              </p>
            </div>
          </RevealOnScroll>

          <PlusPricingToggle
            isAuthenticated={isAuthenticated}
            currentPlan={subscription?.plan ?? null}
            manageHref="/profile"
          />
        </div>
      </section>

      {/* ===== TÉMOIGNAGES MEMBRES PLUS ===================================== */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <RevealOnScroll>
            <div className="mb-16 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">
                Témoignages
              </p>
              <h2 className="mt-3 font-heading text-4xl font-bold tracking-tight text-kaza-navy sm:text-5xl">
                Nos membres{" "}
                <span className="bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent">
                  Plus
                </span>{" "}
                en parlent
              </h2>
            </div>
          </RevealOnScroll>
          <div className="grid gap-8 md:grid-cols-3">
            {plusTestimonials.map((t, idx) => (
              <RevealOnScroll key={t.name} delay={idx * 100}>
                <TestimonialCard
                  {...t}
                  className="h-full rounded-3xl shadow-md hover:shadow-2xl"
                />
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ===== COMPARATIF FREE vs PLUS ====================================== */}
      <section className="relative bg-gradient-to-b from-white to-gray-50 py-24">
        <div className="mx-auto max-w-5xl px-4 lg:px-8">
          <RevealOnScroll>
            <div className="mb-16 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">
                Comparatif
              </p>
              <h2 className="mt-3 font-heading text-4xl font-bold tracking-tight text-kaza-navy sm:text-5xl">
                Free vs{" "}
                <span className="bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent">
                  Plus
                </span>{" "}
                : ce qui change vraiment
              </h2>
            </div>
          </RevealOnScroll>

          <RevealOnScroll>
            <div className="overflow-x-auto rounded-3xl border border-gray-100 bg-white shadow-2xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-gradient-to-r from-kaza-navy via-[#0F2A40] to-kaza-navy text-white">
                  <tr>
                    <th className="px-6 py-5 font-semibold">Fonctionnalité</th>
                    <th className="px-6 py-5 text-center font-semibold">Free</th>
                    <th className="px-6 py-5 text-center font-semibold">
                      <span className="inline-flex items-center gap-1.5">
                        <Crown className="size-4 text-amber-300" /> Plus
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {plusComparison.map((row, idx) => (
                    <tr
                      key={row.feature}
                      className={idx % 2 === 0 ? "bg-white" : "bg-amber-50/30"}
                    >
                      <td className="px-6 py-4 font-medium text-foreground">
                        {row.feature}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {renderPlusCell(row.free)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {renderPlusCell(row.plus)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ===== VOS PRIVILÈGES EN DÉTAIL — 6 mini-sections ================== */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <RevealOnScroll>
            <div className="mb-16 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">
                Vos privilèges en détail
              </p>
              <h2 className="mt-3 font-heading text-4xl font-bold tracking-tight text-kaza-navy sm:text-5xl">
                Une attention{" "}
                <span className="bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent">
                  particulière
                </span>{" "}
                à chaque détail
              </h2>
            </div>
          </RevealOnScroll>

          <div className="grid gap-10 lg:grid-cols-2">
            {PRIVILEGES_DETAILS.map((p, idx) => {
              const Icon = p.icon;
              return (
                <RevealOnScroll key={p.title} delay={idx * 80}>
                  <div className="flex gap-6 rounded-3xl border border-amber-100 bg-gradient-to-br from-white to-amber-50/30 p-8 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl">
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-lg">
                      <Icon className="size-7" />
                    </div>
                    <div>
                      <h3 className="font-heading text-xl font-bold text-kaza-navy">
                        {p.title}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {p.text}
                      </p>
                    </div>
                  </div>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== CTA "Devenir membre Plus" =================================== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-600 via-amber-500 to-yellow-400 py-24 text-kaza-navy">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.4),transparent_50%)]"
        />

        <div className="relative mx-auto max-w-4xl px-4 text-center lg:px-8">
          <RevealOnScroll>
            <Badge className="mb-6 border-0 bg-kaza-navy/90 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-300 shadow-xl">
              <Star className="mr-1.5 size-3.5 fill-current" />
              Rejoignez l&apos;élite KAZA
            </Badge>

            <h2 className="font-heading text-4xl font-bold tracking-tight sm:text-6xl">
              Prêt à passer{" "}
              <span className="bg-gradient-to-r from-white to-amber-100 bg-clip-text text-transparent">
                Plus
              </span>{" "}
              ?
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-kaza-navy/90 sm:text-xl">
              Rejoignez plus de 5 000 membres KAZA Plus qui profitent déjà
              d&apos;une expérience supérieure, d&apos;un concierge dédié et de
              privilèges exclusifs.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="rounded-full border-0 bg-kaza-navy px-10 py-7 text-base font-bold text-white shadow-2xl transition-all hover:scale-105 hover:bg-kaza-navy/90"
              >
                <Link href={isPlusMember ? "/profile" : "#tarifs"}>
                  <Crown className="mr-2 size-5" />
                  {isPlusMember
                    ? "Gérer mon abonnement"
                    : "Devenir membre Plus"}
                  <ArrowRight className="ml-2 size-5" />
                </Link>
              </Button>
            </div>

            <p className="mt-8 text-sm text-kaza-navy/70">
              Sans engagement · Résiliable à tout moment · Activation immédiate
            </p>
          </RevealOnScroll>
        </div>
      </section>

      {/* ===== FAQ Plus ===================================================== */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-24">
        <div className="mx-auto max-w-3xl px-4 lg:px-8">
          <RevealOnScroll>
            <div className="mb-12 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">
                FAQ
              </p>
              <h2 className="mt-3 font-heading text-4xl font-bold tracking-tight text-kaza-navy sm:text-5xl">
                Vos questions, nos réponses
              </h2>
            </div>
          </RevealOnScroll>

          <RevealOnScroll>
            <GlassPanel
              intensity="strong"
              tint="white"
              className="rounded-3xl border border-amber-100 bg-white p-6 shadow-xl sm:p-10"
            >
              <Accordion type="single" collapsible className="w-full">
                {PLUS_FAQ.map((item, idx) => (
                  <AccordionItem key={item.q} value={`item-${idx}`}>
                    <AccordionTrigger className="text-left font-heading text-base font-semibold text-kaza-navy hover:text-amber-600 sm:text-lg">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-base leading-relaxed text-muted-foreground">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </GlassPanel>
          </RevealOnScroll>

          <RevealOnScroll>
            <div className="mt-10 text-center">
              <p className="text-muted-foreground">
                Besoin d&apos;aide pour choisir ?{" "}
                <Link
                  href="mailto:plus@kaza.africa"
                  className="font-semibold text-amber-600 underline-offset-4 hover:underline"
                >
                  Écrivez à plus@kaza.africa
                </Link>
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </section>
    </div>
  );
}
