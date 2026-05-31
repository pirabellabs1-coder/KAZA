import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FileText, Info } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { ReportGenerator } from "@/components/reports/report-generator";

export const metadata: Metadata = {
  title: "Rapports — KAZA Étudiant",
  description: "Générez le rapport de vos dépenses de colocation.",
};

export const dynamic = "force-dynamic";

export default async function StudentReportsPage() {
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login?redirect=/student/reports");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-kaza-navy sm:text-3xl">
          <FileText className="size-6 text-kaza-blue" />
          Rapports
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Exportez le détail de vos frais partagés (toutes vos colocations) sur
          la période de votre choix.
        </p>
      </div>

      <ReportGenerator
        space="student"
        types={[{ value: "expenses", label: "Frais partagés (dépenses)" }]}
      />

      <Card className="rounded-2xl border-muted bg-muted/30">
        <CardContent className="flex items-start gap-3 p-5 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-5 shrink-0 text-kaza-blue" />
          <p>
            Le rapport reprend chaque dépense de vos colocations : date,
            catégorie, montant, qui a payé, votre part et son statut de
            règlement. Idéal pour faire les comptes en fin de mois.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
