import "server-only";

// =============================================================================
// KAZA — Audit log writer
// Wave 9 — Yaw
//
// Helper unique pour persister une action admin dans `public.audit_logs`.
// Conçu pour être appelé en best-effort depuis les Server Actions sensibles
// (modération, KYC, suspension utilisateur, etc.) :
//   - Jamais throw : un échec d'écriture du log ne doit pas faire échouer
//     l'action métier qui l'a déclenchée.
//   - Récupère automatiquement l'identité admin (id + nom) via
//     `supabase.auth.getUser()` puis enrichissement depuis `public.users`.
//   - Les champs `ip_address` et `user_agent` sont laissés à null côté
//     Server Action — leur extraction nécessite l'objet `Headers` (route
//     handler) que l'on n'a pas ici. Ils pourront être renseignés plus tard
//     depuis un middleware dédié.
//
// La table `audit_logs` n'est pas encore typée par les types générés Supabase
// (cf. property.ts pour la même limitation) — on cast le client en `any`.
// =============================================================================

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from "@/lib/supabase/server";

/** Types de cibles supportés (alignés sur l'ENUM `audit_target_type`). */
export type AuditTargetType =
  | "USER"
  | "PROPERTY"
  | "CONTRACT"
  | "AGENCY"
  | "PAYMENT"
  | "SYSTEM";

/** Entrée à écrire dans le journal d'audit. */
export interface WriteAuditLogInput {
  /** Action effectuée (doit matcher l'ENUM `audit_action_type` côté DB). */
  action: string;
  /** Type de l'entité ciblée. */
  targetType: AuditTargetType;
  /** ID de l'entité ciblée (UUID le plus souvent, parfois slug). */
  targetId: string;
  /** Libellé humain de la cible — affiché tel quel dans la table d'audit. */
  targetLabel?: string;
  /** Motif libre de l'action (rejet, suspension, etc.). */
  reason?: string;
  /** Métadonnées additionnelles structurées (JSONB). */
  metadata?: Record<string, unknown>;
}

/**
 * Persiste une entrée dans `audit_logs`. Best-effort : retourne silencieusement
 * en cas d'erreur (manque de session, échec RLS, table absente en dev local).
 */
export async function writeAuditLog(input: WriteAuditLogInput): Promise<void> {
  try {
    const supabase = (await createClient()) as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Pas d'utilisateur authentifié : la policy d'INSERT exigeant role='ADMIN',
      // une écriture anonyme serait de toute façon rejetée. On no-op.
      return;
    }

    const { data: profile } = await supabase
      .from("users")
      .select("first_name, last_name")
      .eq("id", user.id)
      .maybeSingle();

    const fn = (profile as { first_name?: string } | null)?.first_name ?? "";
    const ln = (profile as { last_name?: string } | null)?.last_name ?? "";
    const adminName = `${fn} ${ln}`.trim() || "Admin";

    await supabase.from("audit_logs").insert({
      admin_id: user.id,
      admin_name: adminName,
      action: input.action,
      target_type: input.targetType,
      target_id: input.targetId,
      target_label: input.targetLabel ?? null,
      reason: input.reason ?? null,
      metadata: input.metadata ?? null,
      ip_address: null,
      user_agent: null,
    });
  } catch (err) {
    // Best-effort : on log mais on ne propage pas.
    console.error("[audit] writeAuditLog failed:", err);
  }
}
