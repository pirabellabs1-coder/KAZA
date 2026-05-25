import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Connexion",
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-heading text-2xl font-bold text-kaza-navy">
          Connexion
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Connectez-vous a votre compte KAZA
        </p>
      </div>

      <LoginForm />
    </div>
  );
}
