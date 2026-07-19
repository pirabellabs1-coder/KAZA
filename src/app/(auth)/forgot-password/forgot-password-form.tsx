"use client";

import { useState, useTransition } from "react";
import { Loader2, MailCheck } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// =============================================================================
// KAZA — Mot de passe oublié (flux natif Supabase, lien par email)
// On envoie un lien de réinitialisation via supabase.auth.resetPasswordForEmail.
// Le lien renvoie vers /reset-password où l'utilisateur choisit un nouveau
// mot de passe (voir reset-password-form.tsx).
// =============================================================================

export function ForgotPasswordForm() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!EMAIL_RE.test(email.trim())) {
      setError("Veuillez entrer une adresse email valide.");
      return;
    }
    startTransition(async () => {
      const { error: err } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: `${window.location.origin}/reset-password` },
      );
      if (err && /rate|too many|seconds/i.test(err.message)) {
        setError(
          "Trop de demandes en peu de temps. Réessayez dans quelques minutes.",
        );
        return;
      }
      // Anti-énumération : on affiche toujours la confirmation, qu'un compte
      // existe ou non pour cette adresse.
      if (err) console.error("[reset] resetPasswordForEmail:", err.message);
      setSent(true);
    });
  }

  // ---- Confirmation ----
  if (sent) {
    return (
      <div className="space-y-5 text-center">
        <div className="flex flex-col items-center gap-3 rounded-lg border border-kaza-blue/20 bg-kaza-blue/5 p-6">
          <MailCheck className="size-10 text-kaza-blue" />
          <div className="space-y-1">
            <p className="font-heading font-semibold text-kaza-navy">
              Vérifiez votre boîte mail
            </p>
            <p className="text-sm text-muted-foreground">
              Si un compte existe pour{" "}
              <span className="font-medium text-kaza-navy">{email}</span>, un
              lien de réinitialisation vient d&apos;être envoyé. Cliquez dessus
              pour choisir un nouveau mot de passe.
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Rien reçu au bout de quelques minutes ? Vérifiez vos spams, ou{" "}
          <button
            type="button"
            onClick={() => {
              setSent(false);
              setError(null);
            }}
            className="font-medium text-kaza-blue hover:underline"
          >
            réessayez
          </button>
          .
        </p>
      </div>
    );
  }

  // ---- Formulaire email ----
  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
            Envoi du lien...
          </>
        ) : (
          "Recevoir le lien de réinitialisation"
        )}
      </Button>
    </form>
  );
}
