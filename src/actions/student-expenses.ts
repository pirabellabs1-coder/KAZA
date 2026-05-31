"use server";

import "server-only";

// =============================================================================
// KAZA — Server actions Frais partagés (colocation)
// Réservé aux membres ACCEPTED du groupe (RLS + vérif applicative).
// =============================================================================

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";

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
