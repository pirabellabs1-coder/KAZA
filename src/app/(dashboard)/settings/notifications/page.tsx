import type { Metadata } from "next";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";

import { SettingsHeader } from "../settings-form";
import { NotificationsClient } from "./notifications-client";

export const metadata: Metadata = {
  title: "Notifications — Paramètres",
};

export default async function NotificationsSettingsPage() {
  const user = await getCurrentDisplayUser();
  let initialPrefs: Record<string, unknown> = {};

  if (user) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("users")
      .select("notification_prefs")
      .eq("id", user.id)
      .maybeSingle();
    if (data?.notification_prefs && typeof data.notification_prefs === "object") {
      initialPrefs = data.notification_prefs as Record<string, unknown>;
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SettingsHeader
        title="Notifications"
        description="Choisissez quelles notifications vous recevez et par quel canal."
      />
      <NotificationsClient initialPrefs={initialPrefs} />
    </div>
  );
}
