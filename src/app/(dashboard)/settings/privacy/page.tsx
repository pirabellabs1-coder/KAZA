import type { Metadata } from "next";

import { SettingsHeader } from "../settings-form";
import { PrivacyClient } from "./privacy-client";

export const metadata: Metadata = {
  title: "Confidentialité & données — Paramètres",
};

export default function PrivacySettingsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SettingsHeader
        title="Confidentialité & données"
        description="Téléchargez vos données, gérez la publicité, les cookies et demandez la suppression de votre compte."
      />
      <PrivacyClient />
    </div>
  );
}
