// =============================================================================
// KAZA — Server actions Wallet & demandes de retrait
// - Demande de retrait (locataire/proprio/agence)
// - Mise à jour RIB / Mobile Money
// - Admin : approuver / refuser une demande de retrait
// =============================================================================

"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPayment } from "@/lib/payments";
import type { PaymentProvider } from "@/lib/payments/types";

// Commission KAZA prélevée sur chaque retrait
const WITHDRAWAL_FEE_RATE = 0.01; // 1%
const MIN_WITHDRAWAL = 5000;

// Recharge wallet
const MIN_TOPUP = 500;
const MAX_TOPUP = 5_000_000;

// =============================================================================
// REQUEST WITHDRAWAL — utilisateur authentifié
// =============================================================================

const withdrawalSchema = z.object({
  amount: z
    .number()
    .positive("Montant invalide")
    .min(MIN_WITHDRAWAL, `Minimum ${MIN_WITHDRAWAL.toLocaleString("fr-FR")} FCFA`),
  method: z.enum(["BANK_TRANSFER", "MOBILE_MONEY", "CASH"]),
  destination: z
    .string()
    .min(5, "Destination trop courte")
    .max(200, "Destination trop longue"),
});

export type WithdrawalInput = z.infer<typeof withdrawalSchema>;

export async function requestWithdrawal(
  input: WithdrawalInput,
): Promise<{ success: boolean; error?: string }> {
  const parsed = withdrawalSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  // Vérifie le solde et l'état du wallet
  const { data: wallet } = await (supabase as any)
    .from("user_wallets")
    .select("balance_fcfa, is_frozen")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!wallet) {
    return {
      success: false,
      error:
        "Votre wallet est vide. Vous pourrez demander un retrait dès le premier paiement reçu.",
    };
  }
  if (wallet.is_frozen) {
    return {
      success: false,
      error: "Wallet gelé. Contactez le support KAZA.",
    };
  }

  const balance = Number(wallet.balance_fcfa);
  if (parsed.data.amount > balance) {
    return {
      success: false,
      error: `Solde insuffisant. Disponible : ${balance.toLocaleString("fr-FR")} FCFA`,
    };
  }

  const fee = Math.round(parsed.data.amount * WITHDRAWAL_FEE_RATE);
  const netAmount = parsed.data.amount - fee;

  const { error: insertError } = await (supabase as any)
    .from("withdrawal_requests")
    .insert({
      user_id: user.id,
      amount_fcfa: parsed.data.amount,
      method: parsed.data.method,
      destination: parsed.data.destination,
      fee_fcfa: fee,
      net_amount_fcfa: netAmount,
      status: "PENDING",
    });
  if (insertError) return { success: false, error: insertError.message };

  // Bloque le montant via wallet_transaction PAYOUT_REQUESTED (négatif)
  await (supabase as any).from("wallet_transactions").insert({
    user_id: user.id,
    type: "PAYOUT_REQUESTED",
    amount_fcfa: -parsed.data.amount,
    description: `Demande de retrait ${parsed.data.method} → ${parsed.data.destination}`,
  });

  revalidatePath("/owner/wallet");
  revalidatePath("/agency/wallet");
  revalidatePath("/admin/payouts");
  return { success: true };
}

// =============================================================================
// RECHARGE WALLET (TOP-UP) par Mobile Money / FedaPay
// — initialise un checkout provider ; le wallet est crédité par le webhook
//   au passage du paiement à COMPLETED (purpose = WALLET_TOPUP).
// =============================================================================

export interface TopUpResult {
  success: boolean;
  error?: string;
  checkoutUrl?: string;
}

export async function initiateWalletTopUp(
  amount: number,
  provider: PaymentProvider = "fedapay",
): Promise<TopUpResult> {
  const value = Math.round(Number(amount) || 0);
  if (value < MIN_TOPUP) {
    return {
      success: false,
      error: `Montant minimum : ${MIN_TOPUP.toLocaleString("fr-FR")} FCFA`,
    };
  }
  if (value > MAX_TOPUP) {
    return { success: false, error: "Montant trop élevé." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  try {
    const result = await createPayment(
      {
        amount: value,
        currency: "XOF",
        description: `Recharge KAZA Wallet — ${value.toLocaleString("fr-FR")} FCFA`,
        customerEmail: user.email ?? "",
        customerPhone:
          (user.user_metadata?.phone as string | undefined) ?? undefined,
        metadata: { user_id: user.id, kind: "wallet_topup" },
      },
      { provider },
    );

    const admin = createAdminClient() as unknown as SupabaseClient;
    const { error: insertErr } = await admin.from("payments").insert({
      user_id: user.id,
      rental_id: null,
      amount: value,
      payment_method: "MOBILE_MONEY",
      transaction_id: result.providerPaymentId,
      status: "PENDING",
      purpose: "WALLET_TOPUP",
    });
    if (insertErr) {
      console.error("[wallet] insert payment topup echec:", insertErr.message);
      return { success: false, error: "Impossible d'initier la recharge." };
    }

    return { success: true, checkoutUrl: result.checkoutUrl };
  } catch (err) {
    console.error("[wallet] topup checkout echec:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur lors de la recharge.",
    };
  }
}

// =============================================================================
// UPDATE BANK DETAILS — utilisateur authentifié
// =============================================================================

const bankDetailsSchema = z.object({
  iban: z.string().optional(),
  bankName: z.string().optional(),
  mobileMoneyNumber: z.string().optional(),
  mobileMoneyProvider: z.string().optional(),
});

export type BankDetailsInput = z.infer<typeof bankDetailsSchema>;

export async function updateBankDetails(
  input: BankDetailsInput,
): Promise<{ success: boolean; error?: string }> {
  const parsed = bankDetailsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Données invalides" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const { error } = await (supabase as any).from("user_wallets").upsert(
    {
      user_id: user.id,
      iban: parsed.data.iban?.trim() || null,
      bank_name: parsed.data.bankName?.trim() || null,
      mobile_money_number: parsed.data.mobileMoneyNumber?.trim() || null,
      mobile_money_provider: parsed.data.mobileMoneyProvider?.trim() || null,
    },
    { onConflict: "user_id" },
  );
  if (error) return { success: false, error: error.message };

  revalidatePath("/owner/wallet");
  revalidatePath("/agency/wallet");
  return { success: true };
}

// =============================================================================
// ADMIN — approuver une demande
// =============================================================================

async function requireAdmin(): Promise<
  | { ok: true; userId: string }
  | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Non authentifié" };

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if ((profile as any)?.role !== "ADMIN") {
    return { ok: false, error: "Admin uniquement" };
  }
  return { ok: true, userId: user.id };
}

export async function approveWithdrawal(
  id: string,
  reference?: string,
): Promise<{ success: boolean; error?: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  const supabase = await createClient();
  const { data: w } = await (supabase as any)
    .from("withdrawal_requests")
    .select("user_id, amount_fcfa, status")
    .eq("id", id)
    .maybeSingle();
  if (!w) return { success: false, error: "Demande introuvable" };
  if (w.status !== "PENDING") {
    return { success: false, error: "Demande déjà traitée" };
  }

  // Garde atomique anti double-débit : l'UPDATE n'aboutit que si la demande
  // est ENCORE en PENDING. Deux appels concurrents → un seul met à jour une ligne.
  const { data: updatedRows, error: updateError } = await (supabase as any)
    .from("withdrawal_requests")
    .update({
      status: "COMPLETED",
      processed_at: new Date().toISOString(),
      processed_by: guard.userId,
      reference: reference ?? null,
    })
    .eq("id", id)
    .eq("status", "PENDING")
    .select("id");
  if (updateError) return { success: false, error: updateError.message };
  if (!updatedRows || updatedRows.length === 0) {
    return { success: false, error: "Demande déjà traitée (conflit)." };
  }

  // Marque la sortie effective (montant 0 car déjà déduit lors du PAYOUT_REQUESTED)
  await (supabase as any).from("wallet_transactions").insert({
    user_id: w.user_id,
    type: "PAYOUT_PROCESSED",
    amount_fcfa: 0,
    description: `Retrait traité ${reference ?? ""}`.trim(),
    reference_id: id,
  });

  revalidatePath("/admin/payouts");
  revalidatePath("/owner/wallet");
  revalidatePath("/agency/wallet");
  return { success: true };
}

// =============================================================================
// ADMIN — refuser une demande (restitue le montant au wallet)
// =============================================================================

export async function rejectWithdrawal(
  id: string,
  reason: string,
): Promise<{ success: boolean; error?: string }> {
  if (!reason || reason.trim().length < 3) {
    return { success: false, error: "Motif du refus requis (3 caractères min.)" };
  }

  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  const supabase = await createClient();
  const { data: w } = await (supabase as any)
    .from("withdrawal_requests")
    .select("user_id, amount_fcfa, status")
    .eq("id", id)
    .maybeSingle();
  if (!w) return { success: false, error: "Demande introuvable" };
  if (w.status !== "PENDING") {
    return { success: false, error: "Demande déjà traitée" };
  }

  // Garde atomique : un seul refus possible même en concurrence.
  const { data: updatedRows, error: updateError } = await (supabase as any)
    .from("withdrawal_requests")
    .update({
      status: "REJECTED",
      processed_at: new Date().toISOString(),
      processed_by: guard.userId,
      notes: reason.trim(),
    })
    .eq("id", id)
    .eq("status", "PENDING")
    .select("id");
  if (updateError) return { success: false, error: updateError.message };
  if (!updatedRows || updatedRows.length === 0) {
    return { success: false, error: "Demande déjà traitée (conflit)." };
  }

  // Restitue le montant initialement bloqué (positif)
  await (supabase as any).from("wallet_transactions").insert({
    user_id: w.user_id,
    type: "ADJUSTMENT",
    amount_fcfa: Number(w.amount_fcfa),
    description: `Restitution suite refus demande retrait : ${reason.trim()}`,
    reference_id: id,
  });

  revalidatePath("/admin/payouts");
  revalidatePath("/owner/wallet");
  revalidatePath("/agency/wallet");
  return { success: true };
}
