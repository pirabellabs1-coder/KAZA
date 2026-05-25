import type { Metadata } from "next";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Mot de passe oublie",
};

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-heading text-2xl font-bold text-kaza-navy">
          Mot de passe oublie
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Entrez votre adresse email et nous vous enverrons un lien pour
          reinitialiser votre mot de passe.
        </p>
      </div>

      <ForgotPasswordForm />
    </div>
  );
}
