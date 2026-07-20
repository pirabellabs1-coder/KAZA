import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

// =============================================================================
// Kaabo — Queries analytics agrégées
// =============================================================================

export interface DailyStat {
  day: string;
  sessions: number;
  events: number;
  pageViews: number;
  propertyViews: number;
  signups: number;
}

export interface EventTypeStat {
  eventType: string;
  count: number;
  uniqueUsers: number;
  uniqueSessions: number;
}

// Lignes brutes des vues SQL / tables (colonnes hors types générés).
interface ByTypeRow {
  event_type: string;
  count: number | string;
  unique_users: number | string;
  unique_sessions: number | string;
}
interface DailyRow {
  day: string;
  sessions: number | string;
  events: number | string;
  page_views: number | string;
  property_views: number | string;
  signups: number | string;
}
interface PropertyRow {
  id: string;
  title: string;
  views_count: number | null;
}

/** Stats globales plateforme — admin */
export async function getPlatformAnalytics30d(): Promise<{
  totalSessions: number;
  totalEvents: number;
  totalPageViews: number;
  totalPropertyViews: number;
  totalSignups: number;
  byEventType: EventTypeStat[];
  daily: DailyStat[];
}> {
  // Loose cast : vues analytics_* hors types générés Supabase.
  const supabase = (await createClient()) as unknown as SupabaseClient;

  const [byTypeRes, dailyRes] = await Promise.all([
    supabase.from("analytics_30d").select("*"),
    supabase.from("analytics_daily_30d").select("*"),
  ]);

  const byEventType: EventTypeStat[] = (
    (byTypeRes.data ?? []) as ByTypeRow[]
  ).map((r) => ({
    eventType: r.event_type,
    count: Number(r.count),
    uniqueUsers: Number(r.unique_users),
    uniqueSessions: Number(r.unique_sessions),
  }));

  const daily: DailyStat[] = ((dailyRes.data ?? []) as DailyRow[]).map((r) => ({
    day: r.day,
    sessions: Number(r.sessions),
    events: Number(r.events),
    pageViews: Number(r.page_views),
    propertyViews: Number(r.property_views),
    signups: Number(r.signups),
  }));

  const sum = (key: keyof DailyStat) =>
    daily.reduce((s, d) => s + (typeof d[key] === "number" ? (d[key] as number) : 0), 0);

  const findEvt = (t: string) =>
    byEventType.find((e) => e.eventType === t)?.count ?? 0;

  return {
    totalSessions: sum("sessions"),
    totalEvents: sum("events"),
    totalPageViews: sum("pageViews"),
    totalPropertyViews: sum("propertyViews"),
    totalSignups: findEvt("SIGNUP_COMPLETED"),
    byEventType,
    daily,
  };
}

/** Stats vues pour un propriétaire — somme des views_count de ses biens */
export async function getOwnerPropertyViews30d(ownerId: string): Promise<{
  totalViews: number;
  totalContacts: number;
  totalFavorites: number;
  viewsByProperty: Array<{ propertyId: string; title: string; views: number }>;
}> {
  const supabase = (await createClient()) as unknown as SupabaseClient;

  // Récupère les biens de l'owner avec leur compte de vues.
  // Borné à 100 biens, triés par vues décroissantes (les plus consultés
  // d'abord) pour éviter de charger un portefeuille illimité.
  const { data: props } = await supabase
    .from("properties")
    .select("id, title, views_count")
    .eq("owner_id", ownerId)
    .order("views_count", { ascending: false })
    .limit(100);

  const propsList = (props ?? []) as PropertyRow[];
  const propIds = propsList.map((p) => p.id);

  // Contacts (events PROPERTY_CONTACT) sur ces biens, 30 derniers jours
  let totalContacts = 0;
  let totalFavorites = 0;
  if (propIds.length > 0) {
    const [contactsRes, favsRes] = await Promise.all([
      supabase
        .from("analytics_events")
        .select("id", { count: "exact", head: true })
        .eq("event_type", "PROPERTY_CONTACT")
        .gte("created_at", new Date(Date.now() - 30 * 86400_000).toISOString())
        .filter(
          "metadata->>property_id",
          "in",
          `(${propIds.map((id) => `"${id}"`).join(",")})`,
        ),
      supabase
        .from("saved_properties")
        .select("id", { count: "exact", head: true })
        .in("property_id", propIds),
    ]);
    totalContacts = contactsRes.count ?? 0;
    totalFavorites = favsRes.count ?? 0;
  }

  return {
    totalViews: propsList.reduce(
      (s, p) => s + (Number(p.views_count) || 0),
      0,
    ),
    totalContacts,
    totalFavorites,
    viewsByProperty: propsList
      .map((p) => ({
        propertyId: p.id,
        title: p.title,
        views: Number(p.views_count) || 0,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10),
  };
}
