"use server";

import "server-only";

// =============================================================================
// KAZA — Génération de rapports réels (CSV/Excel) à partir des données Supabase.
// Espaces : agency, owner, student. Types selon l'espace. Renvoie un contenu
// CSV (BOM Excel) que le client télécharge.
// =============================================================================

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import {
  listOwnerPayments,
  listOwnerVisits,
} from "@/lib/queries/owner-activity";
import { computeAgencyCommissions } from "@/lib/queries/agency-b2b";
import {
  listStudentGroups,
  getGroupExpenses,
} from "@/lib/queries/student-expenses";

export interface ReportResult {
  success: boolean;
  error?: string;
  filename?: string;
  content?: string; // CSV (avec BOM)
}

function esc(v: unknown): string {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}

function toCsv(headers: string[], rows: Array<Array<unknown>>): string {
  const lines = [headers.map(esc).join(",")];
  for (const r of rows) lines.push(r.map(esc).join(","));
  return "﻿" + lines.join("\r\n");
}

function inRange(dateStr: string | null, from: string, to: string): boolean {
  if (!dateStr) return true;
  const d = new Date(dateStr).getTime();
  if (from && d < new Date(from).getTime()) return false;
  if (to && d > new Date(to).getTime() + 86_400_000) return false;
  return true;
}

export async function generateSpaceReport(input: {
  space: "agency" | "owner" | "student";
  type: string;
  from?: string;
  to?: string;
}): Promise<ReportResult> {
  const user = await getCurrentDisplayUser();
  if (!user) return { success: false, error: "Vous devez être connecté." };

  const from = input.from ?? "";
  const to = input.to ?? "";
  const stamp = (from || to ? `${from || "debut"}_${to || "fin"}` : "complet").replace(
    /[^0-9a-zA-Z_-]/g,
    "",
  );

  try {
    // ---- AGENCE / PROPRIÉTAIRE : financier (loyers) -------------------------
    if (input.type === "financial") {
      const payments = (await listOwnerPayments(user.id)).filter((p) =>
        inRange(p.paidAt ?? p.createdAt, from, to),
      );
      const rows = payments.map((p) => [
        new Date(p.paidAt ?? p.createdAt).toLocaleDateString("fr-FR"),
        p.propertyTitle,
        p.tenantName,
        p.amount,
        p.status,
        p.method ?? "",
      ]);
      const total = payments
        .filter((p) => p.status === "COMPLETED")
        .reduce((s, p) => s + p.amount, 0);
      rows.push(["", "", "TOTAL ENCAISSÉ", total, "", ""]);
      return {
        success: true,
        filename: `kaza-rapport-financier-${stamp}.csv`,
        content: toCsv(
          ["Date", "Bien", "Locataire", "Montant (FCFA)", "Statut", "Méthode"],
          rows,
        ),
      };
    }

    // ---- AGENCE / PROPRIÉTAIRE : activité (visites) -------------------------
    if (input.type === "activity") {
      const visits = (await listOwnerVisits(user.id)).filter((v) =>
        inRange(v.proposedDate ?? v.createdAt, from, to),
      );
      const rows = visits.map((v) => [
        v.proposedDate
          ? new Date(v.proposedDate).toLocaleDateString("fr-FR")
          : "",
        v.proposedTime ?? "",
        v.propertyTitle,
        v.requesterName,
        v.requesterEmail,
        v.status,
      ]);
      return {
        success: true,
        filename: `kaza-rapport-activite-${stamp}.csv`,
        content: toCsv(
          ["Date", "Heure", "Bien", "Demandeur", "Email", "Statut"],
          rows,
        ),
      };
    }

    // ---- AGENCE : commissions ----------------------------------------------
    if (input.type === "commissions" && input.space === "agency") {
      const data = await computeAgencyCommissions(user.id);
      const rows = data.lines.map((l) => [
        l.ownerName,
        l.propertyTitle,
        l.monthlyBase,
        `${l.commissionRate}%`,
        l.monthlyCommission,
        l.basis === "ACTIVE_RENT" ? "Loyer réel" : "Prix affiché",
      ]);
      rows.push([
        "",
        "TOTAL / mois",
        "",
        "",
        data.totalMonthlyCommission,
        "",
      ]);
      return {
        success: true,
        filename: `kaza-rapport-commissions-${stamp}.csv`,
        content: toCsv(
          [
            "Mandant",
            "Bien",
            "Base mensuelle",
            "Taux",
            "Commission / mois",
            "Base de calcul",
          ],
          rows,
        ),
      };
    }

    // ---- ÉTUDIANT : dépenses partagées -------------------------------------
    if (input.space === "student") {
      const groups = await listStudentGroups(user.id);
      const rows: Array<Array<unknown>> = [];
      for (const g of groups) {
        const data = await getGroupExpenses(g.id, user.id, g.members);
        for (const e of data.expenses) {
          if (!inRange(e.expenseDate, from, to)) continue;
          const myShare = e.shares.find((s) => s.userId === user.id);
          rows.push([
            g.name,
            new Date(e.expenseDate).toLocaleDateString("fr-FR"),
            e.title,
            e.category,
            e.paidByName,
            e.amountFcfa,
            myShare ? myShare.shareFcfa : "",
            myShare?.settled ? "Réglée" : "À régler",
          ]);
        }
      }
      return {
        success: true,
        filename: `kaza-rapport-depenses-${stamp}.csv`,
        content: toCsv(
          [
            "Colocation",
            "Date",
            "Dépense",
            "Catégorie",
            "Payé par",
            "Montant (FCFA)",
            "Ma part",
            "Statut",
          ],
          rows,
        ),
      };
    }

    return { success: false, error: "Type de rapport non pris en charge." };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Erreur de génération.",
    };
  }
}
