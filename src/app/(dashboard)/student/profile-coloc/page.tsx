import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { getStudentProfile } from "@/lib/queries/student-profile";

import { ColocForm, type ColocProfile } from "./coloc-form";

export const metadata: Metadata = {
  title: "Mon profil colocataire",
};

export const dynamic = "force-dynamic";

export default async function ProfileColocPage() {
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login?redirect=/student/profile-coloc");

  const dbProfile = await getStudentProfile(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Mon profil colocataire
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Plus votre profil est complet, plus l&apos;algorithme Kaabo peut vous
          proposer des matchs précis.
        </p>
      </div>

      <ColocForm
        initialProfile={
          (dbProfile ?? undefined) as Partial<ColocProfile> | undefined
        }
      />
    </div>
  );
}
