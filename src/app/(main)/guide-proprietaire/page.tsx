import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  Calendar,
  Camera,
  CheckCircle2,
  FileSignature,
  FileText,
  Gauge,
  Handshake,
  Headphones,
  Megaphone,
  MessagesSquare,
  PenLine,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { StatCounter } from "@/components/marketing/stat-counter";
import { FeatureHighlight } from "@/components/marketing/feature-highlight";
import { FadeIn } from "@/components/shared/fade-in";
import { RevealOnScroll } from "@/components/shared/reveal-on-scroll";
import { GlassPanel } from "@/components/shared/glass-panel";

export const metadata: Metadata = {
  title: "Guide complet du propriétaire — KAZA",
  description:
    "Le guide premium pour publier, louer et gérer votre bien sur KAZA. Locataires vérifiés, escrow garanti, contrats numériques OHADA, support 24/7.",
  openGraph: {
    title: "Guide du propriétaire — KAZA",
    description:
      "Tout pour louer plus vite, plus serein, et augmenter vos revenus locatifs avec KAZA.",
    type: "article",
  },
};

const stats = [
  { value: 5, label: "Pays couverts", description: "Bénin, Côte d'Ivoire, Togo, Sénégal, Niger" },
  { value: 100, suffix: "%", label: "Annonces vérifiées", description: "Contrôle qualité systématique" },
  { value: 0, suffix: " FCFA", label: "Inscription", description: "Publier une annonce est gratuit" },
  { value: 24, suffix: "/7", label: "Support dédié", description: "Une équipe à votre écoute" },
];

const whyKaza = [
  {
    icon: "ShieldCheck",
    title: "Locataires vérifiés",
    description:
      "KYC obligatoire : pièce d'identité, selfie biométrique, OTP. Vous ne traitez qu'avec des profils réels et solvables.",
    metric: "100 % des dossiers vérifiés",
  },
  {
    icon: "Wallet",
    title: "Escrow garanti",
    description:
      "Caution et premier loyer bloqués sur compte séquestre KAZA, libérés à la remise effective des clés.",
    metric: "0 impayé sur la caution",
  },
  {
    icon: "FileSignature",
    title: "Contrats numériques OHADA",
    description:
      "Bail conforme OHADA généré automatiquement, signé électroniquement, archivé et opposable juridiquement.",
    metric: "Signature en 2 minutes",
  },
  {
    icon: "Star",
    title: "Analytics avancées",
    description:
      "Tableau de bord avec vues, visites, taux de conversion. Pilotez vos annonces comme un pro.",
    metric: "Données en temps réel",
  },
  {
    icon: "MessagesSquare",
    title: "Support dédié",
    description:
      "Équipe support française dédiée aux propriétaires, accessible par chat, email et téléphone 7j/7.",
    metric: "Réponse < 2h en moyenne",
  },
  {
    icon: "MapPin",
    title: "Visibilité maximale",
    description:
      "Annonces poussées sur KAZA, Google et nos partenaires immobiliers. Plus de 250 000 visiteurs uniques par mois.",
    metric: "x4 vs annonce classique",
  },
];

const timelineSteps = [
  {
    number: "01",
    duration: "2 min",
    title: "Créez votre compte propriétaire",
    description:
      "Inscription gratuite, sans engagement ni carte bancaire. Confirmation par OTP et c'est parti.",
    href: "/signup?role=OWNER",
    cta: "Créer mon compte",
    icon: UserCheck,
  },
  {
    number: "02",
    duration: "5 min",
    title: "Publiez votre annonce",
    description:
      "Wizard guidé : photos, description, prix, équipements, géolocalisation. Validation par notre équipe sous 24 h.",
    href: "/owner/properties/new",
    cta: "Publier une annonce",
    icon: Megaphone,
  },
  {
    number: "03",
    duration: "Variable",
    title: "Recevez et sélectionnez les visites",
    description:
      "Messagerie intégrée, calendrier de visites synchronisé, dossiers candidats consultables en un clic.",
    href: null,
    cta: null,
    icon: Calendar,
  },
  {
    number: "04",
    duration: "10 min",
    title: "Signez le contrat et percevez vos loyers",
    description:
      "Bail OHADA généré et signé électroniquement. Encaissement automatique chaque mois via Mobile Money.",
    href: null,
    cta: null,
    icon: Handshake,
  },
];

const bestPractices = [
  {
    icon: Camera,
    title: "Photos professionnelles",
    description:
      "Lumière naturelle, plan large, 8 à 15 clichés par bien. Une annonce avec photos pro reçoit 3x plus de visites.",
  },
  {
    icon: PenLine,
    title: "Description complète",
    description:
      "Détaillez surface, étages, exposition, équipements, charges, environnement, proximité écoles et transports.",
  },
  {
    icon: BarChart3,
    title: "Prix justes",
    description:
      "Consultez notre outil d'estimation par quartier. Un prix aligné se loue 4x plus vite qu'un prix surévalué.",
  },
  {
    icon: Bell,
    title: "Réactivité aux visites",
    description:
      "Répondez en moins de 4 h aux demandes : votre taux de conversion peut doubler. Activez les notifications push.",
  },
  {
    icon: UserCheck,
    title: "Vérifiez votre locataire",
    description:
      "Consultez le score KAZA, les justificatifs (revenus, garant) et les avis d'anciens bailleurs avant d'accepter.",
  },
  {
    icon: FileSignature,
    title: "Bail OHADA conforme",
    description:
      "Utilisez le contrat KAZA pré-rempli : clauses légales, durée, dépôt, révision de loyer, conditions de résiliation.",
  },
];

const tools = [
  { icon: Gauge, title: "Dashboard propriétaire", description: "Vue 360° de vos biens, vacances locatives, alertes." },
  { icon: Calendar, title: "Calendrier de visites", description: "Synchronisation Google Calendar et rappels SMS." },
  { icon: BarChart3, title: "Analytics annonces", description: "Vues, favoris, contacts, conversion. Optimisez en continu." },
  { icon: FileText, title: "Contrats numériques", description: "Bail, état des lieux, quittances générés automatiquement." },
  { icon: MessagesSquare, title: "Messagerie intégrée", description: "Tous vos échanges centralisés, archivés, chiffrés." },
  { icon: Bell, title: "Notifications intelligentes", description: "Visites, paiements, échéances : ne ratez plus rien." },
];

const legalFaq = [
  {
    q: "Quelle est la durée légale d'un bail au Bénin ?",
    a: "Au Bénin et dans la zone OHADA, le bail d'habitation est généralement conclu pour une durée d'1 an renouvelable tacitement. Pour les locations meublées, des durées plus courtes (6 mois) sont possibles. KAZA propose les deux formats dans son générateur de contrat.",
  },
  {
    q: "Combien puis-je demander en dépôt de garantie ?",
    a: "L'usage au Bénin est de 1 à 3 mois de loyer hors charges pour les locations vides, et jusqu'à 2 mois pour les meublées. KAZA recommande 2 mois maximum pour rester compétitif et facilite la sécurisation via son escrow.",
  },
  {
    q: "Puis-je augmenter le loyer en cours de bail ?",
    a: "Une révision annuelle est possible si une clause de révision est prévue au contrat. Elle suit généralement l'évolution d'un indice de référence. Hors clause, aucune augmentation n'est légalement opposable au locataire avant le renouvellement.",
  },
  {
    q: "Comment résilier un bail à un locataire ?",
    a: "La résiliation à l'initiative du bailleur doit reposer sur un motif légitime (vente, reprise, manquement grave) et respecter un préavis (3 mois généralement). KAZA accompagne cette procédure avec modèles de lettres recommandés et conseil juridique.",
  },
];

export default function GuideProprietairePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-kaza-navy via-[#0F2A40] to-kaza-green/40 text-white">
        <div
          className="pointer-events-none absolute -right-32 -top-32 size-96 rounded-full bg-kaza-green/20 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-32 size-96 rounded-full bg-kaza-blue/20 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-5xl px-4 py-20 text-center sm:py-24 lg:px-8">
          <FadeIn>
            <Badge className="mb-4 bg-kaza-green/20 text-kaza-green hover:bg-kaza-green/30">
              Guide premium propriétaire
            </Badge>
            <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Le{" "}
              <span className="bg-gradient-to-r from-kaza-green to-kaza-blue bg-clip-text text-transparent">
                guide complet du propriétaire
              </span>{" "}
              KAZA
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80 sm:text-xl">
              Tout pour publier, louer et gérer votre bien en toute sérénité.
              Locataires vérifiés, escrow garanti, contrats OHADA et support
              dédié — KAZA s&apos;occupe du reste.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="bg-kaza-green hover:bg-kaza-green/90">
                <Link href="/signup?role=OWNER">
                  Publier mon bien gratuitement
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white bg-transparent text-white hover:bg-white/10"
              >
                <Link href="#timeline">Voir les 4 étapes</Link>
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

      {/* Pourquoi KAZA */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold tracking-widest uppercase text-kaza-blue">
              Pourquoi KAZA
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold text-kaza-navy sm:text-4xl">
              6 raisons de choisir KAZA pour votre bien
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              La première plateforme africaine pensée pour les propriétaires
              exigeants.
            </p>
          </div>

          <div className="mt-12 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {whyKaza.map((item, idx) => (
              <RevealOnScroll key={item.title} delay={(idx % 3) * 100}>
                <div className="h-full rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
                  <FeatureHighlight
                    icon={item.icon}
                    title={item.title}
                    description={item.description}
                    metric={item.metric}
                  />
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline 4 étapes */}
      <section id="timeline" className="bg-white py-20">
        <div className="mx-auto max-w-5xl px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold tracking-widest uppercase text-kaza-green">
              Démarrer en 4 étapes
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold text-kaza-navy sm:text-4xl">
              De l&apos;inscription au premier loyer
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Comptez moins de 20 minutes au total pour mettre votre bien en
              ligne.
            </p>
          </div>

          <div className="relative mt-16">
            <div
              className="absolute left-7 top-2 bottom-2 hidden w-px bg-gradient-to-b from-kaza-blue via-kaza-green to-kaza-navy sm:block"
              aria-hidden="true"
            />
            <ol className="space-y-10">
              {timelineSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <li key={step.number} className="relative">
                    <RevealOnScroll direction="left">
                      <div className="flex flex-col gap-5 sm:flex-row sm:gap-8">
                        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-kaza-navy to-kaza-blue text-white shadow-md ring-4 ring-white">
                          <span className="font-heading text-lg font-bold">
                            {step.number}
                          </span>
                        </div>
                        <div className="flex-1 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                          <div className="flex flex-wrap items-center gap-3">
                            <Icon className="size-5 text-kaza-blue" />
                            <h3 className="font-heading text-xl font-semibold text-kaza-navy">
                              {step.title}
                            </h3>
                            <Badge variant="secondary" className="bg-kaza-green/10 text-kaza-green">
                              {step.duration}
                            </Badge>
                          </div>
                          <p className="mt-3 text-base text-muted-foreground">
                            {step.description}
                          </p>
                          {step.href && step.cta && (
                            <Button
                              asChild
                              variant="link"
                              className="mt-3 h-auto p-0 text-kaza-blue"
                            >
                              <Link href={step.href}>
                                {step.cta}
                                <ArrowRight className="ml-1 size-4" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </RevealOnScroll>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </section>

      {/* Bonnes pratiques */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold tracking-widest uppercase text-kaza-blue">
              Bonnes pratiques
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold text-kaza-navy sm:text-4xl">
              Les 6 règles d&apos;or pour louer rapidement
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Les bonnes pratiques pour louer plus vite et en toute sérénité sur
              KAZA.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {bestPractices.map((item, idx) => {
              const Icon = item.icon;
              return (
                <RevealOnScroll key={item.title} delay={(idx % 3) * 100}>
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <CardHeader>
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-kaza-blue/10">
                        <Icon className="size-5 text-kaza-blue" />
                      </div>
                      <CardTitle className="font-heading text-lg text-kaza-navy">
                        {item.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </CardContent>
                  </Card>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* Outils KAZA */}
      <section className="relative overflow-hidden bg-kaza-navy py-20 text-white">
        <div
          className="pointer-events-none absolute -right-24 top-1/2 size-80 -translate-y-1/2 rounded-full bg-kaza-blue/20 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold tracking-widest uppercase text-kaza-green">
              Inclus dans votre compte
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold sm:text-4xl">
              Tous les outils KAZA, gratuits pour les propriétaires
            </h2>
            <p className="mt-4 text-base text-white/70">
              Aucun abonnement, aucun frais caché. Vous ne payez qu&apos;une
              commission sur les loyers encaissés.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool, idx) => {
              const Icon = tool.icon;
              return (
                <RevealOnScroll key={tool.title} delay={(idx % 3) * 100}>
                  <GlassPanel intensity="medium" tint="white" className="h-full p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-kaza-green/20">
                      <Icon className="size-5 text-kaza-green" />
                    </div>
                    <h3 className="mt-4 font-heading text-base font-semibold">
                      {tool.title}
                    </h3>
                    <p className="mt-2 text-sm text-white/70">
                      {tool.description}
                    </p>
                  </GlassPanel>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ juridique */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-3xl px-4 lg:px-8">
          <div className="text-center">
            <p className="text-xs font-semibold tracking-widest uppercase text-kaza-blue">
              FAQ juridique
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold text-kaza-navy sm:text-4xl">
              Vos questions, nos réponses
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Cadre légal du bail d&apos;habitation au Bénin et zone OHADA.
            </p>
          </div>

          <FadeIn delay={150}>
            <Accordion type="single" collapsible className="mt-10 rounded-2xl border border-gray-100 bg-gray-50 px-6">
              {legalFaq.map((item, idx) => (
                <AccordionItem key={item.q} value={`item-${idx}`}>
                  <AccordionTrigger className="text-left font-heading text-base font-semibold text-kaza-navy">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm leading-relaxed">{item.a}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </FadeIn>
        </div>
      </section>

      {/* CTA final */}
      <section className="relative overflow-hidden bg-gradient-to-br from-kaza-green via-[#3FA040] to-kaza-navy py-20 text-white">
        <div
          className="pointer-events-none absolute -right-32 -top-32 size-96 rounded-full bg-white/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-32 size-96 rounded-full bg-white/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-4xl px-4 text-center lg:px-8">
          <Sparkles className="mx-auto size-10 text-white" aria-hidden="true" />
          <h2 className="mt-6 font-heading text-3xl font-bold sm:text-4xl lg:text-5xl">
            Prêt à publier votre bien sur KAZA ?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/85">
            Inscription gratuite en moins de 2 minutes. Pas de carte bancaire,
            pas d&apos;engagement. Commencez à recevoir des candidats vérifiés
            dès aujourd&apos;hui.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-white text-kaza-navy hover:bg-white/90"
            >
              <Link href="/signup?role=OWNER">
                <Building2 className="mr-2 size-4" />
                Publier mon bien gratuitement
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white bg-transparent text-white hover:bg-white/10"
            >
              <Link href="/pricing">Voir nos tarifs</Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-white/75">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="size-4" />
              Sans engagement
            </span>
            <span className="flex items-center gap-2">
              <Headphones className="size-4" />
              Support 24/7
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="size-4" />
              Locataires vérifiés
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
