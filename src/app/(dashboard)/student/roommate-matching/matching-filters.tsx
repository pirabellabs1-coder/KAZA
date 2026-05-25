"use client";

import { useState } from "react";
import { Sliders, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";

// =============================================================================
// KAZA - Filtres recherche colocataire (client)
// =============================================================================

const HABITS = [
  { id: "nonSmoker", label: "Non-fumeur" },
  { id: "earlyBird", label: "Lève-tôt" },
  { id: "nightOwl", label: "Couche-tard" },
  { id: "quiet", label: "Calme" },
  { id: "social", label: "Sociable" },
  { id: "petFriendly", label: "Accepte animaux" },
  { id: "tidy", label: "Ordonné" },
  { id: "cooks", label: "Aime cuisiner" },
];

const DISCIPLINES = [
  "Toutes disciplines",
  "Médecine",
  "Droit",
  "Ingénierie",
  "Économie / Gestion",
  "Informatique",
  "Sciences humaines",
  "Architecture",
  "Sciences exactes",
];

const CITIES = [
  "Toutes les villes",
  "Cotonou",
  "Abomey-Calavi",
  "Porto-Novo",
  "Parakou",
  "Bohicon",
];

interface Filters {
  ageMin: number;
  ageMax: number;
  gender: string;
  discipline: string;
  city: string;
  budgetMax: number;
  habits: Set<string>;
}

const DEFAULT_FILTERS: Filters = {
  ageMin: 18,
  ageMax: 30,
  gender: "all",
  discipline: "Toutes disciplines",
  city: "Toutes les villes",
  budgetMax: 150000,
  habits: new Set<string>(),
};

export function MatchingFilters() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  function toggleHabit(id: string) {
    setFilters((prev) => {
      const next = new Set(prev.habits);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...prev, habits: next };
    });
  }

  function reset() {
    setFilters({ ...DEFAULT_FILTERS, habits: new Set() });
  }

  return (
    <aside className="space-y-5 rounded-xl border bg-card p-5 lg:sticky lg:top-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="size-4 text-kaza-blue" />
          <h2 className="font-heading text-base font-semibold text-foreground">
            Filtres
          </h2>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={reset}
          className="h-7 gap-1 px-2 text-xs text-muted-foreground"
        >
          <RotateCcw className="size-3" />
          Réinitialiser
        </Button>
      </div>

      <Separator />

      {/* Ville */}
      <div className="space-y-2">
        <Label htmlFor="filter-city">Ville</Label>
        <Select
          value={filters.city}
          onValueChange={(v) => setFilters((p) => ({ ...p, city: v }))}
        >
          <SelectTrigger id="filter-city" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CITIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Âge */}
      <div className="space-y-2">
        <Label>
          Âge :{" "}
          <span className="font-semibold text-foreground">
            {filters.ageMin} - {filters.ageMax} ans
          </span>
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            min={16}
            max={50}
            value={filters.ageMin}
            onChange={(e) =>
              setFilters((p) => ({
                ...p,
                ageMin: Number(e.target.value) || 18,
              }))
            }
            aria-label="Âge minimum"
          />
          <Input
            type="number"
            min={16}
            max={50}
            value={filters.ageMax}
            onChange={(e) =>
              setFilters((p) => ({
                ...p,
                ageMax: Number(e.target.value) || 30,
              }))
            }
            aria-label="Âge maximum"
          />
        </div>
      </div>

      {/* Genre */}
      <div className="space-y-2">
        <Label htmlFor="filter-gender">Genre</Label>
        <Select
          value={filters.gender}
          onValueChange={(v) => setFilters((p) => ({ ...p, gender: v }))}
        >
          <SelectTrigger id="filter-gender" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="female">Femme</SelectItem>
            <SelectItem value="male">Homme</SelectItem>
            <SelectItem value="other">Non précisé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Discipline */}
      <div className="space-y-2">
        <Label htmlFor="filter-discipline">Discipline d&apos;étude</Label>
        <Select
          value={filters.discipline}
          onValueChange={(v) =>
            setFilters((p) => ({ ...p, discipline: v }))
          }
        >
          <SelectTrigger id="filter-discipline" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DISCIPLINES.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Budget */}
      <div className="space-y-2">
        <Label htmlFor="filter-budget">
          Budget max :{" "}
          <span className="font-semibold text-foreground">
            {formatPrice(filters.budgetMax)}
          </span>
        </Label>
        <input
          id="filter-budget"
          type="range"
          min={30000}
          max={300000}
          step={5000}
          value={filters.budgetMax}
          onChange={(e) =>
            setFilters((p) => ({ ...p, budgetMax: Number(e.target.value) }))
          }
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-kaza-blue"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>30k</span>
          <span>300k</span>
        </div>
      </div>

      <Separator />

      {/* Habitudes */}
      <div className="space-y-2">
        <Label>Habitudes de vie</Label>
        <div className="flex flex-wrap gap-2">
          {HABITS.map((h) => {
            const active = filters.habits.has(h.id);
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => toggleHabit(h.id)}
                aria-pressed={active}
                className={
                  active
                    ? "rounded-full border-2 border-kaza-blue bg-kaza-blue/10 px-3 py-1 text-xs font-medium text-kaza-blue transition-colors"
                    : "rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-kaza-blue/40 hover:text-foreground"
                }
              >
                {h.label}
              </button>
            );
          })}
        </div>
      </div>

      <Button
        type="button"
        className="w-full bg-kaza-blue text-white hover:bg-kaza-blue/90"
      >
        Appliquer les filtres
      </Button>
    </aside>
  );
}
