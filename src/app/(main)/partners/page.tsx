import type { Metadata } from "next";
import {
  Building2,
  Cpu,
  Handshake,
  Landmark,
  Newspaper,
  ShieldCheck,
  Sparkles,
  Wallet,
  ExternalLink,
  Award,
  Lock,
  CheckCircle2,
  Globe,
  Star,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCounter } from "@/components/marketing/stat-counter";
import { PressStrip } from "@/components/marketing/press-strip";
import { RevealOnScroll } from "@/components/shared/reveal-on-scroll";
import { FadeIn } from "@/components/shared/fade-in";
import { GlassPanel } from "@/components/shared/glass-panel";
import { Marquee } from "@/components/shared/marquee";
import { PARTNERS, PRESS, type Partner } from "@/lib/marketing-data";

export const metadata: Metadata = {
  title: "Nos partenaires de confiance | KAZA",
  description:
    "Découvrez l'écosystème de partenaires premium qui propulse KAZA : paiement, technologie, presse et institutions. Tous audités, tous certifiés.",
  openGraph: {
    title: "L'écosystème de partenaires KAZA",
    description:
      "Paiement, tech, presse et institutionnels : les marques de confiance qui rendent KAZA possible.",
    type: "website",
  },
};

// =============================================================================
// Configuration des catégories
// =============================================================================

type CategoryConfig = {
  key: Partner["category"] | "presse";
  title: string;
  eyebrow: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  iconBg: string;
};

const CATEGORY_CONFIG: CategoryConfig[] = [
  {
    key: "paiement",
    title: "Paiement & Finance",
    eyebrow: "Transactions sécurisées",
    description:
      "Nos partenaires garantissent des transactions sécurisées et un escrow conforme aux standards bancaires africains.",
    icon: Wallet,
    gradient: "from-kaza-blue/15 via-blue-50/50 to-white",
    iconBg: "bg-gradient-to-br from-kaza-blue to-blue-700",
  },
  {
    key: "tech",
    title: "Technologie & Infrastructure",
    eyebrow: "Stack premium",
    description:
      "Une infrastructure cloud premium pour servir des millions d'utilisateurs avec performance, scalabilité et sécurité.",
    icon: Cpu,
    gradient: "from-kaza-green/15 via-emerald-50/50 to-white",
    iconBg: "bg-gradient-to-br from-kaza-green to-emerald-700",
  },
  {
    key: "presse",
    title: "Presse & Médias",
    eyebrow: "Ils en parlent",
    description:
      "Les médias panafricains et internationaux qui suivent et relayent l'aventure KAZA depuis ses débuts.",
    icon: Newspaper,
    gradient: "from-amber-100/40 via-yellow-50/40 to-white",
    iconBg: "bg-gradient-to-br from-amber-500 to-orange-600",
  },
  {
    key: "institution",
    title: "Institutions partenaires",
    eyebrow: "Acteurs publics",
    description:
      "Organismes publics, ministères et ONG qui accompagnent KAZA dans sa mission de transformation du marché locatif.",
    icon: Landmark,
    gradient: "from-violet-100/40 via-purple-50/40 to-white",
    iconBg: "bg-gradient-to-br from-violet-600 to-purple-700",
  },
];

// =============================================================================
// Descriptions courtes pour chaque partenaire
// =============================================================================

const PARTNER_DESCRIPTIONS: Record<string, string> = {
  "KAZA Pay":
    "Solution de paiement intégrée pour caution, loyer et frais en Mobile Money.",
  "KAZA Wallet":
    "Portefeuille électronique permettant aux utilisateurs de stocker leurs fonds en toute sécurité.",
  Supabase:
    "Base de données PostgreSQL temps réel, authentification et stockage de fichiers chiffré.",
  Vercel:
    "Plateforme d'hébergement edge garantissant un temps de réponse minimal partout en Afrique.",
  Twilio:
    "Envoi de SMS et codes OTP pour vérifier identité et téléphone des utilisateurs.",
  Resend:
    "Service d'envoi d'emails transactionnels (confirmations, reçus, contrats signés).",
};

const DEFAULT_DESCRIPTION =
  "Partenaire stratégique de l'écosystème KAZA, sélectionné pour sa fiabilité et son sérieux.";

// =============================================================================
// Données complémentaires
// =============================================================================

const PRESS_AS_PARTNERS: Partner[] = PRESS.map((p) => ({
  name: p.name,
  category: "presse",
  logoLetters: p.letters,
  brandColor: p.color,
  url: undefined,
}));

const INSTITUTIONS: Partner[] = [
  {
    name: "Ministère du Cadre de Vie",
    category: "institution",
    logoLetters: "MCV",
    brandColor: "#003B7A",
  },
  {
    name: "ANIP Bénin",
    category: "institution",
    logoLetters: "ANIP",
    brandColor: "#0F7A3A",
  },
  {
    name: "ARSEL",
    category: "institution",
    logoLetters: "ARS",
    brandColor: "#B53A2C",
  },
  {
    name: "Chambre de Commerce",
    category: "institution",
    logoLetters: "CCI",
    brandColor: "#0F62B5",
  },
];

const INSTITUTIONS_DESCRIPTIONS: Record<string, string> = {
  "Ministère du Cadre de Vie":
    "Tutelle de l'habitat et de l'urbanisme, partenaire de la transparence du marché locatif au Bénin.",
  "ANIP Bénin":
    "Agence Nationale d'Identification des Personnes, partenaire de la vérification d'identité KYC.",
  ARSEL:
    "Autorité de Régulation des Communications Électroniques et de La Poste du Bénin.",
  "Chambre de Commerce":
    "Accompagne les propriétaires professionnels et les agences immobilières partenaires de KAZA.",
};

// Témoignages partenaires (courtes citations pour marquee)
const PARTNER_TESTIMONIALS = [
  {
    author: "Direction Innovation, Banque Atlantique",
    quote: "KAZA a réussi le pari de digitaliser la confiance locative.",
  },
  {
    author: "Responsable Mobile Money, MTN Bénin",
    quote: "Une intégration paiement exemplaire et un volume en croissance constante.",
  },
  {
    author: "Direction Communication, ANIP",
    quote: "Un acteur clé pour le déploiement de l'identité numérique au Bénin.",
  },
  {
    author: "VP Technology, Supabase Africa",
    quote: "L'un des cas d'usage les plus inspirants d'Afrique de l'Ouest.",
  },
  {
    author: "Rédaction, Jeune Afrique",
    quote: "La PropTech qui change la donne sur le marché locatif béninois.",
  },
];

// Trust badges
const TRUST_BADGES = [
  { icon: ShieldCheck, label: "ISO 27001", sub: "Sécurité des données" },
  { icon: Lock, label: "PCI DSS", sub: "Paiements certifiés" },
  { icon: CheckCircle2, label: "RGPD", sub: "Données personnelles" },
  { icon: Award, label: "AFD Lauréat", sub: "Innovation 2025" },
  { icon: Globe, label: "Africa Tech Awards", sub: "Finaliste 2025" },
  { icon: Star, label: "GAFA Best PropTech", sub: "Bénin 2026" },
];

// =============================================================================
// Helpers
// =============================================================================

function dedupePartners(partners: Partner[]): Partner[] {
  const seen = new Set<string>();
  return partners.filter((p) => {
    if (seen.has(p.name)) return false;
    seen.add(p.name);
    return true;
  });
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w.charAt(0))
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

// =============================================================================
// Page
// =============================================================================

export default function PartnersPage() {
  const paymentPartners = dedupePartners(
    PARTNERS.filter((p) => p.category === "paiement")
  );
  const techPartners = dedupePartners(
    PARTNERS.filter((p) => p.category === "tech")
  );
  const pressPartners = PRESS_AS_PARTNERS;
  const institutionalPartners = INSTITUTIONS;

  const partnersByCategory: Record<string, Partner[]> = {
    paiement: paymentPartners,
    tech: techPartners,
    presse: pressPartners,
    institution: institutionalPartners,
  };

  return (
    <div className="overflow-hidden">
      {/* ===== HERO h-[80vh] gradient kaza-navy ============================ */}
      <section className="relative flex min-h-[80vh] w-full items-center justify-center overflow-hidden bg-kaza-navy text-white">
        {/* Pattern décoratif gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(76,175,80,0.18),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(25,118,210,0.25),transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-kaza-navy/40 to-kaza-navy" />

        {/* Constellation de logos décoratifs */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.1) 0%, transparent 12%), radial-gradient(circle at 80% 20%, rgba(76,175,80,0.15) 0%, transparent 12%), radial-gradient(circle at 70% 70%, rgba(25,118,210,0.15) 0%, transparent 12%), radial-gradient(circle at 30% 80%, rgba(255,255,255,0.08) 0%, transparent 12%)",
          }}
        />

        <div className="relative mx-auto max-w-5xl px-4 py-24 text-center lg:px-8">
          <FadeIn>
            <Badge className="mb-6 border-0 bg-gradient-to-r from-kaza-green via-emerald-400 to-kaza-blue px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white shadow-xl">
              <Sparkles className="mr-1.5 size-3.5" />
              Écosystème KAZA
            </Badge>
          </FadeIn>

          <FadeIn delay={120}>
            <h1 className="font-heading text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Nos{" "}
              <span className="bg-gradient-to-r from-kaza-green via-emerald-300 to-kaza-blue bg-clip-text text-transparent">
                partenaires
              </span>{" "}
              de confiance
            </h1>
          </FadeIn>

          <FadeIn delay={240}>
            <p className="mx-auto mt-8 max-w-2xl text-lg text-white/85 sm:text-xl">
              KAZA s&apos;appuie sur les meilleurs acteurs du paiement, de la
              technologie, des médias et des institutions pour offrir une
              expérience irréprochable, à la hauteur de vos exigences.
            </p>
          </FadeIn>

          <FadeIn delay={360}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="rounded-full border border-white/20 bg-white/15 px-8 text-base font-semibold text-white shadow-2xl backdrop-blur-md transition-all hover:bg-white/25"
              >
                <a href="#devenir-partenaire">
                  Devenir partenaire
                  <Handshake className="ml-2 size-4" />
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-white/30 bg-transparent px-8 text-base text-white backdrop-blur-md hover:bg-white/10 hover:text-white"
              >
                <a href="#categories">Découvrir l&apos;écosystème</a>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ===== STATS Partenariats ========================================== */}
      <section className="relative bg-gradient-to-br from-white via-blue-50/40 to-emerald-50/40 py-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid grid-cols-2 gap-10 sm:gap-14 lg:grid-cols-4">
            <RevealOnScroll>
              <StatCounter value={42} suffix="+" label="Partenaires actifs" description="Tous catégories confondues" />
            </RevealOnScroll>
            <RevealOnScroll delay={100}>
              <StatCounter value={8} label="Pays couverts" description="Afrique de l'Ouest" />
            </RevealOnScroll>
            <RevealOnScroll delay={200}>
              <StatCounter value={250} suffix="+" label="Années d'expérience" description="Cumulées par notre écosystème" />
            </RevealOnScroll>
            <RevealOnScroll delay={300}>
              <StatCounter value={100} suffix="%" label="Transactions sécurisées" description="Audits & conformité PCI" />
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* ===== SECTIONS PAR CATÉGORIE ====================================== */}
      <div id="categories">
        {CATEGORY_CONFIG.map((category, catIdx) => {
          const list = partnersByCategory[category.key];
          if (!list || list.length === 0) return null;
          const Icon = category.icon;
          const isAlt = catIdx % 2 === 1;

          return (
            <section
              key={category.key}
              className={
                "relative py-24 " +
                (isAlt
                  ? "bg-gradient-to-b from-gray-50 to-white"
                  : "bg-white")
              }
            >
              {/* Background gradient subtil */}
              <div
                aria-hidden
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-50`}
              />

              <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
                <RevealOnScroll>
                  <div className="mb-16 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
                    <div
                      className={`flex size-20 shrink-0 items-center justify-center rounded-3xl text-white shadow-xl ${category.iconBg}`}
                    >
                      <Icon className="size-10" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-kaza-blue">
                        {category.eyebrow}
                      </p>
                      <h2 className="mt-2 font-heading text-4xl font-bold tracking-tight text-kaza-navy sm:text-5xl">
                        {category.title}
                      </h2>
                      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
                        {category.description}
                      </p>
                    </div>
                  </div>
                </RevealOnScroll>

                {/* Press strip extra pour la catégorie presse */}
                {category.key === "presse" && (
                  <RevealOnScroll>
                    <div className="mb-10">
                      <PressStrip items={PRESS} title="Vu dans la presse" />
                    </div>
                  </RevealOnScroll>
                )}

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {list.map((partner, i) => {
                    const description =
                      PARTNER_DESCRIPTIONS[partner.name] ??
                      INSTITUTIONS_DESCRIPTIONS[partner.name] ??
                      DEFAULT_DESCRIPTION;
                    const letters = getInitials(
                      partner.logoLetters || partner.name
                    );

                    return (
                      <RevealOnScroll key={partner.name} delay={i * 80}>
                        <article className="group relative flex h-full flex-col rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-md transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
                          <div className="mb-6 flex justify-center">
                            <div
                              className="flex size-20 items-center justify-center rounded-2xl text-base font-bold text-white shadow-lg ring-4 ring-white transition-transform group-hover:scale-110 group-hover:rotate-3"
                              style={{ backgroundColor: partner.brandColor }}
                              aria-hidden="true"
                            >
                              {letters}
                            </div>
                          </div>
                          <h3 className="font-heading text-lg font-bold text-kaza-navy">
                            {partner.name}
                          </h3>
                          <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                            {description}
                          </p>
                          <div className="mt-6 flex items-center justify-center gap-2">
                            <Badge className="gap-1 border-0 bg-kaza-green/15 text-kaza-green hover:bg-kaza-green/25">
                              <ShieldCheck className="size-3" />
                              Vérifié
                            </Badge>
                            {partner.url && (
                              <a
                                href={partner.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex size-7 items-center justify-center rounded-full bg-gray-100 text-muted-foreground transition-colors hover:bg-kaza-blue hover:text-white"
                                aria-label={`Visiter ${partner.name}`}
                              >
                                <ExternalLink className="size-3.5" />
                              </a>
                            )}
                          </div>
                        </article>
                      </RevealOnScroll>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* ===== TÉMOIGNAGES PARTENAIRES — Marquee =========================== */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl">
          <RevealOnScroll>
            <div className="mb-10 px-4 text-center lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-kaza-blue">
                Ils nous soutiennent
              </p>
              <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-kaza-navy sm:text-4xl">
                Ce que nos partenaires{" "}
                <span className="bg-gradient-to-r from-kaza-blue to-kaza-green bg-clip-text text-transparent">
                  disent de KAZA
                </span>
              </h2>
            </div>
          </RevealOnScroll>

          <Marquee speed={50} pauseOnHover contentWidth={2400}>
            {PARTNER_TESTIMONIALS.map((t) => (
              <div
                key={t.author}
                className="mx-2 max-w-md rounded-3xl border border-gray-100 bg-white p-6 shadow-md"
              >
                <p className="text-base leading-relaxed text-foreground">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-kaza-blue">
                  {t.author}
                </p>
              </div>
            ))}
          </Marquee>
        </div>
      </section>

      {/* ===== TRUST BADGES =============================================== */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <RevealOnScroll>
            <div className="mb-12 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-kaza-blue">
                Certifications & labels
              </p>
              <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-kaza-navy sm:text-4xl">
                Des standards{" "}
                <span className="bg-gradient-to-r from-kaza-green to-kaza-blue bg-clip-text text-transparent">
                  internationaux
                </span>
              </h2>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
            {TRUST_BADGES.map((badge, idx) => {
              const Icon = badge.icon;
              return (
                <RevealOnScroll key={badge.label} delay={idx * 60}>
                  <div className="group flex h-full flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-kaza-blue/10 to-kaza-green/10 text-kaza-blue transition-transform group-hover:scale-110">
                      <Icon className="size-7" />
                    </div>
                    <p className="font-heading text-sm font-bold text-kaza-navy">
                      {badge.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{badge.sub}</p>
                  </div>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== DEVENIR PARTENAIRE — Card large gradient navy ============== */}
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
                    KAZA
                  </h2>
                  <p className="mx-auto mt-6 max-w-2xl text-lg text-white/85 sm:text-xl">
                    Vous êtes une fintech, une marque tech, une institution ou
                    un média engagé sur le logement en Afrique ? Rejoignez
                    l&apos;écosystème qui transforme le marché locatif.
                  </p>

                  <div className="mt-12 grid gap-4 text-left sm:grid-cols-3">
                    {[
                      {
                        title: "Visibilité",
                        text: "Logo + page dédiée sur KAZA, exposition à plus de 500K utilisateurs/mois.",
                      },
                      {
                        title: "Co-création",
                        text: "Workshops produit communs, intégrations API prioritaires, roadmap partagée.",
                      },
                      {
                        title: "Impact",
                        text: "Participez à la transformation du logement en Afrique de l'Ouest.",
                      },
                    ].map((item) => (
                      <div
                        key={item.title}
                        className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
                      >
                        <p className="font-heading text-base font-bold text-kaza-green">
                          {item.title}
                        </p>
                        <p className="mt-2 text-sm text-white/80">{item.text}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
                    <Button
                      asChild
                      size="lg"
                      className="rounded-full border-0 bg-gradient-to-r from-kaza-green to-emerald-500 px-10 py-7 text-base font-bold text-white shadow-2xl transition-all hover:scale-105 hover:from-kaza-green/90 hover:to-emerald-500/90"
                    >
                      <a href="mailto:partnerships@kaza.africa">
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
                      <a href="mailto:press@kaza.africa">Contact presse</a>
                    </Button>
                  </div>

                  <p className="mt-8 text-sm text-white/70">
                    partnerships@kaza.africa · Réponse sous 5 jours ouvrés
                  </p>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>
    </div>
  );
}
