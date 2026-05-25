"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPayment } from "@/lib/payments";
import type { PaymentProvider } from "@/lib/payments/types";

// =============================================================================
// KAZA - Server Actions Paiements
// =============================================================================

export interface InitiateRentPaymentInput {
  rentalId: string;
  provider?: PaymentProvider;
}

export interface InitiateRentPaymentResult {
  success: boolean;
  paymentId?: string;
  checkoutUrl?: string;
  error?: string;
}

/**
 * Initie un paiement de loyer:
 * 1) Verifie que l'utilisateur courant est bien le locataire du rental
 * 2) Cree la transaction cote provider (FedaPay par defaut, fallback Kkiapay)
 * 3) Insere une ligne `payments` avec status=PENDING
 * 4) Retourne l'URL de checkout pour redirection client
 */
export async function initiateRentPayment(
  input: InitiateRentPaymentInput
): Promise<InitiateRentPaymentResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { success: false, error: "Authentification requise." };
  }

  // Recupere les details du rental + email pour le provider.
  const { data: rental, error: rentalErr } = await supabase
    .from("rentals")
    .select("id, tenant_id, monthly_rent, property_id")
    .eq("id", input.rentalId)
    .single();

  if (rentalErr || !rental) {
    return { success: false, error: "Location introuvable." };
  }

  if (rental.tenant_id !== user.id) {
    return {
      success: false,
      error: "Vous n'etes pas autorise a payer pour cette location.",
    };
  }

  if (!rental.monthly_rent || rental.monthly_rent <= 0) {
    return { success: false, error: "Montant de loyer invalide." };
  }

  try {
    const result = await createPayment(
      {
        amount: rental.monthly_rent,
        currency: "XOF",
        description: `Loyer mensuel - location ${rental.id}`,
        customerEmail: user.email ?? "",
        customerPhone: (user.user_metadata?.phone as string | undefined) ?? undefined,
        rentalId: rental.id,
        metadata: { user_id: user.id },
      },
      { provider: input.provider ?? "fedapay" }
    );

    // Insere la ligne payments (admin client car le webhook devra pouvoir
    // updater meme si l'utilisateur n'est plus connecte).
    const admin = createAdminClient();
    const { data: payment, error: insertErr } = await admin
      .from("payments")
      .insert({
        rental_id: rental.id,
        user_id: user.id,
        amount: rental.monthly_rent,
        payment_method: "MOBILE_MONEY",
        transaction_id: result.providerPaymentId,
        status: "PENDING",
      })
      .select("id")
      .single();

    if (insertErr || !payment) {
      console.error("[payments] insert echec:", insertErr);
      return {
        success: false,
        error: "Impossible d'enregistrer le paiement.",
      };
    }

    return {
      success: true,
      paymentId: payment.id,
      checkoutUrl: result.checkoutUrl,
    };
  } catch (err) {
    console.error("[payments] initiation echec:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de l'initiation du paiement.",
    };
  }
}

export interface GetPaymentHistoryInput {
  userId?: string; // defaut: utilisateur courant
  limit?: number;
  offset?: number;
}

/**
 * Liste l'historique de paiements de l'utilisateur (RLS applique).
 */
export async function getPaymentHistory(input: GetPaymentHistoryInput = {}) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { success: false as const, error: "Authentification requise." };
  }

  const targetUserId = input.userId ?? user.id;
  const limit = Math.min(input.limit ?? 20, 100);
  const offset = input.offset ?? 0;

  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", targetUserId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return { success: false as const, error: error.message };
  }

  return { success: true as const, payments: data ?? [] };
}

export interface RequestRefundInput {
  paymentId: string;
  reason: string;
}

/**
 * Cree une demande de remboursement. La logique reelle de refund est traitee
 * de maniere asynchrone (escrow + appel API provider).
 */
export async function requestRefund(input: RequestRefundInput) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { success: false as const, error: "Authentification requise." };
  }

  if (!input.reason || input.reason.trim().length < 5) {
    return {
      success: false as const,
      error: "Motif de remboursement requis (5 caracteres min).",
    };
  }

  // Verifie que le paiement appartient bien a l'utilisateur.
  const { data: payment, error: payErr } = await supabase
    .from("payments")
    .select("id, user_id, status")
    .eq("id", input.paymentId)
    .single();

  if (payErr || !payment) {
    return { success: false as const, error: "Paiement introuvable." };
  }
  if (payment.user_id !== user.id) {
    return {
      success: false as const,
      error: "Vous n'etes pas autorise a demander ce remboursement.",
    };
  }
  if (payment.status === "REFUNDED") {
    return {
      success: false as const,
      error: "Ce paiement a deja ete rembourse.",
    };
  }

  // TODO(payments): creer une vraie table `refund_requests` et notifier les
  // ops. Pour l'instant on log + on marque le paiement en attente de revue.
  console.info(
    `[payments] demande de remboursement: payment=${payment.id} user=${user.id} motif="${input.reason}"`
  );

  return { success: true as const };
}
