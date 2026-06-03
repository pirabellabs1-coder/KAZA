import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { getAdminStats, type AdminStats } from "@/lib/queries/admin";
import { createClient } from "@/lib/supabase/server";
import { settleAll } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Repli stats (degradation gracieuse) si la requete echoue : la coquille admin
// reste affichee avec des badges a zero plutot qu'une erreur 500 globale.
const EMPTY_STATS: AdminStats = {
  totalUsers: 0,
  usersByRole: { TENANT: 0, OWNER: 0, STUDENT: 0, ADMIN: 0 },
  totalProperties: 0,
  propertiesByStatus: {
    DRAFT: 0,
    PENDING_REVIEW: 0,
    AVAILABLE: 0,
    RENTED: 0,
    UNAVAILABLE: 0,
    ARCHIVED: 0,
  },
  activeRentals: 0,
  totalRevenue30d: 0,
  totalVisits30d: 0,
  pendingVerifications: 0,
};

 

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
  // Degradation gracieuse : si une requete echoue on retombe sur des valeurs
  // par defaut au lieu de faire planter toute la coquille admin (erreur 500).
  const supabase = await createClient();

  async function fetchUnreadCount(): Promise<number> {
    try {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .is("read_at", null);
      return count ?? 0;
    } catch {
      return 0;
    }
  }

  const [stats, notificationCount] = await settleAll(
    [getAdminStats(), fetchUnreadCount()] as const,
    [EMPTY_STATS, 0] as const,
  );

  const badges = {
    kyc: stats.pendingVerifications,
    properties: stats.propertiesByStatus.PENDING_REVIEW,
    // Pas encore de table `disputes` — badge masqué tant que le système
    // de litiges n'est pas en place.
    disputes: 0,
  };

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
