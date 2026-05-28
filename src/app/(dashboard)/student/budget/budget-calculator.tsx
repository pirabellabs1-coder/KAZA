"use client";

import { useEffect, useMemo, useState } from "react";
import { Calculator, Save, Share2, TrendingDown, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast-helper";
import { cn, formatPrice } from "@/lib/utils";

const STORAGE_KEY = "kaza-budget-coloc";
const UAC_AVERAGE_PER_PERSON = 75_000; // moyenne mock par personne (FCFA)

type Budget = {
  rent: string;
  roommates: string;
  electricity: string;
  water: string;
  internet: string;
  groceries: string;
};

const INITIAL: Budget = {
  rent: "180000",
  roommates: "3",
  electricity: "24000",
  water: "8000",
  internet: "20000",
  groceries: "45000",
};

const CATEGORIES = [
  { key: "rent", label: "Loyer", color: "bg-kaza-blue" },
  { key: "electricity", label: "Électricité", color: "bg-amber-500" },
  { key: "water", label: "Eau", color: "bg-sky-400" },
  { key: "internet", label: "Internet", color: "bg-violet-500" },
  { key: "groceries", label: "Courses", color: "bg-kaza-green" },
] as const;

function toNumber(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function BudgetCalculator() {
  const [budget, setBudget] = useState<Budget>(INITIAL);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setBudget((p) => ({ ...p, ...(JSON.parse(raw) as Partial<Budget>) }));
    } catch {
      // ignore
    } finally {
      setLoaded(true);
    }
  }, []);

  const update = <K extends keyof Budget>(key: K, value: string) => {
    setBudget((prev) => ({ ...prev, [key]: value }));
  };

  const totals = useMemo(() => {
    const rent = toNumber(budget.rent);
    const electricity = toNumber(budget.electricity);
    const water = toNumber(budget.water);
    const internet = toNumber(budget.internet);
    const groceries = toNumber(budget.groceries);
    const roommates = Math.max(1, toNumber(budget.roommates) || 1);
    const total = rent + electricity + water + internet + groceries;
    const perPerson = Math.round(total / roommates);

    return {
      total,
      perPerson,
      roommates,
      breakdown: { rent, electricity, water, internet, groceries },
    };
  }, [budget]);

  const diffPct = useMemo(() => {
    if (totals.perPerson === 0) return 0;
    return Math.round(
      ((totals.perPerson - UAC_AVERAGE_PER_PERSON) / UAC_AVERAGE_PER_PERSON) * 100
    );
  }, [totals.perPerson]);

  const handleSave = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(budget));
      toast.success("Budget sauvegardé ✓");
    } catch {
      toast.error("Sauvegarde impossible.");
    }
  };

  const handleShare = () => {
    toast.info("Lien partagé avec votre groupe colocataire (mock).");
  };

  if (!loaded) {
    return <div className="h-64 animate-pulse rounded-xl border border-dashed bg-muted/30" />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Inputs */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calculator className="size-4 text-kaza-blue" />
            Vos dépenses mensuelles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rent">Loyer mensuel total (FCFA)</Label>
            <Input
              id="rent"
              type="number"
              min={0}
              step={5000}
              value={budget.rent}
              onChange={(e) => update("rent", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="roommates">Nombre de colocataires</Label>
            <Input
              id="roommates"
              type="number"
              min={1}
              max={10}
              value={budget.roommates}
              onChange={(e) => update("roommates", e.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="electricity">Électricité</Label>
              <Input
                id="electricity"
                type="number"
                min={0}
                step={1000}
                value={budget.electricity}
                onChange={(e) => update("electricity", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="water">Eau</Label>
              <Input
                id="water"
                type="number"
                min={0}
                step={1000}
                value={budget.water}
                onChange={(e) => update("water", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="internet">Internet</Label>
              <Input
                id="internet"
                type="number"
                min={0}
                step={1000}
                value={budget.internet}
                onChange={(e) => update("internet", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="groceries">Courses partagées</Label>
              <Input
                id="groceries"
                type="number"
                min={0}
                step={1000}
                value={budget.groceries}
                onChange={(e) => update("groceries", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Résultats */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-base">Résultat en temps réel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-muted/40 p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Total mensuel
              </p>
              <p className="mt-2 font-heading text-2xl font-bold text-kaza-navy tabular-nums">
                {formatPrice(totals.total)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Pour {totals.roommates} colocataire
                {totals.roommates > 1 ? "s" : ""}
              </p>
            </div>
            <div className="rounded-xl bg-kaza-blue/5 p-5 ring-1 ring-kaza-blue/20">
              <p className="text-xs uppercase tracking-wide text-kaza-blue">
                Par personne
              </p>
              <p className="mt-2 font-heading text-3xl font-bold text-kaza-blue tabular-nums">
                {formatPrice(totals.perPerson)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">par mois</p>
            </div>
          </div>

          {/* Répartition */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Répartition des dépenses</p>
            {CATEGORIES.map((cat) => {
              const value = totals.breakdown[cat.key];
              const pct = totals.total > 0 ? (value / totals.total) * 100 : 0;
              return (
                <div key={cat.key}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium">{cat.label}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {formatPrice(value)} · {pct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full transition-all", cat.color)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Comparaison */}
          {totals.perPerson > 0 && (
            <div
              className={cn(
                "flex items-center gap-3 rounded-xl p-4",
                diffPct < 0
                  ? "bg-kaza-green/10 text-kaza-green"
                  : diffPct > 0
                    ? "bg-orange-50 text-orange-700"
                    : "bg-muted text-foreground"
              )}
            >
              {diffPct < 0 ? (
                <TrendingDown className="size-5 shrink-0" />
              ) : (
                <TrendingUp className="size-5 shrink-0" />
              )}
              <div>
                <p className="text-sm font-semibold">
                  Vous payez {Math.abs(diffPct)}%{" "}
                  {diffPct < 0 ? "moins" : "plus"} que la moyenne UAC
                </p>
                <p className="text-xs opacity-80">
                  Moyenne référence : {formatPrice(UAC_AVERAGE_PER_PERSON)} /
                  personne / mois (étudiants UAC, 2026).
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave}>
              <Save className="mr-2 size-4" />
              Sauvegarder
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="mr-2 size-4" />
              Partager avec mes colocs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
