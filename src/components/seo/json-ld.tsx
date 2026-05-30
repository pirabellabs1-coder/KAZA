// =============================================================================
// KAZA - JSON-LD structured data (SEO racine)
//
// Injecte deux blocs schema.org au niveau root :
//  - Organization : identite de la marque + reseaux sociaux (sameAs).
//  - WebSite      : metadonnees du site + SearchAction (sitelinks searchbox).
//
// Le JSON est serialise via JSON.stringify (echappement correct) puis injecte
// dans un <script type="application/ld+json"> — pattern standard Next.js.
// =============================================================================

interface JsonLdProps {
  baseUrl: string;
}

// Reseaux sociaux officiels (cf. footer / contact).
const SOCIAL_LINKS = [
  "https://facebook.com/kaza.africa",
  "https://instagram.com/kaza.africa",
  "https://linkedin.com/company/kaza-africa",
  "https://x.com/kaza_africa",
];

export function JsonLd({ baseUrl }: JsonLdProps) {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "KAZA",
    url: baseUrl,
    logo: `${baseUrl}/icons/icon-512.svg`,
    description:
      "La plus grande plateforme d'immobilier panafricaine. Location d'appartements, maisons et colocations partout en Afrique.",
    areaServed: "Africa",
    sameAs: SOCIAL_LINKS,
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "KAZA",
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
    </>
  );
}
