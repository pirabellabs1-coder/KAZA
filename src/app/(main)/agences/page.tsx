// =============================================================================
// Kaabo — Annuaire public des agences : /agences
//
// Liste toutes les agences ayant publié un profil public (slug défini).
// Lecture via le client admin (les rangées `users` d'autrui ne sont pas
// exposées au public par la RLS) — on ne sélectionne que des champs publics.
// =============================================================================

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Building2, MapPin, Star } from "lucide-react";

import type { SupabaseClient } from "@supabase/supabase-js";

import { Badge } from "@/components/ui/badge";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AgencySettings } from "@/actions/agency-settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Annuaire des agences immobilières — Kaabo",
  description:
    "Découvrez les agences immobilières partenaires de Kaabo au Bénin et en Afrique de l'Ouest : profils vérifiés, annonces et coordonnées.",
  alternates: { canonical: "/agences" },
};

const ACCENT_HEX: Record<string, string> = {
  navy: "#1A3A52",
  blue: "#1976D2",
  green: "#4CAF50",
  amber: "#f59e0b",
  rose: "#f43f5e",
  purple: "#a855f7",
};

interface AgencyCard {
  id: string;
  slug: string;
  displayName: string;
  city: string;
  logoUrl: string | null;
  bannerUrl: string;
  accent: string;
  rating: number | null;
  propertyCount: number;
}

async function loadAgencies(): Promise<AgencyCard[]> {
  try {
    const admin = createAdminClient() as unknown as SupabaseClient;

    const { data } = await admin
      .from("users")
      .select(
        "id, first_name, last_name, profile_photo_url, rating_average, agency_settings",
      )
      .eq("role", "AGENCY")
      .limit(200);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = ((data ?? []) as any[])
      .map((u) => {
        const settings = (u.agency_settings ?? {}) as Partial<AgencySettings>;
        const pub = (settings.public ?? {}) as AgencySettings["public"];
        const prof = (settings.profile ?? {}) as AgencySettings["profile"];
        const slug = (pub?.slug ?? "").trim();
        if (!slug) return null; // profil non publié
        const displayName =
          (prof?.commercialName || "").trim() ||
          `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() ||
          "Agence immobilière";
        return {
          id: u.id as string,
          slug,
          displayName,
          city: (prof?.city || "").trim(),
          logoUrl:
            (prof?.logoUrl || "").trim() ||
            (u.profile_photo_url as string | null) ||
            null,
          bannerUrl: (pub?.bannerUrl || "").trim(),
          accent: ACCENT_HEX[pub?.accentColor ?? "navy"] ?? ACCENT_HEX.navy,
          rating:
            typeof u.rating_average === "number" ? u.rating_average : null,
          propertyCount: 0,
        } satisfies AgencyCard;
      })
      .filter((x): x is AgencyCard => x !== null);

    // Compte des annonces disponibles par agence (une requête groupée en JS).
    if (rows.length > 0) {
      const { data: props } = await admin
        .from("properties")
        .select("owner_id")
        .eq("status", "AVAILABLE")
        .in(
          "owner_id",
          rows.map((r) => r.id),
        );
      const counts = new Map<string, number>();
      for (const p of (props ?? []) as Array<{ owner_id: string }>) {
        counts.set(p.owner_id, (counts.get(p.owner_id) ?? 0) + 1);
      }
      for (const r of rows) r.propertyCount = counts.get(r.id) ?? 0;
    }

    // Tri : plus d'annonces d'abord, puis note.
    rows.sort(
      (a, b) =>
        b.propertyCount - a.propertyCount || (b.rating ?? 0) - (a.rating ?? 0),
    );
    return rows;
  } catch {
    return [];
  }
}

export default async function AgencesIndexPage() {
  const agencies = await loadAgencies();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      <header className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-kaza-blue">
          Annuaire
        </p>
        <h1 className="mt-1 font-heading text-3xl font-bold text-kaza-navy sm:text-4xl">
          Les agences immobilières sur Kaabo
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
          Des professionnels vérifiés pour vous accompagner dans votre location,
          votre achat ou la gestion de vos biens.
        </p>
      </header>

      {agencies.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/20 px-6 py-16 text-center">
          <Building2 className="mx-auto size-10 text-muted-foreground/50" />
          <p className="mt-3 font-semibold text-kaza-navy">
            Aucune agence publiée pour le moment
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Les profils d&apos;agences apparaîtront ici dès leur publication.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {agencies.map((a) => (
            <Link
              key={a.id}
              href={`/agences/${a.slug}`}
              className="group overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-lg"
            >
              {/* Bannière */}
              <div
                className="relative h-24 w-full"
                style={{
                  background: a.bannerUrl
                    ? undefined
                    : `linear-gradient(135deg, ${a.accent}, ${a.accent}cc)`,
                }}
              >
                {a.bannerUrl && (
                  <Image
                    src={a.bannerUrl}
                    alt=""
                    fill
                    sizes="400px"
                    className="object-cover"
                    unoptimized
                  />
                )}
              </div>
              <div className="relative px-4 pb-4">
                {/* Logo */}
                <div className="-mt-8 mb-2 flex size-16 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white shadow">
                  {a.logoUrl ? (
                    <Image
                      src={a.logoUrl}
                      alt={a.displayName}
                      width={64}
                      height={64}
                      className="size-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div
                      className="flex size-full items-center justify-center text-lg font-bold text-white"
                      style={{ background: a.accent }}
                    >
                      {a.displayName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <h2 className="line-clamp-1 font-heading text-lg font-semibold text-kaza-navy group-hover:text-kaza-blue">
                  {a.displayName}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {a.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3" />
                      {a.city}
                    </span>
                  )}
                  {a.rating != null && (
                    <span className="flex items-center gap-1">
                      <Star className="size-3 fill-amber-400 text-amber-400" />
                      {a.rating.toFixed(1)}
                    </span>
                  )}
                </div>
                <div className="mt-3">
                  <Badge variant="secondary">
                    {a.propertyCount} annonce{a.propertyCount > 1 ? "s" : ""}
                  </Badge>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
