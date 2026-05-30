import type { Metadata } from "next";
import { Cookie } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LegalToc } from "@/components/marketing/legal-toc";

export const metadata: Metadata = {
  title: "Politique cookies — KAZA",
  description:
    "Liste détaillée des cookies utilisés par KAZA et modalités de gestion du consentement selon la Loi n° 2017-20 du Bénin.",
  openGraph: {
    title: "Politique cookies — KAZA",
    description:
      "Cookies utilisés sur KAZA : essentiels, mesure d'audience, marketing. Comment révoquer votre consentement.",
    type: "article",
  },
};

const sections = [
  { id: "introduction", label: "1. Introduction" },
  { id: "cadre-legal", label: "2. Cadre légal" },
  { id: "essentiels", label: "3. Cookies essentiels" },
  { id: "audience", label: "4. Mesure d'audience" },
  { id: "marketing", label: "5. Marketing" },
  { id: "preferences", label: "6. Vos préférences" },
  { id: "recours", label: "7. Contact & recours" },
];

type CookieItem = {
  name: string;
  provider: string;
  purpose: string;
  duration: string;
  basis: string;
};

type CookieGroup = {
  id: string;
  category: string;
  note: string;
  items: CookieItem[];
};

const COOKIES: CookieGroup[] = [
  {
    id: "essentiels",
    category: "Essentiels",
    note: "Indispensables au fonctionnement de la plateforme. Non désactivables — aucun consentement requis selon l'article 391 du Code du numérique.",
    items: [
      {
        name: "sb-access-token / sb-refresh-token",
        provider: "Supabase",
        purpose: "Maintien de votre session connectée.",
        duration: "Session + 1 an",
        basis: "Exécution du contrat",
      },
      {
        name: "kaza-role",
        provider: "KAZA / PIRABEL LABS",
        purpose: "Cache court de votre rôle pour accélérer le routage.",
        duration: "5 minutes",
        basis: "Intérêt légitime",
      },
      {
        name: "kaza-cookie-consent",
        provider: "KAZA / PIRABEL LABS",
        purpose: "Mémorise votre choix concernant les cookies.",
        duration: "12 mois",
        basis: "Obligation légale (Loi 2017-20)",
      },
      {
        name: "kaza-locale",
        provider: "KAZA / PIRABEL LABS",
        purpose: "Mémorise votre langue d'affichage.",
        duration: "12 mois",
        basis: "Exécution du contrat",
      },
    ],
  },
  {
    id: "audience",
    category: "Mesure d'audience anonyme",
    note: "Activés uniquement avec votre consentement explicite. Données agrégées et anonymisées.",
    items: [
      {
        name: "plausible",
        provider: "Plausible Analytics (UE)",
        purpose:
          "Statistiques de fréquentation agrégées (pas de tracking individuel, pas de profilage).",
        duration: "Non persistant (sans cookie navigateur)",
        basis: "Consentement",
      },
    ],
  },
  {
    id: "marketing",
    category: "Marketing",
    note: "Activés uniquement avec votre consentement explicite et révocable à tout moment.",
    items: [
      {
        name: "À venir",
        provider: "—",
        purpose: "Aucun cookie marketing déployé à ce jour.",
        duration: "—",
        basis: "Consentement",
      },
    ],
  },
];

export default function CookiesPage() {
  return (
    <>
      <LegalToc items={sections} />

      <article className="w-full max-w-3xl">
        <header className="mb-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-kaza-blue/30 text-kaza-blue">
              Politique cookies
            </Badge>
            <Badge variant="secondary">Loi 2017-20 Bénin</Badge>
          </div>
          <h1 className="font-heading text-3xl font-bold text-kaza-navy sm:text-4xl">
            Politique cookies
          </h1>
          <p className="mt-3 text-muted-foreground">
            En vigueur à compter du 27 mai 2026.
          </p>
        </header>

        <aside className="mb-10 flex gap-3 rounded-lg border border-kaza-blue/20 bg-kaza-blue/5 p-4 text-sm">
          <Cookie className="mt-0.5 size-5 shrink-0 text-kaza-blue" />
          <p className="text-foreground">
            <strong>Édité par PIRABEL LABS SARL</strong> — Document conforme au
            droit béninois. Contact DPO :{" "}
            <a
              href="mailto:immobilierkaza@gmail.com"
              className="font-medium text-kaza-blue hover:underline"
            >
              immobilierkaza@gmail.com
            </a>
            .
          </p>
        </aside>

        <div className="space-y-12 text-foreground">
          <section id="introduction" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              1. Introduction
            </h2>
            <p className="mt-3 text-muted-foreground">
              Un cookie est un petit fichier déposé sur votre terminal
              (ordinateur, smartphone, tablette) lors de votre visite sur la
              plateforme KAZA. Il permet à PIRABEL LABS SARL, éditeur de KAZA,
              ou à ses partenaires, de reconnaître votre terminal, de
              mémoriser certaines informations et de mesurer l&apos;audience
              du site.
            </p>
            <p className="mt-3 text-muted-foreground">
              La présente politique liste les cookies utilisés par KAZA et
              décrit comment vous pouvez exercer vos choix.
            </p>
          </section>

          <section id="cadre-legal" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              2. Cadre légal
            </h2>
            <p className="mt-3 text-muted-foreground">
              Conformément à la <strong>Loi n° 2017-20 du 20 avril 2018
              portant Code du numérique en République du Bénin</strong>, le
              dépôt et la lecture de cookies non strictement nécessaires au
              fonctionnement du service requièrent votre <strong>consentement
              préalable, libre, éclairé, spécifique et univoque</strong>.
            </p>
            <p className="mt-3 text-muted-foreground">
              Vous pouvez retirer votre consentement à tout moment, avec la
              même simplicité qu&apos;il a été donné. Le refus de cookies non
              essentiels n&apos;a aucune conséquence sur l&apos;accès aux
              fonctionnalités principales de la plateforme.
            </p>
          </section>

          {COOKIES.map((group) => (
            <section key={group.id} id={group.id} className="scroll-mt-28">
              <h2 className="font-heading text-2xl font-bold text-kaza-navy">
                {group.id === "essentiels"
                  ? "3. Cookies essentiels"
                  : group.id === "audience"
                  ? "4. Mesure d'audience anonyme"
                  : "5. Marketing"}
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">{group.note}</p>
              <div className="mt-4 overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Nom</th>
                      <th className="px-3 py-2">Fournisseur</th>
                      <th className="px-3 py-2">Finalité</th>
                      <th className="px-3 py-2">Durée</th>
                      <th className="px-3 py-2">Base légale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {group.items.map((cookie) => (
                      <tr key={cookie.name + cookie.provider}>
                        <td className="px-3 py-2 font-medium text-foreground">
                          {cookie.name}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {cookie.provider}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {cookie.purpose}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {cookie.duration}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {cookie.basis}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}

          <section id="preferences" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              6. Vos préférences
            </h2>
            <p className="mt-3 text-muted-foreground">
              Vous pouvez à tout moment modifier ou révoquer votre consentement
              aux cookies non essentiels selon plusieurs méthodes :
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
              <li>
                <strong>Bandeau de consentement</strong> : modifiez vos choix
                via le bandeau qui apparaît lors de votre visite.
              </li>
              <li>
                <strong>Suppression manuelle</strong> : supprimez le cookie{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  kaza-cookie-consent
                </code>{" "}
                depuis votre navigateur — le bandeau réapparaîtra à votre
                prochaine visite.
              </li>
              <li>
                <strong>Paramètres navigateur</strong> : tous les navigateurs
                modernes (Chrome, Firefox, Safari, Edge) permettent de bloquer
                ou supprimer les cookies tiers depuis les paramètres de
                confidentialité.
              </li>
              <li>
                <strong>Centre de préférences détaillé</strong> : un centre de
                préférences granulaire sera disponible dans une future version.
              </li>
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">
              Note : la désactivation des cookies essentiels peut empêcher le
              fonctionnement de certaines fonctionnalités (connexion,
              paiement).
            </p>
          </section>

          <section id="recours" className="scroll-mt-28">
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              7. Contact &amp; recours
            </h2>
            <p className="mt-3 text-muted-foreground">
              Pour toute question relative aux cookies ou à vos données
              personnelles :
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-gray-50 p-5 text-sm">
                <p className="font-semibold text-foreground">DPO PIRABEL LABS</p>
                <p className="mt-1 text-muted-foreground">
                  <a
                    href="mailto:immobilierkaza@gmail.com"
                    className="text-kaza-blue hover:underline"
                  >
                    immobilierkaza@gmail.com
                  </a>
                </p>
              </div>
              <div className="rounded-lg border border-border bg-gray-50 p-5 text-sm">
                <p className="font-semibold text-foreground">APDP — autorité</p>
                <p className="mt-1 text-muted-foreground">
                  Tour Administrative B
                  <br />
                  Boulevard Steinmetz, Cotonou
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
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Voir aussi notre{" "}
              <a
                href="/legal/confidentialite"
                className="font-medium text-kaza-blue hover:underline"
              >
                politique de confidentialité
              </a>
              .
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
