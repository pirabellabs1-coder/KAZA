// =============================================================================
// KAZA — Admin / Transactions globales (server-only)
// Lecture agrégée de la table `payments` pour la vue admin. Best-effort :
// en cas d'erreur Supabase on logge et on retourne un tableau vide.
// =============================================================================

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import type {
  PaymentMethod,
  PaymentRow,
  PaymentStatus,
} from "@/app/(admin)/admin/payments/payments-table";

// Les relations FK ne sont pas exposées dans le client typé Database — on
// utilise un client loose pour les jointures imbriquées.
async function getLooseClient(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

// Mapping enum DB `payment_status` -> statut attendu par <PaymentsTable>.
function mapStatus(dbStatus: string): PaymentStatus {
  switch (dbStatus) {
    case "COMPLETED":
      return "success";
    case "FAILED":
      return "failed";
    case "REFUNDED":
      return "refunded";
    case "PENDING":
    case "PROCESSING":
    default:
      return "pending";
  }
}

// Mapping enum DB `payment_method` -> méthode attendue par <PaymentsTable>.
function mapMethod(dbMethod: string | null): PaymentMethod {
  switch (dbMethod) {
    case "CARD":
      return "card";
    case "WALLET":
      return "kaza_wallet";
    case "MOBILE_MONEY":
    case "BANK_TRANSFER":
    case "CASH":
    default:
      return "kaza_pay";
  }
}

function fullName(
  firstName?: string | null,
  lastName?: string | null,
): string {
  const value = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  return value.length > 0 ? value : "Utilisateur";
}

/**
 * Liste les derniers paiements de la plateforme (toutes propriétés / users),
 * mappés vers le type `PaymentRow` consommé par <PaymentsTable>.
 * Trié par `created_at` desc, limité à 200 lignes.
 */
export async function listAllPayments(): Promise<PaymentRow[]> {
  try {
    const supabase = await getLooseClient();
    const { data, error } = await supabase
      .from("payments")
      .select(
        `
        id, amount, status, payment_method, payment_date, created_at, user_id,
        rental:rentals(property:properties(id, title)),
        user:users!payments_user_id_fkey(first_name, last_name, email)
      `,
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("[admin-payments] listAllPayments:", error.message);
      return [];
    }

    return (data ?? []).map((row: Record<string, unknown>): PaymentRow => {
      const rental = (row.rental ?? null) as {
        property?: { id?: string | null; title?: string | null } | null;
      } | null;
      const user = (row.user ?? null) as {
        first_name?: string | null;
        last_name?: string | null;
        email?: string | null;
      } | null;
      const property = rental?.property ?? null;

      const date =
        (row.payment_date as string | null) ??
        (row.created_at as string | null) ??
        new Date().toISOString();

      return {
        id: String(row.id ?? ""),
        date,
        userName: fullName(user?.first_name, user?.last_name),
        userEmail: user?.email ?? "",
        propertyTitle: property?.title ?? "—",
        propertyId: property?.id ?? String(row.user_id ?? ""),
        amount: Number(row.amount ?? 0),
        status: mapStatus(String(row.status ?? "PENDING")),
        method: mapMethod((row.payment_method as string | null) ?? null),
      };
    });
  } catch (err) {
    console.error("[admin-payments] listAllPayments (exception):", err);
    return [];
  }
}
