import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { AdminLoginForm } from "./admin-login-form";

export const metadata: Metadata = {
  title: "Connexion administrateur — KAZA",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-kaza-navy px-4 py-12">
      {/* Halos décoratifs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-40 size-96 rounded-full bg-kaza-green/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-40 size-96 rounded-full bg-kaza-blue/20 blur-3xl"
      />

      <div className="relative w-full max-w-md">
        {/* En-tête */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-kaza-green/15 ring-1 ring-kaza-green/30">
            <ShieldCheck className="size-7 text-kaza-green" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl">
            KAZA · Centre de contrôle
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Portail d&apos;administration de la plateforme. Connectez-vous avec
            votre compte administrateur.
          </p>
        </div>

        {/* Carte */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl backdrop-blur sm:p-8">
          <AdminLoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          <Link href="/" className="hover:text-slate-300">
            ← Retour au site public
          </Link>
        </p>
      </div>
    </div>
  );
}
