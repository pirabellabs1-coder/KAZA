"use client";

import { useEffect, useState, useTransition } from "react";
import { CheckCircle2, Loader2, Lock, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PaymentMethodSelector,
  type PaymentMethod,
} from "@/components/payments/payment-method-selector";
import { MomoPaymentPanel } from "@/components/payments/momo-payment-panel";
import {
  initiateRentPayment,
  payRentFromWallet,
  getMyWalletBalance,
} from "@/actions/payments";
import { applyPromoToReservation } from "@/actions/promo";
import { formatPrice } from "@/lib/utils";
import { toast } from "@/components/ui/toast-helper";

// =============================================================================
// KAZA - Formulaire de paiement (client component)
// =============================================================================

interface CheckoutFormProps {
  rentalId: string;
  amountTotal: number;
}

interface AppliedPromo {
  code: string;
  discount: number;
  total: number;
}

export function CheckoutForm({ rentalId, amountTotal }: CheckoutFormProps) {
  const [method, setMethod] = useState<PaymentMethod>("mobile_money");
  const [acceptCgu, setAcceptCgu] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Solde KAZA (wallet) de l'utilisateur courant.
  const [wallet, setWallet] = useState<{ balance: number; frozen: boolean }>({
    balance: 0,
    frozen: false,
  });
  useEffect(() => {
    let active = true;
    getMyWalletBalance()
      .then((w) => active && setWallet(w))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Code promo
  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
  const [isApplyingPromo, startPromoTransition] = useTransition();

  // Montant réellement dû après remise éventuelle.
  const payableAmount = appliedPromo ? appliedPromo.total : amountTotal;

  const walletSufficient = !wallet.frozen && wallet.balance >= payableAmount;
  const canSubmit =
    acceptCgu &&
    !isPending &&
    (method === "wallet" ? walletSufficient : true);

  function handleApplyPromo() {
    const code = promoInput.trim();
    setPromoError(null);
    if (!code) {
      setPromoError("Veuillez saisir un code promo.");
      return;
    }
    startPromoTransition(async () => {
      const result = await applyPromoToReservation(code, amountTotal);
      if (result.success && result.discount != null && result.total != null) {
        setAppliedPromo({
          code: result.code ?? code.toUpperCase(),
          discount: result.discount,
          total: result.total,
        });
        toast.success(
          `Code appliqué : -${formatPrice(result.discount)} de réduction.`,
        );
      } else {
        setAppliedPromo(null);
        const msg = result.error ?? "Code promo invalide.";
        setPromoError(msg);
        toast.error(msg);
      }
    });
  }

  function handleRemovePromo() {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoError(null);
  }

  // --- Paiement depuis le solde KAZA (wallet) ---
  function handleWalletSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!acceptCgu) {
      const msg = "Vous devez accepter les conditions générales pour continuer.";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (!walletSufficient) {
      const msg = "Solde KAZA insuffisant pour ce paiement.";
      setError(msg);
      toast.error(msg);
      return;
    }

    startTransition(async () => {
      try {
        const result = await payRentFromWallet({
          rentalId,
          promoCode: appliedPromo?.code,
        });
        if (!result.success) {
          const msg = result.error ?? "Le paiement a échoué. Réessayez.";
          setError(msg);
          toast.error(msg);
          return;
        }
        toast.success("Loyer payé depuis votre solde KAZA.");
        window.location.href = "/tenant/payments/success?method=wallet";
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
    <form onSubmit={handleWalletSubmit} className="space-y-6">
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
        <PaymentMethodSelector
          value={method}
          onChange={setMethod}
          walletBalance={wallet.balance}
          walletFrozen={wallet.frozen}
          payable={payableAmount}
        />
      </section>

      {/* Étape 2 : code promo */}
      <section className="space-y-3">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            2. Code promo (optionnel)
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Vous avez un code de réduction ? Saisissez-le ci-dessous.
          </p>
        </div>

        {appliedPromo ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-kaza-green/30 bg-kaza-green/5 p-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="size-4 shrink-0 text-kaza-green" />
              <span className="text-foreground">
                Code{" "}
                <span className="font-mono font-semibold">
                  {appliedPromo.code}
                </span>{" "}
                appliqué — vous économisez{" "}
                <span className="font-semibold text-kaza-green">
                  {formatPrice(appliedPromo.discount)}
                </span>
                .
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemovePromo}
              disabled={isPending}
              className="shrink-0 text-muted-foreground hover:text-destructive"
            >
              <X className="size-4" />
              <span className="sr-only">Retirer le code</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-stretch gap-2">
              <div className="relative flex-1">
                <Tag className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="promo"
                  value={promoInput}
                  onChange={(e) => {
                    setPromoInput(e.target.value.toUpperCase());
                    setPromoError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleApplyPromo();
                    }
                  }}
                  placeholder="BIENVENUE10"
                  className="pl-9 font-mono uppercase"
                  autoComplete="off"
                  disabled={isApplyingPromo || isPending}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleApplyPromo}
                disabled={isApplyingPromo || isPending || !promoInput.trim()}
              >
                {isApplyingPromo ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Appliquer"
                )}
              </Button>
            </div>
            {promoError && (
              <p className="text-xs text-destructive">{promoError}</p>
            )}
          </div>
        )}

        {appliedPromo && (
          <div className="space-y-1 rounded-lg border bg-muted/30 p-3 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Sous-total</span>
              <span>{formatPrice(amountTotal)}</span>
            </div>
            <div className="flex items-center justify-between text-kaza-green">
              <span>Réduction ({appliedPromo.code})</span>
              <span>-{formatPrice(appliedPromo.discount)}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-1 font-semibold text-foreground">
              <span>Total à payer</span>
              <span>{formatPrice(appliedPromo.total)}</span>
            </div>
          </div>
        )}
      </section>

      {/* Étape 4 : CGU */}
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
              href="/legal/confidentialite"
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

      {/* Étape finale : paiement selon le moyen choisi */}
      {method === "wallet" ? (
        <>
          <Button
            type="submit"
            size="lg"
            disabled={!canSubmit}
            className="w-full bg-kaza-blue text-white hover:bg-kaza-blue/90"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Paiement en cours…
              </>
            ) : (
              <>
                <Lock className="size-4" />
                Payer {formatPrice(payableAmount)} depuis mon solde
              </>
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Paiement sécurisé par KAZA. Vos données sont chiffrées.
          </p>
        </>
      ) : (
        <MomoPaymentPanel
          amount={payableAmount}
          disabled={!acceptCgu}
          initiate={(momo) =>
            initiateRentPayment({
              rentalId,
              promoCode: appliedPromo?.code,
              ...momo,
            })
          }
          onSuccess={() => {
            toast.success("Paiement confirmé. Votre location est activée.");
            window.location.href = "/tenant/payments/success?method=mobile_money";
          }}
        />
      )}
    </form>
  );
}
