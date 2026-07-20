import type { Metadata } from "next";
import { ShieldCheck, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LegalToc } from "@/components/marketing/legal-toc";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Kaabo",
  description:
    "Politique de protection des données personnelles de Kaabo, conforme à la Loi n° 2017-20 du 20 avril 2018 (Code du numérique au Bénin) et aux standards RGPD UE.",
  openGraph: {
    title: "Politique de confidentialité — Kaabo",
    description:
      "Comment PIRABEL LABS SARL (Kaabo) collecte, utilise et protège vos données personnelles selon le droit béninois.",
    type: "article",
  },
};

const sections = [
  { id: "preambule", label: "1. Préambule" },
  { id: "responsable", label: "2. Responsable du traitement" },
  { id: "donnees", label: "3. Données collectées" },
  { id: "finalites", label: "4. Finalités" },
  { id: "bases", label: "5. Bases légales" },
  { id: "destinataires", label: "6. Destinataires" },
  { id: "transferts", label: "7. Transferts hors Bénin" },
  { id: "conservation", label: "8. Durée de conservation" },
  { id: "droits", label: "9. Vos droits" },
  { id: "apdp", label: "10. APDP — votre recours" },
  { id: "securite", label: "11. Sécurité" },
  { id: "cookies", label: "12. Cookies" },
  { id: "modifications", label: "13. Modifications" },
  { id: "contact", label: "14. Contact DPO" },
];

export default function ConfidentialitePage() {
  return (
    <>
      <LegalToc items={sections} />

      <article className="w-full max-w-3xl">
        <header className="mb-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-kaza-blue/30 text-kaza-blue">
              Données personnelles
            </Badge>
            <Badge variant="secondary">Loi 2017-20 Bénin</Badge>
            <Badge variant="secondary">Standards RGPD UE</Badge>
          </div>
          <h1 className="font-heading text-3xl font-bold text-kaza-navy sm:text-4xl">
            Politique de confidentialité
          </h1>
          <p className="mt-3 text-muted-foreground">
            En vigueur à compter du 27 mai 2026.
          </p>
        </header>

        <aside className="mb-10 flex gap-3 rounded-lg border border-kaza-blue/20 bg-kaza-blue/5 p-4 text-sm">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-kaza-blue" />
          <p className="text-foreground">
            <strong>Édité par PIRABEL LABS SARL</strong> — Document conforme au
            droit béninois (Loi n° 2017-20 du 20 avril 2018 portant Code du
            numérique) et aux standards RGPD UE. Contact DPO :{" "}
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
          <section id="preambule" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              1. Préambule
            </h2>
            <p className="mt-3 text-muted-foreground">
              PIRABEL LABS SARL (ci-après «&nbsp;PIRABEL LABS&nbsp;» ou
              «&nbsp;Kaabo&nbsp;»), éditrice de la plateforme Kaabo accessible à
              l&apos;adresse <span className="font-medium">https://kaza.africa</span>,
              accorde une importance fondamentale à la protection des données
              personnelles de ses Utilisateurs.
            </p>
            <p className="mt-3 text-muted-foreground">
              La présente politique est rédigée conformément aux dispositions
              de la <strong>Loi n° 2017-20 du 20 avril 2018 portant Code du
              numérique en République du Bénin (CdN), articles 379 à 423</strong>,
              équivalent local du Règlement Général sur la Protection des
              Données (RGPD) de l&apos;Union européenne.
            </p>
            <p className="mt-3 text-muted-foreground">
              Dans la mesure où certains de nos prestataires techniques sont
              établis dans l&apos;Union européenne, PIRABEL LABS s&apos;aligne
              également volontairement sur les standards les plus protecteurs
              issus du RGPD UE.
            </p>
          </section>

          <section id="responsable" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              2. Responsable du traitement
            </h2>
            <dl className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-border bg-gray-50 p-5 text-sm sm:grid-cols-[200px_1fr]">
              <dt className="font-medium text-foreground">Raison sociale</dt>
              <dd className="text-muted-foreground">PIRABEL LABS SARL</dd>
              <dt className="font-medium text-foreground">Siège social</dt>
              <dd className="text-muted-foreground">
                Quartier Cadjèhoun, Cotonou, République du Bénin
              </dd>
              <dt className="font-medium text-foreground">RCCM</dt>
              <dd className="text-muted-foreground">
                En cours d&apos;immatriculation
              </dd>
              <dt className="font-medium text-foreground">
                Délégué à la Protection des Données (DPO)
              </dt>
              <dd className="text-muted-foreground">
                <a
                  href="mailto:immobilierkaza@gmail.com"
                  className="text-kaza-blue hover:underline"
                >
                  immobilierkaza@gmail.com
                </a>
              </dd>
            </dl>
          </section>

          <section id="donnees" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              3. Données collectées
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
              <li>
                <strong>Identité (KYC immobilier obligatoire)</strong> : nom,
                prénom, date de naissance, pièce d&apos;identité officielle,
                selfie de vérification — collecte imposée par la
                réglementation béninoise relative au secteur immobilier et à
                la LBC/FT.
              </li>
              <li>
                <strong>Contact</strong> : adresse e-mail, numéro de téléphone
                mobile, ville et quartier de résidence.
              </li>
              <li>
                <strong>Paiement (tokenisé)</strong> : références Mobile Money
                ou cartes bancaires tokenisées par notre prestataire
                (FeexPay). PIRABEL LABS ne stocke <em>aucun</em> numéro en
                clair.
              </li>
              <li>
                <strong>Localisation</strong> : ville et quartier du bien ou
                de la recherche, coordonnées GPS approximatives si vous
                activez la géolocalisation.
              </li>
              <li>
                <strong>Contenu</strong> : photos, vidéos, descriptions
                d&apos;annonces, messages échangés dans la messagerie sécurisée.
              </li>
              <li>
                <strong>Données d&apos;usage</strong> : pages consultées,
                recherches effectuées, type d&apos;appareil, navigateur,
                adresse IP, logs techniques.
              </li>
            </ul>
          </section>

          <section id="finalites" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              4. Finalités (art. 391 CdN)
            </h2>
            <p className="mt-3 text-muted-foreground">
              Conformément à l&apos;article 391 du Code du numérique, les
              traitements de données opérés par PIRABEL LABS poursuivent des
              finalités déterminées, explicites et légitimes :
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
              <li>Création et gestion de votre compte Utilisateur.</li>
              <li>
                Mise en relation entre Propriétaires, Locataires et Étudiants.
              </li>
              <li>Traitement des paiements, escrow et libérations de fonds.</li>
              <li>
                Génération, signature électronique et archivage des Contrats
                numériques.
              </li>
              <li>
                Modération des annonces et lutte contre la fraude (KYC, AML).
              </li>
              <li>
                Envoi de notifications transactionnelles (e-mail, SMS, push).
              </li>
              <li>
                Communication marketing (uniquement avec consentement
                explicite et révocable).
              </li>
              <li>Statistiques anonymisées d&apos;amélioration produit.</li>
            </ul>
          </section>

          <section id="bases" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              5. Bases légales (art. 391 CdN)
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
              <li>
                <strong>Exécution du contrat</strong> : gestion de votre
                compte, traitement des locations, paiements, contrats
                numériques.
              </li>
              <li>
                <strong>Consentement</strong> : prospection marketing, cookies
                non essentiels, partage de données avec colocataires.
              </li>
              <li>
                <strong>Intérêt légitime</strong> : sécurité de la Plateforme,
                prévention de la fraude, amélioration de l&apos;expérience.
              </li>
              <li>
                <strong>Obligation légale</strong> : conservation des pièces
                d&apos;identité au titre du KYC immobilier et LBC/FT,
                justificatifs fiscaux et comptables.
              </li>
            </ul>
          </section>

          <section id="destinataires" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              6. Destinataires
            </h2>
            <p className="mt-3 text-muted-foreground">
              Vos données sont accessibles aux destinataires suivants, dans
              les limites strictes de leurs missions :
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
              <li>
                Équipes internes de PIRABEL LABS SARL (support, modération,
                ingénierie, finance) — accès cloisonné par rôle.
              </li>
              <li>
                Sous-traitants techniques liés par contrat de sous-traitance
                conforme au CdN : <strong>Vercel Inc.</strong> (hébergement
                web, USA/UE), <strong>Supabase Inc.</strong> (base de données +
                authentification, UE), <strong>FeexPay</strong>{" "}
                (paiements, Afrique), <strong>Twilio</strong> (SMS, USA),{" "}
                <strong>Resend</strong> (e-mails transactionnels, USA/UE),{" "}
                <strong>Firebase Cloud Messaging</strong> (notifications push,
                USA).
              </li>
              <li>
                Autorités compétentes (administratives, judiciaires, fiscales,
                APDP) en cas de réquisition régulière ou de signalement
                obligatoire.
              </li>
            </ul>
            <p className="mt-3 text-muted-foreground">
              PIRABEL LABS ne vend ni ne loue vos données à des tiers à des
              fins commerciales.
            </p>
          </section>

          <section id="transferts" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              7. Transferts hors Bénin / hors CEDEAO (art. 416-423 CdN)
            </h2>
            <p className="mt-3 text-muted-foreground">
              Certains de nos prestataires opèrent des datacenters situés hors
              de la zone CEDEAO, notamment en Union européenne et aux
              États-Unis. Conformément aux <strong>articles 416 à 423 du Code
              du numérique</strong>, ces transferts sont encadrés par des
              garanties contractuelles appropriées :
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
              <li>
                Clauses contractuelles types conformes aux standards
                internationaux (modèles européens adaptés).
              </li>
              <li>
                Engagement de sécurité, confidentialité et notification
                d&apos;incident par chaque sous-traitant.
              </li>
              <li>
                Notification préalable à l&apos;APDP lorsque la réglementation
                l&apos;exige.
              </li>
            </ul>
          </section>

          <section id="conservation" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              8. Durée de conservation
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
              <li>
                <strong>Compte actif</strong> : pendant toute la durée
                d&apos;utilisation, puis archivé 3 ans après la dernière
                connexion.
              </li>
              <li>
                <strong>Pièces d&apos;identité et données KYC</strong> :{" "}
                <strong>5 ans</strong> après la fin de la relation
                contractuelle (obligation LBC/FT).
              </li>
              <li>
                <strong>Contrats, paiements et justificatifs fiscaux</strong> :{" "}
                <strong>10 ans</strong> conformément aux obligations
                comptables et fiscales béninoises.
              </li>
              <li>
                <strong>Logs techniques</strong> : <strong>12 mois maximum</strong>.
              </li>
              <li>
                <strong>Cookies non essentiels</strong> : 13 mois maximum
                conformément aux recommandations APDP.
              </li>
            </ul>
          </section>

          <section id="droits" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              9. Vos droits (art. 401-411 CdN)
            </h2>
            <p className="mt-3 text-muted-foreground">
              Conformément aux articles 401 à 411 du Code du numérique, vous
              disposez à tout moment des droits suivants sur vos données
              personnelles :
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
              <li>
                <strong>Droit d&apos;accès</strong> — obtenir la confirmation
                que vos données sont traitées et en recevoir une copie.
              </li>
              <li>
                <strong>Droit de rectification</strong> — corriger des données
                inexactes ou incomplètes.
              </li>
              <li>
                <strong>Droit à l&apos;effacement</strong> («&nbsp;droit à
                l&apos;oubli&nbsp;») — sous réserve des obligations légales
                de conservation.
              </li>
              <li>
                <strong>Droit d&apos;opposition</strong> au traitement, en
                particulier à la prospection marketing.
              </li>
              <li>
                <strong>Droit à la limitation</strong> du traitement.
              </li>
              <li>
                <strong>Droit à la portabilité</strong> dans un format
                structuré, couramment utilisé et lisible par machine.
              </li>
              <li>
                <strong>Droit de retirer votre consentement</strong> à tout
                moment, sans effet rétroactif.
              </li>
              <li>
                <strong>Droit de réclamation</strong> auprès de l&apos;
                <strong>APDP</strong> (voir section 10).
              </li>
            </ul>
            <p className="mt-3 text-muted-foreground">
              Pour exercer ces droits, contactez notre DPO à{" "}
              <a
                href="mailto:immobilierkaza@gmail.com"
                className="font-medium text-kaza-blue hover:underline"
              >
                immobilierkaza@gmail.com
              </a>
              . Une réponse vous sera apportée dans un délai d&apos;un mois.
            </p>
          </section>

          <section id="apdp" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              10. APDP — votre recours
            </h2>
            <p className="mt-3 text-muted-foreground">
              L&apos;<strong>Autorité de Protection des Données Personnelles
              (APDP)</strong> est l&apos;autorité administrative indépendante
              chargée du contrôle de la protection des données au Bénin. Vous
              pouvez la saisir directement en cas de litige non résolu avec
              PIRABEL LABS :
            </p>
            <div className="mt-4 rounded-lg border border-border bg-gray-50 p-5 text-sm">
              <p className="font-semibold text-foreground">
                APDP — Autorité de Protection des Données Personnelles
              </p>
              <p className="mt-1 text-muted-foreground">
                Tour Administrative B, Boulevard Steinmetz
                <br />
                Cotonou, République du Bénin
                <br />
                <a
                  href="https://apdp.bj"
                  className="text-kaza-blue hover:underline"
                  rel="noreferrer"
                  target="_blank"
                >
                  https://apdp.bj
                </a>
              </p>
            </div>
          </section>

          <section id="securite" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              11. Sécurité
            </h2>
            <div className="mt-3 flex gap-3 rounded-lg border border-kaza-green/30 bg-kaza-green/5 p-4">
              <Lock className="mt-0.5 size-5 shrink-0 text-kaza-green" />
              <div className="space-y-2 text-sm text-foreground">
                <p>
                  PIRABEL LABS met en œuvre les mesures techniques et
                  organisationnelles suivantes :
                </p>
                <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                  <li>
                    Chiffrement en transit (<strong>TLS 1.3</strong>) sur
                    toutes les communications.
                  </li>
                  <li>
                    Chiffrement au repos (<strong>AES-256</strong>) pour les
                    pièces d&apos;identité et données sensibles.
                  </li>
                  <li>
                    Signatures <strong>HMAC</strong> sur tous les webhooks de
                    paiement (FeexPay, Twilio).
                  </li>
                  <li>
                    Accès cloisonné par rôle, authentification renforcée pour
                    les administrateurs.
                  </li>
                  <li>
                    Audit de sécurité annuel et tests d&apos;intrusion
                    périodiques.
                  </li>
                  <li>
                    Procédure documentée de notification d&apos;incident à
                    l&apos;APDP sous 72 heures conformément au CdN.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section id="cookies" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              12. Cookies
            </h2>
            <p className="mt-3 text-muted-foreground">
              L&apos;utilisation des cookies sur la Plateforme est détaillée
              dans notre{" "}
              <a
                href="/legal/cookies"
                className="font-medium text-kaza-blue hover:underline"
              >
                politique cookies
              </a>{" "}
              dédiée, conforme aux exigences de la Loi 2017-20.
            </p>
          </section>

          <section id="modifications" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              13. Modifications
            </h2>
            <p className="mt-3 text-muted-foreground">
              PIRABEL LABS se réserve la faculté de modifier la présente
              politique de confidentialité pour refléter l&apos;évolution de
              la réglementation, des services ou des bonnes pratiques. Toute
              modification substantielle fera l&apos;objet d&apos;une
              notification aux Utilisateurs au moins{" "}
              <strong>quinze (15) jours</strong> avant son entrée en vigueur.
            </p>
          </section>

          <section id="contact" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              14. Contact DPO
            </h2>
            <p className="mt-3 text-muted-foreground">
              Pour toute question, exercice de droits ou réclamation relative
              à vos données personnelles :
            </p>
            <div className="mt-4 rounded-lg border border-border bg-gray-50 p-5 text-sm">
              <p className="font-semibold text-foreground">
                Délégué à la Protection des Données — PIRABEL LABS SARL
              </p>
              <p className="mt-1 text-muted-foreground">
                Courriel :{" "}
                <a
                  href="mailto:immobilierkaza@gmail.com"
                  className="text-kaza-blue hover:underline"
                >
                  immobilierkaza@gmail.com
                </a>
                <br />
                Adresse : Quartier Cadjèhoun, Cotonou, République du Bénin
              </p>
            </div>
          </section>
        </div>

        <Separator className="my-10" />

        <footer className="text-xs text-muted-foreground">
          © 2026 Kaabo — Marque de PIRABEL LABS SARL. Une création{" "}
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
