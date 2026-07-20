import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { listOwnerTenants } from "@/lib/queries/owner-activity";

import { OwnerTenantsView } from "./tenants-view";

export const metadata: Metadata = {
  title: "Mes Locataires — Kaabo",
  description: "Liste de vos locataires actifs et historique.",
};

const OWNER_ROLES = new Set(["OWNER", "AGENCY", "ADMIN"]);

export default async function OwnerTenantsPage() {
  const user = await getCurrentDisplayUser();
  if (!user) {
    redirect("/login");
  }
  if (!OWNER_ROLES.has(user.role)) {
    redirect("/dashboard");
  }

  const tenants = await listOwnerTenants(user.id);
  return (
    <OwnerTenantsView tenants={tenants} detailHrefBase="/owner/tenants" />
  );
}
