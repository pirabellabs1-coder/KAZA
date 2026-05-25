"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PropertySearchBarProps {
  variant?: "hero" | "compact";
  defaultLocation?: string;
  defaultType?: string;
  defaultBudget?: string;
}

const propertyTypes = [
  { value: "all", label: "Tous types" },
  { value: "APARTMENT", label: "Appartement" },
  { value: "HOUSE", label: "Maison" },
  { value: "STUDIO", label: "Studio" },
  { value: "ROOM", label: "Chambre" },
];

const budgetRanges = [
  { value: "all", label: "Budget" },
  { value: "0-50000", label: "< 50 000 XOF" },
  { value: "50000-100000", label: "50k - 100k XOF" },
  { value: "100000-200000", label: "100k - 200k XOF" },
  { value: "200000-500000", label: "200k - 500k XOF" },
  { value: "500000+", label: "> 500 000 XOF" },
];

export function PropertySearchBar({
  variant = "hero",
  defaultLocation = "",
  defaultType = "all",
  defaultBudget = "all",
}: PropertySearchBarProps) {
  const router = useRouter();
  const [location, setLocation] = useState(defaultLocation);
  const [propertyType, setPropertyType] = useState(defaultType);
  const [budget, setBudget] = useState(defaultBudget);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (propertyType && propertyType !== "all") params.set("type", propertyType);
    if (budget && budget !== "all") params.set("budget", budget);
    router.push(`/search?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un lieu, une propriété..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch} size="sm">
          Rechercher
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-lg sm:flex-row sm:items-center sm:gap-2 sm:rounded-full sm:p-2">
      {/* Location */}
      <div className="relative flex-1">
        <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cotonou, Porto-Novo, Abidjan..."
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          onKeyDown={handleKeyDown}
          className="border-0 pl-9 shadow-none focus-visible:ring-0"
        />
      </div>

      <div className="hidden h-8 w-px bg-border sm:block" />

      {/* Property type */}
      <Select value={propertyType} onValueChange={setPropertyType}>
        <SelectTrigger className="w-full border-0 shadow-none focus:ring-0 sm:w-[160px]">
          <SelectValue placeholder="Type de bien" />
        </SelectTrigger>
        <SelectContent>
          {propertyTypes.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="hidden h-8 w-px bg-border sm:block" />

      {/* Budget */}
      <Select value={budget} onValueChange={setBudget}>
        <SelectTrigger className="w-full border-0 shadow-none focus:ring-0 sm:w-[160px]">
          <SelectValue placeholder="Budget" />
        </SelectTrigger>
        <SelectContent>
          {budgetRanges.map((range) => (
            <SelectItem key={range.value} value={range.value}>
              {range.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Search button */}
      <Button
        onClick={handleSearch}
        className="rounded-full bg-kaza-navy px-6 hover:bg-kaza-navy-dark"
      >
        <Search className="mr-2 size-4" />
        Rechercher
      </Button>
    </div>
  );
}
