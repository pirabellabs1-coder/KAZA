import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Inscription",
};

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <SignupForm />
      </Suspense>

      <p className="text-center text-sm text-muted-foreground">
        Déjà un compte ?{" "}
        <Link
          href="/login"
          className="font-semibold text-kaza-blue transition-colors hover:underline"
        >
          Se connecter
        </Link>
      </p>
    </div>
  );
}
