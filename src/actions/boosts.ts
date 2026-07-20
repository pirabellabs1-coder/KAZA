"use server";

// =============================================================================
// Kaabo — Boosts d'annonce (Server Actions)
//
// Activation d'un boost de visibilité sur une annonce. Flow wallet-based MVP :
//  1) Vérifie l'authentification + propriété du bien
//  2) Débite le wallet Kaabo de l'utilisateur si solde suffisant (insertion
//     d'une `wallet_transactions` négative — le trigger `on_wallet_tx_insert`
//     met à jour `user_wallets.balance_fcfa` / `total_out_fcfa`)
//  3) Insère la ligne `property_boosts` (ends_at = now + days)
//  4) Retourne success
//
// Si le wallet est insuffisant on renvoie INSUFFICIENT_FUNDS — l'UI invitera
// l'utilisateur à recharger son wallet (intégration FedaPay / mobile money à
// venir pour un paiement direct).
// =============================================================================

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPayment } from "@/lib/payments";
import type { MomoCheckoutFields } from "@/lib/payments/types";
import { walletDebit } from "@/lib/wallet/spend";

// La table `property_boosts` et les tables wallet ne sont pas typées dans
// `src/types/supabase.ts` — fallback sur le client générique.
async function getLooseClient(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

export interface ActiveBoostDTO {
  id: string;
  propertyId: string;
  propertyTitle: string;
  plan: string;
  amount: number;
  startedAt: string;
  endsAt: string;
  status: string;
}

export interface ActivateBoostInput {
  propertyId: string;
  plan: string;
  days: number;
  amount: number;
}

export interface ActivateBoostResult {
  success: boolean;
  error?: string;
  boostId?: string;
}

/**
 * Active un boost pour une annonce de l'utilisateur courant en débitant son
 * wallet Kaabo.
 */
export async function activateBoost(
  input: ActivateBoostInput,
): Promise<ActivateBoostResult> {
  const { propertyId, plan, days, amount } = input;

  if (!propertyId || !plan || days <= 0) {
    return { success: false, error: "INVALID_INPUT" };
  }

  const supabase = await getLooseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "NOT_AUTHENTICATED" };

  // 1) Vérifie que l'utilisateur possède bien cette annonce.
  const { data: property, error: propErr } = await supabase
    .from("properties")
    .select("id, owner_id")
    .eq("id", propertyId)
    .maybeSingle();

  if (propErr || !property) return { success: false, error: "NOT_FOUND" };
  if (property.owner_id !== user.id) {
    return { success: false, error: "NOT_OWNER" };
  }

  const priceFcfa = Math.max(0, Math.round(Number(amount) || 0));

  // 2) Débit wallet si le boost est payant. Passe par le chemin serveur
  //    sécurisé `walletDebit` (RPC atomique : verrou + vérif gel/solde +
  //    insertion de la transaction négative). Le débit RLS direct était rejeté.
  let walletTxId: string | null = null;
  if (priceFcfa > 0) {
    const debit = await walletDebit({
      userId: user.id,
      amountFcfa: priceFcfa,
      type: "BOOST_DEBIT",
      description: `Boost annonce — ${plan} (${days} jours)`,
      referenceId: propertyId,
    });
    if (!debit.ok) {
      return { success: false, error: debit.error };
    }
    walletTxId = debit.txId;
  }

  // 3) Insère le boost (ends_at = now + days).
  const now = new Date();
  const endsAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const { data: boost, error: boostErr } = await supabase
    .from("property_boosts")
    .insert({
      property_id: propertyId,
      user_id: user.id,
      plan,
      amount: priceFcfa,
      starts_at: now.toISOString(),
      ends_at: endsAt.toISOString(),
      status: "ACTIVE",
      payment_id: walletTxId,
    })
    .select("id")
    .single();

  if (boostErr || !boost) {
    return { success: false, error: boostErr?.message ?? "INTERNAL" };
  }

  revalidatePath("/owner/promotion");

  return { success: true, boostId: boost.id as string };
}

// ---------------------------------------------------------------------------
// Paiement d'un boost par MOYEN DE PAIEMENT (Mobile Money / FedaPay)
// — alternative au débit du solde wallet. Initialise un checkout provider ;
//   le boost est activé par le webhook au passage du paiement à COMPLETED
//   (purpose = BOOST, contexte lu depuis payments.metadata).
// ---------------------------------------------------------------------------

export interface BoostCheckoutResult {
  success: boolean;
  error?: string;
  paymentId?: string;
  reference?: string;
}

export async function initiateBoostCheckout(
  input: ActivateBoostInput,
  momo: MomoCheckoutFields,
): Promise<BoostCheckoutResult> {
  const { propertyId, plan, days } = input;
  const priceFcfa = Math.max(0, Math.round(Number(input.amount) || 0));

  if (!propertyId || !plan || days <= 0) {
    return { success: false, error: "INVALID_INPUT" };
  }
  if (priceFcfa <= 0) {
    return { success: false, error: "INVALID_AMOUNT" };
  }
  if (!momo?.phone?.trim() || !momo?.network) {
    return { success: false, error: "Opérateur et numéro Mobile Money requis." };
  }

  const supabase = await getLooseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "NOT_AUTHENTICATED" };

  // Vérifie la propriété du bien avant d'initier un paiement.
  const { data: property, error: propErr } = await supabase
    .from("properties")
    .select("id, owner_id, title")
    .eq("id", propertyId)
    .maybeSingle();

  if (propErr || !property) return { success: false, error: "NOT_FOUND" };
  if (property.owner_id !== user.id) {
    return { success: false, error: "NOT_OWNER" };
  }

  try {
    const result = await createPayment({
      amount: priceFcfa,
      currency: "XOF",
      description: `Boost annonce « ${property.title ?? "—"} » — ${plan} (${days} j)`,
      customerEmail: user.email ?? "",
      customerPhone: momo.phone,
      network: momo.network,
      countryCode: momo.countryCode ?? "BJ",
      metadata: {
        user_id: user.id,
        kind: "boost",
        property_id: propertyId,
        plan,
        days: String(days),
      },
    });

    const admin = createAdminClient() as unknown as SupabaseClient;
    const { data: payment, error: insertErr } = await admin
      .from("payments")
      .insert({
        user_id: user.id,
        rental_id: null,
        amount: priceFcfa,
        payment_method: "MOBILE_MONEY",
        transaction_id: result.providerPaymentId,
        status: "PENDING",
        purpose: "BOOST",
        metadata: {
          property_id: propertyId,
          plan,
          days,
        },
      })
      .select("id")
      .single();
    if (insertErr || !payment) {
      console.error("[boosts] insert payment echec:", insertErr?.message);
      return { success: false, error: "Impossible d'initier le paiement." };
    }

    return {
      success: true,
      paymentId: payment.id,
      reference: result.providerPaymentId,
    };
  } catch (err) {
    console.error("[boosts] checkout echec:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur lors du paiement.",
    };
  }
}

/**
 * Annule un boost actif appartenant à l'utilisateur courant.
 * (Le débit wallet n'est pas remboursé — boost déjà consommé.)
 */
export async function cancelBoost(
  boostId: string,
): Promise<{ success: boolean; error?: string }> {
  if (!boostId) return { success: false, error: "INVALID_INPUT" };

  const supabase = await getLooseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "NOT_AUTHENTICATED" };

  const { error } = await supabase
    .from("property_boosts")
    .update({ status: "CANCELLED" })
    .eq("id", boostId)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/owner/promotion");
  return { success: true };
}

/**
 * Liste les boosts actifs de l'utilisateur courant (status ACTIVE et non
 * expirés), avec le titre de l'annonce.
 */
export async function listActiveBoosts(): Promise<ActiveBoostDTO[]> {
  const supabase = await getLooseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("property_boosts")
    .select(
      `
      id, property_id, plan, amount, starts_at, ends_at, status,
      property:properties(title)
    `,
    )
    .eq("user_id", user.id)
    .eq("status", "ACTIVE")
    .gt("ends_at", new Date().toISOString())
    .order("starts_at", { ascending: false });

  if (error) {
    console.error("[boosts] listActiveBoosts:", error.message);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>): ActiveBoostDTO => {
    const property = (row.property ?? null) as { title?: string | null } | null;
    return {
      id: String(row.id ?? ""),
      propertyId: String(row.property_id ?? ""),
      propertyTitle: property?.title ?? "—",
      plan: String(row.plan ?? ""),
      amount: Number(row.amount ?? 0),
      startedAt: String(row.starts_at ?? ""),
      endsAt: String(row.ends_at ?? ""),
      status: String(row.status ?? "ACTIVE"),
    };
  });
}
