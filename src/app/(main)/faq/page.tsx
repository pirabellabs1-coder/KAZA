import type { Metadata } from "next";
import { SectionHero } from "@/components/marketing/section-hero";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { FaqAccordion, type FaqItem } from "./faq-accordion";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

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

const generalFaq: FaqItem[] = [
  {
    q: "Comment fonctionne KAZA ?",
    a: "KAZA met en relation directe propriétaires, locataires et étudiants à la recherche d'une colocation. Vous publiez ou consultez des annonces vérifiées, échangez via la messagerie intégrée, puis sécurisez la transaction via notre système d'escrow et nos contrats numériques signés en ligne.",
  },
  {
    q: "Dans quelles villes KAZA est-il disponible ?",
    a: "Nous démarrons au Bénin (Cotonou, Porto-Novo, Abomey-Calavi, Parakou) et nous étendrons à toute l'Afrique de l'Ouest dès 2026 : Togo, Côte d'Ivoire, Sénégal, Burkina Faso.",
  },
  {
    q: "L'inscription est-elle vraiment gratuite ?",
    a: "Oui. La création de compte, la recherche d'annonces et la messagerie sont 100% gratuites pour tous les locataires et étudiants. Aucune carte de crédit n'est demandée.",
  },
  {
    q: "Quelle est la différence entre KAZA et une agence classique ?",
    a: "Pas d'intermédiaire, pas de commission de 1 mois de loyer, pas de déplacement inutile. Tout se fait en ligne, des visites virtuelles au contrat, avec des frais transparents et 10x moins élevés.",
  },
  {
    q: "Puis-je utiliser KAZA depuis mon téléphone ?",
    a: "Absolument. KAZA est conçu mobile-first et fonctionne parfaitement sur tous les smartphones, même avec une connexion limitée. Une application native iOS et Android arrive en 2026.",
  },
  {
    q: "KAZA est-il disponible hors du Bénin ?",
    a: "Pas encore, mais c'est notre prochaine étape. Inscrivez-vous à notre newsletter pour être prévenu du lancement dans votre pays.",
  },
];

const ownerFaq: FaqItem[] = [
  {
    q: "Comment publier une annonce ?",
    a: "Créez un compte propriétaire, ajoutez les photos et détails de votre bien, fixez votre loyer. Notre équipe valide votre annonce en moins de 24h et elle apparaît immédiatement dans la recherche.",
  },
  {
    q: "Combien KAZA prélève sur mes loyers ?",
    a: "5% sur le plan Starter (gratuit) et 3% sur le plan Pro (15 000 FCFA/mois). La commission est prélevée uniquement quand un loyer est effectivement perçu, jamais à vide.",
  },
  {
    q: "Comment puis-je vérifier l'identité d'un candidat locataire ?",
    a: "Tous les utilisateurs KAZA passent par une vérification KYC (carte d'identité + selfie). Vous voyez le badge \"vérifié\" sur chaque profil et avez accès à un score de fiabilité basé sur l'historique de paiement.",
  },
  {
    q: "Quand vais-je recevoir mes loyers ?",
    a: "Les loyers sont versés sur votre compte Mobile Money ou bancaire dans les 48h ouvrées suivant le paiement par le locataire, après déduction de la commission KAZA.",
  },
  {
    q: "Puis-je gérer plusieurs biens depuis le même compte ?",
    a: "Oui. Le plan Starter permet jusqu'à 5 annonces, le plan Pro est illimité. Vous gérez tous vos biens, contrats et locataires depuis un tableau de bord unifié.",
  },
  {
    q: "Que se passe-t-il si mon locataire ne paie pas ?",
    a: "KAZA déclenche automatiquement des relances par SMS, email et WhatsApp. Vous gardez la main pour décliencher une procédure formelle. Notre équipe peut vous accompagner dans la médiation.",
  },
  {
    q: "Puis-je retirer mon annonce à tout moment ?",
    a: "Oui, sans frais et sans préavis. Vous pouvez désactiver ou supprimer une annonce en un clic depuis votre dashboard.",
  },
];

const tenantFaq: FaqItem[] = [
  {
    q: "Comment réserver un logement ?",
    a: "Une fois votre coup de cœur trouvé, contactez le propriétaire via la messagerie, planifiez une visite (virtuelle ou physique), puis réservez en payant la caution sur l'escrow KAZA. Vos fonds sont bloqués et libérés à la remise des clés.",
  },
  {
    q: "Dois-je payer des frais d'agence ?",
    a: "Aucun frais d'agence. KAZA est 100% gratuit pour les locataires. Vous ne payez que votre caution et votre loyer, directement au propriétaire.",
  },
  {
    q: "Comment fonctionnent les visites virtuelles ?",
    a: "De nombreuses annonces proposent une visite 360° immersive accessible depuis votre navigateur. Vous explorez chaque pièce comme si vous y étiez, sans vous déplacer.",
  },
  {
    q: "Le contrat est-il vraiment légal ?",
    a: "Oui. Nos contrats sont conformes à la législation béninoise, signés électroniquement avec horodatage et valeur juridique pleine. Vous recevez un PDF signé par les deux parties.",
  },
  {
    q: "Que faire si le logement ne correspond pas à l'annonce ?",
    a: "Signalez immédiatement le problème via la messagerie ou en contactant le support. Tant que vous n'avez pas confirmé la remise des clés, vos fonds restent bloqués en escrow et vous êtes intégralement remboursé en cas de litige avéré.",
  },
  {
    q: "Puis-je sauvegarder mes recherches favorites ?",
    a: "Oui, créez autant d'alertes que vous voulez. Vous recevez une notification dès qu'un nouveau bien correspond à vos critères : ville, quartier, budget, surface.",
  },
];

const studentFaq: FaqItem[] = [
  {
    q: "Comment trouver une colocation ?",
    a: "Filtrez par université, budget et style de vie dans la section KAZA Academia. Vous voyez les profils des colocataires actuels, les charges incluses et pouvez postuler en un clic.",
  },
  {
    q: "Comment KAZA vérifie mon statut étudiant ?",
    a: "Téléchargez votre carte étudiante en cours de validité. La vérification est faite en 24h et vous débloquez l'accès aux logements réservés aux étudiants ainsi qu'aux tarifs préférentiels.",
  },
  {
    q: "Comment partager les frais avec mes colocataires ?",
    a: "Notre outil de répartition automatique divise loyer, eau, électricité et internet entre les colocataires. Chacun paie sa part directement via Mobile Money, sans avance ni rappels.",
  },
  {
    q: "Puis-je trouver des colocataires sans logement ?",
    a: "Oui. Créez un profil colocataire en décrivant vos habitudes (calme, fêtard, lève-tôt...) et matchez avec d'autres étudiants compatibles avant même de chercher un logement.",
  },
  {
    q: "Y a-t-il des logements meublés ?",
    a: "Oui, beaucoup d'annonces étudiantes sont meublées et incluent internet, eau et électricité. Filtrez par \"meublé\" et \"charges incluses\" pour simplifier votre installation.",
  },
  {
    q: "Que se passe-t-il en fin d'année universitaire ?",
    a: "Vous pouvez résilier votre engagement avec un préavis d'1 mois en juin/juillet sans pénalité. KAZA Academia respecte le calendrier universitaire.",
  },
];

const paymentFaq: FaqItem[] = [
  {
    q: "Quels modes de paiement acceptez-vous ?",
    a: "MTN Mobile Money, Moov Money, cartes Visa et Mastercard via FedaPay. Toutes les transactions sont chiffrées de bout en bout et conformes aux standards PCI-DSS.",
  },
  {
    q: "Qu'est-ce que l'escrow KAZA ?",
    a: "L'escrow est un compte séquestre sécurisé : vos fonds (caution, premier loyer) sont bloqués chez KAZA, puis libérés au propriétaire uniquement après la remise effective des clés. Vous êtes ainsi protégé contre toute arnaque.",
  },
  {
    q: "Les paiements sont-ils sécurisés ?",
    a: "Oui. Nous utilisons FedaPay (PCI-DSS niveau 1) et Kkiapay comme fallback. Vos données bancaires ne transitent jamais par nos serveurs et sont chiffrées AES-256 par nos partenaires.",
  },
  {
    q: "Puis-je payer mon loyer en plusieurs fois ?",
    a: "Oui, sous réserve d'accord du propriétaire. Notre système permet de fractionner un paiement sur 2 à 4 échéances dans le mois, sans frais supplémentaires.",
  },
  {
    q: "Comment obtenir un reçu de paiement ?",
    a: "Un reçu PDF est généré automatiquement après chaque transaction et envoyé par email. Vous retrouvez l'historique complet dans votre tableau de bord.",
  },
  {
    q: "Que faire en cas de problème de paiement ?",
    a: "Contactez notre support via le chat ou par email à support@kaza.africa. Nous traitons les incidents de paiement en priorité, généralement sous 2 heures ouvrées.",
  },
];

const securityFaq: FaqItem[] = [
  {
    q: "Comment KAZA vérifie les identités ?",
    a: "Nous demandons une pièce d'identité officielle (CNI, passeport, permis) + un selfie de validation. Notre partenaire KYC analyse l'authenticité du document et compare biométriquement la photo. Les profils vérifiés portent un badge bleu.",
  },
  {
    q: "Mes données personnelles sont-elles protégées ?",
    a: "Oui. Nous sommes conformes au RGPD et à la loi béninoise sur la protection des données personnelles. Vos données sont chiffrées, hébergées en Europe (Frankfurt) et ne sont jamais revendues à des tiers.",
  },
  {
    q: "Comment résilier un contrat ?",
    a: "Depuis votre dashboard, ouvrez le contrat concerné et cliquez sur \"Demander la résiliation\". Le préavis légal s'applique (1 à 3 mois selon le bail). KAZA accompagne la procédure et gère l'état des lieux numérique.",
  },
  {
    q: "Que faire en cas de litige ?",
    a: "Notre équipe médiation intervient sous 48h. Tant que le litige n'est pas tranché, les fonds en escrow restent bloqués. Si nécessaire, nous vous mettons en relation avec nos avocats partenaires au Bénin.",
  },
  {
    q: "Puis-je signaler un utilisateur suspect ?",
    a: "Oui. Chaque profil et chaque annonce comporte un bouton \"Signaler\". Notre équipe modération examine chaque signalement en moins de 24h et prend les sanctions appropriées (avertissement, suspension, bannissement).",
  },
  {
    q: "Mon mot de passe est-il bien protégé ?",
    a: "Vos mots de passe sont hachés avec bcrypt et jamais stockés en clair. Nous proposons également l'authentification à deux facteurs (2FA) par SMS via Twilio.",
  },
];

const categories = [
  { id: "general", label: "Général", items: generalFaq },
  { id: "owners", label: "Propriétaires", items: ownerFaq },
  { id: "tenants", label: "Locataires", items: tenantFaq },
  { id: "students", label: "Étudiants", items: studentFaq },
  { id: "payments", label: "Paiements", items: paymentFaq },
  { id: "security", label: "Sécurité", items: securityFaq },
];

export default function FaqPage() {
  return (
    <div>
      <SectionHero
        eyebrow="Centre d'aide"
        title="Questions fréquentes"
        subtitle="Trouvez en quelques secondes les réponses aux questions que vous vous posez sur KAZA. Notre équipe support reste à votre disposition pour toute autre question."
        variant="light"
      />

      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-4 lg:px-8">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="mb-8 flex h-auto w-full flex-wrap gap-1 bg-gray-100 p-1">
              {categories.map((cat) => (
                <TabsTrigger
                  key={cat.id}
                  value={cat.id}
                  className="flex-1 min-w-[120px] data-[state=active]:bg-white data-[state=active]:text-kaza-navy"
                >
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map((cat) => (
              <TabsContent key={cat.id} value={cat.id} className="mt-6">
                <FaqAccordion items={cat.items} idPrefix={cat.id} />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      <CtaBanner
        title="Vous ne trouvez pas votre réponse ?"
        description="Notre équipe support vous répond en moins de 24h, en français et dans votre langue locale."
        primaryAction={{ label: "Contactez-nous", href: "/contact" }}
        secondaryAction={{ label: "Voir comment ça marche", href: "/how-it-works" }}
      />
    </div>
  );
}
