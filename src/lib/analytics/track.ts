import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

// =============================================================================
// Kaabo — Helper de tracking analytics (server-side)
// Insère un évènement dans analytics_events. Best-effort, ne throw jamais.
// =============================================================================

export type AnalyticsEventType =
  | "PAGE_VIEW"
  | "PROPERTY_VIEW"
  | "PROPERTY_CONTACT"
  | "PROPERTY_FAVORITE"
  | "SEARCH_PERFORMED"
  | "SIGNUP_STARTED"
  | "SIGNUP_COMPLETED"
  | "LOGIN"
  | "VISIT_REQUESTED"
  | "BOOKING_INITIATED"
  | "PAYMENT_COMPLETED"
  | "PROPERTY_PUBLISHED"
  | "PROFILE_COMPLETED"
  | "OTHER";

export interface TrackInput {
  eventType: AnalyticsEventType;
  path?: string;
  sessionId?: string;
  referrer?: string;
  userAgent?: string;
  countryCode?: string;
  city?: string;
  deviceType?: "mobile" | "desktop" | "tablet";
  metadata?: Record<string, unknown>;
}

export async function track(input: TrackInput): Promise<void> {
  try {
    // Loose cast : table analytics_events hors types générés Supabase.
    const supabase = (await createClient()) as unknown as SupabaseClient;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("analytics_events").insert({
      event_type: input.eventType,
      user_id: user?.id ?? null,
      session_id: input.sessionId ?? null,
      path: input.path ?? null,
      referrer: input.referrer ?? null,
      user_agent: input.userAgent ?? null,
      country_code: input.countryCode ?? null,
      city: input.city ?? null,
      device_type: input.deviceType ?? null,
      metadata: input.metadata ?? null,
    });
  } catch (err) {
    console.error("[analytics] track failed:", err);
  }
}
