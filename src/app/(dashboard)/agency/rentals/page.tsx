import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { listOwnerRentals } from "@/lib/queries/owner-activity";

import { OwnerRentalsView } from "../../owner/rentals/rentals-view";

export const metadata: Metadata = {
  title: "Baux & locations — Kaabo Pro",
  description:
    "Gérez les baux en cours de votre agence : locataires, loyers, échéances et statut.",
};

const ALLOWED = new Set(["AGENCY", "ADMIN"]);

export default async function AgencyRentalsPage() {
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login");
  if (!ALLOWED.has(user.role)) redirect("/dashboard");

  const rentals = await listOwnerRentals(user.id);
  return (
    <OwnerRentalsView rentals={rentals} detailHrefBase="/agency/rentals" />
  );
}
