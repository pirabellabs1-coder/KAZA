"use server";

// =============================================================================
// KAZA — Server Actions Remboursements (decisions admin)
//
// `approveRefund` / `rejectRefund` : reserves aux ADMIN. Font passer la demande
// `refund_requests` a APPROVED / REJECTED, renseignent resolved_at, resolved_by
// et decision_note, puis ecrivent une entree dans `audit_logs` (best-effort).
//
// `refund_requests` n'est pas (encore) dans les types generes Supabase : on
// cast le client en `any` (meme limitation que `partner_applications`).
// =============================================================================

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from "@/lib/supabase/server";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { writeAuditLog } from "@/lib/audit/write-log";

export interface RefundDecisionResult {
  success: boolean;
  error?: string;
}

type Decision = "APPROVED" | "REJECTED";

/**
 * Coeur commun des decisions admin sur une demande de remboursement.
 * Verifie le role ADMIN, met a jour la ligne (status, resolved_at,
 * resolved_by, decision_note) puis journalise l'action.
 */
async function decideRefund(
  id: string,
  status: Decision,
  note?: string,
): Promise<RefundDecisionResult> {
  if (!id || !id.trim()) {
    return { success: false, error: "Identifiant de demande manquant." };
  }

  const admin = await getCurrentDisplayUser();
  if (!admin) {
    return { success: false, error: "Authentification requise." };
  }
  if (admin.role !== "ADMIN") {
    return {
      success: false,
      error: "Action reservee aux administrateurs.",
    };
  }

  const supabase = (await createClient()) as any;

  // Recupere la demande pour s'assurer qu'elle existe et est encore en attente.
  const { data: request, error: fetchErr } = await supabase
    .from("refund_requests")
    .select("id, status, amount, user_id, payment_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr || !request) {
    return { success: false, error: "Demande de remboursement introuvable." };
  }
  if (request.status !== "PENDING") {
    return {
      success: false,
      error: "Cette demande a deja ete traitee.",
    };
  }

  const decisionNote = note?.trim() || null;

  const { error: updateErr } = await supabase
    .from("refund_requests")
    .update({
      status,
      resolved_at: new Date().toISOString(),
      resolved_by: admin.id,
      decision_note: decisionNote,
    })
    .eq("id", id)
    .eq("status", "PENDING");

  if (updateErr) {
    console.error("[refunds] update echec:", updateErr);
    return {
      success: false,
      error: "Impossible d'enregistrer la decision.",
    };
  }

  // Journalise l'action admin (best-effort : un echec ne casse pas la decision).
  await writeAuditLog({
    action: status === "APPROVED" ? "REFUND_APPROVED" : "REFUND_REJECTED",
    targetType: "PAYMENT",
    targetId: (request.payment_id as string | null) ?? id,
    targetLabel: `Remboursement #${id.slice(0, 8)}`,
    reason: decisionNote ?? undefined,
    metadata: {
      refund_request_id: id,
      amount: request.amount,
      requester_id: request.user_id,
    },
  });

  return { success: true };
}

/**
 * Approuve une demande de remboursement (ADMIN uniquement).
 * @param id   ID de la demande `refund_requests`.
 * @param note Note de decision optionnelle.
 */
export async function approveRefund(
  id: string,
  note?: string,
): Promise<RefundDecisionResult> {
  return decideRefund(id, "APPROVED", note);
}

/**
 * Rejette une demande de remboursement (ADMIN uniquement).
 * @param id   ID de la demande `refund_requests`.
 * @param note Motif du refus (requis : communique a l'utilisateur).
 */
export async function rejectRefund(
  id: string,
  note: string,
): Promise<RefundDecisionResult> {
  if (!note || note.trim().length < 3) {
    return {
      success: false,
      error: "Motif du refus requis (3 caracteres min).",
    };
  }
  return decideRefund(id, "REJECTED", note);
}
