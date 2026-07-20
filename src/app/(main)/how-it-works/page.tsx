import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Play,
  Users,
  ArrowRight,
  Sparkles,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { FeatureHighlight } from "@/components/marketing/feature-highlight";
import { RevealOnScroll } from "@/components/shared/reveal-on-scroll";
import { FadeIn } from "@/components/shared/fade-in";
import { AnimatedGradientBg } from "@/components/shared/animated-gradient-bg";
import { GlassPanel } from "@/components/shared/glass-panel";
import { HowItWorksTabs } from "./how-it-works-tabs";

export const metadata: Metadata = {
  title: "Comment ça marche — Kaabo",
  description:
    "Découvrez comment fonctionne Kaabo pour les locataires, propriétaires et étudiants. 4 étapes simples pour louer, publier ou trouver une colocation en toute sécurité.",
  openGraph: {
    title: "Comment fonctionne Kaabo — Louer, publier, partager",
    description:
      "Recherchez, visitez, réservez, emménagez. Découvrez le parcours Kaabo pour chaque profil utilisateur.",
    type: "website",
  },
};

const securityPillars = [
  {
    icon: "ShieldCheck",
    title: "Vérification d'identité",
    description:
      "Chaque utilisateur est vérifié par KYC (pièce d'identité + selfie biométrique). Vous ne traitez qu'avec des profils réels et authentifiés.",
    metric: "100 % comptes vérifiés",
  },
  {
    icon: "Wallet",
    title: "Escrow sécurisé",
    description:
      "Vos fonds (caution, premier loyer) sont bloqués sur un compte séquestre chiffré et libérés uniquement après la remise effective des clés.",
    metric: "Fonds 100 % protégés",
  },
  {
    icon: "FileSignature",
    title: "Contrats numériques",
    description:
      "Bail conforme au droit en vigueur, signé électroniquement en quelques minutes. PDF archivé et juridiquement opposable.",
    metric: "Signature électronique légale",
  },
];

// Grandes villes africaines couvertes par le référentiel Kaabo (panafricain).
const KAZA_CITIES = [
  { name: "Cotonou", country: "Bénin", active: true, lat: "" },
  { name: "Abidjan", country: "Côte d'Ivoire", active: true, lat: "" },
  { name: "Dakar", country: "Sénégal", active: true, lat: "" },
  { name: "Lagos", country: "Nigeria", active: true, lat: "" },
  { name: "Accra", country: "Ghana", active: true, lat: "" },
  { name: "Lomé", country: "Togo", active: true, lat: "" },
  { name: "Le Caire", country: "Égypte", active: true, lat: "" },
  { name: "Casablanca", country: "Maroc", active: true, lat: "" },
  { name: "Nairobi", country: "Kenya", active: true, lat: "" },
];

export default function HowItWorksPage() {
  return (
    <div className="overflow-hidden">
      {/* ===== HERO ANIMATED GRADIENT ================================ */}
      <AnimatedGradientBg className="relative flex min-h-[70vh] items-center">
        <div className="relative mx-auto w-full max-w-6xl px-4 py-24 text-center lg:px-8">
          <FadeIn>
            <Badge className="mb-6 border-kaza-blue/20 bg-kaza-blue/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-kaza-blue uppercase">
              <Sparkles className="mr-2 size-3.5" />
              Mode d&apos;emploi
            </Badge>
          </FadeIn>
          <FadeIn delay={100}>
            <h1 className="font-heading text-4xl font-bold leading-[1.05] tracking-tight text-kaza-navy sm:text-5xl lg:text-7xl">
              Comment fonctionne{" "}
              <span className="bg-gradient-to-r from-kaza-blue via-kaza-green to-kaza-blue bg-clip-text text-transparent">
                Kaabo en 4 étapes
              </span>
            </h1>
          </FadeIn>
          <FadeIn delay={200}>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Une plateforme pensée pour chaque profil. Découvrez le parcours
              qui correspond au vôtre — simple, rapide, sécurisé.
            </p>
          </FadeIn>
          <FadeIn delay={300}>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="h-14 rounded-full bg-kaza-navy px-8 text-base font-semibold hover:bg-kaza-blue"
              >
                <Link href="/signup">
                  Démarrer maintenant
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-14 rounded-full border-kaza-navy bg-white/60 px-8 text-base font-semibold text-kaza-navy backdrop-blur-md hover:bg-white"
              >
                <Link href="#video">
                  <Play className="mr-2 size-4 fill-current" />
                  Voir la vidéo
                </Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </AnimatedGradientBg>

      {/* ===== TABS PROFILES ========================================= */}
      <section className="bg-white py-24" id="profils">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <RevealOnScroll>
            <div className="mb-12 text-center">
              <p className="mb-3 text-xs font-semibold tracking-widest text-kaza-blue uppercase">
                Trois parcours, une seule plateforme
              </p>
              <h2 className="font-heading text-3xl font-bold text-kaza-navy sm:text-4xl lg:text-5xl">
                Choisissez votre profil
              </h2>
            </div>
          </RevealOnScroll>

          <HowItWorksTabs />
        </div>
      </section>

      {/* Section vidéo retirée — sera réactivée quand une vraie vidéo de
          présentation sera disponible (évite un lecteur factice). */}

      {/* ===== SÉCURITÉ CHEZ Kaabo ==================================== */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <RevealOnScroll>
            <div className="mb-16 text-center">
              <p className="mb-3 text-xs font-semibold tracking-widest text-kaza-blue uppercase">
                Sécurité Kaabo
              </p>
              <h2 className="font-heading text-3xl font-bold text-kaza-navy sm:text-4xl lg:text-5xl">
                Trois piliers pour protéger chaque transaction
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                La sécurité n&apos;est pas une option chez Kaabo — c&apos;est notre
                fondation.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid gap-8 lg:grid-cols-3">
            {securityPillars.map((p, i) => (
              <RevealOnScroll key={p.title} delay={i * 120}>
                <div className="group h-full rounded-3xl border border-gray-100 bg-white p-2 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
                  <FeatureHighlight
                    icon={p.icon}
                    title={p.title}
                    description={p.description}
                    metric={p.metric}
                  />
                </div>
              </RevealOnScroll>
            ))}
          </div>

          <RevealOnScroll>
            <div className="mt-16 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Users className="size-4 text-kaza-blue" />
              <span>
                Déjà plus de{" "}
                <strong className="font-semibold text-kaza-navy">10 000</strong>{" "}
                utilisateurs vérifiés sur Kaabo
              </span>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ===== PRÉSENTS AU BÉNIN ===================================== */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-kaza-navy via-kaza-navy to-kaza-blue/40 py-24 text-white">
        <Image
          src="https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=2000&q=80"
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-15"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -top-32 -right-32 size-[32rem] rounded-full bg-kaza-green/20 blur-3xl"
          aria-hidden
        />

        <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
          <RevealOnScroll>
            <div className="mb-16 text-center">
              <p className="mb-3 text-xs font-semibold tracking-widest text-kaza-green uppercase">
                Couverture géographique
              </p>
              <h2 className="font-heading text-3xl font-bold sm:text-4xl lg:text-5xl">
                Présents dans toute l&apos;Afrique
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-white/75">
                Du littoral atlantique à l&apos;Atacora, et bientôt dans toute
                l&apos;Afrique de l&apos;Ouest.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {KAZA_CITIES.map((c, i) => (
              <RevealOnScroll key={c.name} delay={i * 60}>
                <GlassPanel
                  intensity="medium"
                  tint="navy"
                  className={
                    "flex items-center gap-4 rounded-2xl border-white/10 p-5 transition-all hover:-translate-y-1 " +
                    (c.active ? "bg-white/10" : "bg-white/5 opacity-70")
                  }
                >
                  <div
                    className={
                      "flex size-12 shrink-0 items-center justify-center rounded-full " +
                      (c.active
                        ? "bg-kaza-green/20 text-kaza-green"
                        : "bg-white/10 text-white/60")
                    }
                  >
                    <MapPin className="size-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-heading text-base font-semibold">
                      {c.name}
                    </p>
                    <p className="text-xs text-white/60">{c.country}</p>
                  </div>
                  {c.active ? (
                    <Badge className="bg-kaza-green/20 text-xs font-semibold text-kaza-green">
                      Actif
                    </Badge>
                  ) : (
                    <Badge className="border-white/20 bg-white/10 text-xs font-semibold text-white/70">
                      {c.lat}
                    </Badge>
                  )}
                </GlassPanel>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Section "Témoignages" retirée — réactivée quand de vrais avis seront
          publiés. */}

      {/* ===== CTA FINAL ============================================== */}
      <CtaBanner
        title="Prêt à essayer Kaabo ?"
        description="Inscription gratuite en moins de 2 minutes. Sans engagement, sans carte bancaire."
        primaryAction={{ label: "Créer mon compte", href: "/signup" }}
        secondaryAction={{ label: "Voir les tarifs", href: "/pricing" }}
      />
    </div>
  );
}
