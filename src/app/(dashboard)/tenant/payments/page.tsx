import type { Metadata } from "next";
import {
  Download,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
  ArrowUpRight,
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
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/queries";
import { formatPrice, formatDate } from "@/lib/utils";
import type { Payment } from "@/types/payments";

export const metadata: Metadata = {
  title: "Historique Paiements",
};

interface PaymentRow extends Payment {
  property_title: string | null;
}

async function loadTenantPayments(): Promise<PaymentRow[]> {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("payments")
    .select("*, rental:rentals!inner(*, property:properties(id, title))")
    .eq("rental.tenant_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row: unknown) => {
    const r = row as Payment & {
      rental?: { property?: { title?: string | null } | null } | null;
    };
    return {
      ...r,
      property_title: r.rental?.property?.title ?? null,
    };
  });
}

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
      return "paiement intégré";
    case "BANK_TRANSFER":
      return "Virement bancaire";
    case "CARD":
      return "Carte bancaire";
    default:
      return method;
  }
}

export default async function TenantPaymentsPage() {
  const payments = await loadTenantPayments();

  const totalPaid = payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingAmount = payments
    .filter((p) => p.status === "PENDING")
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingCount = payments.filter((p) => p.status === "PENDING").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Historique des Paiements
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Consultez et suivez tous vos paiements de loyer
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Total payé"
          value={formatPrice(totalPaid)}
          icon={ArrowUpRight}
          trend={{ label: "À jour", type: "positive" }}
        />
        <StatsCard
          title="En attente"
          value={formatPrice(pendingAmount)}
          icon={Clock}
          subtitle={
            pendingCount > 0
              ? `${pendingCount} paiement${pendingCount > 1 ? "s" : ""} en cours`
              : "Aucun paiement en attente"
          }
        />
        <StatsCard
          title="Nombre de paiements"
          value={payments.length}
          icon={CreditCard}
        />
      </div>

      {/* Payment history */}
      <Card>
        <CardHeader>
          <CardTitle>Détail des paiements</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucun paiement enregistré pour le moment.
            </p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
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
                        Reçu
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="border-b last:border-0 transition-colors hover:bg-muted/50"
                      >
                        <td className="py-3 text-sm font-medium">
                          {payment.property_title || "Bien inconnu"}
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
                            <Button asChild variant="ghost" size="icon-sm">
                              <a
                                href={`/tenant/payments/${payment.id}/receipt`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Download className="size-4" />
                                <span className="sr-only">
                                  Télécharger le reçu
                                </span>
                              </a>
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 md:hidden">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {payment.property_title || "Bien inconnu"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {payment.payment_date
                          ? formatDate(payment.payment_date)
                          : "En attente"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getPaymentMethodLabel(payment.payment_method)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {formatPrice(payment.amount)}
                        </p>
                        <div className="mt-1">
                          {getPaymentStatusBadge(payment.status)}
                        </div>
                      </div>
                      {payment.status === "COMPLETED" && (
                        <Button asChild variant="ghost" size="icon-sm">
                          <a
                            href={`/tenant/payments/${payment.id}/receipt`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="size-4" />
                            <span className="sr-only">
                              Télécharger le reçu
                            </span>
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
