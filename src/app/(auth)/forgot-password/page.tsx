import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound } from "lucide-react";

import { FadeIn } from "@/components/shared/fade-in";

import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Mot de passe oublié",
};

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-8">
      <FadeIn delay={0}>
        <div className="space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-kaza-navy/5 px-3 py-1 text-xs font-medium text-kaza-navy">
            <KeyRound className="size-3" />
            Réinitialisation sécurisée
          </span>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-kaza-navy sm:text-4xl">
            Mot de passe oublié&nbsp;?
          </h1>
          <p className="text-sm text-muted-foreground">
            Entrez votre email, nous vous envoyons un lien sécurisé pour le
            réinitialiser. Le lien expire après 30 minutes.
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={100}>
        <ForgotPasswordForm />
      </FadeIn>

      <FadeIn delay={200}>
        <p className="text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="font-semibold text-kaza-blue transition-colors hover:underline"
          >
            ← Retour à la connexion
          </Link>
        </p>
      </FadeIn>
    </div>
  );
}
