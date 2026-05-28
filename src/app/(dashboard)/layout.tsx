import { redirect } from "next/navigation";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";

import { DashboardShell } from "./dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentDisplayUser();

  // Le middleware redirige déjà vers /login, mais double-garde côté layout
  // pour les cas où le middleware ne s'applique pas (route matcher).
  if (!user) {
    redirect("/login?redirect=/dashboard");
  }

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
