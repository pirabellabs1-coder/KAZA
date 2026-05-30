import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Heart,
  MapPin,
  Bed,
  Bath,
  Maximize,
  ArrowRight,
  Trash2,
  Search,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { listSavedProperties } from "@/lib/queries/tenant-activity";
import { toggleSaveProperty } from "@/actions/favorites";
import { getMySavedSearches } from "@/actions/saved-searches";
import { SavedSearchList } from "@/components/property/saved-search-list";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Propriétés Sauvegardées",
};

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  HOUSE: "Maison",
  APARTMENT: "Appartement",
  STUDIO: "Studio",
  ROOM: "Chambre",
  VILLA: "Villa",
};

export default async function TenantSavedPage() {
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login?redirect=/tenant/saved");

  const [saved, savedSearches] = await Promise.all([
    listSavedProperties(user.id),
    getMySavedSearches(),
  ]);

  return (
    <div className="space-y-8">
      {/* Header luxe */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-kaza-navy sm:text-3xl">
            Propriétés sauvegardées
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {saved.length === 0
              ? "Retrouvez ici vos coups de cœur"
              : `${saved.length} bien${saved.length > 1 ? "s" : ""} sauvegardé${saved.length > 1 ? "s" : ""}`}
          </p>
        </div>
        {saved.length > 0 && (
          <Button
            asChild
            variant="outline"
            className="self-start border-kaza-navy/20 hover:bg-kaza-navy/5"
          >
            <Link href="/properties">
              <Search className="mr-1.5 size-4" />
              Voir plus d&apos;annonces
            </Link>
          </Button>
        )}
      </div>

      {saved.length === 0 ? (
        <EmptyStateSaved />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((item) => (
            <SavedCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Recherches sauvegardées & alertes */}
      <section className="space-y-3">
        <div>
          <h2 className="font-heading text-xl font-bold text-kaza-navy">
            Mes recherches &amp; alertes
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Relancez vos recherches enregistrées ou gérez vos alertes de
            nouveaux biens.
          </p>
        </div>
        <SavedSearchList initial={savedSearches} />
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Carte favori (server component avec form action pour retirer)
// ---------------------------------------------------------------------------

function SavedCard({
  item,
}: {
  item: Awaited<ReturnType<typeof listSavedProperties>>[number];
}) {
  const removeAction = async () => {
    "use server";
    await toggleSaveProperty(item.property.id);
  };
  const typeLabel =
    PROPERTY_TYPE_LABELS[item.property.type] ?? item.property.type;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl">
      {/* Image */}
      <Link
        href={`/properties/${item.property.id}`}
        className="relative block aspect-[4/3] overflow-hidden"
      >
        <Image
          src={item.property.primaryPhotoUrl}
          alt={item.property.title}
          fill
          className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        <Badge className="absolute left-3 top-3 gap-1 border-0 bg-kaza-navy/90 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur">
          {typeLabel}
        </Badge>

        <div className="absolute bottom-3 left-3 rounded-2xl bg-white/95 px-3.5 py-2 shadow-lg backdrop-blur-md">
          <div className="flex items-baseline gap-1">
            <span className="font-heading text-base font-bold text-kaza-navy">
              {formatPrice(item.property.price)}
            </span>
            <span className="text-[11px] font-medium text-muted-foreground">
              /mois
            </span>
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <Link href={`/properties/${item.property.id}`}>
          <h3 className="font-heading line-clamp-2 text-base font-semibold leading-tight text-foreground transition-colors group-hover:text-kaza-blue sm:text-lg">
            {item.property.title}
          </h3>
        </Link>

        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0 text-kaza-blue" />
          <span className="line-clamp-1">{item.property.address}</span>
        </div>

        {/* Specs */}
        <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3 text-xs text-muted-foreground">
          {item.property.bedrooms > 0 && (
            <span className="inline-flex items-center gap-1">
              <Bed className="size-3.5" /> {item.property.bedrooms} ch.
            </span>
          )}
          {item.property.bathrooms > 0 && (
            <span className="inline-flex items-center gap-1">
              <Bath className="size-3.5" /> {item.property.bathrooms} sdb
            </span>
          )}
          {item.property.sqm > 0 && (
            <span className="inline-flex items-center gap-1">
              <Maximize className="size-3.5" /> {item.property.sqm} m²
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="mt-auto flex gap-2 pt-2">
          <Button
            asChild
            size="sm"
            className="flex-1 bg-kaza-blue hover:bg-kaza-blue/90"
          >
            <Link href={`/properties/${item.property.id}`}>
              Voir
              <ArrowRight className="ml-1 size-3.5" />
            </Link>
          </Button>
          <form action={removeAction}>
            <Button
              type="submit"
              size="sm"
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              title="Retirer des favoris"
            >
              <Trash2 className="size-3.5" />
              <span className="sr-only">Retirer des favoris</span>
            </Button>
          </form>
        </div>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Empty state premium
// ---------------------------------------------------------------------------

function EmptyStateSaved() {
  return (
    <div className="rounded-3xl border border-dashed border-gray-200 bg-gradient-to-br from-white via-kaza-blue/5 to-kaza-navy/5 py-16 text-center sm:py-24">
      <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-lg">
        <Heart className="size-12 text-gray-300" strokeWidth={1.5} />
      </div>
      <h2 className="font-heading text-xl font-semibold text-kaza-navy sm:text-2xl">
        Aucune propriété sauvegardée
      </h2>
      <p className="mx-auto mt-3 max-w-md px-6 text-sm text-muted-foreground">
        Parcourez les annonces et cliquez sur le cœur pour les retrouver
        facilement ici.
      </p>
      <div className="mt-8">
        <Button
          asChild
          size="lg"
          className="bg-kaza-blue hover:bg-kaza-blue/90"
        >
          <Link href="/properties">
            <Search className="mr-2 size-4" />
            Voir les annonces
          </Link>
        </Button>
      </div>
    </div>
  );
}
