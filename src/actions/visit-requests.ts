"use server";

import "server-only";

// =============================================================================
// Kaabo — Server action : annulation d'une demande de visite par le locataire.
// Remplace l'ancien form POST vers /api/visits/{id}/cancel (route inexistante).
// =============================================================================

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

/**
 * Annule une demande de visite. Sécurisé : ne met à jour que SA propre demande
 * (tenant_id = auth.uid()) et seulement si elle est encore PENDING/CONFIRMED.
 * Signature compatible form action (id lié via .bind, formData ignoré).
 */
export async function cancelVisitRequest(
  id: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature compatible form action (formData ignoré)
  _formData?: FormData,
): Promise<void> {
  if (!id) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("visit_requests")
    .update({ status: "CANCELLED" })
    .eq("id", id)
    .eq("tenant_id", user.id)
    .in("status", ["PENDING", "CONFIRMED"]);

  revalidatePath("/tenant/visits");
}
