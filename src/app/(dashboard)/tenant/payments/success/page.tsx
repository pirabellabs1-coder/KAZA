import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Download, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// =============================================================================
// KAZA - Page Succès paiement
// =============================================================================

export const metadata: Metadata = {
  title: "Paiement réussi",
};

interface SuccessPageProps {
  searchParams: Promise<{ paymentId?: string }>;
}

export default async function PaymentSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const params = await searchParams;
  const paymentId = params.paymentId;

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center py-12 text-center">
      {/* Icône succès */}
      <div className="relative">
        <div
          aria-hidden="true"
          className="absolute inset-0 animate-ping rounded-full bg-kaza-green/20"
        />
        <div className="relative flex size-24 items-center justify-center rounded-full bg-kaza-green/15">
          <CheckCircle2
            className="size-14 text-kaza-green"
            strokeWidth={2}
          />
        </div>
      </div>

      {/* Titre */}
      <h1 className="mt-8 font-heading text-3xl font-bold text-foreground sm:text-4xl">
        Paiement réussi !
      </h1>
      <p className="mt-3 max-w-md text-base text-muted-foreground">
        Votre paiement a bien été reçu et placé en séquestre. Vous recevrez une
        confirmation par email et SMS dans quelques instants.
      </p>

      {/* Référence */}
      {paymentId && (
        <div className="mt-6 rounded-lg border border-kaza-green/30 bg-kaza-green/5 px-4 py-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Référence du paiement
          </p>
          <p className="mt-1 font-mono text-sm font-semibold text-foreground">
            {paymentId}
          </p>
        </div>
      )}

      {/* Étapes suivantes */}
      <div className="mt-8 w-full max-w-md rounded-xl border bg-card p-5 text-left">
        <h2 className="font-heading text-sm font-semibold text-foreground">
          Prochaines étapes
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-kaza-green/15 text-xs font-bold text-kaza-green">
              1
            </span>
            <span>Vos fonds sont conservés en sécurité par KAZA.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-kaza-green/15 text-xs font-bold text-kaza-green">
              2
            </span>
            <span>
              Le propriétaire reçoit le paiement après la période de
              confirmation.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-kaza-green/15 text-xs font-bold text-kaza-green">
              3
            </span>
            <span>
              Téléchargez votre reçu officiel à tout moment depuis votre
              historique.
            </span>
          </li>
        </ul>
      </div>

      {/* CTAs */}
      <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row">
        <Button
          asChild
          size="lg"
          className="flex-1 bg-kaza-blue text-white hover:bg-kaza-blue/90"
        >
          <Link href="/tenant/payments">
            Voir mes paiements
            <ArrowRight className="size-4" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="flex-1">
          <Link href="/dashboard">Retour au tableau de bord</Link>
        </Button>
      </div>

      {paymentId && (
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="mt-4 gap-1.5 text-muted-foreground"
        >
          <a
            href={`/tenant/payments/${paymentId}/receipt`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Download className="size-4" />
            Télécharger le reçu PDF
          </a>
        </Button>
      )}
    </div>
  );
}
