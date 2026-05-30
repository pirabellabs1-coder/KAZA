import type { Metadata } from "next";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";

import { SettingsHeader } from "../settings-form";
import { PrivacyClient } from "./privacy-client";

export const metadata: Metadata = {
  title: "Confidentialité & données — Paramètres",
};

export default async function PrivacySettingsPage() {
  const user = await getCurrentDisplayUser();
  let initialPrefs: Record<string, unknown> = {};
  let deletionRequested = false;

  if (user) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("users")
      .select("privacy_prefs, deletion_requested_at")
      .eq("id", user.id)
      .maybeSingle();
    if (data?.privacy_prefs && typeof data.privacy_prefs === "object") {
      initialPrefs = data.privacy_prefs as Record<string, unknown>;
    }
    deletionRequested = Boolean(data?.deletion_requested_at);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SettingsHeader
        title="Confidentialité & données"
        description="Téléchargez vos données, gérez la publicité, les cookies et demandez la suppression de votre compte."
      />
      <PrivacyClient
        initialPrefs={initialPrefs}
        deletionRequested={deletionRequested}
      />
    </div>
  );
}
