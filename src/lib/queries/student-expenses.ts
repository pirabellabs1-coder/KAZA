import "server-only";

// =============================================================================
// KAZA — Requêtes Frais partagés (colocation étudiante)
// Tables roommate_expenses + expense_shares (migration 00038), scopées aux
// membres ACCEPTED du groupe (RLS). Lecture via le client serveur (loose cast).
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

async function loose(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

function fullName(first?: string | null, last?: string | null): string {
  const v = `${first ?? ""} ${last ?? ""}`.trim();
  return v.length > 0 ? v : "Colocataire";
}

export interface GroupMember {
  userId: string;
  name: string;
  isLead: boolean;
}

export interface StudentGroup {
  id: string;
  name: string;
  members: GroupMember[];
  /** Colocataire principal (titulaire/responsable) — null si non désigné. */
  leadUserId: string | null;
}

export async function listStudentGroups(
  userId: string,
): Promise<StudentGroup[]> {
  if (!userId) return [];
  try {
    const supabase = await loose();
    const { data: mine } = await supabase
      .from("roommate_members")
      .select("group_id")
      .eq("user_id", userId)
      .eq("status", "ACCEPTED");
    const groupIds = [
      ...new Set(
        ((mine ?? []) as Array<{ group_id: string }>).map((m) => m.group_id),
      ),
    ];
    if (groupIds.length === 0) return [];

    const { data: groups } = await supabase
      .from("roommate_groups")
      .select("id, group_name")
      .in("id", groupIds);

    const { data: members } = await supabase
      .from("roommate_members")
      .select("group_id, user_id, is_lead")
      .in("group_id", groupIds)
      .eq("status", "ACCEPTED");
    const memberRows = (members ?? []) as Array<{
      group_id: string;
      user_id: string;
      is_lead: boolean | null;
    }>;

    const allUserIds = [...new Set(memberRows.map((m) => m.user_id))];
    const { data: users } = await supabase
      .from("users")
      .select("id, first_name, last_name")
      .in("id", allUserIds);
    const nameMap = new Map(
      ((users ?? []) as Array<{
        id: string;
        first_name: string | null;
        last_name: string | null;
      }>).map((u) => [u.id, fullName(u.first_name, u.last_name)]),
    );

    return ((groups ?? []) as Array<{ id: string; group_name: string }>).map(
      (g) => {
        const groupMembers = memberRows.filter((m) => m.group_id === g.id);
        const lead = groupMembers.find((m) => m.is_lead === true);
        return {
          id: g.id,
          name: g.group_name,
          leadUserId: lead?.user_id ?? null,
          members: groupMembers.map((m) => ({
            userId: m.user_id,
            name: nameMap.get(m.user_id) ?? "Colocataire",
            isLead: m.is_lead === true,
          })),
        };
      },
    );
  } catch {
    return [];
  }
}

export interface ExpenseShare {
  id: string;
  userId: string;
  userName: string;
  shareFcfa: number;
  /** Montant déjà réglé sur la part (paiement par tranches). */
  paidFcfa: number;
  settled: boolean;
}

export interface GroupExpense {
  id: string;
  title: string;
  category: string;
  amountFcfa: number;
  expenseDate: string;
  paidById: string;
  paidByName: string;
  shares: ExpenseShare[];
}

export interface MemberBalance {
  userId: string;
  name: string;
  paid: number;
  owed: number;
  balance: number; // paid - owed ; >0 on lui doit, <0 il doit
}

export interface GroupExpensesData {
  expenses: GroupExpense[];
  balances: MemberBalance[];
  totalSpent: number;
  myBalance: number;
  myShareUnsettled: number;
}

export async function getGroupExpenses(
  groupId: string,
  userId: string,
  members: GroupMember[],
): Promise<GroupExpensesData> {
  const empty: GroupExpensesData = {
    expenses: [],
    balances: members.map((m) => ({
      userId: m.userId,
      name: m.name,
      paid: 0,
      owed: 0,
      balance: 0,
    })),
    totalSpent: 0,
    myBalance: 0,
    myShareUnsettled: 0,
  };
  if (!groupId) return empty;
  try {
    const supabase = await loose();
    const nameOf = new Map(members.map((m) => [m.userId, m.name]));

    const { data: exp } = await supabase
      .from("roommate_expenses")
      .select("id, title, category, amount_fcfa, expense_date, paid_by")
      .eq("group_id", groupId)
      .order("expense_date", { ascending: false });
    const expRows = (exp ?? []) as Array<{
      id: string;
      title: string;
      category: string;
      amount_fcfa: number;
      expense_date: string;
      paid_by: string;
    }>;
    if (expRows.length === 0) return empty;

    const { data: shares } = await supabase
      .from("expense_shares")
      .select("id, expense_id, user_id, share_fcfa, paid_fcfa, settled")
      .in(
        "expense_id",
        expRows.map((e) => e.id),
      );
    const shareRows = (shares ?? []) as Array<{
      id: string;
      expense_id: string;
      user_id: string;
      share_fcfa: number;
      paid_fcfa: number | null;
      settled: boolean;
    }>;

    const sharesByExpense = new Map<string, ExpenseShare[]>();
    for (const s of shareRows) {
      const arr = sharesByExpense.get(s.expense_id) ?? [];
      arr.push({
        id: s.id,
        userId: s.user_id,
        userName: nameOf.get(s.user_id) ?? "Colocataire",
        shareFcfa: Number(s.share_fcfa),
        paidFcfa: Number(s.paid_fcfa ?? 0),
        settled: s.settled,
      });
      sharesByExpense.set(s.expense_id, arr);
    }

    const expenses: GroupExpense[] = expRows.map((e) => ({
      id: e.id,
      title: e.title,
      category: e.category,
      amountFcfa: Number(e.amount_fcfa),
      expenseDate: e.expense_date,
      paidById: e.paid_by,
      paidByName: nameOf.get(e.paid_by) ?? "Colocataire",
      shares: sharesByExpense.get(e.id) ?? [],
    }));

    // Soldes par membre
    const paidBy = new Map<string, number>();
    const owedBy = new Map<string, number>();
    for (const e of expRows) {
      paidBy.set(e.paid_by, (paidBy.get(e.paid_by) ?? 0) + Number(e.amount_fcfa));
    }
    for (const s of shareRows) {
      if (!s.settled) {
        const remaining = Math.max(
          0,
          Number(s.share_fcfa) - Number(s.paid_fcfa ?? 0),
        );
        owedBy.set(s.user_id, (owedBy.get(s.user_id) ?? 0) + remaining);
      }
    }

    const balances: MemberBalance[] = members.map((m) => {
      const paid = paidBy.get(m.userId) ?? 0;
      const owed = owedBy.get(m.userId) ?? 0;
      return { userId: m.userId, name: m.name, paid, owed, balance: paid - owed };
    });

    const totalSpent = expRows.reduce((s, e) => s + Number(e.amount_fcfa), 0);
    const mine = balances.find((b) => b.userId === userId);
    const myShareUnsettled = owedBy.get(userId) ?? 0;

    return {
      expenses,
      balances,
      totalSpent,
      myBalance: mine?.balance ?? 0,
      myShareUnsettled,
    };
  } catch {
    return empty;
  }
}
