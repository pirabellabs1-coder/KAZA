import type { Metadata } from "next";
import {
  Building2,
  Users,
  TrendingUp,
  BarChart3,
  Clock,
  CheckCircle,
  MapPin,
  ArrowRight,
} from "lucide-react";

import { StatsCard } from "@/components/dashboard/stats-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchWithFallback } from "@/lib/data-fetcher";
import {
  getOwnerStats,
  getCurrentUser,
  type OwnerStats,
} from "@/lib/supabase/queries/users";
import {
  mockPayments,
  mockRentals,
  mockVisitRequests,
  getPropertiesByOwner,
} from "@/lib/mock-data";
import { formatPrice, getInitials } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Statistiques",
};

// Fallback dev quand Supabase est absent.
const MOCK_OWNER_ID = "u-002-owner-jean";

// Placeholder recent requests for the sidebar panel (kept as design fixture,
// pas encore branche sur la DB).
const recentRequests = [
  {
    id: "1",
    name: "Thomas Leroy",
    avatar: null,
    property: "Appartement 3ch Cadjehoun",
    type: "Visite",
    time: "il y a 2h",
  },
  {
    id: "2",
    name: "Fatou Diallo",
    avatar: null,
    property: "Villa 4ch Calavi",
    type: "Location",
    time: "il y a 5h",
  },
  {
    id: "3",
    name: "Amadou Sow",
    avatar: null,
    property: "Studio Akpakpa",
    type: "Visite",
    time: "hier",
  },
  {
    id: "4",
    name: "Marie Ahoussou",
    avatar: null,
    property: "Chambre Ganhi",
    type: "Location",
    time: "il y a 2j",
  },
];

// ---------------------------------------------------------------------------
// Chargement Supabase + fallback mock
// ---------------------------------------------------------------------------

function computeMockStats(): OwnerStats {
  const ownerProperties = getPropertiesByOwner(MOCK_OWNER_ID);
  const propertyIds = new Set(ownerProperties.map((p) => p.id));

  const activeListings = ownerProperties.filter(
    (p) => p.status === "AVAILABLE",
  ).length;

  const pendingVisits = mockVisitRequests.filter(
    (v) => propertyIds.has(v.property_id) && v.status === "PENDING",
  ).length;

  const ownerRentalIds = new Set(
    mockRentals
      .filter((r) => propertyIds.has(r.property_id))
      .map((r) => r.id),
  );

  const totalRevenue = mockPayments
    .filter(
      (p) => ownerRentalIds.has(p.rental_id) && p.status === "COMPLETED",
    )
    .reduce((sum, p) => sum + p.amount, 0);

  return {
    totalProperties: ownerProperties.length,
    activeListings,
    pendingVisits,
    totalRevenue,
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function OwnerAnalyticsPage() {
  const stats = await fetchWithFallback<OwnerStats>(
    async () => {
      const user = await getCurrentUser();
      if (!user) return computeMockStats();
      return getOwnerStats(user.id);
    },
    () => computeMockStats(),
  );

  const rentedCount = Math.max(
    stats.totalProperties - stats.activeListings,
    0,
  );
  const occupancyRate =
    stats.totalProperties > 0
      ? Math.round((rentedCount / stats.totalProperties) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Statistiques
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vue d&apos;ensemble de vos performances
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Taux d'occupation"
          value={`${occupancyRate}%`}
          icon={TrendingUp}
          subtitle={`${rentedCount} sur ${stats.totalProperties} biens loués`}
        />
        <StatsCard
          title="Visites en attente"
          value={stats.pendingVisits}
          icon={Clock}
          subtitle="Demandes à traiter"
        />
        <StatsCard
          title="Nombre de propriétés"
          value={stats.totalProperties}
          icon={Building2}
          subtitle={`${stats.activeListings} disponible${stats.activeListings > 1 ? "s" : ""}, ${rentedCount} loué${rentedCount > 1 ? "s" : ""}`}
        />
      </div>

      {/* Revenue summary */}
      <div className="grid gap-4 sm:grid-cols-1">
        <StatsCard
          title="Revenus totaux encaissés"
          value={formatPrice(stats.totalRevenue)}
          icon={TrendingUp}
          trend={{ label: "Cumul historique", type: "neutral" }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue chart placeholder */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-5 text-kaza-navy" />
              Revenus mensuels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30">
              <div className="text-center">
                <BarChart3 className="mx-auto mb-3 size-10 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">
                  Graphique des revenus
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Intégration Chart.js / Recharts à venir
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent tenant requests sidebar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5 text-kaza-navy" />
              Demandes locataires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentRequests.map((request) => (
                <div key={request.id} className="flex items-start gap-3">
                  <Avatar>
                    <AvatarImage src={request.avatar || undefined} />
                    <AvatarFallback className="bg-kaza-navy text-white text-xs">
                      {getInitials(
                        request.name.split(" ")[0],
                        request.name.split(" ")[1] || "",
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{request.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {request.property}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0"
                      >
                        {request.type}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {request.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              <Button variant="outline" className="w-full" size="sm">
                Voir toutes les demandes
                <ArrowRight className="ml-2 size-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Occupancy breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition par statut</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-4 text-center">
              <div className="mb-2 flex items-center justify-center">
                <CheckCircle className="size-8 text-kaza-green" />
              </div>
              <p className="text-2xl font-bold">{rentedCount}</p>
              <p className="text-sm text-muted-foreground">Biens loués</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <div className="mb-2 flex items-center justify-center">
                <Clock className="size-8 text-kaza-warning" />
              </div>
              <p className="text-2xl font-bold">{stats.activeListings}</p>
              <p className="text-sm text-muted-foreground">Biens disponibles</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <div className="mb-2 flex items-center justify-center">
                <MapPin className="size-8 text-kaza-blue" />
              </div>
              <p className="text-2xl font-bold">{stats.totalProperties}</p>
              <p className="text-sm text-muted-foreground">
                Biens au catalogue
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
