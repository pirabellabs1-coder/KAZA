import { redirect } from "next/navigation";

// L'ajout de dépense se fait désormais via le dialog réel de /student/expenses
// (branché sur roommate_expenses). Cette ancienne route stub redirige.
export default function NewSharedExpensePage() {
  redirect("/student/expenses");
}
