"use client";

// =============================================================================
// KAZA - Calendar (shadcn-style)
//
// Implementation custom legere (sans react-day-picker) pour eviter une
// dependance supplementaire. Grille 7x6 mois courant + jours debordants.
//
// API alignee sur shadcn/ui calendar (mode "single") :
//   <Calendar
//     mode="single"
//     selected={date}
//     onSelect={(d) => setDate(d)}
//     disabled={(d) => d < new Date()}
//   />
//
// Si plus tard `react-day-picker` est ajoute aux deps, ce wrapper peut etre
// remplace par un import direct de DayPicker sans casser les usages.
// =============================================================================

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CalendarProps {
  /** Mode de selection. Seul "single" est supporte pour le MVP. */
  mode?: "single";
  /** Date selectionnee (undefined si aucune). */
  selected?: Date | undefined;
  /** Callback de selection. */
  onSelect?: (date: Date) => void;
  /** Predicat de desactivation pour un jour donne. */
  disabled?: (date: Date) => boolean;
  /** Mois initialement affiche (defaut : aujourd'hui). */
  defaultMonth?: Date;
  /** Locale BCP47 pour les libelles. Defaut "fr-FR". */
  locale?: string;
  /** Classe additionnelle sur le conteneur. */
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers de calcul (purs, hors composant)
// ---------------------------------------------------------------------------

const MS_PER_DAY = 86_400_000;

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, count: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function stripTime(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Construit la grille 7x6 (42 jours) qui couvre le mois affiche.
 * On commence le lundi (semaine ISO).
 */
function buildMonthGrid(month: Date): Date[] {
  const first = startOfMonth(month);
  // En JS getDay() : 0=dimanche, 1=lundi, ..., 6=samedi. On veut lundi=0.
  const weekdayOffset = (first.getDay() + 6) % 7;
  const gridStart = new Date(first.getTime() - weekdayOffset * MS_PER_DAY);
  return Array.from({ length: 42 }, (_, i) => {
    return new Date(gridStart.getTime() + i * MS_PER_DAY);
  });
}

// ---------------------------------------------------------------------------
// Composant
// ---------------------------------------------------------------------------

function Calendar({
  mode = "single",
  selected,
  onSelect,
  disabled,
  defaultMonth,
  locale = "fr-FR",
  className,
}: CalendarProps) {
  // Mois courant affiche (state interne).
  const initialMonth = React.useMemo(
    () => startOfMonth(defaultMonth ?? selected ?? new Date()),
    // On veut un mois initial figé au premier rendu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [viewMonth, setViewMonth] = React.useState<Date>(initialMonth);

  const today = React.useMemo(() => stripTime(new Date()), []);
  const grid = React.useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);

  // Libelles localises.
  const monthLabel = React.useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, {
      month: "long",
      year: "numeric",
    });
    const raw = formatter.format(viewMonth);
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [viewMonth, locale]);

  const weekdayLabels = React.useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
    // 5 janvier 2026 = lundi (offset stable, peu importe l'annee courante).
    const monday = new Date(2026, 0, 5);
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(monday.getTime() + i * MS_PER_DAY);
      return formatter
        .format(day)
        .replace(".", "")
        .slice(0, 2)
        .toUpperCase();
    });
  }, [locale]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handlePrev = React.useCallback(() => {
    setViewMonth((m) => addMonths(m, -1));
  }, []);

  const handleNext = React.useCallback(() => {
    setViewMonth((m) => addMonths(m, 1));
  }, []);

  const handleSelect = React.useCallback(
    (date: Date) => {
      if (mode !== "single") return;
      if (disabled?.(date)) return;
      onSelect?.(date);
    },
    [mode, disabled, onSelect],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div
      data-slot="calendar"
      className={cn(
        "w-fit select-none rounded-md border bg-background p-3 text-sm",
        className,
      )}
    >
      {/* Header navigation */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={handlePrev}
          aria-label="Mois précédent"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <div
          className="flex-1 text-center text-sm font-medium capitalize"
          aria-live="polite"
        >
          {monthLabel}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={handleNext}
          aria-label="Mois suivant"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* Weekday header */}
      <div
        className="mb-1 grid grid-cols-7 gap-1 text-[10px] font-medium uppercase text-muted-foreground"
        role="row"
      >
        {weekdayLabels.map((label, i) => (
          <div key={i} className="flex h-8 items-center justify-center">
            {label}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1" role="grid">
        {grid.map((day) => {
          const dayStripped = stripTime(day);
          const isCurrentMonth = day.getMonth() === viewMonth.getMonth();
          const isSelected = selected ? isSameDay(day, selected) : false;
          const isToday = isSameDay(day, today);
          const isDisabled = disabled?.(day) ?? false;

          return (
            <button
              key={dayStripped.toISOString()}
              type="button"
              role="gridcell"
              aria-selected={isSelected}
              aria-disabled={isDisabled}
              disabled={isDisabled}
              onClick={() => handleSelect(day)}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-md text-sm transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                !isCurrentMonth && "text-muted-foreground/50",
                isToday && !isSelected && "border border-kaza-blue/40 font-semibold",
                isSelected &&
                  "bg-kaza-blue text-white hover:bg-kaza-blue hover:text-white",
                isDisabled &&
                  "cursor-not-allowed text-muted-foreground/40 line-through hover:bg-transparent hover:text-muted-foreground/40",
              )}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { Calendar };
