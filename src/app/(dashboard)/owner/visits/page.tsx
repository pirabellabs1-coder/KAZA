import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { listOwnerVisits } from "@/lib/queries/owner-activity";

import { OwnerVisitsView } from "./visits-list";

export const metadata: Metadata = {
  title: "Demandes de Visite — Kaabo",
  description: "Gérez les demandes de visite reçues sur vos annonces.",
};

const OWNER_ROLES = new Set(["OWNER", "AGENCY", "ADMIN"]);

export default async function OwnerVisitsPage() {
  const user = await getCurrentDisplayUser();
  if (!user) {
    redirect("/login");
  }
  if (!OWNER_ROLES.has(user.role)) {
    redirect("/dashboard");
  }

  const visits = await listOwnerVisits(user.id);

  return <OwnerVisitsView visits={visits} />;
}
