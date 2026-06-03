"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

interface PropertyFiltersProps {
  onApply?: (filters: FilterValues) => void;
}

interface FilterValues {
  priceMin: string;
  priceMax: string;
  propertyType: string;
  bedrooms: string;
  location: string;
}

function FilterContent({ onApply }: PropertyFiltersProps) {
  const [filters, setFilters] = useState<FilterValues>({
    priceMin: "",
    priceMax: "",
    propertyType: "all",
    bedrooms: "all",
    location: "",
  });

  const handleApply = () => {
    onApply?.(filters);
  };

  const handleReset = () => {
    setFilters({
      priceMin: "",
      priceMax: "",
      propertyType: "all",
      bedrooms: "all",
      location: "",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filtres</h3>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          Réinitialiser
        </Button>
      </div>

      <Separator />

      {/* Price Range */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Prix (XOF/mois)</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.priceMin}
            onChange={(e) =>
              setFilters({ ...filters, priceMin: e.target.value })
            }
          />
          <span className="text-muted-foreground">—</span>
          <Input
            type="number"
            placeholder="Max"
            value={filters.priceMax}
            onChange={(e) =>
              setFilters({ ...filters, priceMax: e.target.value })
            }
          />
        </div>
      </div>

      <Separator />

      {/* Property Type */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Type de bien</Label>
        <Select
          value={filters.propertyType}
          onValueChange={(v) => setFilters({ ...filters, propertyType: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Tous les types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="APARTMENT">Appartement</SelectItem>
            <SelectItem value="HOUSE">Maison</SelectItem>
            <SelectItem value="STUDIO">Studio</SelectItem>
            <SelectItem value="ROOM">Chambre</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Bedrooms */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Chambres</Label>
        <Select
          value={filters.bedrooms}
          onValueChange={(v) => setFilters({ ...filters, bedrooms: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Nombre de chambres" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Peu importe</SelectItem>
            <SelectItem value="1">1 chambre</SelectItem>
            <SelectItem value="2">2 chambres</SelectItem>
            <SelectItem value="3">3 chambres</SelectItem>
            <SelectItem value="4">4+ chambres</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Location */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Localisation</Label>
        <Input
          placeholder="Ville, quartier..."
          value={filters.location}
          onChange={(e) => setFilters({ ...filters, location: e.target.value })}
        />
      </div>

      <Button onClick={handleApply} className="w-full">
        Appliquer les filtres
      </Button>
    </div>
  );
}

export function PropertyFilters({ onApply }: PropertyFiltersProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <div className="sticky top-20 hidden w-[280px] shrink-0 rounded-xl bg-muted/50 p-6 lg:block">
        <FilterContent onApply={onApply} />
      </div>

      {/* Mobile drawer */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="mr-2 size-4" />
              Filtres
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
            <div className="py-4">
              <FilterContent onApply={onApply} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
