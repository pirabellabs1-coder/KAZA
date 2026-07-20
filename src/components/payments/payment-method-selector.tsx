"use client";

import Link from "next/link";
import { Check, Smartphone, Wallet } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";

// =============================================================================
// Kaabo — Sélecteur de moyen de paiement : Solde Kaabo (wallet) ou Mobile Money.
// =============================================================================

export type PaymentMethod = "wallet" | "mobile_money";

interface PaymentMethodSelectorProps {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
  /** Solde Kaabo disponible (FCFA). */
  walletBalance?: number;
  /** Wallet gelé ? */
  walletFrozen?: boolean;
  /** Montant à payer (pour vérifier la suffisance du solde). */
  payable: number;
  /** Lien de rechargement du solde. */
  topUpHref?: string;
}

export function PaymentMethodSelector({
  value,
  onChange,
  walletBalance = 0,
  walletFrozen = false,
  payable,
  topUpHref = "/tenant/wallet",
}: PaymentMethodSelectorProps) {
  const walletSufficient = !walletFrozen && walletBalance >= payable;

  return (
    <div role="radiogroup" aria-label="Moyen de paiement" className="grid gap-3">
      {/* ---- Solde Kaabo ---- */}
      <button
        type="button"
        role="radio"
        aria-checked={value === "wallet"}
        disabled={!walletSufficient}
        onClick={() => walletSufficient && onChange("wallet")}
        className={cn(
          "group relative flex items-center gap-4 rounded-xl border-2 bg-card p-4 text-left transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kaza-blue/40",
          !walletSufficient && "cursor-not-allowed opacity-60",
          walletSufficient && "hover:border-kaza-blue/60 hover:shadow-sm",
          value === "wallet"
            ? "border-kaza-blue bg-kaza-blue/5 shadow-sm"
            : "border-border",
        )}
      >
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-kaza-green/15 text-kaza-green">
          <Wallet className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Solde Kaabo</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Paiement instantané depuis votre solde — sans frais.
          </p>
          <p className="mt-1 text-xs font-medium text-kaza-navy">
            Disponible :{" "}
            <span
              className={cn(
                "font-semibold",
                walletSufficient ? "text-kaza-green" : "text-destructive",
              )}
            >
              {formatPrice(walletBalance)}
            </span>
            {walletFrozen && " (gelé)"}
          </p>
          {!walletSufficient && !walletFrozen && (
            <p className="mt-1 text-xs text-destructive">
              Solde insuffisant.{" "}
              <Link
                href={topUpHref}
                className="font-medium underline underline-offset-2"
                onClick={(e) => e.stopPropagation()}
              >
                Recharger
              </Link>
            </p>
          )}
        </div>
        <RadioDot checked={value === "wallet"} />
      </button>

      {/* ---- Mobile Money ---- */}
      <button
        type="button"
        role="radio"
        aria-checked={value === "mobile_money"}
        onClick={() => onChange("mobile_money")}
        className={cn(
          "group relative flex items-center gap-4 rounded-xl border-2 bg-card p-4 text-left transition-all",
          "hover:border-kaza-blue/60 hover:shadow-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kaza-blue/40",
          value === "mobile_money"
            ? "border-kaza-blue bg-kaza-blue/5 shadow-sm"
            : "border-border",
        )}
      >
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-kaza-blue/15 text-kaza-blue">
          <Smartphone className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Mobile Money</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            MTN MoMo, Moov Money, Celtiis… via paiement sécurisé.
          </p>
          <p className="mt-1 text-xs font-medium text-kaza-blue">
            Redirection vers la page de paiement sécurisée.
          </p>
        </div>
        <RadioDot checked={value === "mobile_money"} />
      </button>
    </div>
  );
}

function RadioDot({ checked }: { checked: boolean }) {
  return (
    <div
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
        checked
          ? "border-kaza-blue bg-kaza-blue text-white"
          : "border-muted-foreground/30",
      )}
      aria-hidden="true"
    >
      {checked && <Check className="size-3.5" />}
    </div>
  );
}
