// =============================================================================
// KAZA - Admin / Transactions globales
// =============================================================================

import { Wallet, ArrowLeftRight, Percent, Landmark } from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { StatsGrid } from "@/components/admin/stats-grid";
import { formatPrice } from "@/lib/utils";
import { listAllPayments } from "@/lib/queries/admin-payments";
import { PaymentsTable } from "./payments-table";

export default async function AdminPaymentsPage() {
  const allPayments = await listAllPayments();

  // eslint-disable-next-line react-hooks/purity -- Server Component rendu une fois par requete / valeur temporelle stable — appel horloge acceptable ici
  const THIRTY_DAYS_AGO = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const successOnly = allPayments.filter((p) => p.status === "success");
  const revenue30d = successOnly
    .filter((p) => new Date(p.date).getTime() >= THIRTY_DAYS_AGO)
    .reduce((sum, p) => sum + p.amount, 0);
  const commission = Math.round(revenue30d * 0.03);
  const escrowActive = allPayments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-kaza-navy lg:text-3xl">
          Transactions globales
        </h1>
        <p className="text-sm text-muted-foreground">
          Vue agrégée de tous les paiements traités sur la plateforme.
        </p>
      </div>

      <StatsGrid cols={4}>
        <StatsCard
          title="Revenus 30j"
          value={formatPrice(revenue30d)}
          icon={Wallet}
          trend={{ label: "Sur paiements confirmés", type: "neutral" }}
        />
        <StatsCard
          title="Volume transactions"
          value={allPayments.length.toString()}
          icon={ArrowLeftRight}
          trend={{ label: "Toutes périodes confondues", type: "neutral" }}
        />
        <StatsCard
          title="Commission KAZA (3%)"
          value={formatPrice(commission)}
          icon={Percent}
          trend={{ label: "Sur transactions réussies", type: "neutral" }}
        />
        <StatsCard
          title="Fonds escrow actifs"
          value={formatPrice(escrowActive)}
          icon={Landmark}
          trend={{ label: "En attente de libération", type: "neutral" }}
        />
      </StatsGrid>

      <PaymentsTable rows={allPayments} />
    </div>
  );
}
