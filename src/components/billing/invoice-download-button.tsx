"use client";

import { Download } from "lucide-react";

import type { UserInvoice } from "@/lib/queries/subscriptions";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast-helper";
import { cn } from "@/lib/utils";

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

export function buildInvoiceHtml(inv: UserInvoice): string {
  const label = statusLabel(inv.status);
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8" />
<title>Facture ${escapeHtml(inv.number)} — KAZA</title>
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
</style></head>
<body>
  <div class="head">
    <div>
      <div class="brand">KAZA<span>.</span></div>
      <div class="muted">Plateforme immobilière — PIRABEL LABS</div>
      <div class="muted">immobilierkaza@gmail.com</div>
    </div>
    <div style="text-align:right">
      <div style="font-weight:700">FACTURE</div>
      <div class="muted">N° ${escapeHtml(inv.number)}</div>
      <div class="muted">Émise le ${formatDate(inv.issuedAt)}</div>
    </div>
  </div>

  <h1>${escapeHtml(inv.description ?? "Abonnement / Service KAZA")}</h1>
  <span class="badge">${escapeHtml(label)}</span>

  <table>
    <thead><tr><th>Description</th><th>Statut</th><th style="text-align:right">Montant</th></tr></thead>
    <tbody>
      <tr>
        <td>${escapeHtml(inv.description ?? "Service KAZA")}</td>
        <td>${escapeHtml(label)}</td>
        <td style="text-align:right">${escapeHtml(formatPrice(inv.amount))}</td>
      </tr>
    </tbody>
  </table>

  <div style="margin-top:20px;text-align:right">
    <div class="muted">Total ${escapeHtml(inv.currency || "XOF")}</div>
    <div class="total">${escapeHtml(formatPrice(inv.amount))}</div>
  </div>

  <table style="margin-top:24px">
    <tr><td>Date d'émission</td><td style="text-align:right">${formatDate(inv.issuedAt)}</td></tr>
    ${inv.dueDate ? `<tr><td>Échéance</td><td style="text-align:right">${formatDate(inv.dueDate)}</td></tr>` : ""}
    ${inv.paidAt ? `<tr><td>Payée le</td><td style="text-align:right">${formatDate(inv.paidAt)}</td></tr>` : ""}
    ${inv.paymentMethod ? `<tr><td>Moyen de paiement</td><td style="text-align:right">${escapeHtml(inv.paymentMethod)}</td></tr>` : ""}
  </table>

  <div class="foot">
    Document généré automatiquement par KAZA. Pour toute question relative à cette
    facture, contactez immobilierkaza@gmail.com en précisant le numéro ${escapeHtml(inv.number)}.
  </div>
  <script>window.onload=function(){setTimeout(function(){window.print();},300);}<\/script>
</body></html>`;
}

export function openInvoiceDocument(inv: UserInvoice): void {
  if (inv.pdfUrl) {
    window.open(inv.pdfUrl, "_blank", "noopener");
    return;
  }
  const win = window.open("", "_blank", "width=800,height=1000");
  if (!win) {
    toast.error("Autorisez les pop-ups pour générer la facture, puis réessayez.");
    return;
  }
  win.document.write(buildInvoiceHtml(inv));
  win.document.close();
  win.focus();
}

interface InvoiceDownloadButtonProps {
  invoice: UserInvoice;
  label?: string;
  className?: string;
  size?: React.ComponentProps<typeof Button>["size"];
  variant?: React.ComponentProps<typeof Button>["variant"];
}

export function InvoiceDownloadButton({
  invoice,
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
      onClick={() => openInvoiceDocument(invoice)}
      className={cn("gap-1 text-kaza-blue hover:text-kaza-blue", className)}
    >
      <Download className="size-3.5" />
      {label}
    </Button>
  );
}
