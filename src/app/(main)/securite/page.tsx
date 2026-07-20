import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Eye,
  FileSignature,
  Gavel,
  Headphones,
  KeyRound,
  Landmark,
  Lock,
  Mail,
  MessagesSquare,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCounter } from "@/components/marketing/stat-counter";
import { GradientCard } from "@/components/marketing/gradient-card";
import { FadeIn } from "@/components/shared/fade-in";
import { RevealOnScroll } from "@/components/shared/reveal-on-scroll";
import { GlassPanel } from "@/components/shared/glass-panel";

export const metadata: Metadata = {
  title: "Sécurité — Kaabo",
  description:
    "Vérification d'identité, escrow Kaabo, contrats numériques OHADA, chiffrement AES-256. Découvrez les 6 piliers qui font de Kaabo la plateforme la plus sûre d'Afrique.",
  openGraph: {
    title: "La sécurité Kaabo — 6 piliers, 0 fraude",
    description:
      "KYC, escrow, signature électronique, chiffrement bout-en-bout, modération humaine et conformité APDP.",
    type: "website",
  },
};

const stats = [
  { value: 100, suffix: "%", label: "Identités vérifiées", description: "KYC obligatoire pour tous" },
  { value: 24, suffix: "/7", label: "Surveillance anti-fraude", description: "Détection continue des comportements suspects" },
  { value: 256, label: "Chiffrement AES", description: "Standard bancaire" },
  { value: 100, suffix: "%", label: "Paiements sécurisés", description: "Séquestre & traçabilité" },
];

const pillars = [
  {
    icon: UserCheck,
    title: "Vérification d'identité (KYC)",
    description:
      "Chaque utilisateur fournit une pièce d'identité officielle, un selfie biométrique et un OTP. Aucune annonce ni transaction n'est possible sans vérification validée par notre équipe.",
    accent: "from-kaza-blue/20 to-kaza-blue/5",
    iconColor: "text-kaza-blue",
  },
  {
    icon: Wallet,
    title: "Paiements sécurisés (Escrow Kaabo)",
    description:
      "Caution et premier loyer sont bloqués sur un compte séquestre Kaabo et libérés uniquement à la remise effective des clés. Vos fonds sont protégés à 100 %.",
    accent: "from-kaza-green/20 to-kaza-green/5",
    iconColor: "text-kaza-green",
  },
  {
    icon: FileSignature,
    title: "Contrats numériques",
    description:
      "Bail OHADA généré automatiquement, signé électroniquement (eIDAS / Acte uniforme OHADA), horodaté et archivé. Opposable juridiquement en cas de litige.",
    accent: "from-kaza-navy/20 to-kaza-navy/5",
    iconColor: "text-kaza-navy",
  },
  {
    icon: Lock,
    title: "Chiffrement bout-en-bout",
    description:
      "Toutes les communications utilisent TLS 1.3, les données sensibles sont chiffrées AES-256 au repos. Vos messages, contrats et paiements restent strictement confidentiels.",
    accent: "from-kaza-blue/20 to-kaza-blue/5",
    iconColor: "text-kaza-blue",
  },
  {
    icon: Eye,
    title: "Modération humaine",
    description:
      "Une équipe dédiée valide chaque annonce, surveille les conversations suspectes et traite chaque signalement en moins de 24 heures.",
    accent: "from-kaza-green/20 to-kaza-green/5",
    iconColor: "text-kaza-green",
  },
  {
    icon: ShieldCheck,
    title: "Protection des données",
    description:
      "Conformité totale à la loi n° 2017-20 du Bénin (protection des données à caractère personnel) et au RGPD pour nos utilisateurs européens. Audit annuel par cabinet indépendant.",
    accent: "from-kaza-navy/20 to-kaza-navy/5",
    iconColor: "text-kaza-navy",
  },
];

const tips = [
  {
    icon: Wallet,
    title: "Ne payez jamais en dehors de Kaabo",
    description:
      "Toute demande de paiement par Mobile Money personnel, Western Union ou cash est suspecte. Utilisez exclusivement l'escrow Kaabo.",
  },
  {
    icon: BadgeCheck,
    title: "Vérifiez le badge Identité vérifiée",
    description:
      "Les profils sérieux affichent un badge vert KYC. En son absence, ne procédez ni à une visite ni à un paiement.",
  },
  {
    icon: MessagesSquare,
    title: "Communiquez via la messagerie Kaabo",
    description:
      "Évitez WhatsApp et numéros personnels avant signature : la messagerie Kaabo est chiffrée, archivée et opposable.",
  },
  {
    icon: ShieldAlert,
    title: "Signalez tout comportement suspect",
    description:
      "Le bouton « Signaler » est présent sur chaque profil, annonce et conversation. Notre équipe traite chaque alerte en moins de 24 h.",
  },
  {
    icon: ScrollText,
    title: "Lisez le contrat avant signature",
    description:
      "Vérifiez durée, loyer, charges, dépôt, clauses particulières. En cas de doute, l'équipe juridique Kaabo vous accompagne.",
  },
  {
    icon: KeyRound,
    title: "Activez l'authentification 2FA",
    description:
      "Dans vos paramètres, activez la double authentification par SMS ou application. Indispensable pour les propriétaires.",
  },
];

const incidentSteps = [
  {
    number: "01",
    icon: AlertTriangle,
    title: "Signalez l'incident",
    description:
      "Utilisez le bouton « Signaler » dans l'app ou écrivez à immobilierkaza@gmail.com. Décrivez précisément les faits avec captures d'écran.",
  },
  {
    number: "02",
    icon: Headphones,
    title: "Médiation Kaabo",
    description:
      "Notre équipe litiges contacte les deux parties sous 24 h, examine les preuves et propose une résolution amiable équitable.",
  },
  {
    number: "03",
    icon: Gavel,
    title: "Recours juridique",
    description:
      "Si nécessaire, Kaabo fournit l'ensemble du dossier (contrat, messages, paiements) et oriente vers nos avocats partenaires OHADA.",
  },
];

const certifications = [
  {
    icon: Landmark,
    title: "APDP",
    description: "Autorité de Protection des Données Personnelles du Bénin",
  },
  {
    icon: ScrollText,
    title: "OHADA",
    description: "Acte uniforme sur le droit commercial général",
  },
  {
    icon: ShieldCheck,
    title: "Code numérique Bénin",
    description: "Loi n° 2017-20 portant code du numérique",
  },
  {
    icon: Lock,
    title: "Standards bancaires",
    description: "Chiffrement AES-256, TLS 1.3, audit annuel",
  },
];

export default function SecuritePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-kaza-navy via-[#0F2A40] to-kaza-blue/30 text-white">
        <div
          className="pointer-events-none absolute -right-40 -top-40 size-[28rem] rounded-full bg-kaza-blue/20 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-40 -left-40 size-[28rem] rounded-full bg-kaza-green/15 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-5xl px-4 py-20 text-center sm:py-24 lg:px-8">
          <FadeIn>
            <Badge className="mb-4 bg-kaza-green/20 text-kaza-green hover:bg-kaza-green/30">
              <ShieldCheck className="mr-1 size-3.5" />
              Sécurité
            </Badge>
            <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Votre{" "}
              <span className="bg-gradient-to-r from-kaza-green to-kaza-blue bg-clip-text text-transparent">
                sécurité
              </span>{" "}
              est notre priorité
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg text-white/80 sm:text-xl">
              KYC obligatoire, escrow garanti, contrats numériques OHADA,
              chiffrement AES-256, modération humaine et conformité APDP.
              <br />
              Six piliers qui font de Kaabo une plateforme immobilière sûre,
              partout en Afrique.
              <br />
              Surveillance anti-fraude permanente.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="bg-kaza-green hover:bg-kaza-green/90">
                <Link href="#piliers">Découvrir les 6 piliers</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white bg-transparent text-white hover:bg-white/10"
              >
                <Link href="#signaler">Signaler un incident</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, idx) => (
              <RevealOnScroll key={stat.label} delay={idx * 100}>
                <StatCounter
                  value={stat.value}
                  suffix={stat.suffix}
                  label={stat.label}
                  description={stat.description}
                />
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* 6 piliers */}
      <section id="piliers" className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold tracking-widest uppercase text-kaza-blue">
              6 piliers de sécurité
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold text-kaza-navy sm:text-4xl">
              Une protection à 360° pour chaque transaction
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Sécurité technique, juridique et humaine — pensée dès le premier
              jour pour le contexte africain.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <RevealOnScroll key={pillar.title} delay={(idx % 3) * 100}>
                  <Card className="group h-full overflow-hidden border-gray-100 transition-shadow hover:shadow-lg">
                    <div
                      className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${pillar.accent}`}
                      aria-hidden="true"
                    />
                    <CardHeader>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 transition-transform group-hover:scale-110">
                        <Icon className={`size-6 ${pillar.iconColor}`} />
                      </div>
                      <CardTitle className="mt-2 font-heading text-lg text-kaza-navy">
                        {pillar.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {pillar.description}
                      </p>
                    </CardContent>
                  </Card>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* Conseils */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold tracking-widest uppercase text-kaza-green">
              Conseils pratiques
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold text-kaza-navy sm:text-4xl">
              6 réflexes pour rester en sécurité
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Ces règles simples vous protègent dans 99 % des situations à
              risque.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tips.map((tip, idx) => {
              const Icon = tip.icon;
              return (
                <RevealOnScroll key={tip.title} delay={(idx % 3) * 100}>
                  <div className="flex h-full gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-6 transition-colors hover:bg-white hover:shadow-md">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-kaza-green/15 text-kaza-green">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-heading text-base font-semibold text-kaza-navy">
                        {tip.title}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {tip.description}
                      </p>
                    </div>
                  </div>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* En cas de problème */}
      <section className="relative overflow-hidden bg-kaza-navy py-20 text-white">
        <div
          className="pointer-events-none absolute -right-32 top-1/2 size-96 -translate-y-1/2 rounded-full bg-kaza-blue/15 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-6xl px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold tracking-widest uppercase text-kaza-green">
              En cas de problème
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold sm:text-4xl">
              Trois étapes, un seul interlocuteur
            </h2>
            <p className="mt-4 text-base text-white/70">
              Kaabo vous accompagne du signalement à la résolution, y compris
              juridique.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {incidentSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <RevealOnScroll key={step.number} delay={idx * 120}>
                  <GlassPanel intensity="medium" tint="white" className="h-full p-6">
                    <div className="flex items-center gap-3">
                      <span className="font-heading text-3xl font-bold text-white/30">
                        {step.number}
                      </span>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-kaza-green/20">
                        <Icon className="size-5 text-kaza-green" />
                      </div>
                    </div>
                    <h3 className="mt-4 font-heading text-lg font-semibold">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-sm text-white/75">
                      {step.description}
                    </p>
                  </GlassPanel>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold tracking-widest uppercase text-kaza-blue">
              Certifications & Conformité
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold text-kaza-navy sm:text-4xl">
              Conformes aux standards les plus exigeants
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Kaabo respecte toutes les obligations légales en vigueur au Bénin,
              dans l&apos;espace OHADA et à l&apos;international.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {certifications.map((cert, idx) => {
              const Icon = cert.icon;
              return (
                <RevealOnScroll key={cert.title} delay={(idx % 4) * 100}>
                  <div className="flex h-full flex-col items-center rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-kaza-blue/10">
                      <Icon className="size-6 text-kaza-blue" />
                    </div>
                    <h3 className="mt-4 font-heading text-base font-semibold text-kaza-navy">
                      {cert.title}
                    </h3>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {cert.description}
                    </p>
                  </div>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA signaler */}
      <section id="signaler" className="bg-white py-20">
        <div className="mx-auto max-w-4xl px-4 lg:px-8">
          <GradientCard variant="navy" className="p-10 sm:p-12">
            <div className="text-center">
              <Sparkles className="mx-auto size-10 text-kaza-green" aria-hidden="true" />
              <h2 className="mt-6 font-heading text-3xl font-bold sm:text-4xl">
                Vous suspectez un incident de sécurité ?
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-white/85 sm:text-lg">
                Notre équipe sécurité traite chaque alerte sous 24 heures.
                N&apos;hésitez jamais à nous contacter, même en cas de doute.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button asChild size="lg" className="bg-kaza-green hover:bg-kaza-green/90">
                  <Link href="mailto:immobilierkaza@gmail.com">
                    <Mail className="mr-2 size-4" />
                    Signaler un incident
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white bg-transparent text-white hover:bg-white/10"
                >
                  <Link href="/help">Centre d&apos;aide</Link>
                </Button>
              </div>
              <p className="mt-6 text-sm text-white/70">
                Email direct :{" "}
                <a
                  href="mailto:immobilierkaza@gmail.com"
                  className="font-semibold text-kaza-green underline-offset-4 hover:underline"
                >
                  immobilierkaza@gmail.com
                </a>
              </p>
            </div>
          </GradientCard>
        </div>
      </section>
    </div>
  );
}
