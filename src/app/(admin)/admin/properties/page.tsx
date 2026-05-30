import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Eye,
  EyeOff,
  Flag,
  ShieldAlert,
  Sparkles,
  Trash2,
  TrendingUp,
  Clock,
  ListChecks,
  MapPin,
  ShieldCheck,
  Building2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import { formatFcfa, formatNumber } from "@/lib/utils";
import { COUNTRIES } from "@/lib/geo/locations";
import {
  listAllProperties,
  listPropertiesToReview,
  getAdminStats,
  type AdminPropertyRow,
} from "@/lib/queries/admin";

import { PropertyReviewModal } from "./property-review-modal";

export const metadata: Metadata = {
  title: "Modération des annonces — KAZA Admin",
  description: "Modération, signalements et mise en avant des annonces.",
};

// Force dynamic — toujours afficher l'état réel de la base.
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PROPERTY_TYPES = [
  "VILLA",
  "APARTMENT",
  "HOUSE",
  "STUDIO",
  "ROOM",
  "SHARED_ROOM",
  "COMMERCIAL",
  "LAND",
] as const;

const TYPE_LABELS: Record<string, string> = {
  VILLA: "Villa",
  APARTMENT: "Appartement",
  HOUSE: "Maison",
  STUDIO: "Studio",
  ROOM: "Chambre",
  SHARED_ROOM: "Colocation",
  COMMERCIAL: "Commercial",
  LAND: "Terrain",
};

const STATUS_BADGE: Record<
  string,
  { label: string; classes: string }
> = {
  AVAILABLE: {
    label: "Publiée",
    classes: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  RENTED: {
    label: "Louée",
    classes: "bg-blue-100 text-blue-700 border-blue-200",
  },
  PENDING_REVIEW: {
    label: "À modérer",
    classes: "bg-amber-100 text-amber-700 border-amber-200",
  },
  DRAFT: {
    label: "Brouillon",
    classes: "bg-slate-100 text-slate-600 border-slate-200",
  },
  UNAVAILABLE: {
    label: "Hors marché",
    classes: "bg-slate-100 text-slate-600 border-slate-200",
  },
  ARCHIVED: {
    label: "Archivée",
    classes: "bg-slate-100 text-slate-500 border-slate-200",
  },
};

interface ListingRow {
  id: string;
  title: string;
  type: string;
  city: string;
  country: string;
  priceFcfa: number;
  ownerName: string;
  ownerId: string;
  status: keyof typeof STATUS_BADGE;
  views: number;
  contacts: number;
  photo: string;
  premium?: boolean;
}

// Adapter Supabase → shape locale ListingRow.
function toListingRow(p: AdminPropertyRow): ListingRow {
  return {
    id: p.id,
    title: p.title,
    type: p.propertyType,
    city: p.address ?? "—",
    country: "BJ",
    priceFcfa: p.price,
    ownerName: p.owner
      ? `${p.owner.firstName} ${p.owner.lastName}`.trim() || "—"
      : "Propriétaire inconnu",
    ownerId: p.owner?.id ?? "",
    status: p.status as keyof typeof STATUS_BADGE,
    views: p.viewsCount,
    contacts: 0,
    photo: p.primaryPhotoUrl,
  };
}

// Affichage relatif "il y a Xh / Xj"
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "il y a < 1h";
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `il y a ${d}j`;
}

// Signalements / boosts — tables `property_reports` et `property_boosts`
// non encore branchées. Empty state propre en attendant.
interface ReportedListing {
  id: string;
  title: string;
  city: string;
  ownerName: string;
  photo: string;
  priceFcfa: number;
  reason: string;
  reportsCount: number;
}

const reportedListings: ReportedListing[] = [];

interface PremiumBoost {
  id: string;
  title: string;
  ownerName: string;
  city: string;
  daysLeft: number;
  pricePaidFcfa: number;
  views: number;
  contacts: number;
}

const premiumBoosts: PremiumBoost[] = [];

function StatusPill({ status }: { status: keyof typeof STATUS_BADGE }) {
  const cfg = STATUS_BADGE[status]!;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.classes}`}
    >
      {cfg.label}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
  accent?: "amber" | "red" | "green" | "blue" | "slate";
}) {
  const colorMap: Record<string, string> = {
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    green: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="flex items-start gap-4">
        <div
          className={`flex size-10 items-center justify-center rounded-xl ${
            accent ? colorMap[accent] : "bg-kaza-navy/10 text-kaza-navy"
          }`}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="font-heading text-lg font-bold text-kaza-navy">
            {value}
          </p>
          {hint && (
            <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function AdminPropertiesPage() {
  // ----- Données Supabase réelles -----
  const [adminStats, reviewProps, allPropsRaw] = await Promise.all([
    getAdminStats(),
    listPropertiesToReview(12),
    listAllProperties({ limit: 200 }),
  ]);

  const pendingReview = reviewProps.map(toListingRow);
  const extendedListings = allPropsRaw.map(toListingRow);

  const stats = {
    total: adminStats.totalProperties,
    published: adminStats.propertiesByStatus.AVAILABLE,
    pending:
      adminStats.propertiesByStatus.PENDING_REVIEW +
      adminStats.propertiesByStatus.DRAFT,
    rented: adminStats.propertiesByStatus.RENTED,
    hidden:
      adminStats.propertiesByStatus.UNAVAILABLE +
      adminStats.propertiesByStatus.ARCHIVED,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-bold text-kaza-navy lg:text-3xl">
          Modération des annonces
        </h1>
        <p className="text-sm text-muted-foreground">
          {formatNumber(stats.total)} annonces ·{" "}
          {stats.pending} en attente de modération
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard
          icon={ListChecks}
          label="Total annonces"
          value={formatNumber(stats.total)}
          hint="Toute la plateforme"
          accent="blue"
        />
        <StatCard
          icon={CheckCircle2}
          label="Publiées"
          value={formatNumber(stats.published)}
          hint="Visibles publiquement"
          accent="green"
        />
        <StatCard
          icon={Clock}
          label="À modérer"
          value={String(stats.pending)}
          hint="Brouillons + en attente"
          accent="amber"
        />
        <StatCard
          icon={Building2}
          label="Louées"
          value={formatNumber(stats.rented)}
          hint="Sous contrat actif"
          accent="blue"
        />
        <StatCard
          icon={EyeOff}
          label="Hors marché"
          value={String(stats.hidden)}
          hint="Indisponibles / archivées"
          accent="slate"
        />
      </div>

      {/* Priority pending review */}
      <Card className="rounded-2xl border-amber-200 bg-amber-50/60 shadow-sm">
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <ShieldAlert className="size-5" />
          </div>
          <div>
            <CardTitle className="font-heading text-lg text-kaza-navy">
              À modérer en priorité
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Annonces soumises ces dernières heures · trier par ancienneté
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {pendingReview.length === 0 ? (
            <div className="rounded-xl border border-dashed border-amber-300 bg-white/60 p-8 text-center">
              <CheckCircle2 className="mx-auto size-8 text-emerald-500" />
              <p className="mt-3 text-sm font-semibold text-kaza-navy">
                File de modération vide
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Aucune annonce en attente de validation. Tout est à jour.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {pendingReview.map((l, idx) => {
                const sourceRow = reviewProps[idx];
                return (
                  <div
                    key={l.id}
                    className="flex flex-col gap-3 rounded-xl border border-amber-200/60 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                        <Image
                          src={l.photo}
                          alt={l.title}
                          fill
                          sizes="64px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-kaza-navy">
                          {l.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          par <span className="font-medium">{l.ownerName}</span>
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3" /> {l.city}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-kaza-blue">
                          {formatFcfa(l.priceFcfa)}/mois
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1 text-amber-700">
                        <Clock className="size-3" />{" "}
                        {sourceRow ? timeAgo(sourceRow.createdAt) : "—"}
                      </span>
                      <PropertyReviewModal
                        listing={{
                          id: l.id,
                          title: l.title,
                          ownerName: l.ownerName,
                          city: l.city,
                          priceFcfa: l.priceFcfa,
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <form action="/admin/properties?action=approve">
                        <Button
                          type="submit"
                          className="w-full bg-kaza-green text-white hover:bg-kaza-green/90"
                        >
                          <CheckCircle2 className="mr-1 size-4" />
                          Approuver
                        </Button>
                      </form>
                      <form action="/admin/properties?action=reject">
                        <Button
                          type="submit"
                          variant="outline"
                          className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Ban className="mr-1 size-4" />
                          Rejeter
                        </Button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filtres + table principale */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-kaza-navy">
            Toutes les annonces
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
            <Input placeholder="Rechercher titre, ville, propriétaire..." className="lg:col-span-2" />
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {PROPERTY_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {Object.entries(STATUS_BADGE).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="Pays" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les pays</SelectItem>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-[1000px] w-full text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-3 text-left">Photo</th>
                  <th className="px-3 py-3 text-left">Titre</th>
                  <th className="px-3 py-3 text-left">Type</th>
                  <th className="px-3 py-3 text-left">Ville</th>
                  <th className="px-3 py-3 text-right">Prix</th>
                  <th className="px-3 py-3 text-left">Propriétaire</th>
                  <th className="px-3 py-3 text-left">Statut</th>
                  <th className="px-3 py-3 text-right">Vues</th>
                  <th className="px-3 py-3 text-right">Contacts</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {extendedListings.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-3 py-12 text-center text-sm text-muted-foreground"
                    >
                      Aucune annonce dans la base. Dès qu'un propriétaire
                      publie, elle s'affichera ici.
                    </td>
                  </tr>
                )}
                {extendedListings.map((l) => (
                  <tr key={l.id} className="hover:bg-muted/30">
                    <td className="px-3 py-3">
                      <div className="relative size-10 overflow-hidden rounded-lg bg-muted">
                        <Image
                          src={l.photo}
                          alt={l.title}
                          fill
                          sizes="40px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-kaza-navy">
                          {l.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          #{l.id}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant="secondary">
                        {TYPE_LABELS[l.type] ?? l.type}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {l.city}
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-kaza-navy">
                      {formatFcfa(l.priceFcfa)}
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        href={`/admin/users/${l.ownerId}`}
                        className="text-sm text-kaza-blue hover:underline"
                      >
                        {l.ownerName}
                      </Link>
                    </td>
                    <td className="px-3 py-3">
                      <StatusPill status={l.status} />
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {formatNumber(l.views)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {l.contacts}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          title="Voir"
                        >
                          <Link href={`/admin/properties/${l.id}`}>
                            <Eye className="size-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-amber-600 hover:bg-amber-50"
                          title="Mettre en avant"
                        >
                          <Sparkles className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-slate-600 hover:bg-slate-100"
                          title="Masquer"
                        >
                          <EyeOff className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-red-600 hover:bg-red-50"
                          title="Supprimer"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Signalements */}
      <Card className="rounded-2xl border-red-100 shadow-sm">
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <Flag className="size-5" />
          </div>
          <div>
            <CardTitle className="font-heading text-lg text-kaza-navy">
              Annonces signalées
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {reportedListings.length} cas remontés par la communauté
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {reportedListings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-red-200 bg-white/60 p-8 text-center">
              <Flag className="mx-auto size-8 text-red-300" />
              <p className="mt-3 text-sm font-semibold text-kaza-navy">
                Aucune annonce signalée
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Les signalements remontés par la communauté apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {reportedListings.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                      <Image
                        src={r.photo}
                        alt={r.title}
                        fill
                        sizes="56px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-kaza-navy">
                        {r.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.city} · {r.ownerName}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-kaza-blue">
                        {formatFcfa(r.priceFcfa)}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs">
                    <p className="font-medium text-red-700">
                      <AlertTriangle className="mr-1 inline size-3" />
                      Motif : {r.reason}
                    </p>
                    <p className="mt-0.5 text-red-600">
                      {r.reportsCount} signalements
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <Button size="sm" variant="outline" className="text-xs">
                      Vérifier
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-200 text-xs text-red-600 hover:bg-red-50"
                    >
                      Bannir
                    </Button>
                    <Button size="sm" variant="ghost" className="text-xs">
                      Conserver
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Premium / boosts */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Sparkles className="size-5" />
          </div>
          <div>
            <CardTitle className="font-heading text-lg text-kaza-navy">
              Annonces premium en cours
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {premiumBoosts.length} boosts actifs sur la plateforme
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {premiumBoosts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-amber-200 bg-white/60 p-8 text-center">
              <Sparkles className="mx-auto size-8 text-amber-300" />
              <p className="mt-3 text-sm font-semibold text-kaza-navy">
                Aucun boost actif
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Les annonces premium en cours apparaîtront ici dès qu&apos;un
                propriétaire achètera un boost.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border">
                <table className="min-w-[800px] w-full text-sm">
                  <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-3 py-3 text-left">Annonce</th>
                      <th className="px-3 py-3 text-left">Propriétaire</th>
                      <th className="px-3 py-3 text-left">Ville</th>
                      <th className="px-3 py-3 text-right">Durée restante</th>
                      <th className="px-3 py-3 text-right">Prix payé</th>
                      <th className="px-3 py-3 text-right">Vues</th>
                      <th className="px-3 py-3 text-right">Contacts</th>
                      <th className="px-3 py-3 text-left">Performance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {premiumBoosts.map((b) => {
                      const ctr =
                        b.views > 0
                          ? Math.round((b.contacts / b.views) * 1000) / 10
                          : 0;
                      return (
                        <tr key={b.id} className="hover:bg-muted/30">
                          <td className="px-3 py-3 font-medium text-kaza-navy">
                            {b.title}
                          </td>
                          <td className="px-3 py-3 text-muted-foreground">
                            {b.ownerName}
                          </td>
                          <td className="px-3 py-3 text-muted-foreground">
                            {b.city}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                                b.daysLeft <= 5
                                  ? "bg-red-50 text-red-600"
                                  : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              <Clock className="size-3" /> {b.daysLeft} j
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums">
                            {formatFcfa(b.pricePaidFcfa)}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums">
                            {formatNumber(b.views)}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums">
                            {b.contacts}
                          </td>
                          <td className="px-3 py-3">
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                              <TrendingUp className="size-3" /> CTR {ctr}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Separator className="my-4" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  <ShieldCheck className="mr-1 inline size-3 text-kaza-green" />
                  Boosts conformes à la grille tarifaire publique
                </span>
                <span>
                  Revenu boosts cumulés :{" "}
                  <strong className="text-kaza-navy">
                    {formatFcfa(
                      premiumBoosts.reduce(
                        (sum, b) => sum + b.pricePaidFcfa,
                        0,
                      ),
                    )}
                  </strong>
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
