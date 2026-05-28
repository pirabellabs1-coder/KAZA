import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { FadeIn } from "@/components/shared/fade-in";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Connexion",
};

export default function LoginPage() {
  return (
    <div className="space-y-8">
      <FadeIn delay={0}>
        <div className="space-y-3">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-kaza-navy sm:text-4xl">
            Bon retour parmi nous
          </h1>
          <p className="text-sm text-muted-foreground">
            Connectez-vous pour accéder à votre tableau de bord, vos visites,
            vos paiements et bien plus.
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={100}>
        <div className="rounded-2xl border border-kaza-blue/15 bg-kaza-blue/5 p-3 text-[11px] text-muted-foreground">
          <p className="inline-flex items-center gap-1.5 font-medium text-kaza-navy">
            <ShieldCheck className="size-3.5 text-kaza-blue" />
            Connexion sécurisée via Supabase Auth · Aucun accès démo
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={200}>
        <LoginForm />
      </FadeIn>

      <FadeIn delay={300}>
        <p className="text-center text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link
            href="/signup"
            className="font-semibold text-kaza-blue transition-colors hover:underline"
          >
            Créer un compte gratuit
          </Link>
        </p>
      </FadeIn>
    </div>
  );
}
