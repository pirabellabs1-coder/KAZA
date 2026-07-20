import "server-only";

// =============================================================================
// Kaabo — Queries calendrier multi-agents (server-side)
// Lit `calendar_events` filtré par agency_id + fenêtre temporelle, et
// joint l'agent assigné + la propriété si applicable.
// =============================================================================

import { createClient } from "@/lib/supabase/server";

export type CalendarEventType =
  | "VISIT"
  | "SIGNATURE"
  | "MEETING"
  | "INSPECTION"
  | "OTHER";

export interface CalendarEvent {
  id: string;
  agencyId: string;
  assignedTo: string | null;
  propertyId: string | null;
  leadId: string | null;
  visitId: string | null;
  title: string;
  type: CalendarEventType;
  startAt: string;
  endAt: string;
  contactName: string | null;
  notes: string | null;
  createdAt: string;
  assignedMember: {
    id: string;
    fullName: string;
    role: string;
  } | null;
  property: {
    id: string;
    title: string;
    address: string | null;
  } | null;
}

interface RawEventRow {
  id: string;
  agency_id: string;
  assigned_to: string | null;
  property_id: string | null;
  lead_id: string | null;
  visit_id: string | null;
  title: string;
  type: CalendarEventType;
  start_at: string;
  end_at: string;
  contact_name: string | null;
  notes: string | null;
  created_at: string;
  assigned_member?: {
    id: string;
    full_name: string;
    role: string;
  } | null;
  property?: { id: string; title: string; address: string | null } | null;
}

function mapEvent(raw: RawEventRow): CalendarEvent {
  return {
    id: raw.id,
    agencyId: raw.agency_id,
    assignedTo: raw.assigned_to,
    propertyId: raw.property_id,
    leadId: raw.lead_id,
    visitId: raw.visit_id,
    title: raw.title,
    type: raw.type,
    startAt: raw.start_at,
    endAt: raw.end_at,
    contactName: raw.contact_name,
    notes: raw.notes,
    createdAt: raw.created_at,
    assignedMember: raw.assigned_member
      ? {
          id: raw.assigned_member.id,
          fullName: raw.assigned_member.full_name,
          role: raw.assigned_member.role,
        }
      : null,
    property: raw.property
      ? {
          id: raw.property.id,
          title: raw.property.title,
          address: raw.property.address ?? null,
        }
      : null,
  };
}

/**
 * Liste les events compris dans la fenêtre [startDate, endDate[ (ISO).
 */
export async function listCalendarEvents(
  agencyId: string,
  startDate: string,
  endDate: string,
): Promise<CalendarEvent[]> {
  const supabase = await createClient();
  const { data, error } = await (supabase as unknown as {
    from: (t: string) => {
      select: (q: string) => {
        eq: (col: string, v: string) => {
          gte: (col: string, v: string) => {
            lt: (col: string, v: string) => {
              order: (
                col: string,
                opts: { ascending: boolean },
              ) => Promise<{
                data: unknown[] | null;
                error: { message: string } | null;
              }>;
            };
          };
        };
      };
    };
  })
    .from("calendar_events")
    .select(
      `
      id, agency_id, assigned_to, property_id, lead_id, visit_id,
      title, type, start_at, end_at, contact_name, notes, created_at,
      assigned_member:agency_members!calendar_events_assigned_to_fkey(id, full_name, role),
      property:properties!calendar_events_property_id_fkey(id, title, address)
    `,
    )
    .eq("agency_id", agencyId)
    .gte("start_at", startDate)
    .lt("start_at", endDate)
    .order("start_at", { ascending: true });

  if (error) {
    console.error("[agency-calendar] listCalendarEvents:", error.message);
    return [];
  }

  return ((data ?? []) as RawEventRow[]).map(mapEvent);
}

/**
 * Retourne les `limit` prochains rendez-vous à partir de maintenant.
 */
export async function getUpcomingEvents(
  agencyId: string,
  limit = 5,
): Promise<CalendarEvent[]> {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const { data, error } = await (supabase as unknown as {
    from: (t: string) => {
      select: (q: string) => {
        eq: (col: string, v: string) => {
          gte: (col: string, v: string) => {
            order: (
              col: string,
              opts: { ascending: boolean },
            ) => {
              limit: (n: number) => Promise<{
                data: unknown[] | null;
                error: { message: string } | null;
              }>;
            };
          };
        };
      };
    };
  })
    .from("calendar_events")
    .select(
      `
      id, agency_id, assigned_to, property_id, lead_id, visit_id,
      title, type, start_at, end_at, contact_name, notes, created_at,
      assigned_member:agency_members!calendar_events_assigned_to_fkey(id, full_name, role),
      property:properties!calendar_events_property_id_fkey(id, title, address)
    `,
    )
    .eq("agency_id", agencyId)
    .gte("start_at", nowIso)
    .order("start_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("[agency-calendar] getUpcomingEvents:", error.message);
    return [];
  }

  return ((data ?? []) as RawEventRow[]).map(mapEvent);
}

/**
 * Calcule le lundi → dimanche+1 (exclusif) d'une date donnée, format ISO.
 * Utilisé par la vue semaine de la page calendrier.
 */
export function getCurrentWeekRange(reference: Date = new Date()): {
  start: Date;
  end: Date;
  days: Date[];
} {
  const ref = new Date(reference);
  ref.setHours(0, 0, 0, 0);
  const day = ref.getDay(); // 0 = dimanche
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(ref);
  start.setDate(ref.getDate() + diffToMonday);

  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }

  return { start, end, days };
}
