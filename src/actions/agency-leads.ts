"use server";

// =============================================================================
// Kaabo — Server Actions leads CRM agence
// CRUD + opérations métier (changement de stage, assignation, notes).
// agency_id est toujours l'utilisateur courant (rôle AGENCY).
// =============================================================================

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

import type { ActionResult } from "./notifications";
import type { LeadStage, LeadSource } from "@/lib/queries/agency-leads";

async function getLooseClient(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

const STAGES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "VISIT_SCHEDULED",
  "OFFER",
  "WON",
  "LOST",
] as const satisfies readonly LeadStage[];

const SOURCES = [
  "SITE_KAZA",
  "SOCIAL",
  "WORD_OF_MOUTH",
  "GOOGLE_ADS",
  "EVENT",
  "OTHER",
] as const satisfies readonly LeadSource[];

const createLeadSchema = z.object({
  fullName: z.string().min(2, "Nom du prospect requis."),
  email: z.string().email("Email invalide.").optional().or(z.literal("")),
  phone: z.string().optional(),
  source: z.enum(SOURCES).default("SITE_KAZA"),
  budgetFcfa: z.number().nonnegative().optional(),
  propertyId: z.string().uuid().optional(),
  assignedTo: z.string().uuid().optional(),
  notes: z.string().optional(),
  score: z.number().int().min(0).max(100).optional(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;

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

export async function createLead(
  input: CreateLeadInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createLeadSchema.safeParse(input);
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
    .from("agency_leads")
    .insert({
      agency_id: user.id,
      full_name: parsed.data.fullName,
      email: parsed.data.email || null,
      phone: parsed.data.phone ?? null,
      source: parsed.data.source,
      budget_fcfa: parsed.data.budgetFcfa ?? null,
      property_id: parsed.data.propertyId ?? null,
      assigned_to: parsed.data.assignedTo ?? null,
      stage: "NEW",
      notes: parsed.data.notes ?? null,
      score: parsed.data.score ?? 50,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[agency-leads] createLead:", error?.message);
    return { success: false, error: "Impossible de créer le lead." };
  }

  revalidatePath("/agency/leads");
  return { success: true, data: { id: (data as { id: string }).id } };
}

export async function updateLeadStage(
  id: string,
  newStage: LeadStage,
): Promise<ActionResult> {
  if (!STAGES.includes(newStage)) {
    return { success: false, error: "Étape inconnue." };
  }
  const auth = await requireAuth();
  if (!auth.ok) return auth.result;
  const { supabase } = auth;

  const { error } = await supabase
    .from("agency_leads")
    .update({
      stage: newStage,
      last_activity_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("[agency-leads] updateLeadStage:", error.message);
    return { success: false, error: "Impossible de modifier l'étape." };
  }
  revalidatePath("/agency/leads");
  revalidatePath(`/agency/leads/${id}`);
  return { success: true };
}

export async function assignLead(
  id: string,
  memberId: string | null,
): Promise<ActionResult> {
  const auth = await requireAuth();
  if (!auth.ok) return auth.result;
  const { supabase } = auth;

  const { error } = await supabase
    .from("agency_leads")
    .update({
      assigned_to: memberId,
      last_activity_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("[agency-leads] assignLead:", error.message);
    return { success: false, error: "Impossible d'assigner ce lead." };
  }
  revalidatePath("/agency/leads");
  revalidatePath(`/agency/leads/${id}`);
  return { success: true };
}

/**
 * Append une note datée aux notes existantes (préfixée par la date)
 * et bump last_activity_at.
 */
export async function addLeadNote(
  id: string,
  note: string,
): Promise<ActionResult> {
  if (!note.trim()) {
    return { success: false, error: "Note vide." };
  }
  const auth = await requireAuth();
  if (!auth.ok) return auth.result;
  const { supabase } = auth;

  const { data: current, error: fetchError } = await supabase
    .from("agency_leads")
    .select("notes")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !current) {
    return { success: false, error: "Lead introuvable." };
  }

  const previous = (current as { notes: string | null }).notes ?? "";
  const ts = new Date().toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const newNotes = previous
    ? `${previous}\n\n--- ${ts} ---\n${note.trim()}`
    : `--- ${ts} ---\n${note.trim()}`;

  const { error } = await supabase
    .from("agency_leads")
    .update({
      notes: newNotes,
      last_activity_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("[agency-leads] addLeadNote:", error.message);
    return { success: false, error: "Impossible d'ajouter la note." };
  }
  revalidatePath(`/agency/leads/${id}`);
  return { success: true };
}

/**
 * Remplace l'intégralité des notes (utilisé par l'éditeur autosave).
 */
export async function setLeadNotes(
  id: string,
  notes: string,
): Promise<ActionResult> {
  const auth = await requireAuth();
  if (!auth.ok) return auth.result;
  const { supabase } = auth;

  const { error } = await supabase
    .from("agency_leads")
    .update({
      notes,
      last_activity_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("[agency-leads] setLeadNotes:", error.message);
    return { success: false, error: "Impossible d'enregistrer les notes." };
  }
  revalidatePath(`/agency/leads/${id}`);
  return { success: true };
}

export async function deleteLead(id: string): Promise<ActionResult> {
  const auth = await requireAuth();
  if (!auth.ok) return auth.result;
  const { supabase } = auth;

  const { error } = await supabase.from("agency_leads").delete().eq("id", id);

  if (error) {
    console.error("[agency-leads] deleteLead:", error.message);
    return { success: false, error: "Impossible de supprimer le lead." };
  }
  revalidatePath("/agency/leads");
  return { success: true };
}
