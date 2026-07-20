"use server";

import "server-only";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/notifications/resend";
import { buildEmail } from "@/lib/notifications/email-template";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://kaza-jade.vercel.app"
).replace(/\/$/, "");

// =============================================================================
// Kaabo - Server Action : inscription newsletter
//
// Persiste l'inscription dans `newsletter_subscribers` (RLS public INSERT),
// envoie un email de confirmation à l'abonné et notifie l'équipe interne.
// La table contraint `email` unique → on tolère le doublon comme un succès.
// =============================================================================

const Schema = z.object({
  email: z.string().email(),
  consent: z.literal(true).optional(),
  source: z.string().max(80).optional(),
});

export type NewsletterResult = {
  success: boolean;
  message?: string;
  error?: string;
};

export async function subscribeNewsletter(
  input: unknown,
): Promise<NewsletterResult> {
  const parsed = Schema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Email invalide.",
    };
  }

  const { email, source } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();
  const finalSource = source ?? "footer";

  // 1. Persistance DB ---------------------------------------------------------
  const supabase = await createClient();
  const { error } = await (supabase as unknown as {
    from: (t: string) => {
      insert: (row: Record<string, unknown>) => Promise<{ error: { message: string; code?: string } | null }>;
    };
  })
    .from("newsletter_subscribers")
    .insert({
      email: normalizedEmail,
      source: finalSource,
      confirmed: true,
      unsubscribed: false,
    });

  if (error && error.code !== "23505") {
    // 23505 = unique_violation Postgres → on continue (déjà inscrit).
    console.error("[newsletter] persist failed:", error.message);
    return {
      success: false,
      error:
        "Impossible d'enregistrer votre inscription pour le moment. Réessayez plus tard.",
    };
  }

  const alreadySubscribed = error?.code === "23505";

  // 2. Email de bienvenue (best-effort) --------------------------------------
  try {
    if (!alreadySubscribed) {
      await sendEmail(
        normalizedEmail,
        "Bienvenue dans la newsletter Kaabo",
        buildEmail({
          preheader: "Merci pour votre inscription à la newsletter Kaabo.",
          heading: "Bienvenue chez Kaabo 🏠",
          intro: "Bonjour,",
          paragraphs: [
            "Merci de vous être inscrit à la newsletter Kaabo ! Vous recevrez chaque mois nos meilleures annonces et nos analyses du marché immobilier africain.",
            "À très vite, l'équipe Kaabo.",
          ],
          button: { label: "Découvrir les annonces", url: `${SITE_URL}/search` },
        }),
      );
    }

    // Notification interne ----------------------------------------------------
    const adminEmail =
      process.env.NOTIFICATIONS_CONTACT_EMAIL ?? "immobilierkaza@gmail.com";
    await sendEmail(
      adminEmail,
      `[Kaabo] ${alreadySubscribed ? "Tentative ré-inscription" : "Nouvel abonné"} newsletter (source: ${finalSource})`,
      buildEmail({
        heading: alreadySubscribed
          ? "Tentative de ré-inscription newsletter"
          : "Nouvel abonné à la newsletter",
        paragraphs: [
          `${normalizedEmail} ${alreadySubscribed ? "était déjà inscrit" : "vient de s'abonner"} à la newsletter Kaabo.`,
        ],
        rows: [{ label: "Source", value: finalSource }],
      }),
    );
  } catch (err) {
    console.error("[newsletter] email failed:", err);
  }

  return {
    success: true,
    message: alreadySubscribed
      ? "Vous êtes déjà inscrit à notre newsletter."
      : "Inscription confirmée. Bienvenue chez Kaabo !",
  };
}
