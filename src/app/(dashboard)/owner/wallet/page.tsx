// =============================================================================
// Kaabo — Wallet propriétaire
// Solde, transactions, demandes de retrait, RIB/Mobile Money.
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
  title: "Wallet & retraits — Kaabo",
};

export default async function OwnerWalletPage() {
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login?redirect=/owner/wallet");
  if (user.role !== "OWNER" && user.role !== "AGENCY" && user.role !== "ADMIN") {
    redirect("/dashboard?erreur=Espace+propriétaire");
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
          Comptabilité
        </p>
        <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
          Wallet & retraits
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Suivez votre solde Kaabo, vos transactions et demandez vos virements.
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
