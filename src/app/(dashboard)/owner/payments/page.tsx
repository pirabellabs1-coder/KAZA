import type { Metadata } from "next";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  Download,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
  ArrowDownRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatsCard } from "@/components/dashboard/stats-card";
import { fetchWithFallback } from "@/lib/data-fetcher";
import { createClient } from "@/lib/supabase/server";
import {
  mockPayments,
  mockRentals,
  getUserById,
  getPropertyById,
  getPropertiesByOwner,
} from "@/lib/mock-data";
import type { Payment } from "@/types/payments";
import { formatPrice, formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Paiements",
};

// Fallback dev quand Supabase est absent.
const MOCK_OWNER_ID = "u-002-owner-jean";

// Forme enrichie utilisée par l'UI.
type PaymentRow = Payment & {
  tenant: { id: string; first_name: string; last_name: string } | null;
  property: { id: string; title: string } | null;
};

// ---------------------------------------------------------------------------
// Chargement Supabase + fallback mock
// ---------------------------------------------------------------------------

async function loadOwnerPayments(): Promise<PaymentRow[]> {
  // TODO: type manquant - voir note dans queries/properties.ts.
  const supabase = (await createClient()) as unknown as SupabaseClient;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Jointure imbriquee : payments -> rentals -> properties (filtre owner_id)
  const { data, error } = await supabase
    .from("payments")
    .select(
      `
      *,
      rental:rentals!inner(
        id,
        property:properties!inner(id, title, owner_id)
      ),
      tenant:users!payments_user_id_fkey(id, first_name, last_name)
    `,
    )
    .eq("rental.property.owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Lecture des paiements impossible : ${error.message}`);
  }

  // Aplatissement : on remonte rental.property au niveau de la ligne.
  return (data ?? []).map((row) => {
    const r = row as unknown as Payment & {
      rental?: { property?: { id: string; title: string } | null } | null;
      tenant?: { id: string; first_name: string; last_name: string } | null;
    };
    return {
      ...r,
      property: r.rental?.property ?? null,
      tenant: r.tenant ?? null,
    };
  });
}

function loadOwnerPaymentsMock(): PaymentRow[] {
  const ownerPropertyIds = new Set(
    getPropertiesByOwner(MOCK_OWNER_ID).map((p) => p.id),
  );
  const ownerRentalIds = new Set(
    mockRentals
      .filter((r) => ownerPropertyIds.has(r.property_id))
      .map((r) => r.id),
  );

  return mockPayments
    .filter((p) => ownerRentalIds.has(p.rental_id))
    .map((payment) => {
      const rental = mockRentals.find((r) => r.id === payment.rental_id);
      const property = rental ? getPropertyById(rental.property_id) : undefined;
      const tenant = getUserById(payment.user_id);
      return {
        ...payment,
        property: property
          ? { id: property.id, title: property.title }
          : null,
        tenant: tenant
          ? {
              id: tenant.id,
              first_name: tenant.first_name,
              last_name: tenant.last_name,
            }
          : null,
      };
    });
}

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------

function getPaymentStatusBadge(status: string) {
  switch (status) {
    case "COMPLETED":
      return (
        <Badge className="gap-1 bg-kaza-green text-white hover:bg-kaza-green/90">
          <CheckCircle className="size-3" />
          Payé
        </Badge>
      );
    case "PENDING":
      return (
        <Badge className="gap-1 border-kaza-warning bg-kaza-warning/10 text-kaza-warning">
          <Clock className="size-3" />
          En attente
        </Badge>
      );
    case "FAILED":
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="size-3" />
          Échoué
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getPaymentMethodLabel(method: string): string {
  switch (method) {
    case "MOBILE_MONEY":
      return "Mobile Money";
    case "BANK_TRANSFER":
      return "Virement bancaire";
    case "CARD":
      return "Carte bancaire";
    default:
      return method;
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function OwnerPaymentsPage() {
  const payments = await fetchWithFallback<PaymentRow[]>(
    () => loadOwnerPayments(),
    () => loadOwnerPaymentsMock(),
  );

  const totalReceived = payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + Number(p.amount ?? 0), 0);

  const totalPending = payments
    .filter((p) => p.status === "PENDING")
    .reduce((sum, p) => sum + Number(p.amount ?? 0), 0);

  const pendingCount = payments.filter((p) => p.status === "PENDING").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Paiements
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Historique et suivi de vos paiements reçus
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Total reçu"
          value={formatPrice(totalReceived)}
          icon={ArrowDownRight}
          trend={{ label: "+12% ce mois", type: "positive" }}
        />
        <StatsCard
          title="En attente"
          value={formatPrice(totalPending)}
          icon={Clock}
          subtitle={`${pendingCount} paiement${pendingCount > 1 ? "s" : ""} en cours`}
        />
        <StatsCard
          title="Paiements ce mois"
          value={payments.length}
          icon={CreditCard}
          trend={{
            label: `${payments.length} transaction${payments.length > 1 ? "s" : ""}`,
            type: "neutral",
          }}
        />
      </div>

      {/* Desktop table */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des paiements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Locataire
                  </th>
                  <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Bien
                  </th>
                  <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Date
                  </th>
                  <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Montant
                  </th>
                  <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Méthode
                  </th>
                  <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Statut
                  </th>
                  <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => {
                  const { tenant, property } = payment;

                  return (
                    <tr
                      key={payment.id}
                      className="border-b last:border-0 transition-colors hover:bg-muted/50"
                    >
                      <td className="py-3 text-sm font-medium">
                        {tenant
                          ? `${tenant.first_name} ${tenant.last_name}`
                          : "Inconnu"}
                      </td>
                      <td className="py-3 text-sm text-muted-foreground">
                        {property?.title || "Bien inconnu"}
                      </td>
                      <td className="py-3 text-sm text-muted-foreground">
                        {payment.payment_date
                          ? formatDate(payment.payment_date)
                          : "--"}
                      </td>
                      <td className="py-3 text-sm font-semibold">
                        {formatPrice(payment.amount)}
                      </td>
                      <td className="py-3 text-sm text-muted-foreground">
                        {getPaymentMethodLabel(payment.payment_method)}
                      </td>
                      <td className="py-3">
                        {getPaymentStatusBadge(payment.status)}
                      </td>
                      <td className="py-3 text-right">
                        {payment.status === "COMPLETED" && (
                          <Button variant="ghost" size="icon-sm">
                            <Download className="size-4" />
                            <span className="sr-only">
                              Télécharger le reçu
                            </span>
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {payments.map((payment) => {
              const { tenant } = payment;

              return (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {tenant
                        ? `${tenant.first_name} ${tenant.last_name}`
                        : "Inconnu"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {payment.payment_date
                        ? formatDate(payment.payment_date)
                        : "En attente"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {formatPrice(payment.amount)}
                      </p>
                      {getPaymentStatusBadge(payment.status)}
                    </div>
                    {payment.status === "COMPLETED" && (
                      <Button variant="ghost" size="icon-sm">
                        <Download className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
