import "server-only";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from "@/lib/supabase/server";

// =============================================================================
// KAZA — Campagnes de communication (admin)
// Comptes d'audience RÉELS depuis la table users + historique campagnes.
// =============================================================================

export type SegmentKey =
  | "ALL"
  | "TENANTS"
  | "OWNERS"
  | "STUDENTS"
  | "AGENCIES"
  | "RECENT_7D";

export interface AudienceSegment {
  key: SegmentKey;
  name: string;
  count: number;
}

/** Renvoie les segments d'audience avec leurs comptes RÉELS (table users). */
export async function getAudienceSegments(): Promise<AudienceSegment[]> {
  const supabase = await createClient();
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const [all, tenants, owners, students, agencies, recent] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "TENANT"),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "OWNER"),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "STUDENT"),
    (supabase as any).from("users").select("id", { count: "exact", head: true }).eq("role", "AGENCY"),
    supabase.from("users").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
  ]);

  return [
    { key: "ALL", name: "Tous les utilisateurs", count: all.count ?? 0 },
    { key: "TENANTS", name: "Locataires", count: tenants.count ?? 0 },
    { key: "OWNERS", name: "Propriétaires", count: owners.count ?? 0 },
    { key: "STUDENTS", name: "Étudiants", count: students.count ?? 0 },
    { key: "AGENCIES", name: "Agences", count: agencies.count ?? 0 },
    { key: "RECENT_7D", name: "Inscrits (7 derniers jours)", count: recent.count ?? 0 },
  ];
}

export interface CampaignRow {
  id: string;
  name: string;
  channel: "IN_APP" | "EMAIL" | "PUSH" | "SMS";
  segment: string;
  subject: string | null;
  content: string;
  status: "DRAFT" | "SENDING" | "SENT" | "FAILED";
  audienceSize: number;
  sentCount: number;
  sentAt: string | null;
  createdAt: string;
}

/** Historique des campagnes (plus récentes en premier). */
export async function listCampaigns(limit = 50): Promise<CampaignRow[]> {
  const supabase = (await createClient()) as any;
  const { data, error } = await supabase
    .from("campaigns")
    .select(
      "id, name, channel, segment, subject, content, status, audience_size, sent_count, sent_at, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[queries/campaigns] listCampaigns:", error.message);
    return [];
  }

  return (data ?? []).map(
    (c: any): CampaignRow => ({
      id: c.id,
      name: c.name,
      channel: c.channel,
      segment: c.segment,
      subject: c.subject ?? null,
      content: c.content,
      status: c.status,
      audienceSize: c.audience_size ?? 0,
      sentCount: c.sent_count ?? 0,
      sentAt: c.sent_at ?? null,
      createdAt: c.created_at,
    }),
  );
}
