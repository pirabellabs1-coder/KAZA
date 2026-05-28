import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Plus,
  Download,
  Search,
  Bed,
  Bath,
  Maximize,
  Eye,
  Pencil,
  Rocket,
  TrendingUp,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Archive,
  MapPin,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";

// Fallback vide — à brancher quand la table subscriptions/plans sera en place.
const AGENCY_PLAN = {
  name: "—",
  quota: {
    activeListings: { used: 0, max: 0 },
  },
};
import {
  getOwnerPortfolioStats,
  listPropertiesByOwner,
  type OwnerProperty,
} from "@/lib/queries/owner-properties";

export const metadata: Metadata = {
  title: "Portefeuille — KAZA Agence",
  description:
    "Visualisez et pilotez toutes les annonces gérées par votre agence.",
};

// ---------------------------------------------------------------------------
// Helpers / Référentiels
// ---------------------------------------------------------------------------

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

function formatFcfa(value: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(value)} FCFA`;
}

function pct(part: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AgencyPortfolioPage() {
  const user = await getCurrentDisplayUser();
  if (!user) {
    redirect("/login");
  }

  const [properties, stats] = await Promise.all([
    listPropertiesByOwner(user.id),
    getOwnerPortfolioStats(user.id),
  ]);

  const total = stats.total;
  const available = stats.available;
  const rented = stats.rented;
  const draft = stats.draft;

  // Quota plan Pro (vraies données viendront de la table subscriptions)
  const quota = AGENCY_PLAN.quota.activeListings;
  const quotaUsed = available + rented; // annonces "actives"
  const quotaPct = quota.max > 0 ? Math.round((quotaUsed / quota.max) * 100) : 0;
  const quotaWarn = quotaPct >= 90;

  const isEmpty = total === 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-kaza-navy">
            Portefeuille
          </h1>
          <p className="mt-1 text-muted-foreground">
            {quotaUsed} annonces actives sur {quota.max} — quota{" "}
            <span className="font-medium text-kaza-navy">
              {AGENCY_PLAN.name}
            </span>
          </p>
          {/* Barre de progression quota */}
          <div className="mt-4 max-w-xl">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Utilisation du quota
              </span>
              <span
                className={`font-semibold ${
                  quotaWarn ? "text-amber-600" : "text-kaza-navy"
                }`}
              >
                {quotaPct}%
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${
                  quotaWarn
                    ? "bg-amber-500"
                    : "bg-gradient-to-r from-kaza-blue to-kaza-green"
                }`}
                style={{ width: `${Math.min(quotaPct, 100)}%` }}
              />
            </div>
            {quotaWarn && (
              <p className="mt-2 text-xs text-amber-700">
                Vous approchez de la limite. Pensez à passer au plan supérieur.
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={isEmpty}>
            <Download className="mr-2 size-4" />
            Exporter CSV
          </Button>
          <Button
            asChild
            className="bg-kaza-navy text-white hover:bg-kaza-navy/90"
          >
            <Link href="/owner/properties/new">
              <Plus className="mr-2 size-4" />
              Ajouter une annonce
            </Link>
          </Button>
        </div>
      </div>

      {!isEmpty && (
        <>
          {/* Stats row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatPill
              icon={<CheckCircle2 className="size-5 text-kaza-green" />}
              label="Disponibles"
              value={available}
              subtitle={`${pct(available, total)} du total`}
              tone="green"
            />
            <StatPill
              icon={<Building2 className="size-5 text-kaza-blue" />}
              label="Loués"
              value={rented}
              subtitle={`${pct(rented, total)} du total`}
              tone="blue"
            />
            <StatPill
              icon={<Clock className="size-5 text-amber-600" />}
              label="Brouillons"
              value={draft}
              subtitle={`${pct(draft, total)} du total`}
              tone="amber"
            />
            <StatPill
              icon={<Archive className="size-5 text-muted-foreground" />}
              label="Vues cumulées"
              value={stats.totalViews}
              subtitle="Depuis publication"
              tone="muted"
            />
          </div>

          {/* Filtres */}
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="space-y-4 p-4">
              <Tabs defaultValue="all">
                <TabsList className="flex w-full flex-wrap gap-2 bg-muted/50 p-1">
                  <TabsTrigger value="all">Tous ({total})</TabsTrigger>
                  <TabsTrigger value="available">
                    Disponibles ({available})
                  </TabsTrigger>
                  <TabsTrigger value="rented">Loués ({rented})</TabsTrigger>
                  <TabsTrigger value="draft">Brouillons ({draft})</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-0" />
              </Tabs>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par titre, ville, quartier..."
                    className="pl-9"
                  />
                </div>
                <Button variant="outline" size="sm">
                  Type de bien
                </Button>
                <Button variant="outline" size="sm">
                  Ville
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Grid cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>

          {/* Footer global */}
          <Card className="rounded-2xl border-0 bg-gradient-to-br from-kaza-navy via-kaza-navy/95 to-kaza-blue text-white shadow-lg">
            <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-white/15">
                  <TrendingUp className="size-6 text-emerald-300" />
                </div>
                <div>
                  <p className="font-heading text-lg font-semibold">
                    Performance globale du portefeuille
                  </p>
                  <p className="mt-1 text-sm text-white/80">
                    {total} annonces générant{" "}
                    <span className="font-semibold text-white">
                      {stats.totalViews.toLocaleString("fr-FR")}
                    </span>{" "}
                    vues — revenu potentiel{" "}
                    <span className="font-semibold text-emerald-300">
                      {formatFcfa(stats.totalMonthlyRevenuePotential)}
                    </span>{" "}
                    / mois
                  </p>
                </div>
              </div>
              <Link
                href="/agency/analytics"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-kaza-navy transition hover:bg-white/90"
              >
                Voir les analytics
                <ArrowRight className="size-4" />
              </Link>
            </CardContent>
          </Card>
        </>
      )}

      {isEmpty && <EmptyState />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sous-composants
// ---------------------------------------------------------------------------

interface StatPillProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  subtitle: string;
  tone: "green" | "blue" | "amber" | "muted";
}

function StatPill({ icon, label, value, subtitle, tone }: StatPillProps) {
  const bg =
    tone === "green"
      ? "bg-emerald-50"
      : tone === "blue"
        ? "bg-kaza-blue/10"
        : tone === "amber"
          ? "bg-amber-50"
          : "bg-muted";

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div
            className={`flex size-10 items-center justify-center rounded-xl ${bg}`}
          >
            {icon}
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-bold text-kaza-navy">
          {value.toLocaleString("fr-FR")}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
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
      {/* Image */}
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

      {/* Contenu */}
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

        {/* Specs */}
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

        {/* Prix */}
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

        {/* Actions */}
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

function EmptyState() {
  return (
    <Card className="rounded-2xl border-dashed border-2 border-border bg-gradient-to-br from-white via-muted/20 to-kaza-blue/[0.04] shadow-sm">
      <CardContent className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="flex size-20 items-center justify-center rounded-2xl bg-kaza-blue/10">
          <Building2 className="size-10 text-kaza-blue" />
        </div>
        <h2 className="mt-6 font-heading text-2xl font-bold text-kaza-navy">
          Aucune propriété enregistrée
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Votre agence n&apos;a encore publié aucune annonce. Lancez votre
          portefeuille en moins de 5 minutes avec votre première mise en ligne.
        </p>
        <Button
          asChild
          size="lg"
          className="mt-8 h-12 bg-kaza-navy px-8 text-base text-white shadow-md hover:bg-kaza-navy/90"
        >
          <Link href="/owner/properties/new">
            <Plus className="mr-2 size-5" />
            Publier la première annonce
          </Link>
        </Button>
        <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Archive className="size-3.5" />
          Vos brouillons restent privés tant que vous ne les publiez pas.
        </p>
      </CardContent>
    </Card>
  );
}
