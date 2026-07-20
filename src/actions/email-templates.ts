"use server";
import "server-only";

// =============================================================================
// Kaabo — Server Actions Email Templates (upsert sur `email_templates`)
//
// upsertEmailTemplate :
//   1. Vérifie que l'utilisateur courant a le rôle ADMIN
//   2. Valide l'entrée via Zod
//   3. Exécute l'upsert (RLS l'autorise grâce au rôle ADMIN)
//   4. Revalide `/admin/email-templates`
//
// Les types Supabase auto-générés ne connaissent pas encore la table
// `email_templates` (migration 00030) : bypass via `as any`, sécurité RLS.
// =============================================================================

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";

export interface ActionResult<T = undefined> {
  success: boolean;
  data?: T;
  error?: string;
}

async function requireAdmin(): Promise<ActionResult<{ userId: string }>> {
  const user = await getCurrentDisplayUser();
  if (!user) {
    return { success: false, error: "Authentification requise." };
  }
  if (user.role !== "ADMIN") {
    return { success: false, error: "Réservé aux administrateurs." };
  }
  return { success: true, data: { userId: user.id } };
}

const upsertSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2, "La clé est requise.")
    .max(80)
    .regex(
      /^[a-z0-9_]+$/,
      "Clé invalide (lettres minuscules, chiffres, underscores).",
    ),
  name: z.string().trim().min(2, "Le nom est requis.").max(120),
  subject: z.string().trim().min(3, "Le sujet est requis.").max(300),
  body_html: z.string().trim().min(10, "Le corps HTML est requis."),
});

type UpsertTemplateInput = z.infer<typeof upsertSchema>;

// ---------------------------------------------------------------------------
// upsertEmailTemplate — crée ou met à jour un template (clé = PK)
// ---------------------------------------------------------------------------

export async function upsertEmailTemplate(
  input: UpsertTemplateInput,
): Promise<ActionResult<{ key: string }>> {
  const guard = await requireAdmin();
  if (!guard.success) return { success: false, error: guard.error };

  const parsed = upsertSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides.",
    };
  }

  const { key, name, subject, body_html } = parsed.data;

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("email_templates")
    .upsert(
      {
        key,
        name,
        subject,
        body_html,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );

  if (error) {
    console.error("[email-templates] upsertEmailTemplate:", error.message);
    return { success: false, error: "Impossible d'enregistrer le template." };
  }

  revalidatePath("/admin/email-templates");
  return { success: true, data: { key } };
}
