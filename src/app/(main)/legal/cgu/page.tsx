import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { LegalToc } from "@/components/marketing/legal-toc";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — KAZA",
  description:
    "Conditions Générales d'Utilisation de la plateforme KAZA : règles d'usage, responsabilités, paiements, modération et résiliation.",
  openGraph: {
    title: "CGU — KAZA",
    description:
      "Lisez les Conditions Générales d'Utilisation régissant l'usage de la plateforme KAZA au Bénin et en Afrique de l'Ouest.",
    type: "article",
  },
};

const sections = [
  { id: "objet", label: "1. Objet" },
  { id: "acceptation", label: "2. Acceptation" },
  { id: "definitions", label: "3. Définitions" },
  { id: "inscription", label: "4. Inscription et compte" },
  { id: "services", label: "5. Description des services" },
  { id: "responsabilites", label: "6. Responsabilités utilisateurs" },
  { id: "moderation", label: "7. Modération et signalements" },
  { id: "paiements", label: "8. Paiements, escrow et commissions" },
  { id: "litiges", label: "9. Litiges" },
  { id: "pi", label: "10. Propriété intellectuelle" },
  { id: "limite", label: "11. Limite de responsabilité" },
  { id: "resiliation", label: "12. Résiliation" },
  { id: "droit", label: "13. Droit applicable" },
  { id: "contact", label: "14. Contact" },
];

export default function CguPage() {
  return (
    <>
      <LegalToc items={sections} />

      <article className="w-full max-w-3xl">
        <header className="mb-8">
          <p className="mb-2 text-xs font-semibold tracking-widest uppercase text-kaza-blue">
            Document juridique
          </p>
          <h1 className="font-heading text-3xl font-bold text-kaza-navy sm:text-4xl">
            Conditions Générales d&apos;Utilisation
          </h1>
          <p className="mt-3 text-muted-foreground">
            Version applicable à compter du 25 mai 2026.
          </p>
        </header>

        <aside className="mb-10 flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" />
          <p>
            <strong>Document modèle MVP, à valider par juriste avant lancement public.</strong>{" "}
            Le présent texte est une base de travail destinée à la phase pilote
            et doit être révisé par un conseil juridique compétent en droit
            béninois et OHADA avant ouverture commerciale.
          </p>
        </aside>

        <div className="prose-legal space-y-12 text-foreground">
          <section id="objet" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              1. Objet
            </h2>
            <p className="mt-3 text-muted-foreground">
              Les présentes Conditions Générales d&apos;Utilisation (ci-après
              les &laquo;&nbsp;CGU&nbsp;&raquo;) ont pour objet de définir les
              modalités et conditions d&apos;accès et d&apos;utilisation de la
              plateforme KAZA, accessible via l&apos;adresse{" "}
              <span className="font-medium">https://kaza.africa</span> et son
              application mobile associée.
            </p>
            <p className="mt-3 text-muted-foreground">
              KAZA est une plateforme numérique de mise en relation entre
              propriétaires de biens immobiliers, locataires et étudiants
              recherchant une colocation, opérant principalement au Bénin et
              destinée à s&apos;étendre aux pays d&apos;Afrique de l&apos;Ouest.
            </p>
            <p className="mt-3 text-muted-foreground">
              KAZA n&apos;est ni propriétaire ni gestionnaire des biens
              proposés. Elle agit en qualité d&apos;intermédiaire technique et
              de prestataire de services de paiement sécurisés via tiers
              agréés.
            </p>
          </section>

          <section id="acceptation" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              2. Acceptation
            </h2>
            <p className="mt-3 text-muted-foreground">
              L&apos;inscription sur la plateforme et l&apos;utilisation de tout
              ou partie des services valent acceptation pleine et entière des
              présentes CGU. L&apos;utilisateur reconnaît en avoir pris
              connaissance et les avoir comprises avant toute action.
            </p>
            <p className="mt-3 text-muted-foreground">
              KAZA se réserve la faculté de modifier les CGU à tout moment. Les
              utilisateurs seront informés des modifications substantielles par
              courriel et/ou notification in-app au moins quinze (15) jours
              avant leur entrée en vigueur.
            </p>
            <p className="mt-3 text-muted-foreground">
              L&apos;usage continu de la plateforme après l&apos;entrée en
              vigueur des nouvelles CGU vaut acceptation tacite.
            </p>
          </section>

          <section id="definitions" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              3. Définitions
            </h2>
            <p className="mt-3 text-muted-foreground">
              Pour les besoins des présentes, les termes suivants ont la
              signification ci-après :
            </p>
            <ul className="mt-3 space-y-2 text-muted-foreground list-disc pl-5">
              <li>
                <strong>Plateforme</strong> : ensemble des services numériques
                édités par KAZA (site web, application mobile, API).
              </li>
              <li>
                <strong>Utilisateur</strong> : toute personne physique ou
                morale ayant créé un compte sur la Plateforme.
              </li>
              <li>
                <strong>Propriétaire</strong> : utilisateur publiant une ou
                plusieurs annonces de biens à louer.
              </li>
              <li>
                <strong>Locataire</strong> : utilisateur cherchant à louer un
                bien via la Plateforme.
              </li>
              <li>
                <strong>Étudiant</strong> : utilisateur cherchant une
                colocation ou un colocataire.
              </li>
              <li>
                <strong>Escrow</strong> : mécanisme de séquestre des fonds
                conservés par un tiers de confiance jusqu&apos;à libération.
              </li>
            </ul>
          </section>

          <section id="inscription" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              4. Inscription et compte
            </h2>
            <p className="mt-3 text-muted-foreground">
              L&apos;inscription est gratuite et ouverte à toute personne
              physique majeure et capable, ainsi qu&apos;aux personnes morales
              dûment représentées. Les utilisateurs mineurs ne sont pas admis
              sur la Plateforme.
            </p>
            <p className="mt-3 text-muted-foreground">
              L&apos;utilisateur s&apos;engage à fournir des informations
              exactes, à jour et complètes lors de son inscription, et à les
              actualiser sans délai en cas de modification. Une procédure de
              vérification d&apos;identité (KYC) peut être requise avant
              certaines opérations sensibles (publication d&apos;annonce,
              paiement, signature de contrat).
            </p>
            <p className="mt-3 text-muted-foreground">
              Les identifiants de connexion sont strictement personnels et
              confidentiels. L&apos;utilisateur est seul responsable de leur
              conservation et des actions effectuées depuis son compte.
            </p>
          </section>

          <section id="services" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              5. Description des services
            </h2>
            <p className="mt-3 text-muted-foreground">
              KAZA met à disposition de ses utilisateurs un ensemble de
              fonctionnalités incluant : publication et consultation
              d&apos;annonces immobilières, messagerie sécurisée, prise de
              rendez-vous de visite, signature électronique de contrats de
              bail, paiement de loyer et de caution via Mobile Money, et
              recherche de colocataires pour les étudiants.
            </p>
            <p className="mt-3 text-muted-foreground">
              Certains services sont gratuits, d&apos;autres font l&apos;objet
              de commissions ou d&apos;abonnements décrits sur la page Tarifs.
              KAZA peut ajouter, modifier ou supprimer des services sans
              préavis dans un objectif d&apos;amélioration continue.
            </p>
          </section>

          <section id="responsabilites" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              6. Responsabilités des utilisateurs
            </h2>
            <p className="mt-3 text-muted-foreground">
              Les propriétaires garantissent qu&apos;ils disposent du droit de
              louer les biens publiés, que les annonces sont sincères, exactes
              et conformes à la réalité (photos non trompeuses, surfaces
              véridiques, charges détaillées).
            </p>
            <p className="mt-3 text-muted-foreground">
              Les locataires et étudiants s&apos;engagent à respecter les biens
              visités, à honorer leurs engagements contractuels et à régler
              ponctuellement leurs loyers et charges.
            </p>
            <p className="mt-3 text-muted-foreground">
              Sont strictement interdits : la publication de contenus
              illicites, discriminatoires, mensongers ou diffamatoires, le
              contournement des outils de paiement de la Plateforme, le
              démarchage abusif et l&apos;usurpation d&apos;identité.
            </p>
          </section>

          <section id="moderation" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              7. Modération et signalements
            </h2>
            <p className="mt-3 text-muted-foreground">
              KAZA opère une modération a priori et a posteriori sur les
              annonces et les messages échangés. Une équipe dédiée examine les
              signalements et peut suspendre ou retirer un contenu en cas de
              manquement aux présentes CGU.
            </p>
            <p className="mt-3 text-muted-foreground">
              Tout utilisateur peut signaler une annonce, un message ou un
              comportement abusif via le bouton de signalement disponible sur
              chaque ressource. Les signalements abusifs ou de mauvaise foi
              pourront eux-mêmes être sanctionnés.
            </p>
          </section>

          <section id="paiements" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              8. Paiements, escrow et commissions
            </h2>
            <p className="mt-3 text-muted-foreground">
              Les paiements sont opérés via des prestataires agréés (FedaPay en
              principal, Kkiapay en secours) et acceptent les principaux
              moyens Mobile Money disponibles au Bénin (MTN, Moov). KAZA ne
              stocke aucune donnée bancaire ou Mobile Money sensible.
            </p>
            <p className="mt-3 text-muted-foreground">
              Les fonds versés au titre d&apos;une caution ou d&apos;un premier
              loyer sont placés en escrow jusqu&apos;à la remise effective des
              clés et la confirmation par les deux parties, ou jusqu&apos;à
              résolution d&apos;un éventuel litige.
            </p>
            <p className="mt-3 text-muted-foreground">
              Les commissions applicables (par exemple 5&nbsp;% sur loyer
              perçu pour le plan Starter, ou abonnement Pro mensuel) sont
              décrites sur la page Tarifs et acceptées explicitement avant
              toute publication d&apos;annonce.
            </p>
          </section>

          <section id="litiges" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              9. Litiges
            </h2>
            <p className="mt-3 text-muted-foreground">
              En cas de litige entre un propriétaire et un locataire, KAZA met
              à disposition une procédure de médiation interne via son équipe
              Trust &amp; Safety. Les parties s&apos;engagent à coopérer de
              bonne foi durant toute la durée de l&apos;instruction.
            </p>
            <p className="mt-3 text-muted-foreground">
              À défaut de résolution amiable, les parties pourront saisir les
              juridictions compétentes selon les règles décrites à
              l&apos;article 13.
            </p>
          </section>

          <section id="pi" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              10. Propriété intellectuelle
            </h2>
            <p className="mt-3 text-muted-foreground">
              L&apos;ensemble des éléments composant la Plateforme (logos,
              marques, charte graphique, code source, base de données) est la
              propriété exclusive de KAZA ou de ses partenaires, et est
              protégé par les lois en vigueur.
            </p>
            <p className="mt-3 text-muted-foreground">
              Les utilisateurs concèdent à KAZA une licence non exclusive,
              mondiale et gratuite d&apos;utilisation des contenus
              qu&apos;ils publient (photos, descriptions d&apos;annonces), aux
              seules fins d&apos;exploitation de la Plateforme.
            </p>
          </section>

          <section id="limite" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              11. Limite de responsabilité
            </h2>
            <p className="mt-3 text-muted-foreground">
              KAZA agit en qualité d&apos;intermédiaire technique et ne saurait
              être tenue responsable des engagements contractuels conclus
              entre utilisateurs, ni de l&apos;état réel des biens visités ou
              loués.
            </p>
            <p className="mt-3 text-muted-foreground">
              KAZA s&apos;engage à mettre en œuvre les meilleurs efforts pour
              assurer la disponibilité de la Plateforme, sans toutefois
              garantir une absence totale d&apos;interruption ou d&apos;erreur.
            </p>
          </section>

          <section id="resiliation" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              12. Résiliation
            </h2>
            <p className="mt-3 text-muted-foreground">
              L&apos;utilisateur peut clôturer son compte à tout moment depuis
              les paramètres de son espace personnel, sous réserve d&apos;avoir
              soldé tout engagement en cours.
            </p>
            <p className="mt-3 text-muted-foreground">
              KAZA pourra suspendre ou clôturer un compte en cas de
              manquement grave ou répété aux présentes CGU, après notification
              préalable sauf urgence ou fraude avérée.
            </p>
          </section>

          <section id="droit" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              13. Droit applicable
            </h2>
            <p className="mt-3 text-muted-foreground">
              Les présentes CGU sont régies par le droit béninois et, le cas
              échéant, par les Actes uniformes de l&apos;OHADA applicables aux
              opérations commerciales conclues sur la Plateforme.
            </p>
            <p className="mt-3 text-muted-foreground">
              Tout litige relatif à leur interprétation ou à leur exécution
              relèvera, à défaut de règlement amiable, des juridictions
              compétentes de Cotonou.
            </p>
          </section>

          <section id="contact" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              14. Contact
            </h2>
            <p className="mt-3 text-muted-foreground">
              Pour toute question relative aux présentes CGU, vous pouvez
              contacter notre équipe juridique à l&apos;adresse{" "}
              <a
                href="mailto:legal@kaza.africa"
                className="font-medium text-kaza-blue hover:underline"
              >
                legal@kaza.africa
              </a>{" "}
              ou par courrier postal à KAZA SARL, Cotonou, République du
              Bénin.
            </p>
          </section>
        </div>
      </article>
    </>
  );
}
