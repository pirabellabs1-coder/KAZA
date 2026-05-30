import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, PiggyBank } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Nouvelle dépense partagée — Étudiant",
};

export default function NewSharedExpensePage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/student/expenses">
          <ArrowLeft className="mr-1.5 size-4" />
          Retour
        </Link>
      </Button>

      <Card className="rounded-2xl">
        <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-kaza-blue/10">
            <PiggyBank className="size-6 text-kaza-blue" />
          </div>
          <h1 className="font-heading text-xl font-bold text-kaza-navy">
            Dépenses partagées — bientôt disponible
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            Le module de gestion des dépenses partagées entre colocataires
            (saisie, répartition automatique, suivi des remboursements) est en
            préparation. Il se branchera sur les membres réels de votre
            colocation.
          </p>
          <Button asChild variant="outline" className="mt-2">
            <Link href="/student/colocations">Voir mes colocations</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
