import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BedDouble,
  Bath,
  Compass,
  ExternalLink,
  Eye,
  Home,
  MapPin,
  Maximize,
  ShieldCheck,
} from "lucide-react";

import { getPropertyById } from "@/lib/queries/properties";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

// =============================================================================
// Kaabo — Détail d'une annonce (espace admin / centre de contrôle)
// =============================================================================
// Vue de revue complète pour la modération : photos, visite 360°, informations
// et propriétaire. Le bouton « Voir » de la liste admin pointe ici.
// =============================================================================

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  AVAILABLE: {
    label: "En ligne",
    className: "border-emerald-200 bg-emerald-100 text-emerald-800",
  },
  PENDING: {
    label: "En attente",
    className: "border-amber-200 bg-amber-100 text-amber-800",
  },
  DRAFT: {
    label: "Brouillon",
    className: "border-slate-200 bg-slate-100 text-slate-700",
  },
  UNAVAILABLE: {
    label: "Hors marché",
    className: "border-slate-200 bg-slate-100 text-slate-700",
  },
  ARCHIVED: {
    label: "Archivée",
    className: "border-slate-200 bg-slate-100 text-slate-700",
  },
  RENTED: {
    label: "Louée",
    className: "border-blue-200 bg-blue-100 text-blue-800",
  },
};

export default async function AdminPropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getPropertyById(id);
  if (!property) notFound();

  const status = STATUS_LABELS[property.status] ?? {
    label: property.status,
    className: "border-slate-200 bg-slate-100 text-slate-700",
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/properties">
            <ArrowLeft className="mr-1 size-4" />
            Retour aux annonces
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/properties/${property.id}`} target="_blank">
            <ExternalLink className="mr-1 size-4" />
            Voir l&apos;annonce publique
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Badge className={status.className}>{status.label}</Badge>
            <span className="text-xs text-muted-foreground">
              Réf. #{property.id.slice(0, 8)}
            </span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-kaza-navy">
            {property.title}
          </h1>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-4" />
            {property.address}
          </p>
        </div>
        <div className="text-right">
          <p className="font-heading text-2xl font-bold text-kaza-navy">
            {formatPrice(property.price)}
            {property.listingType !== "SALE" && (
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                /mois
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Galerie photos */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {property.photos.map((url, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={url}
            alt={`Photo ${i + 1}`}
            className="aspect-[4/3] w-full rounded-xl border object-cover"
          />
        ))}
      </div>

      {/* Caractéristiques */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={Home} label="Type" value={property.type} />
        <Stat
          icon={BedDouble}
          label="Chambres"
          value={String(property.bedrooms)}
        />
        <Stat
          icon={Bath}
          label="Salles de bain"
          value={String(property.bathrooms)}
        />
        <Stat
          icon={Maximize}
          label="Surface"
          value={property.sqm ? `${property.sqm} m²` : "—"}
        />
      </div>

      {/* Visite 360° */}
      {property.panoramaScenes && property.panoramaScenes.length > 0 && (
        <div className="rounded-xl border bg-kaza-blue/5 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-kaza-navy">
            <Compass className="size-4 text-kaza-blue" />
            Visite 360° — {property.panoramaScenes.length} scène
            {property.panoramaScenes.length > 1 ? "s" : ""}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {property.panoramaScenes
              .map((s, i) => s.label || `Scène ${i + 1}`)
              .join(" · ")}
          </p>
        </div>
      )}

      {/* Description */}
      <div>
        <h2 className="mb-2 font-heading text-lg font-semibold text-kaza-navy">
          Description
        </h2>
        <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {property.description}
        </p>
      </div>

      {/* Équipements */}
      {property.amenities.length > 0 && (
        <div>
          <h2 className="mb-2 font-heading text-lg font-semibold text-kaza-navy">
            Équipements
          </h2>
          <div className="flex flex-wrap gap-2">
            {property.amenities.map((a) => (
              <Badge key={a} variant="secondary">
                {a}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Propriétaire */}
      {property.owner && (
        <div className="rounded-xl border p-4">
          <h2 className="mb-2 font-heading text-lg font-semibold text-kaza-navy">
            Propriétaire
          </h2>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium">
                {property.owner.firstName} {property.owner.lastName}
              </p>
              <p className="text-xs text-muted-foreground">
                {property.owner.role}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {property.owner.isVerified && (
                <Badge className="border-emerald-200 bg-emerald-100 text-emerald-800">
                  <ShieldCheck className="mr-1 size-3" />
                  Vérifié
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Eye className="size-4" />
          {property.viewsCount} vues
        </span>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Home;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-3">
      <Icon className="size-4 text-kaza-blue" />
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-kaza-navy">{value}</p>
    </div>
  );
}
