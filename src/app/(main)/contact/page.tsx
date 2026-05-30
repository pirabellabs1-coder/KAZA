import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Mail,
  Clock,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Newspaper,
  Building2,
  Sparkles,
  CheckCircle2,
  HeartHandshake,
  Globe2,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RevealOnScroll } from "@/components/shared/reveal-on-scroll";
import { FadeIn } from "@/components/shared/fade-in";
import { GlassPanel } from "@/components/shared/glass-panel";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact — KAZA",
  description:
    "Une question, un partenariat ou une demande presse ? L'équipe KAZA vous répond en moins de 24h. Téléphone, email et formulaire de contact.",
  openGraph: {
    title: "Contactez l'équipe KAZA",
    description:
      "Joignez l'équipe KAZA par email ou via notre formulaire de contact.",
    type: "website",
  },
};

const socialLinks = [
  {
    icon: Facebook,
    label: "Facebook",
    href: "https://facebook.com/kaza.africa",
    bg: "bg-[#1877F2]/10 hover:bg-[#1877F2]",
    color: "text-[#1877F2] hover:text-white",
  },
  {
    icon: Instagram,
    label: "Instagram",
    href: "https://instagram.com/kaza.africa",
    bg: "bg-[#E4405F]/10 hover:bg-[#E4405F]",
    color: "text-[#E4405F] hover:text-white",
  },
  {
    icon: Linkedin,
    label: "LinkedIn",
    href: "https://linkedin.com/company/kaza-africa",
    bg: "bg-[#0A66C2]/10 hover:bg-[#0A66C2]",
    color: "text-[#0A66C2] hover:text-white",
  },
  {
    icon: Twitter,
    label: "X (Twitter)",
    href: "https://x.com/kaza_africa",
    bg: "bg-black/10 hover:bg-black",
    color: "text-black hover:text-white",
  },
];

const miniStats = [
  { icon: Clock, label: "Réponse < 24h", description: "Temps moyen ouvré" },
  { icon: Globe2, label: "Support FR / EN", description: "Et langues locales" },
  {
    icon: HeartHandshake,
    label: "Médiation gratuite",
    description: "En cas de litige",
  },
];

const quickFaq = [
  {
    q: "Combien de temps pour obtenir une réponse ?",
    a: "Nous répondons à tous les messages en moins de 24h ouvrées. Le support prioritaire (Pro) répond en moins de 4h.",
  },
  {
    q: "Comment signaler un problème urgent ?",
    a: "Pour toute urgence (litige, fraude, accès bloqué), écrivez à contact@pirabellabs.com ou utilisez le chat en direct.",
  },
  {
    q: "Puis-je devenir partenaire de KAZA ?",
    a: "Oui. Choisissez le sujet « Partenariat » dans le formulaire ou écrivez à contact@pirabellabs.com. Notre équipe revient vers vous sous 48h.",
  },
  {
    q: "Comment contacter le service presse ?",
    a: "Pour toute demande presse, écrivez à contact@pirabellabs.com. Nous fournissons kit média, interviews et données sur demande.",
  },
];

const offices = [
  {
    city: "Cotonou",
    country: "Bénin",
    status: "Siège social",
    description: "Immeuble Atlantique, Cadjehoun",
    active: true,
  },
  {
    city: "Lomé",
    country: "Togo",
    status: "Ouverture Q3 2026",
    description: "Bureau commercial en préparation",
    active: false,
  },
  {
    city: "Abidjan",
    country: "Côte d'Ivoire",
    status: "Ouverture Q4 2026",
    description: "Expansion régionale en cours",
    active: false,
  },
];

export default function ContactPage() {
  return (
    <div className="overflow-hidden">
      {/* ===== HERO COMPACT GRADIENT NAVY =========================== */}
      <section className="relative isolate flex min-h-[60vh] items-center overflow-hidden bg-kaza-navy text-white">
        <Image
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2000&q=80"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-15"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-br from-kaza-navy/95 via-kaza-navy/85 to-kaza-blue/40" />
        <div
          className="pointer-events-none absolute -top-32 -right-32 size-[28rem] rounded-full bg-kaza-green/20 blur-3xl"
          aria-hidden
        />

        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-20 text-center lg:px-8">
          <FadeIn>
            <Badge className="mb-6 border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-white uppercase backdrop-blur-md">
              <Sparkles className="mr-2 size-3.5" />
              Contact
            </Badge>
          </FadeIn>
          <FadeIn delay={100}>
            <h1 className="font-heading text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Parlons de votre{" "}
              <span className="bg-gradient-to-r from-kaza-green via-emerald-300 to-kaza-green bg-clip-text text-transparent">
                projet
              </span>
            </h1>
          </FadeIn>
          <FadeIn delay={200}>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80 sm:text-xl">
              Une question, un partenariat ou un besoin d&apos;accompagnement ?
              Notre équipe est à votre écoute.
            </p>
          </FadeIn>

          <FadeIn delay={300}>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-3 sm:gap-6">
              {miniStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <GlassPanel
                    key={stat.label}
                    intensity="strong"
                    tint="white"
                    className="flex items-center gap-3 rounded-2xl border-white/20 bg-white/10 px-5 py-3"
                  >
                    <div className="flex size-10 items-center justify-center rounded-xl bg-kaza-green/20 text-kaza-green">
                      <Icon className="size-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-white">
                        {stat.label}
                      </p>
                      <p className="text-xs text-white/70">{stat.description}</p>
                    </div>
                  </GlassPanel>
                );
              })}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ===== INFO + FORM (2 cols) ================================ */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-5">
            {/* ============ LEFT (2/5) ============ */}
            <div className="lg:col-span-2">
              <RevealOnScroll>
                {/* Bandeau Cotonou Bénin */}
                <Card className="overflow-hidden rounded-3xl border-0 bg-gradient-to-br from-kaza-navy to-kaza-blue p-8 text-white shadow-2xl">
                  <div className="flex items-start gap-4">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
                      <MapPin className="size-7" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold tracking-widest text-kaza-green uppercase">
                        Notre siège
                      </p>
                      <h2 className="mt-1 font-heading text-2xl font-bold">
                        Cotonou, Bénin
                      </h2>
                      <p className="mt-2 text-sm text-white/80">
                        Immeuble Atlantique, Cadjehoun
                        <br />
                        Cotonou, République du Bénin
                      </p>
                    </div>
                  </div>
                </Card>
              </RevealOnScroll>

              {/* Coordonnées */}
              <RevealOnScroll>
                <div className="mt-6 space-y-4">
                  <a
                    href="mailto:contact@pirabellabs.com"
                    className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-kaza-green hover:shadow-lg"
                  >
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-kaza-green/10 text-kaza-green transition-transform group-hover:scale-110">
                      <Mail className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Email
                      </p>
                      <p className="font-heading text-base font-semibold text-kaza-navy group-hover:text-kaza-green">
                        contact@pirabellabs.com
                      </p>
                    </div>
                  </a>

                  <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                      <Clock className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Horaires
                      </p>
                      <p className="font-heading text-base font-semibold text-kaza-navy">
                        Lun – Ven, 9h00 – 18h00
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          (GMT)
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </RevealOnScroll>

              {/* Réseaux sociaux */}
              <RevealOnScroll>
                <div className="mt-8">
                  <p className="mb-4 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                    Suivez-nous
                  </p>
                  <div className="flex gap-3">
                    {socialLinks.map((s) => {
                      const Icon = s.icon;
                      return (
                        <Link
                          key={s.label}
                          href={s.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={s.label}
                          className={
                            "flex size-12 items-center justify-center rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg " +
                            s.bg +
                            " " +
                            s.color
                          }
                        >
                          <Icon className="size-5" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </RevealOnScroll>

              {/* Carte placeholder */}
              <RevealOnScroll>
                <div className="mt-8 overflow-hidden rounded-3xl border border-gray-100 shadow-lg">
                  <div className="relative aspect-[4/3] w-full bg-gradient-to-br from-kaza-navy via-kaza-blue/40 to-kaza-green/30">
                    <div
                      className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.15),transparent_50%),radial-gradient(circle_at_70%_60%,rgba(76,175,80,0.2),transparent_50%)]"
                      aria-hidden
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white">
                      <div className="flex size-16 items-center justify-center rounded-full bg-white/95 shadow-2xl">
                        <MapPin className="size-8 text-kaza-blue" />
                      </div>
                      <p className="mt-5 font-heading text-lg font-bold">
                        Cotonou, Bénin
                      </p>
                      <p className="mt-1 text-sm text-white/80">
                        6.3654° N — 2.4183° E
                      </p>
                      <Badge className="mt-4 border-white/30 bg-white/15 text-xs text-white backdrop-blur">
                        Carte interactive bientôt disponible
                      </Badge>
                    </div>
                  </div>
                </div>
              </RevealOnScroll>
            </div>

            {/* ============ RIGHT (3/5) ============ */}
            <div className="lg:col-span-3">
              <RevealOnScroll>
                <Card className="overflow-hidden rounded-3xl border-gray-100 p-8 shadow-2xl sm:p-10">
                  <div className="mb-6">
                    <p className="mb-2 text-xs font-semibold tracking-widest text-kaza-blue uppercase">
                      Formulaire de contact
                    </p>
                    <h2 className="font-heading text-3xl font-bold text-kaza-navy sm:text-4xl">
                      Envoyez-nous un message
                    </h2>
                    <p className="mt-3 text-base text-muted-foreground">
                      Remplissez ce formulaire — nous reviendrons vers vous très
                      rapidement.
                    </p>
                  </div>
                  <ContactForm />
                </Card>
              </RevealOnScroll>
            </div>
          </div>
        </div>
      </section>

      {/* ===== BANDEAU MÉDIAS / PRESSE ============================== */}
      <section className="bg-gradient-to-br from-kaza-navy via-kaza-navy to-kaza-blue/40 py-16 text-white">
        <div className="mx-auto max-w-6xl px-4 lg:px-8">
          <RevealOnScroll>
            <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-kaza-green/20 text-kaza-green">
                <Newspaper className="size-8" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold tracking-widest text-kaza-green uppercase">
                  Pour les médias
                </p>
                <h2 className="mt-1 font-heading text-2xl font-bold sm:text-3xl">
                  Vous êtes journaliste ?
                </h2>
                <p className="mt-2 text-base text-white/80">
                  Pour toute demande presse, interview ou kit média, écrivez-nous
                  à{" "}
                  <a
                    href="mailto:contact@pirabellabs.com"
                    className="font-semibold text-kaza-green underline-offset-4 hover:underline"
                  >
                    contact@pirabellabs.com
                  </a>
                  .
                </p>
              </div>
              <Button
                asChild
                size="lg"
                className="rounded-full bg-kaza-green text-white hover:bg-kaza-green/90"
              >
                <a href="mailto:contact@pirabellabs.com">
                  Contact presse
                  <ArrowRight className="ml-2 size-4" />
                </a>
              </Button>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ===== FAQ RAPIDE =========================================== */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-4xl px-4 lg:px-8">
          <RevealOnScroll>
            <div className="mb-12 text-center">
              <p className="mb-3 text-xs font-semibold tracking-widest text-kaza-blue uppercase">
                Réponses rapides
              </p>
              <h2 className="font-heading text-3xl font-bold text-kaza-navy sm:text-4xl lg:text-5xl">
                Questions courantes
              </h2>
            </div>
          </RevealOnScroll>

          <div className="grid gap-4 sm:grid-cols-2">
            {quickFaq.map((item, i) => (
              <RevealOnScroll key={i} delay={i * 80}>
                <Card className="h-full rounded-3xl border-gray-100 p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
                  <div className="mb-4 flex size-10 items-center justify-center rounded-2xl bg-kaza-blue/10 text-kaza-blue">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <h3 className="font-heading text-base font-bold text-kaza-navy">
                    {item.q}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </p>
                </Card>
              </RevealOnScroll>
            ))}
          </div>

          <RevealOnScroll>
            <div className="mt-10 text-center">
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full"
              >
                <Link href="/faq">
                  Voir toutes les questions
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ===== BUREAUX ============================================== */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <RevealOnScroll>
            <div className="mb-16 text-center">
              <p className="mb-3 text-xs font-semibold tracking-widest text-kaza-blue uppercase">
                Notre présence
              </p>
              <h2 className="font-heading text-3xl font-bold text-kaza-navy sm:text-4xl lg:text-5xl">
                Nos bureaux en Afrique de l&apos;Ouest
              </h2>
            </div>
          </RevealOnScroll>

          <div className="grid gap-6 md:grid-cols-3">
            {offices.map((office, i) => (
              <RevealOnScroll key={office.city} delay={i * 100}>
                <Card
                  className={
                    "h-full rounded-3xl border p-8 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl " +
                    (office.active
                      ? "border-kaza-green/30 bg-gradient-to-br from-white to-kaza-green/5"
                      : "border-gray-100 bg-white opacity-90")
                  }
                >
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-kaza-blue/10 text-kaza-blue">
                    <Building2 className="size-7" />
                  </div>
                  <div className="mt-6 flex items-baseline justify-between">
                    <h3 className="font-heading text-2xl font-bold text-kaza-navy">
                      {office.city}
                    </h3>
                    <span className="text-sm font-medium text-muted-foreground">
                      {office.country}
                    </span>
                  </div>
                  <Badge
                    className={
                      "mt-3 " +
                      (office.active
                        ? "bg-kaza-green text-white"
                        : "bg-amber-100 text-amber-700")
                    }
                  >
                    {office.status}
                  </Badge>
                  <p className="mt-4 text-sm text-muted-foreground">
                    {office.description}
                  </p>
                </Card>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
