"use server";

import "server-only";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/notifications/resend";
import {
  PARTNER_TYPES,
  PARTNER_TYPE_LABELS,
  type PartnerType,
} from "@/lib/partners/constants";

// =============================================================================
// KAZA - Server Action : candidatures partenaires (page /partners)
//
// Insère une candidature dans `partner_applications` (RLS public INSERT),
// puis notifie l'équipe interne et envoie une confirmation au candidat.
// =============================================================================

const PartnerApplicationSchema = z.object({
  partnerType: z.enum(PARTNER_TYPES),
  companyName: z.string().min(2).max(150),
  contactName: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(4).max(40).optional().or(z.literal("")),
  city: z.string().min(2).max(120),
  countryCode: z.string().min(2).max(3),
  rccm: z.string().max(60).optional().or(z.literal("")),
  website: z
    .string()
    .max(255)
    .optional()
    .or(z.literal(""))
    .refine(
      (v) =>
        !v || /^https?:\/\//i.test(v) || /^[a-z0-9.-]+\.[a-z]{2,}/i.test(v),
      "URL invalide",
    ),
  description: z.string().min(20).max(2000),
});

export type PartnerApplicationInput = z.infer<typeof PartnerApplicationSchema>;

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildAdminHtml(input: PartnerApplicationInput): string {
  const typeLabel = PARTNER_TYPE_LABELS[input.partnerType];
  const desc = escapeHtml(input.description).replace(/\n/g, "<br />");
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 640px; margin: 0 auto; color: #1A3A52;">
      <div style="background: linear-gradient(135deg,#1A3A52,#1976D2); color: white; padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">Nouvelle candidature partenaire</h1>
        <p style="margin: 4px 0 0; font-size: 13px; opacity: .85;">Type : ${escapeHtml(typeLabel)}</p>
      </div>
      <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 8px 8px;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:6px 0;color:#6b7280;width:140px;">Société :</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(input.companyName)}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;">Contact :</td><td style="padding:6px 0;">${escapeHtml(input.contactName)}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;">Email :</td><td style="padding:6px 0;"><a href="mailto:${escapeHtml(input.email)}" style="color:#1976D2;">${escapeHtml(input.email)}</a></td></tr>
          ${input.phone ? `<tr><td style="padding:6px 0;color:#6b7280;">Téléphone :</td><td style="padding:6px 0;">${escapeHtml(input.phone)}</td></tr>` : ""}
          <tr><td style="padding:6px 0;color:#6b7280;">Ville :</td><td style="padding:6px 0;">${escapeHtml(input.city)} (${escapeHtml(input.countryCode)})</td></tr>
          ${input.rccm ? `<tr><td style="padding:6px 0;color:#6b7280;">RCCM :</td><td style="padding:6px 0;">${escapeHtml(input.rccm)}</td></tr>` : ""}
          ${input.website ? `<tr><td style="padding:6px 0;color:#6b7280;">Site web :</td><td style="padding:6px 0;"><a href="${escapeHtml(input.website)}" style="color:#1976D2;">${escapeHtml(input.website)}</a></td></tr>` : ""}
        </table>
        <hr style="border:0;border-top:1px solid #e5e7eb;margin:16px 0;" />
        <p style="color:#6b7280;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:.05em;">Description de l'activité</p>
        <div style="color:#374151;line-height:1.6;font-size:14px;">${desc}</div>
        <hr style="border:0;border-top:1px solid #e5e7eb;margin:16px 0;" />
        <p style="font-size:12px;color:#9ca3af;margin:0;">
          Candidature soumise via kaza.africa/partners. À traiter depuis l'espace admin.
        </p>
      </div>
    </div>
  `;
}

function buildConfirmationHtml(input: PartnerApplicationInput): string {
  const typeLabel = PARTNER_TYPE_LABELS[input.partnerType];
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1A3A52;">
      <div style="background:#1A3A52;color:white;padding:24px;border-radius:8px 8px 0 0;">
        <h1 style="margin:0;font-size:20px;">Candidature reçue 🎉</h1>
      </div>
      <div style="background:white;padding:24px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 8px 8px;">
        <p>Bonjour ${escapeHtml(input.contactName)},</p>
        <p>Nous avons bien reçu la candidature de <strong>${escapeHtml(input.companyName)}</strong> au programme partenaires KAZA.</p>
        <p><strong>Catégorie :</strong> ${escapeHtml(typeLabel)}</p>
        <p>Notre équipe partenariats examine votre dossier et reviendra vers vous sous <strong>5 jours ouvrés</strong>.</p>
        <hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0;" />
        <p style="font-size:12px;color:#9ca3af;">L'équipe Partenariats KAZA — immobilierkaza@gmail.com</p>
      </div>
    </div>
  `;
}

export async function submitPartnerApplication(
  input: PartnerApplicationInput,
): Promise<{ success: boolean; error?: string }> {
  const parsed = PartnerApplicationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides",
    };
  }
  const data = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await (supabase as unknown as {
    from: (t: string) => {
      insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    };
  })
    .from("partner_applications")
    .insert({
      applicant_id: user?.id ?? null,
      company_name: data.companyName,
      contact_name: data.contactName,
      email: data.email,
      phone: data.phone || null,
      partner_type: data.partnerType,
      city: data.city,
      country_code: data.countryCode.toUpperCase(),
      rccm: data.rccm || null,
      website: data.website || null,
      description: data.description,
      status: "PENDING",
    });

  if (error) {
    console.error("[partners] persist failed:", error.message);
    return {
      success: false,
      error:
        "Impossible d'enregistrer votre candidature pour le moment. Réessayez dans quelques instants.",
    };
  }

  const recipient =
    process.env.NOTIFICATIONS_CONTACT_EMAIL ?? "immobilierkaza@gmail.com";
  try {
    await sendEmail(
      recipient,
      `[KAZA Partenariat] ${PARTNER_TYPE_LABELS[data.partnerType]} — ${data.companyName}`,
      buildAdminHtml(data),
    );
    await sendEmail(
      data.email,
      "Votre candidature partenaire KAZA a bien été reçue",
      buildConfirmationHtml(data),
    );
  } catch (err) {
    console.error("[partners] email failed:", err);
  }

  return { success: true };
}
