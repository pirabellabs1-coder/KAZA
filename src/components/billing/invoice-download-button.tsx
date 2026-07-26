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
  const isPaid = (inv.status ?? "").toUpperCase() === "PAID";
  // Le montant stocké est TTC ; on reconstitue HT et TVA pour la mention légale.
  const ttc = Number(inv.amount) || 0;
  const ht = Math.round(ttc / (1 + PIRABEL.vatRate / 100));
  const tva = ttc - ht;
  const clientDetails = client
    ? [client.address, client.rccm ? `RCCM ${client.rccm}` : "", client.ifu ? `IFU ${client.ifu}` : ""]
        .filter(Boolean)
        .map((l) => `<div class="cell-sub">${escapeHtml(l as string)}</div>`)
        .join("")
    : "";
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8" />
<title>Facture ${escapeHtml(inv.number)} — Kaabo</title>
<style>
  *{box-sizing:border-box}
  html,body{margin:0}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;color:#1f2937;background:#fff;padding:48px;font-size:13px;line-height:1.5}
  .doc{max-width:720px;margin:0 auto}
  .top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px}
  .brand{font-size:22px;font-weight:800;color:#1A3A52;letter-spacing:-.02em}
  .issuer{margin-top:6px;color:#6b7280;font-size:11px;line-height:1.6}
  .doc-meta{text-align:right}
  .doc-title{font-size:13px;font-weight:700;letter-spacing:.12em;color:#9ca3af;text-transform:uppercase}
  .doc-num{font-size:16px;font-weight:700;color:#1f2937;margin-top:2px}
  .doc-date{color:#6b7280;font-size:12px;margin-top:2px}
  .status{display:inline-block;margin-top:8px;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:600}
  .status.paid{background:#ecfdf5;color:#059669}
  .status.due{background:#fff7ed;color:#c2410c}
  .billto{margin-bottom:28px}
  .billto .lbl{font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#9ca3af;margin-bottom:4px}
  .billto .name{font-size:15px;font-weight:700;color:#1f2937}
  .cell-sub{color:#6b7280;font-size:12px}
  table{width:100%;border-collapse:collapse}
  thead th{text-align:left;font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#9ca3af;padding:0 0 8px;border-bottom:1px solid #e5e7eb}
  tbody td{padding:14px 0;border-bottom:1px solid #f3f4f6;font-size:13px}
  .r{text-align:right}
  .totals{margin:18px 0 0 auto;width:260px}
  .totals .row{display:flex;justify-content:space-between;padding:6px 0;color:#6b7280}
  .totals .grand{margin-top:6px;padding-top:12px;border-top:2px solid #1f2937;color:#1f2937;font-size:17px;font-weight:800}
  .pay{margin-top:28px;padding:12px 16px;background:#f9fafb;border-radius:8px;color:#4b5563;font-size:12px}
  .foot{margin-top:36px;padding-top:14px;border-top:1px solid #f3f4f6;color:#9ca3af;font-size:10.5px}
  @media print{body{padding:0}.doc{max-width:none}}
</style></head>
<body>
  <div class="doc">
    <div class="top">
      <div>
        <div class="brand">Kaabo</div>
        <div class="issuer">
          ${escapeHtml(PIRABEL.legalName)} · RCCM ${escapeHtml(PIRABEL.rccm)} · IFU ${escapeHtml(PIRABEL.ifu)}<br/>
          ${escapeHtml(PIRABEL.address)}<br/>
          ${escapeHtml(PIRABEL.email)}
        </div>
      </div>
      <div class="doc-meta">
        <div class="doc-title">Facture</div>
        <div class="doc-num">${escapeHtml(inv.number)}</div>
        <div class="doc-date">${formatDate(inv.issuedAt)}</div>
        <div class="status ${isPaid ? "paid" : "due"}">${escapeHtml(label)}</div>
      </div>
    </div>

    ${
      client
        ? `<div class="billto">
      <div class="lbl">Facturé à</div>
      <div class="name">${escapeHtml(client.name || "—")}</div>
      ${clientDetails}
    </div>`
        : ""
    }

    <table>
      <thead><tr><th>Désignation</th><th class="r">Qté</th><th class="r">P.U. HT</th><th class="r">Montant</th></tr></thead>
      <tbody>
        <tr>
          <td>${escapeHtml(inv.description ?? "Service Kaabo")}</td>
          <td class="r">1</td>
          <td class="r">${escapeHtml(formatPrice(ht))}</td>
          <td class="r">${escapeHtml(formatPrice(ht))}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals">
      <div class="row"><span>Total HT</span><span>${escapeHtml(formatPrice(ht))}</span></div>
      <div class="row"><span>TVA ${PIRABEL.vatRate}%</span><span>${escapeHtml(formatPrice(tva))}</span></div>
      <div class="row grand"><span>Total TTC</span><span>${escapeHtml(formatPrice(ttc))}</span></div>
    </div>

    ${
      isPaid || inv.paymentMethod
        ? `<div class="pay">${isPaid ? `Réglée le ${formatDate(inv.paidAt ?? inv.issuedAt)}` : "En attente de règlement"}${inv.paymentMethod ? ` · ${escapeHtml(inv.paymentMethod)}` : ""}</div>`
        : ""
    }

    <div class="foot">
      ${escapeHtml(PIRABEL.legalName)} — RCCM ${escapeHtml(PIRABEL.rccm)} · IFU ${escapeHtml(PIRABEL.ifu)} · TVA ${PIRABEL.vatRate}% · Montants en ${escapeHtml(inv.currency || "FCFA")}.
    </div>
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
