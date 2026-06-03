import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

// =============================================================================
// KAZA — Queries Blocages de disponibilité (server-side)
//
// Lecture de `public.availability_blocks` (migration 00055) pour le calendrier
// de disponibilité côté propriétaire.
// RLS : SELECT réservé au propriétaire du bien (et ADMIN).
// Ne throw jamais : retourne [] en cas d'erreur (best-effort).
// La table `availability_blocks` n'est pas dans les types Supabase générés :
// on cast le client de façon souple (même approche que reports/partners-admin).
// =============================================================================

/** Raisons canoniques de blocage (alignées sur la contrainte SQL). */
export type AvailabilityReason =
  | "maintenance"
  | "personal_use"
  | "reserved"
  | "other";

export interface AvailabilityBlock {
  id: string;
  propertyId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: AvailabilityReason;
  note: string | null;
}

interface AvailabilityBlockRow {
  id: string;
  property_id: string;
  start_date: string;
  end_date: string;
  reason: AvailabilityReason;
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

/**
 * Liste les blocages de disponibilité d'un bien, par date de début croissante.
 * Les policies RLS garantissent que seul le propriétaire du bien (ou un ADMIN)
 * obtient des résultats. Renvoie [] en cas d'erreur ou d'absence de données.
 */
export async function listAvailabilityBlocks(
  propertyId: string,
): Promise<AvailabilityBlock[]> {
  if (!propertyId) return [];

  const supabase = (await createClient()) as unknown as SupabaseClient;

  try {
    const { data, error } = await supabase
      .from("availability_blocks")
      .select("id, property_id, start_date, end_date, reason, note")
      .eq("property_id", propertyId)
      .order("start_date", { ascending: true });

    if (error) {
      console.warn("[availability] listAvailabilityBlocks:", error.message);
      return [];
    }

    return ((data ?? []) as AvailabilityBlockRow[]).map(mapRow);
  } catch (err) {
    console.warn(
      "[availability] listAvailabilityBlocks (exception):",
      err instanceof Error ? err.message : String(err),
    );
    return [];
  }
}
