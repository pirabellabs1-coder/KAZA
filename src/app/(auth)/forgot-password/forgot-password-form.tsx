"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, MailCheck, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  requestPasswordResetCode,
  verifyPasswordResetCode,
} from "@/actions/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [resent, setResent] = useState(false);

  // Étape 1 — demande du code par email.
  function onRequest(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!EMAIL_RE.test(email.trim())) {
      setError("Veuillez entrer une adresse email valide.");
      return;
    }
    startTransition(async () => {
      const result = await requestPasswordResetCode(email.trim());
      if (result?.error) {
        setError(result.error);
        return;
      }
      // On passe à l'étape code même si l'email n'existe pas (anti-énumération).
      setCode("");
      setStep("reset");
    });
  }

  // Étape 2 — vérification du code + nouveau mot de passe.
  function onReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(code.trim())) {
      setError("Entrez le code à 6 chiffres reçu par email.");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    startTransition(async () => {
      const result = await verifyPasswordResetCode(
        email.trim(),
        code.trim(),
        password,
      );
      if (result?.error) {
        setError(result.error);
        return;
      }
      if (result?.success) {
        router.push(result.redirectTo ?? "/login");
        router.refresh();
      }
    });
  }

  function resendCode() {
    setError(null);
    setResent(false);
    startTransition(async () => {
      const result = await requestPasswordResetCode(email.trim());
      if (result?.error) setError(result.error);
      else setResent(true);
    });
  }

  // ---- Étape « reset » ----
  if (step === "reset") {
    return (
      <form onSubmit={onReset} className="space-y-5">
        <button
          type="button"
          onClick={() => {
            setStep("email");
            setError(null);
          }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Changer d&apos;adresse email
        </button>

        <div className="flex flex-col items-center gap-3 rounded-lg border border-kaza-blue/20 bg-kaza-blue/5 p-5 text-center">
          <MailCheck className="size-9 text-kaza-blue" />
          <p className="text-sm text-muted-foreground">
            Si un compte existe pour{" "}
            <span className="font-medium text-kaza-navy">{email}</span>, un code
            à 6 chiffres vient d&apos;être envoyé. Saisissez-le puis choisissez
            un nouveau mot de passe.
          </p>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {resent && !error && (
          <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Un nouveau code vient d&apos;être envoyé.
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="reset-code">Code de vérification</Label>
          <Input
            id="reset-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            className="text-center text-2xl font-bold tracking-[0.5em]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reset-password">Nouveau mot de passe</Label>
          <Input
            id="reset-password"
            type="password"
            placeholder="Min. 8 caractères"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reset-confirm">Confirmer le mot de passe</Label>
          <Input
            id="reset-confirm"
            type="password"
            placeholder="********"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Réinitialisation...
            </>
          ) : (
            "Réinitialiser mon mot de passe"
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Vous n&apos;avez rien reçu ?{" "}
          <button
            type="button"
            onClick={resendCode}
            disabled={isPending}
            className="font-medium text-kaza-blue hover:underline disabled:opacity-50"
          >
            Renvoyer le code
          </button>
        </p>
      </form>
    );
  }

  // ---- Étape « email ----
  return (
    <form onSubmit={onRequest} className="space-y-4">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="votre@email.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Envoi du code...
          </>
        ) : (
          "Recevoir un code"
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link
          href="/login"
          className="font-medium text-kaza-blue transition-colors hover:underline"
        >
          Retour à la connexion
        </Link>
      </p>
    </form>
  );
}
