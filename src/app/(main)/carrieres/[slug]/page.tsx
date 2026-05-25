import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { JOBS } from "../page";

interface JobDetail {
  about: string[];
  responsibilities: string[];
  profile: string[];
  reasons: string[];
}

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
  if (!job) return { title: "Poste introuvable" };
  return {
    title: `${job.title} — KAZA`,
    description: job.summary,
  };
}

export default async function CarrierePostePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = JOBS.find((j) => j.slug === slug);
  const detail = DETAILS[slug];
  if (!job || !detail) notFound();

  return (
    <article className="mx-auto max-w-3xl space-y-8 px-4 py-12 lg:px-8">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/carrieres">
            <ArrowLeft className="mr-1.5 size-4" />
            Tous les postes
          </Link>
        </Button>
      </div>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{job.team}</Badge>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5" />
            {job.location}
          </span>
          <span className="text-sm text-muted-foreground">• {job.type}</span>
        </div>
        <h1 className="font-heading text-3xl font-bold sm:text-4xl">
          {job.title}
        </h1>
        <p className="text-lg text-muted-foreground">{job.summary}</p>
      </header>

      <section>
        <h2 className="font-heading text-xl font-semibold">À propos du poste</h2>
        <div className="mt-3 space-y-3 text-sm leading-relaxed">
          {detail.about.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </section>

      <Section title="Vos responsabilités" items={detail.responsibilities} />
      <Section title="Profil recherché" items={detail.profile} />
      <Section title="Pourquoi nous rejoindre" items={detail.reasons} />

      <section className="rounded-xl border bg-kaza-navy p-6 text-white sm:p-8">
        <h2 className="font-heading text-xl font-semibold">Postuler</h2>
        <p className="mt-2 text-sm text-white/80">
          Envoyez-nous votre CV et quelques lignes sur votre motivation à
          l&apos;adresse ci-dessous. Nous répondons sous 5 jours ouvrés.
        </p>
        <Button
          asChild
          className="mt-4 bg-kaza-green hover:bg-kaza-green/90"
        >
          <a
            href={`mailto:careers@kaza.africa?subject=${encodeURIComponent(
              `Candidature — ${job.title}`,
            )}`}
          >
            Postuler à ce poste
          </a>
        </Button>
      </section>
    </article>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h2 className="font-heading text-xl font-semibold">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm leading-relaxed">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-kaza-blue" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
