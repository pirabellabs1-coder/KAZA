"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  LayoutGrid,
  List,
  MapPin,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getOwnerCalendarVisits,
  formatVisitTimeSlot,
  type DemoVisit,
  type DemoVisitStatus,
} from "@/lib/demo-visits";
import { cn } from "@/lib/utils";

const MONTH_LABELS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

const WEEKDAY_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

type ViewMode = "grid" | "list";

interface CalendarDay {
  date: Date;
  inCurrentMonth: boolean;
  isoDate: string;
  isToday: boolean;
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Génère la grille du mois affiché (du lundi de la semaine de début
 * au dimanche de la semaine de fin).
 */
function buildMonthGrid(year: number, month: number, today: Date): CalendarDay[] {
  const first = new Date(year, month, 1);
  // 0 (Sun) → 6 (Sat) ; on veut Lundi = 0
  const firstWeekday = (first.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - firstWeekday);

  const last = new Date(year, month + 1, 0);
  const lastWeekday = (last.getDay() + 6) % 7;
  const gridEnd = new Date(year, month + 1, 6 - lastWeekday);

  const days: CalendarDay[] = [];
  const cursor = new Date(gridStart);
  while (cursor <= gridEnd) {
    days.push({
      date: new Date(cursor),
      inCurrentMonth: cursor.getMonth() === month,
      isoDate: toIsoDate(cursor),
      isToday: isSameDay(cursor, today),
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

const STATUS_DOT: Record<DemoVisitStatus, string> = {
  PENDING: "bg-amber-500",
  CONFIRMED: "bg-kaza-green",
  REJECTED: "bg-destructive",
  COMPLETED: "bg-gray-400",
  CANCELLED: "bg-gray-300",
};

const STATUS_LABEL: Record<DemoVisitStatus, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  REJECTED: "Rejetée",
  COMPLETED: "Effectuée",
  CANCELLED: "Annulée",
};

export function CalendarView() {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [cursor, setCursor] = useState<Date>(today);
  const [selectedIso, setSelectedIso] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("grid");
  const [visits, setVisits] = useState<DemoVisit[]>([]);

  useEffect(() => {
    setVisits(getOwnerCalendarVisits());
  }, []);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const grid = useMemo(
    () => buildMonthGrid(year, month, today),
    [year, month, today],
  );

  // Index visites par date ISO
  const visitsByDate = useMemo(() => {
    const map = new Map<string, DemoVisit[]>();
    for (const v of visits) {
      const arr = map.get(v.date) ?? [];
      arr.push(v);
      map.set(v.date, arr);
    }
    // Tri par heure
    for (const arr of map.values()) {
      arr.sort((a, b) => a.time.localeCompare(b.time));
    }
    return map;
  }, [visits]);

  const upcomingVisits = useMemo(() => {
    return [...visits].sort(
      (a, b) =>
        a.date.localeCompare(b.date) || a.time.localeCompare(b.time),
    );
  }, [visits]);

  const selectedVisits = selectedIso
    ? visitsByDate.get(selectedIso) ?? []
    : [];

  const goPrev = () => {
    setSelectedIso(null);
    setCursor(new Date(year, month - 1, 1));
  };
  const goNext = () => {
    setSelectedIso(null);
    setCursor(new Date(year, month + 1, 1));
  };
  const goToday = () => {
    setSelectedIso(null);
    setCursor(today);
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goPrev}
            aria-label="Mois précédent"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <h2 className="min-w-[180px] text-center font-heading text-lg font-semibold text-kaza-navy">
            {MONTH_LABELS[month]} {year}
          </h2>
          <Button
            variant="outline"
            size="icon"
            onClick={goNext}
            aria-label="Mois suivant"
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToday}>
            Aujourd&apos;hui
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={view === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("grid")}
            className={cn(
              view === "grid" && "bg-kaza-navy hover:bg-kaza-navy/90",
            )}
          >
            <LayoutGrid className="mr-1.5 size-4" />
            Calendrier
          </Button>
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("list")}
            className={cn(
              view === "list" && "bg-kaza-navy hover:bg-kaza-navy/90",
            )}
          >
            <List className="mr-1.5 size-4" />
            Liste
          </Button>
        </div>
      </div>

      {/* Vue calendrier */}
      {view === "grid" && (
        <>
          <Card>
            <CardContent className="p-3 sm:p-4">
              {/* En-tête jours */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">
                {WEEKDAY_SHORT.map((d) => (
                  <div key={d} className="py-2">
                    {d}
                  </div>
                ))}
              </div>

              {/* Grille jours */}
              <div className="grid grid-cols-7 gap-1">
                {grid.map((day) => {
                  const dayVisits = visitsByDate.get(day.isoDate) ?? [];
                  const isSelected = selectedIso === day.isoDate;
                  const hasPending = dayVisits.some(
                    (v) => v.status === "PENDING",
                  );
                  const hasConfirmed = dayVisits.some(
                    (v) => v.status === "CONFIRMED",
                  );

                  return (
                    <button
                      key={day.isoDate}
                      type="button"
                      onClick={() =>
                        setSelectedIso(isSelected ? null : day.isoDate)
                      }
                      className={cn(
                        "relative flex aspect-square flex-col items-center justify-start gap-1 rounded-md border p-1.5 text-xs transition-all hover:border-kaza-blue hover:bg-kaza-blue/5 sm:p-2 sm:text-sm",
                        day.inCurrentMonth
                          ? "border-gray-200 bg-white"
                          : "border-transparent bg-muted/30 text-muted-foreground/50",
                        day.isToday && "ring-2 ring-kaza-blue/40",
                        isSelected &&
                          "border-kaza-blue bg-kaza-blue/10 ring-2 ring-kaza-blue",
                      )}
                    >
                      <span
                        className={cn(
                          "font-medium",
                          day.isToday && "font-bold text-kaza-blue",
                        )}
                      >
                        {day.date.getDate()}
                      </span>

                      {dayVisits.length > 0 && (
                        <div className="absolute bottom-1.5 flex items-center gap-0.5">
                          {hasConfirmed && (
                            <span
                              className={cn(
                                "size-1.5 rounded-full",
                                STATUS_DOT.CONFIRMED,
                              )}
                              aria-label="Visite confirmée"
                            />
                          )}
                          {hasPending && (
                            <span
                              className={cn(
                                "size-1.5 rounded-full",
                                STATUS_DOT.PENDING,
                              )}
                              aria-label="Visite en attente"
                            />
                          )}
                          {dayVisits.length > 1 && (
                            <span className="ml-0.5 text-[9px] font-semibold text-muted-foreground">
                              {dayVisits.length}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Légende */}
              <div className="mt-4 flex flex-wrap items-center gap-4 border-t pt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span
                    className={cn("size-2 rounded-full", STATUS_DOT.CONFIRMED)}
                  />
                  Confirmée
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className={cn("size-2 rounded-full", STATUS_DOT.PENDING)}
                  />
                  En attente
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Détails du jour sélectionné */}
          {selectedIso && (
            <SelectedDayPanel
              iso={selectedIso}
              visits={selectedVisits}
              onClose={() => setSelectedIso(null)}
            />
          )}
        </>
      )}

      {/* Vue liste */}
      {view === "list" && (
        <Card>
          <CardContent className="space-y-3 p-4">
            <h3 className="font-heading text-sm font-semibold text-kaza-navy">
              {upcomingVisits.length} visite
              {upcomingVisits.length > 1 ? "s" : ""} programmée
              {upcomingVisits.length > 1 ? "s" : ""}
            </h3>
            <div className="space-y-2">
              {upcomingVisits.map((v) => (
                <VisitRow key={v.id} visit={v} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SelectedDayPanel({
  iso,
  visits,
  onClose,
}: {
  iso: string;
  visits: DemoVisit[];
  onClose: () => void;
}) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  const label = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-sm font-semibold capitalize text-kaza-navy sm:text-base">
            <CalendarDays className="mr-1.5 inline size-4 text-kaza-blue" />
            {label}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            Fermer
          </Button>
        </div>

        {visits.length === 0 ? (
          <p className="rounded-md border border-dashed border-gray-200 py-6 text-center text-sm text-muted-foreground">
            Aucune visite ce jour.
          </p>
        ) : (
          <div className="space-y-2">
            {visits.map((v) => (
              <VisitRow key={v.id} visit={v} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function VisitRow({ visit }: { visit: DemoVisit }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-gray-100 bg-white p-3 transition-shadow hover:shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-1 size-2.5 shrink-0 rounded-full",
            STATUS_DOT[visit.status],
          )}
        />
        <div className="min-w-0">
          <p className="line-clamp-1 text-sm font-medium text-foreground">
            {visit.propertyTitle}
          </p>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3 shrink-0" />
            <span className="line-clamp-1">{visit.propertyAddress}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
        <Badge variant="outline" className="gap-1 text-[10px]">
          <Clock className="size-3" />
          {formatVisitTimeSlot(visit.time)}
        </Badge>
        <Badge
          className={cn(
            "text-[10px]",
            visit.status === "CONFIRMED" && "bg-kaza-green text-white",
            visit.status === "PENDING" &&
              "border-amber-500 bg-amber-500/10 text-amber-700",
            visit.status === "COMPLETED" && "bg-muted text-muted-foreground",
            visit.status === "CANCELLED" && "bg-gray-100 text-gray-600",
            visit.status === "REJECTED" &&
              "bg-destructive text-destructive-foreground",
          )}
        >
          {STATUS_LABEL[visit.status]}
        </Badge>
      </div>
    </div>
  );
}
