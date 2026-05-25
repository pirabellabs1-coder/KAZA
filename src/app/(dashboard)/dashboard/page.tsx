import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  Building2,
  CalendarCheck,
  Heart,
  Wallet,
} from "lucide-react";

import { StatsCard } from "@/components/dashboard/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchWithFallback } from "@/lib/data-fetcher";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getOwnerStats } from "@/lib/supabase/queries";
import {
  getPaymentsByUserId,
  getPropertiesByOwner,
  getSavedPropertyIds,
  mockVisitRequests,
} from "@/lib/mock-data";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Tableau de bord",
};

// Mocks pour le mode sans Supabase (les IDs sont alignés sur mock-data.ts)
const MOCK_OWNER_ID = "u-002-owner-jean";
const MOCK_TENANT_ID = "u-004-tenant-thomas";

interface OwnerOverview {
  totalProperties: number;
  activeListings: number;
  pendingVisits: number;
  totalRevenue: number;
}

interface TenantOverview {
  favoritesCount: number;
  pendingPayments: number;
  pendingAmount: number;
}

async function loadOwnerOverview(userId: string): Promise<OwnerOverview> {
  return fetchWithFallback<OwnerOverview>(
    async () => getOwnerStats(userId),
    () => {
      const properties = getPropertiesByOwner(MOCK_OWNER_ID);
      const active = properties.filter((p) => p.status === "AVAILABLE").length;
      const propertyIds = new Set(properties.map((p) => p.id));
      const pendingVisits = mockVisitRequests.filter(
        (v) => propertyIds.has(v.property_id) && v.status === "PENDING"
      ).length;
      return {
        totalProperties: properties.length,
        activeListings: active,
        pendingVisits,
        totalRevenue: 0,
      };
    }
  );
}

async function loadTenantOverview(userId: string): Promise<TenantOverview> {
  return fetchWithFallback<TenantOverview>(
    async () => {
      const supabase = await createClient();
      const [favRes, payRes] = await Promise.all([
        supabase
          .from("saved_properties")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
        supabase
          .from("payments")
          .select("amount, status")
          .eq("user_id", userId)
          .eq("status", "PENDING"),
      ]);
      const pendingAmount = (payRes.data ?? []).reduce(
        (sum, p: { amount: number | null }) => sum + Number(p.amount ?? 0),
        0
      );
      return {
        favoritesCount: favRes.count ?? 0,
        pendingPayments: payRes.data?.length ?? 0,
        pendingAmount,
      };
    },
    () => {
      const favs = getSavedPropertyIds(MOCK_TENANT_ID).length;
      const pending = getPaymentsByUserId(MOCK_TENANT_ID).filter(
        (p) => p.status === "PENDING"
      );
      return {
        favoritesCount: favs,
        pendingPayments: pending.length,
        pendingAmount: pending.reduce((sum, p) => sum + p.amount, 0),
      };
    }
  );
}

export default async function DashboardPage() {
  const user = await fetchWithFallback(
    async () => getCurrentUser(),
    () => null
  );

  // Si pas de session, redirection legacy vers l'espace propriétaire.
  if (!user) {
    redirect("/owner/properties");
    return null;
  }

  // À ce stade `user` est garanti non-null.
  const currentUser: NonNullable<typeof user> = user;

  if (currentUser.role === "OWNER") {
    const stats = await loadOwnerOverview(currentUser.id);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Bonjour {currentUser.first_name},
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Voici un aperçu de votre activité propriétaire.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Annonces actives"
            value={stats.activeListings}
            icon={Building2}
            subtitle={`${stats.totalProperties} bien${stats.totalProperties > 1 ? "s" : ""} au total`}
          />
          <StatsCard
            title="Visites en attente"
            value={stats.pendingVisits}
            icon={CalendarCheck}
            subtitle={stats.pendingVisits > 0 ? "À traiter" : "Tout est à jour"}
          />
          <StatsCard
            title="Revenu encaissé"
            value={formatPrice(stats.totalRevenue)}
            icon={Wallet}
            trend={{ label: "Cumulé", type: "neutral" }}
          />
          <StatsCard
            title="Total propriétés"
            value={stats.totalProperties}
            icon={Building2}
          />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Accès rapides</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Consultez vos <a href="/owner/properties" className="font-medium text-kaza-blue hover:underline">propriétés</a>, vos <a href="/owner/visits" className="font-medium text-kaza-blue hover:underline">demandes de visite</a> ou vos <a href="/owner/payments" className="font-medium text-kaza-blue hover:underline">paiements</a>.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentUser.role === "TENANT" || currentUser.role === "STUDENT") {
    const stats = await loadTenantOverview(currentUser.id);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Bonjour {currentUser.first_name},
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Voici un aperçu de votre espace locataire.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            title="Favoris"
            value={stats.favoritesCount}
            icon={Heart}
            subtitle="Biens enregistrés"
          />
          <StatsCard
            title="Paiements en attente"
            value={stats.pendingPayments}
            icon={Wallet}
            subtitle={
              stats.pendingAmount > 0
                ? formatPrice(stats.pendingAmount)
                : "Aucun"
            }
          />
          <StatsCard
            title="Recherche"
            value="Explorer"
            icon={Building2}
            subtitle="Trouvez votre prochain logement"
          />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Accès rapides</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Consultez vos <a href="/tenant/favorites" className="font-medium text-kaza-blue hover:underline">favoris</a>, l&apos;<a href="/tenant/payments" className="font-medium text-kaza-blue hover:underline">historique de paiements</a> ou <a href="/search" className="font-medium text-kaza-blue hover:underline">cherchez un bien</a>.
          </CardContent>
        </Card>
      </div>
    );
  }

  // Rôle ADMIN ou inconnu : redirection legacy.
  redirect("/owner/properties");
}
