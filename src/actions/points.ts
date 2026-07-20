"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { getPointsBalance } from "@/lib/queries/kaza-points";
import { createClient } from "@/lib/supabase/server";

// =============================================================================
// Kaabo — Server action : solde Kaabo Points de l'utilisateur courant.
// Sert au badge de la barre d'outils (composant client).
// =============================================================================

export async function getMyKazaPoints(): Promise<number> {
  const user = await getCurrentDisplayUser();
  if (!user) return 0;
  try {
    return await getPointsBalance(user.id);
  } catch {
    return 0;
  }
}

// =============================================================================
// Conversion / échange des points Kaabo
// -----------------------------------------------------------------------------
// Chaque récompense est convertie en CRÉDIT WALLET Kaabo (FCFA), utilisable
// ensuite pour un loyer, un boost, un abonnement, ou un retrait. Le taux de
// référence est de 1 point = 5 FCFA. Le catalogue est défini CÔTÉ SERVEUR
// (jamais fié au client) et l'opération est atomique via la RPC
// `redeem_kaza_points` (débit points + crédit wallet).
// =============================================================================

interface RewardDef {
  cost: number;
  walletCredit: number;
  label: string;
}

const REWARD_CATALOG: Record<string, RewardDef> = {
  "rwd-wallet": { cost: 100, walletCredit: 500, label: "Crédit Wallet 500 FCFA" },
  "rwd-rent-discount": {
    cost: 500,
    walletCredit: 2000,
    label: "Bon de réduction 2 000 FCFA",
  },
  "rwd-boost": { cost: 1000, walletCredit: 5000, label: "Boost annonce 7 jours" },
  "rwd-virtual-tour": {
    cost: 1500,
    walletCredit: 7500,
    label: "Visite virtuelle 360°",
  },
  "rwd-premium-month": {
    cost: 2500,
    walletCredit: 12500,
    label: "1 mois Premium",
  },
  "rwd-deposit-half": {
    cost: 5000,
    walletCredit: 25000,
    label: "Caution réduite -50 %",
  },
  "rwd-one-month-rent": {
    cost: 10000,
    walletCredit: 50000,
    label: "1 mois de loyer offert",
  },
  "rwd-premium-year": {
    cost: 15000,
    walletCredit: 75000,
    label: "Année Premium",
  },
};

interface RedeemResult {
  success: boolean;
  error?: string;
  newBalance?: number;
  walletCredit?: number;
}

export async function redeemReward(rewardId: string): Promise<RedeemResult> {
  const reward = REWARD_CATALOG[rewardId];
  if (!reward) {
    return { success: false, error: "Récompense inconnue." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Vous devez être connecté." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("redeem_kaza_points", {
    p_cost: reward.cost,
    p_label: reward.label,
    p_wallet_credit: reward.walletCredit,
  });

  if (error) {
    const msg = String(error.message ?? "");
    if (msg.includes("INSUFFICIENT_POINTS")) {
      return {
        success: false,
        error: "Vous n'avez pas assez de points pour cette récompense.",
      };
    }
    console.error("[points] redeemReward:", msg);
    return { success: false, error: "Conversion impossible pour le moment." };
  }

  revalidatePath("/points");
  revalidatePath("/tenant/wallet");
  revalidatePath("/owner/finance");

  const result = (data ?? {}) as { new_balance?: number };
  return {
    success: true,
    newBalance: result.new_balance,
    walletCredit: reward.walletCredit,
  };
}
