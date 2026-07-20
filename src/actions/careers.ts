"use server";
import "server-only";

// =============================================================================
// Kaabo — Server Actions Carrières (CRUD admin sur `job_offers`)
//
// Toutes les actions :
//   1. Valident l'entrée via Zod
//   2. Vérifient que l'utilisateur courant a le rôle ADMIN
//   3. Exécutent la mutation (RLS l'autorise grâce au rôle ADMIN)
//   4. Revalident `/carrieres` (et `/admin/careers` pour l'UI back-office)
// =============================================================================

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";

const CONTRACTS = ["CDI", "CDD", "STAGE", "FREELANCE", "ALTERNANCE"] as const;

const inputSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "Slug invalide (lettres minuscules, chiffres, tirets)."),
  title: z.string().min(3).max(120),
  department: z.string().min(2),
  location: z.string().min(2),
  contract: z.enum(CONTRACTS),
  level: z.string().optional(),
  summary: z.string().min(20).max(500),
  description: z.string().min(50),
  requirements: z.string().optional(),
  benefits: z.string().optional(),
  salary_range: z.string().optional(),
  apply_email: z.string().email(),
});

type JobOfferInput = z.infer<typeof inputSchema>;

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

function normalizeOptional(value: string | undefined | null): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

function buildRecord(parsed: JobOfferInput) {
  return {
    slug: parsed.slug.trim(),
    title: parsed.title.trim(),
    department: parsed.department.trim(),
    location: parsed.location.trim(),
    contract: parsed.contract,
    level: normalizeOptional(parsed.level),
    summary: parsed.summary.trim(),
    description: parsed.description.trim(),
    requirements: normalizeOptional(parsed.requirements),
    benefits: normalizeOptional(parsed.benefits),
    salary_range: normalizeOptional(parsed.salary_range),
    apply_email: parsed.apply_email.trim().toLowerCase(),
  };
}

function revalidateAll() {
  revalidatePath("/carrieres");
  revalidatePath("/admin/careers");
}

// ---------------------------------------------------------------------------
// createJobOffer — crée une offre en statut DRAFT
// ---------------------------------------------------------------------------

export async function createJobOffer(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const guard = await requireAdmin();
  if (!guard.success) return { success: false, error: guard.error };

  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides.",
    };
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("job_offers")
    .insert({ ...buildRecord(parsed.data), status: "DRAFT" })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[careers] createJobOffer:", error?.message);
    return {
      success: false,
      error:
        error?.code === "23505"
          ? "Ce slug est déjà utilisé."
          : "Impossible de créer l'offre.",
    };
  }

  revalidateAll();
  return { success: true, data: { id: (data as { id: string }).id } };
}

// ---------------------------------------------------------------------------
// updateJobOffer — met à jour une offre existante (champs métier seulement)
// ---------------------------------------------------------------------------

export async function updateJobOffer(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.success) return { success: false, error: guard.error };

  if (!id) return { success: false, error: "Identifiant manquant." };

  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides.",
    };
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("job_offers")
    .update(buildRecord(parsed.data))
    .eq("id", id);

  if (error) {
    console.error("[careers] updateJobOffer:", error.message);
    return {
      success: false,
      error:
        error.code === "23505"
          ? "Ce slug est déjà utilisé."
          : "Impossible de mettre à jour l'offre.",
    };
  }

  revalidateAll();
  return { success: true };
}

// ---------------------------------------------------------------------------
// publishJobOffer — bascule status=PUBLISHED + horodate published_at
// ---------------------------------------------------------------------------

export async function publishJobOffer(id: string): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.success) return { success: false, error: guard.error };

  if (!id) return { success: false, error: "Identifiant manquant." };

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("job_offers")
    .update({
      status: "PUBLISHED",
      published_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("[careers] publishJobOffer:", error.message);
    return { success: false, error: "Impossible de publier l'offre." };
  }

  revalidateAll();
  return { success: true };
}

// ---------------------------------------------------------------------------
// unpublishJobOffer — repasse en DRAFT (l'horodatage published_at est conservé
// pour traçabilité de la première mise en ligne)
// ---------------------------------------------------------------------------

export async function unpublishJobOffer(id: string): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.success) return { success: false, error: guard.error };

  if (!id) return { success: false, error: "Identifiant manquant." };

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("job_offers")
    .update({ status: "DRAFT" })
    .eq("id", id);

  if (error) {
    console.error("[careers] unpublishJobOffer:", error.message);
    return { success: false, error: "Impossible de dépublier l'offre." };
  }

  revalidateAll();
  return { success: true };
}

// ---------------------------------------------------------------------------
// deleteJobOffer — suppression définitive
// ---------------------------------------------------------------------------

export async function deleteJobOffer(id: string): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.success) return { success: false, error: guard.error };

  if (!id) return { success: false, error: "Identifiant manquant." };

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("job_offers")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[careers] deleteJobOffer:", error.message);
    return { success: false, error: "Impossible de supprimer l'offre." };
  }

  revalidateAll();
  return { success: true };
}
