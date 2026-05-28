"use server";

// =============================================================================
// KAZA — Server Actions calendrier multi-agents
// CRUD events. agency_id = user.id (rôle AGENCY).
// =============================================================================

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

import type { ActionResult } from "./notifications";
import type { CalendarEventType } from "@/lib/queries/agency-calendar";

async function getLooseClient(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

const EVENT_TYPES = [
  "VISIT",
  "SIGNATURE",
  "MEETING",
  "INSPECTION",
  "OTHER",
] as const satisfies readonly CalendarEventType[];

const createEventSchema = z
  .object({
    title: z.string().min(2, "Titre requis."),
    type: z.enum(EVENT_TYPES).default("VISIT"),
    startAt: z.string().min(1, "Date de début requise."),
    endAt: z.string().min(1, "Date de fin requise."),
    assignedTo: z.string().uuid().optional(),
    propertyId: z.string().uuid().optional(),
    leadId: z.string().uuid().optional(),
    visitId: z.string().uuid().optional(),
    contactName: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (v) => new Date(v.endAt).getTime() > new Date(v.startAt).getTime(),
    {
      path: ["endAt"],
      message: "La fin doit être postérieure au début.",
    },
  );

export type CreateCalendarEventInput = z.infer<typeof createEventSchema>;

const updateEventSchema = z.object({
  title: z.string().min(2).optional(),
  type: z.enum(EVENT_TYPES).optional(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  propertyId: z.string().uuid().nullable().optional(),
  leadId: z.string().uuid().nullable().optional(),
  contactName: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type UpdateCalendarEventInput = z.infer<typeof updateEventSchema>;

async function requireAuth() {
  const supabase = await getLooseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false as const,
      result: { success: false as const, error: "Vous devez être connecté." },
    };
  }
  return { ok: true as const, supabase, user };
}

export async function createCalendarEvent(
  input: CreateCalendarEventInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createEventSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides.",
    };
  }
  const auth = await requireAuth();
  if (!auth.ok) return auth.result;
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("calendar_events")
    .insert({
      agency_id: user.id,
      title: parsed.data.title,
      type: parsed.data.type,
      start_at: parsed.data.startAt,
      end_at: parsed.data.endAt,
      assigned_to: parsed.data.assignedTo ?? null,
      property_id: parsed.data.propertyId ?? null,
      lead_id: parsed.data.leadId ?? null,
      visit_id: parsed.data.visitId ?? null,
      contact_name: parsed.data.contactName ?? null,
      notes: parsed.data.notes ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[agency-calendar] createCalendarEvent:", error?.message);
    return { success: false, error: "Impossible de créer le rendez-vous." };
  }

  revalidatePath("/agency/calendar");
  return { success: true, data: { id: (data as { id: string }).id } };
}

export async function updateCalendarEvent(
  id: string,
  patch: UpdateCalendarEventInput,
): Promise<ActionResult> {
  const parsed = updateEventSchema.safeParse(patch);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides.",
    };
  }
  const auth = await requireAuth();
  if (!auth.ok) return auth.result;
  const { supabase } = auth;

  const dbPatch: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) dbPatch.title = parsed.data.title;
  if (parsed.data.type !== undefined) dbPatch.type = parsed.data.type;
  if (parsed.data.startAt !== undefined) dbPatch.start_at = parsed.data.startAt;
  if (parsed.data.endAt !== undefined) dbPatch.end_at = parsed.data.endAt;
  if (parsed.data.assignedTo !== undefined)
    dbPatch.assigned_to = parsed.data.assignedTo;
  if (parsed.data.propertyId !== undefined)
    dbPatch.property_id = parsed.data.propertyId;
  if (parsed.data.leadId !== undefined) dbPatch.lead_id = parsed.data.leadId;
  if (parsed.data.contactName !== undefined)
    dbPatch.contact_name = parsed.data.contactName;
  if (parsed.data.notes !== undefined) dbPatch.notes = parsed.data.notes;

  const { error } = await supabase
    .from("calendar_events")
    .update(dbPatch)
    .eq("id", id);

  if (error) {
    console.error("[agency-calendar] updateCalendarEvent:", error.message);
    return { success: false, error: "Impossible de modifier le rendez-vous." };
  }
  revalidatePath("/agency/calendar");
  return { success: true };
}

export async function deleteCalendarEvent(id: string): Promise<ActionResult> {
  const auth = await requireAuth();
  if (!auth.ok) return auth.result;
  const { supabase } = auth;

  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[agency-calendar] deleteCalendarEvent:", error.message);
    return { success: false, error: "Impossible de supprimer le rendez-vous." };
  }
  revalidatePath("/agency/calendar");
  return { success: true };
}
