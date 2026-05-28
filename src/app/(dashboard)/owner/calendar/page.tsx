import type { Metadata } from "next";

import { CalendarView } from "./calendar-view";

export const metadata: Metadata = {
  title: "Calendrier des visites",
};

export default function OwnerCalendarPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-kaza-navy sm:text-3xl">
          Calendrier des visites
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visualisez toutes les demandes de visite à venir et organisez votre
          agenda en un coup d&apos;œil.
        </p>
      </div>

      <CalendarView />
    </div>
  );
}
