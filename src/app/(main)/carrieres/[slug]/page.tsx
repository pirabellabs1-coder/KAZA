import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Compass,
  GraduationCap,
  Mail,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/shared/fade-in";
import { RevealOnScroll } from "@/components/shared/reveal-on-scroll";

import { JOBS } from "../page";

interface JobDetail {
  about: string[];
  responsibilities: string[];
  profile: string[];
  reasons: string[];
}

// =============================================================================
// Détails par poste
// =============================================================================

const DETAILS: Record<string, JobDetail> = {
  "senior-frontend-engineer": {
    about: [
      "Vous rejoignez une équipe ingénierie de 4 personnes et prenez en main l'architecture frontend de KAZA : Next.js 15 App Router, React 19 Server Components, Tailwind CSS, shadcn/ui.",
      "Vous travaillez main dans la main avec notre Tech Lead et notre Product Designer pour livrer des fonctionnalités qui touchent des dizaines de milliers d'utilisateurs au Bénin et bientôt en Afrique de l'Ouest.",
    ],
    responsibilities: [
      "Concevoir et implémenter de nouvelles fonctionnalités de bout en bout (search, dashboards, messagerie temps réel).",
      "Garantir la performance et l'accessibilité (Core Web Vitals, WCAG).",
      "Maintenir un design system cohérent (composants shadcn).",
      "Optimiser l'expérience mobile et PWA pour les marchés à faible bande passante.",
      "Réaliser des revues de code rigoureuses et mentorer les engineers juniors.",
      "Contribuer aux choix d'architecture et au roadmap technique.",
    ],
    profile: [
      "5+ ans d'expérience frontend professionnelle, dont 2+ avec React et TypeScript.",
      "Solide maîtrise de Next.js (Pages Router et App Router).",
      "Expérience avec Tailwind CSS et un design system mature.",
      "Bonne compréhension de la performance web et de l'accessibilité.",
      "Capacité à travailler en autonomie en remote, dans un environnement panafricain.",
      "Français professionnel obligatoire, anglais technique courant.",
    ],
    reasons: [
      "Stack moderne, choix techniques récents et pragmatiques.",
      "Impact direct sur l'accès au logement en Afrique.",
      "Salaire compétitif + BSPCE.",
      "Équipe internationale, télétravail possible avec hubs physiques.",
    ],
  },
  "senior-backend-engineer": {
    about: [
      "Vous êtes responsable de l'architecture backend : Supabase (Postgres + PostGIS), RLS, Edge Functions Deno, intégrations FedaPay / Kkiapay / Twilio / Resend.",
      "Vous garantissez la scalabilité, la sécurité et l'observabilité de la plateforme.",
    ],
    responsibilities: [
      "Concevoir des schémas Postgres performants avec contraintes RLS strictes.",
      "Développer et maintenir nos Edge Functions et server actions Next.js.",
      "Intégrer les fournisseurs paiement Mobile Money et leurs webhooks (HMAC).",
      "Mettre en place l'observabilité (logs structurés, métriques, alertes).",
      "Conduire les revues sécurité (OWASP, signatures, escrow, conservation données).",
      "Documenter les flux critiques (paiements, escrow, vérification identité).",
    ],
    profile: [
      "5+ ans d'expérience backend, dont 2+ avec Postgres avancé (PostGIS, full-text, RLS).",
      "À l'aise avec TypeScript/Node.js et l'écosystème Supabase.",
      "Expérience avec des intégrations paiement (Mobile Money idéalement).",
      "Sensibilité forte à la sécurité applicative.",
      "Capacité à travailler en autonomie, communication écrite claire en français.",
    ],
    reasons: [
      "Ownership direct de l'infrastructure et des choix techniques.",
      "Sujets de fond : paiements, identité, escrow, signature électronique.",
      "Salaire compétitif + BSPCE.",
      "Remote first.",
    ],
  },
  "product-designer": {
    about: [
      "Vous portez la voix de nos utilisateurs et façonnez l'expérience produit de bout en bout : du parcours locataire au tableau de bord propriétaire en passant par l'espace étudiant.",
      "Vous travaillez avec le Product Manager et les Tech Leads pour faire des choix de design pragmatiques et impactants.",
    ],
    responsibilities: [
      "Conduire les interviews utilisateurs et la recherche qualitative terrain.",
      "Concevoir des maquettes (Figma) du wireframe jusqu'au prototype haute fidélité.",
      "Maintenir et faire évoluer notre design system.",
      "Travailler étroitement avec l'équipe ingénierie sur l'implémentation.",
      "Mesurer l'impact des choix de design via la donnée et l'usage.",
      "Promouvoir la culture design dans toute l'entreprise.",
    ],
    profile: [
      "4+ ans d'expérience en product design dans une équipe produit.",
      "Excellente maîtrise de Figma et du prototyping interactif.",
      "Sensibilité forte à l'accessibilité et à l'inclusivité (langues locales, faible bande passante).",
      "Portfolio démontrant un parcours utilisateur complet.",
      "Français courant, anglais professionnel.",
      "Connaissance du marché immobilier ou africain : un plus.",
    ],
    reasons: [
      "Impact tangible : votre design touche des milliers de personnes chaque mois.",
      "Équipe à taille humaine, ownership élevé.",
      "Salaire compétitif + BSPCE.",
      "Remote first avec hubs Lomé, Cotonou, Abidjan.",
    ],
  },
  "growth-marketing-manager": {
    about: [
      "Vous pilotez l'acquisition, la rétention et les partenariats locaux. Vous transformez KAZA en référence du logement en Afrique de l'Ouest.",
    ],
    responsibilities: [
      "Définir et exécuter la stratégie d'acquisition multi-canale (SEO, paid, organic, partenariats).",
      "Piloter le brand et les contenus (blog, réseaux sociaux, presse).",
      "Mettre en place des dispositifs de rétention (e-mail, push, programme parrainage).",
      "Mesurer et optimiser : CAC, LTV, conversion, NPS.",
      "Identifier et négocier des partenariats locaux (universités, syndicats propriétaires).",
      "Animer une équipe (1-2 personnes à recruter).",
    ],
    profile: [
      "5+ ans en growth ou marketing produit dans une scale-up.",
      "Excellente capacité analytique et maîtrise des outils de mesure.",
      "Connaissance fine du marché bénino-africain et des canaux locaux.",
      "Excellent storyteller, copywriting impeccable en français.",
      "Esprit entrepreneurial, capacité à exécuter avec un budget limité.",
    ],
    reasons: [
      "Construire une marque qui devient un verbe (« je kaza »).",
      "Impact direct sur la croissance.",
      "Salaire compétitif + bonus + BSPCE.",
      "Hub physique Cotonou.",
    ],
  },
  "customer-success": {
    about: [
      "Vous êtes la voix des utilisateurs et leur premier point de contact. Vous résolvez les litiges, accompagnez les propriétaires dans la prise en main et remontez les insights produit.",
    ],
    responsibilities: [
      "Répondre aux demandes utilisateurs (chat, e-mail, téléphone, WhatsApp).",
      "Onboarder les nouveaux propriétaires et locataires.",
      "Modérer les annonces et les profils selon nos règles.",
      "Médiation et résolution de litiges (paiements, visites, contrats).",
      "Documenter les processus et alimenter la base de connaissance.",
      "Remonter les frictions à l'équipe produit avec données chiffrées.",
    ],
    profile: [
      "2+ ans en service client, support ou customer success.",
      "Excellente capacité de communication écrite et orale en français.",
      "Empathie, patience, calme face aux situations conflictuelles.",
      "À l'aise avec les outils numériques (CRM, helpdesk, dashboards).",
      "Sens de l'organisation et de la priorisation.",
    ],
    reasons: [
      "Vous voyez votre impact tous les jours dans la satisfaction utilisateurs.",
      "Évolution rapide possible (Lead, Operations, Product).",
      "Salaire compétitif + bonus qualité service.",
      "Hub physique Cotonou.",
    ],
  },
  "account-executive": {
    about: [
      "Vous ouvrez le marché ivoirien : agences immobilières, résidences universitaires, gestionnaires de patrimoine. Vous êtes notre premier représentant terrain à Abidjan.",
    ],
    responsibilities: [
      "Identifier et prospecter les comptes cibles (agences, résidences, gestionnaires).",
      "Conduire le cycle de vente complet de la prospection au closing.",
      "Onboarder les nouveaux comptes en collaboration avec Customer Success.",
      "Représenter KAZA lors d'événements professionnels et institutionnels.",
      "Remonter les attentes du marché ivoirien à l'équipe produit.",
      "Atteindre et dépasser les objectifs commerciaux trimestriels.",
    ],
    profile: [
      "3+ ans en vente B2B SaaS, immobilier ou services financiers.",
      "Excellente connaissance du marché ivoirien et de son écosystème immobilier.",
      "Posture consultative, capacité à comprendre des besoins complexes.",
      "Autonomie et discipline (poste terrain).",
      "Français courant obligatoire.",
    ],
    reasons: [
      "Vous bâtissez le marché Côte d'Ivoire en partant de zéro.",
      "Variable agressif et déplafonné.",
      "Ownership total sur le territoire.",
      "Hub Abidjan, présence régulière Cotonou.",
    ],
  },
};

// =============================================================================
// SEO + static params
// =============================================================================

export function generateStaticParams() {
  return JOBS.map((j) => ({ slug: j.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const job = JOBS.find((j) => j.slug === slug);
  if (!job) return { title: "Poste introuvable | KAZA" };
  return {
    title: `${job.title} — Carrières KAZA`,
    description: job.summary,
    openGraph: {
      title: `${job.title} chez KAZA`,
      description: job.summary,
      type: "article",
    },
  };
}

// =============================================================================
// Page
// =============================================================================

export default async function CarrierePostePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = JOBS.find((j) => j.slug === slug);
  const detail = DETAILS[slug];
  if (!job || !detail) notFound();

  const otherJobs = JOBS.filter((j) => j.slug !== slug).slice(0, 3);
  const mailSubject = encodeURIComponent(`Candidature — ${job.title}`);
  const mailBody = encodeURIComponent(
    `Bonjour l'équipe KAZA,\n\nJe souhaite postuler au poste de ${job.title} (${job.location}).\n\nVous trouverez ci-joint mon CV. Quelques lignes sur ma motivation :\n\n— ...\n\nMerci pour votre retour.`,
  );
  const mailtoHref = `mailto:contact@pirabellabs.com?subject=${mailSubject}&body=${mailBody}`;

  return (
    <div className="bg-white">
      {/* ============== HERO COMPACT ====================================== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-kaza-navy via-[#0F2A40] to-kaza-blue py-20 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-24 size-[420px] rounded-full bg-kaza-green/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-32 size-[420px] rounded-full bg-kaza-blue/30 blur-3xl"
        />
        <div className="relative mx-auto max-w-5xl px-4 lg:px-8">
          <FadeIn>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="mb-8 -ml-2 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <Link href="/carrieres">
                <ArrowLeft className="mr-1.5 size-4" />
                Tous les postes
              </Link>
            </Button>

            <div className="flex flex-wrap items-center gap-3">
              <Badge className="border-0 bg-white/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-white backdrop-blur-md">
                <Briefcase className="mr-1.5 size-3" />
                {job.team}
              </Badge>
              <Badge className="border-0 bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
                <MapPin className="mr-1.5 size-3 text-kaza-green" />
                {job.location}
              </Badge>
              <Badge className="border-0 bg-kaza-green px-3 py-1.5 text-xs font-semibold text-white shadow-md">
                {job.type}
              </Badge>
            </div>

            <h1 className="mt-6 font-heading text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              {job.title}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/85 sm:text-xl">
              {job.summary}
            </p>

            <Button
              asChild
              size="lg"
              className="mt-10 h-12 rounded-full bg-kaza-green px-8 text-base font-semibold shadow-xl hover:bg-kaza-green/90"
            >
              <a href={mailtoHref}>
                Postuler maintenant
                <ArrowRight className="ml-2 size-4" />
              </a>
            </Button>
          </FadeIn>
        </div>
      </section>

      {/* ============== LAYOUT ARTICLE + STICKY ============================ */}
      <section className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_340px]">
            {/* ---- Contenu principal ---- */}
            <article className="mx-auto w-full max-w-3xl space-y-12">
              <DetailSection
                title="À propos du poste"
                eyebrow="Mission"
                paragraphs={detail.about}
              />
              <DetailList
                title="Vos responsabilités"
                eyebrow="Au quotidien"
                items={detail.responsibilities}
              />
              <DetailList
                title="Profil recherché"
                eyebrow="Le ou la candidate idéale"
                items={detail.profile}
              />
              <DetailList
                title="Pourquoi nous rejoindre"
                eyebrow="Ce qui vous attend"
                items={detail.reasons}
                accent="green"
              />
            </article>

            {/* ---- Sticky right : postuler ---- */}
            <aside>
              <div className="sticky top-24 space-y-5">
                <div className="overflow-hidden rounded-3xl border border-gray-100 bg-gradient-to-br from-white via-[#F4F7FB] to-white p-7 shadow-lg">
                  <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-kaza-green/10 text-kaza-green">
                    <Mail className="size-6" aria-hidden="true" />
                  </div>
                  <h2 className="font-heading text-2xl font-bold text-kaza-navy">
                    Postuler
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Envoyez-nous votre CV et quelques lignes sur votre
                    motivation. Réponse garantie sous 5 jours ouvrés.
                  </p>

                  <Button
                    asChild
                    className="mt-5 w-full rounded-full bg-kaza-navy text-white hover:bg-kaza-blue"
                  >
                    <a href={mailtoHref}>
                      <Mail className="mr-2 size-4" />
                      Postuler par email
                    </a>
                  </Button>
                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    contact@pirabellabs.com
                  </p>

                  <ul className="mt-6 space-y-2 border-t border-gray-100 pt-5 text-sm">
                    <li className="flex items-start gap-2 text-foreground">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-kaza-green" />
                      Test métier rémunéré
                    </li>
                    <li className="flex items-start gap-2 text-foreground">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-kaza-green" />
                      BSPCE inclus dès le jour 1
                    </li>
                    <li className="flex items-start gap-2 text-foreground">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-kaza-green" />
                      Équipement professionnel fourni
                    </li>
                    <li className="flex items-start gap-2 text-foreground">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-kaza-green" />
                      Process inclusif et transparent
                    </li>
                  </ul>
                </div>

                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex size-10 items-center justify-center rounded-xl bg-kaza-blue/10 text-kaza-blue">
                      <Users className="size-5" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-kaza-blue">
                        Équipe
                      </p>
                      <p className="font-heading text-base font-bold text-kaza-navy">
                        {job.team}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <span className="inline-flex size-10 items-center justify-center rounded-xl bg-kaza-green/10 text-kaza-green">
                      <MapPin className="size-5" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-kaza-green">
                        Localisation
                      </p>
                      <p className="font-heading text-base font-bold text-kaza-navy">
                        {job.location}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <span className="inline-flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                      <Briefcase className="size-5" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">
                        Contrat
                      </p>
                      <p className="font-heading text-base font-bold text-kaza-navy">
                        {job.type}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ============== AUTRES POSTES ====================================== */}
      {otherJobs.length > 0 && (
        <section className="bg-gradient-to-b from-[#F4F7FB] to-white py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <FadeIn>
              <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-kaza-blue">
                    Autres opportunités
                  </p>
                  <h2 className="font-heading text-3xl font-bold text-kaza-navy sm:text-4xl lg:text-5xl">
                    Autres postes ouverts
                  </h2>
                </div>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/carrieres">
                    <Compass className="mr-2 size-4" />
                    Tous les postes
                  </Link>
                </Button>
              </div>
            </FadeIn>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {otherJobs.map((j, i) => (
                <RevealOnScroll key={j.slug} delay={i * 80}>
                  <Link
                    href={`/carrieres/${j.slug}`}
                    className="group block focus-visible:outline-none"
                  >
                    <article className="relative h-full overflow-hidden rounded-3xl border border-gray-100 bg-white p-7 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-kaza-blue/30 hover:shadow-2xl">
                      <Badge
                        variant="outline"
                        className="rounded-full border-kaza-blue/30 bg-kaza-blue/5 text-xs font-semibold text-kaza-blue"
                      >
                        {j.team}
                      </Badge>
                      <h3 className="mt-4 font-heading text-xl font-bold leading-tight text-kaza-navy transition-colors group-hover:text-kaza-blue">
                        {j.title}
                      </h3>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3" />
                          {j.location}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span>{j.type}</span>
                      </div>
                      <p className="mt-4 line-clamp-3 text-sm text-muted-foreground">
                        {j.summary}
                      </p>
                      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-kaza-blue">
                        Voir le poste
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </article>
                  </Link>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function DetailSection({
  title,
  eyebrow,
  paragraphs,
}: {
  title: string;
  eyebrow: string;
  paragraphs: string[];
}) {
  return (
    <section>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-kaza-blue">
        {eyebrow}
      </p>
      <h2 className="font-heading text-3xl font-bold text-kaza-navy sm:text-4xl">
        {title}
      </h2>
      <div className="mt-6 space-y-4 text-base leading-[1.8] text-foreground">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </section>
  );
}

function DetailList({
  title,
  eyebrow,
  items,
  accent = "blue",
}: {
  title: string;
  eyebrow: string;
  items: string[];
  accent?: "blue" | "green";
}) {
  const bulletClass =
    accent === "green"
      ? "bg-kaza-green/10 text-kaza-green"
      : "bg-kaza-blue/10 text-kaza-blue";
  const Icon = accent === "green" ? Sparkles : GraduationCap;

  return (
    <section>
      <p
        className={
          accent === "green"
            ? "mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-kaza-green"
            : "mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-kaza-blue"
        }
      >
        {eyebrow}
      </p>
      <h2 className="font-heading text-3xl font-bold text-kaza-navy sm:text-4xl">
        {title}
      </h2>
      <ul className="mt-6 space-y-3">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4 transition-shadow hover:shadow-md"
          >
            <span
              className={`mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full ${bulletClass}`}
            >
              <Icon className="size-3.5" aria-hidden="true" />
            </span>
            <span className="text-base leading-relaxed text-foreground">
              {item}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
