"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginFormData } from "@/validators/auth";
import { login, verifyMfaLogin } from "@/actions/auth";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaCode, setMfaCode] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(data: LoginFormData) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await login(data);
        if (result?.error) {
          setError(result.error);
          return;
        }
        if (result?.mfaRequired) {
          setMfaStep(true);
          return;
        }
        if (result?.success) {
          router.push(result.redirectTo ?? "/dashboard");
          router.refresh();
        }
      } catch (err) {
        setError(
          err instanceof Error && err.message
            ? `Impossible de joindre le serveur : ${err.message}`
            : "Impossible de joindre le serveur. Réessayez dans un instant.",
        );
      }
    });
  }

  function submitMfa(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const result = await verifyMfaLogin(mfaCode);
        if (result?.error) {
          setError(result.error);
          return;
        }
        if (result?.success) {
          router.push(result.redirectTo ?? "/dashboard");
          router.refresh();
        }
      } catch {
        setError("Impossible de vérifier le code. Réessayez.");
      }
    });
  }

  // Étape 2FA : saisie du code de l'application d'authentification.
  if (mfaStep) {
    return (
      <form onSubmit={submitMfa} className="space-y-4">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="mfa-code">Code de vérification</Label>
          <p className="text-sm text-muted-foreground">
            Entrez le code à 6 chiffres affiché par votre application
            d&apos;authentification.
          </p>
          <Input
            id="mfa-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="123456"
            value={mfaCode}
            onChange={(e) =>
              setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            className="text-center font-mono text-lg tracking-widest"
            autoFocus
          />
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Vérification...
            </>
          ) : (
            "Vérifier et se connecter"
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => {
            setMfaStep(false);
            setMfaCode("");
            setError(null);
          }}
          disabled={isPending}
        >
          Retour
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Error Banner */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="votre@email.com"
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Mot de passe</Label>
          <Link
            href="/forgot-password"
            className="text-xs text-kaza-blue transition-colors hover:underline"
          >
            Mot de passe oublie ?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="********"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      {/* Submit */}
      <Button type="submit" className="w-full" size="lg" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Connexion en cours...
          </>
        ) : (
          "Se connecter"
        )}
      </Button>
    </form>
  );
}
