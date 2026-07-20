import type { Metadata } from "next";
import {
  Building2,
  Handshake,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RevealOnScroll } from "@/components/shared/reveal-on-scroll";
import { FadeIn } from "@/components/shared/fade-in";
import { GlassPanel } from "@/components/shared/glass-panel";
import { PartnerApplicationForm } from "@/components/partners/partner-application-form";

export const metadata: Metadata = {
  title: "Nos partenaires | Kaabo",
  description:
    "Découvrez l'écosystème Kaabo. Page en cours de mise à jour — la liste officielle de nos partenaires sera publiée prochainement.",
  openGraph: {
    title: "L'écosystème de partenaires Kaabo",
    description:
      "La liste officielle de nos partenaires sera publiée prochainement.",
    type: "website",
  },
};

// =============================================================================
// Kaabo — /partners
// La liste des partenaires (paiement, tech, presse, institutionnels) sera
// alimentée par un référentiel maintenu côté Supabase. Tant qu'aucun
// partenaire n'est officiellement confirmé et signé, on n'affiche aucun nom :
// on garde uniquement le hero et le CTA "Devenir partenaire".
// =============================================================================

export default function PartnersPage() {
  return (
    <div className="overflow-hidden">
      {/* ===== HERO ============================================== */}
      <section className="relative flex min-h-[70vh] w-full items-center justify-center overflow-hidden bg-kaza-navy text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(76,175,80,0.18),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(25,118,210,0.25),transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-kaza-navy/40 to-kaza-navy" />

        <div className="relative mx-auto max-w-5xl px-4 py-24 text-center lg:px-8">
          <FadeIn>
            <Badge className="mb-6 border-0 bg-gradient-to-r from-kaza-green via-emerald-400 to-kaza-blue px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white shadow-xl">
              <Sparkles className="mr-1.5 size-3.5" />
              Écosystème Kaabo
            </Badge>
          </FadeIn>

          <FadeIn delay={120}>
            <h1 className="font-heading text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Nos{" "}
              <span className="bg-gradient-to-r from-kaza-green via-emerald-300 to-kaza-blue bg-clip-text text-transparent">
                partenaires
              </span>
            </h1>
          </FadeIn>

          <FadeIn delay={240}>
            <p className="mx-auto mt-8 max-w-2xl text-lg text-white/85 sm:text-xl">
              La liste officielle de nos partenaires (paiement, technologie,
              médias et institutions) sera publiée prochainement. En attendant,
              écrivez-nous pour rejoindre l&apos;aventure.
            </p>
          </FadeIn>

          <FadeIn delay={360}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="rounded-full border border-white/20 bg-white/15 px-8 text-base font-semibold text-white shadow-2xl backdrop-blur-md transition-all hover:bg-white/25"
              >
                <a href="#candidature">
                  Devenir partenaire
                  <Handshake className="ml-2 size-4" />
                </a>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ===== DEVENIR PARTENAIRE ============== */}
      <section id="devenir-partenaire" className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-4 lg:px-8">
          <RevealOnScroll>
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-kaza-navy via-[#0F2A40] to-kaza-navy p-2 shadow-2xl">
              <div className="relative rounded-[2.25rem] bg-kaza-navy/95 px-8 py-16 text-center sm:px-12 sm:py-20 lg:px-20">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-32 -top-32 size-96 rounded-full bg-kaza-green/20 blur-3xl"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute -bottom-32 -left-32 size-96 rounded-full bg-kaza-blue/25 blur-3xl"
                />

                <div className="relative">
                  <GlassPanel
                    intensity="strong"
                    tint="white"
                    className="mx-auto mb-8 inline-flex size-20 items-center justify-center rounded-3xl bg-white/10"
                  >
                    <Building2
                      className="size-10 text-kaza-green"
                      aria-hidden="true"
                    />
                  </GlassPanel>

                  <Badge className="mb-6 border-kaza-green/40 bg-kaza-green/15 text-kaza-green">
                    Programme partenaires
                  </Badge>

                  <h2 className="font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                    Devenez{" "}
                    <span className="bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
                      partenaire
                    </span>{" "}
                    Kaabo
                  </h2>
                  <p className="mx-auto mt-6 max-w-2xl text-lg text-white/85 sm:text-xl">
                    Vous êtes une fintech, une marque tech, une institution ou
                    un média engagé sur le logement en Afrique ? Rejoignez
                    l&apos;écosystème qui transforme le marché locatif.
                  </p>

                  <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
                    <Button
                      asChild
                      size="lg"
                      className="rounded-full border-0 bg-gradient-to-r from-kaza-green to-emerald-500 px-10 py-7 text-base font-bold text-white shadow-2xl transition-all hover:scale-105 hover:from-kaza-green/90 hover:to-emerald-500/90"
                    >
                      <a href="#candidature">
                        Devenir partenaire
                        <Handshake className="ml-2 size-5" />
                      </a>
                    </Button>
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="rounded-full border-white/30 bg-white/10 px-8 text-base text-white backdrop-blur-md hover:bg-white/20 hover:text-white"
                    >
                      <a href="mailto:immobilierkaza@gmail.com">Contact presse</a>
                    </Button>
                  </div>

                  <p className="mt-8 text-sm text-white/70">
                    immobilierkaza@gmail.com · Réponse sous 5 jours ouvrés
                  </p>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ===== CANDIDATURE ===================================== */}
      <section id="candidature" className="scroll-mt-24 bg-slate-50 py-24">
        <div className="mx-auto max-w-3xl px-4 lg:px-8">
          <RevealOnScroll>
            <div className="mb-10 text-center">
              <Badge className="mb-5 border-kaza-blue/30 bg-kaza-blue/10 text-kaza-blue">
                <Handshake className="mr-1.5 size-3.5" />
                Candidature
              </Badge>
              <h2 className="font-heading text-3xl font-bold tracking-tight text-kaza-navy sm:text-4xl">
                Devenir partenaire
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                Remplissez ce formulaire pour rejoindre l&apos;écosystème Kaabo.
                Notre équipe partenariats étudie chaque dossier et revient vers
                vous sous 5 jours ouvrés.
              </p>
            </div>

            <div className="rounded-3xl border border-kaza-navy/10 bg-white p-6 shadow-xl sm:p-10">
              <PartnerApplicationForm />
            </div>
          </RevealOnScroll>
        </div>
      </section>
    </div>
  );
}
