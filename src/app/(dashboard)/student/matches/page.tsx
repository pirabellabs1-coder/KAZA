import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { getStudentMatches } from "@/lib/queries/student-profile";

import { MatchesList } from "./matches-list";

export const metadata: Metadata = {
  title: "Mes matchs colocataires",
};

export const dynamic = "force-dynamic";

export default async function StudentMatchesPage() {
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login?redirect=/student/matches");

  const matches = await getStudentMatches(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Mes matchs colocataires
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Profils de colocataires compatibles selon votre profil colocation.
        </p>
      </div>

      <MatchesList matches={matches} />
    </div>
  );
}
