"use server";

import "server-only";

// =============================================================================
// KAZA — Candidatures locataires (rental_applications, migration 00039)
// - applyToProperty / withdrawApplication : locataire
// - decideApplication : propriétaire du bien (accepter / refuser)
// =============================================================================

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface ActionResult {
  success: boolean;
  error?: string;
  id?: string;
}

async function loose(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

const applySchema = z.object({
  propertyId: z.string().uuid(),
  message: z.string().trim().max(1000).optional().default(""),
  moveInDate: z.string().optional().default(""),
  monthlyIncome: z.number().nonnegative().optional(),
});

export type ApplyInput = z.infer<typeof applySchema>;

export async function applyToProperty(input: ApplyInput): Promise<ActionResult> {
  const parsed = applySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides.",
    };
  }
  const user = await getCurrentDisplayUser();
  if (!user) return { success: false, error: "Vous devez être connecté." };
  if (user.role === "OWNER" || user.role === "AGENCY") {
    return {
      success: false,
      error: "Les propriétaires/agences ne peuvent pas postuler.",
    };
  }

  const d = parsed.data;
  const supabase = await loose();

  // Le bien doit exister et être disponible
  const { data: property } = await supabase
    .from("properties")
    .select("id, status, owner_id")
    .eq("id", d.propertyId)
    .maybeSingle();
  if (!property) return { success: false, error: "Annonce introuvable." };
  if ((property as { owner_id: string }).owner_id === user.id) {
    return { success: false, error: "Vous ne pouvez pas postuler à votre bien." };
  }

  const { data, error } = await supabase
    .from("rental_applications")
    .insert({
      property_id: d.propertyId,
      tenant_id: user.id,
      message: d.message || null,
      move_in_date: d.moveInDate || null,
      monthly_income_fcfa: d.monthlyIncome ?? null,
      status: "PENDING",
    })
    .select("id")
    .single();

  if (error) {
    // L'index unique partiel bloque les doublons de candidature en attente.
    if (error.message?.toLowerCase().includes("duplicate")) {
      return {
        success: false,
        error: "Vous avez déjà une candidature en attente pour ce bien.",
      };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/tenant/applications");
  return { success: true, id: (data as { id: string } | null)?.id };
}

export async function withdrawApplication(id: string): Promise<ActionResult> {
  if (!id) return { success: false, error: "Candidature introuvable." };
  const user = await getCurrentDisplayUser();
  if (!user) return { success: false, error: "Vous devez être connecté." };

  const supabase = await loose();
  const { error } = await supabase
    .from("rental_applications")
    .update({ status: "WITHDRAWN", decided_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", user.id)
    .eq("status", "PENDING");
  if (error) return { success: false, error: error.message };

  revalidatePath("/tenant/applications");
  return { success: true };
}

export async function decideApplication(
  id: string,
  status: "ACCEPTED" | "REJECTED",
): Promise<ActionResult> {
  if (!id || (status !== "ACCEPTED" && status !== "REJECTED")) {
    return { success: false, error: "Paramètres invalides." };
  }
  const user = await getCurrentDisplayUser();
  if (!user) return { success: false, error: "Vous devez être connecté." };
  if (user.role !== "OWNER" && user.role !== "AGENCY" && user.role !== "ADMIN") {
    return { success: false, error: "Action réservée au propriétaire." };
  }

  const supabase = await loose();

  // Vérifie que la candidature porte sur un bien de l'utilisateur
  const { data: appRow } = await supabase
    .from("rental_applications")
    .select("id, property_id, status")
    .eq("id", id)
    .maybeSingle();
  if (!appRow) return { success: false, error: "Candidature introuvable." };

  const { data: prop } = await supabase
    .from("properties")
    .select("owner_id")
    .eq("id", (appRow as { property_id: string }).property_id)
    .maybeSingle();
  if (!prop || (prop as { owner_id: string }).owner_id !== user.id) {
    return { success: false, error: "Cette candidature ne vous concerne pas." };
  }

  const { error } = await supabase
    .from("rental_applications")
    .update({ status, decided_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "PENDING");
  if (error) return { success: false, error: error.message };

  revalidatePath("/owner/applications");
  return { success: true };
}
