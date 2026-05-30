import type { Metadata } from "next";
import Link from "next/link";
import {
  Search,
  UserCircle2,
  SearchIcon,
  CalendarCheck,
  CreditCard,
  FileSignature,
  ShieldCheck,
  GraduationCap,
  Building2,
  MessageCircle,
  Mail,
  ArrowRight,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { NewsletterForm } from "@/components/marketing/newsletter-form";
import { RevealOnScroll } from "@/components/shared/reveal-on-scroll";
import { FadeIn } from "@/components/shared/fade-in";
import { GlassPanel } from "@/components/shared/glass-panel";
import { AnimatedGradientBg } from "@/components/shared/animated-gradient-bg";
import { FaqAccordion, type FaqItem } from "./faq-accordion";

export const metadata: Metadata = {
  title: "FAQ — Questions fréquentes | KAZA",
  description:
    "Trouvez les réponses aux questions les plus fréquentes sur KAZA : fonctionnement, sécurité, paiements, colocations, contrats et plus.",
  openGraph: {
    title: "FAQ KAZA — Toutes vos questions, nos réponses",
    description:
      "Tout ce que vous devez savoir sur KAZA, la plateforme immobilière de référence en Afrique de l'Ouest.",
    type: "website",
  },
};

// =============================================================================
// FAQ par catégorie
// =============================================================================

const accountFaq: FaqItem[] = [
  {
    q: "Comment créer un compte KAZA ?",
    a: "Cliquez sur « S'inscrire » en haut à droite, choisissez votre profil (locataire, propriétaire ou étudiant), renseignez votre email et un mot de passe. Vous recevrez un code de vérification par SMS.",
  },
  {
    q: "L'inscription est-elle vraiment gratuite ?",
    a: "Oui. La création de compte, la recherche et la messagerie sont 100 % gratuites pour les locataires et étudiants. Aucune carte de crédit demandée.",
  },
  {
    q: "Comment supprimer mon compte ?",
    a: "Depuis votre tableau de bord → Paramètres → Confidentialité → Supprimer mon compte. La suppression est définitive après 30 jours (délai légal).",
  },
  {
    q: "J'ai oublié mon mot de passe, que faire ?",
    a: "Cliquez sur « Mot de passe oublié » sur la page de connexion. Un lien de réinitialisation est envoyé sur votre email.",
  },
  {
    q: "Puis-je avoir plusieurs profils sur un même compte ?",
    a: "Vous pouvez activer le profil propriétaire en parallèle de votre profil locataire depuis votre dashboard. Vos données restent unifiées.",
  },
  {
    q: "Comment changer mon adresse email ?",
    a: "Profil → Paramètres → Email. Un email de confirmation sera envoyé à la nouvelle adresse pour valider le changement.",
  },
];

const searchFaq: FaqItem[] = [
  {
    q: "Comment trouver une annonce qui me correspond ?",
    a: "Utilisez les filtres : ville, quartier, budget, surface, équipements. Vous pouvez aussi rechercher directement sur la carte interactive.",
  },
  {
    q: "Puis-je sauvegarder mes recherches ?",
    a: "Oui, créez autant d'alertes que vous voulez. Vous recevez une notification dès qu'un nouveau bien correspond à vos critères.",
  },
  {
    q: "Comment fonctionnent les annonces vérifiées ?",
    a: "Chaque annonce est contrôlée par notre équipe : authenticité des photos, cohérence du prix, identité du propriétaire. Les annonces vérifiées portent un badge bleu.",
  },
  {
    q: "Puis-je sauvegarder des biens en favoris ?",
    a: "Oui, cliquez sur l'icône cœur de n'importe quelle annonce. Vous retrouvez vos favoris dans votre tableau de bord.",
  },
  {
    q: "Comment fonctionnent les recommandations personnalisées ?",
    a: "Notre algorithme apprend de vos préférences (favoris, recherches, profil) pour suggérer les biens les plus pertinents.",
  },
  {
    q: "Puis-je signaler une annonce frauduleuse ?",
    a: "Oui, le bouton « Signaler » est présent sur chaque annonce. Notre équipe modération traite chaque signalement en moins de 24h.",
  },
];

const visitFaq: FaqItem[] = [
  {
    q: "Comment planifier une visite ?",
    a: "Sur l'annonce, cliquez sur « Demander une visite ». Le propriétaire vous propose des créneaux disponibles dans les 24h.",
  },
  {
    q: "Comment fonctionnent les visites virtuelles 360° ?",
    a: "De nombreuses annonces proposent une visite 360° immersive accessible depuis votre navigateur. Vous explorez chaque pièce comme si vous y étiez.",
  },
  {
    q: "Puis-je visiter avec un proche ?",
    a: "Oui. Précisez-le lors de la prise de rendez-vous. Le propriétaire peut limiter le nombre de visiteurs pour des raisons sanitaires ou organisationnelles.",
  },
  {
    q: "Que faire si le propriétaire annule la visite ?",
    a: "Vous recevez une notification immédiate. Vous pouvez reprogrammer ou contacter notre support si l'annulation est répétée.",
  },
  {
    q: "La visite est-elle obligatoire avant de réserver ?",
    a: "Non, mais fortement recommandée. Vous pouvez réserver directement après une visite virtuelle si vous êtes convaincu.",
  },
  {
    q: "Combien de temps dure une visite ?",
    a: "En moyenne 20 à 30 minutes. Prévoyez plus si vous avez beaucoup de questions ou souhaitez mesurer l'espace.",
  },
];

const paymentFaq: FaqItem[] = [
  {
    q: "Quels modes de paiement acceptez-vous ?",
    a: "KAZA Pay, KAZA Wallet, cartes Visa et Mastercard. Toutes les transactions sont chiffrées de bout en bout et conformes aux standards PCI-DSS.",
  },
  {
    q: "Qu'est-ce que l'escrow KAZA ?",
    a: "L'escrow est un compte séquestre sécurisé : vos fonds (caution, premier loyer) sont bloqués chez KAZA, puis libérés au propriétaire uniquement après la remise effective des clés.",
  },
  {
    q: "Les paiements sont-ils sécurisés ?",
    a: "Oui. Nous utilisons KAZA Pay (PCI-DSS niveau 1) et KAZA Wallet comme fallback. Vos données bancaires ne transitent jamais par nos serveurs.",
  },
  {
    q: "Puis-je payer mon loyer en plusieurs fois ?",
    a: "Oui, sous réserve d'accord du propriétaire. Notre système permet de fractionner sur 2 à 4 échéances dans le mois, sans frais.",
  },
  {
    q: "Comment obtenir un reçu de paiement ?",
    a: "Un reçu PDF est généré automatiquement après chaque transaction et envoyé par email. Vous retrouvez l'historique complet dans votre dashboard.",
  },
  {
    q: "Que faire en cas de problème de paiement ?",
    a: "Contactez notre support via le chat ou par email à immobilierkaza@gmail.com. Nous traitons les incidents en priorité, généralement sous 2 heures ouvrées.",
  },
  {
    q: "Y a-t-il des frais sur les paiements ?",
    a: "Aucun frais pour le locataire. Les propriétaires ne paient que la commission KAZA (5 % Starter ou 3 % Pro) sur les loyers effectivement perçus.",
  },
];

const contractFaq: FaqItem[] = [
  {
    q: "Le contrat est-il vraiment légal ?",
    a: "Oui. Nos contrats sont conformes à la législation béninoise, signés électroniquement avec horodatage et valeur juridique pleine.",
  },
  {
    q: "Comment fonctionne la signature électronique ?",
    a: "Vous recevez le contrat par email, le relisez, cochez les clauses puis confirmez avec un code SMS unique. Le PDF signé est archivé dans votre dashboard.",
  },
  {
    q: "Puis-je résilier mon contrat ?",
    a: "Oui, depuis votre dashboard. Le préavis légal s'applique (1 à 3 mois selon le bail). KAZA accompagne la procédure et gère l'état des lieux numérique.",
  },
  {
    q: "Qui rédige le contrat de bail ?",
    a: "KAZA propose un modèle conforme au droit béninois, validé par nos avocats partenaires. Vous pouvez ajouter des clauses spécifiques avec l'accord des deux parties.",
  },
  {
    q: "Le garant est-il obligatoire ?",
    a: "Cela dépend du propriétaire. Pour les étudiants, un garant est généralement requis. KAZA propose aussi sa garantie locative en option.",
  },
  {
    q: "Comment renouveler mon bail ?",
    a: "Le renouvellement est automatique en l'absence de préavis. Vous pouvez à tout moment renégocier les conditions depuis votre dashboard.",
  },
];

const securityFaq: FaqItem[] = [
  {
    q: "Comment KAZA vérifie les identités ?",
    a: "Pièce d'identité officielle (CNI, passeport, permis) + selfie de validation. Notre partenaire KYC analyse l'authenticité du document et compare biométriquement.",
  },
  {
    q: "Mes données personnelles sont-elles protégées ?",
    a: "Oui. Nous sommes conformes au RGPD et à la loi béninoise. Vos données sont chiffrées, hébergées en Europe (Frankfurt) et jamais revendues.",
  },
  {
    q: "Que faire en cas de litige ?",
    a: "Notre équipe médiation intervient sous 48h. Tant que le litige n'est pas tranché, les fonds en escrow restent bloqués.",
  },
  {
    q: "Puis-je signaler un utilisateur suspect ?",
    a: "Oui. Chaque profil et annonce comporte un bouton « Signaler ». Notre équipe modération examine chaque signalement en moins de 24h.",
  },
  {
    q: "Mon mot de passe est-il protégé ?",
    a: "Vos mots de passe sont hachés avec bcrypt et jamais stockés en clair. L'authentification à deux facteurs (2FA) par SMS est également proposée.",
  },
  {
    q: "Comment reconnaître une arnaque ?",
    a: "Méfiez-vous de tout paiement hors plateforme, de prix anormalement bas, de propriétaires pressés. Restez toujours sur KAZA — votre escrow vous protège.",
  },
];

const studentFaq: FaqItem[] = [
  {
    q: "Comment trouver une colocation étudiante ?",
    a: "Filtrez par université, budget et style de vie dans KAZA Academia. Vous voyez les profils des colocataires actuels et postulez en un clic.",
  },
  {
    q: "Comment vérifier mon statut étudiant ?",
    a: "Téléchargez votre carte étudiante en cours de validité. La vérification est faite en 24h et vous débloquez les tarifs préférentiels.",
  },
  {
    q: "Comment partager les frais avec mes colocataires ?",
    a: "Notre outil de répartition automatique divise loyer, eau, électricité et internet. Chacun paie sa part directement, sans avance.",
  },
  {
    q: "Puis-je trouver des colocataires sans logement ?",
    a: "Oui. Créez un profil colocataire avec vos habitudes (calme, fêtard, lève-tôt...) et matchez avec d'autres étudiants compatibles.",
  },
  {
    q: "Y a-t-il des logements meublés ?",
    a: "Oui, beaucoup d'annonces étudiantes sont meublées et incluent internet, eau et électricité.",
  },
  {
    q: "Que se passe-t-il en fin d'année universitaire ?",
    a: "Vous pouvez résilier avec un préavis d'1 mois en juin/juillet sans pénalité. KAZA Academia respecte le calendrier universitaire.",
  },
];

const ownerFaq: FaqItem[] = [
  {
    q: "Comment publier une annonce ?",
    a: "Créez un compte propriétaire, ajoutez photos et détails, fixez votre loyer. Notre équipe valide en moins de 24h.",
  },
  {
    q: "Combien KAZA prélève sur mes loyers ?",
    a: "5 % sur le plan Starter (gratuit) et 3 % sur le plan Pro (15 000 FCFA/mois). Commission uniquement quand un loyer est perçu.",
  },
  {
    q: "Comment vérifier l'identité d'un candidat ?",
    a: "Tous les utilisateurs passent par une vérification KYC. Vous voyez le badge « vérifié » et avez accès à un score de fiabilité.",
  },
  {
    q: "Quand vais-je recevoir mes loyers ?",
    a: "Les loyers sont versés sous 48h ouvrées suivant le paiement, après déduction de la commission KAZA.",
  },
  {
    q: "Puis-je gérer plusieurs biens ?",
    a: "Oui. Starter permet 5 annonces, Pro est illimité. Tableau de bord unifié pour tous vos biens.",
  },
  {
    q: "Que faire si mon locataire ne paie pas ?",
    a: "KAZA déclenche automatiquement des relances par SMS, email et WhatsApp. Notre équipe peut accompagner la médiation.",
  },
];

type Category = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  iconColor: string;
  items: FaqItem[];
};

const CATEGORIES: Category[] = [
  {
    id: "compte",
    title: "Compte & profil",
    description: "Création, connexion, mot de passe, suppression.",
    icon: UserCircle2,
    color: "from-kaza-blue/10 to-kaza-blue/5",
    iconColor: "text-kaza-blue",
    items: accountFaq,
  },
  {
    id: "recherche",
    title: "Recherche d'annonces",
    description: "Filtres, alertes, favoris, carte, suggestions.",
    icon: SearchIcon,
    color: "from-amber-100 to-amber-50",
    iconColor: "text-amber-700",
    items: searchFaq,
  },
  {
    id: "visite",
    title: "Visites & rendez-vous",
    description: "Demande de visite, créneaux, visite virtuelle 360°.",
    icon: CalendarCheck,
    color: "from-violet-100 to-violet-50",
    iconColor: "text-violet-700",
    items: visitFaq,
  },
  {
    id: "paiement",
    title: "Paiements & loyers",
    description: "KAZA Pay, KAZA Wallet, escrow, factures, reçus.",
    icon: CreditCard,
    color: "from-rose-100 to-rose-50",
    iconColor: "text-rose-700",
    items: paymentFaq,
  },
  {
    id: "contrat",
    title: "Contrats & bail",
    description: "Signature électronique, durée, résiliation, garant.",
    icon: FileSignature,
    color: "from-cyan-100 to-cyan-50",
    iconColor: "text-cyan-700",
    items: contractFaq,
  },
  {
    id: "securite",
    title: "Sécurité & confiance",
    description: "Arnaques, signalement, données personnelles, RGPD.",
    icon: ShieldCheck,
    color: "from-emerald-100 to-emerald-50",
    iconColor: "text-emerald-700",
    items: securityFaq,
  },
  {
    id: "etudiant",
    title: "Colocation étudiante",
    description: "KAZA Academia, matching, charges partagées.",
    icon: GraduationCap,
    color: "from-indigo-100 to-indigo-50",
    iconColor: "text-indigo-700",
    items: studentFaq,
  },
  {
    id: "proprietaire",
    title: "Propriétaires",
    description: "Publication, sélection, encaissement, gestion.",
    icon: Building2,
    color: "from-kaza-green/10 to-kaza-green/5",
    iconColor: "text-kaza-green",
    items: ownerFaq,
  },
];

const CONTACT_OPTIONS = [
  {
    icon: MessageCircle,
    title: "Chat en direct",
    description: "Discutez avec un conseiller, 7j/7 de 8h à 22h.",
    cta: "Démarrer le chat",
    href: "#chat",
    accent: "bg-kaza-blue/10 text-kaza-blue",
  },
  {
    icon: Mail,
    title: "Support par email",
    description: "Réponse garantie sous 4 heures ouvrées.",
    cta: "immobilierkaza@gmail.com",
    href: "mailto:immobilierkaza@gmail.com",
    accent: "bg-kaza-green/10 text-kaza-green",
  },
  {
    icon: Mail,
    title: "Formulaire de contact",
    description: "Décrivez votre demande, nous revenons vers vous.",
    cta: "Ouvrir le formulaire",
    href: "/contact",
    accent: "bg-amber-100 text-amber-700",
  },
];

export default function FaqPage() {
  return (
    <div className="overflow-hidden">
      {/* ===== HERO ================================================== */}
      <AnimatedGradientBg className="relative flex min-h-[60vh] items-center">
        <div className="relative mx-auto w-full max-w-5xl px-4 py-24 text-center lg:px-8">
          <FadeIn>
            <Badge className="mb-6 border-kaza-blue/20 bg-kaza-blue/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-kaza-blue uppercase">
              <Sparkles className="mr-2 size-3.5" />
              Centre d&apos;aide
            </Badge>
          </FadeIn>
          <FadeIn delay={100}>
            <h1 className="font-heading text-4xl font-bold leading-[1.05] tracking-tight text-kaza-navy sm:text-5xl lg:text-7xl">
              Questions{" "}
              <span className="bg-gradient-to-r from-kaza-blue via-kaza-green to-kaza-blue bg-clip-text text-transparent">
                fréquentes
              </span>
            </h1>
          </FadeIn>
          <FadeIn delay={200}>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Trouvez en quelques secondes la réponse à votre question — ou
              contactez notre équipe support à tout moment.
            </p>
          </FadeIn>
          <FadeIn delay={300}>
            <div className="mt-10">
              <GlassPanel
                intensity="strong"
                tint="white"
                className="mx-auto max-w-2xl rounded-full border-white/30 bg-white/70 p-2 shadow-xl"
              >
                <form
                  role="search"
                  aria-label="Rechercher dans la FAQ"
                  className="flex items-center gap-2"
                >
                  <Search
                    className="ml-4 size-5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    type="search"
                    placeholder="Rechercher : caution, escrow, vérification…"
                    className="h-12 flex-1 border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
                  />
                  <Button
                    type="submit"
                    size="lg"
                    className="h-12 rounded-full bg-kaza-navy px-6 text-white hover:bg-kaza-blue"
                  >
                    Rechercher
                  </Button>
                </form>
              </GlassPanel>
            </div>
          </FadeIn>
        </div>
      </AnimatedGradientBg>

      {/* ===== CATÉGORIES GRID ====================================== */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <RevealOnScroll>
            <div className="mb-16 text-center">
              <p className="mb-3 text-xs font-semibold tracking-widest text-kaza-blue uppercase">
                Parcourir par thème
              </p>
              <h2 className="font-heading text-3xl font-bold text-kaza-navy sm:text-4xl lg:text-5xl">
                Choisissez une catégorie
              </h2>
            </div>
          </RevealOnScroll>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((cat, i) => {
              const Icon = cat.icon;
              return (
                <RevealOnScroll key={cat.id} delay={i * 60}>
                  <Link
                    href={`#${cat.id}`}
                    className="group block h-full focus-visible:rounded-3xl focus-visible:ring-2 focus-visible:ring-kaza-blue focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    <Card
                      className={
                        "h-full overflow-hidden rounded-3xl border-gray-100 bg-gradient-to-br p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl " +
                        cat.color
                      }
                    >
                      <div
                        className={
                          "mb-5 inline-flex size-14 items-center justify-center rounded-2xl bg-white shadow-sm transition-transform group-hover:scale-110 " +
                          cat.iconColor
                        }
                      >
                        <Icon className="size-7" />
                      </div>
                      <h3 className="font-heading text-lg font-bold text-kaza-navy transition-colors group-hover:text-kaza-blue">
                        {cat.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {cat.description}
                      </p>
                      <div className="mt-6 flex items-center justify-between">
                        <Badge
                          variant="secondary"
                          className="bg-white/80 text-xs font-semibold"
                        >
                          {cat.items.length} questions
                        </Badge>
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-kaza-blue">
                          Voir
                          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </Card>
                  </Link>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== ACCORDIONS PAR CATÉGORIE ============================= */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-24">
        <div className="mx-auto max-w-4xl px-4 lg:px-8">
          {CATEGORIES.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <RevealOnScroll key={cat.id}>
                <div id={cat.id} className={idx > 0 ? "mt-16 scroll-mt-24" : "scroll-mt-24"}>
                  <div className="mb-8 flex items-center gap-4">
                    <div
                      className={
                        "flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br " +
                        cat.color +
                        " " +
                        cat.iconColor
                      }
                    >
                      <Icon className="size-6" />
                    </div>
                    <div>
                      <h3 className="font-heading text-2xl font-bold text-kaza-navy sm:text-3xl">
                        {cat.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {cat.items.length} questions —{" "}
                        {cat.description}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-gray-200 bg-white p-2 shadow-lg sm:p-6">
                    <FaqAccordion items={cat.items} idPrefix={cat.id} />
                  </div>
                </div>
              </RevealOnScroll>
            );
          })}
        </div>
      </section>

      {/* ===== VOUS NE TROUVEZ PAS ? ================================ */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <RevealOnScroll>
            <div className="mb-16 text-center">
              <p className="mb-3 text-xs font-semibold tracking-widest text-kaza-blue uppercase">
                Besoin d&apos;aide ?
              </p>
              <h2 className="font-heading text-3xl font-bold text-kaza-navy sm:text-4xl lg:text-5xl">
                Vous ne trouvez pas votre réponse ?
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                Notre équipe est basée à Cotonou et vous répond en moins de 24
                heures ouvrées.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid gap-6 md:grid-cols-3">
            {CONTACT_OPTIONS.map((option, i) => {
              const Icon = option.icon;
              return (
                <RevealOnScroll key={option.title} delay={i * 100}>
                  <Card className="h-full rounded-3xl border-gray-100 p-8 text-center shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
                    <div
                      className={
                        "mx-auto mb-6 inline-flex size-16 items-center justify-center rounded-2xl " +
                        option.accent
                      }
                    >
                      <Icon className="size-7" />
                    </div>
                    <h3 className="font-heading text-xl font-bold text-kaza-navy">
                      {option.title}
                    </h3>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {option.description}
                    </p>
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="mt-6 rounded-full border-kaza-navy text-kaza-navy hover:bg-kaza-navy hover:text-white"
                    >
                      <a href={option.href}>{option.cta}</a>
                    </Button>
                  </Card>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== NEWSLETTER =========================================== */}
      <section className="bg-gradient-to-br from-kaza-navy via-kaza-navy to-kaza-blue/30 py-24 text-white">
        <div className="mx-auto max-w-3xl px-4 lg:px-8">
          <RevealOnScroll>
            <div className="mb-10 text-center">
              <p className="mb-3 text-xs font-semibold tracking-widest text-kaza-green uppercase">
                Newsletter
              </p>
              <h2 className="font-heading text-3xl font-bold sm:text-4xl">
                Restez informé des nouveautés
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-base text-white/75 sm:text-lg">
                Conseils, actualités et nouveautés KAZA, directement dans votre
                boîte mail.
              </p>
            </div>
          </RevealOnScroll>

          <RevealOnScroll>
            <NewsletterForm variant="block" source="faq" />
          </RevealOnScroll>
        </div>
      </section>

      <CtaBanner
        title="Toujours bloqué ?"
        description="Notre équipe support reste à votre disposition pour toute question."
        primaryAction={{ label: "Nous contacter", href: "/contact" }}
        secondaryAction={{ label: "Centre d'aide complet", href: "/help" }}
      />
    </div>
  );
}
