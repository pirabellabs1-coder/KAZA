import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { listOwnerApplications } from "@/lib/queries/applications";

import { OwnerApplicationsView } from "./applications-view";

export const metadata: Metadata = {
  title: "Candidatures reçues — KAZA",
  description: "Acceptez ou refusez les candidatures de location sur vos biens.",
};

export const dynamic = "force-dynamic";

const ALLOWED = new Set(["OWNER", "AGENCY", "ADMIN"]);

export default async function OwnerApplicationsPage() {
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login?redirect=/owner/applications");
  if (!ALLOWED.has(user.role)) redirect("/dashboard");

  const applications = await listOwnerApplications(user.id);
  return <OwnerApplicationsView applications={applications} />;
}
