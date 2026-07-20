import type { Metadata } from "next";
import { Gavel } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LegalToc } from "@/components/marketing/legal-toc";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — Kaabo",
  description:
    "Conditions Générales d'Utilisation de la plateforme Kaabo, éditée par PIRABEL LABS SARL — droit béninois, OHADA, paiements, escrow, bail et résolution des litiges.",
  openGraph: {
    title: "CGU — Kaabo",
    description:
      "Conditions Générales d'Utilisation de la plateforme Kaabo selon le droit béninois et OHADA.",
    type: "article",
  },
};

const sections = [
  { id: "objet", label: "1. Objet et acceptation" },
  { id: "definitions", label: "2. Définitions" },
  { id: "inscription", label: "3. Inscription et compte" },
  { id: "services", label: "4. Description des services" },
  { id: "engagements-users", label: "5. Engagements des Utilisateurs" },
  { id: "engagements-kaza", label: "6. Engagements de Kaabo" },
  { id: "moderation", label: "7. Politique de modération" },
  { id: "paiements", label: "8. Paiements, escrow et commissions" },
  { id: "bail", label: "9. Bail et obligations" },
  { id: "litiges", label: "10. Litiges et résolution amiable" },
  { id: "pi", label: "11. Propriété intellectuelle" },
  { id: "limite", label: "12. Limitation de responsabilité" },
  { id: "resiliation", label: "13. Suspension et résiliation" },
  { id: "droit", label: "14. Droit applicable et juridiction" },
  { id: "modifications", label: "15. Modifications des CGU" },
];

export default function CguPage() {
  return (
    <>
      <LegalToc items={sections} />

      <article className="w-full max-w-3xl">
        <header className="mb-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-kaza-blue/30 text-kaza-blue">
              Document juridique
            </Badge>
            <Badge variant="secondary">15 articles</Badge>
            <Badge variant="secondary">Droit béninois + OHADA</Badge>
          </div>
          <h1 className="font-heading text-3xl font-bold text-kaza-navy sm:text-4xl">
            Conditions Générales d&apos;Utilisation
          </h1>
          <p className="mt-3 text-muted-foreground">
            Version applicable à compter du 27 mai 2026.
          </p>
        </header>

        <aside className="mb-10 flex gap-3 rounded-lg border border-kaza-blue/20 bg-kaza-blue/5 p-4 text-sm">
          <Gavel className="mt-0.5 size-5 shrink-0 text-kaza-blue" />
          <p className="text-foreground">
            <strong>
              Document à valeur juridique — En vigueur depuis le 27 mai 2026.
            </strong>{" "}
            Édité par PIRABEL LABS SARL. Contact juridique :{" "}
            <a
              href="mailto:immobilierkaza@gmail.com"
              className="font-medium text-kaza-blue hover:underline"
            >
              immobilierkaza@gmail.com
            </a>
            .
          </p>
        </aside>

        <div className="prose-legal space-y-12 text-foreground">
          <section id="objet" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              1. Objet et acceptation
            </h2>
            <p className="mt-3 text-muted-foreground">
              Les présentes Conditions Générales d&apos;Utilisation (ci-après
              les «&nbsp;CGU&nbsp;») ont pour objet de définir les modalités
              d&apos;accès et d&apos;utilisation de la plateforme Kaabo,
              accessible à l&apos;adresse{" "}
              <span className="font-medium">https://kaza.africa</span> et sur
              son application mobile associée, éditée et exploitée par{" "}
              <strong>PIRABEL LABS SARL</strong> (ci-après «&nbsp;Kaabo&nbsp;»
              ou «&nbsp;l&apos;Éditeur&nbsp;»).
            </p>
            <p className="mt-3 text-muted-foreground">
              Kaabo est une plateforme Proptech de mise en relation entre
              propriétaires de biens immobiliers, locataires et étudiants
              recherchant une colocation, opérant principalement au Bénin et
              destinée à s&apos;étendre aux pays d&apos;Afrique de l&apos;Ouest.
            </p>
            <p className="mt-3 text-muted-foreground">
              L&apos;inscription sur la plateforme et l&apos;utilisation de
              tout ou partie des services valent acceptation pleine et entière
              des présentes CGU. L&apos;Utilisateur reconnaît en avoir pris
              connaissance et les avoir comprises avant toute action.
            </p>
          </section>

          <section id="definitions" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              2. Définitions
            </h2>
            <p className="mt-3 text-muted-foreground">
              Pour les besoins des présentes, les termes suivants ont la
              signification ci-après :
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
              <li>
                <strong>Plateforme</strong> : ensemble des services numériques
                édités par PIRABEL LABS SARL sous la marque Kaabo (site web,
                application mobile, API).
              </li>
              <li>
                <strong>Utilisateur</strong> : toute personne physique majeure
                ou morale ayant créé un compte sur la Plateforme.
              </li>
              <li>
                <strong>Propriétaire</strong> : Utilisateur publiant une ou
                plusieurs annonces de biens à louer.
              </li>
              <li>
                <strong>Locataire</strong> : Utilisateur cherchant à louer un
                bien via la Plateforme.
              </li>
              <li>
                <strong>Étudiant</strong> : Utilisateur cherchant une
                colocation ou un colocataire dans le cadre d&apos;un cursus
                d&apos;études.
              </li>
              <li>
                <strong>Kaabo Pay</strong> : solution de paiement intégrée
                permettant le règlement sécurisé des loyers, cautions et
                commissions via Mobile Money et carte bancaire (FeexPay).
              </li>
              <li>
                <strong>Escrow</strong> : mécanisme de séquestre des fonds
                conservés par un tiers de confiance jusqu&apos;à libération
                contradictoire entre les parties.
              </li>
              <li>
                <strong>Contrat numérique</strong> : bail ou convention de
                colocation établi, signé électroniquement et archivé via la
                Plateforme.
              </li>
            </ul>
          </section>

          <section id="inscription" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              3. Inscription et compte
            </h2>
            <p className="mt-3 text-muted-foreground">
              L&apos;inscription est gratuite et réservée aux personnes
              physiques <strong>âgées de 18 ans révolus</strong> et capables,
              ainsi qu&apos;aux personnes morales dûment représentées. Les
              mineurs ne sont pas admis sur la Plateforme.
            </p>
            <p className="mt-3 text-muted-foreground">
              Conformément à la réglementation béninoise relative à la lutte
              contre le blanchiment de capitaux et le financement du terrorisme
              (LBC/FT), une <strong>procédure de vérification d&apos;identité
              (KYC)</strong> est obligatoire avant toute opération sensible :
              publication d&apos;annonce, signature de contrat, encaissement ou
              paiement supérieur à un seuil défini.
            </p>
            <p className="mt-3 text-muted-foreground">
              L&apos;Utilisateur s&apos;engage à fournir des informations
              exactes, à jour et complètes et à les actualiser sans délai. Les
              identifiants de connexion sont strictement personnels ;
              l&apos;Utilisateur est seul responsable de leur conservation et
              des actions effectuées depuis son compte.
            </p>
          </section>

          <section id="services" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              4. Description des services
            </h2>
            <p className="mt-3 text-muted-foreground">
              Kaabo met à disposition de ses Utilisateurs : publication et
              consultation d&apos;annonces immobilières géolocalisées,
              messagerie sécurisée, prise de rendez-vous de visite, signature
              électronique de Contrats numériques, paiement de loyer et de
              caution via Kaabo Pay, escrow, gestion documentaire et recherche
              de colocataires pour les Étudiants.
            </p>
            <p className="mt-3 text-muted-foreground">
              Certains services sont gratuits, d&apos;autres font l&apos;objet
              de commissions ou d&apos;abonnements décrits sur la page Tarifs.
              Kaabo peut ajouter, modifier ou supprimer des services dans un
              objectif d&apos;amélioration continue, après notification
              raisonnable aux Utilisateurs concernés.
            </p>
          </section>

          <section id="engagements-users" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              5. Engagements des Utilisateurs
            </h2>
            <p className="mt-3 text-muted-foreground">
              Les Propriétaires garantissent disposer du droit de louer les
              biens publiés, que les annonces sont sincères, exactes et
              conformes à la réalité (photos non trompeuses, surfaces
              véridiques, charges détaillées) et conformes à la{" "}
              <strong>Loi n° 2018-12 sur l&apos;urbanisme et la construction</strong>.
            </p>
            <p className="mt-3 text-muted-foreground">
              Les Locataires et Étudiants s&apos;engagent à respecter les biens
              visités, à honorer leurs engagements contractuels et à régler
              ponctuellement leurs loyers et charges via les moyens proposés
              par la Plateforme.
            </p>
            <p className="mt-3 text-muted-foreground">
              Sont strictement interdits, et passibles de sanctions au titre
              du Code pénal béninois 2018 le cas échéant : publication de
              contenus illicites, discriminatoires, mensongers ou diffamatoires,
              contournement des outils de paiement de la Plateforme, démarchage
              abusif, usurpation d&apos;identité et collecte non autorisée de
              données d&apos;autres Utilisateurs.
            </p>
          </section>

          <section id="engagements-kaza" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              6. Engagements de Kaabo / PIRABEL LABS
            </h2>
            <p className="mt-3 text-muted-foreground">
              PIRABEL LABS SARL s&apos;engage à fournir la Plateforme dans les
              meilleures conditions de disponibilité, de sécurité et de
              transparence. Kaabo met en œuvre les diligences raisonnables pour
              vérifier l&apos;identité des Utilisateurs, modérer les contenus
              et sécuriser les flux financiers via Kaabo Pay et l&apos;escrow.
            </p>
            <p className="mt-3 text-muted-foreground">
              Kaabo agit en qualité d&apos;intermédiaire technique et de tiers
              de confiance, sans se substituer aux parties dans
              l&apos;exécution de leurs obligations contractuelles
              respectives.
            </p>
          </section>

          <section id="moderation" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              7. Politique de modération
            </h2>
            <p className="mt-3 text-muted-foreground">
              Kaabo opère une modération a priori et a posteriori sur les
              annonces et les messages échangés. Une équipe Trust &amp; Safety
              dédiée examine les signalements et peut suspendre, retirer un
              contenu ou un compte en cas de manquement aux présentes CGU.
            </p>
            <p className="mt-3 text-muted-foreground">
              Tout Utilisateur peut signaler une annonce, un message ou un
              comportement abusif via le bouton de signalement disponible sur
              chaque ressource. Les signalements manifestement abusifs ou de
              mauvaise foi pourront eux-mêmes être sanctionnés.
            </p>
          </section>

          <section id="paiements" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              8. Paiements, escrow et commissions
            </h2>
            <p className="mt-3 text-muted-foreground">
              Les paiements sont opérés via le prestataire agréé FeexPay,
              acceptant les principaux moyens Mobile Money (Wave, Orange Money,
              MTN, Moov…) et carte bancaire en Afrique. Kaabo ne stocke aucune
              donnée bancaire ou Mobile Money sensible : les numéros sont
              tokenisés par le prestataire.
            </p>
            <p className="mt-3 text-muted-foreground">
              Conformément aux dispositions des{" "}
              <strong>
                articles 1984 et suivants du Code civil béninois relatifs au
                mandat
              </strong>
              , les fonds versés au titre d&apos;une caution ou d&apos;un
              premier loyer sont placés en escrow chez le prestataire de
              paiement jusqu&apos;à la remise effective des clés et la
              confirmation par les deux parties, ou jusqu&apos;à résolution
              d&apos;un éventuel litige.
            </p>
            <p className="mt-3 text-muted-foreground">
              <strong>Commissions Kaabo :</strong> entre 3 % et 5 % du loyer
              perçu selon le plan d&apos;abonnement souscrit par le
              Propriétaire. Les conditions tarifaires détaillées sont
              consultables sur la page Tarifs et acceptées explicitement avant
              toute publication d&apos;annonce.
            </p>
          </section>

          <section id="bail" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              9. Bail et obligations
            </h2>
            <p className="mt-3 text-muted-foreground">
              Les baux conclus via la Plateforme sont régis par le Code civil
              béninois et la <strong>Loi n° 2018-12</strong> portant code de
              l&apos;urbanisme et de la construction en République du Bénin.
              Ils sont matérialisés par un Contrat numérique signé
              électroniquement et archivé de manière sécurisée.
            </p>
            <p className="mt-3 text-muted-foreground">
              Les baux d&apos;habitation conclus via Kaabo respectent une durée
              minimale conforme à la pratique locale (généralement 12 mois pour
              un bail à usage d&apos;habitation, sauf clause spéciale). Le{" "}
              <strong>dépôt de garantie ne peut excéder deux (2) mois de
              loyer hors charges</strong>, conformément à la pratique encadrée
              du marché immobilier béninois.
            </p>
            <p className="mt-3 text-muted-foreground">
              L&apos;état des lieux d&apos;entrée et de sortie est obligatoire,
              dématérialisé via la Plateforme et fait foi entre les parties
              sauf preuve contraire.
            </p>
          </section>

          <section id="litiges" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              10. Litiges et résolution amiable
            </h2>
            <p className="mt-3 text-muted-foreground">
              En cas de litige entre Utilisateurs, Kaabo met à disposition une{" "}
              <strong>procédure de médiation interne gratuite</strong> via son
              équipe Trust &amp; Safety. Les parties s&apos;engagent à coopérer
              de bonne foi durant toute la durée de l&apos;instruction.
            </p>
            <p className="mt-3 text-muted-foreground">
              Conformément aux dispositions du <strong>Code de procédure
              civile, commerciale, sociale, administrative et des comptes</strong>{" "}
              du Bénin, une tentative de conciliation préalable est obligatoire
              avant toute saisine juridictionnelle pour les litiges relevant de
              la compétence des tribunaux de commerce.
            </p>
            <p className="mt-3 text-muted-foreground">
              À défaut de résolution amiable dans un délai de trente (30) jours
              à compter de la notification du différend, les parties pourront
              saisir les juridictions compétentes selon l&apos;article 14
              ci-après.
            </p>
          </section>

          <section id="pi" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              11. Propriété intellectuelle
            </h2>
            <p className="mt-3 text-muted-foreground">
              L&apos;ensemble des éléments composant la Plateforme (marques,
              logos, charte graphique, code source, base de données,
              interfaces) est la propriété exclusive de{" "}
              <strong>PIRABEL LABS SARL</strong>, protégée par l&apos;Accord
              de Bangui révisé de 2015 (OAPI) — notamment les Annexes III
              (marques) et VII (droit d&apos;auteur).
            </p>
            <p className="mt-3 text-muted-foreground">
              Les Utilisateurs concèdent à PIRABEL LABS SARL une licence non
              exclusive, mondiale et gratuite d&apos;utilisation des contenus
              qu&apos;ils publient (photos, descriptions d&apos;annonces,
              commentaires), aux seules fins d&apos;exploitation,
              d&apos;affichage, de promotion et d&apos;amélioration de la
              Plateforme.
            </p>
          </section>

          <section id="limite" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              12. Limitation de responsabilité
            </h2>
            <p className="mt-3 text-muted-foreground">
              Conformément aux dispositions du{" "}
              <strong>
                Code du numérique au Bénin (Loi n° 2017-20 du 20 avril 2018)
              </strong>{" "}
              relatives aux intermédiaires techniques, PIRABEL LABS SARL ne
              saurait être tenue responsable des engagements contractuels
              conclus directement entre Utilisateurs, ni de l&apos;état réel
              des biens visités ou loués.
            </p>
            <p className="mt-3 text-muted-foreground">
              Kaabo s&apos;engage à mettre en œuvre les meilleurs efforts pour
              assurer la disponibilité de la Plateforme, sans toutefois
              garantir une absence totale d&apos;interruption ou
              d&apos;erreur. La responsabilité de PIRABEL LABS SARL ne saurait
              être engagée en cas de <strong>force majeure</strong> au sens du
              droit béninois (catastrophe naturelle, coupure de réseau de
              télécommunications, décision d&apos;une autorité, etc.).
            </p>
          </section>

          <section id="resiliation" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              13. Suspension et résiliation
            </h2>
            <p className="mt-3 text-muted-foreground">
              L&apos;Utilisateur peut clôturer son compte à tout moment depuis
              les paramètres de son espace personnel, sous réserve d&apos;avoir
              soldé tout engagement en cours (loyers dus, contrats actifs).
            </p>
            <p className="mt-3 text-muted-foreground">
              Kaabo pourra suspendre ou clôturer un compte en cas de manquement
              grave ou répété aux présentes CGU, notamment : fraude, fausses
              informations, contournement des outils de paiement, publication
              de contenus illicites, comportements abusifs. Sauf urgence ou
              fraude avérée, un <strong>préavis de trente (30) jours</strong>{" "}
              est observé, accompagné d&apos;une notification écrite motivée.
            </p>
          </section>

          <section id="droit" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              14. Droit applicable et juridiction
            </h2>
            <p className="mt-3 text-muted-foreground">
              Les présentes CGU sont régies par le <strong>droit béninois</strong>
              {" "}et, le cas échéant, par les <strong>Actes uniformes de
              l&apos;OHADA</strong> applicables aux opérations commerciales
              conclues sur la Plateforme (notamment l&apos;Acte uniforme
              portant droit commercial général).
            </p>
            <p className="mt-3 text-muted-foreground">
              Tout litige relatif à leur interprétation ou à leur exécution
              relèvera, à défaut de règlement amiable et après tentative
              obligatoire de conciliation, de la compétence exclusive du{" "}
              <strong>Tribunal de Commerce de Cotonou</strong> et, en appel,
              de la <strong>Cour d&apos;Appel de Cotonou</strong>.
            </p>
          </section>

          <section id="modifications" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              15. Modifications des CGU
            </h2>
            <p className="mt-3 text-muted-foreground">
              PIRABEL LABS SARL se réserve la faculté de modifier les CGU à
              tout moment. Les Utilisateurs seront informés des modifications
              substantielles par courriel et notification in-app au moins{" "}
              <strong>quinze (15) jours</strong> avant leur entrée en vigueur.
            </p>
            <p className="mt-3 text-muted-foreground">
              L&apos;usage continu de la Plateforme après l&apos;entrée en
              vigueur des nouvelles CGU vaut acceptation tacite. À défaut
              d&apos;acceptation, l&apos;Utilisateur dispose du droit de
              clôturer son compte conformément à l&apos;article 13.
            </p>
          </section>
        </div>

        <Separator className="my-10" />

        <footer className="text-xs text-muted-foreground">
          © 2026 KAZA® — Marque déposée par PIRABEL LABS SARL. Une création{" "}
          <a
            href="https://pirabellabs.com"
            className="text-kaza-blue hover:underline"
            rel="noreferrer"
            target="_blank"
          >
            https://pirabellabs.com
          </a>
        </footer>
      </article>
    </>
  );
}
