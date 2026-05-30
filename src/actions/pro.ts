"use server";

import "server-only";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/notifications/resend";

// =============================================================================
// KAZA - Server Action : demande de démo Espace Pro (agences)
//
// Persiste la demande dans la table générique `contact_messages` (réutilisée
// pour tout canal de contact) puis :
//  - notifie l'équipe interne (NOTIFICATIONS_CONTACT_EMAIL)
//  - envoie un accusé de réception au candidat (best-effort)
//
// Modèle calqué sur src/actions/contact.ts.
// =============================================================================

const ProDemoSchema = z.object({
  agencyName: z.string().min(2).max(150),
  contactName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().max(40).optional(),
  size: z.string().max(40).optional(),
  message: z.string().max(3000).optional(),
});

export type ProDemoInput = z.infer<typeof ProDemoSchema>;

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildAdminHtml(args: {
  agencyName: string;
  contactName: string;
  email: string;
  phone?: string | null;
  size?: string | null;
  message: string;
}): string {
  const messageHtml = escapeHtml(args.message).replace(/\n/g, "<br />");
  const phoneRow = args.phone
    ? `<tr><td style="padding:8px 0;color:#6b7280;">Téléphone :</td><td style="padding:8px 0;">${escapeHtml(
        args.phone,
      )}</td></tr>`
    : "";
  const sizeRow = args.size
    ? `<tr><td style="padding:8px 0;color:#6b7280;">Taille agence :</td><td style="padding:8px 0;">${escapeHtml(
        args.size,
      )}</td></tr>`
    : "";
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #1A3A52;">
      <div style="background: #1A3A52; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">Nouvelle demande de démo Pro</h1>
      </div>
      <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 8px 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #6b7280; width: 120px;">Agence :</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(args.agencyName)}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Contact :</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(args.contactName)}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Email :</td><td style="padding: 8px 0;"><a href="mailto:${escapeHtml(args.email)}" style="color: #1976D2;">${escapeHtml(args.email)}</a></td></tr>
          ${phoneRow}
          ${sizeRow}
        </table>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
        <div style="color: #374151; line-height: 1.6;">${messageHtml || "<em>Aucun message.</em>"}</div>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
        <p style="font-size: 12px; color: #9ca3af; margin: 0;">
          Reçu via le formulaire de démo Espace Pro KAZA.
          Répondez directement à cet email pour contacter ${escapeHtml(args.contactName)}.
        </p>
      </div>
    </div>
  `;
}

function buildConfirmationHtml(name: string, agencyName: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1A3A52;">
      <div style="background:#1A3A52;color:white;padding:24px;border-radius:8px 8px 0 0;">
        <h1 style="margin:0;font-size:20px;">Votre demande de démo a bien été reçue</h1>
      </div>
      <div style="background:white;padding:24px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 8px 8px;">
        <p>Bonjour ${escapeHtml(name)},</p>
        <p>Merci de votre intérêt pour l'Espace Pro KAZA. Notre équipe Pro revient vers vous sous <strong>24h ouvrées</strong> pour planifier votre démonstration.</p>
        <p style="margin-top:16px;"><strong>Agence&nbsp;:</strong> ${escapeHtml(agencyName)}</p>
        <hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0;" />
        <p style="font-size:12px;color:#9ca3af;">L'équipe KAZA — Cotonou, Bénin.</p>
      </div>
    </div>
  `;
}

/**
 * Enregistre une demande de démo Espace Pro et déclenche les emails.
 * Réutilise la table `contact_messages` (sujet préfixé pour le tri admin).
 */
export async function submitProDemoRequest(
  input: ProDemoInput,
): Promise<{ success: boolean; error?: string }> {
  const parsed = ProDemoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides",
    };
  }

  const data = parsed.data;
  const subject = `Demande démo Pro — ${data.agencyName}`;

  // Message concaténé : taille agence + message libre.
  const messageParts: string[] = [];
  if (data.size) messageParts.push(`Taille de l'agence : ${data.size}`);
  messageParts.push(data.message?.trim() || "(Aucun message fourni.)");
  const fullMessage = messageParts.join("\n\n");

  // 1. Persistance DB ---------------------------------------------------------
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Types Supabase générés ne contiennent pas encore `contact_messages` →
  // cast explicite (sécurité assurée par la policy RLS public INSERT).
  const { error } = await (supabase as unknown as {
    from: (t: string) => {
      insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    };
  })
    .from("contact_messages")
    .insert({
      sender_id: user?.id ?? null,
      full_name: data.contactName,
      email: data.email,
      phone: data.phone ?? null,
      subject,
      message: fullMessage,
      status: "NEW",
    });

  if (error) {
    console.error("[pro-demo] persist failed:", error.message);
    return {
      success: false,
      error:
        "Impossible d'enregistrer votre demande pour le moment. Réessayez dans quelques instants.",
    };
  }

  // 2 & 3 — Emails best-effort ------------------------------------------------
  const recipient =
    process.env.NOTIFICATIONS_CONTACT_EMAIL ?? "immobilierkaza@gmail.com";
  try {
    await sendEmail(
      recipient,
      `[KAZA Pro] ${subject}`,
      buildAdminHtml({
        agencyName: data.agencyName,
        contactName: data.contactName,
        email: data.email,
        phone: data.phone ?? null,
        size: data.size ?? null,
        message: data.message ?? "",
      }),
    );
    await sendEmail(
      data.email,
      "Votre demande de démo Pro KAZA a bien été reçue",
      buildConfirmationHtml(data.contactName, data.agencyName),
    );
  } catch (err) {
    console.error("[pro-demo] email failed:", err);
  }

  return { success: true };
}
