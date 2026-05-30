import type { Metadata } from "next";

import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Réinitialiser le mot de passe — KAZA",
};

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto w-full max-w-md">
      <ResetPasswordForm />
    </div>
  );
}
