"use server";

// =============================================================================
// KAZA — Locations côté propriétaire (Server Actions)
//
// Résiliation d'un bail par le PROPRIÉTAIRE (owner_id du bien). Met fin à la
// location, libère le bien (RENTED -> AVAILABLE) et notifie les deux parties.
// L'équivalent agence vit dans `agency-rentals.ts` (garde par mandat).
// =============================================================================

import "server-only";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dispatchNotification } from "@/lib/notifications/dispatch";

import type { ActionResult } from "./notifications";

/**
 * Résilie un bail dont l'utilisateur courant est le propriétaire du bien.
 * - rental -> TERMINATED (+ end_date du jour)
 * - property RENTED -> AVAILABLE (le bien peut être reloué)
 * - notifie le locataire ET le bailleur (in-app + email + push)
 */
export async function terminateOwnerRental(
  rentalId: string,
  endDate?: string,
): Promise<ActionResult> {
  if (!rentalId) return { success: false, error: "Bail introuvable." };

  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return { success: false, error: "Vous devez être connecté." };
  }

  const admin = createAdminClient() as unknown as SupabaseClient;

  // Charge le bail + bien + locataire.
  const { data: rentalRow } = await admin
    .from("rentals")
    .select(
      `id, status, property_id, tenant_id,
       property:properties!property_id(owner_id, title)`,
    )
    .eq("id", rentalId)
    .maybeSingle();
  if (!rentalRow) return { success: false, error: "Bail introuvable." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r: any = rentalRow;
  const ownerId = r.property?.owner_id as string | undefined;
  const propertyTitle = (r.property?.title as string | undefined) ?? "le bien";
  const tenantId = r.tenant_id as string | undefined;
  const propertyId = r.property_id as string | undefined;
  const status = r.status as string | undefined;

  if (ownerId !== user.id) {
    return { success: false, error: "Action réservée au propriétaire du bien." };
  }
  if (status !== "ACTIVE" && status !== "PENDING") {
    return {
      success: false,
      error: "Ce bail ne peut pas être résilié (déjà terminé ou annulé).",
    };
  }

  const end = endDate || new Date().toISOString().slice(0, 10);

  const { error: updErr } = await admin
    .from("rentals")
    .update({ status: "TERMINATED", end_date: end })
    .eq("id", rentalId);
  if (updErr) {
    return { success: false, error: "Impossible de résilier le bail." };
  }

  // Libère le bien pour qu'il puisse être reloué.
  if (propertyId) {
    await admin
      .from("properties")
      .update({ status: "AVAILABLE" })
      .eq("id", propertyId)
      .eq("status", "RENTED");
  }

  // Notifie les deux parties (best-effort, n'interrompt pas l'action).
  try {
    if (tenantId) {
      await dispatchNotification({
        userId: tenantId,
        type: "rental_terminated",
        data: { propertyTitle, endDate: end, forOwner: false },
      });
    }
    await dispatchNotification({
      userId: user.id,
      type: "rental_terminated",
      data: { propertyTitle, endDate: end, forOwner: true },
    });
  } catch (err) {
    console.error("[owner-rentals] notify terminate:", err);
  }

  revalidatePath("/owner/rentals");
  revalidatePath("/owner/properties");
  return { success: true };
}
