"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import type { SegmentKey } from "@/lib/queries/campaigns";

// =============================================================================
// Kaabo — Envoi de campagnes (admin)
// Canal "IN_APP" pleinement fonctionnel : insère une notification réelle pour
// chaque utilisateur du segment ciblé. Email/Push : enregistrés mais marqués
// comme à configurer (Resend/FCM bulk) — pas de faux "envoyé".
// =============================================================================

const SEGMENT_ENUM = z.enum([
  "ALL",
  "TENANTS",
  "OWNERS",
  "STUDENTS",
  "AGENCIES",
  "RECENT_7D",
]);

const schema = z.object({
  name: z.string().min(2, "Nom trop court").max(120),
  channel: z.enum(["IN_APP", "EMAIL", "PUSH", "SMS"]),
  // Multi-audience : on peut cibler plusieurs segments à la fois
  // (ex. Locataires + Étudiants). L'union est dédupliquée.
  segments: z.array(SEGMENT_ENUM).min(1, "Sélectionnez au moins une audience"),
  subject: z.string().max(200).optional(),
  content: z.string().min(2, "Contenu requis").max(20000),
});

/** Convertit un contenu HTML (éditeur riche) en texte simple. */
function htmlToPlain(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export type CampaignResult =
  | { success: true; sentCount: number }
  | { success: false; error: string };

function segmentRoleFilter(segment: SegmentKey): { column: string; value: string } | null {
  switch (segment) {
    case "TENANTS":
      return { column: "role", value: "TENANT" };
    case "OWNERS":
      return { column: "role", value: "OWNER" };
    case "STUDENTS":
      return { column: "role", value: "STUDENT" };
    case "AGENCIES":
      return { column: "role", value: "AGENCY" };
    default:
      return null;
  }
}

/** Récupère les user_ids d'un segment (réel). */
async function resolveAudience(
  admin: ReturnType<typeof createAdminClient>,
  segment: SegmentKey,
): Promise<string[]> {
  let q = (admin as any).from("users").select("id");
  const roleFilter = segmentRoleFilter(segment);
  if (roleFilter) q = q.eq(roleFilter.column, roleFilter.value);
  if (segment === "RECENT_7D") {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    q = q.gte("created_at", since);
  }
  const { data, error } = await q;
  if (error) {
    console.error("[campaigns] resolveAudience:", error.message);
    return [];
  }
  return (data ?? []).map((u: any) => u.id as string);
}

/** Union dédupliquée des user_ids de plusieurs segments. */
async function resolveAudienceMulti(
  admin: ReturnType<typeof createAdminClient>,
  segments: SegmentKey[],
): Promise<string[]> {
  // Si "ALL" est présent, tous les utilisateurs suffisent.
  if (segments.includes("ALL")) {
    return resolveAudience(admin, "ALL");
  }
  const set = new Set<string>();
  for (const seg of segments) {
    const ids = await resolveAudience(admin, seg);
    for (const id of ids) set.add(id);
  }
  return Array.from(set);
}

/**
 * Crée et envoie une campagne.
 * - IN_APP : insère une notification pour chaque destinataire (envoi réel).
 * - EMAIL/PUSH/SMS : crée la campagne en statut DRAFT (broadcast bulk à
 *   configurer côté provider) — on ne ment pas sur un "envoyé".
 */
export async function createAndSendCampaign(input: unknown): Promise<CampaignResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const user = await getCurrentDisplayUser();
  if (!user || user.role !== "ADMIN") {
    return { success: false, error: "Accès réservé aux administrateurs." };
  }

  const { name, channel, segments, subject, content } = parsed.data;
  const admin = createAdminClient();

  // Audience réelle (union dédupliquée des segments sélectionnés)
  const audienceIds = await resolveAudienceMulti(admin, segments as SegmentKey[]);
  const audienceSize = audienceIds.length;

  // Crée l'enregistrement campagne (segments joints en texte)
  const { data: campaign, error: campErr } = await (admin as any)
    .from("campaigns")
    .insert({
      name,
      channel,
      segment: segments.join(","),
      subject: subject ?? null,
      content,
      audience_size: audienceSize,
      status: channel === "IN_APP" ? "SENDING" : "DRAFT",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (campErr || !campaign) {
    console.error("[campaigns] insert:", campErr?.message);
    return { success: false, error: "Impossible de créer la campagne." };
  }

  // Canal IN_APP : envoi réel via insertion de notifications
  if (channel === "IN_APP") {
    if (audienceSize === 0) {
      await (admin as any)
        .from("campaigns")
        .update({ status: "SENT", sent_count: 0, sent_at: new Date().toISOString() })
        .eq("id", campaign.id);
      return { success: true, sentCount: 0 };
    }

    // Les notifications in-app s'affichent en texte : on convertit le HTML.
    const plain = htmlToPlain(content);
    const rows = audienceIds.map((uid) => ({
      user_id: uid,
      type: "system",
      title: subject || name,
      body: plain,
      metadata: { campaign_id: campaign.id, channel: "in_app" },
    }));

    // Insertion par batch de 500 pour éviter les payloads trop gros.
    let sent = 0;
    for (let i = 0; i < rows.length; i += 500) {
      const batch = rows.slice(i, i + 500);
      const { error: notifErr } = await (admin as any).from("notifications").insert(batch);
      if (notifErr) {
        console.error("[campaigns] notifications insert:", notifErr.message);
      } else {
        sent += batch.length;
      }
    }

    await (admin as any)
      .from("campaigns")
      .update({
        status: sent > 0 ? "SENT" : "FAILED",
        sent_count: sent,
        sent_at: new Date().toISOString(),
      })
      .eq("id", campaign.id);

    revalidatePath("/admin/notifications");
    return sent > 0
      ? { success: true, sentCount: sent }
      : { success: false, error: "Aucune notification n'a pu être envoyée." };
  }

  // Email / Push / SMS : campagne enregistrée en brouillon (bulk provider à configurer)
  revalidatePath("/admin/notifications");
  return {
    success: false,
    error:
      "Campagne enregistrée en brouillon. L'envoi de masse " +
      (channel === "EMAIL" ? "email" : channel === "PUSH" ? "push" : "SMS") +
      " sera disponible une fois le provider configuré. Utilisez le canal In-App pour un envoi immédiat.",
  };
}

/** Envoi d'un test à l'admin lui-même (notification in-app). */
export async function sendTestCampaign(input: unknown): Promise<CampaignResult> {
  const parsed = schema.pick({ name: true, subject: true, content: true }).safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Données invalides" };
  }
  const user = await getCurrentDisplayUser();
  if (!user || user.role !== "ADMIN") {
    return { success: false, error: "Accès réservé aux administrateurs." };
  }

  // La table `notifications` n'a aucune policy INSERT publique (migration
  // 00004 : insertions réservées au service role). On doit donc passer par le
  // client admin, sinon l'insert est rejeté par la RLS et le test échoue.
  const admin = createAdminClient();
  const { error } = await (admin as any).from("notifications").insert({
    user_id: user.id,
    type: "system",
    title: `[TEST] ${parsed.data.subject || parsed.data.name}`,
    body: htmlToPlain(parsed.data.content),
    metadata: { test: true },
  });

  if (error) {
    console.error("[campaigns] sendTestCampaign:", error.message);
    return { success: false, error: "Échec de l'envoi du test." };
  }
  return { success: true, sentCount: 1 };
}
