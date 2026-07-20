import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { listOwnerRentals } from "@/lib/queries/owner-activity";

import { OwnerRentalsView } from "./rentals-view";

export const metadata: Metadata = {
  title: "Locations en Cours — Kaabo",
  description: "Suivi de vos baux actifs, à venir et passés.",
};

const OWNER_ROLES = new Set(["OWNER", "AGENCY", "ADMIN"]);

export default async function OwnerRentalsPage() {
  const user = await getCurrentDisplayUser();
  if (!user) {
    redirect("/login");
  }
  if (!OWNER_ROLES.has(user.role)) {
    redirect("/dashboard");
  }

  const rentals = await listOwnerRentals(user.id);
  // Le propriétaire peut résilier directement ses baux actifs (l'agence passe
  // par sa fiche détail dédiée /agency/rentals/[id]).
  return <OwnerRentalsView rentals={rentals} showTerminate={user.role === "OWNER"} />;
}
