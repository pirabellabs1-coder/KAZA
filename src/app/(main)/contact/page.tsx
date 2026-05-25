import type { Metadata } from "next";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
} from "lucide-react";
import { SectionHero } from "@/components/marketing/section-hero";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact — KAZA",
  description:
    "Une question, un partenariat ou une demande presse ? L'équipe KAZA vous répond en moins de 24h. Téléphone, email et formulaire de contact.",
  openGraph: {
    title: "Contactez l'équipe KAZA",
    description:
      "Joignez l'équipe KAZA à Cotonou par téléphone, email ou via notre formulaire.",
    type: "website",
  },
};

const socialLinks = [
  { icon: Facebook, label: "Facebook", href: "https://facebook.com/kaza.africa" },
  { icon: Instagram, label: "Instagram", href: "https://instagram.com/kaza.africa" },
  { icon: Linkedin, label: "LinkedIn", href: "https://linkedin.com/company/kaza-africa" },
  { icon: Twitter, label: "X (Twitter)", href: "https://x.com/kaza_africa" },
];

const contactInfos = [
  {
    icon: MapPin,
    label: "Adresse",
    value: "Immeuble Atlantique, Cadjehoun, Cotonou, Bénin",
  },
  {
    icon: Phone,
    label: "Téléphone",
    value: "+229 01 60 00 00 00",
    href: "tel:+22901600000000",
  },
  {
    icon: Mail,
    label: "Email",
    value: "contact@kaza.africa",
    href: "mailto:contact@kaza.africa",
  },
  {
    icon: Clock,
    label: "Horaires",
    value: "Lundi – Vendredi, 9h00 – 18h00 (GMT)",
  },
];

export default function ContactPage() {
  return (
    <div>
      <SectionHero
        eyebrow="Contact"
        title="Une question ? Parlons-nous."
        subtitle="Notre équipe est basée à Cotonou et vous répond en moins de 24 heures ouvrées."
        variant="light"
      />

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12">
            {/* Left column */}
            <div className="lg:col-span-5">
              <h2 className="font-heading text-2xl font-bold text-kaza-navy">
                Nos coordonnées
              </h2>
              <p className="mt-2 text-muted-foreground">
                Plusieurs façons d&apos;entrer en contact avec nous.
              </p>

              <ul className="mt-8 space-y-6">
                {contactInfos.map((info) => {
                  const Icon = info.icon;
                  return (
                    <li key={info.label} className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-kaza-blue/10">
                        <Icon className="size-5 text-kaza-blue" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {info.label}
                        </p>
                        {info.href ? (
                          <a
                            href={info.href}
                            className="text-base font-medium text-kaza-navy hover:text-kaza-blue"
                          >
                            {info.value}
                          </a>
                        ) : (
                          <p className="text-base font-medium text-kaza-navy">
                            {info.value}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-10">
                <p className="text-sm font-medium text-muted-foreground">
                  Suivez-nous
                </p>
                <div className="mt-3 flex gap-3">
                  {socialLinks.map((s) => {
                    const Icon = s.icon;
                    return (
                      <Link
                        key={s.label}
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={s.label}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-kaza-navy transition-colors hover:border-kaza-blue hover:bg-kaza-blue hover:text-white"
                      >
                        <Icon className="size-4" />
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Map placeholder */}
              <div className="mt-10 overflow-hidden rounded-2xl border border-gray-200">
                <div className="relative aspect-[4/3] w-full bg-gradient-to-br from-kaza-blue/10 via-gray-100 to-kaza-green/10">
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-md">
                      <MapPin className="size-7 text-kaza-blue" />
                    </div>
                    <p className="mt-4 text-sm font-medium text-kaza-navy">
                      Cotonou, Bénin
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Carte interactive bientôt disponible
                    </p>
                  </div>
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(25,118,210,0.08),transparent_50%),radial-gradient(circle_at_70%_60%,rgba(76,175,80,0.08),transparent_50%)]" />
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="lg:col-span-7">
              <h2 className="font-heading text-2xl font-bold text-kaza-navy">
                Envoyez-nous un message
              </h2>
              <p className="mt-2 mb-6 text-muted-foreground">
                Remplissez ce formulaire, nous reviendrons vers vous très vite.
              </p>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
