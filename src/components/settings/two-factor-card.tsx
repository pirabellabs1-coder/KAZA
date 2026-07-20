"use client";

import { useEffect, useState, useTransition } from "react";
import { ShieldCheck, ShieldX, Loader2, KeyRound } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/components/ui/toast-helper";

// =============================================================================
// TwoFactorCard — Authentification à deux facteurs (TOTP) via Supabase MFA.
// Flux réel : enroll → QR code → vérification du code à 6 chiffres → actif.
// Désactivation via unenroll. Aucune donnée fictive.
// =============================================================================

type View = "loading" | "off" | "enrolling" | "on";

interface EnrollData {
  factorId: string;
  qrCode: string; // data URI SVG
  secret: string;
}

export function TwoFactorCard() {
  const [view, setView] = useState<View>("loading");
  const [enroll, setEnroll] = useState<EnrollData | null>(null);
  const [code, setCode] = useState("");
  const [activeFactorId, setActiveFactorId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // État initial : l'utilisateur a-t-il déjà un facteur TOTP vérifié ?
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (cancelled) return;
      if (error) {
        setView("off");
        return;
      }
      const verified = data?.totp?.[0];
      if (verified) {
        setActiveFactorId(verified.id);
        setView("on");
      } else {
        setView("off");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function startEnroll() {
    startTransition(async () => {
      const supabase = createClient();

      // Nettoie d'éventuels facteurs TOTP non vérifiés (tentatives passées).
      const { data: list } = await supabase.auth.mfa.listFactors();
      const stale = (list?.all ?? []).filter(
        (f) => f.factor_type === "totp" && f.status !== "verified",
      );
      for (const f of stale) {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `Kaabo ${new Date().toISOString().slice(0, 19)}`,
      });
      if (error || !data) {
        toast.error(error?.message ?? "Impossible de démarrer l'activation.");
        return;
      }
      setEnroll({
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
      });
      setCode("");
      setView("enrolling");
    });
  }

  function verifyEnroll() {
    if (!enroll) return;
    const cleaned = code.replace(/\s/g, "");
    if (!/^\d{6}$/.test(cleaned)) {
      toast.error("Entrez le code à 6 chiffres de votre application.");
      return;
    }
    startTransition(async () => {
      const supabase = createClient();
      const { data: challenge, error: cErr } =
        await supabase.auth.mfa.challenge({ factorId: enroll.factorId });
      if (cErr || !challenge) {
        toast.error(cErr?.message ?? "Échec de la vérification.");
        return;
      }
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId: enroll.factorId,
        challengeId: challenge.id,
        code: cleaned,
      });
      if (vErr) {
        toast.error("Code incorrect ou expiré. Réessayez.");
        return;
      }
      setActiveFactorId(enroll.factorId);
      setEnroll(null);
      setCode("");
      setView("on");
      toast.success("Double authentification activée.");
    });
  }

  function cancelEnroll() {
    if (!enroll) {
      setView("off");
      return;
    }
    const factorId = enroll.factorId;
    startTransition(async () => {
      const supabase = createClient();
      await supabase.auth.mfa.unenroll({ factorId });
      setEnroll(null);
      setCode("");
      setView("off");
    });
  }

  function disable2fa() {
    if (!activeFactorId) return;
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.mfa.unenroll({
        factorId: activeFactorId,
      });
      if (error) {
        toast.error(error.message ?? "Impossible de désactiver la 2FA.");
        return;
      }
      setActiveFactorId(null);
      setView("off");
      toast.success("Double authentification désactivée.");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-kaza-navy" />
          Authentification à 2 facteurs (2FA)
          {view === "on" && (
            <Badge className="bg-kaza-green text-white hover:bg-kaza-green/90">
              Activée
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Protégez votre compte avec une application d&apos;authentification
          (Google Authenticator, Authy, Microsoft Authenticator…). Un code à 6
          chiffres vous sera demandé à chaque connexion.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {view === "loading" && (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Chargement…
          </div>
        )}

        {view === "off" && (
          <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-border bg-muted/30 p-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium">Statut : désactivée</p>
              <p className="text-xs text-muted-foreground">
                Activez la 2FA pour empêcher tout accès même si votre mot de
                passe est compromis.
              </p>
            </div>
            <Button onClick={startEnroll} disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <ShieldCheck className="mr-2 size-4" />
              )}
              Activer la 2FA
            </Button>
          </div>
        )}

        {view === "enrolling" && enroll && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-4 rounded-lg border border-border p-4 sm:flex-row sm:items-start">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={enroll.qrCode}
                alt="QR code de configuration 2FA"
                className="size-44 shrink-0 rounded bg-white p-1"
              />
              <div className="space-y-2 text-sm">
                <p className="font-medium">1. Scannez ce QR code</p>
                <p className="text-muted-foreground">
                  Avec votre application d&apos;authentification. Vous pouvez
                  aussi saisir la clé manuellement :
                </p>
                <code className="block break-all rounded bg-muted px-2 py-1 text-xs">
                  {enroll.secret}
                </code>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="totp-code">
                2. Entrez le code à 6 chiffres affiché
              </Label>
              <div className="flex flex-wrap gap-2">
                <Input
                  id="totp-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="w-32 text-center font-mono text-lg tracking-widest"
                />
                <Button onClick={verifyEnroll} disabled={isPending}>
                  {isPending ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <KeyRound className="mr-2 size-4" />
                  )}
                  Vérifier & activer
                </Button>
                <Button
                  variant="ghost"
                  onClick={cancelEnroll}
                  disabled={isPending}
                >
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        )}

        {view === "on" && (
          <>
            <Alert>
              <ShieldCheck />
              <AlertTitle>Votre compte est protégé par la 2FA</AlertTitle>
              <AlertDescription>
                Un code de votre application d&apos;authentification vous sera
                demandé à chaque connexion. Conservez précieusement votre
                appareil — sans lui, vous devrez contacter le support pour
                réinitialiser l&apos;accès.
              </AlertDescription>
            </Alert>
            <Button
              variant="outline"
              onClick={disable2fa}
              disabled={isPending}
              className="text-rose-600 hover:text-rose-700"
            >
              {isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <ShieldX className="mr-2 size-4" />
              )}
              Désactiver la 2FA
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
