import Link from "next/link";

const exploreLinks = [
  { href: "/search", label: "Propriétés" },
  { href: "/student-living", label: "Colocation étudiante" },
  { href: "/search?type=HOUSE", label: "Maisons" },
  { href: "/search?type=APARTMENT", label: "Appartements" },
];

const supportLinks = [
  { href: "/about", label: "Centre d'aide" },
  { href: "/about", label: "Guide propriétaire" },
  { href: "/about#safety", label: "Sécurité" },
  { href: "/about#contact", label: "Contactez-nous" },
];

const legalLinks = [
  { href: "/terms", label: "Conditions d'utilisation" },
  { href: "/privacy", label: "Politique de confidentialité" },
  { href: "/cookies", label: "Politique des cookies" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-kaza-navy text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Logo & Description */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
                <span className="text-sm font-bold text-kaza-navy">K</span>
              </div>
              <span className="font-heading text-xl font-bold">KAZA</span>
            </Link>
            <p className="text-sm text-white/70">
              La plateforme immobilière de référence en Afrique. Connectez
              propriétaires et locataires en toute confiance.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">
              Explorer
            </h3>
            <ul className="space-y-3">
              {exploreLinks.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">
              Support
            </h3>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">
              Légal
            </h3>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/20 pt-8 sm:flex-row">
          <p className="text-sm text-white/50">
            © {new Date().getFullYear()} KAZA Proptech S.A. Tous droits
            réservés.
          </p>
          <div className="flex items-center gap-4 text-sm text-white/50">
            <span>FRANÇAIS (FR)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
