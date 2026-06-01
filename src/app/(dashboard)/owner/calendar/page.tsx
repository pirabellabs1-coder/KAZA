import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { getOwnerVisitCalendar } from "@/lib/queries/owner-visits";

import { CalendarView } from "./calendar-view";

export const metadata: Metadata = {
  title: "Calendrier des visites",
};

export const dynamic = "force-dynamic";

export default async function OwnerCalendarPage() {
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login?redirect=/owner/calendar");

  const visits = await getOwnerVisitCalendar(user.id);

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

      <CalendarView visits={visits} />
    </div>
  );
}
