"use server";

import "server-only";
import { z } from "zod";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { sendEmail } from "@/lib/notifications/resend";

// =============================================================================
// KAZA - Server Action : messages de contact public
//
// Persiste un message de contact dans `contact_messages` (RLS public INSERT)
// puis :
//  - notifie l'équipe interne (NOTIFICATIONS_CONTACT_EMAIL)
//  - envoie un accusé de réception à l'expéditeur (best-effort)
//
// Deux signatures publiques :
//  - sendContactMessage(input) : variante "marketing" (sujet enum) historiquement
//    utilisée par /contact et /about (compatibilité existante).
//  - submitContactMessage(input) : nouvelle variante générique (sujet libre)
//    appelable par n'importe quel formulaire de contact.
// =============================================================================

// ----- Schéma "enum" (compat) -----------------------------------------------

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

// ----- Schéma "libre" --------------------------------------------------------

const SubmitContactSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().max(40).optional(),
  subject: z.string().min(2).max(200),
  message: z.string().min(10).max(3000),
});

export type SubmitContactInput = z.infer<typeof SubmitContactSchema>;

// ----- Helpers ---------------------------------------------------------------

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildAdminHtml(args: {
  name: string;
  email: string;
  phone?: string | null;
  subjectLabel: string;
  message: string;
}): string {
  const messageHtml = escapeHtml(args.message).replace(/\n/g, "<br />");
  const phoneRow = args.phone
    ? `<tr><td style="padding:8px 0;color:#6b7280;">Téléphone :</td><td style="padding:8px 0;">${escapeHtml(
        args.phone,
      )}</td></tr>`
    : "";
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #1A3A52;">
      <div style="background: #1A3A52; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">Nouveau message de contact</h1>
      </div>
      <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 8px 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #6b7280; width: 100px;">De :</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(args.name)}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Email :</td><td style="padding: 8px 0;"><a href="mailto:${escapeHtml(args.email)}" style="color: #1976D2;">${escapeHtml(args.email)}</a></td></tr>
          ${phoneRow}
          <tr><td style="padding: 8px 0; color: #6b7280;">Sujet :</td><td style="padding: 8px 0;">${escapeHtml(args.subjectLabel)}</td></tr>
        </table>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
        <div style="color: #374151; line-height: 1.6;">${messageHtml}</div>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
        <p style="font-size: 12px; color: #9ca3af; margin: 0;">
          Reçu via le formulaire de contact de kaza.africa.
          Répondez directement à cet email pour contacter ${escapeHtml(args.name)}.
        </p>
      </div>
    </div>
  `;
}

function buildConfirmationHtml(name: string, subject: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1A3A52;">
      <div style="background:#1A3A52;color:white;padding:24px;border-radius:8px 8px 0 0;">
        <h1 style="margin:0;font-size:20px;">Votre message a bien été reçu</h1>
      </div>
      <div style="background:white;padding:24px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 8px 8px;">
        <p>Bonjour ${escapeHtml(name)},</p>
        <p>Merci de nous avoir contactés. Notre équipe revient vers vous sous <strong>24 à 48h ouvrées</strong>.</p>
        <p style="margin-top:16px;"><strong>Sujet&nbsp;:</strong> ${escapeHtml(subject)}</p>
        <hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0;" />
        <p style="font-size:12px;color:#9ca3af;">L'équipe KAZA — Cotonou, Bénin.</p>
      </div>
    </div>
  `;
}

async function persistContactMessage(args: {
  fullName: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Types Supabase générés ne contiennent pas encore `contact_messages` →
  // on caste explicitement pour conserver la sécurité ailleurs.
  const { error } = await (supabase as unknown as {
    from: (t: string) => {
      insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    };
  })
    .from("contact_messages")
    .insert({
      sender_id: user?.id ?? null,
      full_name: args.fullName,
      email: args.email,
      phone: args.phone ?? null,
      subject: args.subject,
      message: args.message,
      status: "NEW",
    });

  if (error) {
    console.error("[contact] persist failed:", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

// ----- Public API ------------------------------------------------------------

/**
 * Variante historique (sujet enum + consent) utilisée par les pages marketing.
 * Persiste désormais en base avant d'envoyer les emails.
 */
export async function sendContactMessage(
  formData: unknown,
): Promise<ContactResult> {
  const parsed = ContactSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: "Formulaire invalide." };
  }

  const data = parsed.data;
  const subjectLabel = SUBJECT_LABELS[data.subject];

  // 1. Persistance DB ---------------------------------------------------------
  const persisted = await persistContactMessage({
    fullName: data.name,
    email: data.email,
    phone: null,
    subject: subjectLabel,
    message: data.message,
  });

  if (!persisted.ok) {
    return {
      success: false,
      error:
        "Impossible d'enregistrer votre message pour le moment. Réessayez dans quelques instants.",
    };
  }

  // 2. Email équipe (best-effort) --------------------------------------------
  const recipient =
    process.env.NOTIFICATIONS_CONTACT_EMAIL ?? "contact@kaza.africa";
  try {
    await sendEmail(
      recipient,
      `[Contact KAZA] ${subjectLabel} — ${data.name}`,
      buildAdminHtml({
        name: data.name,
        email: data.email,
        phone: null,
        subjectLabel,
        message: data.message,
      }),
    );
    // 3. Confirmation expéditeur ---------------------------------------------
    await sendEmail(
      data.email,
      "Votre message KAZA a bien été reçu",
      buildConfirmationHtml(data.name, subjectLabel),
    );
  } catch (err) {
    console.error("[contact] email failed:", err);
  }

  return {
    success: true,
    message: "Message reçu. Notre équipe vous répond sous 24h.",
  };
}

/**
 * Variante générique (sujet libre, téléphone optionnel) — utilisable par tout
 * formulaire de contact qui n'a pas besoin de l'enum marketing.
 */
export async function submitContactMessage(
  input: SubmitContactInput,
): Promise<{ success: boolean; error?: string }> {
  const parsed = SubmitContactSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides",
    };
  }

  const data = parsed.data;

  // 1. Persistance DB ---------------------------------------------------------
  const persisted = await persistContactMessage({
    fullName: data.fullName,
    email: data.email,
    phone: data.phone ?? null,
    subject: data.subject,
    message: data.message,
  });

  if (!persisted.ok) {
    return {
      success: false,
      error:
        "Impossible d'enregistrer votre message pour le moment. Réessayez dans quelques instants.",
    };
  }

  // 2 & 3 — Emails best-effort ------------------------------------------------
  const recipient =
    process.env.NOTIFICATIONS_CONTACT_EMAIL ?? "contact@kaza.africa";
  try {
    await sendEmail(
      recipient,
      `[KAZA Contact] ${data.subject}`,
      buildAdminHtml({
        name: data.fullName,
        email: data.email,
        phone: data.phone ?? null,
        subjectLabel: data.subject,
        message: data.message,
      }),
    );
    await sendEmail(
      data.email,
      "Votre message KAZA a bien été reçu",
      buildConfirmationHtml(data.fullName, data.subject),
    );
  } catch (err) {
    console.error("[contact] email failed:", err);
  }

  return { success: true };
}

// ----- Admin : gestion des messages -----------------------------------------

/**
 * Marque un message de contact comme lu (statut → 'READ').
 * Réservé aux ADMIN (RLS + vérification applicative). Revalide la page admin.
 */
export async function markContactMessageRead(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  if (!id || typeof id !== "string") {
    return { success: false, error: "Identifiant invalide." };
  }

  const user = await getCurrentDisplayUser();
  if (!user) {
    return { success: false, error: "Authentification requise." };
  }
  if (user.role !== "ADMIN") {
    return { success: false, error: "Réservé aux administrateurs." };
  }

  const supabase = await createClient();

  // Types Supabase générés ne contiennent pas encore `contact_messages` →
  // cast explicite. La sécurité reste assurée par la policy RLS admin_update.
  const { error } = await (supabase as unknown as {
    from: (t: string) => {
      update: (row: Record<string, unknown>) => {
        eq: (
          col: string,
          val: string,
        ) => Promise<{ error: { message: string } | null }>;
      };
    };
  })
    .from("contact_messages")
    .update({ status: "READ", handled_by: user.id })
    .eq("id", id);

  if (error) {
    console.error("[contact] markRead failed:", error.message);
    return {
      success: false,
      error: "Impossible de mettre à jour le message.",
    };
  }

  revalidatePath("/admin/messages");
  return { success: true };
}
