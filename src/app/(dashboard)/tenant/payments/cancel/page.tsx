import type { Metadata } from "next";
import Link from "next/link";
import { XCircle, ArrowLeft, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

// =============================================================================
// KAZA - Page Annulation paiement
// =============================================================================

export const metadata: Metadata = {
  title: "Paiement annulé",
};

interface CancelPageProps {
  searchParams: Promise<{ rentalId?: string; reason?: string }>;
}

export default async function PaymentCancelPage({
  searchParams,
}: CancelPageProps) {
  const params = await searchParams;
  const rentalId = params.rentalId;
  const reason = params.reason;

  const retryHref = rentalId
    ? `/tenant/payments/checkout?rentalId=${rentalId}`
    : "/tenant/payments/checkout";

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center py-12 text-center">
      {/* Icône annulation */}
      <div className="flex size-24 items-center justify-center rounded-full bg-destructive/10">
        <XCircle className="size-14 text-destructive" strokeWidth={2} />
      </div>

      {/* Titre */}
      <h1 className="mt-8 font-heading text-3xl font-bold text-foreground sm:text-4xl">
        Paiement annulé
      </h1>
      <p className="mt-3 max-w-md text-base text-muted-foreground">
        Votre paiement n&apos;a pas été finalisé. Aucun montant n&apos;a été
        débité de votre compte. Vous pouvez réessayer à tout moment.
      </p>

      {/* Raison éventuelle */}
      {reason && (
        <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-left">
          <p className="text-xs font-semibold uppercase tracking-wider text-destructive">
            Motif
          </p>
          <p className="mt-1 text-sm text-foreground">{reason}</p>
        </div>
      )}

      {/* Aide */}
      <div className="mt-8 flex w-full max-w-md items-start gap-3 rounded-xl border bg-card p-4 text-left">
        <HelpCircle className="mt-0.5 size-5 shrink-0 text-kaza-blue" />
        <div className="text-sm">
          <p className="font-semibold text-foreground">Besoin d&apos;aide ?</p>
          <p className="mt-1 text-muted-foreground">
            Vérifiez votre solde paiement intégré, votre connexion internet, puis
            réessayez. Notre équipe support reste disponible 7j/7.
          </p>
        </div>
      </div>

      {/* CTAs */}
      <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row">
        <Button
          asChild
          size="lg"
          className="flex-1 bg-kaza-blue text-white hover:bg-kaza-blue/90"
        >
          <Link href={retryHref}>Réessayer le paiement</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="flex-1">
          <Link href="/dashboard">
            <ArrowLeft className="size-4" />
            Retour au tableau de bord
          </Link>
        </Button>
      </div>

      <Button asChild variant="link" size="sm" className="mt-4">
        <Link href="/support">Contacter le support KAZA</Link>
      </Button>
    </div>
  );
}
