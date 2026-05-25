"use server";

import "server-only";
import { z } from "zod";

import { sendEmail } from "@/lib/notifications/resend";

const ContactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  subject: z.enum(["general", "support", "partnership", "press", "other"]),
  message: z.string().min(20).max(2000),
  consent: z.literal(true),
});

const SUBJECT_LABELS: Record<z.infer<typeof ContactSchema>["subject"], string> = {
  general: "Question générale",
  support: "Support technique",
  partnership: "Partenariat",
  press: "Presse",
  other: "Autre",
};

export type ContactResult = {
  success: boolean;
  message?: string;
  error?: string;
};

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildContactEmail(input: z.infer<typeof ContactSchema>): string {
  const messageHtml = escapeHtml(input.message).replace(/\n/g, "<br />");
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #1A3A52;">
      <div style="background: #1A3A52; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">Nouveau message de contact</h1>
      </div>
      <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 8px 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #6b7280; width: 100px;">De :</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(input.name)}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Email :</td><td style="padding: 8px 0;"><a href="mailto:${escapeHtml(input.email)}" style="color: #1976D2;">${escapeHtml(input.email)}</a></td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Sujet :</td><td style="padding: 8px 0;">${SUBJECT_LABELS[input.subject]}</td></tr>
        </table>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
        <div style="color: #374151; line-height: 1.6;">${messageHtml}</div>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
        <p style="font-size: 12px; color: #9ca3af; margin: 0;">
          Reçu via le formulaire de contact de kaza.africa.
          Répondez directement à cet email pour contacter ${escapeHtml(input.name)}.
        </p>
      </div>
    </div>
  `;
}

export async function sendContactMessage(formData: unknown): Promise<ContactResult> {
  const parsed = ContactSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: "Formulaire invalide." };
  }

  const data = parsed.data;
  const recipient = process.env.NOTIFICATIONS_CONTACT_EMAIL ?? "contact@kaza.africa";

  const result = await sendEmail(
    recipient,
    `[Contact KAZA] ${SUBJECT_LABELS[data.subject]} — ${data.name}`,
    buildContactEmail(data),
  );

  if (!result.success) {
    // On considère l'opération réussie côté UX (le message est sauvegardable),
    // mais on remonte l'erreur dans les logs serveur.
    console.error("[contact] envoi email échoué :", result.error);
    return {
      success: true,
      message:
        "Message reçu. Notre équipe vous répond sous 24h. (Note : un problème technique d'envoi a été enregistré.)",
    };
  }

  return {
    success: true,
    message: "Message reçu. Notre équipe vous répond sous 24h.",
  };
}
