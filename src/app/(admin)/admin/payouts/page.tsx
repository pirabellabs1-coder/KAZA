// =============================================================================
// Kaabo — Admin / Demandes de retrait
// Liste, approbation, refus des demandes de payout des proprios/agences.
// =============================================================================

import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { listAllWithdrawalRequests } from "@/lib/queries/wallet";

import { PayoutsList } from "./payouts-list";

export const metadata: Metadata = {
  title: "Demandes de retrait — Admin Kaabo",
};

export default async function AdminPayoutsPage() {
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login?redirect=/admin/payouts");
  if (user.role !== "ADMIN") {
    redirect("/dashboard?erreur=Accès+admin+réservé");
  }

  const requests = await listAllWithdrawalRequests();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-wide text-kaza-blue">
          Finance plateforme
        </p>
        <h1 className="font-heading text-2xl font-bold text-kaza-navy lg:text-3xl">
          Demandes de retrait
        </h1>
        <p className="text-sm text-muted-foreground">
          Approuvez les virements vers les comptes bancaires / Mobile Money
          des propriétaires et agences.
        </p>
      </div>

      <PayoutsList requests={requests} />
    </div>
  );
}
