import type { Metadata } from "next";
import Link from "next/link";
import { Building2, ShieldCheck, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LegalToc } from "@/components/marketing/legal-toc";

export const metadata: Metadata = {
  title: "Mentions légales — Kaabo",
  description:
    "Mentions légales de Kaabo : éditeur PIRABEL LABS SARL, hébergeurs, propriété intellectuelle et coordonnées juridiques selon le droit béninois et OHADA.",
  openGraph: {
    title: "Mentions légales — Kaabo",
    description:
      "Informations légales relatives à PIRABEL LABS SARL, éditeur de la plateforme Kaabo, selon le droit béninois et l'OHADA.",
    type: "article",
  },
};

const sections = [
  { id: "editeur", label: "1. Éditeur du site" },
  { id: "marque", label: "2. Marque Kaabo" },
  { id: "publication", label: "3. Directeur de la publication" },
  { id: "hebergement", label: "4. Hébergement" },
  { id: "pi", label: "5. Propriété intellectuelle" },
  { id: "credits", label: "6. Crédits & contributions" },
  { id: "contact", label: "7. Contact" },
  { id: "loi", label: "8. Loi applicable" },
  { id: "mediation", label: "9. Médiation" },
];

export default function MentionsLegalesPage() {
  return (
    <>
      <LegalToc items={sections} />

      <article className="w-full max-w-3xl">
        <header className="mb-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-kaza-blue/30 text-kaza-blue">
              Document juridique
            </Badge>
            <Badge variant="secondary">Droit béninois + OHADA</Badge>
          </div>
          <h1 className="font-heading text-3xl font-bold text-kaza-navy sm:text-4xl">
            Mentions légales
          </h1>
          <p className="mt-3 text-muted-foreground">
            Informations relatives à l&apos;éditeur, à l&apos;hébergeur et au
            régime juridique applicable à la plateforme Kaabo.
          </p>
        </header>

        <aside className="mb-10 rounded-lg border border-kaza-blue/20 bg-kaza-blue/5 p-4 text-sm">
          <p className="text-foreground">
            <strong>Édité par PIRABEL LABS SARL</strong> — Document conforme au
            droit béninois et aux actes uniformes de l&apos;OHADA. Contact
            juridique :{" "}
            <a
              href="mailto:immobilierkaza@gmail.com"
              className="font-medium text-kaza-blue hover:underline"
            >
              immobilierkaza@gmail.com
            </a>
          </p>
        </aside>

        <div className="space-y-12 text-foreground">
          <section id="editeur" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              1. Éditeur du site
            </h2>
            <p className="mt-3 text-muted-foreground">
              La plateforme Kaabo, accessible à l&apos;adresse{" "}
              <span className="font-medium">https://kaza.africa</span>, est
              éditée et exploitée exclusivement par la société :
            </p>
            <dl className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-border bg-gray-50 p-5 text-sm sm:grid-cols-[200px_1fr]">
              <dt className="font-medium text-foreground">Raison sociale</dt>
              <dd className="text-muted-foreground">PIRABEL LABS SARL</dd>
              <dt className="font-medium text-foreground">Forme juridique</dt>
              <dd className="text-muted-foreground">
                Société à responsabilité limitée (SARL) de droit béninois
              </dd>
              <dt className="font-medium text-foreground">Capital social</dt>
              <dd className="text-muted-foreground">1 000 000 FCFA</dd>
              <dt className="font-medium text-foreground">Siège social</dt>
              <dd className="text-muted-foreground">
                Quartier Cadjèhoun
                <br />
                Cotonou, République du Bénin
              </dd>
              <dt className="font-medium text-foreground">RCCM</dt>
              <dd className="text-muted-foreground">
                En cours d&apos;immatriculation
              </dd>
              <dt className="font-medium text-foreground">IFU</dt>
              <dd className="text-muted-foreground">
                Communiqué sur demande
              </dd>
              <dt className="font-medium text-foreground">Site institutionnel</dt>
              <dd className="text-muted-foreground">
                <a
                  href="https://pirabellabs.com"
                  className="text-kaza-blue hover:underline"
                  rel="noreferrer"
                  target="_blank"
                >
                  https://pirabellabs.com
                </a>
              </dd>
              <dt className="font-medium text-foreground">Courriel</dt>
              <dd className="text-muted-foreground">
                <a
                  href="mailto:immobilierkaza@gmail.com"
                  className="text-kaza-blue hover:underline"
                >
                  immobilierkaza@gmail.com
                </a>
              </dd>
              <dt className="font-medium text-foreground">Marque exploitée</dt>
              <dd className="text-muted-foreground">
                Kaabo — Plateforme Proptech
              </dd>
            </dl>
          </section>

          <section id="marque" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              2. Marque Kaabo
            </h2>
            <div className="mt-4 rounded-lg border border-kaza-green/30 bg-kaza-green/5 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-kaza-green" />
                <div className="space-y-3 text-sm text-foreground">
                  <p>
                    <strong>Kaabo</strong> est une marque de{" "}
                    <strong>PIRABEL LABS SARL</strong> auprès de l&apos;OAPI
                    (Organisation Africaine de la Propriété Intellectuelle)
                    conformément à l&apos;Accord de Bangui révisé de 2015.
                  </p>
                  <p className="text-muted-foreground">
                    Kaabo est une plateforme Proptech éditée et exploitée
                    exclusivement par PIRABEL LABS SARL. Toute reproduction,
                    représentation ou utilisation de la marque Kaabo sans
                    autorisation écrite préalable est strictement interdite et
                    constitue une contrefaçon au sens des dispositions de
                    l&apos;Annexe III de l&apos;Accord de Bangui révisé.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section id="publication" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              3. Directeur de la publication
            </h2>
            <p className="mt-3 text-muted-foreground">
              Le directeur de la publication est <strong>Le Gérant</strong> de
              PIRABEL LABS SARL, joignable à l&apos;adresse{" "}
              <a
                href="mailto:immobilierkaza@gmail.com"
                className="font-medium text-kaza-blue hover:underline"
              >
                immobilierkaza@gmail.com
              </a>
              .
            </p>
            <p className="mt-3 text-muted-foreground">
              Conformément aux dispositions du Code du numérique au Bénin (Loi
              n° 2017-20 du 20 avril 2018), le directeur de la publication est
              responsable des contenus éditoriaux diffusés sur la plateforme.
            </p>
          </section>

          <section id="hebergement" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              4. Hébergement
            </h2>
            <p className="mt-3 text-muted-foreground">
              L&apos;application web et les services techniques de Kaabo sont
              hébergés par les prestataires suivants, dont les datacenters sont
              situés en Union européenne et aux États-Unis :
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border p-5">
                <div className="flex items-center gap-2">
                  <Globe className="size-4 text-kaza-blue" />
                  <p className="font-semibold text-foreground">Vercel Inc.</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  340 S Lemon Ave #4133
                  <br />
                  Walnut, CA 91789, États-Unis
                  <br />
                  <a
                    href="https://vercel.com"
                    className="text-kaza-blue hover:underline"
                    rel="noreferrer"
                    target="_blank"
                  >
                    vercel.com
                  </a>
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Hébergement de l&apos;application web et de l&apos;API
                  publique (datacenters UE/USA).
                </p>
              </div>
              <div className="rounded-lg border border-border p-5">
                <div className="flex items-center gap-2">
                  <Globe className="size-4 text-kaza-blue" />
                  <p className="font-semibold text-foreground">Supabase Inc.</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  970 Toa Payoh North #07-04
                  <br />
                  Singapour 318992
                  <br />
                  <a
                    href="https://supabase.com"
                    className="text-kaza-blue hover:underline"
                    rel="noreferrer"
                    target="_blank"
                  >
                    supabase.com
                  </a>
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Base de données PostgreSQL, authentification, stockage des
                  fichiers et fonctions edge (datacenters UE).
                </p>
              </div>
            </div>
          </section>

          <section id="pi" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              5. Propriété intellectuelle
            </h2>
            <p className="mt-3 text-muted-foreground">
              L&apos;ensemble des éléments composant la plateforme Kaabo — sans
              que cette énumération soit limitative : marques, dénominations,
              logos, identité visuelle, charte graphique, textes, photographies,
              illustrations, vidéos, sons, interfaces, code source, bases de
              données, algorithmes — est la propriété exclusive de PIRABEL LABS
              SARL ou de ses partenaires dûment autorisés.
            </p>
            <p className="mt-3 text-muted-foreground">
              Ces éléments sont protégés par les dispositions de l&apos;
              <strong>
                Accord de Bangui révisé de 2015 (Annexe VII relative au droit
                d&apos;auteur et aux droits voisins)
              </strong>
              , administré par l&apos;OAPI, ainsi que par les conventions
              internationales applicables.
            </p>
            <p className="mt-3 text-muted-foreground">
              Toute reproduction, représentation, modification, publication,
              transmission, dénaturation, totale ou partielle de la plateforme
              ou de ses contenus, par quelque procédé que ce soit et sur quelque
              support que ce soit, est interdite sans l&apos;autorisation
              expresse et préalable de PIRABEL LABS SARL.
            </p>
          </section>

          <section id="credits" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              6. Crédits & contributions
            </h2>
            <p className="mt-3 text-muted-foreground">
              La plateforme Kaabo a été conçue, développée et est maintenue par
              les équipes Produit, Design, Ingénierie et Trust &amp; Safety de
              PIRABEL LABS SARL. Elle s&apos;appuie sur des bibliothèques open
              source dont la liste détaillée est disponible sur demande.
            </p>
            <p className="mt-3 text-muted-foreground">
              Crédits photographiques et illustrations : équipe Design Kaabo,
              partenaires propriétaires (visuels d&apos;annonces) et
              bibliothèques sous licence libre.
            </p>
          </section>

          <section id="contact" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              7. Contact
            </h2>
            <p className="mt-3 text-muted-foreground">
              Pour toute demande relative à ces mentions ou à la plateforme,
              vous pouvez consulter notre{" "}
              <Link
                href="/contact"
                className="font-medium text-kaza-blue hover:underline"
              >
                page contact
              </Link>{" "}
              ou écrire à l&apos;un des contacts dédiés :
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <Building2 className="mr-2 inline size-4 text-kaza-blue" />
                <strong className="text-foreground">Support général :</strong>{" "}
                <a
                  href="mailto:immobilierkaza@gmail.com"
                  className="text-kaza-blue hover:underline"
                >
                  immobilierkaza@gmail.com
                </a>
              </li>
              <li>
                <Building2 className="mr-2 inline size-4 text-kaza-blue" />
                <strong className="text-foreground">Aide utilisateur :</strong>{" "}
                <a
                  href="mailto:immobilierkaza@gmail.com"
                  className="text-kaza-blue hover:underline"
                >
                  immobilierkaza@gmail.com
                </a>
              </li>
              <li>
                <Building2 className="mr-2 inline size-4 text-kaza-blue" />
                <strong className="text-foreground">
                  Données personnelles (DPO) :
                </strong>{" "}
                <a
                  href="mailto:immobilierkaza@gmail.com"
                  className="text-kaza-blue hover:underline"
                >
                  immobilierkaza@gmail.com
                </a>
              </li>
              <li>
                <Building2 className="mr-2 inline size-4 text-kaza-blue" />
                <strong className="text-foreground">Juridique :</strong>{" "}
                <a
                  href="mailto:immobilierkaza@gmail.com"
                  className="text-kaza-blue hover:underline"
                >
                  immobilierkaza@gmail.com
                </a>
              </li>
            </ul>
          </section>

          <section id="loi" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              8. Loi applicable
            </h2>
            <p className="mt-3 text-muted-foreground">
              Les présentes mentions légales sont régies par le droit béninois
              et, en tant que de besoin, par les{" "}
              <strong>
                actes uniformes de l&apos;Organisation pour l&apos;Harmonisation
                en Afrique du Droit des Affaires (OHADA)
              </strong>
              , notamment l&apos;Acte uniforme portant sur le droit commercial
              général.
            </p>
            <p className="mt-3 text-muted-foreground">
              Tout litige relatif à leur interprétation ou à leur exécution
              relèvera, à défaut de règlement amiable, de la compétence
              exclusive du <strong>Tribunal de Commerce de Cotonou</strong> et,
              en appel, de la <strong>Cour d&apos;Appel de Cotonou</strong>.
            </p>
          </section>

          <section id="mediation" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              9. Médiation
            </h2>
            <p className="mt-3 text-muted-foreground">
              Conformément à la réglementation béninoise relative à la
              protection du consommateur, les utilisateurs ont la possibilité de
              recourir gratuitement au service de médiation institutionnel
              suivant en cas de litige non résolu amiablement avec Kaabo :
            </p>
            <div className="mt-4 rounded-lg border border-border bg-gray-50 p-5 text-sm">
              <p className="font-semibold text-foreground">
                Médiateur de la consommation
              </p>
              <p className="mt-1 text-muted-foreground">
                Direction Générale du Commerce Intérieur du Bénin
                <br />
                Ministère de l&apos;Industrie et du Commerce
                <br />
                Cotonou, République du Bénin
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
