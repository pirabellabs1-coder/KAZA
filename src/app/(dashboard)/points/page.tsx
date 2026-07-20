import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  Gift,
  History,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import {
  getPointsBalance,
  listPointsTransactions,
  type PointsTransaction,
} from "@/lib/queries/kaza-points";
import { cn } from "@/lib/utils";
import { POINTS_TO_FCFA } from "@/lib/points/constants";
import { RewardsCatalog } from "./rewards-catalog";

export const metadata: Metadata = {
  title: "Kaabo Points",
  description:
    "Suivez votre solde de Kaabo Points, l'historique de vos transactions et le catalogue de recompenses.",
};



const HOW_TO_EARN: Array<{ action: string; points: number }> = [
  { action: "Inscription", points: 100 },
  { action: "Profil complet", points: 100 },
  { action: "Identite verifiee (KYC)", points: 500 },
  { action: "Annonce publiee", points: 250 },
  { action: "Contrat signe", points: 1000 },
  { action: "Avis donne", points: 25 },
  { action: "Filleul valide (parrainage)", points: 1000 },
];

const TYPE_LABELS: Record<string, string> = {
  SIGNUP_BONUS: "Bonus d'inscription",
  REFERRAL: "Parrainage",
  PROPERTY_LISTED: "Annonce publiee",
  CONTRACT_SIGNED: "Contrat signe",
  REVIEW_GIVEN: "Avis donne",
  PROFILE_COMPLETED: "Profil complete",
  KYC_APPROVED: "Identite verifiee",
  REDEEMED: "Recompense echangee",
  ADMIN_ADJUSTMENT: "Ajustement Kaabo",
};

function formatTransactionLabel(tx: PointsTransaction): string {
  if (tx.description && tx.description.trim().length > 0) return tx.description;
  return TYPE_LABELS[tx.type] ?? tx.type;
}

export default async function PointsPage() {
  const user = await getCurrentDisplayUser();
  if (!user) {
    redirect("/login?redirect=/points");
  }

  const [balance, transactions] = await Promise.all([
    getPointsBalance(user.id),
    listPointsTransactions(user.id, 50),
  ]);

  return (
    <div className="space-y-6">
      {/* Hero solde */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-kaza-navy via-[#0F2A40] to-kaza-blue p-8 text-white">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm uppercase tracking-widest text-white/70">
                <Star className="size-4" />
                Mon solde Kaabo Points
              </div>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="font-heading text-3xl font-bold tabular-nums sm:text-4xl">
                  {balance.toLocaleString("fr-FR")}
                </span>
                <span className="text-lg text-white/70">points</span>
              </div>
              <p className="mt-1 text-sm text-white/60">
                Soit environ{" "}
                <strong className="text-white">
                  {(balance * 5).toLocaleString("fr-FR")} FCFA
                </strong>{" "}
                de recompenses (1 point = 5 FCFA)
              </p>
            </div>
            <Sparkles className="size-12 text-white/40" />
          </div>
        </div>
      </Card>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">
            <History className="mr-1.5 size-3.5" />
            Mes transactions
          </TabsTrigger>
          <TabsTrigger value="rewards">
            <Gift className="mr-1.5 size-3.5" />
            Catalogue recompenses
          </TabsTrigger>
          <TabsTrigger value="howto">
            <TrendingUp className="mr-1.5 size-3.5" />
            Comment gagner
          </TabsTrigger>
        </TabsList>

        {/* Transactions */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historique</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="py-12 text-center">
                  <History className="mx-auto mb-3 size-10 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">
                    Aucune transaction pour le moment
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Vos prochains gains de Kaabo Points apparaitront ici.
                  </p>
                </div>
              ) : (
                <ul className="divide-y">
                  {transactions.map((tx) => {
                    const isEarn = tx.amount > 0;
                    return (
                      <li
                        key={tx.id}
                        className="flex items-center justify-between py-3"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "flex size-9 items-center justify-center rounded-full",
                              isEarn
                                ? "bg-kaza-green/10 text-kaza-green"
                                : "bg-orange-100 text-orange-600",
                            )}
                          >
                            {isEarn ? (
                              <TrendingUp className="size-4" />
                            ) : (
                              <Gift className="size-4" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {formatTransactionLabel(tx)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(tx.createdAt).toLocaleDateString(
                                "fr-FR",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </p>
                          </div>
                        </div>
                        <span
                          className={cn(
                            "font-semibold tabular-nums",
                            isEarn ? "text-kaza-green" : "text-orange-600",
                          )}
                        >
                          {isEarn ? "+" : "−"}
                          {Math.abs(tx.amount).toLocaleString("fr-FR")} pts
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recompenses */}
        <TabsContent value="rewards">
          <RewardsCatalog balance={balance} />
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Chaque récompense est convertie en crédit sur votre Wallet Kaabo
            (1 point = {POINTS_TO_FCFA} FCFA), utilisable pour un loyer, un
            boost, un abonnement ou un retrait.
          </p>
        </TabsContent>

        {/* Comment gagner */}
        <TabsContent value="howto">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gagnez des points</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {HOW_TO_EARN.map((item) => (
                  <li
                    key={item.action}
                    className="flex items-center justify-between py-3"
                  >
                    <span className="text-sm">{item.action}</span>
                    <Badge className="border-0 bg-kaza-green/10 text-kaza-green">
                      +{item.points} pts
                    </Badge>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Cumulez vos points et echangez-les contre de vraies recompenses
                dans le catalogue.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
