import type { Metadata } from "next";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";

import { SettingsHeader } from "../settings-form";
import { BillingClient } from "./billing-client";

export const metadata: Metadata = {
  title: "Facturation — Paramètres",
};

export default async function BillingPage() {
  const user = await getCurrentDisplayUser();
  let initialAddress: Record<string, unknown> = {};

  if (user) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("users")
      .select("billing_address")
      .eq("id", user.id)
      .maybeSingle();
    if (data?.billing_address && typeof data.billing_address === "object") {
      initialAddress = data.billing_address as Record<string, unknown>;
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SettingsHeader
        title="Facturation & paiements"
        description="Gérez vos méthodes de paiement, consultez vos factures et votre adresse de facturation."
      />
      <BillingClient initialAddress={initialAddress} />
    </div>
  );
}
