import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { listOwnerPayments } from "@/lib/queries/owner-activity";

import { OwnerPaymentsView } from "../../owner/payments/payments-view";

export const metadata: Metadata = {
  title: "Loyers & encaissements — KAZA Pro",
  description:
    "Suivez les loyers et encaissements des biens gérés par votre agence.",
};

const ALLOWED = new Set(["AGENCY", "ADMIN"]);

export default async function AgencyPaymentsPage() {
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login");
  if (!ALLOWED.has(user.role)) redirect("/dashboard");

  const payments = await listOwnerPayments(user.id);
  return <OwnerPaymentsView payments={payments} />;
}
