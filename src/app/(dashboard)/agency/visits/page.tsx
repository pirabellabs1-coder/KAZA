import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { listOwnerVisits } from "@/lib/queries/owner-activity";

import { OwnerVisitsView } from "../../owner/visits/visits-list";

export const metadata: Metadata = {
  title: "Visites — KAZA Pro",
  description:
    "Suivez et confirmez les demandes de visite des biens gérés par votre agence.",
};

const ALLOWED = new Set(["AGENCY", "ADMIN"]);

export default async function AgencyVisitsPage() {
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login");
  if (!ALLOWED.has(user.role)) redirect("/dashboard");

  const visits = await listOwnerVisits(user.id);
  return <OwnerVisitsView visits={visits} />;
}
