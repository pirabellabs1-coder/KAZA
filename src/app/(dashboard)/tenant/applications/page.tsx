import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { listTenantApplications } from "@/lib/queries/applications";

import { ApplicationsView } from "./applications-view";

export const metadata: Metadata = {
  title: "Mes candidatures — KAZA",
  description: "Suivez l'état de vos candidatures de location.",
};

export const dynamic = "force-dynamic";

export default async function TenantApplicationsPage() {
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login?redirect=/tenant/applications");

  const applications = await listTenantApplications(user.id);
  return <ApplicationsView applications={applications} />;
}
