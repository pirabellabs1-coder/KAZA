// =============================================================================
// KAZA — Admin / Export CSV des paiements (Route Handler GET)
// =============================================================================
// Génère un export CSV RÉEL des paiements de la plateforme :
//   colonnes : id, date, montant (FCFA), statut, méthode.
//
// Sécurité : réservé au rôle ADMIN (double-garde côté handler en plus du
// middleware /admin/*). Lecture directe de la table `payments` via le client
// Supabase serveur — aucune donnée de démo.
// =============================================================================

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { toCsv, csvResponse } from "@/lib/export/csv";

export const dynamic = "force-dynamic";

// Libellés FR des enums DB pour un CSV lisible par la compta.
const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  PROCESSING: "En cours",
  COMPLETED: "Payé",
  FAILED: "Échoué",
  REFUNDED: "Remboursé",
};

const METHOD_LABELS: Record<string, string> = {
  MOBILE_MONEY: "Mobile Money",
  BANK_TRANSFER: "Virement bancaire",
  CARD: "Carte bancaire",
  WALLET: "Portefeuille KAZA",
  CASH: "Espèces",
};

export async function GET(): Promise<Response> {
  // 1. Garde ADMIN.
  const user = await getCurrentDisplayUser();
  if (!user) {
    return new Response("Authentification requise", { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return new Response("Accès réservé aux administrateurs", { status: 403 });
  }

  // 2. Lecture des paiements réels.
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("id, amount, status, payment_method, payment_date, created_at")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    console.error("[admin-finance-export] payments:", error.message);
    return new Response("Erreur lors de la lecture des paiements", {
      status: 500,
    });
  }

  // 3. Construction du CSV.
  const headers = ["ID", "Date", "Montant (FCFA)", "Statut", "Méthode"];
  const rows = (data ?? []).map((row) => {
    const rawDate =
      (row.payment_date as string | null) ??
      (row.created_at as string | null) ??
      null;
    const date = rawDate ? new Date(rawDate).toISOString().slice(0, 10) : "";
    const statusKey = String(row.status ?? "");
    const methodKey = String(row.payment_method ?? "");
    return [
      String(row.id ?? ""),
      date,
      Number(row.amount ?? 0),
      STATUS_LABELS[statusKey] ?? statusKey,
      METHOD_LABELS[methodKey] ?? (methodKey || "—"),
    ];
  });

  const csv = toCsv(headers, rows);
  const today = new Date().toISOString().slice(0, 10);
  return csvResponse(`kaza-paiements-${today}`, csv);
}
