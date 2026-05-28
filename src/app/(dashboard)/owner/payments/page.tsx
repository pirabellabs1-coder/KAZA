import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { listOwnerPayments } from "@/lib/queries/owner-activity";

import { OwnerPaymentsView } from "./payments-view";

export const metadata: Metadata = {
  title: "Paiements — KAZA",
  description: "Suivi des paiements perçus, en attente et en retard.",
};

const OWNER_ROLES = new Set(["OWNER", "AGENCY", "ADMIN"]);

export default async function OwnerPaymentsPage() {
  const user = await getCurrentDisplayUser();
  if (!user) {
    redirect("/login");
  }
  if (!OWNER_ROLES.has(user.role)) {
    redirect("/dashboard");
  }

  const payments = await listOwnerPayments(user.id);
  return <OwnerPaymentsView payments={payments} />;
}
