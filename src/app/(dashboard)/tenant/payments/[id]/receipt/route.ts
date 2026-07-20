// =============================================================================
// Kaabo — Locataire / Reçu de paiement (Route Handler GET)
// =============================================================================
// Renvoie un reçu HTML imprimable pour un paiement donné.
//   - Auth requise (session Supabase).
//   - Le paiement doit appartenir au locataire connecté (filtre
//     `rental.tenant_id = auth.user.id`) — un locataire ne peut pas accéder
//     au reçu d'un autre utilisateur.
//   - Seuls les paiements confirmés (COMPLETED) donnent lieu à un reçu.
//
// La page HTML déclenche automatiquement la boîte d'impression du navigateur,
// d'où l'utilisateur peut « Enregistrer en PDF ».
// =============================================================================

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/queries";
import { formatPrice, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const METHOD_LABELS: Record<string, string> = {
  MOBILE_MONEY: "Mobile Money",
  BANK_TRANSFER: "Virement bancaire",
  CARD: "Carte bancaire",
  WALLET: "Portefeuille Kaabo",
  CASH: "Espèces",
};

// Échappe le HTML pour éviter toute injection via les champs texte.
function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return new Response("Authentification requise", { status: 401 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select(
      "id, amount, status, payment_method, payment_date, created_at, transaction_id, rental:rentals!inner(tenant_id, property:properties(title))",
    )
    .eq("id", id)
    .eq("rental.tenant_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[tenant-receipt] payment:", error.message);
    return new Response("Erreur lors de la lecture du paiement", {
      status: 500,
    });
  }

  if (!data) {
    return new Response("Reçu introuvable", { status: 404 });
  }

  const payment = data as unknown as {
    id: string;
    amount: number;
    status: string;
    payment_method: string;
    payment_date: string | null;
    created_at: string;
    transaction_id: string | null;
    rental?: { property?: { title?: string | null } | null } | null;
  };

  if (payment.status !== "COMPLETED") {
    return new Response("Reçu disponible uniquement pour un paiement confirmé", {
      status: 409,
    });
  }

  const propertyTitle = payment.rental?.property?.title ?? "Bien inconnu";
  const dateIso = payment.payment_date ?? payment.created_at;
  const dateLabel = dateIso ? formatDate(dateIso) : "—";
  const reference = payment.transaction_id ?? payment.id;
  const method =
    METHOD_LABELS[payment.payment_method] ?? payment.payment_method ?? "—";

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Reçu de paiement — Kaabo</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
      color: #1A3A52;
      margin: 0;
      padding: 40px 20px;
      background: #f5f6f8;
    }
    .receipt {
      max-width: 640px;
      margin: 0 auto;
      background: #fff;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 4px 24px rgba(26, 58, 82, 0.08);
    }
    .brand {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .brand span { color: #1976D2; }
    .head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #eef1f4;
      padding-bottom: 24px;
      margin-bottom: 24px;
    }
    .badge {
      display: inline-block;
      background: #4CAF50;
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    h1 { font-size: 18px; margin: 0 0 4px; }
    .muted { color: #6b7a89; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    td { padding: 12px 0; font-size: 14px; border-bottom: 1px solid #eef1f4; }
    td.label { color: #6b7a89; }
    td.value { text-align: right; font-weight: 600; }
    .total {
      margin-top: 24px;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      background: #f0f7ff;
      border-radius: 12px;
      padding: 18px 20px;
    }
    .total .amount { font-size: 26px; font-weight: 800; }
    .footer { margin-top: 32px; font-size: 11px; color: #98a4b0; text-align: center; }
    .actions { max-width: 640px; margin: 20px auto 0; text-align: center; }
    .actions button {
      background: #1A3A52; color: #fff; border: 0; border-radius: 999px;
      padding: 10px 24px; font-size: 14px; font-weight: 600; cursor: pointer;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .receipt { box-shadow: none; border-radius: 0; }
      .actions { display: none; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="head">
      <div>
        <div class="brand">Kaabo<span>.</span></div>
        <p class="muted">Reçu de paiement de loyer</p>
      </div>
      <span class="badge">Payé</span>
    </div>

    <h1>${esc(propertyTitle)}</h1>
    <p class="muted">Référence : ${esc(reference)}</p>

    <table>
      <tr>
        <td class="label">Date du paiement</td>
        <td class="value">${esc(dateLabel)}</td>
      </tr>
      <tr>
        <td class="label">Moyen de paiement</td>
        <td class="value">${esc(method)}</td>
      </tr>
      <tr>
        <td class="label">Identifiant transaction</td>
        <td class="value">${esc(payment.id)}</td>
      </tr>
    </table>

    <div class="total">
      <span class="muted">Montant total</span>
      <span class="amount">${esc(formatPrice(payment.amount))}</span>
    </div>

    <p class="footer">
      Ce reçu est généré automatiquement par Kaabo et fait foi du paiement.
      Pour toute question, contactez le support Kaabo.
    </p>
  </div>

  <div class="actions">
    <button onclick="window.print()">Imprimer / Enregistrer en PDF</button>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store, max-age=0",
    },
  });
}
