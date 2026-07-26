"use client";

// =============================================================================
// Kaabo — Section « Comment ça marche » : cartes d'espaces + navigation onglets
// -----------------------------------------------------------------------------
// On conserve l'affichage en cartes (comme avant, ~3 visibles sur desktop) mais
// on couvre les 5 espaces (locataires, acheteurs, propriétaires, agences,
// étudiants). La barre d'onglets fait défiler la rangée jusqu'à la carte
// choisie (scroll horizontal piloté par les onglets).
// =============================================================================

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  GraduationCap,
  Home,
  Key,
  Tag,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { GradientCard } from "@/components/marketing/gradient-card";
import { cn } from "@/lib/utils";

type Variant = "blue" | "navy" | "green";

interface SpaceStep {
  step: string;
  title: string;
  description: string;
}

interface Space {
  id: string;
  label: string;
  icon: LucideIcon;
  variant: Variant;
  title: string;
  subtitle: string;
  cta: { label: string; href: string };
  ctaClass: string;
  steps: SpaceStep[];
}

const SPACES: Space[] = [
  {
    id: "tenant",
    label: "Locataires",
    icon: Key,
    variant: "blue",
    title: "Pour les locataires",
    subtitle: "Trouvez et louez votre prochain chez-vous en toute confiance.",
    cta: { label: "Rechercher un logement", href: "/search" },
    ctaClass: "bg-white text-kaza-blue hover:bg-white/90",
    steps: [
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
    ],
  },
  {
    id: "buyer",
    label: "Acheteurs",
    icon: Tag,
    variant: "blue",
    title: "Pour les acheteurs",
    subtitle: "Achetez un bien en direct, sans intermédiaire surprise.",
    cta: { label: "Voir les biens à vendre", href: "/search?listingType=SALE" },
    ctaClass: "bg-white text-kaza-blue hover:bg-white/90",
    steps: [
      {
        step: "01",
        title: "Explorez les biens à vendre",
        description:
          "Maisons, villas, terrains et appartements vérifiés, avec prix transparents et localisation précise.",
      },
      {
        step: "02",
        title: "Faites une offre",
        description:
          "Proposez votre prix et échangez directement avec le vendeur via la messagerie sécurisée.",
      },
      {
        step: "03",
        title: "Finalisez l'achat",
        description:
          "Versez l'acompte sous séquestre et signez les documents en toute sécurité sur la plateforme.",
      },
    ],
  },
  {
    id: "owner",
    label: "Propriétaires",
    icon: Home,
    variant: "navy",
    title: "Pour les propriétaires",
    subtitle:
      "Mettez vos biens en location ou en vente et augmentez vos revenus.",
    cta: { label: "Publier une annonce", href: "/signup?role=owner" },
    ctaClass: "bg-kaza-green text-white hover:bg-kaza-green/90",
    steps: [
      {
        step: "01",
        title: "Publiez & sélectionnez",
        description:
          "Mettez votre bien en avant auprès de locataires et acheteurs vérifiés, avec une fiche premium en 5 minutes.",
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
    ],
  },
  {
    id: "agency",
    label: "Agences",
    icon: Building2,
    variant: "navy",
    title: "Pour les agences",
    subtitle: "Pilotez tout votre portefeuille depuis un espace professionnel.",
    cta: { label: "Ouvrir un espace agence", href: "/signup?role=agency" },
    ctaClass: "bg-kaza-green text-white hover:bg-kaza-green/90",
    steps: [
      {
        step: "01",
        title: "Centralisez vos mandats",
        description:
          "Portefeuille de biens, mandats, équipe et leads réunis dans un tableau de bord unique.",
      },
      {
        step: "02",
        title: "Suivez visites & baux",
        description:
          "Candidatures, visites, contrats et locataires gérés de bout en bout, sans ressaisie.",
      },
      {
        step: "03",
        title: "Encaissements & reversements",
        description:
          "Loyers encaissés via Kaabo, relevé de gestion clair et reversements suivis automatiquement.",
      },
    ],
  },
  {
    id: "student",
    label: "Étudiants",
    icon: GraduationCap,
    variant: "green",
    title: "Pour les étudiants",
    subtitle: "Colocations vérifiées, frais partagés, à deux pas du campus.",
    cta: { label: "Trouver une colocation", href: "/student-living" },
    ctaClass: "bg-white text-kaza-green hover:bg-white/90",
    steps: [
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
          "Signature électronique du bail, opposable et conforme au droit en vigueur. Plus de papiers perdus.",
      },
    ],
  },
];

export function SpacesTabs() {
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);

  // Un onglet fait défiler la rangée jusqu'à la carte correspondante.
  const goTo = useCallback((index: number) => {
    setActive(index);
    const card = cardRefs.current[index];
    const track = trackRef.current;
    if (card && track) {
      track.scrollTo({
        left: card.offsetLeft - track.offsetLeft,
        behavior: "smooth",
      });
    }
  }, []);

  // Synchronise l'onglet actif quand on fait défiler manuellement la rangée.
  const handleScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const center = track.scrollLeft + track.clientWidth / 2;
    let nearest = 0;
    let best = Infinity;
    cardRefs.current.forEach((c, i) => {
      if (!c) return;
      const cardCenter = c.offsetLeft - track.offsetLeft + c.clientWidth / 2;
      const dist = Math.abs(cardCenter - center);
      if (dist < best) {
        best = dist;
        nearest = i;
      }
    });
    setActive(nearest);
  }, []);

  return (
    <div>
      {/* BARRE D'ONGLETS */}
      <div
        role="tablist"
        aria-label="Espaces Kaabo"
        className="mb-8 flex flex-wrap justify-center gap-2"
      >
        {SPACES.map((s, i) => {
          const TabIcon = s.icon;
          const isActive = i === active;
          return (
            <button
              key={s.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => goTo(i)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all",
                isActive
                  ? "border-kaza-navy bg-kaza-navy text-white shadow-sm"
                  : "border-border bg-white text-muted-foreground hover:border-kaza-navy/30 hover:text-foreground",
              )}
            >
              <TabIcon className="size-4" aria-hidden />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* RANGÉE DE CARTES (≈3 visibles sur desktop, défilement par onglets) */}
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {SPACES.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={s.id}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="w-[85%] shrink-0 snap-start sm:w-[46%] lg:w-[calc((100%-3rem)/3)]"
            >
              <GradientCard
                variant={s.variant}
                className="flex h-full flex-col p-8 lg:p-10"
              >
                <div className="mb-6 flex size-14 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                  <Icon className="size-7" aria-hidden />
                </div>
                <h3 className="font-heading text-2xl font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-white/80">{s.subtitle}</p>

                <ul className="mt-8 flex-1 space-y-6">
                  {s.steps.map((step) => (
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

                <Button asChild className={cn("mt-8 w-full", s.ctaClass)}>
                  <Link href={s.cta.href}>
                    {s.cta.label}
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </GradientCard>
            </div>
          );
        })}
      </div>
    </div>
  );
}
