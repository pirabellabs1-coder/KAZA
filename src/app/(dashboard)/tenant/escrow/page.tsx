import type { Metadata } from "next";
import { ShieldCheck, Wallet, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

// =============================================================================
// KAZA - Page Fonds en séquestre (escrow)
//
// La liste des paiements en séquestre est aujourd'hui vide tant que la query
// Supabase `listTenantEscrowPayments` n'est pas branchée (table escrow_payments
// ou agrégation depuis payments + rentals). On affiche un empty state honnête
// plutôt que des montants de démonstration.
// =============================================================================

export const metadata: Metadata = {
  title: "Fonds en séquestre",
};

interface EscrowPaymentRow {
  id: string;
  amount: number;
  status: "held" | "released" | "disputed";
}

const ESCROW_PAYMENTS: EscrowPaymentRow[] = [];

export default function EscrowPage() {
  const totalHeld = ESCROW_PAYMENTS.filter((p) => p.status === "held").reduce(
    (sum, p) => sum + p.amount,
    0,
  );
  const totalReleased = ESCROW_PAYMENTS.filter(
    (p) => p.status === "released",
  ).reduce((sum, p) => sum + p.amount, 0);
  const disputedCount = ESCROW_PAYMENTS.filter(
    (p) => p.status === "disputed",
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
          Fonds en attente
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Suivez le statut de vos paiements en séquestre. Vos fonds sont
          sécurisés jusqu&apos;à la libération automatique au propriétaire.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex size-12 items-center justify-center rounded-lg bg-kaza-blue/10">
              <Wallet className="size-6 text-kaza-blue" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Total en séquestre
              </p>
              <p className="font-heading text-xl font-bold text-foreground">
                {formatPrice(totalHeld)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex size-12 items-center justify-center rounded-lg bg-kaza-green/10">
              <ShieldCheck className="size-6 text-kaza-green" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Total libéré ce mois
              </p>
              <p className="font-heading text-xl font-bold text-foreground">
                {formatPrice(totalReleased)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex size-12 items-center justify-center rounded-lg bg-destructive/10">
              <AlertTriangle className="size-6 text-destructive" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Litiges actifs
              </p>
              <p className="font-heading text-xl font-bold text-foreground">
                {disputedCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste — empty state */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center px-6 py-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-kaza-blue/10">
            <Wallet className="size-7 text-kaza-blue" />
          </div>
          <p className="mt-4 font-heading text-base font-semibold text-kaza-navy">
            Aucun paiement en séquestre
          </p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Vos paiements de loyer en attente de libération au propriétaire
            apparaîtront ici, avec leur date de libération automatique et la
            possibilité de signaler un problème.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
