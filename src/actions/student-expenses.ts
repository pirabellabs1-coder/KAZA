"use server";

import "server-only";

// =============================================================================
// KAZA — Server actions Frais partagés (colocation)
// Réservé aux membres ACCEPTED du groupe (RLS + vérif applicative).
// =============================================================================

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

import { randomUUID } from "node:crypto";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPayment } from "@/lib/payments";
import type { MomoCheckoutFields } from "@/lib/payments/types";
import { walletDebit, walletRefund } from "@/lib/wallet/spend";
import { settleExpenseShareFromPayment } from "@/lib/expenses/settle";

export interface ActionResult {
  success: boolean;
  error?: string;
  id?: string;
}

const expenseSchema = z.object({
  groupId: z.string().uuid(),
  title: z.string().trim().min(2, "Titre requis").max(160),
  category: z.enum([
    "RENT",
    "UTILITIES",
    "GROCERIES",
    "INTERNET",
    "CLEANING",
    "FURNITURE",
    "OTHER",
  ]),
  amount: z.number().positive("Montant invalide"),
  paidBy: z.string().uuid(),
  expenseDate: z.string().optional().default(""),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;

type Loose = {
  from: (t: string) => {
    select: (c: string) => {
      eq: (k: string, v: string) => {
        eq: (k2: string, v2: string) => Promise<{
          data: Array<{ user_id: string }> | null;
        }>;
      };
    };
    insert: (v: unknown) => {
      select: (c: string) => {
        single: () => Promise<{
          data: { id: string } | null;
          error: { message: string } | null;
        }>;
      };
    } & Promise<{ error: { message: string } | null }>;
    update: (v: Record<string, unknown>) => {
      eq: (k: string, v2: string) => Promise<{ error: { message: string } | null }>;
    };
  };
};

export async function createExpense(input: ExpenseInput): Promise<ActionResult> {
  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides.",
    };
  }
  const user = await getCurrentDisplayUser();
  if (!user) return { success: false, error: "Vous devez être connecté." };

  const d = parsed.data;
  const supabase = (await createClient()) as unknown as Loose;

  // Membres ACCEPTED du groupe (et vérifie que l'utilisateur en fait partie)
  const { data: members } = await supabase
    .from("roommate_members")
    .select("user_id")
    .eq("group_id", d.groupId)
    .eq("status", "ACCEPTED");
  const memberIds = (members ?? []).map((m) => m.user_id);
  if (!memberIds.includes(user.id)) {
    return { success: false, error: "Vous n'êtes pas membre de ce groupe." };
  }
  if (memberIds.length === 0) {
    return { success: false, error: "Aucun colocataire dans ce groupe." };
  }
  // Sécurité : le payeur doit être membre du groupe (sinon sa part — avec le
  // reliquat, marquée réglée — sort des soldes affichés et fausse le total dû).
  if (!memberIds.includes(d.paidBy)) {
    return { success: false, error: "Le payeur doit être un membre du groupe." };
  }

  // Insère la dépense
  const { data: expense, error } = await supabase
    .from("roommate_expenses")
    .insert({
      group_id: d.groupId,
      paid_by: d.paidBy,
      created_by: user.id,
      title: d.title,
      category: d.category,
      amount_fcfa: d.amount,
      expense_date: d.expenseDate || new Date().toISOString().slice(0, 10),
    })
    .select("id")
    .single();

  if (error || !expense) {
    return { success: false, error: error?.message ?? "Échec de la création." };
  }

  // Répartition en parts égales ; le reliquat va au payeur. La part du payeur
  // est marquée réglée (il a avancé l'argent).
  const n = memberIds.length;
  const base = Math.floor(d.amount / n);
  const remainder = d.amount - base * n;

  const shares = memberIds.map((uid) => ({
    expense_id: expense.id,
    user_id: uid,
    share_fcfa: uid === d.paidBy ? base + remainder : base,
    settled: uid === d.paidBy,
    settled_at: uid === d.paidBy ? new Date().toISOString() : null,
  }));

  const { error: shareErr } = await supabase
    .from("expense_shares")
    .insert(shares);
  if (shareErr) {
    return { success: false, error: shareErr.message };
  }

  revalidatePath("/student/expenses");
  return { success: true, id: expense.id };
}

export async function settleShare(shareId: string): Promise<ActionResult> {
  if (!shareId) return { success: false, error: "Part introuvable." };
  const user = await getCurrentDisplayUser();
  if (!user) return { success: false, error: "Vous devez être connecté." };

  const supabase = (await createClient()) as unknown as SupabaseClient;

  // Sécurité : on ne peut régler QUE sa propre part. (Sans ce contrôle, tout
  // membre du groupe pouvait marquer réglée la part d'un autre.)
  const { data: share } = await supabase
    .from("expense_shares")
    .select("user_id, settled")
    .eq("id", shareId)
    .maybeSingle();
  const s = share as { user_id?: string; settled?: boolean } | null;
  if (!s) return { success: false, error: "Part introuvable." };
  if (s.user_id !== user.id) {
    return { success: false, error: "Cette part ne vous appartient pas." };
  }
  if (s.settled) return { success: true }; // déjà réglée → idempotent

  const { error } = await supabase
    .from("expense_shares")
    .update({ settled: true, settled_at: new Date().toISOString() })
    .eq("id", shareId)
    .eq("settled", false);
  if (error) return { success: false, error: error.message };

  revalidatePath("/student/expenses");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Règlement d'une part par MOYEN DE PAIEMENT (Mobile Money / FedaPay)
// — alternative au flag manuel. Initialise un checkout provider ; la part est
//   marquée réglée + le payeur (paid_by) remboursé par le webhook au passage
//   du paiement à COMPLETED (purpose = EXPENSE_SHARE).
// ---------------------------------------------------------------------------

export interface ShareCheckoutResult {
  success: boolean;
  error?: string;
  paymentId?: string;
  reference?: string;
}

export async function initiateExpenseShareCheckout(
  shareId: string,
  momo: MomoCheckoutFields,
): Promise<ShareCheckoutResult> {
  if (!shareId) return { success: false, error: "Part introuvable." };
  if (!momo?.phone?.trim() || !momo?.network) {
    return { success: false, error: "Opérateur et numéro Mobile Money requis." };
  }
  const user = await getCurrentDisplayUser();
  if (!user) return { success: false, error: "Vous devez être connecté." };

  const admin = createAdminClient() as unknown as SupabaseClient;

  // Récupère la part + la dépense associée (montant, payeur, titre).
  const { data: share, error: shareErr } = await admin
    .from("expense_shares")
    .select(
      "id, user_id, share_fcfa, settled, expense:roommate_expenses(paid_by, title)",
    )
    .eq("id", shareId)
    .maybeSingle();

  if (shareErr || !share) {
    return { success: false, error: "Part introuvable." };
  }
  const s = share as unknown as {
    id: string;
    user_id: string;
    share_fcfa: number;
    settled: boolean;
    expense: { paid_by?: string | null; title?: string | null } | null;
  };
  if (s.user_id !== user.id) {
    return { success: false, error: "Cette part ne vous appartient pas." };
  }
  if (s.settled) {
    return { success: false, error: "Cette part est déjà réglée." };
  }
  const amount = Math.round(Number(s.share_fcfa) || 0);
  if (amount <= 0) {
    return { success: false, error: "Montant invalide." };
  }
  const paidBy = s.expense?.paid_by ?? null;
  if (paidBy && paidBy === user.id) {
    return { success: false, error: "Vous avez avancé cette dépense." };
  }

  try {
    const result = await createPayment({
      amount,
      currency: "XOF",
      description: `Frais partagés — ${s.expense?.title ?? "colocation"}`,
      customerEmail: user.email ?? "",
      customerPhone: momo.phone,
      network: momo.network,
      countryCode: momo.countryCode ?? "BJ",
      metadata: { user_id: user.id, kind: "expense_share", share_id: shareId },
    });

    const { data: payment, error: insertErr } = await admin
      .from("payments")
      .insert({
        user_id: user.id,
        rental_id: null,
        amount,
        payment_method: "MOBILE_MONEY",
        transaction_id: result.providerPaymentId,
        status: "PENDING",
        purpose: "EXPENSE_SHARE",
        metadata: { share_id: shareId, paid_by: paidBy },
      })
      .select("id")
      .single();
    if (insertErr || !payment) {
      console.error("[expenses] insert payment echec:", insertErr?.message);
      return { success: false, error: "Impossible d'initier le paiement." };
    }

    return {
      success: true,
      paymentId: payment.id,
      reference: result.providerPaymentId,
    };
  } catch (err) {
    console.error("[expenses] checkout echec:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur lors du paiement.",
    };
  }
}

// ---------------------------------------------------------------------------
// Règlement d'une part DEPUIS le solde KAZA (wallet) — alternative à FeexPay.
// Débit atomique, marque la part réglée + rembourse le payeur. Idempotent et
// recrédite le solde si une étape échoue.
// ---------------------------------------------------------------------------

export async function payExpenseShareFromWallet(
  shareId: string,
): Promise<ShareCheckoutResult> {
  if (!shareId) return { success: false, error: "Part introuvable." };
  const user = await getCurrentDisplayUser();
  if (!user) return { success: false, error: "Vous devez être connecté." };

  const admin = createAdminClient() as unknown as SupabaseClient;

  const { data: share, error: shareErr } = await admin
    .from("expense_shares")
    .select(
      "id, user_id, share_fcfa, settled, expense:roommate_expenses(paid_by, title)",
    )
    .eq("id", shareId)
    .maybeSingle();
  if (shareErr || !share) return { success: false, error: "Part introuvable." };

  const s = share as unknown as {
    id: string;
    user_id: string;
    share_fcfa: number;
    settled: boolean;
    expense: { paid_by?: string | null; title?: string | null } | null;
  };
  if (s.user_id !== user.id) {
    return { success: false, error: "Cette part ne vous appartient pas." };
  }
  if (s.settled) return { success: false, error: "Cette part est déjà réglée." };
  const amount = Math.round(Number(s.share_fcfa) || 0);
  if (amount <= 0) return { success: false, error: "Montant invalide." };
  const paidBy = s.expense?.paid_by ?? null;
  if (paidBy && paidBy === user.id) {
    return { success: false, error: "Vous avez avancé cette dépense." };
  }

  // 1) Ligne payments (WALLET, PENDING).
  const { data: payment, error: insErr } = await admin
    .from("payments")
    .insert({
      user_id: user.id,
      rental_id: null,
      amount,
      payment_method: "WALLET",
      transaction_id: `WALLET-${randomUUID()}`,
      status: "PENDING",
      purpose: "EXPENSE_SHARE",
      metadata: { share_id: shareId, paid_by: paidBy, paid_from: "wallet" },
    })
    .select("id")
    .single();
  if (insErr || !payment) {
    return { success: false, error: "Impossible d'enregistrer le paiement." };
  }

  // 2) Débit atomique du solde.
  const debit = await walletDebit({
    userId: user.id,
    amountFcfa: amount,
    type: "EXPENSE_DEBIT",
    description: `Frais partagés — ${s.expense?.title ?? "colocation"}`,
    referenceId: payment.id,
    metadata: { share_id: shareId },
  });
  if (!debit.ok) {
    await admin.from("payments").update({ status: "FAILED" }).eq("id", payment.id);
    return { success: false, error: debit.error };
  }

  // 3) Règlement (part réglée + remboursement du payeur). Sinon → remboursement.
  const settle = await settleExpenseShareFromPayment(admin, {
    shareId,
    paidBy,
    amountFcfa: amount,
    paymentId: payment.id,
  });
  if (!settle.ok) {
    await walletRefund(
      user.id,
      amount,
      "Remboursement — échec règlement frais partagés",
      payment.id,
    );
    await admin.from("payments").update({ status: "REFUNDED" }).eq("id", payment.id);
    return {
      success: false,
      error: "Le paiement n'a pas pu aboutir, votre solde a été recrédité.",
    };
  }

  await admin
    .from("payments")
    .update({ status: "COMPLETED", payment_date: new Date().toISOString() })
    .eq("id", payment.id);

  revalidatePath("/student/expenses");
  revalidatePath("/student/finance");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Paiement par TRANCHES depuis le solde KAZA (« payer doucement »).
// Règle une PARTIE d'une part ; cumule jusqu'au règlement total. Rembourse le
// payeur (paid_by) au fur et à mesure des tranches encaissées.
// ---------------------------------------------------------------------------

export async function payExpenseShareInstallmentFromWallet(
  shareId: string,
  amountFcfa: number,
): Promise<ShareCheckoutResult> {
  if (!shareId) return { success: false, error: "Part introuvable." };
  const amt = Math.round(Number(amountFcfa) || 0);
  if (amt <= 0) return { success: false, error: "Montant invalide." };

  const user = await getCurrentDisplayUser();
  if (!user) return { success: false, error: "Vous devez être connecté." };

  const admin = createAdminClient() as unknown as SupabaseClient;
  const { data: share } = await admin
    .from("expense_shares")
    .select(
      "id, user_id, share_fcfa, paid_fcfa, settled, expense:roommate_expenses(paid_by, title)",
    )
    .eq("id", shareId)
    .maybeSingle();
  const s = share as unknown as {
    id: string;
    user_id: string;
    share_fcfa: number;
    paid_fcfa: number | null;
    settled: boolean;
    expense: { paid_by?: string | null; title?: string | null } | null;
  } | null;
  if (!s) return { success: false, error: "Part introuvable." };
  if (s.user_id !== user.id) {
    return { success: false, error: "Cette part ne vous appartient pas." };
  }
  if (s.settled) return { success: false, error: "Cette part est déjà réglée." };
  const paidBy = s.expense?.paid_by ?? null;
  if (paidBy && paidBy === user.id) {
    return { success: false, error: "Vous avez avancé cette dépense." };
  }

  const total = Math.round(Number(s.share_fcfa) || 0);
  const already = Math.round(Number(s.paid_fcfa ?? 0));
  const remaining = Math.max(0, total - already);
  if (remaining <= 0) return { success: false, error: "Cette part est déjà réglée." };
  const pay = Math.min(amt, remaining); // ne jamais dépasser le reste dû

  // 1) Débit atomique du solde (la tranche).
  const debit = await walletDebit({
    userId: user.id,
    amountFcfa: pay,
    type: "EXPENSE_DEBIT",
    description: `Frais partagés (tranche) — ${s.expense?.title ?? "colocation"}`,
    referenceId: shareId,
    metadata: { share_id: shareId, installment: true },
  });
  if (!debit.ok) return { success: false, error: debit.error };

  // 2) Cumule le montant payé ; règle la part si totalement payée.
  const newPaid = already + pay;
  const fullySettled = newPaid >= total;
  await admin
    .from("expense_shares")
    .update({
      paid_fcfa: newPaid,
      ...(fullySettled
        ? { settled: true, settled_at: new Date().toISOString() }
        : {}),
    })
    .eq("id", shareId)
    .eq("settled", false);

  // 3) Rembourse le payeur de la tranche encaissée (best-effort).
  if (paidBy) {
    await admin.from("wallet_transactions").insert({
      user_id: paidBy,
      type: "ADJUSTMENT",
      amount_fcfa: pay,
      description: `Remboursement frais partagés (tranche) — ${pay.toLocaleString("fr-FR")} FCFA`,
      reference_id: shareId,
    });
  }

  // 4) Trace le paiement (historique) — best-effort.
  await admin.from("payments").insert({
    user_id: user.id,
    rental_id: null,
    amount: pay,
    payment_method: "WALLET",
    transaction_id: `WALLET-${randomUUID()}`,
    status: "COMPLETED",
    payment_date: new Date().toISOString(),
    purpose: "EXPENSE_SHARE",
    metadata: { share_id: shareId, paid_by: paidBy, installment: true },
  });

  revalidatePath("/student/expenses");
  revalidatePath("/student/finance");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Désigne le COLOCATAIRE PRINCIPAL d'un groupe (un seul à la fois).
// ---------------------------------------------------------------------------

export async function setGroupLead(
  groupId: string,
  newLeadUserId: string,
): Promise<ActionResult> {
  if (!groupId || !newLeadUserId) {
    return { success: false, error: "Paramètres manquants." };
  }
  const user = await getCurrentDisplayUser();
  if (!user) return { success: false, error: "Vous devez être connecté." };

  const admin = createAdminClient() as unknown as SupabaseClient;
  const { data: members } = await admin
    .from("roommate_members")
    .select("user_id, is_lead")
    .eq("group_id", groupId)
    .eq("status", "ACCEPTED");
  const rows = (members ?? []) as Array<{
    user_id: string;
    is_lead: boolean | null;
  }>;

  if (!rows.some((m) => m.user_id === user.id)) {
    return { success: false, error: "Vous n'êtes pas membre de ce groupe." };
  }
  const currentLead = rows.find((m) => m.is_lead === true);
  if (currentLead && currentLead.user_id !== user.id) {
    return {
      success: false,
      error: "Seul le colocataire principal actuel peut transférer ce rôle.",
    };
  }
  if (!rows.some((m) => m.user_id === newLeadUserId)) {
    return { success: false, error: "Ce colocataire n'est pas membre du groupe." };
  }

  // Un seul principal : on réinitialise puis on désigne le nouveau.
  await admin
    .from("roommate_members")
    .update({ is_lead: false })
    .eq("group_id", groupId);
  const { error } = await admin
    .from("roommate_members")
    .update({ is_lead: true })
    .eq("group_id", groupId)
    .eq("user_id", newLeadUserId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/student/expenses");
  revalidatePath("/student/colocations");
  return { success: true };
}
