import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { dispatchNotification } from "@/lib/notifications/dispatch";

// =============================================================================
// KAZA — Notifications de paiement de loyer (bailleur + locataire).
// Appelé par le webhook GeniusPay ET le paiement par solde (payRentFromWallet)
// pour que chaque encaissement notifie les deux parties (et signale le bail
// actif au 1er loyer). Best-effort — ne bloque jamais le flux de paiement.
// =============================================================================

export async function notifyRentPayment(
  admin: SupabaseClient,
  input: { rentalId: string; amount: number; activated: boolean },
): Promise<void> {
  if (!input.rentalId) return;
  try {
    const { data } = await admin
      .from("rentals")
      .select(
        "tenant_id, monthly_rent, property:properties(owner_id, title)",
      )
      .eq("id", input.rentalId)
      .maybeSingle();
    const r = data as
      | {
          tenant_id: string;
          monthly_rent: number | string;
          property:
            | { owner_id: string; title: string }
            | Array<{ owner_id: string; title: string }>
            | null;
        }
      | null;
    if (!r) return;
    const prop = Array.isArray(r.property) ? r.property[0] : r.property;
    const ownerId = prop?.owner_id;
    const propertyTitle = prop?.title ?? "le bien";
    const monthlyRent = Number(r.monthly_rent ?? input.amount);

    // 1) Paiement encaissé → bailleur (reçu) + locataire (confirmation).
    if (ownerId) {
      await dispatchNotification({
        userId: ownerId,
        type: "payment_received",
        data: { propertyTitle, amount: input.amount, forPayer: false },
      });
    }
    await dispatchNotification({
      userId: r.tenant_id,
      type: "payment_received",
      data: { propertyTitle, amount: input.amount, forPayer: true },
    });

    // 2) Bail ACTIF → les deux parties (uniquement au 1er loyer).
    if (input.activated) {
      if (ownerId) {
        await dispatchNotification({
          userId: ownerId,
          type: "rental_activated",
          data: { propertyTitle, monthlyRent, forOwner: true },
        });
      }
      await dispatchNotification({
        userId: r.tenant_id,
        type: "rental_activated",
        data: { propertyTitle, monthlyRent, forOwner: false },
      });
    }
  } catch (err) {
    console.warn("[rentals] notifyRentPayment échec:", err);
  }
}
