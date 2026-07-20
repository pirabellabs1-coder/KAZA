"use server";

import "server-only";

// =============================================================================
// Kaabo — Candidatures locataires (rental_applications, migration 00039)
// - applyToProperty / withdrawApplication : locataire
// - decideApplication : propriétaire du bien (accepter / refuser)
// =============================================================================

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  createPendingRental,
  ensureContractForRental,
} from "@/lib/rentals/lifecycle";
import { dispatchNotification } from "@/lib/notifications/dispatch";

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
    .select("id, status, owner_id, title")
    .eq("id", d.propertyId)
    .maybeSingle();
  if (!property) return { success: false, error: "Annonce introuvable." };
  const prop = property as { owner_id: string; status: string; title: string };
  if (prop.owner_id === user.id) {
    return { success: false, error: "Vous ne pouvez pas postuler à votre bien." };
  }
  if (prop.status !== "AVAILABLE") {
    return {
      success: false,
      error: "Ce bien n'est plus disponible à la location.",
    };
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

  // Notifie le PROPRIÉTAIRE de la nouvelle candidature (in-app + email + push).
  try {
    const requesterName =
      `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Un candidat";
    await dispatchNotification({
      userId: prop.owner_id,
      type: "application_received",
      data: { propertyTitle: prop.title, requesterName },
    });
  } catch (err) {
    console.warn("[applications] notif candidature échec:", err);
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
    .select("id, property_id, tenant_id, status, move_in_date")
    .eq("id", id)
    .maybeSingle();
  if (!appRow) return { success: false, error: "Candidature introuvable." };
  const app = appRow as {
    id: string;
    property_id: string;
    tenant_id: string;
    status: string;
    move_in_date: string | null;
  };

  const { data: prop } = await supabase
    .from("properties")
    .select("owner_id, title, price, status")
    .eq("id", app.property_id)
    .maybeSingle();
  const property = prop as
    | { owner_id: string; title: string; price: number; status: string }
    | null;
  if (!property || property.owner_id !== user.id) {
    return { success: false, error: "Cette candidature ne vous concerne pas." };
  }
  if (status === "ACCEPTED" && property.status !== "AVAILABLE") {
    return {
      success: false,
      error: "Ce bien n'est plus disponible (déjà loué ou indisponible).",
    };
  }

  const { error } = await supabase
    .from("rental_applications")
    .update({ status, decided_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "PENDING");
  if (error) return { success: false, error: error.message };

  // Candidature ACCEPTÉE → on crée la location PENDING (le locataire devient
  // titulaire une fois le 1er loyer payé) et on lui envoie un lien pour payer.
  if (status === "ACCEPTED") {
    const rentalId = await createPendingRental({
      propertyId: app.property_id,
      tenantId: app.tenant_id,
      monthlyRent: Number(property.price) || 0,
      startDate: app.move_in_date,
    });

    if (rentalId) {
      // Le bail doit être SIGNÉ avant le paiement : on crée le contrat (brouillon)
      // que le propriétaire/agence complète et que les deux parties signent.
      const contractId = await ensureContractForRental(rentalId);

      // Notification au locataire (in-app + email + push).
      await dispatchNotification({
        userId: app.tenant_id,
        type: "application_accepted",
        data: {
          propertyTitle: property.title,
          contractUrl: contractId
            ? `/contracts/${contractId}`
            : `/tenant/rentals`,
        },
      });
    }
    revalidatePath("/tenant/rentals");
    revalidatePath("/tenant/applications");
    revalidatePath("/contracts");
  } else if (status === "REJECTED") {
    // Candidature refusée → on prévient le candidat.
    try {
      await dispatchNotification({
        userId: app.tenant_id,
        type: "application_rejected",
        data: {
          propertyTitle: property.title,
          reason: "Votre candidature n'a pas été retenue pour ce bien.",
        },
      });
    } catch (err) {
      console.warn("[applications] notif rejet échec:", err);
    }
    revalidatePath("/tenant/applications");
  }

  revalidatePath("/owner/applications");
  return { success: true };
}
