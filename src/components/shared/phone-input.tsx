"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CountryFlag } from "@/components/shared/country-flag";
import {
  PHONE_COUNTRIES,
  findPhoneCountry,
  DEFAULT_PHONE_COUNTRY,
} from "@/lib/geo/phone-countries";
import { cn } from "@/lib/utils";

interface PhoneInputProps {
  /** ISO alpha-2 du pays sélectionné. */
  country: string;
  onCountryChange: (iso: string) => void;
  /** Numéro complet stocké, ex. "+2290112233". */
  value: string;
  onChange: (full: string) => void;
  id?: string;
  invalid?: boolean;
  placeholder?: string;
}

/**
 * Champ téléphone international : sélecteur de pays (drapeau + indicatif) +
 * saisie du numéro local. Émet le numéro complet `indicatif + numéro`.
 */
export function PhoneInput({
  country,
  onCountryChange,
  value,
  onChange,
  id,
  invalid,
  placeholder = "Numéro de téléphone",
}: PhoneInputProps) {
  const selected =
    findPhoneCountry(country) ??
    findPhoneCountry(DEFAULT_PHONE_COUNTRY) ??
    PHONE_COUNTRIES[0];
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Numéro local = valeur stockée moins l'indicatif (best-effort).
  const local = useMemo(() => {
    const v = (value ?? "").replace(/\s/g, "");
    if (!v) return "";
    if (v.startsWith(selected.dial)) return v.slice(selected.dial.length);
    // Indicatif différent / non préfixé : on retire tout préfixe +XXX éventuel.
    return v.startsWith("+") ? v.replace(/^\+\d{1,4}/, "") : v;
  }, [value, selected.dial]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return PHONE_COUNTRIES;
    return PHONE_COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dial.includes(q) ||
        c.code.toLowerCase().includes(q),
    );
  }, [search]);

  function emit(localDigits: string, iso: string) {
    const c = findPhoneCountry(iso) ?? selected;
    const clean = localDigits.replace(/[^\d]/g, "");
    onChange(clean ? `${c.dial}${clean}` : "");
  }

  return (
    <div
      className={cn(
        "flex h-10 items-stretch overflow-hidden rounded-md border border-input bg-background text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        invalid && "border-destructive focus-within:ring-destructive",
      )}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Choisir le pays"
            className="flex shrink-0 items-center gap-1.5 border-r border-input bg-muted/40 px-2.5 hover:bg-muted"
          >
            <CountryFlag code={selected.code} shape="rect" className="h-3.5 w-5" />
            <span className="font-medium text-foreground">{selected.dial}</span>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[300px] p-0">
          <div className="border-b p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un pays…"
                className="w-full rounded-md border border-input bg-background py-2 pl-8 pr-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <ul className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm text-muted-foreground">
                Aucun pays trouvé.
              </li>
            ) : (
              filtered.map((c) => (
                <li key={c.code}>
                  <button
                    type="button"
                    onClick={() => {
                      onCountryChange(c.code);
                      emit(local, c.code);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-muted",
                      c.code === selected.code && "bg-muted/60",
                    )}
                  >
                    <CountryFlag code={c.code} shape="rect" className="h-3.5 w-5 shrink-0" />
                    <span className="flex-1 truncate text-foreground">{c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.dial}</span>
                    {c.code === selected.code && (
                      <Check className="size-4 text-kaza-blue" />
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        </PopoverContent>
      </Popover>

      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        value={local}
        onChange={(e) => emit(e.target.value, selected.code)}
        placeholder={placeholder}
        aria-invalid={invalid}
        className="min-w-0 flex-1 bg-transparent px-3 outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
