import type { Metadata } from "next";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { listUserInvoices, type UserInvoice } from "@/lib/queries/subscriptions";

import { SettingsHeader } from "../settings-form";
import { BillingClient } from "./billing-client";

export const metadata: Metadata = {
  title: "Facturation — Paramètres",
};

// Le portefeuille est rattaché à l'espace du rôle (pas de route /wallet globale).
const WALLET_HREF_BY_ROLE: Record<string, string> = {
  OWNER: "/owner/wallet",
  AGENCY: "/agency/wallet",
  TENANT: "/tenant/wallet",
  STUDENT: "/tenant/wallet",
};

export default async function BillingPage() {
  const user = await getCurrentDisplayUser();
  let initialAddress: Record<string, unknown> = {};
  let invoices: UserInvoice[] = [];
  let walletBalance = 0;
  const walletHref =
    (user && WALLET_HREF_BY_ROLE[user.role]) ?? "/tenant/wallet";

  if (user) {
    const supabase = await createClient();
    const [userRes, walletRes, invoicesRes] = await Promise.allSettled([
      supabase
        .from("users")
        .select("billing_address")
        .eq("id", user.id)
        .maybeSingle(),
      (supabase as unknown as SupabaseClient)
        .from("user_wallets")
        .select("balance_fcfa")
        .eq("user_id", user.id)
        .maybeSingle(),
      listUserInvoices(user.id),
    ]);

    if (
      userRes.status === "fulfilled" &&
      userRes.value.data?.billing_address &&
      typeof userRes.value.data.billing_address === "object"
    ) {
      initialAddress = userRes.value.data.billing_address as Record<
        string,
        unknown
      >;
    }
    if (walletRes.status === "fulfilled") {
      walletBalance = Number(
        (walletRes.value.data as { balance_fcfa?: number } | null)
          ?.balance_fcfa ?? 0,
      );
    }
    if (invoicesRes.status === "fulfilled") {
      invoices = invoicesRes.value;
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SettingsHeader
        title="Facturation & paiements"
        description="Gérez vos moyens de paiement, consultez vos factures et votre adresse de facturation."
      />
      <BillingClient
        initialAddress={initialAddress}
        invoices={invoices}
        walletBalance={walletBalance}
        walletHref={walletHref}
      />
    </div>
  );
}
