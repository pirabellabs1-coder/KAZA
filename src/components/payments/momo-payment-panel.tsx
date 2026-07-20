"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, Lock, Smartphone, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { checkPaymentStatus } from "@/actions/payments";
import {
  FEEXPAY_COUNTRIES,
  getCountry,
} from "@/lib/payments/feexpay-countries";
import type { MomoCheckoutFields, PaymentProvider } from "@/lib/payments/types";
import { cn, formatPrice } from "@/lib/utils";

// =============================================================================
// Kaabo — Panneau de paiement Mobile Money on-page (FeexPay)
// =============================================================================
// Brique reutilisable par tous les tunnels d'encaissement (loyer, recharge
// wallet, abonnement, boost, frais partages, acompte de vente).
//
// Flux :
//  1) L'utilisateur choisit son pays + operateur + saisit son numero.
//  2) `initiate` declenche la demande de paiement FeexPay -> renvoie un
//     paymentId + une reference.
//  3) On passe en mode « attente » : le client valide sur son telephone.
//     On POLL `checkPaymentStatus(paymentId)` toutes les 4 s (max ~2 min).
//  4) succeeded -> onSuccess() ; failed/timeout -> message + reessayer.
// =============================================================================

const POLL_INTERVAL_MS = 4000;
const POLL_MAX_ATTEMPTS = 30; // ~2 minutes

export interface MomoInitiateResult {
  success: boolean;
  paymentId?: string;
  reference?: string;
  error?: string;
}

export interface MomoPaymentPanelProps {
  /** Montant a payer (affichage). */
  amount: number;
  /** Declenche l'initiation cote serveur avec les champs Mobile Money. */
  initiate: (momo: MomoCheckoutFields) => Promise<MomoInitiateResult>;
  /** Appele lorsque le paiement est confirme (COMPLETED). */
  onSuccess: () => void;
  /** Provider a poller (defaut FeexPay). */
  provider?: PaymentProvider;
  /** Libelle du bouton (defaut « Payer »). */
  submitLabel?: string;
  /** Pays par defaut (code ISO-2, defaut "BJ"). */
  defaultCountry?: string;
  /** Desactive la soumission (ex : CGU non acceptees). */
  disabled?: boolean;
}

type Phase = "form" | "awaiting" | "failed";

export function MomoPaymentPanel({
  amount,
  initiate,
  onSuccess,
  provider = "feexpay",
  submitLabel,
  defaultCountry = "BJ",
  disabled = false,
}: MomoPaymentPanelProps) {
  const [countryCode, setCountryCode] = useState(defaultCountry);
  const country = getCountry(countryCode) ?? FEEXPAY_COUNTRIES[0];
  const [network, setNetwork] = useState(country.networks[0]?.reseau ?? "");
  const [phone, setPhone] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const paymentIdRef = useRef<string | null>(null);
  const attemptsRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reinitialise l'operateur quand le pays change.
  const handleCountryChange = useCallback((code: string) => {
    setCountryCode(code);
    const c = getCountry(code);
    setNetwork(c?.networks[0]?.reseau ?? "");
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  // Boucle de polling.
  const poll = useCallback(async () => {
    const paymentId = paymentIdRef.current;
    if (!paymentId) return;

    attemptsRef.current += 1;
    try {
      const res = await checkPaymentStatus(paymentId, provider);
      if (res.status === "succeeded") {
        clearTimer();
        onSuccess();
        return;
      }
      if (res.status === "failed") {
        clearTimer();
        setError(
          "Le paiement a échoué ou a été refusé. Vérifiez votre solde puis réessayez.",
        );
        setPhase("failed");
        return;
      }
    } catch {
      // On tolere les erreurs transitoires de polling.
    }

    if (attemptsRef.current >= POLL_MAX_ATTEMPTS) {
      clearTimer();
      setError(
        "Délai dépassé sans confirmation. Si vous avez validé le paiement, il sera pris en compte sous peu — sinon réessayez.",
      );
      setPhase("failed");
      return;
    }
    timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
  }, [provider, onSuccess, clearTimer]);

  async function handlePay() {
    setError(null);
    if (!phone.trim()) {
      setError("Veuillez saisir votre numéro de téléphone.");
      return;
    }
    if (!network) {
      setError("Veuillez choisir votre opérateur.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await initiate({ network, phone: phone.trim(), countryCode });
      if (!result.success) {
        setError(result.error ?? "Impossible d'initier le paiement.");
        setSubmitting(false);
        return;
      }
      // Succes immediat sans transaction (ex : plan gratuit) -> pas de polling.
      if (!result.paymentId) {
        setSubmitting(false);
        onSuccess();
        return;
      }
      paymentIdRef.current = result.paymentId;
      attemptsRef.current = 0;
      setPhase("awaiting");
      setSubmitting(false);
      timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Une erreur est survenue.",
      );
      setSubmitting(false);
    }
  }

  function handleRetry() {
    clearTimer();
    paymentIdRef.current = null;
    attemptsRef.current = 0;
    setError(null);
    setPhase("form");
  }

  // --- Ecran d'attente (validation sur le telephone) ---
  if (phase === "awaiting") {
    return (
      <div className="animate-fade-in flex flex-col items-center gap-4 rounded-lg border bg-muted/20 p-6 text-center">
        <div className="pulse-ring relative flex size-16 items-center justify-center rounded-full bg-kaza-blue/10 text-kaza-blue">
          <Smartphone className="relative z-10 size-8 text-kaza-blue" />
          <Loader2 className="absolute -right-1 -top-1 z-10 size-5 animate-spin text-kaza-green" />
        </div>
        <div className="space-y-1">
          <p className="font-heading font-semibold text-foreground">
            Validez le paiement sur votre téléphone
          </p>
          <p className="text-sm text-muted-foreground">
            Une demande de <strong>{formatPrice(amount)}</strong> a été envoyée
            au <strong>{phone}</strong>. Suivez les instructions (code USSD ou
            appli opérateur) pour confirmer.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          En attente de confirmation…
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleRetry}
          className="text-muted-foreground"
        >
          Annuler
        </Button>
      </div>
    );
  }

  // --- Ecran d'echec ---
  if (phase === "failed") {
    return (
      <div className="animate-fade-in flex flex-col items-center gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
        <XCircle className="size-10 text-destructive" />
        <p className="text-sm text-foreground">{error}</p>
        <Button type="button" onClick={handleRetry} variant="outline">
          Réessayer
        </Button>
      </div>
    );
  }

  // --- Formulaire (pays + operateur + numero) ---
  return (
    <div className="animate-fade-in space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="momo-country">Pays</Label>
        <Select value={countryCode} onValueChange={handleCountryChange}>
          <SelectTrigger id="momo-country">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FEEXPAY_COUNTRIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.flag} {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Opérateur : chips colorées par marque */}
      <div className="space-y-1.5">
        <Label>Opérateur</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {country.networks.map((n) => {
            const active = network === n.reseau;
            return (
              <button
                key={n.reseau}
                type="button"
                onClick={() => setNetwork(n.reseau)}
                className={cn(
                  "flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left text-sm font-medium transition-all",
                  active
                    ? "border-kaza-blue bg-kaza-blue/5 shadow-sm"
                    : "border-border text-muted-foreground hover:border-kaza-blue/40 hover:bg-muted/40",
                )}
                style={
                  active && n.color
                    ? { borderColor: n.color, backgroundColor: `${n.color}12` }
                    : undefined
                }
              >
                <span
                  className="inline-block size-3 shrink-0 rounded-full ring-2 ring-white"
                  style={{ backgroundColor: n.color ?? "#94a3b8" }}
                />
                <span className="truncate text-foreground">{n.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="momo-phone">Numéro Mobile Money</Label>
        <div className="flex items-stretch gap-2">
          <span className="inline-flex items-center rounded-md border bg-muted px-3 text-sm text-muted-foreground">
            +{country.dialCode}
          </span>
          <Input
            id="momo-phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setError(null);
            }}
            placeholder="Ex. 01 97 00 00 00"
            className="flex-1"
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        type="button"
        size="lg"
        onClick={handlePay}
        disabled={submitting || disabled}
        className="w-full bg-kaza-blue text-white hover:bg-kaza-blue/90"
      >
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Initialisation…
          </>
        ) : (
          <>
            <Lock className="size-4" />
            {submitLabel ?? `Payer ${formatPrice(amount)}`}
          </>
        )}
      </Button>

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <CheckCircle2 className="size-3 text-kaza-green" />
        Paiement sécurisé — vous validez directement sur votre téléphone.
      </p>
    </div>
  );
}
