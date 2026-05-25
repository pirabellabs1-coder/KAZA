"use client";

import { ArrowRight, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn, formatPrice } from "@/lib/utils";
import type { Settlement } from "@/hooks/use-expense-split";

export interface RoommateLite {
  id: string;
  name: string;
}

interface SplitSummaryProps {
  totalMonth: number;
  youOwe: number; // total des dettes du user (positif)
  youAreOwed: number; // total des créances du user (positif)
  settlements: Settlement[];
  currentUserId: string;
  roommates: RoommateLite[];
}

function nameOf(roommates: RoommateLite[], id: string): string {
  return roommates.find((r) => r.id === id)?.name ?? "Colocataire";
}

export function SplitSummary({
  totalMonth,
  youOwe,
  youAreOwed,
  settlements,
  currentUserId,
  roommates,
}: SplitSummaryProps) {
  // On met en avant les settlements qui concernent l'utilisateur courant.
  const sortedSettlements = [...settlements].sort((a, b) => {
    const aMine = a.from === currentUserId || a.to === currentUserId ? 0 : 1;
    const bMine = b.from === currentUserId || b.to === currentUserId ? 0 : 1;
    return aMine - bMine;
  });
  const previewSettlements = sortedSettlements.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Résumé du mois</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryStat
            label="Total dépensé"
            value={formatPrice(totalMonth)}
            icon={Wallet}
            tone="neutral"
          />
          <SummaryStat
            label="Vous devez"
            value={formatPrice(youOwe)}
            icon={TrendingDown}
            tone="negative"
          />
          <SummaryStat
            label="On vous doit"
            value={formatPrice(youAreOwed)}
            icon={TrendingUp}
            tone="positive"
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Transferts suggérés
          </p>
          {previewSettlements.length === 0 ? (
            <p className="rounded-lg border border-dashed bg-muted/30 px-3 py-4 text-center text-sm text-muted-foreground">
              Tous les comptes sont à jour.
            </p>
          ) : (
            <ul className="space-y-2">
              {previewSettlements.map((s, i) => {
                const fromMe = s.from === currentUserId;
                const toMe = s.to === currentUserId;
                return (
                  <li
                    key={`${s.from}-${s.to}-${i}`}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm",
                      (fromMe || toMe) && "border-kaza-blue/40 bg-kaza-blue/5"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "font-medium",
                          fromMe && "text-kaza-error"
                        )}
                      >
                        {fromMe ? "Vous" : nameOf(roommates, s.from)}
                      </span>
                      <ArrowRight className="size-3.5 text-muted-foreground" />
                      <span
                        className={cn(
                          "font-medium",
                          toMe && "text-kaza-green"
                        )}
                      >
                        {toMe ? "Vous" : nameOf(roommates, s.to)}
                      </span>
                    </div>
                    <span className="font-semibold">
                      {formatPrice(s.amount)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface SummaryStatProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "positive" | "negative" | "neutral";
}

function SummaryStat({ label, value, icon: Icon, tone }: SummaryStatProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon
          className={cn(
            "size-4",
            tone === "positive" && "text-kaza-green",
            tone === "negative" && "text-kaza-error",
            tone === "neutral" && "text-muted-foreground"
          )}
        />
      </div>
      <p
        className={cn(
          "mt-2 text-lg font-bold",
          tone === "positive" && "text-kaza-green",
          tone === "negative" && "text-kaza-error",
          tone === "neutral" && "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  );
}
