import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";

// =============================================================================
// Espace Rédaction — réservé aux administrateurs et contributeurs.
// =============================================================================

export default async function RedactionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login?redirect=/redaction");

  let authorized = user.role === "ADMIN";
  if (!authorized) {
    const admin = createAdminClient() as unknown as SupabaseClient;
    const { data } = await admin
      .from("users")
      .select("is_contributor")
      .eq("id", user.id)
      .maybeSingle();
    authorized =
      (data as { is_contributor?: boolean } | null)?.is_contributor === true;
  }
  if (!authorized) redirect("/");

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">{children}</div>
    </div>
  );
}
