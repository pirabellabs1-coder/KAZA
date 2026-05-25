import type { Metadata } from "next";
import Link from "next/link";
import { LegalToc } from "@/components/marketing/legal-toc";

export const metadata: Metadata = {
  title: "Mentions légales — KAZA",
  description:
    "Mentions légales de KAZA : éditeur, hébergeur, directeur de publication et contact pour la plateforme immobilière KAZA.",
  openGraph: {
    title: "Mentions légales — KAZA",
    description:
      "Informations légales relatives à la société éditrice de la plateforme KAZA.",
    type: "article",
  },
};

const sections = [
  { id: "editeur", label: "1. Éditeur" },
  { id: "hebergement", label: "2. Hébergement" },
  { id: "publication", label: "3. Directeur de publication" },
  { id: "contact", label: "4. Contact" },
];

export default function MentionsLegalesPage() {
  return (
    <>
      <LegalToc items={sections} />

      <article className="w-full max-w-3xl">
        <header className="mb-8">
          <p className="mb-2 text-xs font-semibold tracking-widest uppercase text-kaza-blue">
            Document juridique
          </p>
          <h1 className="font-heading text-3xl font-bold text-kaza-navy sm:text-4xl">
            Mentions légales
          </h1>
          <p className="mt-3 text-muted-foreground">
            Informations relatives à l&apos;éditeur et à l&apos;hébergeur de la
            plateforme KAZA.
          </p>
        </header>

        <div className="space-y-12 text-foreground">
          <section id="editeur" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              1. Éditeur du site
            </h2>
            <dl className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-border bg-gray-50 p-5 text-sm sm:grid-cols-[180px_1fr]">
              <dt className="font-medium text-foreground">Raison sociale</dt>
              <dd className="text-muted-foreground">KAZA SARL</dd>
              <dt className="font-medium text-foreground">Forme juridique</dt>
              <dd className="text-muted-foreground">
                Société à responsabilité limitée de droit béninois
              </dd>
              <dt className="font-medium text-foreground">Capital social</dt>
              <dd className="text-muted-foreground">
                10 000 000 FCFA <em>(montant à confirmer)</em>
              </dd>
              <dt className="font-medium text-foreground">Siège social</dt>
              <dd className="text-muted-foreground">
                Lot 1234, Quartier Cadjèhoun, Cotonou, République du Bénin
              </dd>
              <dt className="font-medium text-foreground">RCCM</dt>
              <dd className="text-muted-foreground">
                RB / COT / 26 B / XXXXX <em>(en cours d&apos;immatriculation)</em>
              </dd>
              <dt className="font-medium text-foreground">IFU</dt>
              <dd className="text-muted-foreground">
                XXXXXXXXXXXX <em>(à confirmer)</em>
              </dd>
              <dt className="font-medium text-foreground">Gérant</dt>
              <dd className="text-muted-foreground">M. / Mme [Nom du gérant]</dd>
              <dt className="font-medium text-foreground">Téléphone</dt>
              <dd className="text-muted-foreground">+229 01 90 00 00 00</dd>
              <dt className="font-medium text-foreground">Courriel</dt>
              <dd className="text-muted-foreground">
                <a
                  href="mailto:contact@kaza.africa"
                  className="text-kaza-blue hover:underline"
                >
                  contact@kaza.africa
                </a>
              </dd>
            </dl>
          </section>

          <section id="hebergement" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              2. Hébergement
            </h2>
            <p className="mt-3 text-muted-foreground">
              L&apos;application web KAZA est hébergée par&nbsp;:
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border p-5">
                <p className="font-semibold text-foreground">Vercel Inc.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  340 S Lemon Ave #4133
                  <br />
                  Walnut, CA 91789, États-Unis
                  <br />
                  <a
                    href="https://vercel.com"
                    className="text-kaza-blue hover:underline"
                    rel="noreferrer"
                  >
                    vercel.com
                  </a>
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Hébergement de l&apos;application web et de l&apos;API
                  publique.
                </p>
              </div>
              <div className="rounded-lg border border-border p-5">
                <p className="font-semibold text-foreground">
                  Supabase Inc.
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  970 Toa Payoh North #07-04
                  <br />
                  Singapour 318992
                  <br />
                  <a
                    href="https://supabase.com"
                    className="text-kaza-blue hover:underline"
                    rel="noreferrer"
                  >
                    supabase.com
                  </a>
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Base de données PostgreSQL, authentification, stockage des
                  fichiers et fonctions edge.
                </p>
              </div>
            </div>
          </section>

          <section id="publication" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              3. Directeur de la publication
            </h2>
            <p className="mt-3 text-muted-foreground">
              Le directeur de la publication est le/la gérant(e) de KAZA SARL,
              joignable à l&apos;adresse{" "}
              <a
                href="mailto:publication@kaza.africa"
                className="font-medium text-kaza-blue hover:underline"
              >
                publication@kaza.africa
              </a>
              .
            </p>
          </section>

          <section id="contact" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              4. Contact
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
              ou écrire à{" "}
              <a
                href="mailto:contact@kaza.africa"
                className="font-medium text-kaza-blue hover:underline"
              >
                contact@kaza.africa
              </a>
              .
            </p>
          </section>
        </div>
      </article>
    </>
  );
}
