// =============================================================================
// Kaabo — Page publique d'une agence : /agences/[slug]
//
// Profil public consultable par n'importe quel visiteur. Lit l'agence par son
// `slug` personnalisé (agency_settings.public.slug) puis affiche bannière,
// logo, présentation, réseaux sociaux et l'ensemble de ses biens disponibles.
//
// Lecture via le client admin (service role) car les rangées `users` d'autrui
// ne sont pas exposées par la RLS au public ; on ne sélectionne donc QUE des
// champs publics sûrs (nom, logo, bio, réglages publics, note moyenne).
// =============================================================================

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Building2,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Star,
  Twitter,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/property/property-card";
import { createAdminClient } from "@/lib/supabase/admin";
import { getInitials } from "@/lib/utils";
import type { AgencySettings } from "@/actions/agency-settings";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Couleur d'accent → hex (cohérent avec ACCENT_COLORS du formulaire public)
// ---------------------------------------------------------------------------

const ACCENT_HEX: Record<string, string> = {
  navy: "#1A3A52",
  blue: "#1976D2",
  green: "#4CAF50",
  amber: "#f59e0b",
  rose: "#f43f5e",
  purple: "#a855f7",
};

// ---------------------------------------------------------------------------
// Chargement des données
// ---------------------------------------------------------------------------

interface AgencyUserRow {
  id: string;
  first_name: string;
  last_name: string;
  profile_photo_url: string | null;
  bio: string | null;
  rating_average: number | null;
  agency_settings: Partial<AgencySettings> | null;
}

interface PropertyRow {
  id: string;
  title: string;
  price: number;
  address: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_meters: number | null;
  property_type: string;
}

interface AgencyPublicData {
  agency: AgencyUserRow;
  publicSettings: AgencySettings["public"];
  profile: AgencySettings["profile"];
  displayName: string;
  properties: Array<PropertyRow & { imageUrl: string }>;
}

async function loadAgencyBySlug(slug: string): Promise<AgencyPublicData | null> {
  const clean = slug.trim().toLowerCase();
  if (!clean) return null;

  try {
    const admin = createAdminClient();

    // Recherche par chemin JSON `agency_settings->public->>slug`. La clé de
    // colonne JSON n'est pas dans le type généré : cast ciblé sur l'argument.
    const { data } = await admin
      .from("users")
      .select(
        "id, first_name, last_name, profile_photo_url, bio, rating_average, agency_settings",
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .eq("agency_settings->public->>slug" as any, clean)
      .limit(1)
      .maybeSingle();

    const agency = (data as unknown as AgencyUserRow | null) ?? null;
    if (!agency) return null;

    const settings = (agency.agency_settings ?? {}) as Partial<AgencySettings>;
    const publicSettings = (settings.public ?? {}) as AgencySettings["public"];
    const profile = (settings.profile ?? {}) as AgencySettings["profile"];

    const displayName =
      (profile.commercialName || "").trim() ||
      `${agency.first_name} ${agency.last_name}`.trim() ||
      "Agence immobilière";

    // Biens disponibles de l'agence (owner_id = compte agence)
    const { data: rawProps } = await admin
      .from("properties")
      .select(
        "id, title, price, address, bedrooms, bathrooms, square_meters, property_type",
      )
      .eq("owner_id", agency.id)
      .eq("status", "AVAILABLE")
      .order("created_at", { ascending: false })
      .limit(12);

    const props = (rawProps as unknown as PropertyRow[] | null) ?? [];

    // Photo de couverture de chaque bien (1re par display_order)
    const photoByProperty = new Map<string, string>();
    if (props.length > 0) {
      const { data: photos } = await admin
        .from("property_photos")
        .select("property_id, photo_url, display_order")
        .in(
          "property_id",
          props.map((p) => p.id),
        )
        .order("display_order", { ascending: true });

      for (const ph of (photos ?? []) as Array<{
        property_id: string;
        photo_url: string;
      }>) {
        if (!photoByProperty.has(ph.property_id)) {
          photoByProperty.set(ph.property_id, ph.photo_url);
        }
      }
    }

    const properties = props.map((p) => ({
      ...p,
      imageUrl: photoByProperty.get(p.id) ?? "",
    }));

    return { agency, publicSettings, profile, displayName, properties };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// SEO
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadAgencyBySlug(slug);
  if (!data) {
    return { title: "Agence introuvable — Kaabo" };
  }
  const description =
    (data.publicSettings.about || data.profile.description || "").slice(0, 160) ||
    `Découvrez les biens proposés par ${data.displayName} sur Kaabo.`;

  return {
    title: `${data.displayName} — Agence immobilière sur Kaabo`,
    description,
    alternates: { canonical: `/agences/${slug}` },
    openGraph: {
      title: `${data.displayName} — Kaabo`,
      description,
      url: `/agences/${slug}`,
      type: "profile",
      images: data.publicSettings.bannerUrl
        ? [{ url: data.publicSettings.bannerUrl }]
        : undefined,
    },
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AgencyPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await loadAgencyBySlug(slug);
  if (!data) notFound();

  const { agency, publicSettings, profile, displayName, properties } = data;
  const accent = ACCENT_HEX[publicSettings.accentColor] ?? ACCENT_HEX.navy;
  const about = publicSettings.about || profile.description || agency.bio || "";
  const rating = agency.rating_average ?? 0;

  const social = publicSettings.social ?? {
    facebook: "",
    instagram: "",
    linkedin: "",
    twitter: "",
  };
  const socialLinks = [
    { url: social.facebook, Icon: Facebook, label: "Facebook" },
    { url: social.instagram, Icon: Instagram, label: "Instagram" },
    { url: social.linkedin, Icon: Linkedin, label: "LinkedIn" },
    { url: social.twitter, Icon: Twitter, label: "X (Twitter)" },
  ].filter((s) => Boolean(s.url));

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Bannière */}
      <div className="relative h-48 w-full sm:h-64 lg:h-72" style={{ backgroundColor: accent }}>
        {publicSettings.bannerUrl ? (
          <Image
            src={publicSettings.bannerUrl}
            alt={`Bannière de ${displayName}`}
            fill
            sizes="100vw"
            className="object-cover"
            priority
            unoptimized
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        {/* En-tête agence */}
        <div className="relative -mt-16 flex flex-col gap-4 rounded-2xl border border-border bg-white p-6 shadow-sm sm:flex-row sm:items-end">
          <div className="flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-muted shadow-md">
            {profile.logoUrl || agency.profile_photo_url ? (
              <Image
                src={profile.logoUrl || agency.profile_photo_url || ""}
                alt={`Logo de ${displayName}`}
                width={112}
                height={112}
                className="size-full object-cover"
                unoptimized
              />
            ) : (
              <span className="text-2xl font-bold text-muted-foreground">
                {getInitials(agency.first_name || "A", agency.last_name || "G")}
              </span>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Building2 className="size-5" style={{ color: accent }} aria-hidden="true" />
              <Badge
                variant="secondary"
                className="text-xs"
                style={{ backgroundColor: `${accent}1a`, color: accent }}
              >
                Agence immobilière
              </Badge>
            </div>
            <h1 className="mt-1 font-heading text-2xl font-bold text-kaza-navy sm:text-3xl">
              {displayName}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {profile.city ? (
                <span className="flex items-center gap-1">
                  <MapPin className="size-4" aria-hidden="true" />
                  {profile.city}
                </span>
              ) : null}
              {rating > 0 ? (
                <span className="flex items-center gap-1">
                  <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                  {rating.toFixed(1)} / 5
                </span>
              ) : null}
              <span className="flex items-center gap-1">
                <Building2 className="size-4" aria-hidden="true" />
                {properties.length} bien{properties.length > 1 ? "s" : ""} disponible
                {properties.length > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {socialLinks.length > 0 && (
            <div className="flex gap-2">
              {socialLinks.map(({ url, Icon, label }) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-muted hover:text-kaza-navy"
                >
                  <Icon className="size-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Colonne principale */}
          <div className="space-y-8">
            {about ? (
              <section className="rounded-2xl border border-border bg-white p-6">
                <h2 className="font-heading text-lg font-bold text-kaza-navy">
                  À propos
                </h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {about}
                </p>
              </section>
            ) : null}

            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-heading text-lg font-bold text-kaza-navy">
                  Biens disponibles
                </h2>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/search">Voir toute la recherche</Link>
                </Button>
              </div>

              {properties.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-white p-10 text-center">
                  <Building2 className="mx-auto mb-3 size-10 text-muted-foreground" aria-hidden="true" />
                  <p className="font-medium text-foreground">
                    Aucun bien disponible pour le moment
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Cette agence n&apos;a pas encore publié d&apos;annonce active.
                    Revenez bientôt.
                  </p>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  {properties.map((p) => (
                    <PropertyCard
                      key={p.id}
                      id={p.id}
                      title={p.title}
                      price={p.price}
                      address={p.address ?? profile.city ?? ""}
                      bedrooms={p.bedrooms ?? 0}
                      bathrooms={p.bathrooms ?? 0}
                      squareMeters={p.square_meters ?? 0}
                      imageUrl={p.imageUrl}
                      propertyType={p.property_type}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Colonne contact */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-white p-6">
              <h2 className="font-heading text-base font-bold text-kaza-navy">
                Contacter l&apos;agence
              </h2>
              <div className="mt-4 space-y-3 text-sm">
                {profile.email ? (
                  <a
                    href={`mailto:${profile.email}`}
                    className="flex items-center gap-2 text-muted-foreground transition hover:text-kaza-navy"
                  >
                    <Mail className="size-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{profile.email}</span>
                  </a>
                ) : null}
                {profile.phone ? (
                  <a
                    href={`tel:${profile.phone}`}
                    className="flex items-center gap-2 text-muted-foreground transition hover:text-kaza-navy"
                  >
                    <Phone className="size-4 shrink-0" aria-hidden="true" />
                    {profile.phone}
                  </a>
                ) : null}
                {profile.website ? (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-muted-foreground transition hover:text-kaza-navy"
                  >
                    <Globe className="size-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{profile.website.replace(/^https?:\/\//, "")}</span>
                  </a>
                ) : null}
                {profile.address ? (
                  <p className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    {profile.address}
                  </p>
                ) : null}
                {!profile.email && !profile.phone && !profile.website && !profile.address ? (
                  <p className="text-muted-foreground">
                    Coordonnées non renseignées.
                  </p>
                ) : null}
              </div>

              <Button asChild className="mt-5 w-full" style={{ backgroundColor: accent }}>
                <Link href="/search">Voir les annonces</Link>
              </Button>
            </div>

            {(profile.rccm || profile.ifu) && (
              <div className="rounded-2xl border border-border bg-white p-6 text-sm">
                <h3 className="font-heading text-sm font-bold text-kaza-navy">
                  Informations légales
                </h3>
                <dl className="mt-3 space-y-2 text-muted-foreground">
                  {profile.rccm ? (
                    <div className="flex justify-between gap-3">
                      <dt>RCCM</dt>
                      <dd className="font-medium text-foreground">{profile.rccm}</dd>
                    </div>
                  ) : null}
                  {profile.ifu ? (
                    <div className="flex justify-between gap-3">
                      <dt>IFU</dt>
                      <dd className="font-medium text-foreground">{profile.ifu}</dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
