"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Crown, Diamond, Sparkles, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RevealOnScroll } from "@/components/shared/reveal-on-scroll";
import { SubscribeButton } from "@/components/subscriptions/subscribe-button";

const formatPrice = (value: number) =>
  `${new Intl.NumberFormat("fr-FR").format(value)} FCFA`;

const MONTHLY_FEATURES = [
  "Boost mensuel offert",
  "Analytics privées",
  "Support 24/7 < 1h",
  "Concierge personnel",
  "Badge Premium",
  "Stockage illimité",
];

const YEARLY_FEATURES = [
  "Tout le plan Mensuel inclus",
  "2 mois entièrement offerts",
  "Priorité réservation visites",
  "Invitations aux ventes flash",
  "Cadeau de bienvenue Premium",
  "Badge Plus Premium doré",
];

interface PlusPricingToggleProps {
  isAuthenticated: boolean;
  currentPlan?: string | null;
  manageHref?: string;
  /** Prix mensuel Kaabo Plus (PLUS_MONTHLY) — issu de la DB. */
  monthlyPriceFcfa?: number;
  /** Prix annuel Kaabo Plus (PLUS_YEARLY) — issu de la DB. */
  yearlyPriceFcfa?: number;
  /** Équivalent mensuel du plan annuel (PLUS_YEARLY.priceMonthly) — DB. */
  yearlyMonthlyEquivalentFcfa?: number;
}

export function PlusPricingToggle({
  isAuthenticated,
  currentPlan = null,
  manageHref = "/profile",
  monthlyPriceFcfa = 5_000,
  yearlyPriceFcfa = 50_000,
  yearlyMonthlyEquivalentFcfa = 3_900,
}: PlusPricingToggleProps) {
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");

  const monthlyPrice = formatPrice(monthlyPriceFcfa);
  const yearlyPrice = formatPrice(yearlyPriceFcfa);
  const yearlyEquivalent = formatPrice(yearlyMonthlyEquivalentFcfa);
  // Économie annuelle = 12 mois au tarif mensuel − tarif annuel (jamais négatif).
  const yearlySavings = formatPrice(
    Math.max(0, monthlyPriceFcfa * 12 - yearlyPriceFcfa),
  );

  const isMonthlyCurrent = currentPlan === "PLUS_MONTHLY";
  const isYearlyCurrent = currentPlan === "PLUS_YEARLY";

  return (
    <>
      {/* Toggle */}
      <div className="mb-12 flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white p-1.5 shadow-md">
          <button
            type="button"
            onClick={() => setBilling("monthly")}
            className={
              "rounded-full px-6 py-2.5 text-sm font-semibold transition-all " +
              (billing === "monthly"
                ? "bg-kaza-navy text-white shadow-lg"
                : "text-muted-foreground hover:text-kaza-navy")
            }
          >
            Mensuel
          </button>
          <button
            type="button"
            onClick={() => setBilling("yearly")}
            className={
              "relative rounded-full px-6 py-2.5 text-sm font-semibold transition-all " +
              (billing === "yearly"
                ? "bg-gradient-to-r from-amber-400 to-amber-500 text-kaza-navy shadow-lg"
                : "text-muted-foreground hover:text-kaza-navy")
            }
          >
            Annuel
            <span className="ml-2 inline-flex items-center rounded-full bg-kaza-green/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-kaza-green">
              -17%
            </span>
          </button>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Mensuel */}
        <RevealOnScroll>
          <div
            className={
              "relative flex h-full flex-col rounded-3xl border bg-white p-10 transition-all duration-500 hover:-translate-y-1 " +
              (billing === "monthly"
                ? "border-2 border-kaza-navy shadow-2xl"
                : "border-gray-200 opacity-80 shadow-md hover:opacity-100")
            }
          >
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-kaza-navy">
              <Zap className="size-4" />
              Sans engagement
            </div>
            <h3 className="font-heading text-2xl font-bold text-kaza-navy">
              Mensuel
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Résiliable à tout moment, en un clic.
            </p>
            <div className="mt-8 flex items-baseline gap-2">
              <span className="font-heading text-6xl font-bold text-kaza-navy">
                {monthlyPrice}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">/ mois</p>

            <ul className="mt-8 flex-1 space-y-3 text-sm">
              {MONTHLY_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 size-4 shrink-0 text-amber-500" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            {isMonthlyCurrent ? (
              <Button
                asChild
                size="lg"
                className="mt-10 w-full rounded-full bg-emerald-600 text-base font-semibold text-white hover:bg-emerald-700"
              >
                <Link href={manageHref}>
                  <Check className="mr-2 size-4" />
                  Plan actuel — Gérer
                </Link>
              </Button>
            ) : (
              <SubscribeButton
                plan="PLUS_MONTHLY"
                label="Choisir Mensuel"
                isAuthenticated={isAuthenticated}
                size="lg"
                className="mt-10 w-full rounded-full bg-kaza-navy text-base font-semibold text-white hover:bg-kaza-navy/90"
              />
            )}
          </div>
        </RevealOnScroll>

        {/* Annuel — mis en avant */}
        <RevealOnScroll delay={120}>
          <div
            className={
              "relative flex h-full flex-col overflow-hidden rounded-3xl border-2 bg-gradient-to-br from-amber-50 via-yellow-50/60 to-amber-50 p-10 transition-all duration-500 hover:-translate-y-1 " +
              (billing === "yearly"
                ? "border-amber-500 shadow-2xl ring-4 ring-amber-200/50"
                : "border-amber-200 opacity-80 shadow-md hover:opacity-100")
            }
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-20 size-48 rounded-full bg-gradient-to-br from-amber-300/30 to-yellow-300/0 blur-3xl"
            />
            <Badge className="absolute -top-4 left-1/2 -translate-x-1/2 border-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-kaza-navy shadow-xl">
              <Crown className="mr-1 size-3" />
              Le plus avantageux
            </Badge>

            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-700">
              <Diamond className="size-4" />2 mois offerts
            </div>
            <h3 className="font-heading text-2xl font-bold text-kaza-navy">
              Annuel
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              La meilleure formule pour profiter à plein.
            </p>
            <div className="mt-8 flex items-baseline gap-2">
              <span className="font-heading text-6xl font-bold text-kaza-navy">
                {yearlyPrice}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              / an · soit {yearlyEquivalent} / mois
            </p>
            <p className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-kaza-green/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-kaza-green">
              <Sparkles className="size-3" />
              Vous économisez {yearlySavings}
            </p>

            <ul className="mt-8 flex-1 space-y-3 text-sm">
              {YEARLY_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-sm">
                    <Check className="size-3" />
                  </span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            {isYearlyCurrent ? (
              <Button
                asChild
                size="lg"
                className="mt-10 w-full rounded-full bg-emerald-600 text-base font-bold text-white hover:bg-emerald-700"
              >
                <Link href={manageHref}>
                  <Check className="mr-2 size-4" />
                  Plan actuel — Gérer
                </Link>
              </Button>
            ) : (
              <SubscribeButton
                plan="PLUS_YEARLY"
                label="Devenir Plus à l'année"
                icon={<Crown className="mr-2 size-4" />}
                isAuthenticated={isAuthenticated}
                size="lg"
                className="mt-10 w-full rounded-full border-0 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-base font-bold text-kaza-navy shadow-xl transition-all hover:scale-[1.02] hover:from-amber-300 hover:to-amber-400"
              />
            )}
          </div>
        </RevealOnScroll>
      </div>
    </>
  );
}
