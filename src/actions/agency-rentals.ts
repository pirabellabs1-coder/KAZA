"use server";

import "server-only";

// =============================================================================
// Kaabo — Server actions Baux agence
// - terminateRental : résiliation d'un bail (statut TERMINATED + date de fin)
// - remindLatePayment : relance d'un loyer en retard (email + SMS + notif)
// Réservé au rôle AGENCY, et strictement scopé aux biens de l'agence.
// =============================================================================

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/notifications/resend";
import { buildEmail } from "@/lib/notifications/email-template";
import { sendSms } from "@/lib/sms/twilio";
import { formatFcfa } from "@/lib/utils";

export interface ActionResult {
  success: boolean;
  error?: string;
}

async function requireAgency() {
  const user = await getCurrentDisplayUser();
  if (!user) return { ok: false as const, error: "Vous devez être connecté." };
  if (user.role !== "AGENCY")
    return { ok: false as const, error: "Action réservée aux agences." };
  return { ok: true as const, userId: user.id };
}

/** Vérifie que le bail appartient bien à un bien de l'agence courante. */
async function rentalBelongsToAgency(
  rentalId: string,
  agencyId: string,
): Promise<
  | { ok: true; tenantId: string; propertyId: string; monthlyRent: number }
  | { ok: false }
> {
  const supabase = await createClient();
  const { data: rental } = await (supabase as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (k: string, v: string) => {
          maybeSingle: () => Promise<{
            data: {
              tenant_id: string;
              property_id: string;
              monthly_rent: number;
            } | null;
          }>;
        };
      };
    };
  })
    .from("rentals")
    .select("tenant_id, property_id, monthly_rent")
    .eq("id", rentalId)
    .maybeSingle();
  if (!rental) return { ok: false };

  const { data: prop } = await (supabase as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (k: string, v: string) => {
          maybeSingle: () => Promise<{ data: { owner_id: string } | null }>;
        };
      };
    };
  })
    .from("properties")
    .select("owner_id")
    .eq("id", rental.property_id)
    .maybeSingle();
  if (!prop || prop.owner_id !== agencyId) return { ok: false };

  return {
    ok: true,
    tenantId: rental.tenant_id,
    propertyId: rental.property_id,
    monthlyRent: Number(rental.monthly_rent),
  };
}

// ---------------------------------------------------------------------------
// Résiliation d'un bail
// ---------------------------------------------------------------------------

export async function terminateRental(
  rentalId: string,
  endDate?: string,
): Promise<ActionResult> {
  if (!rentalId) return { success: false, error: "Bail introuvable." };
  const guard = await requireAgency();
  if (!guard.ok) return { success: false, error: guard.error };

  const owns = await rentalBelongsToAgency(rentalId, guard.userId);
  if (!owns.ok)
    return { success: false, error: "Ce bail n'appartient pas à votre agence." };

  const supabase = await createClient();
  const end = endDate || new Date().toISOString().slice(0, 10);

  const loose = supabase as unknown as SupabaseClient;

  // Récupère le bien lié avant de terminer, pour pouvoir le libérer.
  const { data: rentalRow } = await loose
    .from("rentals")
    .select("property_id")
    .eq("id", rentalId)
    .maybeSingle();
  const propertyId = (rentalRow as { property_id?: string } | null)
    ?.property_id;

  const { error } = await loose
    .from("rentals")
    .update({ status: "TERMINATED", end_date: end })
    .eq("id", rentalId);

  if (error) return { success: false, error: error.message };

  // Libère le bien : RENTED -> AVAILABLE pour qu'il puisse être reloué.
  if (propertyId) {
    await loose
      .from("properties")
      .update({ status: "AVAILABLE" })
      .eq("id", propertyId)
      .eq("status", "RENTED");
  }

  revalidatePath("/agency/rentals");
  revalidatePath(`/agency/rentals/${rentalId}`);
  revalidatePath("/agency/properties");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Relance d'un loyer en retard
// ---------------------------------------------------------------------------

export async function remindLatePayment(
  paymentId: string,
): Promise<ActionResult> {
  if (!paymentId) return { success: false, error: "Paiement introuvable." };
  const guard = await requireAgency();
  if (!guard.ok) return { success: false, error: guard.error };

  const supabase = await createClient();

  // Charge le paiement + bail
  const { data: payment } = await (supabase as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (k: string, v: string) => {
          maybeSingle: () => Promise<{
            data: {
              rental_id: string;
              amount: number;
              status: string;
            } | null;
          }>;
        };
      };
    };
  })
    .from("payments")
    .select("rental_id, amount, status")
    .eq("id", paymentId)
    .maybeSingle();
  if (!payment) return { success: false, error: "Paiement introuvable." };

  const owns = await rentalBelongsToAgency(payment.rental_id, guard.userId);
  if (!owns.ok)
    return { success: false, error: "Paiement hors de votre périmètre." };

  // Coordonnées du locataire (service role pour lire email/phone fiables)
  const admin = createAdminClient();
  const { data: tenant } = await (admin as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (k: string, v: string) => {
          maybeSingle: () => Promise<{
            data: {
              first_name: string | null;
              email: string;
              phone: string | null;
            } | null;
          }>;
        };
      };
    };
  })
    .from("users")
    .select("first_name, email, phone")
    .eq("id", owns.tenantId)
    .maybeSingle();
  if (!tenant?.email && !tenant?.phone) {
    return {
      success: false,
      error: "Aucune coordonnée (email/téléphone) pour ce locataire.",
    };
  }

  const amount = formatFcfa(Number(payment.amount));
  const prenom = tenant?.first_name || "Bonjour";

  // Email
  if (tenant?.email) {
    const html = buildEmail({
      preheader: "Un loyer reste à régler pour votre logement Kaabo.",
      heading: "Rappel de loyer",
      intro: `Bonjour ${prenom},`,
      paragraphs: [
        `Nous vous rappelons qu'un loyer de ${amount} reste à régler pour votre logement géré via Kaabo.`,
        "Merci de procéder au règlement dans les meilleurs délais depuis votre espace locataire.",
      ],
      outro: "Votre agence, via Kaabo",
    });
    await sendEmail(tenant.email, "Rappel : loyer en attente de règlement", html);
  }

  // SMS
  if (tenant?.phone) {
    await sendSms(
      tenant.phone,
      `Kaabo : rappel — un loyer de ${amount} reste a regler. Merci de regulariser depuis votre espace locataire.`,
    );
  }

  // Notification in-app (best-effort)
  try {
    await (admin as unknown as {
      from: (t: string) => {
        insert: (v: Record<string, unknown>) => Promise<{
          error: { message: string } | null;
        }>;
      };
    })
      .from("notifications")
      .insert({
        user_id: owns.tenantId,
        type: "payment_due",
        title: "Rappel de loyer",
        body: `Un loyer de ${amount} reste à régler.`,
        link: "/tenant/payments",
      });
  } catch {
    // non bloquant
  }

  revalidatePath(`/agency/rentals/${payment.rental_id}`);
  return { success: true };
}
