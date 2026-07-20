import Link from "next/link";
import {
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Twitter,
} from "lucide-react";

import { CountryFlag } from "@/components/shared/country-flag";
import { InlineNewsletter } from "@/components/marketing/inline-newsletter";

const exploreLinks = [
  { href: "/properties", label: "Propriétés" },
  { href: "/student-living", label: "Colocation étudiante" },
  { href: "/maisons", label: "Maisons" },
  { href: "/appartements", label: "Appartements" },
  { href: "/search?type=STUDIO", label: "Studios" },
  { href: "/search?type=VILLA", label: "Villas" },
  { href: "/properties/compare", label: "Comparateur de biens" },
  { href: "/neighborhoods/compare", label: "Comparateur de quartiers" },
];

const supportLinks = [
  { href: "/help", label: "Centre d'aide" },
  { href: "/guide-proprietaire", label: "Guide propriétaire" },
  { href: "/securite", label: "Sécurité" },
  { href: "/contact", label: "Contactez-nous" },
  { href: "/status", label: "Statut plateforme" },
  { href: "/faq", label: "FAQ" },
];

const companyLinks = [
  { href: "/about", label: "À propos" },
  { href: "/pro", label: "Kaabo Pro (B2B)" },
  { href: "/plus", label: "Kaabo Plus Premium" },
  { href: "/carrieres", label: "Carrières" },
  { href: "/blog", label: "Blog" },
  { href: "/partners", label: "Partenaires" },
];

const legalLinks = [
  { href: "/legal/cgu", label: "Conditions d'utilisation" },
  { href: "/legal/confidentialite", label: "Politique de confidentialité" },
  { href: "/legal/cookies", label: "Politique des cookies" },
  { href: "/legal/mentions-legales", label: "Mentions légales" },
];

const socialLinks = [
  { href: "https://facebook.com/kaza.africa", icon: Facebook, label: "Facebook" },
  { href: "https://instagram.com/kaza.africa", icon: Instagram, label: "Instagram" },
  { href: "https://linkedin.com/company/kaza-africa", icon: Linkedin, label: "LinkedIn" },
  { href: "https://twitter.com/kaza_africa", icon: Twitter, label: "X (Twitter)" },
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-kaza-navy text-white">
      {/* Bandeau Newsletter */}
      <section className="border-b border-white/10 bg-gradient-to-r from-kaza-navy via-[#0F2A40] to-kaza-navy">
        <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <h3 className="font-heading text-2xl font-bold sm:text-3xl">
                Restez informé des nouveautés Kaabo
              </h3>
              <p className="mt-2 text-sm text-white/70 sm:text-base">
                Annonces premium, analyses du marché, conseils pratiques. Une
                newsletter par mois, zéro spam.
              </p>
            </div>
            <InlineNewsletter source="footer" theme="dark" />
          </div>
        </div>
      </section>

      {/* Sections de liens */}
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Marque Kaabo (col 1) */}
          <div className="space-y-5 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
                <span className="font-bold text-kaza-navy">K</span>
              </div>
              <span className="font-heading text-2xl font-bold">Kaabo</span>
            </Link>
            <p className="text-sm leading-relaxed text-white/70">
              La plateforme immobilière de référence en Afrique de l&apos;Ouest.
              Connectez propriétaires, locataires et étudiants en toute
              confiance.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs">
              <CountryFlag code="BJ" className="h-3 w-4" />
              <span className="font-medium">Made in Bénin</span>
            </div>
            <div className="flex items-center gap-3">
              {socialLinks.map((s) => (
                <a
                  key={s.href}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/5 transition hover:border-kaza-green hover:bg-kaza-green hover:text-white"
                >
                  <s.icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Explorer */}
          <div>
            <h3 className="mb-5 text-xs font-bold uppercase tracking-widest text-white/90">
              Explorer
            </h3>
            <ul className="space-y-3">
              {exploreLinks.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 transition-colors hover:text-kaza-green"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-5 text-xs font-bold uppercase tracking-widest text-white/90">
              Support
            </h3>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 transition-colors hover:text-kaza-green"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Entreprise */}
          <div>
            <h3 className="mb-5 text-xs font-bold uppercase tracking-widest text-white/90">
              Entreprise
            </h3>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 transition-colors hover:text-kaza-green"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h3 className="mb-5 text-xs font-bold uppercase tracking-widest text-white/90">
              Légal
            </h3>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 transition-colors hover:text-kaza-green"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-2 text-xs text-white/60">
              <a
                href="mailto:immobilierkaza@gmail.com"
                className="flex items-center gap-2 transition-colors hover:text-kaza-green"
              >
                <Mail className="size-3.5" />
                immobilierkaza@gmail.com
              </a>
              <a
                href="mailto:immobilierkaza@gmail.com"
                className="flex items-center gap-2 transition-colors hover:text-kaza-green"
              >
                <Mail className="size-3.5" />
                immobilierkaza@gmail.com
              </a>
              <p className="flex items-center gap-2">
                <MapPin className="size-3.5" />
                Cotonou, Bénin
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bandeau bottom — PIRABEL LABS */}
      <div className="border-t border-white/10 bg-[#0F2A40]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 text-xs text-white/60 sm:flex-row lg:px-8">
          <p className="text-center sm:text-left">
            © 2026 <span className="font-semibold text-white/80">Kaabo</span> —
            Marque de PIRABEL LABS SARL. Une création{" "}
            <a
              href="https://pirabellabs.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-kaza-green underline-offset-4 transition hover:underline"
            >
              PIRABEL LABS
            </a>
            , agence web & Proptech béninoise.
          </p>
          <div className="flex items-center gap-4">
            <span className="hidden items-center gap-1.5 sm:inline-flex">
              <CountryFlag code="BJ" className="h-2.5 w-3.5" /> Édité depuis Cotonou
            </span>
            <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 font-medium">
              FRANÇAIS (FR)
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
