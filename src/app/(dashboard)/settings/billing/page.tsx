import type { Metadata } from "next";

import { SettingsHeader } from "../settings-form";
import { BillingClient } from "./billing-client";

export const metadata: Metadata = {
  title: "Facturation — Paramètres",
};

export default function BillingPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SettingsHeader
        title="Facturation & paiements"
        description="Gérez vos méthodes de paiement, consultez vos factures et votre adresse de facturation."
      />
      <BillingClient />
    </div>
  );
}
