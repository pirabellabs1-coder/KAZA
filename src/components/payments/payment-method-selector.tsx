"use client";

import { Check, Smartphone, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// KAZA - Sélecteur de moyen de paiement (paiement intégré + Carte)
// =============================================================================

export type PaymentMethod = "KAZA Pay" | "KAZA Wallet" | "visa";

interface PaymentMethodOption {
  id: PaymentMethod;
  name: string;
  description: string;
  fees: string;
  icon: typeof Smartphone;
  logoBg: string;
  logoText: string;
}

const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: "KAZA Pay",
    name: "KAZA Pay",
    description: "Paiement instantané via votre compte KAZA Pay",
    fees: "Frais 1,5%",
    icon: Smartphone,
    logoBg: "bg-yellow-400",
    logoText: "KAZA Pay",
  },
  {
    id: "KAZA Wallet",
    name: "KAZA Wallet",
    description: "Paiement instantané via votre compte KAZA Wallet",
    fees: "Frais 1,5%",
    icon: Smartphone,
    logoBg: "bg-sky-500",
    logoText: "KAZA Wallet",
  },
  {
    id: "visa",
    name: "Carte Visa / Mastercard",
    description: "Paiement sécurisé par carte bancaire",
    fees: "Frais 2,9% + 100 FCFA",
    icon: CreditCard,
    logoBg: "bg-kaza-navy",
    logoText: "VISA",
  },
];

interface PaymentMethodSelectorProps {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
}

export function PaymentMethodSelector({
  value,
  onChange,
}: PaymentMethodSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Moyen de paiement"
      className="grid gap-3"
    >
      {PAYMENT_METHODS.map((method) => {
        const isSelected = value === method.id;
        const Icon = method.icon;
        return (
          <button
            type="button"
            role="radio"
            aria-checked={isSelected}
            key={method.id}
            onClick={() => onChange(method.id)}
            className={cn(
              "group relative flex items-center gap-4 rounded-xl border-2 bg-card p-4 text-left transition-all",
              "hover:border-kaza-blue/60 hover:shadow-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kaza-blue/40",
              isSelected
                ? "border-kaza-blue bg-kaza-blue/5 shadow-sm"
                : "border-border"
            )}
          >
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white",
                method.logoBg
              )}
            >
              <span className="hidden sm:inline">{method.logoText}</span>
              <Icon className="size-5 sm:hidden" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">
                {method.name}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {method.description}
              </p>
              <p className="mt-1 text-xs font-medium text-kaza-blue">
                {method.fees}
              </p>
            </div>
            <div
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                isSelected
                  ? "border-kaza-blue bg-kaza-blue text-white"
                  : "border-muted-foreground/30"
              )}
              aria-hidden="true"
            >
              {isSelected && <Check className="size-3.5" />}
            </div>
          </button>
        );
      })}
    </div>
  );
}
