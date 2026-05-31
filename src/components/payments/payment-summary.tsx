import { Building2, ShieldCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";

// =============================================================================
// KAZA - Récapitulatif du paiement (server component)
// =============================================================================

interface PaymentSummaryProps {
  propertyTitle: string;
  propertyAddress: string;
  propertyImageUrl?: string;
  periodLabel: string;
  monthlyRent: number;
  serviceFeeRate?: number; // defaut 3%
}

export function PaymentSummary({
  propertyTitle,
  propertyAddress,
  propertyImageUrl,
  periodLabel,
  monthlyRent,
  serviceFeeRate = 0.03,
}: PaymentSummaryProps) {
  const serviceFee = Math.round(monthlyRent * serviceFeeRate);
  const total = monthlyRent + serviceFee;

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle className="font-heading text-lg">
          Récapitulatif
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bloc propriété */}
        <div className="flex gap-3">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
            {propertyImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={propertyImageUrl}
                alt={propertyTitle}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-kaza-navy/10">
                <Building2 className="size-7 text-kaza-navy/60" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-semibold text-foreground">
              {propertyTitle}
            </p>
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
              {propertyAddress}
            </p>
            <p className="mt-1 text-xs font-medium text-kaza-blue">
              {periodLabel}
            </p>
          </div>
        </div>

        <Separator />

        {/* Détail prix */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Loyer mensuel</span>
            <span className="text-foreground">{formatPrice(monthlyRent)}</span>
          </div>
          {serviceFee > 0 && (
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Frais de service KAZA</span>
              <span className="text-foreground">{formatPrice(serviceFee)}</span>
            </div>
          )}
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">
            Total à payer
          </span>
          <span className="font-heading text-xl font-bold text-kaza-navy">
            {formatPrice(total)}
          </span>
        </div>

        {/* Mention escrow */}
        <div className="flex items-start gap-2 rounded-lg bg-kaza-green/10 p-3">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-kaza-green" />
          <p className="text-xs leading-relaxed text-foreground">
            <span className="font-semibold">Paiement sécurisé.</span> Les fonds
            sont conservés par KAZA en séquestre (escrow) et libérés au
            propriétaire après confirmation, garantissant votre protection.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
