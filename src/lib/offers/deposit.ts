import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { dispatchNotification } from "@/lib/notifications/dispatch";

// =============================================================================
// Kaabo — Acompte de réservation d'achat (helper partagé)
//
// Appelé soit par l'action wallet (paiement immédiat), soit par le webhook
// FeexPay (Mobile Money confirmé). Marque l'offre DEPOSIT_PAID, réserve le
// bien (RESERVED) et notifie le vendeur. Idempotent.
// =============================================================================

export async function markOfferDepositPaid(
  admin: SupabaseClient,
  params: { offerId: string },
): Promise<{ ok: boolean }> {
  const { offerId } = params;
  if (!offerId) return { ok: false };

  // Charge l'offre + bien + acheteur.
  const { data: offerRow } = await admin
    .from("property_offers")
    .select(
      `id, status, deposit_fcfa, buyer_id, property_id,
       buyer:users!buyer_id(first_name, last_name),
       property:properties!property_id(owner_id, title, status)`,
    )
    .eq("id", offerId)
    .maybeSingle();
  if (!offerRow) return { ok: false };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const o: any = offerRow;

  // Idempotence : ne (re)traite que si l'offre était ACCEPTED.
  if (o.status !== "ACCEPTED") {
    return { ok: o.status === "DEPOSIT_PAID" };
  }

  const ownerId = o.property?.owner_id as string | undefined;
  const propertyId = o.property_id as string | undefined;
  const propertyTitle = (o.property?.title as string | undefined) ?? "le bien";
  const deposit = Number(o.deposit_fcfa ?? 0);
  const buyerName =
    `${o.buyer?.first_name ?? ""} ${o.buyer?.last_name ?? ""}`.trim() ||
    "L’acheteur";

  // Offre → DEPOSIT_PAID (garde WHERE status=ACCEPTED contre la double exécution).
  const { error: updErr } = await admin
    .from("property_offers")
    .update({ status: "DEPOSIT_PAID", deposit_paid_at: new Date().toISOString() })
    .eq("id", offerId)
    .eq("status", "ACCEPTED");
  if (updErr) {
    console.error("[offers/deposit] update offer:", updErr.message);
    return { ok: false };
  }

  // Bien → RESERVED (si encore disponible).
  if (propertyId) {
    await admin
      .from("properties")
      .update({ status: "RESERVED" })
      .eq("id", propertyId)
      .in("status", ["AVAILABLE", "PENDING_REVIEW"]);
  }

  // Notifie le vendeur (best-effort).
  try {
    if (ownerId) {
      await dispatchNotification({
        userId: ownerId,
        type: "offer_deposit_paid",
        data: { propertyTitle, buyerName, depositAmount: deposit },
      });
    }
  } catch (err) {
    console.error("[offers/deposit] notify seller:", err);
  }

  return { ok: true };
}
