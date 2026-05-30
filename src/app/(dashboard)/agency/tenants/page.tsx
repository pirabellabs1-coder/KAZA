import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { listOwnerTenants } from "@/lib/queries/owner-activity";

import { OwnerTenantsView } from "../../owner/tenants/tenants-view";

export const metadata: Metadata = {
  title: "Locataires — KAZA Pro",
  description:
    "Suivez les locataires de votre agence : biens loués, statut des baux et historique.",
};

const ALLOWED = new Set(["AGENCY", "ADMIN"]);

export default async function AgencyTenantsPage() {
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login");
  if (!ALLOWED.has(user.role)) redirect("/dashboard");

  // owner_id des biens gérés = id du compte agence : on réutilise la requête
  // propriétaire, paramétrée par l'id utilisateur courant.
  const tenants = await listOwnerTenants(user.id);
  return <OwnerTenantsView tenants={tenants} />;
}
