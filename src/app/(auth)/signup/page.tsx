import type { Metadata } from "next";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Inscription",
};

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-heading text-2xl font-bold text-kaza-navy">
          Creer un compte
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Rejoignez KAZA et trouvez votre logement ideal
        </p>
      </div>

      <SignupForm />
    </div>
  );
}
