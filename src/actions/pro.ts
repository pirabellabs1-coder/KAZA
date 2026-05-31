"use server";

import "server-only";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/notifications/resend";
import { buildEmail } from "@/lib/notifications/email-template";

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

function buildAdminHtml(args: {
  agencyName: string;
  contactName: string;
  email: string;
  phone?: string | null;
  size?: string | null;
  message: string;
}): string {
  const msgParas = (args.message ?? "")
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  return buildEmail({
    preheader: `Demande de démo Pro — ${args.agencyName}`,
    heading: "Nouvelle demande de démo Pro",
    paragraphs: msgParas.length ? msgParas : ["Aucun message."],
    rows: [
      { label: "Agence", value: args.agencyName },
      { label: "Contact", value: args.contactName },
      { label: "Email", value: args.email },
      ...(args.phone ? [{ label: "Téléphone", value: args.phone }] : []),
      ...(args.size ? [{ label: "Taille agence", value: args.size }] : []),
    ],
    outro: `Répondez directement à ${args.email} pour contacter ${args.contactName}.`,
  });
}

function buildConfirmationHtml(name: string, agencyName: string): string {
  return buildEmail({
    preheader: "Votre demande de démo Pro a bien été reçue.",
    heading: "Votre demande de démo a bien été reçue",
    intro: `Bonjour ${name},`,
    paragraphs: [
      "Merci de votre intérêt pour l'Espace Pro KAZA. Notre équipe Pro revient vers vous sous 24h ouvrées pour planifier votre démonstration.",
    ],
    rows: [{ label: "Agence", value: agencyName }],
    outro: "L'équipe KAZA",
  });
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
