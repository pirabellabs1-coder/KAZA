import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import {
  listAgencyDisputes,
  listAgencyTenantOptions,
} from "@/lib/queries/agency-b2b";

import { DisputesView } from "./disputes-view";

export const metadata: Metadata = {
  title: "Litiges & signalements — KAZA Pro",
  description:
    "Suivez les impayés, dégâts et plaintes liés aux biens gérés par votre agence.",
};

export const dynamic = "force-dynamic";

const ALLOWED = new Set(["AGENCY", "ADMIN"]);

export default async function AgencyDisputesPage() {
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login");
  if (!ALLOWED.has(user.role)) redirect("/dashboard");

  const [disputes, tenants] = await Promise.all([
    listAgencyDisputes(user.id),
    listAgencyTenantOptions(user.id),
  ]);

  return <DisputesView disputes={disputes} tenants={tenants} />;
}
