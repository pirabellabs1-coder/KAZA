import "server-only";

import { createClient } from "@/lib/supabase/server";

// =============================================================================
// Kaabo — Queries Abonnés newsletter (back-office admin)
// Lecture de `newsletter_subscribers` (inscriptions footer / landing / faq).
// RLS : SELECT réservé aux ADMIN (policy `newsletter_admin_select`).
// Les types Supabase auto-générés ne connaissent pas encore la table → cast.
// =============================================================================

export interface NewsletterSubscriber {
  id: string;
  email: string;
  confirmed: boolean;
  unsubscribed: boolean;
  source: string | null;
  createdAt: string;
}

interface SubscriberRow {
  id: string;
  email: string;
  confirmed: boolean;
  unsubscribed: boolean;
  source: string | null;
  created_at: string;
}

export interface NewsletterStats {
  total: number;
  active: number;
  unsubscribed: number;
  bySource: Array<{ source: string; count: number }>;
}

/**
 * Liste tous les abonnés à la newsletter, du plus récent au plus ancien.
 * RLS garantit que seuls les ADMIN obtiennent la liste.
 */
export async function listNewsletterSubscribers(): Promise<
  NewsletterSubscriber[]
> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("newsletter_subscribers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[newsletter-admin] list:", error.message);
    return [];
  }

  return ((data ?? []) as SubscriberRow[]).map((row) => ({
    id: row.id,
    email: row.email,
    confirmed: row.confirmed,
    unsubscribed: row.unsubscribed,
    source: row.source,
    createdAt: row.created_at,
  }));
}

/** Statistiques agrégées sur les abonnés (total, actifs, par source). */
export function computeNewsletterStats(
  subscribers: NewsletterSubscriber[],
): NewsletterStats {
  const bySourceMap = new Map<string, number>();
  let unsubscribed = 0;

  for (const s of subscribers) {
    if (s.unsubscribed) unsubscribed += 1;
    const key = s.source?.trim() || "inconnu";
    bySourceMap.set(key, (bySourceMap.get(key) ?? 0) + 1);
  }

  const bySource = Array.from(bySourceMap.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);

  return {
    total: subscribers.length,
    active: subscribers.length - unsubscribed,
    unsubscribed,
    bySource,
  };
}
