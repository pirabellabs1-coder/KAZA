"use client";

import { Download } from "lucide-react";

import type { UserInvoice } from "@/lib/queries/subscriptions";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast-helper";
import { cn } from "@/lib/utils";
import { PIRABEL } from "@/lib/legal/pirabel";

export interface InvoiceClient {
  name: string;
  address?: string;
  rccm?: string;
  ifu?: string;
}

// =============================================================================
// InvoiceDownloadButton — génère une facture imprimable (HTML autonome) à
// partir des données réelles puis ouvre la boîte d'impression du navigateur
// (« Enregistrer au format PDF »). Si `pdfUrl` est présent (génération serveur
// future), on l'ouvre directement.
// =============================================================================

const STATUS_LABEL: Record<string, string> = {
  PAID: "Payée",
  PENDING: "En attente",
  FAILED: "Échouée",
  CANCELLED: "Annulée",
};

function statusLabel(status: string): string {
  return STATUS_LABEL[status?.toUpperCase()] ?? status ?? "—";
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("fr-FR");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildInvoiceHtml(
  inv: UserInvoice,
  client?: InvoiceClient,
): string {
  const label = statusLabel(inv.status);
  // Le montant stocké est TTC ; on reconstitue HT et TVA pour la mention légale.
  const ttc = Number(inv.amount) || 0;
  const ht = Math.round(ttc / (1 + PIRABEL.vatRate / 100));
  const tva = ttc - ht;
  const clientRows = client
    ? `<div style="margin-top:20px">
        <div class="muted" style="text-transform:uppercase;letter-spacing:.05em">Facturé à</div>
        <div style="font-weight:700;font-size:15px">${escapeHtml(client.name || "—")}</div>
        ${client.address ? `<div class="muted">${escapeHtml(client.address)}</div>` : ""}
        ${client.rccm ? `<div class="muted">RCCM : ${escapeHtml(client.rccm)}</div>` : ""}
        ${client.ifu ? `<div class="muted">IFU : ${escapeHtml(client.ifu)}</div>` : ""}
      </div>`
    : "";
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8" />
<title>Facture ${escapeHtml(inv.number)} — Kaabo</title>
<style>
  *{box-sizing:border-box;font-family:Arial,Helvetica,sans-serif}
  body{margin:0;padding:40px;color:#1A3A52}
  .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1976D2;padding-bottom:16px}
  .brand{font-size:28px;font-weight:800;color:#1A3A52}
  .brand span{color:#1976D2}
  .muted{color:#64748b;font-size:12px}
  h1{font-size:18px;margin:24px 0 4px}
  table{width:100%;border-collapse:collapse;margin-top:16px}
  td,th{padding:10px 8px;text-align:left;font-size:14px;border-bottom:1px solid #e2e8f0}
  th{background:#f1f5f9;text-transform:uppercase;font-size:11px;color:#64748b}
  .total{font-size:22px;font-weight:800;color:#1976D2}
  .badge{display:inline-block;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:600;background:#dcfce7;color:#15803d}
  .foot{margin-top:40px;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:16px}
  .totbox{margin-top:20px;margin-left:auto;width:280px}
  .totbox tr td{border:none;padding:4px 0}
</style></head>
<body>
  <div class="head">
    <div>
      <div class="brand">Kaabo<span>.</span></div>
      <div class="muted">Exploité par ${escapeHtml(PIRABEL.legalName)}</div>
      <div class="muted">RCCM : ${escapeHtml(PIRABEL.rccm)}${PIRABEL.ifu ? ` · IFU : ${escapeHtml(PIRABEL.ifu)}` : ""}</div>
      <div class="muted">${escapeHtml(PIRABEL.address)}</div>
      <div class="muted">${escapeHtml(PIRABEL.email)}</div>
    </div>
    <div style="text-align:right">
      <div style="font-weight:700;font-size:16px">FACTURE</div>
      <div class="muted">N° ${escapeHtml(inv.number)}</div>
      <div class="muted">Émise le ${formatDate(inv.issuedAt)}</div>
      ${inv.dueDate ? `<div class="muted">Échéance : ${formatDate(inv.dueDate)}</div>` : ""}
      <div style="margin-top:6px"><span class="badge">${escapeHtml(label)}</span></div>
    </div>
  </div>

  ${clientRows}

  <table>
    <thead><tr><th>Désignation</th><th style="text-align:center">Qté</th><th style="text-align:right">P.U. HT</th><th style="text-align:right">Montant HT</th></tr></thead>
    <tbody>
      <tr>
        <td>${escapeHtml(inv.description ?? "Service Kaabo")}</td>
        <td style="text-align:center">1</td>
        <td style="text-align:right">${escapeHtml(formatPrice(ht))}</td>
        <td style="text-align:right">${escapeHtml(formatPrice(ht))}</td>
      </tr>
    </tbody>
  </table>

  <table class="totbox">
    <tr><td class="muted">Total HT</td><td style="text-align:right">${escapeHtml(formatPrice(ht))}</td></tr>
    <tr><td class="muted">TVA (${PIRABEL.vatRate}%)</td><td style="text-align:right">${escapeHtml(formatPrice(tva))}</td></tr>
    <tr><td style="font-weight:700">Total TTC</td><td style="text-align:right" class="total">${escapeHtml(formatPrice(ttc))}</td></tr>
  </table>

  <table style="margin-top:24px">
    ${inv.paidAt ? `<tr><td>Payée le</td><td style="text-align:right">${formatDate(inv.paidAt)}</td></tr>` : ""}
    ${inv.paymentMethod ? `<tr><td>Moyen de paiement</td><td style="text-align:right">${escapeHtml(inv.paymentMethod)}</td></tr>` : ""}
  </table>

  <div class="foot">
    Facture émise par ${escapeHtml(PIRABEL.legalName)} (RCCM ${escapeHtml(PIRABEL.rccm)}), exploitant la plateforme Kaabo. Montants en ${escapeHtml(inv.currency || "FCFA")}, TVA au taux de ${PIRABEL.vatRate}%. En cas de retard de paiement, des pénalités au taux légal en vigueur peuvent s'appliquer. Document conservé électroniquement conformément au Code du numérique en République du Bénin. Réf. ${escapeHtml(inv.number)}.
  </div>
  <script>window.onload=function(){setTimeout(function(){window.print();},300);}<\/script>
</body></html>`;
}

export function openInvoiceDocument(
  inv: UserInvoice,
  client?: InvoiceClient,
): void {
  if (inv.pdfUrl) {
    window.open(inv.pdfUrl, "_blank", "noopener");
    return;
  }
  const win = window.open("", "_blank", "width=800,height=1000");
  if (!win) {
    toast.error("Autorisez les pop-ups pour générer la facture, puis réessayez.");
    return;
  }
  win.document.write(buildInvoiceHtml(inv, client));
  win.document.close();
  win.focus();
}

interface InvoiceDownloadButtonProps {
  invoice: UserInvoice;
  client?: InvoiceClient;
  label?: string;
  className?: string;
  size?: React.ComponentProps<typeof Button>["size"];
  variant?: React.ComponentProps<typeof Button>["variant"];
}

export function InvoiceDownloadButton({
  invoice,
  client,
  label = "PDF",
  className,
  size = "sm",
  variant = "ghost",
}: InvoiceDownloadButtonProps) {
  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      onClick={() => openInvoiceDocument(invoice, client)}
      className={cn("gap-1 text-kaza-blue hover:text-kaza-blue", className)}
    >
      <Download className="size-3.5" />
      {label}
    </Button>
  );
}
