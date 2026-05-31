"use server";

import "server-only";

// =============================================================================
// KAZA — Server actions Frais partagés (colocation)
// Réservé aux membres ACCEPTED du groupe (RLS + vérif applicative).
// =============================================================================

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPayment } from "@/lib/payments";
import type { PaymentProvider } from "@/lib/payments/types";

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

  const supabase = (await createClient()) as unknown as Loose;
  const { error } = await supabase
    .from("expense_shares")
    .update({ settled: true, settled_at: new Date().toISOString() })
    .eq("id", shareId);
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
  checkoutUrl?: string;
}

export async function initiateExpenseShareCheckout(
  shareId: string,
  provider: PaymentProvider = "geniuspay",
): Promise<ShareCheckoutResult> {
  if (!shareId) return { success: false, error: "Part introuvable." };
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
    const result = await createPayment(
      {
        amount,
        currency: "XOF",
        description: `Frais partagés — ${s.expense?.title ?? "colocation"}`,
        customerEmail: user.email ?? "",
        metadata: { user_id: user.id, kind: "expense_share", share_id: shareId },
      },
      { provider },
    );

    const { error: insertErr } = await admin.from("payments").insert({
      user_id: user.id,
      rental_id: null,
      amount,
      payment_method: "MOBILE_MONEY",
      transaction_id: result.providerPaymentId,
      status: "PENDING",
      purpose: "EXPENSE_SHARE",
      metadata: { share_id: shareId, paid_by: paidBy },
    });
    if (insertErr) {
      console.error("[expenses] insert payment echec:", insertErr.message);
      return { success: false, error: "Impossible d'initier le paiement." };
    }

    return { success: true, checkoutUrl: result.checkoutUrl };
  } catch (err) {
    console.error("[expenses] checkout echec:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur lors du paiement.",
    };
  }
}
