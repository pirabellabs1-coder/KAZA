"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Bath,
  Bed,
  Building2,
  Eye,
  Maximize,
  MapPin,
  Pencil,
  Rocket,
  Search,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatFcfa } from "@/lib/utils";
import type { OwnerProperty } from "@/lib/queries/owner-properties";

const DEFAULT_PHOTO =
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80";
const TYPE_LABELS: Record<string, string> = {
  APARTMENT: "Appartement",
  HOUSE: "Maison",
  VILLA: "Villa",
  STUDIO: "Studio",
  ROOM: "Chambre",
  OFFICE: "Bureau",
};
const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Disponible",
  RENTED: "Loué",
  DRAFT: "Brouillon",
  RESERVED: "Réservé",
  OFF_MARKET: "Hors marché",
  ARCHIVED: "Archivé",
};
const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  RENTED: "bg-kaza-blue/15 text-kaza-blue hover:bg-kaza-blue/15",
  DRAFT: "bg-slate-100 text-slate-600 hover:bg-slate-100",
  RESERVED: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  OFF_MARKET: "bg-muted text-muted-foreground",
  ARCHIVED: "bg-muted text-muted-foreground",
};

/** Déduit une "ville" depuis l'adresse (dernier segment après la virgule). */
function cityOf(address: string): string {
  const parts = address.split(",").map((s) => s.trim()).filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1]! : address.trim();
}

interface PortfolioBrowserProps {
  properties: OwnerProperty[];
}

export function PortfolioBrowser({ properties }: PortfolioBrowserProps) {
  const [tab, setTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");

  const total = properties.length;
  const available = properties.filter((p) => p.status === "AVAILABLE").length;
  const rented = properties.filter((p) => p.status === "RENTED").length;
  const draft = properties.filter((p) => p.status === "DRAFT").length;

  const typeOptions = useMemo(
    () => Array.from(new Set(properties.map((p) => p.type))).filter(Boolean),
    [properties],
  );
  const cityOptions = useMemo(
    () =>
      Array.from(new Set(properties.map((p) => cityOf(p.address))))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "fr")),
    [properties],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return properties.filter((p) => {
      if (tab !== "all" && p.status !== tab) return false;
      if (typeFilter !== "all" && p.type !== typeFilter) return false;
      if (cityFilter !== "all" && cityOf(p.address) !== cityFilter) return false;
      if (
        q &&
        !p.title.toLowerCase().includes(q) &&
        !p.address.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [properties, tab, typeFilter, cityFilter, search]);

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="space-y-4 p-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="flex w-full flex-wrap gap-2 bg-muted/50 p-1">
              <TabsTrigger value="all">Tous ({total})</TabsTrigger>
              <TabsTrigger value="AVAILABLE">
                Disponibles ({available})
              </TabsTrigger>
              <TabsTrigger value="RENTED">Loués ({rented})</TabsTrigger>
              <TabsTrigger value="DRAFT">Brouillons ({draft})</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par titre, ville, quartier..."
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Type de bien" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {typeOptions.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TYPE_LABELS[t] ?? t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Ville" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les villes</SelectItem>
                {cityOptions.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Résultats */}
      {filtered.length === 0 ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
              <Building2 className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-kaza-navy">
              Aucune annonce ne correspond à ces filtres.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTab("all");
                setSearch("");
                setTypeFilter("all");
                setCityFilter("all");
              }}
            >
              Réinitialiser les filtres
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {filtered.length} annonce{filtered.length > 1 ? "s" : ""} affichée
            {filtered.length > 1 ? "s" : ""}
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PropertyCard({ property }: { property: OwnerProperty }) {
  const photo = property.primaryPhotoUrl ?? DEFAULT_PHOTO;
  const typeLabel = TYPE_LABELS[property.type] ?? property.type;
  const statusLabel = STATUS_LABELS[property.status] ?? property.status;
  const statusColor =
    STATUS_COLORS[property.status] ?? "bg-muted text-muted-foreground";

  return (
    <Card className="group overflow-hidden rounded-2xl border-0 shadow-sm transition hover:shadow-lg">
      <div className="relative h-[180px] w-full overflow-hidden bg-muted">
        <Image
          src={photo}
          alt={property.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3">
          <Badge className={statusColor}>{statusLabel}</Badge>
        </div>
      </div>

      <CardContent className="space-y-3 p-4">
        <div>
          <h3 className="line-clamp-1 font-semibold text-kaza-navy">
            {property.title}
          </h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3" />
            <span className="line-clamp-1">{property.address}</span>
            <span className="mx-1">·</span>
            <span className="font-medium text-foreground">{typeLabel}</span>
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {property.bedrooms > 0 && (
            <span className="flex items-center gap-1">
              <Bed className="size-3.5" />
              {property.bedrooms}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Bath className="size-3.5" />
            {property.bathrooms}
          </span>
          {property.sqm > 0 && (
            <span className="flex items-center gap-1">
              <Maximize className="size-3.5" />
              {property.sqm} m²
            </span>
          )}
        </div>

        <div className="flex items-end justify-between border-b pb-3">
          <div>
            <p className="text-lg font-bold text-kaza-navy">
              {formatFcfa(property.price)}
            </p>
            <p className="text-xs text-muted-foreground">/ mois</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Eye className="size-3.5" />
            {property.viewsCount.toLocaleString("fr-FR")} vues
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button asChild size="sm" variant="outline" className="flex-1">
            <Link href={`/owner/properties/${property.id}`}>
              <Eye className="mr-1 size-3.5" />
              Voir
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="flex-1">
            <Link href={`/owner/properties/${property.id}/edit`}>
              <Pencil className="mr-1 size-3.5" />
              Modifier
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="flex-1 bg-kaza-green text-white hover:bg-kaza-green/90"
          >
            <Link href={`/owner/promotion?propertyId=${property.id}`}>
              <Rocket className="mr-1 size-3.5" />
              Booster
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
