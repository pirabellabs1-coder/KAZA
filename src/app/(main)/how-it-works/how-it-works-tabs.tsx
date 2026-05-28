"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Building2,
  GraduationCap,
  Eye,
  CalendarCheck,
  KeyRound,
  Megaphone,
  Inbox,
  UserCheck,
  Banknote,
  MessageCircle,
  Calculator,
  Sparkles,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Step = {
  icon: LucideIcon;
  title: string;
  description: string;
};

type Profile = {
  id: string;
  label: string;
  badge: string;
  title: string;
  intro: string;
  icon: LucideIcon;
  imageUrl: string;
  ctaHref: string;
  ctaLabel: string;
  steps: Step[];
};

const PROFILES: Profile[] = [
  {
    id: "tenant",
    label: "Locataire",
    badge: "Pour les locataires",
    title: "Trouvez le logement qui vous ressemble",
    intro:
      "De la recherche à la remise des clés, KAZA simplifie chaque étape de votre installation.",
    icon: KeyRound,
    imageUrl:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    ctaHref: "/signup",
    ctaLabel: "Trouver mon logement",
    steps: [
      {
        icon: Search,
        title: "Recherchez",
        description:
          "Affinez votre recherche avec nos filtres puissants : ville, quartier, budget, surface, équipements. Plus de 12 000 annonces vérifiées vous attendent.",
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
    label: "Propriétaire",
    badge: "Pour les propriétaires",
    title: "Louez votre bien plus vite, sans agence",
    intro:
      "Publiez, sélectionnez, encaissez. KAZA s'occupe du reste pour que vous gardiez le contrôle de votre patrimoine.",
    icon: Building2,
    imageUrl:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80",
    ctaHref: "/signup?role=owner",
    ctaLabel: "Publier mon bien",
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
          "Encaissement automatique chaque mois via paiement intégré. Relances et reporting inclus. Plus jamais d'impayés non suivis.",
      },
    ],
  },
  {
    id: "student",
    label: "Étudiant",
    badge: "Pour les étudiants",
    title: "La colocation pensée pour les étudiants",
    intro:
      "KAZA Academia, le meilleur de la colocation étudiante en Afrique de l'Ouest.",
    icon: GraduationCap,
    imageUrl:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
    ctaHref: "/signup?role=student",
    ctaLabel: "Rejoindre KAZA Academia",
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

export function HowItWorksTabs() {
  const [active, setActive] = useState<string>("tenant");
  const profile = PROFILES.find((p) => p.id === active) ?? PROFILES[0];
  const Icon = profile.icon;

  return (
    <div>
      {/* Sticky tab list */}
      <div className="sticky top-16 z-30 mb-12 -mx-4 bg-white/80 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto inline-flex w-full max-w-2xl items-center justify-center gap-2 rounded-full border border-gray-200 bg-white p-1.5 shadow-lg sm:w-auto">
          {PROFILES.map((p) => {
            const PIcon = p.icon;
            const isActive = active === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActive(p.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300",
                  isActive
                    ? "bg-kaza-navy text-white shadow-md"
                    : "text-kaza-navy/70 hover:bg-gray-50 hover:text-kaza-navy",
                )}
                aria-pressed={isActive}
              >
                <PIcon className="size-4" />
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active profile content */}
      <div className="grid items-start gap-12 lg:grid-cols-12">
        {/* Left: image + intro */}
        <div className="lg:col-span-5">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl shadow-2xl">
            <Image
              src={profile.imageUrl}
              alt={profile.title}
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-kaza-navy/85 via-kaza-navy/20 to-transparent" />
            <div className="absolute right-6 bottom-6 left-6 text-white">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold tracking-widest uppercase backdrop-blur-md">
                <Icon className="size-3.5" />
                {profile.badge}
              </div>
              <h3 className="font-heading text-2xl font-bold leading-tight sm:text-3xl">
                {profile.title}
              </h3>
              <p className="mt-3 text-sm text-white/85 sm:text-base">
                {profile.intro}
              </p>
            </div>
          </div>

          <Button
            asChild
            size="lg"
            className="mt-6 h-14 w-full rounded-2xl bg-kaza-navy text-base font-semibold hover:bg-kaza-blue"
          >
            <Link href={profile.ctaHref}>
              {profile.ctaLabel}
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>

        {/* Right: steps */}
        <div className="lg:col-span-7">
          <div className="grid gap-5 sm:grid-cols-2">
            {profile.steps.map((step, i) => {
              const SIcon = step.icon;
              return (
                <div
                  key={step.title}
                  className="group rounded-3xl border border-gray-100 bg-white p-7 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-kaza-blue/15 to-kaza-green/10 text-kaza-blue transition-transform group-hover:scale-110">
                        <SIcon className="size-6" />
                      </div>
                    </div>
                    <span className="font-heading text-3xl font-bold text-gray-200">
                      0{i + 1}
                    </span>
                  </div>
                  <h4 className="mt-5 font-heading text-lg font-semibold text-kaza-navy">
                    {step.title}
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
