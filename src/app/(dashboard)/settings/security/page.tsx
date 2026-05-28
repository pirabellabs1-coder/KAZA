import type { Metadata } from "next";

import { SettingsHeader } from "../settings-form";
import { SecurityClient } from "./security-client";

export const metadata: Metadata = {
  title: "Sécurité — Paramètres",
};

export default function SecurityPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SettingsHeader
        title="Sécurité"
        description="Protégez votre compte avec un mot de passe fort, la double authentification et le suivi des sessions."
      />
      <SecurityClient />
    </div>
  );
}
