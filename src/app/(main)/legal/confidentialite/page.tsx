import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Comment KAZA collecte, utilise et protège vos données personnelles.",
};

export default function ConfidentialitePage() {
  return (
    <article className="prose prose-slate max-w-none">
      <h1 className="font-heading text-3xl font-bold">
        Politique de confidentialité
      </h1>
      <p className="text-sm text-muted-foreground">
        En vigueur au 25 mai 2026 — modèle MVP, à valider par un juriste avant
        lancement public.
      </p>

      <p>
        KAZA SARL (« KAZA », « nous ») attache une importance particulière à la
        protection de vos données personnelles. La présente politique décrit la
        manière dont nous collectons, utilisons et protégeons les informations
        que vous nous confiez en utilisant la plateforme accessible à
        l&apos;adresse kaza.africa.
      </p>

      <h2 id="donnees">1. Données collectées</h2>
      <ul>
        <li>
          <strong>Identité</strong> : nom, prénom, date de naissance, pièce
          d&apos;identité, selfie de vérification.
        </li>
        <li>
          <strong>Contact</strong> : adresse e-mail, numéro de téléphone, ville
          de résidence.
        </li>
        <li>
          <strong>Paiement</strong> : numéro Mobile Money ou carte (tokenisé via
          notre prestataire FedaPay / Kkiapay — nous ne stockons aucun numéro
          en clair).
        </li>
        <li>
          <strong>Localisation</strong> : ville et quartier de votre bien ou
          recherche, coordonnées GPS approximatives si vous activez la
          géolocalisation.
        </li>
        <li>
          <strong>Contenu uploadé</strong> : photos, vidéos, descriptions
          d&apos;annonces, messages dans la messagerie.
        </li>
        <li>
          <strong>Données d&apos;usage</strong> : pages consultées, recherches
          effectuées, appareil, navigateur, adresse IP.
        </li>
      </ul>

      <h2 id="finalites">2. Finalités</h2>
      <ul>
        <li>Création et gestion de votre compte.</li>
        <li>Mise en relation entre propriétaires, locataires et étudiants.</li>
        <li>Traitement des paiements et escrow.</li>
        <li>Génération et signature électronique des contrats de location.</li>
        <li>Modération des annonces et lutte contre la fraude.</li>
        <li>Envoi de notifications transactionnelles (e-mail, SMS, push).</li>
        <li>
          Communication marketing (uniquement avec votre consentement explicite).
        </li>
        <li>Statistiques anonymisées d&apos;amélioration produit.</li>
      </ul>

      <h2 id="bases-legales">3. Bases légales</h2>
      <ul>
        <li>
          <strong>Exécution du contrat</strong> : gestion de votre compte et des
          locations.
        </li>
        <li>
          <strong>Consentement</strong> : marketing, cookies non essentiels.
        </li>
        <li>
          <strong>Intérêt légitime</strong> : sécurité de la plateforme,
          prévention de la fraude.
        </li>
        <li>
          <strong>Obligation légale</strong> : conservation des pièces
          d&apos;identité aux fins de KYC/AML, justificatifs fiscaux.
        </li>
      </ul>

      <h2 id="destinataires">4. Destinataires</h2>
      <p>Vos données sont accessibles à :</p>
      <ul>
        <li>Nos équipes internes (support, modération, ingénierie).</li>
        <li>
          Nos prestataires techniques liés par contrat de sous-traitance :
          Supabase (hébergement base de données + auth), Vercel (hébergement
          web), FedaPay et Kkiapay (paiements), Twilio (SMS), Resend (e-mails),
          Firebase Cloud Messaging (notifications push).
        </li>
        <li>
          Les autorités compétentes en cas de réquisition judiciaire ou de
          signalement obligatoire.
        </li>
      </ul>
      <p>
        Nous ne vendons ni ne louons vos données à des tiers à des fins
        commerciales.
      </p>

      <h2 id="conservation">5. Durée de conservation</h2>
      <ul>
        <li>
          Compte actif : pendant toute la durée d&apos;utilisation, puis archivé
          3 ans après votre dernière connexion.
        </li>
        <li>
          Pièces d&apos;identité : durée minimale légale (5 ans après la fin de
          la relation contractuelle).
        </li>
        <li>
          Contrats et paiements : 10 ans pour les besoins comptables et fiscaux.
        </li>
        <li>Logs techniques : 12 mois maximum.</li>
      </ul>

      <h2 id="droits">6. Vos droits</h2>
      <p>Vous disposez à tout moment des droits suivants :</p>
      <ul>
        <li>Droit d&apos;accès à vos données.</li>
        <li>Droit de rectification des données inexactes.</li>
        <li>
          Droit à l&apos;effacement (sauf obligation légale de conservation).
        </li>
        <li>Droit à la portabilité.</li>
        <li>Droit d&apos;opposition au traitement.</li>
        <li>Droit de retirer votre consentement à tout moment.</li>
      </ul>
      <p>
        Pour exercer ces droits, contactez notre DPO à l&apos;adresse{" "}
        <a href="mailto:dpo@kaza.africa">dpo@kaza.africa</a>.
      </p>

      <h2 id="cookies">7. Cookies</h2>
      <p>
        Notre utilisation des cookies est détaillée dans notre{" "}
        <a href="/legal/cookies">politique cookies</a>.
      </p>

      <h2 id="transferts">8. Transferts hors OHADA</h2>
      <p>
        Certains de nos prestataires (Vercel, Supabase, Firebase) opèrent des
        datacenters hors zone OHADA, notamment en Union européenne et aux
        États-Unis. Nous nous assurons que ces transferts sont encadrés par des
        garanties contractuelles appropriées (clauses contractuelles types).
      </p>

      <h2 id="securite">9. Sécurité</h2>
      <p>
        Nous mettons en œuvre des mesures techniques et organisationnelles
        appropriées : chiffrement en transit (HTTPS / TLS), chiffrement au
        repos pour les pièces d&apos;identité, accès restreint, audit de
        sécurité régulier, signatures HMAC sur tous les webhooks de paiement.
      </p>

      <h2 id="contact">10. Contact</h2>
      <p>
        Délégué à la Protection des Données :{" "}
        <a href="mailto:dpo@kaza.africa">dpo@kaza.africa</a>
        <br />
        Adresse postale : KAZA SARL, Cotonou, Bénin.
      </p>
    </article>
  );
}
