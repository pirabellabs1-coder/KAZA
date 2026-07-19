"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, Lock } from "lucide-react";

import { loginAsAdmin } from "@/actions/auth";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const res = await loginAsAdmin({ email: email.trim(), password });
        if (res?.error) {
          setError(res.error);
          return;
        }
        if (res?.success) {
          router.push(res.redirectTo ?? "/admin");
          router.refresh();
        }
      } catch {
        setError("Impossible de joindre le serveur. Réessayez.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label
          htmlFor="admin-email"
          className="text-sm font-medium text-slate-300"
        >
          Email administrateur
        </label>
        <input
          id="admin-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@kaza.africa"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-slate-500 outline-none transition-colors focus:border-kaza-green/60 focus:ring-1 focus:ring-kaza-green/40"
          required
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="admin-password"
          className="text-sm font-medium text-slate-300"
        >
          Mot de passe
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-slate-500 outline-none transition-colors focus:border-kaza-green/60 focus:ring-1 focus:ring-kaza-green/40"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-kaza-green px-4 py-2.5 font-semibold text-white transition-colors hover:bg-kaza-green/90 disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Vérification…
          </>
        ) : (
          <>
            <Lock className="size-4" />
            Accéder au centre de contrôle
          </>
        )}
      </button>

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
        <ShieldCheck className="size-3.5 text-kaza-green" />
        Accès strictement réservé aux administrateurs KAZA.
      </p>
    </form>
  );
}
