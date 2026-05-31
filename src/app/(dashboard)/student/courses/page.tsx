import type { Metadata } from "next";
import { MapPin } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { getStudentProfile } from "@/lib/queries/student-profile";

import { CoursesClient } from "./courses-client";

export const metadata: Metadata = {
  title: "Mon université & emploi du temps",
};

function readStr(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export default async function StudentCoursesPage() {
  const user = await getCurrentDisplayUser();
  const profile = user ? await getStudentProfile(user.id) : null;

  const courses =
    profile && typeof profile.courses === "object" && profile.courses !== null
      ? (profile.courses as Record<
          string,
          Record<string, { title: string; prof?: string }>
        >)
      : {};

  const initial = {
    university: readStr(profile?.university),
    faculty: readStr(profile?.faculty),
    studyYear: readStr(profile?.studyYear),
    program: readStr(profile?.program),
    courses,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Mon université & emploi du temps
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Centralisez votre cursus pour mieux organiser cours et colocation.
        </p>
      </div>

      <CoursesClient initial={initial} />

      {/* Distances campus — calculées dès que la géolocalisation université /
          logement sera branchée. Empty state honnête. */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="size-4 text-kaza-blue" />
            Distance aux logements KAZA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-6 text-center text-sm text-muted-foreground">
            Renseignez votre université ci-dessus et choisissez un logement pour
            estimer vos temps de trajet (à venir).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
