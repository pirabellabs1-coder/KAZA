"use client";

import {
  BadgePercent,
  Crown,
  Gift,
  Home,
  Megaphone,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/toast-helper";
import { formatPoints, spendPoints } from "@/lib/demo-points";

export interface Reward {
  id: string;
  cost: number;
  title: string;
  description: string;
  icon: LucideIcon;
  accent: string; // tailwind text/bg color suffix
}

export const REWARDS: Reward[] = [
  {
    id: "rwd-wallet",
    cost: 100,
    title: "Crédit Wallet 500 FCFA",
    description: "Ajoutez 500 FCFA directement dans votre portefeuille KAZA.",
    icon: Wallet,
    accent: "kaza-blue",
  },
  {
    id: "rwd-rent-discount",
    cost: 500,
    title: "Bon de réduction 2 000 FCFA",
    description: "Applicable sur votre prochain paiement de loyer.",
    icon: BadgePercent,
    accent: "kaza-green",
  },
  {
    id: "rwd-boost",
    cost: 1000,
    title: "Boost annonce 7 jours",
    description:
      "Mettez une de vos annonces en avant pendant une semaine entière.",
    icon: Megaphone,
    accent: "kaza-warning",
  },
  {
    id: "rwd-virtual-tour",
    cost: 1500,
    title: "Visite virtuelle 360°",
    description: "Offrez à une annonce une visite immersive gratuite.",
    icon: Sparkles,
    accent: "kaza-blue",
  },
  {
    id: "rwd-premium-month",
    cost: 2500,
    title: "1 mois Premium offert",
    description: "Profitez de tous les avantages KAZA Premium pendant 30 jours.",
    icon: Star,
    accent: "kaza-navy",
  },
  {
    id: "rwd-deposit-half",
    cost: 5000,
    title: "Caution réduite -50 %",
    description:
      "Réduisez de moitié votre caution pour votre prochaine location.",
    icon: ShieldCheck,
    accent: "kaza-green",
  },
  {
    id: "rwd-one-month-rent",
    cost: 10000,
    title: "1 mois de loyer offert",
    description: "Votre loyer du mois est pris en charge par KAZA.",
    icon: Home,
    accent: "kaza-navy",
  },
  {
    id: "rwd-premium-year",
    cost: 15000,
    title: "Année Premium offerte",
    description: "12 mois de KAZA Premium gratuits — la récompense ultime.",
    icon: Crown,
    accent: "kaza-warning",
  },
];

interface RewardsCatalogProps {
  balance: number;
  onChange: () => void;
}

export function RewardsCatalog({ balance, onChange }: RewardsCatalogProps) {
  const handleRedeem = (reward: Reward) => {
    const ok = spendPoints(reward.cost, `Échange — ${reward.title}`);
    if (!ok) {
      toast.error("Solde insuffisant pour cette récompense.");
      return;
    }
    toast.success(`Récompense débloquée : ${reward.title} !`);
    onChange();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("kaza-points-updated"));
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {REWARDS.map((reward) => {
        const Icon = reward.icon;
        const affordable = balance >= reward.cost;
        return (
          <Card
            key={reward.id}
            className={`group relative overflow-hidden transition-shadow ${
              affordable ? "hover:shadow-md" : "opacity-70"
            }`}
          >
            <CardContent className="flex h-full flex-col gap-4 p-5">
              <div className="flex items-start justify-between">
                <div
                  className={`flex size-11 items-center justify-center rounded-xl bg-${reward.accent}/10 text-${reward.accent}`}
                >
                  <Icon className="size-5" />
                </div>
                <div className="flex items-center gap-1 rounded-full bg-kaza-navy/5 px-2.5 py-1 text-xs font-semibold text-kaza-navy">
                  <Trophy className="size-3 text-kaza-warning" />
                  {formatPoints(reward.cost)} pts
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">
                  {reward.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {reward.description}
                </p>
              </div>
              <Button
                type="button"
                onClick={() => handleRedeem(reward)}
                disabled={!affordable}
                variant={affordable ? "default" : "outline"}
                className="w-full gap-2"
              >
                <Gift className="size-4" />
                {affordable ? "Échanger" : "Solde insuffisant"}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
