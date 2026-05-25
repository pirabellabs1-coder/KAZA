"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ExpenseCard,
  type ExpenseCardData,
  type ExpenseCategory,
} from "@/components/student/expense-card";
import {
  SplitSummary,
  type RoommateLite,
} from "@/components/student/split-summary";
import {
  useExpenseSplit,
  type Expense,
} from "@/hooks/use-expense-split";

// --- Mock data --------------------------------------------------------------
// Le user "courant" est Aïcha. Plus tard ces données viendront de Supabase.
const CURRENT_USER_ID = "aicha";

const ROOMMATES: RoommateLite[] = [
  { id: "aicha", name: "Aïcha Diop" },
  { id: "kofi", name: "Kofi Mensah" },
  { id: "mariam", name: "Mariam Touré" },
  { id: "tome", name: "Tomé Da Silva" },
];

const ALL_IDS = ROOMMATES.map((r) => r.id);

interface MockExpense extends Expense {
  title: string;
  category: ExpenseCategory;
  date: string;
}

const MOCK_EXPENSES: MockExpense[] = [
  {
    id: "exp-001",
    title: "Facture SBEE septembre",
    category: "Électricité",
    amount: 24000,
    payerId: "aicha",
    participants: ALL_IDS,
    date: "2026-05-04",
  },
  {
    id: "exp-002",
    title: "Abonnement Moov Internet",
    category: "Internet",
    amount: 20000,
    payerId: "kofi",
    participants: ALL_IDS,
    date: "2026-05-06",
  },
  {
    id: "exp-003",
    title: "Facture SONEB",
    category: "Eau",
    amount: 8000,
    payerId: "mariam",
    participants: ALL_IDS,
    date: "2026-05-08",
  },
  {
    id: "exp-004",
    title: "Courses marché Dantokpa",
    category: "Courses",
    amount: 15000,
    payerId: "tome",
    participants: ALL_IDS,
    date: "2026-05-10",
  },
  {
    id: "exp-005",
    title: "Loyer mai (avance Aïcha)",
    category: "Loyer",
    amount: 120000,
    payerId: "aicha",
    participants: ALL_IDS,
    date: "2026-05-01",
  },
  {
    id: "exp-006",
    title: "Gaz cuisine",
    category: "Autre",
    amount: 7500,
    payerId: "kofi",
    participants: ["aicha", "kofi", "mariam"],
    date: "2026-05-12",
  },
  {
    id: "exp-007",
    title: "Produits ménagers",
    category: "Courses",
    amount: 6500,
    payerId: "mariam",
    participants: ALL_IDS,
    date: "2026-05-14",
  },
  {
    id: "exp-008",
    title: "Réparation pompe à eau",
    category: "Eau",
    amount: 12000,
    payerId: "tome",
    participants: ALL_IDS,
    date: "2026-05-15",
  },
  {
    id: "exp-009",
    title: "Recharge data box",
    category: "Internet",
    amount: 5000,
    payerId: "aicha",
    participants: ALL_IDS,
    date: "2026-05-16",
  },
  {
    id: "exp-010",
    title: "Sortie restau colocs",
    category: "Courses",
    amount: 18000,
    payerId: "kofi",
    participants: ["aicha", "kofi", "tome"],
    date: "2026-05-18",
  },
  {
    id: "exp-011",
    title: "Ampoules + multiprise",
    category: "Électricité",
    amount: 4500,
    payerId: "mariam",
    participants: ALL_IDS,
    date: "2026-05-20",
  },
  {
    id: "exp-012",
    title: "Café et petit-déj semaine",
    category: "Courses",
    amount: 9000,
    payerId: "tome",
    participants: ALL_IDS,
    date: "2026-05-22",
  },
];

function toCardData(expense: MockExpense): ExpenseCardData {
  const payer = ROOMMATES.find((r) => r.id === expense.payerId);
  return {
    id: expense.id,
    title: expense.title,
    category: expense.category,
    amount: expense.amount,
    payerId: expense.payerId,
    payerName: payer?.name ?? "Inconnu",
    date: expense.date,
    participants: expense.participants.map((id) => {
      const m = ROOMMATES.find((r) => r.id === id);
      return { id, name: m?.name ?? id };
    }),
  };
}

export function ExpensesTracker() {
  const { balances, settlements } = useExpenseSplit(MOCK_EXPENSES, ALL_IDS);

  const myBalance =
    balances.find((b) => b.userId === CURRENT_USER_ID)?.net ?? 0;
  // myBalance > 0 : on me doit. myBalance < 0 : je dois.
  const youOwe = myBalance < 0 ? -myBalance : 0;
  const youAreOwed = myBalance > 0 ? myBalance : 0;

  const totalMonth = useMemo(
    () => MOCK_EXPENSES.reduce((sum, e) => sum + e.amount, 0),
    []
  );

  const mineExpenses = MOCK_EXPENSES.filter(
    (e) => e.payerId === CURRENT_USER_ID
  );
  const toSettleExpenses = MOCK_EXPENSES.filter(
    (e) =>
      e.payerId !== CURRENT_USER_ID && e.participants.includes(CURRENT_USER_ID)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Frais Partagés
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Suivez et répartissez les dépenses de votre colocation
          </p>
        </div>
        <Button asChild>
          <Link href="/student/expenses/new">
            <Plus className="mr-2 size-4" />
            Ajouter une dépense
          </Link>
        </Button>
      </div>

      {/* Summary */}
      <SplitSummary
        totalMonth={totalMonth}
        youOwe={youOwe}
        youAreOwed={youAreOwed}
        settlements={settlements}
        currentUserId={CURRENT_USER_ID}
        roommates={ROOMMATES}
      />

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Toutes les dépenses</TabsTrigger>
          <TabsTrigger value="mine">Mes dépenses</TabsTrigger>
          <TabsTrigger value="settle">À régler</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4 space-y-3">
          {MOCK_EXPENSES.map((e) => (
            <ExpenseCard key={e.id} expense={toCardData(e)} />
          ))}
        </TabsContent>

        <TabsContent value="mine" className="mt-4 space-y-3">
          {mineExpenses.length === 0 ? (
            <EmptyState message="Vous n'avez avancé aucune dépense ce mois-ci." />
          ) : (
            mineExpenses.map((e) => (
              <ExpenseCard key={e.id} expense={toCardData(e)} />
            ))
          )}
        </TabsContent>

        <TabsContent value="settle" className="mt-4 space-y-3">
          {toSettleExpenses.length === 0 ? (
            <EmptyState message="Aucune dépense à régler. Bravo !" />
          ) : (
            toSettleExpenses.map((e) => (
              <ExpenseCard key={e.id} expense={toCardData(e)} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/20 p-8 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
