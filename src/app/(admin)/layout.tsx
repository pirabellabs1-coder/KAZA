import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";

/**
 * Admin space layout — garde de route.
 *
 * Le middleware bloque déjà /admin/* aux non-admins (RBAC via cookie démo
 * OU Supabase). Ce layout est une double-garde côté serveur et fournit
 * l'identité admin à afficher dans la sidebar / header.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentDisplayUser();

  if (!user) {
    redirect("/login?redirect=/admin");
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard?erreur=Accès+admin+réservé");
  }

  const adminDisplay = {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  };

  return <AdminShell user={adminDisplay}>{children}</AdminShell>;
}
