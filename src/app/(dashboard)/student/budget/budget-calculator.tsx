"use client";

import { useEffect, useMemo, useState } from "react";
import { Calculator, Save, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast-helper";
import { cn, formatPrice } from "@/lib/utils";

const STORAGE_KEY = "kaza-budget-coloc";

type Budget = {
  rent: string;
  roommates: string;
  electricity: string;
  water: string;
  internet: string;
  groceries: string;
};

// Aucune valeur fictive pré-remplie : l'étudiant saisit son propre budget.
const INITIAL: Budget = {
  rent: "",
  roommates: "",
  electricity: "",
  water: "",
  internet: "",
  groceries: "",
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

  const handleSave = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(budget));
      toast.success("Budget sauvegardé ✓");
    } catch {
      toast.error("Sauvegarde impossible.");
    }
  };

  const handleShare = async () => {
    const summary =
      `Budget colocation Kaabo\n` +
      `Total mensuel : ${formatPrice(totals.total)}\n` +
      `Par personne : ${formatPrice(totals.perPerson)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Budget colocation Kaabo", text: summary });
      } else {
        await navigator.clipboard.writeText(summary);
        toast.success("Récapitulatif copié dans le presse-papiers.");
      }
    } catch {
      // partage annulé par l'utilisateur — pas d'erreur à afficher
    }
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
