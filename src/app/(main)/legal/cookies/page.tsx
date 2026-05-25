import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique cookies",
  description:
    "Liste détaillée des cookies utilisés par KAZA et comment les gérer.",
};

const COOKIES = [
  {
    category: "Essentiels",
    note: "Indispensables au fonctionnement de la plateforme. Non désactivables.",
    items: [
      {
        name: "sb-access-token / sb-refresh-token",
        provider: "Supabase",
        purpose: "Maintien de votre session connectée.",
        duration: "Session + 1 an",
      },
      {
        name: "kaza-role",
        provider: "KAZA",
        purpose: "Cache court de votre rôle pour accélérer le routage.",
        duration: "5 minutes",
      },
      {
        name: "kaza-cookie-consent",
        provider: "KAZA",
        purpose: "Mémorise votre choix concernant les cookies.",
        duration: "12 mois",
      },
      {
        name: "kaza-locale",
        provider: "KAZA",
        purpose: "Mémorise votre langue d'affichage.",
        duration: "12 mois",
      },
    ],
  },
  {
    category: "Mesure d'audience anonyme",
    note: "Activés uniquement avec votre consentement. Anonymisés.",
    items: [
      {
        name: "plausible",
        provider: "Plausible Analytics",
        purpose: "Statistiques de fréquentation agrégées (pas de tracking individuel).",
        duration: "Non persistant (sans cookie navigateur)",
      },
    ],
  },
  {
    category: "Marketing",
    note: "Activés uniquement avec votre consentement.",
    items: [
      {
        name: "À venir",
        provider: "—",
        purpose: "Aucun cookie marketing déployé à ce jour.",
        duration: "—",
      },
    ],
  },
];

export default function CookiesPage() {
  return (
    <article className="space-y-6">
      <header>
        <h1 className="font-heading text-3xl font-bold">Politique cookies</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          En vigueur au 25 mai 2026.
        </p>
      </header>

      <p>
        Un cookie est un petit fichier déposé sur votre terminal lors de votre
        visite. Cette page liste tous les cookies utilisés par KAZA et leur
        finalité. Vous pouvez à tout moment modifier vos préférences via le
        bandeau d&apos;information ou en supprimant les cookies depuis votre
        navigateur.
      </p>

      {COOKIES.map((group) => (
        <section key={group.category} className="space-y-3">
          <div>
            <h2 className="font-heading text-xl font-semibold">
              {group.category}
            </h2>
            <p className="text-sm text-muted-foreground">{group.note}</p>
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Nom</th>
                  <th className="px-3 py-2">Fournisseur</th>
                  <th className="px-3 py-2">Finalité</th>
                  <th className="px-3 py-2">Durée</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {group.items.map((cookie) => (
                  <tr key={cookie.name + cookie.provider}>
                    <td className="px-3 py-2 font-medium">{cookie.name}</td>
                    <td className="px-3 py-2">{cookie.provider}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {cookie.purpose}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {cookie.duration}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <section className="rounded-lg border bg-muted/30 p-4">
        <h2 className="font-heading text-base font-semibold">
          Gérer vos préférences
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pour revoir votre consentement, supprimez le cookie{" "}
          <code>kaza-cookie-consent</code> depuis votre navigateur — le bandeau
          réapparaîtra à votre prochaine visite. Un centre de préférences
          détaillé sera disponible dans une future version.
        </p>
      </section>

      <p className="text-sm text-muted-foreground">
        Voir aussi notre{" "}
        <a href="/legal/confidentialite" className="text-kaza-blue hover:underline">
          politique de confidentialité
        </a>
        .
      </p>
    </article>
  );
}
