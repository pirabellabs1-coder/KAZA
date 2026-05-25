"use client";

import { useState, useTransition } from "react";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PaymentMethodSelector,
  type PaymentMethod,
} from "@/components/payments/payment-method-selector";
import { initiateRentPayment } from "@/actions/payments";
import { formatPrice } from "@/lib/utils";
import { toast } from "@/components/ui/toast-helper";

// =============================================================================
// KAZA - Formulaire de paiement (client component)
// =============================================================================

interface CheckoutFormProps {
  rentalId: string;
  amountTotal: number;
}

export function CheckoutForm({ rentalId, amountTotal }: CheckoutFormProps) {
  const [method, setMethod] = useState<PaymentMethod>("mtn");
  const [phone, setPhone] = useState("");
  const [acceptCgu, setAcceptCgu] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isMobileMoney = method === "mtn" || method === "moov";
  const phoneValid =
    !isMobileMoney ||
    /^(\+229)?\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}$/.test(phone.replace(/\s/g, ""));
  const canSubmit = acceptCgu && phoneValid && !isPending;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!acceptCgu) {
      const msg = "Vous devez accepter les conditions générales pour continuer.";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (isMobileMoney && !phoneValid) {
      const msg = "Veuillez saisir un numéro de téléphone valide (+229).";
      setError(msg);
      toast.error(msg);
      return;
    }

    startTransition(async () => {
      try {
        const result = await initiateRentPayment({
          rentalId,
          provider: method === "visa" ? "kkiapay" : "fedapay",
        });

        if (!result.success || !result.checkoutUrl) {
          const msg =
            result.error ??
            "Impossible d'initier le paiement. Veuillez réessayer.";
          setError(msg);
          toast.error(msg);
          return;
        }

        toast.info("Redirection vers la page de paiement…");
        window.location.href = result.checkoutUrl;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Une erreur inattendue est survenue.";
        setError(message);
        toast.error(`Erreur de paiement : ${message}`);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Étape 1 : moyen de paiement */}
      <section className="space-y-3">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            1. Choisissez votre moyen de paiement
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sélectionnez l&apos;option qui vous convient le mieux.
          </p>
        </div>
        <PaymentMethodSelector value={method} onChange={setMethod} />
      </section>

      {/* Étape 2 : informations */}
      {isMobileMoney && (
        <section className="space-y-3">
          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground">
              2. Numéro Mobile Money
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Le numéro associé à votre compte{" "}
              {method === "mtn" ? "MTN" : "Moov"}.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Numéro de téléphone</Label>
            <div className="flex items-center gap-2">
              <div className="flex h-9 items-center rounded-md border border-input bg-muted/40 px-3 text-sm font-medium text-foreground">
                +229
              </div>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                placeholder="01 23 45 67"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel-national"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Vous recevrez un code de confirmation par SMS sur ce numéro.
            </p>
          </div>
        </section>
      )}

      {/* Étape 3 : CGU */}
      <section className="space-y-3">
        <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
          <input
            type="checkbox"
            id="cgu"
            checked={acceptCgu}
            onChange={(e) => setAcceptCgu(e.target.checked)}
            className="mt-0.5 size-4 cursor-pointer rounded border-input accent-kaza-blue"
          />
          <Label
            htmlFor="cgu"
            className="cursor-pointer text-sm font-normal leading-relaxed text-foreground"
          >
            J&apos;accepte les{" "}
            <a
              href="/legal/cgu"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-kaza-blue underline-offset-2 hover:underline"
            >
              conditions générales d&apos;utilisation
            </a>{" "}
            et la{" "}
            <a
              href="/legal/privacy"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-kaza-blue underline-offset-2 hover:underline"
            >
              politique de confidentialité
            </a>{" "}
            de KAZA, ainsi que la mise en séquestre des fonds.
          </Label>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={!canSubmit}
        className="w-full bg-kaza-blue text-white hover:bg-kaza-blue/90"
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Initialisation du paiement…
          </>
        ) : (
          <>
            <Lock className="size-4" />
            Payer {formatPrice(amountTotal)}
          </>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Paiement sécurisé par KAZA. Vos données sont chiffrées.
      </p>
    </form>
  );
}
