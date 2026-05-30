"use server";

// =============================================================================
// KAZA — Paramètres agence (Server Action)
//
// Persistance réelle des onglets « Page publique » et « Notifications » de
// /agency/settings (migration 00035_agency_settings.sql) dans la colonne
// JSONB `users.agency_settings`.
//
// Réservé au rôle AGENCY. L'autorisation au niveau ligne est assurée par la
// policy RLS existante `users_update_own` (un utilisateur ne modifie que sa
// propre ligne).
//
// Convention de retour : `{ success: boolean; error?: string }`.
// =============================================================================

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/supabase";

export interface AgencySettingsResult {
  success: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Schéma de validation
// ---------------------------------------------------------------------------

const channelSchema = z.object({
  email: z.boolean(),
  sms: z.boolean(),
  push: z.boolean(),
});

const urlOrEmpty = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === "" || /^https?:\/\//i.test(v), {
    message: "L'URL doit commencer par http(s):// ou être vide.",
  });

const publicSchema = z.object({
  slug: z
    .string()
    .trim()
    .max(60)
    .regex(/^[a-z0-9-]*$/i, "Lettres, chiffres et tirets uniquement."),
  accentColor: z.enum(["navy", "blue", "green", "amber", "rose", "purple"]),
  about: z.string().trim().max(2000),
  youtube: urlOrEmpty,
  social: z.object({
    facebook: urlOrEmpty,
    instagram: urlOrEmpty,
    linkedin: urlOrEmpty,
    twitter: urlOrEmpty,
  }),
  showTeam: z.boolean(),
  enableReviews: z.boolean(),
});

const notificationsSchema = z.object({
  events: z.record(z.string(), channelSchema),
  quietHours: z.object({
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/),
    days: z.array(z.number().int().min(0).max(6)),
  }),
  digest: z.enum(["daily", "weekly", "disabled"]),
});

const emailOrEmpty = z
  .string()
  .trim()
  .max(255)
  .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
    message: "Adresse email invalide.",
  });

const profileSchema = z.object({
  commercialName: z.string().trim().max(120),
  legalName: z.string().trim().max(160),
  oapi: z.string().trim().max(60),
  city: z.string().trim().max(80),
  address: z.string().trim().max(255),
  email: emailOrEmpty,
  phone: z.string().trim().max(40),
  website: urlOrEmpty,
  description: z.string().trim().max(2000),
  logoUrl: z.string().trim().max(1024),
});

const agencySettingsSchema = z.object({
  profile: profileSchema,
  public: publicSchema,
  notifications: notificationsSchema,
});

export type AgencySettings = z.infer<typeof agencySettingsSchema>;

// ---------------------------------------------------------------------------
// Action
// ---------------------------------------------------------------------------

/**
 * Met à jour les paramètres agence (page publique + notifications) de
 * l'utilisateur AGENCY courant dans `users.agency_settings`.
 */
export async function updateAgencySettings(
  settings: AgencySettings,
): Promise<AgencySettingsResult> {
  const parsed = agencySettingsSchema.safeParse(settings);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Paramètres invalides.",
    };
  }

  const user = await getCurrentDisplayUser();
  if (!user) {
    return { success: false, error: "Vous devez être connecté." };
  }
  if (user.role !== "AGENCY") {
    return { success: false, error: "Action réservée aux agences." };
  }

  const supabase = await createClient();

  // Le logo agence (s'il est défini) devient aussi la photo de profil
  // (`profile_photo_url`) afin d'être visible partout : sidebar, page
  // publique, messagerie, etc.
  const logoUrl = parsed.data.profile.logoUrl.trim();

  const updatePayload: Record<string, unknown> = {
    agency_settings: parsed.data as unknown as Json,
    updated_at: new Date().toISOString(),
  };
  if (logoUrl) {
    updatePayload.profile_photo_url = logoUrl;
  }

  const { error } = await supabase
    .from("users")
    .update(updatePayload)
    .eq("id", user.id);

  if (error) {
    return {
      success: false,
      error: "Impossible d'enregistrer les paramètres. " + error.message,
    };
  }

  revalidatePath("/agency/settings");
  revalidatePath("/dashboard");
  return { success: true };
}

// ---------------------------------------------------------------------------
// uploadAgencyLogo — upload réel du logo agence dans Supabase Storage
// ---------------------------------------------------------------------------

const ALLOWED_LOGO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
];
const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 Mo

function logoExtFromType(type: string): string {
  switch (type) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/svg+xml":
      return "svg";
    default:
      return "jpg";
  }
}

export interface UploadAgencyLogoResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload du logo de l'agence vers le bucket public `avatars` (lecture
 * publique, déjà provisionné par la migration 00014). On passe par le client
 * admin (service role) pour un chemin d'upload stable, indépendant des
 * policies RLS sur `storage.objects` — même approche que
 * `uploadPropertyPhotoViaServer`.
 *
 * Path : `agency-logos/{userId}/logo.{ext}` (upsert pour écraser l'ancien).
 * Retourne l'URL publique ; la persistance dans `agency_settings.profile.logoUrl`
 * et `profile_photo_url` se fait via `updateAgencySettings` côté formulaire.
 */
export async function uploadAgencyLogo(
  formData: FormData,
): Promise<UploadAgencyLogoResult> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, error: "Aucun fichier reçu." };
  }

  const user = await getCurrentDisplayUser();
  if (!user) {
    return { success: false, error: "Vous devez être connecté." };
  }
  if (user.role !== "AGENCY") {
    return { success: false, error: "Action réservée aux agences." };
  }

  const type = file.type || "image/jpeg";
  if (!ALLOWED_LOGO_TYPES.includes(type)) {
    return {
      success: false,
      error: "Format non supporté (JPEG, PNG, WEBP ou SVG).",
    };
  }
  if (file.size > MAX_LOGO_BYTES) {
    return { success: false, error: "Fichier trop volumineux (max 2 Mo)." };
  }

  const ext = logoExtFromType(type);
  const path = `agency-logos/${user.id}/logo.${ext}`;

  const admin = createAdminClient();
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error } = await admin.storage
    .from("avatars")
    .upload(path, bytes, {
      contentType: type,
      upsert: true,
      cacheControl: "3600",
    });

  if (error) {
    console.error("[agency-logo] upload serveur:", error.message);
    return { success: false, error: error.message };
  }

  const { data: pub } = admin.storage.from("avatars").getPublicUrl(path);
  // Cache-buster : le path est stable entre deux uploads (upsert).
  const url = `${pub.publicUrl}?t=${Date.now()}`;

  return { success: true, url };
}
