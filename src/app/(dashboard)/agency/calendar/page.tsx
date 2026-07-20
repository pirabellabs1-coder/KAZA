import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  PenLine,
  CalendarPlus,
  MapPin,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import {
  getCurrentWeekRange,
  listCalendarEvents,
  type CalendarEvent,
  type CalendarEventType,
} from "@/lib/queries/agency-calendar";
import { listTeamMembers } from "@/lib/queries/agency-team";

import { NewEventDialog } from "./new-event-dialog";

export const metadata: Metadata = {
  title: "Agenda équipe — Kaabo Pro Agence",
  description:
    "Calendrier multi-agents : visites, signatures, réunions et inspections de votre équipe.",
};

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const TYPE_LABELS: Record<CalendarEventType, string> = {
  VISIT: "Visite",
  SIGNATURE: "Signature",
  MEETING: "Réunion",
  INSPECTION: "Inspection",
  OTHER: "Autre",
};

const TYPE_COLORS: Record<
  CalendarEventType,
  { bg: string; border: string; text: string; chip: string }
> = {
  VISIT: {
    bg: "bg-blue-50",
    border: "border-blue-300",
    text: "text-blue-900",
    chip: "bg-blue-100 text-blue-700",
  },
  SIGNATURE: {
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    text: "text-emerald-900",
    chip: "bg-emerald-100 text-emerald-700",
  },
  MEETING: {
    bg: "bg-purple-50",
    border: "border-purple-300",
    text: "text-purple-900",
    chip: "bg-purple-100 text-purple-700",
  },
  INSPECTION: {
    bg: "bg-amber-50",
    border: "border-amber-300",
    text: "text-amber-900",
    chip: "bg-amber-100 text-amber-700",
  },
  OTHER: {
    bg: "bg-slate-50",
    border: "border-slate-300",
    text: "text-slate-900",
    chip: "bg-slate-100 text-slate-700",
  },
};

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 08h → 19h
const SLOT_HEIGHT = 56; // px par heure

const DAY_SHORT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatLongDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function eventDurationMinutes(ev: CalendarEvent): number {
  return Math.max(
    15,
    Math.round(
      (new Date(ev.endAt).getTime() - new Date(ev.startAt).getTime()) / 60000,
    ),
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AgencyCalendarPage() {
  const user = await getCurrentDisplayUser();
  if (!user) {
    redirect("/login?redirect=/agency/calendar");
  }

  const { start, end, days } = getCurrentWeekRange();
  const [events, members] = await Promise.all([
    listCalendarEvents(user.id, start.toISOString(), end.toISOString()),
    listTeamMembers(user.id),
  ]);

  const activeAgents = members
    .filter((m) => m.status === "ACTIVE" || m.status === "ON_LEAVE")
    .map((m) => ({ id: m.id, fullName: m.fullName }));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayEvents = events
    .filter((e) => isSameDay(new Date(e.startAt), today))
    .sort(
      (a, b) =>
        new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );

  const upcomingSignatures = events
    .filter((e) => e.type === "SIGNATURE")
    .slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-kaza-navy">
            Agenda équipe
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Semaine du {formatLongDate(days[0])} au{" "}
            {formatLongDate(days[6])}.
          </p>
        </div>
        <NewEventDialog agents={activeAgents} />
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatChip
          icon={CalendarIcon}
          label="Aujourd'hui"
          value={`${todayEvents.length} RDV`}
          color="text-kaza-blue"
          bg="bg-kaza-blue/10"
        />
        <StatChip
          icon={Clock}
          label="Cette semaine"
          value={`${events.length} RDV`}
          color="text-kaza-navy"
          bg="bg-kaza-navy/10"
        />
        <StatChip
          icon={PenLine}
          label="Signatures"
          value={`${events.filter((e) => e.type === "SIGNATURE").length}`}
          color="text-kaza-green"
          bg="bg-kaza-green/10"
        />
        <StatChip
          icon={Users}
          label="Agents actifs"
          value={`${activeAgents.length}`}
          color="text-purple-700"
          bg="bg-purple-100"
        />
      </div>

      {/* Empty state */}
      {events.length === 0 ? (
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-kaza-blue/10">
              <CalendarPlus className="size-8 text-kaza-blue" />
            </div>
            <div className="space-y-2">
              <h3 className="font-heading text-lg font-semibold text-kaza-navy">
                Planifiez votre première visite
              </h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                Centralisez visites, signatures et inspections dans un agenda
                partagé. Aucun rendez-vous prévu cette semaine.
              </p>
            </div>
            <NewEventDialog agents={activeAgents} />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            {/* Vue semaine */}
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="font-heading text-lg">
                  Vue semaine
                </CardTitle>
                <CardDescription>
                  Du lundi au dimanche — créneaux 08h00 → 19h00.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto">
                  <div className="min-w-[820px]">
                    {/* En-tête colonnes */}
                    <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b">
                      <div />
                      {days.map((d) => {
                        const isToday = isSameDay(d, today);
                        return (
                          <div
                            key={d.toISOString()}
                            className={cn(
                              "px-2 pb-2 text-center",
                              isToday && "bg-kaza-blue/5",
                            )}
                          >
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                              {DAY_SHORT[d.getDay()]}
                            </p>
                            <p
                              className={cn(
                                "mt-0.5 inline-flex size-7 items-center justify-center rounded-full text-sm font-bold",
                                isToday
                                  ? "bg-kaza-blue text-white"
                                  : "text-kaza-navy",
                              )}
                            >
                              {d.getDate()}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Grille slots */}
                    <div className="relative grid grid-cols-[60px_repeat(7,1fr)]">
                      <div>
                        {HOURS.map((h) => (
                          <div
                            key={h}
                            className="flex items-start justify-end pr-2 pt-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
                            style={{ height: SLOT_HEIGHT }}
                          >
                            {String(h).padStart(2, "0")}h
                          </div>
                        ))}
                      </div>

                      {days.map((d) => {
                        const isToday = isSameDay(d, today);
                        const dayEvents = events.filter((e) =>
                          isSameDay(new Date(e.startAt), d),
                        );
                        return (
                          <div
                            key={d.toISOString()}
                            className={cn(
                              "relative border-l",
                              isToday && "bg-kaza-blue/5",
                            )}
                            style={{ height: SLOT_HEIGHT * HOURS.length }}
                          >
                            {HOURS.map((h) => (
                              <div
                                key={h}
                                className="border-b border-dashed border-border/60"
                                style={{ height: SLOT_HEIGHT }}
                              />
                            ))}

                            {dayEvents.map((ev) => {
                              const startDate = new Date(ev.startAt);
                              const startMin =
                                startDate.getHours() * 60 +
                                startDate.getMinutes();
                              const top =
                                ((startMin - 8 * 60) / 60) * SLOT_HEIGHT;
                              const height =
                                (eventDurationMinutes(ev) / 60) *
                                  SLOT_HEIGHT -
                                4;
                              const c = TYPE_COLORS[ev.type];
                              return (
                                <div
                                  key={ev.id}
                                  className={cn(
                                    "absolute left-1 right-1 cursor-default overflow-hidden rounded-md border-l-4 px-2 py-1.5 shadow-sm transition-shadow hover:shadow-md",
                                    c.bg,
                                    c.border,
                                    c.text,
                                  )}
                                  style={{
                                    top: Math.max(top, 0),
                                    height: Math.max(height, 36),
                                  }}
                                >
                                  <p className="truncate text-[11px] font-semibold">
                                    {formatTime(ev.startAt)} · {ev.title}
                                  </p>
                                  {(ev.contactName || ev.property) && (
                                    <p className="truncate text-[10px] opacity-80">
                                      {ev.contactName}
                                      {ev.contactName && ev.property
                                        ? " · "
                                        : ""}
                                      {ev.property?.title}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Légende */}
                <div className="mt-4 flex flex-wrap items-center gap-3 border-t pt-4 text-xs">
                  <span className="text-muted-foreground">Légende :</span>
                  {(Object.keys(TYPE_LABELS) as CalendarEventType[]).map(
                    (t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1.5"
                      >
                        <span
                          className={cn(
                            "inline-block size-2.5 rounded-sm border",
                            TYPE_COLORS[t].bg,
                            TYPE_COLORS[t].border,
                          )}
                        />
                        <span className="text-muted-foreground">
                          {TYPE_LABELS[t]}
                        </span>
                      </span>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Sidebar aujourd'hui */}
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="font-heading text-lg">
                  Aujourd&apos;hui en détail
                </CardTitle>
                <CardDescription>{formatLongDate(today)}</CardDescription>
              </CardHeader>
              <CardContent>
                {todayEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucun rendez-vous aujourd&apos;hui.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {todayEvents.map((ev) => {
                      const c = TYPE_COLORS[ev.type];
                      return (
                        <li
                          key={ev.id}
                          className="rounded-xl border bg-card p-3 shadow-sm"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex flex-col items-center">
                              <span className="font-heading text-sm font-bold text-kaza-navy">
                                {formatTime(ev.startAt)}
                              </span>
                              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                {eventDurationMinutes(ev)} min
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 border-l pl-3">
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                                  c.chip,
                                )}
                              >
                                {TYPE_LABELS[ev.type]}
                              </span>
                              <p className="mt-1 truncate text-sm font-medium text-foreground">
                                {ev.title}
                              </p>
                              {ev.contactName && (
                                <p className="truncate text-xs text-muted-foreground">
                                  {ev.contactName}
                                </p>
                              )}
                              {ev.property && (
                                <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                                  <MapPin className="size-3" />
                                  {ev.property.title}
                                </p>
                              )}
                              {ev.assignedMember && (
                                <p className="mt-1 text-[11px] text-muted-foreground">
                                  {ev.assignedMember.fullName}
                                </p>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Prochaines signatures */}
          {upcomingSignatures.length > 0 && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-heading text-xl font-bold text-kaza-navy">
                    Prochaines signatures
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Les contrats à signer dans les 7 prochains jours.
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-emerald-100 text-emerald-700"
                >
                  {upcomingSignatures.length} en attente
                </Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {upcomingSignatures.map((ev) => (
                  <Card
                    key={ev.id}
                    className="rounded-2xl border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white"
                  >
                    <CardContent className="p-5">
                      <Badge className="bg-emerald-600 hover:bg-emerald-700">
                        <PenLine className="size-3" /> Signature
                      </Badge>
                      <p className="mt-3 font-heading text-base font-bold text-kaza-navy">
                        {ev.title}
                      </p>
                      {ev.contactName && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {ev.contactName}
                        </p>
                      )}
                      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-emerald-200 pt-3 text-xs">
                        <div>
                          <p className="text-muted-foreground">Date</p>
                          <p className="font-semibold text-kaza-navy">
                            {new Date(ev.startAt).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Heure</p>
                          <p className="font-semibold text-kaza-navy">
                            {formatTime(ev.startAt)}
                          </p>
                        </div>
                      </div>
                      {ev.property && (
                        <p className="mt-3 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <MapPin className="size-3" />
                          {ev.property.title}
                        </p>
                      )}
                      {ev.assignedMember && (
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          Géré par {ev.assignedMember.fullName}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sous-composants
// ---------------------------------------------------------------------------

function StatChip({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: typeof CalendarIcon;
  label: string;
  value: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm">
      <span
        className={cn(
          "flex size-10 items-center justify-center rounded-xl",
          bg,
          color,
        )}
      >
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="font-heading text-lg font-bold text-kaza-navy">
          {value}
        </p>
      </div>
    </div>
  );
}

