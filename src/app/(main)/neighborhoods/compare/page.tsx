import type { Metadata } from "next";
import Link from "next/link";
import { Compass, MapPin, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/shared/fade-in";

export const metadata: Metadata = {
  title: "Comparateur de quartiers | KAZA",
  description:
    "Comparez les quartiers du Bénin sur la qualité de vie, les prix et les équipements. Outil en cours de finalisation.",
};

// =============================================================================
// KAZA — /neighborhoods/compare
// Le comparateur sera réactivé dès qu'un référentiel `neighborhoods` (scores,
// prix moyen au m², population, équipements) sera disponible côté Supabase.
// Pour l'instant on affiche un état vide soigné, sans aucune donnée fictive.
// =============================================================================

const MAX_SLOTS = 3;

export default function NeighborhoodsComparePage() {
  return (
    <div className="bg-white">
      {/* ===== HERO ============================================== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-kaza-navy via-[#0F2A40] to-kaza-blue py-20 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-24 size-[420px] rounded-full bg-kaza-green/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-32 size-[420px] rounded-full bg-kaza-blue/30 blur-3xl"
        />
        <div className="relative mx-auto max-w-6xl px-4 text-center lg:px-8">
          <FadeIn>
            <Badge className="mb-6 inline-flex border-0 bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-md">
              <Compass className="mr-2 size-3 text-kaza-green" />
              Outil interactif
            </Badge>
            <h1 className="font-heading text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Comparateur de{" "}
              <span className="bg-gradient-to-r from-kaza-green to-white bg-clip-text text-transparent">
                quartiers
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/85">
              Confrontez jusqu&apos;à {MAX_SLOTS} quartiers du Bénin sur la
              qualité de vie, les prix, les équipements et la sécurité.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ===== ÉTAT VIDE ============================================== */}
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 bg-gradient-to-br from-white via-[#F4F7FB] to-white p-20 text-center">
          <div className="mb-6 inline-flex size-24 items-center justify-center rounded-3xl bg-kaza-blue/10 text-kaza-blue">
            <MapPin className="size-12" aria-hidden="true" />
          </div>
          <h2 className="font-heading text-3xl font-bold text-kaza-navy sm:text-4xl">
            Référentiel quartiers à venir
          </h2>
          <p className="mt-4 max-w-md text-base text-muted-foreground">
            Le comparateur sera disponible dès que nos équipes terrain auront
            cartographié les quartiers couverts par KAZA. En attendant, lancez
            une recherche pour découvrir les biens disponibles près de chez
            vous.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-kaza-blue hover:bg-kaza-navy"
            >
              <Link href="/search">
                <Sparkles className="mr-2 size-4" />
                Voir les annonces
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
