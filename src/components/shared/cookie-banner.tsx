"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";

import { Button } from "@/components/ui/button";

const STORAGE_KEY = "kaza-cookie-consent";

type Consent = "accepted" | "essential-only";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- setState intentionnel dans un effet (init/hydratation SSR-safe, abonnement navigateur ou souscription externe) — pattern correct, pas de cascade de rendu problematique
    if (!stored) setVisible(true);
  }, []);

  const save = (value: Consent) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ value, savedAt: new Date().toISOString() }),
    );
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-title"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl rounded-xl border border-border bg-white p-4 shadow-2xl md:bottom-6 md:left-6 md:right-auto md:max-w-md md:p-5"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-kaza-blue/10 text-kaza-blue">
          <Cookie className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 id="cookie-title" className="text-sm font-semibold">
            Cookies et confidentialité
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            KAZA utilise des cookies essentiels pour le bon fonctionnement du
            site et, avec votre accord, des cookies de mesure d&apos;audience
            anonyme.{" "}
            <Link
              href="/legal/cookies"
              className="font-medium text-kaza-blue underline-offset-2 hover:underline"
            >
              En savoir plus
            </Link>
            .
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              className="bg-kaza-navy hover:bg-kaza-navy/90"
              onClick={() => save("accepted")}
            >
              Tout accepter
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => save("essential-only")}
            >
              Essentiels uniquement
            </Button>
          </div>
        </div>
        <button
          type="button"
          aria-label="Fermer"
          onClick={() => save("essential-only")}
          className="shrink-0 text-muted-foreground transition hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
