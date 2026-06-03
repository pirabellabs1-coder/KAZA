"use server";

import "server-only";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/notifications/resend";
import { buildEmail } from "@/lib/notifications/email-template";
import {
  PARTNER_TYPES,
  PARTNER_TYPE_LABELS,
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

function buildAdminHtml(input: PartnerApplicationInput): string {
  const typeLabel = PARTNER_TYPE_LABELS[input.partnerType];
  const descParas = input.description
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  return buildEmail({
    preheader: `Candidature partenaire — ${input.companyName}`,
    heading: "Nouvelle candidature partenaire",
    paragraphs: descParas.length ? descParas : ["(Aucune description)"],
    rows: [
      { label: "Type", value: typeLabel },
      { label: "Société", value: input.companyName },
      { label: "Contact", value: input.contactName },
      { label: "Email", value: input.email },
      ...(input.phone ? [{ label: "Téléphone", value: input.phone }] : []),
      { label: "Ville", value: `${input.city} (${input.countryCode})` },
      ...(input.rccm ? [{ label: "RCCM", value: input.rccm }] : []),
      ...(input.website ? [{ label: "Site web", value: input.website }] : []),
    ],
    outro: "Candidature à traiter depuis l'espace admin (Demandes partenariat).",
  });
}

function buildConfirmationHtml(input: PartnerApplicationInput): string {
  const typeLabel = PARTNER_TYPE_LABELS[input.partnerType];
  return buildEmail({
    preheader: "Votre candidature partenaire KAZA a bien été reçue.",
    heading: "Candidature reçue 🎉",
    intro: `Bonjour ${input.contactName},`,
    paragraphs: [
      `Nous avons bien reçu la candidature de ${input.companyName} au programme partenaires KAZA.`,
      "Notre équipe partenariats examine votre dossier et reviendra vers vous sous 5 jours ouvrés.",
    ],
    rows: [{ label: "Catégorie", value: typeLabel }],
    outro: "L'équipe Partenariats KAZA",
  });
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
