import type { Metadata } from "next";
import { Compass } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/shared/fade-in";
import { listAllNeighborhoods } from "@/actions/neighborhoods";
import { NeighborhoodsComparator } from "./neighborhoods-comparator";

export const metadata: Metadata = {
  title: "Comparateur de quartiers | Kaabo",
  description:
    "Comparez les quartiers du Bénin sur le loyer moyen, la surface, les équipements et le standing — statistiques calculées à partir des annonces disponibles.",
};

export const dynamic = "force-dynamic";

export default async function NeighborhoodsComparePage() {
  const options = await listAllNeighborhoods();

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
              Confrontez jusqu&apos;à 3 quartiers sur le loyer moyen, la surface,
              les équipements et le standing — sur données réelles.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ===== COMPARATEUR ============================================== */}
      <div className="mx-auto max-w-5xl px-4 py-12 lg:px-8">
        <NeighborhoodsComparator options={options} />
      </div>
    </div>
  );
}
