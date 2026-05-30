"use client";

import Link from "next/link";
import { Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// =============================================================================
// KAZA — Espace étudiant : suivi des frais partagés (colocation)
//
// Tant que la query Supabase `listRoommateExpenses` n'est pas branchée, on
// affiche un empty state honnête plutôt que des dépenses et colocataires
// inventés. La logique de split (useExpenseSplit) reste disponible côté
// hooks pour quand on rebranche le composant à de vraies données.
// =============================================================================

export function ExpensesTracker() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Frais Partagés
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Suivez et répartissez les dépenses de votre colocation.
          </p>
        </div>
        <Button asChild>
          <Link href="/student/expenses/new">
            <Plus className="mr-2 size-4" />
            Ajouter une dépense
          </Link>
        </Button>
      </div>

      {/* Empty state — aucune dépense */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center px-6 py-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-kaza-blue/10">
            <Wallet className="size-7 text-kaza-blue" />
          </div>
          <p className="mt-4 font-heading text-base font-semibold text-kaza-navy">
            Aucune dépense enregistrée
          </p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Ajoutez votre première dépense partagée (loyer, électricité, eau,
            courses…). KAZA calculera automatiquement qui doit quoi à qui pour
            tout équilibrer en fin de mois.
          </p>
          <Button asChild className="mt-5">
            <Link href="/student/expenses/new">
              <Plus className="mr-2 size-4" />
              Ajouter une dépense
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
