"use server";

// =============================================================================
// Kaabo — Locations côté propriétaire (Server Actions)
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
import { sendEmail } from "@/lib/notifications/resend";
import { buildEmail } from "@/lib/notifications/email-template";
import { sendSms } from "@/lib/sms/twilio";
import { formatFcfa } from "@/lib/utils";

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

/**
 * Relance un locataire pour un loyer en attente. Réservé au PROPRIÉTAIRE du
 * bien concerné. Envoie email + SMS + notification in-app (best-effort).
 */
export async function remindTenantRentPayment(
  paymentId: string,
): Promise<ActionResult> {
  if (!paymentId) return { success: false, error: "Paiement introuvable." };

  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return { success: false, error: "Vous devez être connecté." };
  }

  const admin = createAdminClient() as unknown as SupabaseClient;

  // Paiement + bail + bien + locataire.
  const { data: paymentRow } = await admin
    .from("payments")
    .select(
      `id, amount, status,
       rental:rentals!payments_rental_id_fkey(
         tenant_id,
         property:properties!rentals_property_id_fkey(owner_id, title)
       )`,
    )
    .eq("id", paymentId)
    .maybeSingle();
  if (!paymentRow) return { success: false, error: "Paiement introuvable." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p: any = paymentRow;
  const rental = p.rental;
  const ownerId = rental?.property?.owner_id as string | undefined;
  const tenantId = rental?.tenant_id as string | undefined;
  const propertyTitle =
    (rental?.property?.title as string | undefined) ?? "votre logement";

  if (ownerId !== user.id) {
    return { success: false, error: "Action réservée au propriétaire du bien." };
  }
  if (String(p.status).toUpperCase() === "COMPLETED") {
    return { success: false, error: "Ce loyer est déjà réglé." };
  }
  if (!tenantId) {
    return { success: false, error: "Locataire introuvable." };
  }

  const { data: tenant } = await admin
    .from("users")
    .select("first_name, email, phone")
    .eq("id", tenantId)
    .maybeSingle();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t: any = tenant;
  if (!t?.email && !t?.phone) {
    return {
      success: false,
      error: "Aucune coordonnée (email/téléphone) pour ce locataire.",
    };
  }

  const amount = formatFcfa(Number(p.amount));
  const prenom = (t?.first_name as string | undefined) || "Bonjour";

  if (t?.email) {
    const html = buildEmail({
      preheader: "Un loyer reste à régler pour votre logement Kaabo.",
      heading: "Rappel de loyer",
      intro: `Bonjour ${prenom},`,
      paragraphs: [
        `Un loyer de ${amount} reste à régler pour « ${propertyTitle} ».`,
        "Merci de procéder au règlement depuis votre espace locataire.",
      ],
      outro: "Votre propriétaire, via Kaabo",
    });
    await sendEmail(
      t.email as string,
      "Rappel : loyer en attente de règlement",
      html,
    );
  }

  if (t?.phone) {
    await sendSms(
      t.phone as string,
      `Kaabo : rappel - un loyer de ${amount} reste a regler pour ${propertyTitle}. Merci de regulariser depuis votre espace locataire.`,
    );
  }

  try {
    await admin.from("notifications").insert({
      user_id: tenantId,
      type: "payment_due",
      title: "Rappel de loyer",
      body: `Un loyer de ${amount} reste à régler pour ${propertyTitle}.`,
      link: "/tenant/payments",
      metadata: {},
      read_at: null,
    });
  } catch (err) {
    console.error("[owner-rentals] notify remind:", err);
  }

  revalidatePath("/owner/finance");
  return { success: true };
}
