import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";

import {
  AdminSettingsClient,
  type PlatformSettingsInitial,
} from "./admin-settings-client";

export const metadata: Metadata = {
  title: "Paramètres de la plateforme — Admin",
};

export const dynamic = "force-dynamic";

// Valeurs de repli si une ligne `platform_settings` est manquante.
const DEFAULTS: PlatformSettingsInitial = {
  general: {
    platformName: "KAZA",
    contactEmail: "immobilierkaza@gmail.com",
    languages: { fr: true, en: false, fon: false },
    currency: "XOF",
  },
  payments: { commission: 5, minPayment: 5000, escrowDays: 7 },
  moderation: { autoApprove: false, reportThreshold: 5 },
  maintenance: {
    maintenanceMode: false,
    maintenanceMessage:
      "Plateforme en cours de maintenance. Nous serons de retour très bientôt.",
  },
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("platform_settings")
    .select("key, value");

  const byKey = new Map<string, Record<string, unknown>>();
  for (const row of data ?? []) {
    byKey.set(row.key, asRecord(row.value));
  }

  const general = byKey.get("general") ?? {};
  const payments = byKey.get("payments") ?? {};
  const moderation = byKey.get("moderation") ?? {};
  const maintenance = byKey.get("maintenance") ?? {};

  const langs = asRecord(general.languages);

  const initial: PlatformSettingsInitial = {
    general: {
      platformName:
        typeof general.platformName === "string"
          ? general.platformName
          : DEFAULTS.general.platformName,
      contactEmail:
        typeof general.contactEmail === "string"
          ? general.contactEmail
          : DEFAULTS.general.contactEmail,
      languages: {
        fr: typeof langs.fr === "boolean" ? langs.fr : DEFAULTS.general.languages.fr,
        en: typeof langs.en === "boolean" ? langs.en : DEFAULTS.general.languages.en,
        fon:
          typeof langs.fon === "boolean"
            ? langs.fon
            : DEFAULTS.general.languages.fon,
      },
      currency:
        typeof general.currency === "string"
          ? general.currency
          : DEFAULTS.general.currency,
    },
    payments: {
      commission:
        typeof payments.commission === "number"
          ? payments.commission
          : DEFAULTS.payments.commission,
      minPayment:
        typeof payments.minPayment === "number"
          ? payments.minPayment
          : DEFAULTS.payments.minPayment,
      escrowDays:
        typeof payments.escrowDays === "number"
          ? payments.escrowDays
          : DEFAULTS.payments.escrowDays,
    },
    moderation: {
      autoApprove:
        typeof moderation.autoApprove === "boolean"
          ? moderation.autoApprove
          : DEFAULTS.moderation.autoApprove,
      reportThreshold:
        typeof moderation.reportThreshold === "number"
          ? moderation.reportThreshold
          : DEFAULTS.moderation.reportThreshold,
    },
    maintenance: {
      maintenanceMode:
        typeof maintenance.maintenanceMode === "boolean"
          ? maintenance.maintenanceMode
          : DEFAULTS.maintenance.maintenanceMode,
      maintenanceMessage:
        typeof maintenance.maintenanceMessage === "string"
          ? maintenance.maintenanceMessage
          : DEFAULTS.maintenance.maintenanceMessage,
    },
  };

  return <AdminSettingsClient initial={initial} />;
}
