"use server";

// =============================================================================
// KAZA — Offres d'achat (Server Actions)
//
// Modèle acompte + clôture notaire :
//   - submitPropertyOffer : l'acheteur fait une offre sur un bien à vendre.
//   - decideOffer (vendeur) : accepter / refuser. À l'acceptation, un acompte
//     de réservation est attendu (versé ensuite via Mobile Money).
//
// RLS : property_offers (acheteur CRUD propre, vendeur lecture+update sur ses
// biens). Les notifications passent par dispatchNotification.
// =============================================================================

import "server-only";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dispatchNotification } from "@/lib/notifications/dispatch";

import type { ActionResult } from "./notifications";

// Pourcentage d'acompte de réservation indicatif (sur le montant de l'offre).
const RESERVATION_DEPOSIT_RATE = 0.05;

const offerSchema = z.object({
  propertyId: z.string().uuid("Bien invalide."),
  amount: z
    .number({ message: "Montant requis." })
    .positive("Le montant doit être supérieur à 0.")
    .max(100_000_000_000, "Montant trop élevé."),
  message: z.string().max(1000, "Message trop long.").optional().or(z.literal("")),
});

export type SubmitOfferInput = z.infer<typeof offerSchema>;

/**
 * L'acheteur soumet une offre sur un bien à vendre. Notifie le vendeur.
 */
export async function submitPropertyOffer(
  input: SubmitOfferInput,
): Promise<ActionResult> {
  const parsed = offerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides.",
    };
  }

  const supabase = (await createClient()) as unknown as SupabaseClient;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Connectez-vous pour faire une offre." };
  }

  // Charge le bien (type de transaction, statut, vendeur).
  const { data: prop } = await supabase
    .from("properties")
    .select("id, owner_id, title, listing_type, status")
    .eq("id", parsed.data.propertyId)
    .maybeSingle();
  const property = prop as {
    id: string;
    owner_id: string;
    title: string | null;
    listing_type: string | null;
    status: string | null;
  } | null;
  if (!property) return { success: false, error: "Bien introuvable." };

  if (property.listing_type !== "SALE") {
    return { success: false, error: "Ce bien n'est pas à vendre." };
  }
  if (property.owner_id === user.id) {
    return { success: false, error: "Vous ne pouvez pas faire une offre sur votre propre bien." };
  }
  if (property.status !== "AVAILABLE") {
    return {
      success: false,
      error: "Ce bien n'est plus disponible à la vente.",
    };
  }

  const deposit = Math.round(parsed.data.amount * RESERVATION_DEPOSIT_RATE);

  const { error: insErr } = await supabase.from("property_offers").insert({
    property_id: property.id,
    buyer_id: user.id,
    amount_fcfa: parsed.data.amount,
    deposit_fcfa: deposit,
    message: parsed.data.message || null,
    status: "PENDING",
  });

  if (insErr) {
    // Violation de l'index unique = offre active déjà existante.
    if (insErr.code === "23505") {
      return {
        success: false,
        error: "Vous avez déjà une offre en cours sur ce bien.",
      };
    }
    console.error("[property-offers] insert:", insErr.message);
    return { success: false, error: "Impossible d'envoyer l'offre." };
  }

  // Notifie le vendeur (best-effort).
  try {
    const admin = createAdminClient() as unknown as SupabaseClient;
    const { data: buyer } = await admin
      .from("users")
      .select("first_name, last_name")
      .eq("id", user.id)
      .maybeSingle();
    const b = buyer as { first_name?: string; last_name?: string } | null;
    const buyerName =
      `${b?.first_name ?? ""} ${b?.last_name ?? ""}`.trim() || "Un acheteur";

    await dispatchNotification({
      userId: property.owner_id,
      type: "offer_received",
      data: {
        propertyTitle: property.title ?? "votre bien",
        buyerName,
        amount: parsed.data.amount,
      },
    });
  } catch (err) {
    console.error("[property-offers] notify seller:", err);
  }

  revalidatePath(`/properties/${property.id}`);
  revalidatePath("/buyer/offers");
  return { success: true };
}

/**
 * Le vendeur accepte ou refuse une offre reçue sur l'un de ses biens.
 * À l'acceptation, l'acheteur est invité à verser l'acompte de réservation.
 */
export async function decideOffer(
  offerId: string,
  decision: "ACCEPTED" | "REJECTED",
): Promise<ActionResult> {
  if (!offerId) return { success: false, error: "Offre introuvable." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Vous devez être connecté." };

  const admin = createAdminClient() as unknown as SupabaseClient;

  // Charge l'offre + bien (vendeur, titre) + acheteur.
  const { data: offerRow } = await admin
    .from("property_offers")
    .select(
      `id, status, buyer_id, deposit_fcfa,
       property:properties!property_id(owner_id, title)`,
    )
    .eq("id", offerId)
    .maybeSingle();
  if (!offerRow) return { success: false, error: "Offre introuvable." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const o: any = offerRow;
  const ownerId = o.property?.owner_id as string | undefined;
  const propertyTitle = (o.property?.title as string | undefined) ?? "le bien";
  const buyerId = o.buyer_id as string | undefined;
  const deposit = Number(o.deposit_fcfa ?? 0);

  if (ownerId !== user.id) {
    return { success: false, error: "Action réservée au vendeur du bien." };
  }
  if (o.status !== "PENDING") {
    return { success: false, error: "Cette offre a déjà été traitée." };
  }

  const { error: updErr } = await admin
    .from("property_offers")
    .update({ status: decision, decided_at: new Date().toISOString() })
    .eq("id", offerId)
    .eq("status", "PENDING");
  if (updErr) {
    return { success: false, error: "Impossible d'enregistrer la décision." };
  }

  // Notifie l'acheteur.
  try {
    if (buyerId) {
      await dispatchNotification({
        userId: buyerId,
        type: decision === "ACCEPTED" ? "offer_accepted" : "offer_rejected",
        data: { propertyTitle, depositAmount: deposit },
      });
    }
  } catch (err) {
    console.error("[property-offers] notify buyer:", err);
  }

  revalidatePath("/owner/offers");
  revalidatePath("/buyer/offers");
  return { success: true };
}
