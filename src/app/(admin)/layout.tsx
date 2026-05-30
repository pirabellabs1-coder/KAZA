import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { getAdminStats } from "@/lib/queries/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

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

  // Comptes réels pour les badges sidebar + cloche notifications.
  const supabase = await createClient();
  const [stats, notifRes] = await Promise.all([
    getAdminStats(),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null),
  ]);

  const badges = {
    kyc: stats.pendingVerifications,
    properties: stats.propertiesByStatus.PENDING_REVIEW,
    // Pas encore de table `disputes` — badge masqué tant que le système
    // de litiges n'est pas en place.
    disputes: 0,
  };
  const notificationCount = notifRes?.count ?? 0;

  return (
    <AdminShell
      user={adminDisplay}
      badges={badges}
      notificationCount={notificationCount}
    >
      {children}
    </AdminShell>
  );
}
