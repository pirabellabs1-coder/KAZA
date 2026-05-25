import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaymentSummary } from "@/components/payments/payment-summary";
import { CheckoutForm } from "./checkout-form";

// =============================================================================
// KAZA - Page Checkout (tunnel paiement loyer)
// =============================================================================

export const metadata: Metadata = {
  title: "Paiement du loyer",
};

interface CheckoutPageProps {
  searchParams: Promise<{ rentalId?: string }>;
}

// Mock data en attendant l'intégration Supabase
const MOCK_RENTAL = {
  id: "rental-001",
  propertyTitle: "Appartement 3 pièces - Cotonou Cocotomey",
  propertyAddress: "Quartier Cocotomey, Cotonou, Bénin",
  propertyImageUrl: undefined,
  periodLabel: "Loyer du 1er juin 2026",
  monthlyRent: 150000,
};

export default async function CheckoutPage({
  searchParams,
}: CheckoutPageProps) {
  const params = await searchParams;
  const rentalId = params.rentalId ?? MOCK_RENTAL.id;

  // En production : fetch Supabase via rentalId. Ici on utilise un mock.
  const rental = MOCK_RENTAL;
  const serviceFee = Math.round(rental.monthlyRent * 0.03);
  const total = rental.monthlyRent + serviceFee;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="w-fit gap-1.5 px-2 text-muted-foreground hover:text-foreground"
        >
          <Link href="/tenant/payments">
            <ArrowLeft className="size-4" />
            Retour aux paiements
          </Link>
        </Button>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
            Paiement du loyer
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Finalisez votre paiement en toute sécurité. Vos fonds sont
            protégés par notre système de séquestre.
          </p>
        </div>
      </div>

      {/* Layout 2 colonnes desktop */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Colonne gauche : formulaire */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <CheckoutForm rentalId={rentalId} amountTotal={total} />
        </div>

        {/* Colonne droite : récap */}
        <div>
          <PaymentSummary
            propertyTitle={rental.propertyTitle}
            propertyAddress={rental.propertyAddress}
            propertyImageUrl={rental.propertyImageUrl}
            periodLabel={rental.periodLabel}
            monthlyRent={rental.monthlyRent}
          />
        </div>
      </div>
    </div>
  );
}
