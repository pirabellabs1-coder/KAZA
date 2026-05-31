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

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { writeAuditLog } from "@/lib/audit/write-log";
import { refundFromEscrow } from "@/lib/escrow";

export interface RefundDecisionResult {
  success: boolean;
  error?: string;
}

type Decision = "APPROVED" | "REJECTED";

// ---------------------------------------------------------------------------
// Validation Zod des entrées admin
// ---------------------------------------------------------------------------
// `id` DOIT être un UUID (clé primaire de `refund_requests`). La `note` est
// libre mais bornée. Pour un rejet, le motif est requis (>= 3 caractères) car
// il est communiqué à l'utilisateur.

const approveSchema = z.object({
  id: z.string().uuid("Identifiant de demande invalide."),
  note: z.string().trim().max(1000).optional(),
});

const rejectSchema = z.object({
  id: z.string().uuid("Identifiant de demande invalide."),
  note: z
    .string()
    .trim()
    .min(3, "Motif du refus requis (3 caracteres min)."),
});

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

  // Si APPROUVÉ : déclenche le remboursement réel depuis l'escrow (renvoi des
  // fonds au locataire). refundFromEscrow gère le payout 2-étapes FedaPay et ne
  // touche l'escrow que s'il est encore HELD. Best-effort : on logue l'échec
  // sans invalider la décision (un retry manuel reste possible).
  const paymentId = (request.payment_id as string | null) ?? null;
  if (status === "APPROVED" && paymentId) {
    try {
      const res = await refundFromEscrow(
        paymentId,
        decisionNote ?? "Remboursement approuvé par l'administration.",
      );
      if (res.status !== "refunded") {
        console.error(
          "[refunds] refundFromEscrow statut inattendu:",
          res.status,
        );
      }
    } catch (e) {
      console.error(
        "[refunds] refundFromEscrow exception:",
        e instanceof Error ? e.message : e,
      );
    }
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
  const parsed = approveSchema.safeParse({ id, note });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides.",
    };
  }
  return decideRefund(parsed.data.id, "APPROVED", parsed.data.note);
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
  const parsed = rejectSchema.safeParse({ id, note });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides.",
    };
  }
  return decideRefund(parsed.data.id, "REJECTED", parsed.data.note);
}
