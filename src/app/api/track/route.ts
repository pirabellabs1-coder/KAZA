// =============================================================================
// Kaabo — API route /api/track
//
// Endpoint best-effort qui reçoit les évènements client (PAGE_VIEW,
// PROPERTY_VIEW, etc.) depuis les trackers et les enregistre via
// le helper `track()` server-side. Ne throw jamais.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";

import { track } from "@/lib/analytics/track";

export const runtime = "nodejs";

interface TrackBody {
  eventType?: string;
  path?: string;
  metadata?: Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as TrackBody;
    if (!body?.eventType) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const ua = req.headers.get("user-agent") ?? undefined;
    const referrer = req.headers.get("referer") ?? undefined;
    const deviceType: "mobile" | "desktop" = /Mobile|Android|iPhone/i.test(
      ua ?? "",
    )
      ? "mobile"
      : "desktop";

    await track({
      // L'enum est validé côté DB (analytics_event_type) : un cast suffit ici.
      eventType: body.eventType as Parameters<typeof track>[0]["eventType"],
      path: body.path,
      metadata: body.metadata,
      userAgent: ua,
      referrer,
      deviceType,
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Best-effort : on ne propage jamais l'erreur au client.
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
