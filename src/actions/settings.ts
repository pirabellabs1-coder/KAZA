"use server";

// =============================================================================
// KAZA - Paramètres (Server Actions)
//
// Persistance réelle des écrans de paramètres (migration 00026_settings.sql) :
//   - updateNotificationPrefs  → users.notification_prefs (JSONB)
//   - updatePrivacyPrefs       → users.privacy_prefs (JSONB)
//   - requestAccountDeletion   → users.deletion_requested_at
//   - changePassword           → supabase.auth.updateUser({ password })
//   - updatePlatformSettings   → platform_settings (admin uniquement, upsert)
//
// Convention de retour : `{ success: boolean; error?: string }`.
// L'autorisation au niveau ligne est déjà assurée par les policies RLS
// (`users_update_own`, `platform_settings_admin_write`).
// =============================================================================

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/supabase";

// ---------------------------------------------------------------------------
// Type de retour
// ---------------------------------------------------------------------------

export interface SettingsResult {
  success: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// 1. Préférences de notification
// ---------------------------------------------------------------------------

const channelSchema = z.object({
  email: z.boolean(),
  push: z.boolean(),
  sms: z.boolean(),
});

const notificationPrefsSchema = z.record(z.string(), channelSchema);

export type NotificationPrefs = z.infer<typeof notificationPrefsSchema>;

/**
 * Met à jour les préférences de notification (catégorie → canaux) de
 * l'utilisateur courant dans `users.notification_prefs`.
 */
export async function updateNotificationPrefs(
  prefs: NotificationPrefs,
): Promise<SettingsResult> {
  const parsed = notificationPrefsSchema.safeParse(prefs);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Préférences invalides.",
    };
  }

  const user = await getCurrentDisplayUser();
  if (!user) {
    return { success: false, error: "Vous devez être connecté." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({
      notification_prefs: parsed.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return {
      success: false,
      error: "Impossible d'enregistrer les préférences. " + error.message,
    };
  }

  revalidatePath("/settings/notifications");
  return { success: true };
}

// ---------------------------------------------------------------------------
// 2. Préférences de confidentialité
// ---------------------------------------------------------------------------

const privacyPrefsSchema = z.object({
  profileVisibility: z.enum(["public", "tenants", "private"]),
  personalizedAds: z.boolean(),
  shareAnonymizedData: z.boolean(),
  showActivity: z.boolean(),
});

export type PrivacyPrefs = z.infer<typeof privacyPrefsSchema>;

/**
 * Met à jour les préférences de confidentialité / RGPD de l'utilisateur
 * courant dans `users.privacy_prefs`.
 */
export async function updatePrivacyPrefs(
  prefs: PrivacyPrefs,
): Promise<SettingsResult> {
  const parsed = privacyPrefsSchema.safeParse(prefs);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Préférences invalides.",
    };
  }

  const user = await getCurrentDisplayUser();
  if (!user) {
    return { success: false, error: "Vous devez être connecté." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({
      privacy_prefs: parsed.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return {
      success: false,
      error: "Impossible d'enregistrer les préférences. " + error.message,
    };
  }

  revalidatePath("/settings/privacy");
  return { success: true };
}

// ---------------------------------------------------------------------------
// 2b. Adresse de facturation
// ---------------------------------------------------------------------------

const billingAddressSchema = z.object({
  name: z.string().trim().max(200),
  line1: z.string().trim().max(300),
  city: z.string().trim().max(120),
  country: z.string().trim().max(120),
});

export type BillingAddress = z.infer<typeof billingAddressSchema>;

/**
 * Met à jour l'adresse de facturation de l'utilisateur courant dans
 * `users.billing_address` (migration 00032). Remplace l'ancien comportement
 * « toast sans persistance ».
 */
export async function updateBillingAddress(
  address: BillingAddress,
): Promise<SettingsResult> {
  const parsed = billingAddressSchema.safeParse(address);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Adresse invalide.",
    };
  }

  const user = await getCurrentDisplayUser();
  if (!user) {
    return { success: false, error: "Vous devez être connecté." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({
      billing_address: parsed.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return {
      success: false,
      error: "Impossible d'enregistrer l'adresse. " + error.message,
    };
  }

  revalidatePath("/settings/billing");
  return { success: true };
}

// ---------------------------------------------------------------------------
// 3. Demande de suppression de compte (RGPD)
// ---------------------------------------------------------------------------

/**
 * Enregistre la demande RGPD de suppression de compte de l'utilisateur
 * courant en posant `users.deletion_requested_at = NOW()`. La suppression
 * effective est traitée par un processus asynchrone côté plateforme.
 */
export async function requestAccountDeletion(): Promise<SettingsResult> {
  const user = await getCurrentDisplayUser();
  if (!user) {
    return { success: false, error: "Vous devez être connecté." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({
      deletion_requested_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return {
      success: false,
      error: "Impossible d'enregistrer la demande. " + error.message,
    };
  }

  // Trace la demande dans la file RGPD/APDP pour le suivi côté admin
  // (best-effort : ne bloque pas la suppression si l'insertion échoue).
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("gdpr_requests").insert({
      user_id: user.id,
      type: "DELETION",
      details: "Demande de suppression de compte (paramètres confidentialité).",
      status: "PENDING",
    });
  } catch {
    // silencieux : la demande de suppression principale est déjà enregistrée
  }

  revalidatePath("/settings/privacy");
  revalidatePath("/admin/documents");
  return { success: true };
}

// ---------------------------------------------------------------------------
// 4. Changement de mot de passe
// ---------------------------------------------------------------------------

const passwordSchema = z
  .string()
  .min(8, "Minimum 8 caractères.")
  .regex(/[A-Z]/, "Au moins une majuscule.")
  .regex(/[0-9]/, "Au moins un chiffre.");

/**
 * Change le mot de passe de l'utilisateur courant via Supabase Auth.
 */
export async function changePassword(
  newPassword: string,
): Promise<SettingsResult> {
  const parsed = passwordSchema.safeParse(newPassword);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Mot de passe invalide.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Vous devez être connecté." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data });

  if (error) {
    return {
      success: false,
      error: "Impossible de changer le mot de passe. " + error.message,
    };
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// 5. Paramètres globaux de la plateforme (admin uniquement)
// ---------------------------------------------------------------------------

const PLATFORM_KEYS = [
  "general",
  "payments",
  "notifications",
  "moderation",
  "maintenance",
] as const;

const platformKeySchema = z.enum(PLATFORM_KEYS);
const platformValueSchema = z.record(z.string(), z.unknown());

/**
 * Met à jour (upsert) un groupe de paramètres globaux de la plateforme.
 * Réservé aux administrateurs : on vérifie le rôle applicatif puis on
 * écrit via le client admin (service role) qui contourne la RLS.
 */
export async function updatePlatformSettings(
  key: string,
  value: Record<string, unknown>,
): Promise<SettingsResult> {
  const parsedKey = platformKeySchema.safeParse(key);
  if (!parsedKey.success) {
    return { success: false, error: "Groupe de paramètres inconnu." };
  }

  const parsedValue = platformValueSchema.safeParse(value);
  if (!parsedValue.success) {
    return { success: false, error: "Valeurs invalides." };
  }

  const user = await getCurrentDisplayUser();
  if (!user) {
    return { success: false, error: "Vous devez être connecté." };
  }
  if (user.role !== "ADMIN") {
    return { success: false, error: "Action réservée aux administrateurs." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("platform_settings")
    .upsert(
      {
        key: parsedKey.data,
        value: parsedValue.data as Json,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );

  if (error) {
    return {
      success: false,
      error: "Impossible d'enregistrer les paramètres. " + error.message,
    };
  }

  revalidatePath("/admin/settings");
  return { success: true };
}
