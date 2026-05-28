// =============================================================================
// KAZA — Wallet agence
// Mêmes composants que le wallet propriétaire (l'agence est un OWNER étendu).
// =============================================================================

import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import {
  getWallet,
  listWalletTransactions,
  listWithdrawalRequests,
} from "@/lib/queries/wallet";
import { WalletView } from "@/components/wallet/wallet-view";

export const metadata: Metadata = {
  title: "Wallet & retraits — KAZA",
};

export default async function AgencyWalletPage() {
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login?redirect=/agency/wallet");
  if (user.role !== "AGENCY" && user.role !== "OWNER" && user.role !== "ADMIN") {
    redirect("/dashboard?erreur=Espace+agence");
  }

  const [wallet, transactions, withdrawals] = await Promise.all([
    getWallet(user.id),
    listWalletTransactions(user.id, 30),
    listWithdrawalRequests(user.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-kaza-blue">
          Trésorerie agence
        </p>
        <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
          Wallet & retraits
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Suivi consolidé de la trésorerie de votre agence sur KAZA.
        </p>
      </div>

      <WalletView
        wallet={wallet}
        transactions={transactions}
        withdrawals={withdrawals}
      />
    </div>
  );
}
