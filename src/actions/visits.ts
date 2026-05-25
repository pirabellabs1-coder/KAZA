"use server";

// =============================================================================
// KAZA - Visit Requests (Server Actions)
//
// Le locataire demande une visite, le proprietaire l'accepte ou la refuse.
// Toute transition de statut declenche une notification a la contrepartie.
// Retour : `ActionResult<VisitRequest>`.
// =============================================================================

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import type { VisitRequest } from "@/types/properties";
import { visitRequestSchema } from "@/validators/property";

import { createNotification, type ActionResult } from "./notifications";

// TODO: type manquant - voir note dans `properties.ts` (Database sans Relationships).
async function getLooseClient(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

interface RequestVisitInput {
  propertyId: string;
  requestedDate: string; // ISO date YYYY-MM-DD
  requestedTime?: string; // HH:MM
  message?: string;
}

// ---------------------------------------------------------------------------
// Locataire : demander une visite
// ---------------------------------------------------------------------------

/**
 * Cree une demande de visite (statut PENDING) et notifie le proprietaire.
 * L'utilisateur ne peut pas demander a visiter sa propre annonce.
 */
export async function requestVisit(
  input: RequestVisitInput
): Promise<ActionResult<VisitRequest>> {
  const parsed = visitRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Donnees invalides.",
    };
  }

  const supabase = await getLooseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Vous devez etre connecte." };
  }

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id, owner_id, title")
    .eq("id", parsed.data.propertyId)
    .maybeSingle();

  if (propertyError || !property) {
    return { success: false, error: "Annonce introuvable." };
  }

  if (property.owner_id === user.id) {
    return {
      success: false,
      error: "Vous ne pouvez pas demander a visiter votre propre annonce.",
    };
  }

  const insert = {
    property_id: property.id,
    tenant_id: user.id,
    requested_date: parsed.data.requestedDate,
    requested_time: parsed.data.requestedTime ?? "10:00",
    message: parsed.data.message ?? null,
    status: "PENDING",
  };

  const { data, error } = await supabase
    .from("visit_requests")
    .insert(insert)
    .select()
    .single();

  if (error || !data) {
    return {
      success: false,
      error: "Impossible d'enregistrer la demande de visite.",
    };
  }

  await createNotification(supabase, {
    userId: property.owner_id,
    type: "VISIT_REQUESTED",
    title: "Nouvelle demande de visite",
    body: `Un locataire souhaite visiter "${property.title}" le ${parsed.data.requestedDate}.`,
    link: `/owner/visits/${data.id}`,
  });

  revalidatePath("/owner/visits");
  revalidatePath("/tenant/visits");
  return { success: true, data: data as unknown as VisitRequest };
}

// ---------------------------------------------------------------------------
// Proprietaire : accepter / refuser
// ---------------------------------------------------------------------------

async function transitionVisit(
  id: string,
  nextStatus: "CONFIRMED" | "CANCELLED",
  notification: {
    type: "VISIT_CONFIRMED" | "VISIT_REJECTED";
    title: string;
    body: string;
  }
): Promise<ActionResult<VisitRequest>> {
  const supabase = await getLooseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Vous devez etre connecte." };
  }

  const { data: visit, error: fetchError } = await supabase
    .from("visit_requests")
    .select("id, tenant_id, property_id, properties!inner(owner_id, title)")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !visit) {
    return { success: false, error: "Demande de visite introuvable." };
  }

  // Supabase typage de la jointure : on cast prudemment.
  const ownerId = (visit as unknown as { properties: { owner_id: string } })
    .properties.owner_id;

  if (ownerId !== user.id) {
    return {
      success: false,
      error: "Vous n'etes pas autorise a modifier cette demande.",
    };
  }

  const { data, error } = await supabase
    .from("visit_requests")
    .update({ status: nextStatus })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    return { success: false, error: "Impossible de mettre a jour la visite." };
  }

  await createNotification(supabase, {
    userId: visit.tenant_id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    link: `/tenant/visits/${id}`,
  });

  revalidatePath("/owner/visits");
  revalidatePath("/tenant/visits");
  return { success: true, data: data as unknown as VisitRequest };
}

/** Le proprietaire accepte la demande de visite. */
export async function acceptVisit(id: string): Promise<ActionResult<VisitRequest>> {
  return transitionVisit(id, "CONFIRMED", {
    type: "VISIT_CONFIRMED",
    title: "Visite confirmee",
    body: "Le proprietaire a confirme votre demande de visite.",
  });
}

/** Le proprietaire refuse la demande de visite. */
export async function rejectVisit(id: string): Promise<ActionResult<VisitRequest>> {
  return transitionVisit(id, "CANCELLED", {
    type: "VISIT_REJECTED",
    title: "Visite refusee",
    body: "Le proprietaire ne peut pas honorer votre demande de visite.",
  });
}

// ---------------------------------------------------------------------------
// Locataire ou proprietaire : annuler
// ---------------------------------------------------------------------------

/**
 * Annule une visite. Aussi bien le locataire que le proprietaire peuvent
 * annuler avant la date prevue. La contrepartie recoit une notification.
 */
export async function cancelVisit(id: string): Promise<ActionResult<VisitRequest>> {
  const supabase = await getLooseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Vous devez etre connecte." };
  }

  const { data: visit, error: fetchError } = await supabase
    .from("visit_requests")
    .select("id, tenant_id, properties!inner(owner_id, title)")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !visit) {
    return { success: false, error: "Demande de visite introuvable." };
  }

  const ownerId = (visit as unknown as { properties: { owner_id: string } })
    .properties.owner_id;

  const isOwner = ownerId === user.id;
  const isTenant = visit.tenant_id === user.id;

  if (!isOwner && !isTenant) {
    return {
      success: false,
      error: "Vous n'etes pas autorise a annuler cette visite.",
    };
  }

  const { data, error } = await supabase
    .from("visit_requests")
    .update({ status: "CANCELLED" })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    return { success: false, error: "Impossible d'annuler la visite." };
  }

  await createNotification(supabase, {
    userId: isOwner ? visit.tenant_id : ownerId,
    type: "VISIT_CANCELLED",
    title: "Visite annulee",
    body: "Une demande de visite a ete annulee.",
    link: isOwner ? `/tenant/visits/${id}` : `/owner/visits/${id}`,
  });

  revalidatePath("/owner/visits");
  revalidatePath("/tenant/visits");
  return { success: true, data: data as unknown as VisitRequest };
}
