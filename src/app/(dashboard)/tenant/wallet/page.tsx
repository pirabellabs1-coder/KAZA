// =============================================================================
// Kaabo — Wallet locataire
// Solde réel, transactions réelles. Données Supabase (user_wallets +
// wallet_transactions). Aucune donnée démo.
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
  title: "Mon portefeuille — Kaabo",
};

export const dynamic = "force-dynamic";

export default async function TenantWalletPage() {
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login?redirect=/tenant/wallet");

  const [wallet, transactions, withdrawals] = await Promise.all([
    getWallet(user.id),
    listWalletTransactions(user.id, 30),
    listWithdrawalRequests(user.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
          Mon portefeuille
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gérez votre solde Kaabo, recharges et historique de transactions.
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
