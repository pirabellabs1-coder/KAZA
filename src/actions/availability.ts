"use server";

// =============================================================================
// KAZA — Blocages de disponibilité (Server Actions)
//
// Persiste les blocages de disponibilité d'un bien dans
// `public.availability_blocks` (migration 00055).
// RLS : seul le propriétaire du bien (ou un ADMIN) peut écrire.
// On revérifie l'ownership côté serveur avant toute écriture (défense en
// profondeur, en complément des policies RLS).
//
// Convention de retour : ActionResult (réutilisée depuis @/actions/notifications).
// La table `availability_blocks` n'est pas dans les types Supabase générés :
// on cast le client en `any` pour les requêtes (même pattern que reports).
// =============================================================================

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/actions/notifications";
import type { AvailabilityBlock } from "@/lib/queries/availability";

// ---------------------------------------------------------------------------
// Validation Zod
// ---------------------------------------------------------------------------

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide (format attendu : AAAA-MM-JJ).");

const addBlockSchema = z
  .object({
    propertyId: z.string().trim().min(1, "Bien manquant."),
    startDate: isoDateSchema,
    endDate: isoDateSchema,
    reason: z.enum(["maintenance", "personal_use", "reserved", "other"]),
    note: z.string().trim().max(500).optional(),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: "La date de fin doit être postérieure ou égale à la date de début.",
    path: ["endDate"],
  });

export interface AddAvailabilityBlockInput {
  propertyId: string;
  startDate: string;
  endDate: string;
  reason: AvailabilityBlock["reason"];
  note?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface AvailabilityBlockRow {
  id: string;
  property_id: string;
  start_date: string;
  end_date: string;
  reason: AvailabilityBlock["reason"];
  note: string | null;
}

function mapRow(row: AvailabilityBlockRow): AvailabilityBlock {
  return {
    id: row.id,
    propertyId: row.property_id,
    startDate: row.start_date,
    endDate: row.end_date,
    reason: row.reason,
    note: row.note,
  };
}

// ---------------------------------------------------------------------------
// Server Actions
// ---------------------------------------------------------------------------

/**
 * Ajoute un blocage de disponibilité sur un bien.
 * Vérifie que l'utilisateur connecté est propriétaire du bien (ou ADMIN) avant
 * d'insérer. Renvoie le blocage créé (mappé) en cas de succès.
 */
export async function addAvailabilityBlock(
  input: AddAvailabilityBlockInput,
): Promise<ActionResult & { block?: AvailabilityBlock }> {
  const parsed = addBlockSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Blocage invalide.",
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Vous devez être connecté." };
  }

  // Vérification d'ownership (défense en profondeur en plus de la RLS).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: property, error: propError } = await (supabase as any)
    .from("properties")
    .select("owner_id")
    .eq("id", parsed.data.propertyId)
    .maybeSingle();

  if (propError) {
    console.warn("[availability] lecture du bien impossible", propError.message);
    return { success: false, error: "Bien introuvable." };
  }

  if (!property) {
    return { success: false, error: "Bien introuvable." };
  }

  if (property.owner_id !== user.id) {
    // Tolère l'ADMIN.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: me } = await (supabase as any)
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (!me || me.role !== "ADMIN") {
      return { success: false, error: "Accès refusé." };
    }
  }

  const note = parsed.data.note?.trim();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("availability_blocks")
    .insert({
      property_id: parsed.data.propertyId,
      start_date: parsed.data.startDate,
      end_date: parsed.data.endDate,
      reason: parsed.data.reason,
      note: note && note.length > 0 ? note : null,
      created_by: user.id,
    })
    .select("id, property_id, start_date, end_date, reason, note")
    .single();

  if (error) {
    console.warn("[availability] insertion impossible", error.message);
    return {
      success: false,
      error: "Impossible d'enregistrer le blocage. Réessayez plus tard.",
    };
  }

  revalidatePath(
    `/owner/properties/${parsed.data.propertyId}/availability`,
  );

  return { success: true, block: mapRow(data as AvailabilityBlockRow) };
}

/**
 * Supprime un blocage de disponibilité.
 * Vérifie que le blocage appartient à un bien dont l'utilisateur est
 * propriétaire (ou qu'il est ADMIN) avant de supprimer.
 */
export async function deleteAvailabilityBlock(
  id: string,
): Promise<ActionResult> {
  if (!id || typeof id !== "string") {
    return { success: false, error: "Blocage invalide." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Vous devez être connecté." };
  }

  // Récupère le blocage + le bien associé pour vérifier l'ownership.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: block, error: blockError } = await (supabase as any)
    .from("availability_blocks")
    .select("id, property_id, properties(owner_id)")
    .eq("id", id)
    .maybeSingle();

  if (blockError) {
    console.warn("[availability] lecture du blocage impossible", blockError.message);
    return { success: false, error: "Blocage introuvable." };
  }

  if (!block) {
    return { success: false, error: "Blocage introuvable." };
  }

  const ownerId: string | undefined = block.properties?.owner_id;

  if (ownerId !== user.id) {
    // Tolère l'ADMIN.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: me } = await (supabase as any)
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (!me || me.role !== "ADMIN") {
      return { success: false, error: "Accès refusé." };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("availability_blocks")
    .delete()
    .eq("id", id);

  if (error) {
    console.warn("[availability] suppression impossible", error.message);
    return { success: false, error: "Impossible de supprimer le blocage." };
  }

  revalidatePath(
    `/owner/properties/${block.property_id}/availability`,
  );

  return { success: true };
}
