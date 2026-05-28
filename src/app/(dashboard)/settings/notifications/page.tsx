import type { Metadata } from "next";

import { SettingsHeader } from "../settings-form";
import { NotificationsClient } from "./notifications-client";

export const metadata: Metadata = {
  title: "Notifications — Paramètres",
};

export default function NotificationsSettingsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SettingsHeader
        title="Notifications"
        description="Choisissez quelles notifications vous recevez et par quel canal."
      />
      <NotificationsClient />
    </div>
  );
}
