import type { Metadata } from "next";
import { ExpensesTracker } from "./expenses-tracker";

export const metadata: Metadata = {
  title: "Frais Partagés",
};

export default function StudentExpensesPage() {
  // Pour l'instant les données sont mockées dans <ExpensesTracker />.
  // À terme : fetch Supabase ici (RSC) puis passage en props.
  return <ExpensesTracker />;
}
