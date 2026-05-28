import "server-only";

import { createClient } from "@/lib/supabase/server";

// =============================================================================
// KAZA — Queries analytics agrégées
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
  const supabase = await createClient();

  const [byTypeRes, dailyRes] = await Promise.all([
    (supabase as any).from("analytics_30d").select("*"),
    (supabase as any).from("analytics_daily_30d").select("*"),
  ]);

  const byEventType: EventTypeStat[] = (byTypeRes.data ?? []).map((r: any) => ({
    eventType: r.event_type,
    count: Number(r.count),
    uniqueUsers: Number(r.unique_users),
    uniqueSessions: Number(r.unique_sessions),
  }));

  const daily: DailyStat[] = (dailyRes.data ?? []).map((r: any) => ({
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
  const supabase = await createClient();

  // Récupère les biens de l'owner avec leur compte de vues
  const { data: props } = await (supabase as any)
    .from("properties")
    .select("id, title, views_count")
    .eq("owner_id", ownerId);

  const propsList = props ?? [];
  const propIds = propsList.map((p: any) => p.id);

  // Contacts (events PROPERTY_CONTACT) sur ces biens, 30 derniers jours
  let totalContacts = 0;
  let totalFavorites = 0;
  if (propIds.length > 0) {
    const [contactsRes, favsRes] = await Promise.all([
      (supabase as any)
        .from("analytics_events")
        .select("id", { count: "exact", head: true })
        .eq("event_type", "PROPERTY_CONTACT")
        .gte("created_at", new Date(Date.now() - 30 * 86400_000).toISOString())
        .filter("metadata->>property_id", "in", `(${propIds.map((id: string) => `"${id}"`).join(",")})`),
      (supabase as any)
        .from("saved_properties")
        .select("id", { count: "exact", head: true })
        .in("property_id", propIds),
    ]);
    totalContacts = contactsRes.count ?? 0;
    totalFavorites = favsRes.count ?? 0;
  }

  return {
    totalViews: propsList.reduce(
      (s: number, p: any) => s + (Number(p.views_count) || 0),
      0,
    ),
    totalContacts,
    totalFavorites,
    viewsByProperty: propsList
      .map((p: any) => ({
        propertyId: p.id,
        title: p.title,
        views: Number(p.views_count) || 0,
      }))
      .sort((a: any, b: any) => b.views - a.views)
      .slice(0, 10),
  };
}
