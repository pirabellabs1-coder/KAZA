import type { Metadata } from "next";

import { BudgetCalculator } from "./budget-calculator";

export const metadata: Metadata = {
  title: "Calculateur de budget",
};

export default function StudentBudgetPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Calculateur de budget
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Estimez et comparez le coût mensuel de votre colocation, par personne.
        </p>
      </div>

      <BudgetCalculator />
    </div>
  );
}
