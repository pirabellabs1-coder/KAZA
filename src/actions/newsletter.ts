"use server";

import "server-only";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/notifications/resend";

// =============================================================================
// KAZA - Server Action : inscription newsletter
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
        "Bienvenue dans la newsletter KAZA",
        `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
        <div style="background:#1A3A52;color:white;padding:24px;border-radius:8px 8px 0 0;">
          <h1 style="margin:0;">Bienvenue chez KAZA 🏠</h1>
        </div>
        <div style="background:white;padding:24px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 8px 8px;">
          <p>Bonjour,</p>
          <p>Merci de vous être inscrit à la newsletter KAZA ! Vous recevrez nos meilleures annonces et analyses du marché immobilier ouest-africain.</p>
          <p>À très vite,<br><strong>L'équipe KAZA</strong></p>
          <hr style="border:0;border-top:1px solid #e5e7eb;margin:16px 0;" />
          <p style="font-size:11px;color:#9ca3af;">Vous recevez ce message car vous avez demandé à être inscrit. <a href="https://kaza-jade.vercel.app/unsubscribe?email=${encodeURIComponent(normalizedEmail)}">Se désabonner</a>.</p>
        </div>
      </div>`,
      );
    }

    // Notification interne ----------------------------------------------------
    const adminEmail =
      process.env.NOTIFICATIONS_CONTACT_EMAIL ?? "contact@kaza.africa";
    await sendEmail(
      adminEmail,
      `[KAZA] ${alreadySubscribed ? "Tentative ré-inscription" : "Nouvel abonné"} newsletter (source: ${finalSource})`,
      `<p><strong>${normalizedEmail}</strong> ${alreadySubscribed ? "était déjà inscrit" : "vient de s'abonner"} à la newsletter.</p><p>Source : ${finalSource}</p>`,
    );
  } catch (err) {
    console.error("[newsletter] email failed:", err);
  }

  return {
    success: true,
    message: alreadySubscribed
      ? "Vous êtes déjà inscrit à notre newsletter."
      : "Inscription confirmée. Bienvenue chez KAZA !",
  };
}
