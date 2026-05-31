import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaymentSummary } from "@/components/payments/payment-summary";
import { CheckoutForm } from "./checkout-form";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { listTenantRentals } from "@/lib/queries/tenant-activity";

// =============================================================================
// KAZA - Page Checkout (tunnel paiement loyer) — données réelles Supabase
// =============================================================================

export const metadata: Metadata = {
  title: "Paiement du loyer",
};

interface CheckoutPageProps {
  searchParams: Promise<{ rentalId?: string }>;
}

const MONTHS_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

export default async function CheckoutPage({
  searchParams,
}: CheckoutPageProps) {
  const params = await searchParams;
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login?redirect=/tenant/payments");

  // Vraies locations du locataire connecté.
  const rentals = await listTenantRentals(user.id);
  const rental =
    rentals.find((r) => r.id === params.rentalId) ?? rentals[0] ?? null;

  // Aucune location active → rien à payer (état vide honnête).
  if (!rental) {
    return (
      <div className="space-y-6">
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
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-card py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <ReceiptText className="size-6 text-muted-foreground" />
          </div>
          <h1 className="font-heading text-xl font-bold text-foreground">
            Aucun loyer à régler
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            Vous n&apos;avez pas encore de location active sur KAZA. Dès qu&apos;un
            bail sera signé, vos échéances de loyer apparaîtront ici.
          </p>
          <Button asChild variant="outline" className="mt-2">
            <Link href="/search">Trouver un logement</Link>
          </Button>
        </div>
      </div>
    );
  }

  const now = new Date();
  const periodLabel = `Loyer de ${MONTHS_FR[now.getMonth()]} ${now.getFullYear()}`;
  const rentalId = rental.id;
  // Le serveur facture exactement le loyer mensuel (pas de frais de service) :
  // le montant AFFICHÉ doit donc être égal au montant DÉBITÉ pour éviter toute
  // sous-facturation / incohérence avec le code promo (recalculé sur le loyer).
  const total = rental.monthlyRent;

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
            propertyTitle={rental.property.title}
            propertyAddress={rental.property.address}
            propertyImageUrl={rental.property.primaryPhotoUrl}
            periodLabel={periodLabel}
            monthlyRent={rental.monthlyRent}
            serviceFeeRate={0}
          />
        </div>
      </div>
    </div>
  );
}
