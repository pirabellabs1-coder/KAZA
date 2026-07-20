import "server-only";

// =============================================================================
// Kaabo — Analytics consolidées du tableau de bord propriétaire
// Assemble des briques déjà branchées sur Supabase (revenus mensuels, avis
// reçus, vues par bien, visites, paiements) pour alimenter les graphes du
// dashboard owner avec des données 100% réelles. Best-effort : toute erreur
// dégrade en tableau vide sans casser la page.
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  getOwnerMonthlyRevenue,
  type MonthlyRevenuePoint,
} from "./owner-revenue";
import { listOwnerReceivedReviews } from "./reviews";
import { getOwnerPropertyViews30d } from "./analytics";
import { listOwnerVisits, listOwnerPayments } from "./owner-activity";

export interface OwnerReviewsBreakdownPoint {
  rating: number;
  count: number;
}

export interface OwnerTopProperty {
  title: string;
  views: number;
  contacts: number;
  visits: number;
  revenue: number;
}

export interface OwnerVisitsFunnelPoint {
  stage: string;
  value: number;
  color: string;
}

export interface OwnerDashboardAnalytics {
  monthlyRevenue: MonthlyRevenuePoint[];
  reviewsBreakdown: OwnerReviewsBreakdownPoint[];
  topProperties: OwnerTopProperty[];
  visitsFunnel: OwnerVisitsFunnelPoint[];
}

const EMPTY: OwnerDashboardAnalytics = {
  monthlyRevenue: [],
  reviewsBreakdown: [],
  topProperties: [],
  visitsFunnel: [],
};

const up = (s: string | null | undefined): string =>
  (s ?? "").toUpperCase();

export async function getOwnerDashboardAnalytics(
  ownerId: string,
): Promise<OwnerDashboardAnalytics> {
  if (!ownerId) return EMPTY;

  const [monthlyRevenue, reviews, viewsData, visits, payments] =
    await Promise.all([
      getOwnerMonthlyRevenue(ownerId).catch(() => []),
      listOwnerReceivedReviews(ownerId).catch(() => []),
      getOwnerPropertyViews30d(ownerId).catch(() => ({
        totalViews: 0,
        totalContacts: 0,
        totalFavorites: 0,
        viewsByProperty: [] as Array<{
          propertyId: string;
          title: string;
          views: number;
        }>,
      })),
      listOwnerVisits(ownerId).catch(() => []),
      listOwnerPayments(ownerId).catch(() => []),
    ]);

  // --- Répartition des avis par note (5 → 1) -------------------------------
  const ratingCounts = new Map<number, number>();
  for (const r of reviews) {
    const k = Math.round(Number(r.rating));
    if (k >= 1 && k <= 5) ratingCounts.set(k, (ratingCounts.get(k) ?? 0) + 1);
  }
  const totalReviews = Array.from(ratingCounts.values()).reduce(
    (a, b) => a + b,
    0,
  );
  const reviewsBreakdown: OwnerReviewsBreakdownPoint[] =
    totalReviews === 0
      ? []
      : [5, 4, 3, 2, 1].map((rating) => ({
          rating,
          count: ratingCounts.get(rating) ?? 0,
        }));

  // --- Funnel visites : Demandes → Acceptées → Réalisées -------------------
  const totalVisits = visits.length;
  const acceptedVisits = visits.filter((v) =>
    ["ACCEPTED", "CONFIRMED", "COMPLETED", "DONE"].includes(up(v.status)),
  ).length;
  const completedVisits = visits.filter((v) =>
    ["COMPLETED", "DONE"].includes(up(v.status)),
  ).length;
  const visitsFunnel: OwnerVisitsFunnelPoint[] =
    totalVisits === 0
      ? []
      : [
          { stage: "Demandes", value: totalVisits, color: "#1976D2" },
          { stage: "Acceptées", value: acceptedVisits, color: "#4CAF50" },
          { stage: "Réalisées", value: completedVisits, color: "#1A3A52" },
        ];

  // --- Top 5 biens : vues (réel) + visites + revenu + contacts -------------
  const visitsByProp = new Map<string, number>();
  for (const v of visits) {
    visitsByProp.set(v.propertyId, (visitsByProp.get(v.propertyId) ?? 0) + 1);
  }
  const revenueByTitle = new Map<string, number>();
  for (const p of payments) {
    if (up(p.status) === "COMPLETED") {
      revenueByTitle.set(
        p.propertyTitle,
        (revenueByTitle.get(p.propertyTitle) ?? 0) + Number(p.amount || 0),
      );
    }
  }

  const topRaw = viewsData.viewsByProperty.slice(0, 5);
  const topIds = topRaw.map((p) => p.propertyId);

  // Contacts par bien (events PROPERTY_CONTACT) — borné aux 5 biens du top.
  const contactsByProp = new Map<string, number>();
  if (topIds.length > 0) {
    try {
      const admin = createAdminClient() as unknown as SupabaseClient;
      const { data: events } = await admin
        .from("analytics_events")
        .select("metadata")
        .eq("event_type", "PROPERTY_CONTACT")
        .filter(
          "metadata->>property_id",
          "in",
          `(${topIds.map((id) => `"${id}"`).join(",")})`,
        );
      for (const e of (events ?? []) as Array<{
        metadata: { property_id?: string } | null;
      }>) {
        const pid = e.metadata?.property_id;
        if (pid) contactsByProp.set(pid, (contactsByProp.get(pid) ?? 0) + 1);
      }
    } catch {
      // best-effort : contacts à 0 si l'agrégation échoue.
    }
  }

  const topProperties: OwnerTopProperty[] = topRaw.map((p) => ({
    title: p.title,
    views: p.views,
    contacts: contactsByProp.get(p.propertyId) ?? 0,
    visits: visitsByProp.get(p.propertyId) ?? 0,
    revenue: revenueByTitle.get(p.title) ?? 0,
  }));

  return { monthlyRevenue, reviewsBreakdown, topProperties, visitsFunnel };
}
