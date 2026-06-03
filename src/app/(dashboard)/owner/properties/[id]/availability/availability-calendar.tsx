"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast-helper";
import {
  addAvailabilityBlock,
  deleteAvailabilityBlock,
} from "@/actions/availability";
import type {
  AvailabilityBlock,
  AvailabilityReason,
} from "@/lib/queries/availability";

// =============================================================================
// Calendrier de disponibilité — persistance via availability_blocks (Supabase).
// Les blocages initiaux sont fournis par la page serveur (`initialBlocks`) ;
// les ajouts/suppressions passent par les Server Actions `@/actions/availability`.
// =============================================================================

const REASON_LABELS: Record<AvailabilityReason, string> = {
  maintenance: "Maintenance",
  personal_use: "Usage personnel",
  reserved: "Réservé",
  other: "Autre",
};

function formatBlockDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y!, (m ?? 1) - 1, d ?? 1);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

interface DemoVisit {
  id: string;
  propertyId: string;
  date: string;
  time: string;
  status: string;
}

function getOwnerCalendarVisits(): DemoVisit[] {
  return [];
}

interface AvailabilityCalendarProps {
  propertyId: string;
  initialBlocks: AvailabilityBlock[];
}

const MONTH_NAMES = [
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

const WEEK_DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function compareIso(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function AvailabilityCalendar({
  propertyId,
  initialBlocks,
}: AvailabilityCalendarProps) {
  const router = useRouter();
  const today = new Date();
  const [view, setView] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  const [selection, setSelection] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>(
    () => initialBlocks,
  );
  const [reason, setReason] = useState<AvailabilityReason>("maintenance");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Réservations de visite (statique seed)
  const visits = useMemo(
    () =>
      getOwnerCalendarVisits().filter((v) => v.propertyId === propertyId),
    [propertyId],
  );

  // Construction de la grille
  const firstDay = new Date(view.year, view.month, 1);
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7; // 0 = Lundi

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const todayIso = isoDate(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  function prevMonth() {
    setView((v) =>
      v.month === 0
        ? { year: v.year - 1, month: 11 }
        : { year: v.year, month: v.month - 1 },
    );
  }

  function nextMonth() {
    setView((v) =>
      v.month === 11
        ? { year: v.year + 1, month: 0 }
        : { year: v.year, month: v.month + 1 },
    );
  }

  function goToToday() {
    setView({ year: today.getFullYear(), month: today.getMonth() });
  }

  function toggleSelection(iso: string) {
    setSelection((sel) => {
      if (sel.includes(iso)) return sel.filter((d) => d !== iso);
      return [...sel, iso].sort(compareIso);
    });
  }

  function clearSelection() {
    setSelection([]);
    setNote("");
    setReason("maintenance");
  }

  async function handleConfirm() {
    if (selection.length === 0) return;
    setSubmitting(true);
    const startDate = selection[0]!;
    const endDate = selection[selection.length - 1]!;

    const result = await addAvailabilityBlock({
      propertyId,
      startDate,
      endDate,
      reason,
      note: note.trim() || undefined,
    });

    if (result.success && result.block) {
      setBlocks((prev) => [result.block!, ...prev]);
      toast.success(
        selection.length === 1
          ? `Date du ${formatBlockDate(startDate)} bloquée`
          : `Plage du ${formatBlockDate(startDate)} au ${formatBlockDate(endDate)} bloquée`,
      );
      clearSelection();
      router.refresh();
    } else {
      toast.error(
        result.success
          ? "Impossible d'enregistrer le blocage."
          : result.error,
      );
    }

    setSubmitting(false);
  }

  async function handleRemove(id: string) {
    const result = await deleteAvailabilityBlock(id);
    if (result.success) {
      setBlocks((prev) => prev.filter((b) => b.id !== id));
      toast.info("Blocage supprimé");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  type DayKind = "free" | "blocked" | "selected" | "visit" | "rented";

  // Ensemble des dates bloquées (toutes les journées de chaque plage, inclus).
  const blockedDates = useMemo(() => {
    const set = new Set<string>();
    for (const b of blocks) {
      const [sy, sm, sd] = b.startDate.split("-").map(Number);
      const [ey, em, ed] = b.endDate.split("-").map(Number);
      const cursor = new Date(sy!, (sm ?? 1) - 1, sd ?? 1);
      const end = new Date(ey!, (em ?? 1) - 1, ed ?? 1);
      while (cursor <= end) {
        set.add(
          isoDate(cursor.getFullYear(), cursor.getMonth(), cursor.getDate()),
        );
        cursor.setDate(cursor.getDate() + 1);
      }
    }
    return set;
  }, [blocks]);

  function getKind(iso: string): DayKind {
    if (selection.includes(iso)) return "selected";
    if (blockedDates.has(iso)) return "blocked";
    if (visits.some((v) => v.date === iso)) return "visit";
    // "rented" : on simule un état loué si le bien est marqué RENTED
    return "free";
  }

  const visitsByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const v of visits) {
      map.set(v.date, (map.get(v.date) ?? 0) + 1);
    }
    return map;
  }, [visits]);

  const sortedBlocks = useMemo(
    () =>
      [...blocks].sort((a, b) => compareIso(a.startDate, b.startDate)),
    [blocks],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Calendrier */}
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base sm:text-lg">
            {MONTH_NAMES[view.month]} {view.year}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="h-8"
            >
              Aujourd&apos;hui
            </Button>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={prevMonth}
                className="h-8 w-8"
                aria-label="Mois précédent"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={nextMonth}
                className="h-8 w-8"
                aria-label="Mois suivant"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* En-tete jours */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
            {WEEK_DAYS.map((d) => (
              <div key={d} className="py-1.5">
                {d}
              </div>
            ))}
          </div>

          {/* Grille */}
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) {
                return <div key={`empty-${i}`} className="aspect-square" />;
              }
              const iso = isoDate(view.year, view.month, day);
              const kind = getKind(iso);
              const isToday = iso === todayIso;
              const visitCount = visitsByDate.get(iso) ?? 0;

              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => toggleSelection(iso)}
                  className={cn(
                    "relative flex aspect-square flex-col items-center justify-center rounded-md border text-sm transition-all hover:scale-[1.02]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kaza-blue focus-visible:ring-offset-1",
                    isToday && "ring-2 ring-kaza-blue ring-offset-1",
                    kind === "free" &&
                      "border-border bg-card hover:bg-muted",
                    kind === "blocked" &&
                      "border-red-300 bg-red-100 text-red-800 hover:bg-red-200",
                    kind === "selected" &&
                      "border-kaza-blue bg-kaza-blue text-white hover:bg-kaza-blue/90",
                    kind === "visit" &&
                      "border-orange-300 bg-orange-100 text-orange-800 hover:bg-orange-200",
                    kind === "rented" &&
                      "border-kaza-green/40 bg-kaza-green/15 text-foreground",
                  )}
                >
                  <span className="font-medium leading-none">{day}</span>
                  {kind === "visit" && visitCount > 0 && (
                    <span className="mt-0.5 text-[10px] font-semibold">
                      {visitCount} visite{visitCount > 1 ? "s" : ""}
                    </span>
                  )}
                  {kind === "blocked" && (
                    <span className="mt-0.5 size-1 rounded-full bg-red-600" />
                  )}
                </button>
              );
            })}
          </div>

          {selection.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-kaza-blue/30 bg-kaza-blue/5 p-3">
              <div className="text-sm">
                <strong>{selection.length}</strong> jour
                {selection.length > 1 ? "s" : ""} sélectionné
                {selection.length > 1 ? "s" : ""}
                <span className="ml-2 text-muted-foreground">
                  ({formatBlockDate(selection[0]!)}
                  {selection.length > 1 &&
                    ` → ${formatBlockDate(selection[selection.length - 1]!)}`}
                  )
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="h-8"
              >
                <X className="mr-1 size-3.5" />
                Effacer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Panneau droit */}
      <div className="space-y-4">
        {/* Légende */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Légende</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <LegendRow
              swatchClass="border-border bg-card"
              label="Libre"
            />
            <LegendRow
              swatchClass="border-kaza-blue bg-kaza-blue"
              label="Sélectionné"
            />
            <LegendRow
              swatchClass="border-red-300 bg-red-100"
              label="Bloqué"
            />
            <LegendRow
              swatchClass="border-orange-300 bg-orange-100"
              label="Visite réservée"
            />
            <LegendRow
              swatchClass="border-kaza-green/40 bg-kaza-green/15"
              label="Loué"
            />
          </CardContent>
        </Card>

        {/* Formulaire de blocage */}
        {selection.length > 0 && (
          <Card className="border-kaza-blue/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Bloquer cette plage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="reason">Raison</Label>
                <Select
                  value={reason}
                  onValueChange={(v) => setReason(v as AvailabilityReason)}
                >
                  <SelectTrigger id="reason">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.keys(REASON_LABELS) as AvailabilityReason[]
                    ).map((r) => (
                      <SelectItem key={r} value={r}>
                        {REASON_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="note">Note (optionnel)</Label>
                <Textarea
                  id="note"
                  placeholder="Ex : Travaux de peinture..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <Button
                onClick={handleConfirm}
                disabled={submitting}
                className="w-full bg-kaza-blue hover:bg-kaza-blue/90"
              >
                Confirmer le blocage
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Blocages actifs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              Mes blocages actifs ({sortedBlocks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sortedBlocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-xs text-muted-foreground">
                <CalendarDays className="mb-2 size-8 opacity-40" />
                Aucun blocage actif.
                <br />
                Sélectionnez des dates pour commencer.
              </div>
            ) : (
              <ul className="space-y-2">
                {sortedBlocks.map((b) => {
                  const isSingle = b.startDate === b.endDate;
                  return (
                    <li
                      key={b.id}
                      className="flex items-start justify-between gap-2 rounded-md border bg-card p-2.5"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant="secondary"
                            className="text-[10px]"
                          >
                            {REASON_LABELS[b.reason]}
                          </Badge>
                        </div>
                        <p className="text-xs font-medium text-foreground">
                          {isSingle
                            ? formatBlockDate(b.startDate)
                            : `${formatBlockDate(b.startDate)} → ${formatBlockDate(b.endDate)}`}
                        </p>
                        {b.note && (
                          <p className="line-clamp-2 text-[11px] text-muted-foreground">
                            {b.note}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(b.id)}
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                        aria-label="Supprimer le blocage"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LegendRow({
  swatchClass,
  label,
}: {
  swatchClass: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("size-4 rounded border", swatchClass)} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
