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

import { randomUUID } from "node:crypto";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import { walletDebit } from "@/lib/wallet/spend";
import { createPayment } from "@/lib/payments";
import { markOfferDepositPaid } from "@/lib/offers/deposit";
import type { PaymentProvider } from "@/lib/payments/types";

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

// ---------------------------------------------------------------------------
// Acompte de réservation — chargement d'une offre ACCEPTED (acheteur)
// ---------------------------------------------------------------------------

/**
 * Charge l'offre + le bien et vérifie que l'utilisateur courant (acheteur) peut
 * verser l'acompte (offre ACCEPTED lui appartenant). Renvoie les infos utiles.
 */
async function loadPayableOffer(
  admin: SupabaseClient,
  offerId: string,
  buyerId: string,
): Promise<
  | { ok: true; deposit: number; propertyTitle: string }
  | { ok: false; error: string }
> {
  const { data } = await admin
    .from("property_offers")
    .select(
      `id, status, buyer_id, deposit_fcfa,
       property:properties!property_id(title, status)`,
    )
    .eq("id", offerId)
    .maybeSingle();
  if (!data) return { ok: false, error: "Offre introuvable." };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const o: any = data;
  if (o.buyer_id !== buyerId) {
    return { ok: false, error: "Cette offre ne vous appartient pas." };
  }
  if (o.status !== "ACCEPTED") {
    if (o.status === "DEPOSIT_PAID") {
      return { ok: false, error: "L'acompte a déjà été versé." };
    }
    return { ok: false, error: "L'offre n'est pas en attente d'acompte." };
  }
  const deposit = Number(o.deposit_fcfa ?? 0);
  if (deposit <= 0) return { ok: false, error: "Montant d'acompte invalide." };

  // Garde d'idempotence : refuse si un versement d'acompte est déjà en cours
  // ou abouti pour cette offre (évite un double-débit sur double-soumission).
  const { count } = await admin
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("purpose", "SALE_DEPOSIT")
    .eq("metadata->>offer_id", offerId)
    .in("status", ["PENDING", "PROCESSING", "COMPLETED"]);
  if ((count ?? 0) > 0) {
    return {
      ok: false,
      error: "Un versement d'acompte est déjà en cours ou a été effectué.",
    };
  }

  return {
    ok: true,
    deposit,
    propertyTitle: (o.property?.title as string | undefined) ?? "le bien",
  };
}

/**
 * Verse l'acompte de réservation depuis le solde KAZA (wallet). Succès →
 * offre DEPOSIT_PAID + bien RESERVED + notif vendeur.
 */
export async function payOfferDepositFromWallet(
  offerId: string,
): Promise<ActionResult> {
  if (!offerId) return { success: false, error: "Offre introuvable." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Vous devez être connecté." };

  const admin = createAdminClient() as unknown as SupabaseClient;
  const loaded = await loadPayableOffer(admin, offerId, user.id);
  if (!loaded.ok) return { success: false, error: loaded.error };

  // 1) Ligne payments (WALLET, PENDING) — purpose SALE_DEPOSIT, lié à l'offre.
  const { data: payment, error: insErr } = await admin
    .from("payments")
    .insert({
      user_id: user.id,
      amount: loaded.deposit,
      payment_method: "WALLET",
      transaction_id: `WALLET-${randomUUID()}`,
      status: "PENDING",
      purpose: "SALE_DEPOSIT",
      metadata: { offer_id: offerId, paid_from: "wallet" },
    })
    .select("id")
    .single();
  if (insErr || !payment) {
    console.error("[property-offers] wallet deposit insert:", insErr);
    return { success: false, error: "Impossible d'enregistrer le paiement." };
  }

  // 2) Débit atomique du solde.
  const debit = await walletDebit({
    userId: user.id,
    amountFcfa: loaded.deposit,
    type: "BOOKING_DEPOSIT",
    description: `Acompte de réservation — ${loaded.propertyTitle}`,
    referenceId: payment.id,
    metadata: { offer_id: offerId },
  });
  if (!debit.ok) {
    await admin.from("payments").update({ status: "FAILED" }).eq("id", payment.id);
    return { success: false, error: debit.error };
  }

  // 3) Paiement réglé + réservation du bien + notif vendeur.
  await admin
    .from("payments")
    .update({ status: "COMPLETED", payment_date: new Date().toISOString() })
    .eq("id", payment.id);

  try {
    await markOfferDepositPaid(admin, { offerId });
  } catch (err) {
    console.error("[property-offers] markOfferDepositPaid:", err);
  }

  revalidatePath("/buyer/offers");
  revalidatePath("/owner/offers");
  return { success: true };
}

/**
 * Initie le versement de l'acompte par Mobile Money (GeniusPay). Renvoie l'URL
 * de checkout. La réservation est confirmée par le webhook au succès.
 */
export async function initiateOfferDepositPayment(
  offerId: string,
  provider?: PaymentProvider,
): Promise<{ success: boolean; checkoutUrl?: string; error?: string }> {
  if (!offerId) return { success: false, error: "Offre introuvable." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Vous devez être connecté." };

  const admin = createAdminClient() as unknown as SupabaseClient;
  const loaded = await loadPayableOffer(admin, offerId, user.id);
  if (!loaded.ok) return { success: false, error: loaded.error };

  try {
    const result = await createPayment(
      {
        amount: loaded.deposit,
        currency: "XOF",
        description: `Acompte de réservation — ${loaded.propertyTitle}`,
        customerEmail: user.email ?? "",
        customerPhone:
          (user.user_metadata?.phone as string | undefined) ?? undefined,
        metadata: { user_id: user.id, offer_id: offerId },
      },
      { provider: provider ?? "geniuspay" },
    );

    const { error: insErr } = await admin.from("payments").insert({
      user_id: user.id,
      amount: loaded.deposit,
      payment_method: "MOBILE_MONEY",
      transaction_id: result.providerPaymentId,
      status: "PENDING",
      purpose: "SALE_DEPOSIT",
      metadata: { offer_id: offerId },
    });
    if (insErr) {
      console.error("[property-offers] momo deposit insert:", insErr.message);
      return { success: false, error: "Impossible d'enregistrer le paiement." };
    }

    return { success: true, checkoutUrl: result.checkoutUrl };
  } catch (err) {
    console.error("[property-offers] initiate deposit:", err);
    return {
      success: false,
      error: "Le paiement Mobile Money n'a pas pu être initié.",
    };
  }
}

/**
 * Le vendeur finalise la vente après signature chez le notaire :
 * offre DEPOSIT_PAID → CLOSED, bien → SOLD, autres offres annulées, notifs.
 */
export async function markPropertySold(offerId: string): Promise<ActionResult> {
  if (!offerId) return { success: false, error: "Offre introuvable." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Vous devez être connecté." };

  const admin = createAdminClient() as unknown as SupabaseClient;
  const { data: offerRow } = await admin
    .from("property_offers")
    .select(
      `id, status, buyer_id, property_id,
       property:properties!property_id(owner_id, title)`,
    )
    .eq("id", offerId)
    .maybeSingle();
  if (!offerRow) return { success: false, error: "Offre introuvable." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const o: any = offerRow;
  const ownerId = o.property?.owner_id as string | undefined;
  const propertyId = o.property_id as string | undefined;
  const propertyTitle = (o.property?.title as string | undefined) ?? "le bien";
  const buyerId = o.buyer_id as string | undefined;

  if (ownerId !== user.id) {
    return { success: false, error: "Action réservée au vendeur du bien." };
  }
  if (o.status !== "DEPOSIT_PAID") {
    return {
      success: false,
      error: "Le bien doit d'abord être réservé (acompte versé).",
    };
  }

  // Offre → CLOSED.
  await admin
    .from("property_offers")
    .update({ status: "CLOSED", closed_at: new Date().toISOString() })
    .eq("id", offerId)
    .eq("status", "DEPOSIT_PAID");

  // Bien → SOLD.
  if (propertyId) {
    await admin
      .from("properties")
      .update({ status: "SOLD" })
      .eq("id", propertyId);

    // Annule les autres offres encore actives sur ce bien.
    await admin
      .from("property_offers")
      .update({ status: "CANCELLED" })
      .eq("property_id", propertyId)
      .neq("id", offerId)
      .in("status", ["PENDING", "ACCEPTED", "DEPOSIT_PAID"]);
  }

  // Notifie les 2 parties.
  try {
    if (buyerId) {
      await dispatchNotification({
        userId: buyerId,
        type: "sale_closed",
        data: { propertyTitle, forOwner: false },
      });
    }
    await dispatchNotification({
      userId: user.id,
      type: "sale_closed",
      data: { propertyTitle, forOwner: true },
    });
  } catch (err) {
    console.error("[property-offers] notify sale closed:", err);
  }

  revalidatePath("/owner/offers");
  revalidatePath("/buyer/offers");
  revalidatePath("/owner/properties");
  return { success: true };
}
