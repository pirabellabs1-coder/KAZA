"use server";

// =============================================================================
// Kaabo — Demandes RGPD / APDP (Server Actions)
//
// Persiste les demandes dans `public.gdpr_requests` (migration 00056).
// RLS :
//   - INSERT : utilisateur connecté pour lui-même (user_id = auth.uid())
//   - SELECT : demandeur OU admin
//   - UPDATE : admin uniquement
//
// Convention de retour : ActionResult (réutilisée depuis @/actions/notifications).
// La table `gdpr_requests` n'est pas encore dans les types Supabase générés :
// on cast le client en `any` pour les requêtes (même pattern que reports).
// =============================================================================

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/actions/notifications";

// ---------------------------------------------------------------------------
// Types & validation
// ---------------------------------------------------------------------------

export type GdprRequestType =
  | "EXPORT"
  | "DELETION"
  | "RECTIFICATION"
  | "ACCESS";

export type GdprResolveStatus = "IN_PROGRESS" | "COMPLETED" | "REJECTED";

interface GdprRequestInput {
  type: GdprRequestType;
  details?: string;
}

const submitSchema = z.object({
  type: z.enum(["EXPORT", "DELETION", "RECTIFICATION", "ACCESS"]),
  details: z.string().trim().max(2000).optional(),
});

// ---------------------------------------------------------------------------
// Server Action utilisateur : soumettre une demande
// ---------------------------------------------------------------------------

/**
 * Enregistre une demande RGPD pour l'utilisateur connecté (status PENDING).
 * La connexion est obligatoire : la policy RLS `gdpr_requests_insert_own`
 * exige `user_id = auth.uid()`. Empêche le spam : une seule demande PENDING
 * du même type à la fois.
 */
export async function submitGdprRequest(
  input: GdprRequestInput,
): Promise<ActionResult> {
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Demande invalide.",
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Vous devez être connecté." };
  }

  const details = parsed.data.details?.trim();

  // Anti-spam : refuse si une demande du même type est déjà en attente.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing, error: existingError } = await (supabase as any)
    .from("gdpr_requests")
    .select("id")
    .eq("user_id", user.id)
    .eq("type", parsed.data.type)
    .eq("status", "PENDING")
    .limit(1);

  if (!existingError && Array.isArray(existing) && existing.length > 0) {
    return {
      success: false,
      error: "Demande déjà en cours pour ce type.",
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("gdpr_requests").insert({
    user_id: user.id,
    type: parsed.data.type,
    details: details && details.length > 0 ? details : null,
    status: "PENDING",
  });

  if (error) {
    console.warn("[gdpr] insertion impossible", error.message);
    return {
      success: false,
      error: "Impossible d'enregistrer la demande. Réessayez plus tard.",
    };
  }

  revalidatePath("/settings/privacy");
  revalidatePath("/admin/documents");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Server Action admin : traiter une demande
// ---------------------------------------------------------------------------

/**
 * Met à jour le statut d'une demande RGPD (réservé aux ADMIN par la policy RLS
 * `gdpr_requests_update_admin`). Renseigne `resolved_at` / `resolved_by`
 * lorsque la demande est clôturée (COMPLETED | REJECTED).
 */
export async function resolveGdprRequest(
  id: string,
  status: GdprResolveStatus,
  adminNote?: string,
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Vous devez être connecté." };
  }

  // Vérifie le rôle ADMIN du caller (en plus de la garde RLS).
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if ((profile as { role?: string } | null)?.role !== "ADMIN") {
    return { success: false, error: "Accès réservé aux administrateurs." };
  }

  const isClosed = status === "COMPLETED" || status === "REJECTED";
  const note = adminNote?.trim();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("gdpr_requests")
    .update({
      status,
      resolved_at: isClosed ? new Date().toISOString() : null,
      resolved_by: isClosed ? user.id : null,
      admin_note: note && note.length > 0 ? note : null,
    })
    .eq("id", id);

  if (error) {
    console.warn("[gdpr] mise à jour impossible", error.message);
    return {
      success: false,
      error: "Impossible de mettre à jour la demande.",
    };
  }

  revalidatePath("/admin/documents");
  return { success: true };
}
