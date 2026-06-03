"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type DayKind = "visit" | "blocked" | "rented" | "free";

interface CalendarTabProps {
  propertyId: string;
}

const MONTH_NAMES = [
  "Janvier",
  "Fevrier",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Aout",
  "Septembre",
  "Octobre",
  "Novembre",
  "Decembre",
];

const WEEK_DAYS = ["L", "M", "M", "J", "V", "S", "D"];

// Aucune donnée d'occupation fabriquée : par défaut tous les jours sont libres.
// La gestion réelle des indisponibilités se fait dans le gestionnaire de
// disponibilités dédié (bouton « Gérer les disponibilités »).
function buildMonthMap(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- stub : paramètre conservé (occupation gérée dans le gestionnaire de disponibilités)
  _propertyId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- stub : paramètre conservé (occupation gérée dans le gestionnaire de disponibilités)
  _year: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- stub : paramètre conservé (occupation gérée dans le gestionnaire de disponibilités)
  _month: number,
): Map<number, DayKind> {
  return new Map<number, DayKind>();
}

export function CalendarTab({ propertyId }: CalendarTabProps) {
  const today = new Date();
  const [view, setView] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  const [selectedDay, setSelectedDay] = useState<{
    day: number;
    kind: DayKind;
  } | null>(null);

  const monthMap = useMemo(
    () => buildMonthMap(propertyId, view.year, view.month),
    [propertyId, view.year, view.month],
  );

  const firstDay = new Date(view.year, view.month, 1);
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  // Convert getDay (0=Dim) -> 0=Lun
  const startOffset = (firstDay.getDay() + 6) % 7;

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  function prevMonth() {
    setView((v) => {
      const m = v.month - 1;
      return m < 0
        ? { year: v.year - 1, month: 11 }
        : { year: v.year, month: m };
    });
  }

  function nextMonth() {
    setView((v) => {
      const m = v.month + 1;
      return m > 11
        ? { year: v.year + 1, month: 0 }
        : { year: v.year, month: m };
    });
  }

  function handleDayClick(day: number) {
    const kind = monthMap.get(day) ?? "free";
    setSelectedDay({ day, kind });
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base sm:text-lg">
            {MONTH_NAMES[view.month]} {view.year}
          </CardTitle>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Legende */}
          <div className="mb-4 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-kaza-warning" />
              Visites
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-muted-foreground" />
              Indisponible
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-kaza-green" />
              Loue
            </div>
          </div>

          {/* En-tete jours */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
            {WEEK_DAYS.map((d, i) => (
              <div key={i} className="py-1.5">
                {d}
              </div>
            ))}
          </div>

          {/* Grille des jours */}
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) {
                return <div key={i} className="aspect-square" />;
              }
              const kind = monthMap.get(day) ?? "free";
              const isToday =
                day === today.getDate() &&
                view.month === today.getMonth() &&
                view.year === today.getFullYear();

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "relative flex aspect-square flex-col items-center justify-center rounded-md border text-sm transition-colors hover:bg-muted",
                    isToday && "ring-2 ring-kaza-blue ring-offset-1",
                    kind === "blocked" &&
                      "border-transparent bg-muted text-muted-foreground line-through",
                    kind === "rented" &&
                      "border-kaza-green/40 bg-kaza-green/15 text-foreground",
                    kind === "visit" && "border-kaza-warning/40 bg-card",
                    kind === "free" && "border-border bg-card",
                  )}
                >
                  <span className="leading-none">{day}</span>
                  {kind === "visit" && (
                    <span
                      aria-hidden
                      className="mt-0.5 size-1.5 rounded-full bg-kaza-warning"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={selectedDay !== null}
        onOpenChange={(o) => !o && setSelectedDay(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDay
                ? `${selectedDay.day} ${MONTH_NAMES[view.month]} ${view.year}`
                : "Jour"}
            </DialogTitle>
            <DialogDescription>
              {selectedDay?.kind === "visit" &&
                "Une demande de visite est planifiee ce jour."}
              {selectedDay?.kind === "blocked" &&
                "Ce jour est marque comme indisponible."}
              {selectedDay?.kind === "rented" &&
                "Le bien est loue ce jour-la."}
              {selectedDay?.kind === "free" &&
                "Aucun evenement planifie pour ce jour."}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button asChild variant="outline">
              <Link href={`/owner/properties/${propertyId}/availability`}>
                Gérer les disponibilités
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
