import type { Metadata } from "next";
import {
  Search,
  Building2,
  GraduationCap,
  ShieldCheck,
  Wallet,
  Star,
  Play,
  Eye,
  CalendarCheck,
  KeyRound,
  Megaphone,
  Inbox,
  UserCheck,
  Banknote,
  Users,
  MessageCircle,
  Calculator,
  Sparkles,
} from "lucide-react";
import { SectionHero } from "@/components/marketing/section-hero";
import { CtaBanner } from "@/components/marketing/cta-banner";

export const metadata: Metadata = {
  title: "Comment ça marche — KAZA",
  description:
    "Découvrez comment fonctionne KAZA pour les locataires, propriétaires et étudiants. 4 étapes simples pour louer, publier ou trouver une colocation en toute sécurité.",
  openGraph: {
    title: "Comment fonctionne KAZA — Louer, publier, partager",
    description:
      "Recherchez, visitez, réservez, emménagez. Découvrez le parcours KAZA pour chaque profil utilisateur.",
    type: "website",
  },
};

type Step = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
};

type Profile = {
  id: string;
  emoji: string;
  badge: string;
  badgeColor: string;
  title: string;
  intro: string;
  icon: React.ComponentType<{ className?: string }>;
  steps: Step[];
};

const profiles: Profile[] = [
  {
    id: "tenant",
    emoji: "🔑",
    badge: "LOCATAIRES",
    badgeColor: "bg-kaza-blue/10 text-kaza-blue",
    title: "Trouvez le logement qui vous ressemble",
    intro:
      "De la recherche à la remise des clés, KAZA simplifie chaque étape de votre installation.",
    icon: KeyRound,
    steps: [
      {
        icon: Search,
        title: "Recherchez",
        description:
          "Affinez votre recherche avec nos filtres puissants : ville, quartier, budget, surface, équipements. Plus de 5 000 annonces vérifiées vous attendent.",
      },
      {
        icon: Eye,
        title: "Visitez",
        description:
          "Explorez chaque bien en visite virtuelle 360° immersive ou planifiez une visite physique en quelques clics avec le propriétaire.",
      },
      {
        icon: CalendarCheck,
        title: "Réservez",
        description:
          "Bloquez le logement en payant la caution via l'escrow KAZA. Vos fonds restent sécurisés jusqu'à la remise effective des clés.",
      },
      {
        icon: KeyRound,
        title: "Emménagez",
        description:
          "Signez votre contrat numérique en quelques minutes, recevez vos clés, et profitez de votre nouveau chez-vous l'esprit tranquille.",
      },
    ],
  },
  {
    id: "owner",
    emoji: "🏠",
    badge: "PROPRIÉTAIRES",
    badgeColor: "bg-kaza-green/10 text-kaza-green",
    title: "Louez votre bien plus vite, sans agence",
    intro:
      "Publiez, sélectionnez, encaissez. KAZA s'occupe du reste pour que vous gardiez le contrôle de votre patrimoine.",
    icon: Building2,
    steps: [
      {
        icon: Megaphone,
        title: "Publiez votre annonce",
        description:
          "Ajoutez photos, plans et description en 10 minutes. Notre équipe valide votre annonce sous 24h et la rend visible auprès de milliers de candidats.",
      },
      {
        icon: Inbox,
        title: "Recevez les demandes",
        description:
          "Échangez via la messagerie intégrée avec les candidats. Consultez leur profil vérifié, leur score de fiabilité et leurs justificatifs.",
      },
      {
        icon: UserCheck,
        title: "Sélectionnez votre locataire",
        description:
          "Choisissez en toute confiance grâce aux vérifications KYC, à l'historique de paiement et aux références d'anciens bailleurs.",
      },
      {
        icon: Banknote,
        title: "Percevez vos loyers",
        description:
          "Encaissement automatique chaque mois via Mobile Money. Relances et reporting inclus. Plus jamais d'impayés non suivis.",
      },
    ],
  },
  {
    id: "student",
    emoji: "🎓",
    badge: "ÉTUDIANTS",
    badgeColor: "bg-amber-100 text-amber-700",
    title: "La colocation pensée pour les étudiants",
    intro:
      "KAZA Academia, le meilleur de la colocation étudiante en Afrique de l'Ouest.",
    icon: GraduationCap,
    steps: [
      {
        icon: Search,
        title: "Trouvez votre colocation",
        description:
          "Filtrez par université, budget et style de vie. Découvrez les logements meublés tout équipés près de votre campus.",
      },
      {
        icon: MessageCircle,
        title: "Discutez avec les colocs",
        description:
          "Échangez avec les colocataires actuels avant de vous engager. Vérifiez les vibes, les habitudes et l'organisation du quotidien.",
      },
      {
        icon: Calculator,
        title: "Partagez les frais",
        description:
          "Loyer, eau, électricité, internet : KAZA divise automatiquement et chaque coloc paie sa part directement. Zéro tension, zéro avance.",
      },
      {
        icon: Sparkles,
        title: "Vivez sereinement",
        description:
          "Concentrez-vous sur vos études. KAZA gère la maintenance, les relations avec le propriétaire et l'organisation du foyer.",
      },
    ],
  },
];

const securityPillars = [
  {
    icon: ShieldCheck,
    title: "Vérification d'identité",
    description:
      "Chaque utilisateur est vérifié par KYC (pièce d'identité + selfie biométrique). Vous ne traitez qu'avec des profils réels et authentifiés.",
  },
  {
    icon: Wallet,
    title: "Escrow sécurisé",
    description:
      "Vos fonds (caution, premier loyer) sont bloqués sur un compte séquestre chiffré et libérés uniquement après la remise effective des clés.",
  },
  {
    icon: Star,
    title: "Notation communautaire",
    description:
      "Propriétaires comme locataires reçoivent des avis après chaque location. Un système transparent qui valorise les comportements vertueux.",
  },
];

export default function HowItWorksPage() {
  return (
    <div>
      <SectionHero
        eyebrow="Mode d'emploi"
        title="Comment fonctionne KAZA"
        subtitle="Une plateforme pensée pour chaque profil. Découvrez le parcours qui correspond au vôtre, en seulement 4 étapes."
        variant="navy"
      />

      {/* Video placeholder */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-4 lg:px-8">
          <div className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-kaza-navy shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-kaza-navy via-kaza-navy to-kaza-blue/40" />
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                type="button"
                className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform group-hover:scale-110"
                aria-label="Lire la vidéo de présentation"
              >
                <Play className="ml-1 size-8 fill-kaza-navy text-kaza-navy" />
              </button>
            </div>
            <div className="absolute bottom-6 left-6 text-white">
              <p className="text-xs font-semibold tracking-widest uppercase text-kaza-green">
                Présentation
              </p>
              <p className="mt-1 text-lg font-semibold">
                KAZA en 90 secondes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Profile sections */}
      {profiles.map((profile, idx) => (
        <section
          key={profile.id}
          className={idx % 2 === 0 ? "bg-gray-50 py-16" : "bg-white py-16"}
        >
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="grid items-start gap-12 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <div
                  className={
                    "inline-block rounded-full px-3 py-1 text-xs font-semibold tracking-wide " +
                    profile.badgeColor
                  }
                >
                  {profile.badge}
                </div>
                <div className="mt-6 flex h-32 w-32 items-center justify-center rounded-3xl bg-white text-7xl shadow-md ring-1 ring-gray-100">
                  <span aria-hidden>{profile.emoji}</span>
                </div>
                <h2 className="mt-6 font-heading text-2xl font-bold text-kaza-navy sm:text-3xl">
                  {profile.title}
                </h2>
                <p className="mt-3 text-base text-muted-foreground">
                  {profile.intro}
                </p>
              </div>

              <div className="lg:col-span-8">
                <div className="grid gap-5 sm:grid-cols-2">
                  {profile.steps.map((step, i) => {
                    const Icon = step.icon;
                    return (
                      <div
                        key={step.title}
                        className="rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-kaza-blue/10">
                            <Icon className="size-5 text-kaza-blue" />
                          </div>
                          <span className="font-heading text-sm font-bold text-gray-300">
                            0{i + 1}
                          </span>
                        </div>
                        <h3 className="mt-4 font-heading text-lg font-semibold text-kaza-navy">
                          {step.title}
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* Security pillars */}
      <section className="bg-kaza-navy py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold tracking-widest uppercase text-kaza-green">
              Sécurité KAZA
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold sm:text-4xl">
              Trois piliers pour protéger chaque transaction
            </h2>
            <p className="mt-4 text-white/70">
              La sécurité n&apos;est pas une option chez KAZA, c&apos;est notre
              fondation.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {securityPillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-kaza-green/20">
                    <Icon className="size-6 text-kaza-green" />
                  </div>
                  <h3 className="mt-6 font-heading text-xl font-semibold">
                    {pillar.title}
                  </h3>
                  <p className="mt-3 text-sm text-white/70">
                    {pillar.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-12 flex items-center justify-center gap-2 text-sm text-white/60">
            <Users className="size-4" />
            <span>Déjà plus de 10 000 utilisateurs vérifiés sur KAZA</span>
          </div>
        </div>
      </section>

      <CtaBanner
        title="Prêt à essayer KAZA ?"
        description="Inscription gratuite en moins de 2 minutes. Sans engagement, sans carte bancaire."
        primaryAction={{ label: "Créer mon compte", href: "/signup" }}
        secondaryAction={{ label: "Voir les tarifs", href: "/pricing" }}
      />
    </div>
  );
}
