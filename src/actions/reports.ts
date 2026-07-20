"use server";

// =============================================================================
// Kaabo — Signalements de contenu (Server Actions)
//
// Persiste les signalements dans `public.reports` (migration 00030).
// RLS :
//   - INSERT public  → signalement anonyme autorisé (reporter_id peut être NULL)
//   - SELECT own/admin
//   - UPDATE admin uniquement
//
// Convention de retour : ActionResult (réutilisée depuis @/actions/notifications).
// La table `reports` n'est pas encore dans les types Supabase générés : on cast
// le client en `any` pour les requêtes (même pattern que partners-admin).
// =============================================================================

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/actions/notifications";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Cibles de signalement supportées (aligné sur la contrainte applicative). */
export type ReportTargetType =
  | "property"
  | "review"
  | "user"
  | "message"
  | "other";

/** Raisons canoniques stockées en base (`reason` de la table reports). */
export type ReportReason =
  | "fake"
  | "fraud"
  | "inappropriate"
  | "spam"
  | "other";

/** Statuts de traitement d'un signalement. */
export type ReportStatus = "PENDING" | "REVIEWED" | "RESOLVED" | "DISMISSED";

interface ReportContentInput {
  /** Type de cible (normalisé en base vers property|review|user|message|other). */
  targetType: string;
  targetId: string;
  /**
   * Raison choisie par l'utilisateur. L'UI propose un jeu de libellés plus
   * large (scam, harassment, illegal...) : on les normalise vers les valeurs
   * acceptées par la base.
   */
  reason: string;
  details?: string;
}

// Normalisation des raisons UI → valeurs de la colonne `reason`.
const REASON_MAP: Record<string, ReportReason> = {
  fake: "fake",
  fraud: "fraud",
  scam: "fraud",
  inappropriate: "inappropriate",
  harassment: "inappropriate",
  illegal: "fraud",
  spam: "spam",
  other: "other",
};

function normalizeReason(value: string): ReportReason {
  return REASON_MAP[value] ?? "other";
}

const ALLOWED_TARGET_TYPES: ReportTargetType[] = [
  "property",
  "review",
  "user",
  "message",
  "other",
];

function normalizeTargetType(value: string): ReportTargetType {
  return (ALLOWED_TARGET_TYPES as string[]).includes(value)
    ? (value as ReportTargetType)
    : "other";
}

// ---------------------------------------------------------------------------
// Validation Zod de l'entrée publique `reportContent`
// ---------------------------------------------------------------------------
// On valide AVANT toute écriture. Le `targetType` et la `reason` acceptent le
// vocabulaire UI étendu (scam, harassment, illegal…) qui est ensuite normalisé
// vers les valeurs de la base. La normalisation conserve la logique métier
// existante : la validation ne fait qu'ajouter un garde-fou sur les types.

const reportContentSchema = z.object({
  targetType: z.enum([
    "property",
    "review",
    "user",
    "message",
    "other",
  ]),
  targetId: z.string().trim().min(1, "Cible du signalement manquante."),
  reason: z.enum([
    "fake",
    "fraud",
    "scam",
    "inappropriate",
    "harassment",
    "illegal",
    "spam",
    "other",
  ]),
  details: z.string().trim().max(2000).optional(),
});

// ---------------------------------------------------------------------------
// Server Actions publiques
// ---------------------------------------------------------------------------

/**
 * Enregistre un signalement de contenu.
 *
 * L'utilisateur peut être anonyme (`reporter_id = null`) : la policy RLS
 * `reports_insert` autorise l'insertion publique. Si une session existe,
 * on rattache le signalement à l'utilisateur courant.
 */
export async function reportContent(
  input: ReportContentInput,
): Promise<ActionResult> {
  // Validation Zod en tête : rejette une entrée malformée avant tout accès BDD.
  const parsed = reportContentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Signalement invalide.",
    };
  }

  const targetType = normalizeTargetType(parsed.data.targetType);
  const targetId = parsed.data.targetId.trim();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const details = parsed.data.details?.trim();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("reports").insert({
    reporter_id: user?.id ?? null,
    target_type: targetType,
    target_id: targetId,
    reason: normalizeReason(parsed.data.reason),
    details: details && details.length > 0 ? details : null,
    status: "PENDING",
  });

  if (error) {
    console.warn("[reports] insertion impossible", error.message);
    return {
      success: false,
      error: "Impossible d'enregistrer le signalement. Réessayez plus tard.",
    };
  }

  return { success: true };
}

/**
 * Met à jour le statut d'un signalement (réservé aux ADMIN par la policy RLS
 * `reports_admin_update`). Renseigne `resolved_at` / `resolved_by` lorsque le
 * signalement est clôturé (RESOLVED | DISMISSED).
 */
export async function resolveReport(
  id: string,
  status: ReportStatus,
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Vous devez être connecté." };
  }

  const isClosed = status === "RESOLVED" || status === "DISMISSED";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("reports")
    .update({
      status,
      resolved_at: isClosed ? new Date().toISOString() : null,
      resolved_by: isClosed ? user.id : null,
    })
    .eq("id", id);

  if (error) {
    console.warn("[reports] mise à jour impossible", error.message);
    return {
      success: false,
      error: "Impossible de mettre à jour le signalement.",
    };
  }

  revalidatePath("/admin/reports");
  return { success: true };
}
