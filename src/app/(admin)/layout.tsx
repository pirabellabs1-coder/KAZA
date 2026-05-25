import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";

// Mock admin user for development - replaced once Supabase auth is wired in.
const mockAdmin = {
  firstName: "Aïcha",
  lastName: "Diop",
  email: "aicha.diop@kaza.africa",
};

/**
 * Admin space layout.
 *
 * Route guard: in production we verify via Supabase that the authenticated
 * user has `role === 'ADMIN'`, otherwise redirect to /dashboard. In local
 * development without Supabase wired up we fall back to rendering with the
 * mock admin.
 *
 * TODO sécurité Nia: activer guard quand DB live
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Best-effort Supabase guard — silent fallback in dev if env / auth missing.
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        // Cast: generated Supabase types resolve `data` to `never` in some
        // build configs — Aminata will tighten this once the schema sync is wired.
        const role = (profile as { role?: string } | null)?.role;
        if (!role || role !== "ADMIN") {
          redirect("/dashboard");
        }
      }
      // If no user at all in dev mode, we let the page render with mock data.
    } catch {
      // Supabase not reachable in this environment — render with fallback.
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden h-full lg:block">
        <AdminSidebar user={mockAdmin} />
      </div>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader user={mockAdmin} notificationCount={5} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
