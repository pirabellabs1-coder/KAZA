import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Bath,
  Bed,
  CalendarCheck2,
  ChevronRight,
  CookingPot,
  Droplets,
  FileSignature,
  Heart,
  Home,
  MapPin,
  MessagesSquare,
  Mountain,
  Share2,
  Shield,
  ShieldCheck,
  Snowflake,
  Sofa,
  Sparkles,
  Star,
  Trees,
  Users,
  WashingMachine,
  Wifi,
  Wind,
  Zap,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { CompatibilityScore } from "@/components/student/compatibility-score";
import { RoommateCard } from "@/components/student/roommate-card";
import { RevealOnScroll } from "@/components/shared/reveal-on-scroll";
import { GlassPanel } from "@/components/shared/glass-panel";

import { getOpenRoommateListings } from "@/lib/mock-data";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Détail Colocation — KAZA Student Living",
};

// -----------------------------------------------------------------------------
// Données de démonstration enrichies pour la fiche
// -----------------------------------------------------------------------------

const GALLERY = [
  "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80",
];

const ROOMMATES = [
  {
    seed: "Awa+Diop",
    discipline: "Sciences économiques · M1",
    university: "UAC",
    score: 92,
  },
  {
    seed: "Marie+Hounkpe",
    discipline: "Informatique · L3",
    university: "EPAC",
    score: 81,
  },
  {
    seed: "Linda+Adjavon",
    discipline: "Droit · L2",
    university: "UAC",
    score: 74,
  },
];

const ROOM_AMENITIES = [
  { icon: Wifi, label: "WiFi fibre 100 Mbps", color: "text-kaza-blue" },
  { icon: Snowflake, label: "Climatisation", color: "text-cyan-500" },
  { icon: Bed, label: "Lit double + matelas neuf", color: "text-amber-600" },
  { icon: Zap, label: "Bureau étudiant", color: "text-yellow-500" },
  { icon: Wind, label: "Fenêtre extérieure", color: "text-sky-500" },
  { icon: Shield, label: "Serrure individuelle", color: "text-kaza-green" },
];

const COMMON_SPACES = [
  { icon: CookingPot, label: "Cuisine équipée" },
  { icon: Sofa, label: "Salon commun" },
  { icon: Bath, label: "SDB partagée" },
  { icon: WashingMachine, label: "Buanderie" },
  { icon: Mountain, label: "Terrasse" },
];

const NEARBY_UNIVERSITIES = [
  { name: "UAC — Université d'Abomey-Calavi", distance: "8 min · 1,2 km" },
  { name: "EPAC — École Polytechnique", distance: "12 min · 2,0 km" },
  { name: "IUT Lokossa", distance: "25 min en bus" },
];

const HOUSE_RULES = [
  "Non-fumeur",
  "Pas d'animaux",
  "Calme après 22h",
  "Ménage par rotation",
  "Visiteurs autorisés (prévenir)",
];

const ROOMMATE_REVIEWS = [
  {
    name: "Cyril M.",
    role: "Ancien colocataire",
    rating: 5,
    date: "Mars 2026",
    text:
      "Ambiance studieuse et conviviale. La cuisine est toujours propre et les charges sont gérées sans accroc.",
  },
  {
    name: "Esther K.",
    role: "Colocataire actuelle",
    rating: 5,
    date: "Février 2026",
    text:
      "Le quartier est sûr, à pied du campus. Les colocs sont sérieux mais on rigole bien le weekend.",
  },
  {
    name: "Jules T.",
    role: "Visiteur récent",
    rating: 4,
    date: "Janvier 2026",
    text:
      "Bel appartement, bien situé. La SDB partagée demande un peu d'organisation mais c'est gérable.",
  },
];

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

export default async function StudentLivingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const allListings = getOpenRoommateListings();
  const listing = allListings.find((l) => l.id === id) ?? allListings[0];
  const nearby = allListings.filter((l) => l.id !== listing.id).slice(0, 4);

  const pricePerPerson = listing.price;
  const water = 4500;
  const electricity = 6000;
  const internet = 5000;
  const totalPerPerson = pricePerPerson + water + electricity + internet;

  return (
    <div className="bg-white">
      {/* ============================================================== */}
      {/* HEADER STICKY                                                    */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-40 border-b bg-white/85 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
          <nav
            aria-label="Fil d'Ariane"
            className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground"
          >
            <Link
              href="/student-living"
              className="hidden items-center gap-1 hover:text-kaza-navy sm:inline-flex"
            >
              <ArrowLeft className="size-4" />
              Colocations
            </Link>
            <ChevronRight className="hidden size-4 sm:inline" aria-hidden />
            <span className="hidden text-kaza-navy sm:inline">
              Abomey-Calavi
            </span>
            <ChevronRight className="hidden size-4 sm:inline" aria-hidden />
            <span className="truncate font-medium text-kaza-navy">
              {listing.title}
            </span>
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <Share2 className="size-4" />
              <span className="hidden sm:inline">Partager</span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <Heart className="size-4" />
              <span className="hidden sm:inline">Sauvegarder</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 pb-24 lg:px-8">
        {/* ============================================================== */}
        {/* GALERIE MAGAZINE ASYMÉTRIQUE                                    */}
        {/* ============================================================== */}
        <section className="mt-6">
          <div className="grid h-[420px] grid-cols-1 gap-2 overflow-hidden rounded-3xl sm:h-[480px] sm:grid-cols-4 sm:grid-rows-2">
            <div className="relative overflow-hidden rounded-2xl sm:col-span-2 sm:row-span-2">
              <Image
                src={GALLERY[0]}
                alt="Vue principale de la colocation"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 hover:scale-105"
              />
              <Badge className="absolute left-4 top-4 gap-1 bg-kaza-green text-white shadow-md">
                <ShieldCheck className="size-3" />
                Vérifié KAZA
              </Badge>
            </div>
            {GALLERY.slice(1, 5).map((src, i) => (
              <div
                key={i}
                className="relative hidden overflow-hidden rounded-2xl sm:block"
              >
                <Image
                  src={src}
                  alt={`Vue ${i + 2} de la colocation`}
                  fill
                  sizes="25vw"
                  className="object-cover transition-transform duration-700 hover:scale-105"
                />
                {i === 3 && (
                  <button
                    type="button"
                    className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm font-semibold text-white transition-colors hover:bg-black/55"
                  >
                    + 12 photos
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================== */}
        {/* LAYOUT 2 COLONNES                                               */}
        {/* ============================================================== */}
        <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_400px]">
          {/* ============================================================ */}
          {/* COLONNE GAUCHE                                               */}
          {/* ============================================================ */}
          <div className="min-w-0 space-y-12">
            {/* Titre + sous-titre */}
            <RevealOnScroll>
              <div>
                <h1 className="font-heading text-3xl font-bold tracking-tight text-kaza-navy sm:text-4xl lg:text-5xl">
                  {listing.title}
                </h1>
                <p className="mt-3 flex items-center gap-2 text-base text-muted-foreground">
                  <MapPin className="size-4 text-kaza-blue" />
                  Près de l&apos;UAC · {listing.address}
                </p>
              </div>
            </RevealOnScroll>

            {/* Quick stats colorées */}
            <RevealOnScroll>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {[
                  {
                    icon: Bed,
                    label: `${listing.bedrooms_available ?? 1} chambre dispo`,
                    bg: "bg-kaza-blue/10",
                    fg: "text-kaza-blue",
                  },
                  {
                    icon: Home,
                    label: "3 places au total",
                    bg: "bg-kaza-green/10",
                    fg: "text-kaza-green",
                  },
                  {
                    icon: Users,
                    label: "2 colocs actuels",
                    bg: "bg-amber-100",
                    fg: "text-amber-700",
                  },
                  {
                    icon: Sparkles,
                    label: "Mixte",
                    bg: "bg-purple-100",
                    fg: "text-purple-700",
                  },
                  {
                    icon: Heart,
                    label: `Dès ${formatPrice(pricePerPerson)}`,
                    bg: "bg-red-100",
                    fg: "text-red-600",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="flex flex-col items-start gap-2 rounded-2xl border bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                  >
                    <div
                      className={`flex size-9 items-center justify-center rounded-xl ${s.bg}`}
                    >
                      <s.icon className={`size-4 ${s.fg}`} />
                    </div>
                    <p className="text-xs font-semibold text-kaza-navy">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </RevealOnScroll>

            {/* Vos futurs colocataires */}
            <RevealOnScroll>
              <section>
                <h2 className="font-heading text-2xl font-bold text-kaza-navy">
                  Vos futurs colocataires
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pseudonymes affichés tant que votre demande n&apos;est pas
                  acceptée. Score basé sur votre profil.
                </p>
                <div className="mt-6 grid gap-6 sm:grid-cols-3">
                  {ROOMMATES.map((r, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center gap-3 rounded-3xl border bg-white p-6 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                    >
                      <Avatar className="size-16 ring-2 ring-kaza-blue/10">
                        <AvatarFallback className="bg-gradient-to-br from-kaza-navy to-kaza-blue font-heading text-lg font-bold text-white">
                          {r.seed
                            .split("+")
                            .map((p) => p[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <CompatibilityScore score={r.score} size="sm" />
                      <div>
                        <p className="font-heading text-sm font-semibold text-kaza-navy">
                          Coloc {i + 1}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {r.discipline}
                        </p>
                        <p className="mt-1 text-xs font-medium text-kaza-blue">
                          {r.university}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </RevealOnScroll>

            {/* Description chambre + équipements */}
            <RevealOnScroll>
              <section>
                <h2 className="font-heading text-2xl font-bold text-kaza-navy">
                  À propos de la chambre
                </h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  {listing.description ??
                    `Chambre spacieuse de ${listing.room_size ?? "12 m²"} dans un appartement moderne à quelques minutes du campus. Espace lumineux et calme, idéal pour étudier sereinement. Mobilier neuf, climatisation et fibre optique inclus.`}
                </p>

                <h3 className="mt-8 font-heading text-lg font-semibold text-kaza-navy">
                  Équipements de la chambre
                </h3>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {ROOM_AMENITIES.map((a) => (
                    <div
                      key={a.label}
                      className="flex items-center gap-3 rounded-2xl border bg-white p-4 transition-colors hover:border-kaza-blue/30 hover:bg-kaza-blue/[0.03]"
                    >
                      <div className="flex size-9 items-center justify-center rounded-xl bg-muted">
                        <a.icon className={`size-4 ${a.color}`} />
                      </div>
                      <span className="text-sm font-medium text-kaza-navy">
                        {a.label}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </RevealOnScroll>

            {/* Espaces communs */}
            <RevealOnScroll>
              <section>
                <h2 className="font-heading text-2xl font-bold text-kaza-navy">
                  Espaces communs
                </h2>
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {COMMON_SPACES.map((s) => (
                    <div
                      key={s.label}
                      className="flex flex-col items-center gap-3 rounded-3xl border bg-gradient-to-br from-kaza-blue/[0.04] to-kaza-green/[0.04] p-5 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                    >
                      <div className="flex size-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                        <s.icon className="size-5 text-kaza-blue" />
                      </div>
                      <span className="text-xs font-semibold text-kaza-navy">
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </RevealOnScroll>

            {/* Frais partagés */}
            <RevealOnScroll>
              <section>
                <h2 className="font-heading text-2xl font-bold text-kaza-navy">
                  Frais partagés mensuels
                </h2>
                <div className="mt-6 overflow-hidden rounded-3xl border bg-white shadow-sm">
                  <div className="divide-y">
                    {[
                      {
                        icon: Home,
                        label: "Loyer par personne",
                        value: pricePerPerson,
                        color: "text-kaza-blue",
                      },
                      {
                        icon: Droplets,
                        label: "Eau (estimation)",
                        value: water,
                        color: "text-cyan-500",
                      },
                      {
                        icon: Zap,
                        label: "Électricité (estimation)",
                        value: electricity,
                        color: "text-amber-500",
                      },
                      {
                        icon: Wifi,
                        label: "Internet fibre",
                        value: internet,
                        color: "text-kaza-green",
                      },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="flex items-center justify-between p-5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 items-center justify-center rounded-xl bg-muted">
                            <row.icon className={`size-4 ${row.color}`} />
                          </div>
                          <span className="text-sm font-medium text-kaza-navy">
                            {row.label}
                          </span>
                        </div>
                        <span className="font-heading text-base font-semibold text-kaza-navy">
                          {formatPrice(row.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between bg-gradient-to-r from-kaza-navy to-kaza-blue p-5 text-white">
                    <span className="font-heading text-sm font-semibold uppercase tracking-wider">
                      Total / personne / mois
                    </span>
                    <span className="font-heading text-2xl font-bold">
                      {formatPrice(totalPerPerson)}
                    </span>
                  </div>
                </div>
              </section>
            </RevealOnScroll>

            {/* Localisation */}
            <RevealOnScroll>
              <section>
                <h2 className="font-heading text-2xl font-bold text-kaza-navy">
                  Localisation
                </h2>
                <div className="mt-6 overflow-hidden rounded-3xl border shadow-sm">
                  <div className="relative h-72 w-full overflow-hidden bg-gradient-to-br from-kaza-blue/15 via-kaza-green/10 to-kaza-navy/15">
                    {/* Carte placeholder stylisée */}
                    <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(26,58,82,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(26,58,82,0.1)_1px,transparent_1px)] [background-size:24px_24px]" />
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                      <div className="mx-auto flex size-14 animate-pulse items-center justify-center rounded-full bg-kaza-blue text-white shadow-lg ring-4 ring-kaza-blue/30">
                        <MapPin className="size-6" />
                      </div>
                      <p className="mt-3 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-kaza-navy backdrop-blur-sm">
                        {listing.address}
                      </p>
                    </div>
                  </div>
                  <div className="divide-y bg-white">
                    {NEARBY_UNIVERSITIES.map((u) => (
                      <div
                        key={u.name}
                        className="flex items-center justify-between p-4"
                      >
                        <span className="text-sm font-medium text-kaza-navy">
                          {u.name}
                        </span>
                        <span className="text-xs font-semibold text-kaza-blue">
                          {u.distance}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </RevealOnScroll>

            {/* Règles de vie commune */}
            <RevealOnScroll>
              <section>
                <h2 className="font-heading text-2xl font-bold text-kaza-navy">
                  Règles de vie commune
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Définies ensemble par les colocataires pour préserver
                  l&apos;ambiance maison.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {HOUSE_RULES.map((rule) => (
                    <Badge
                      key={rule}
                      variant="secondary"
                      className="rounded-full border bg-white px-4 py-2 text-sm font-medium text-kaza-navy shadow-sm hover:bg-kaza-blue/[0.05]"
                    >
                      <CalendarCheck2 className="mr-1.5 size-3.5 text-kaza-green" />
                      {rule}
                    </Badge>
                  ))}
                </div>
              </section>
            </RevealOnScroll>

            {/* Avis colocataires */}
            <RevealOnScroll>
              <section>
                <div className="flex items-end justify-between gap-4">
                  <h2 className="font-heading text-2xl font-bold text-kaza-navy">
                    Avis colocataires
                  </h2>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-kaza-navy">
                    <Star className="size-4 fill-amber-400 text-amber-400" />
                    4,8 · {ROOMMATE_REVIEWS.length} avis
                  </div>
                </div>
                <div className="mt-6 space-y-4">
                  {ROOMMATE_REVIEWS.map((r, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-10">
                            <AvatarFallback className="bg-kaza-navy text-sm text-white">
                              {r.name
                                .split(" ")
                                .map((p) => p[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold text-kaza-navy">
                              {r.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {r.role} · {r.date}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, k) => (
                            <Star
                              key={k}
                              className={`size-3.5 ${
                                k < r.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-muted-foreground/30"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {r.text}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </RevealOnScroll>
          </div>

          {/* ============================================================ */}
          {/* COLONNE DROITE STICKY                                        */}
          {/* ============================================================ */}
          <aside className="lg:relative">
            <div className="lg:sticky lg:top-24">
              <GlassPanel
                tint="white"
                intensity="strong"
                className="border-kaza-navy/10 bg-white/95 p-7 shadow-2xl"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-kaza-blue">
                    Prix par personne
                  </p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-heading text-4xl font-bold text-kaza-navy">
                      {formatPrice(pricePerPerson)}
                    </span>
                    <span className="text-sm font-medium text-muted-foreground">
                      /mois
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-kaza-green">
                    + frais inclus (eau · élec · internet)
                  </p>
                </div>

                <Separator className="my-6" />

                <form className="space-y-4">
                  <div>
                    <label
                      htmlFor="motivation"
                      className="mb-1.5 block font-heading text-sm font-semibold text-kaza-navy"
                    >
                      Demander à rejoindre
                    </label>
                    <Textarea
                      id="motivation"
                      placeholder="Présentez-vous en quelques lignes : études, université, rythme de vie…"
                      rows={4}
                      className="resize-none rounded-2xl border-kaza-navy/15 bg-white text-sm"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="h-12 w-full bg-gradient-to-r from-kaza-navy to-kaza-blue text-base font-semibold shadow-lg hover:from-kaza-blue hover:to-kaza-navy"
                  >
                    <MessagesSquare className="mr-2 size-5" />
                    Envoyer ma demande
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Les colocataires vous répondent en général sous 24h
                  </p>
                </form>

                <Separator className="my-6" />

                <div>
                  <p className="font-heading text-sm font-semibold text-kaza-navy">
                    Le service KAZA
                  </p>
                  <ul className="mt-4 space-y-3">
                    {[
                      {
                        icon: ShieldCheck,
                        label: "Vérification d'identité",
                        desc: "Coloc validé KYC + statut étudiant",
                      },
                      {
                        icon: FileSignature,
                        label: "Bail numérique légal",
                        desc: "Signature électronique opposable",
                      },
                      {
                        icon: Trees,
                        label: "Médiation conflits",
                        desc: "Référent dédié sous 24h",
                      },
                    ].map((s) => (
                      <li key={s.label} className="flex items-start gap-3">
                        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-kaza-green/10">
                          <s.icon className="size-4 text-kaza-green" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-kaza-navy">
                            {s.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {s.desc}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </GlassPanel>
            </div>
          </aside>
        </div>

        {/* ============================================================== */}
        {/* AUTRES COLOCATIONS À PROXIMITÉ                                  */}
        {/* ============================================================== */}
        <section className="mt-24">
          <RevealOnScroll>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-kaza-blue">
                  À découvrir
                </p>
                <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-kaza-navy sm:text-4xl">
                  Autres colocations à proximité
                </h2>
              </div>
              <Link
                href="/student-living"
                className="hidden text-sm font-semibold text-kaza-blue hover:text-kaza-navy sm:inline"
              >
                Voir tout →
              </Link>
            </div>
          </RevealOnScroll>

          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {nearby.map((l, i) => (
              <RevealOnScroll key={l.id} delay={i * 80} direction="up">
                <RoommateCard
                  id={l.id}
                  title={l.title}
                  price={l.price}
                  address={l.address}
                  imageUrl={GALLERY[(i + 1) % GALLERY.length]}
                  peopleLookingFor={l.people_looking_for ?? 1}
                  currentRoommates={(l.bedrooms_available ?? 1) + 1}
                  amenities={["WiFi", "Climatisation", "Cuisine équipée"]}
                  isVerified
                />
              </RevealOnScroll>
            ))}
            {nearby.length === 0 && (
              <p className="col-span-full text-sm text-muted-foreground">
                D&apos;autres colocations seront publiées très bientôt dans ce
                quartier.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
