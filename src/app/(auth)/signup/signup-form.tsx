"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  Gift,
  MailCheck,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/shared/phone-input";
import { cn } from "@/lib/utils";
import { signupSchema, type SignupFormData } from "@/validators/auth";
import { requestSignupCode, verifySignupCode } from "@/actions/auth";
import { ROLE_LIST, ROLE_META, type RoleValue } from "./roles";

type Step = "role" | "form" | "code";

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState<Step>("role");
  const [pending, setPending] = useState<SignupFormData | null>(null);
  const [code, setCode] = useState("");
  const [resent, setResent] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      country: "BJ",
      password: "",
      confirmPassword: "",
      role: undefined,
      referralCode: "",
    },
  });

  const selectedRole = watch("role") as RoleValue | undefined;
  const selectedCountry = watch("country") ?? "BJ";
  const phoneValue = watch("phone") ?? "";
  const theme = selectedRole ? ROLE_META[selectedRole] : null;

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setValue("referralCode", ref.toUpperCase(), { shouldValidate: false });
    }
    // Pré-sélection du rôle via ?role=OWNER
    const roleParam = searchParams.get("role")?.toUpperCase();
    if (
      roleParam &&
      ["TENANT", "OWNER", "STUDENT", "BUYER", "AGENCY"].includes(roleParam)
    ) {
      setValue("role", roleParam as RoleValue, { shouldValidate: true });
      setStep("form");
    }
  }, [searchParams, setValue]);

  function chooseRole(value: RoleValue) {
    setValue("role", value, { shouldValidate: true });
    setError(null);
    setStep("form");
  }

  // Étape « formulaire » — envoi du code de vérification.
  function onSubmit(data: SignupFormData) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await requestSignupCode(data);
        if (result?.error) {
          setError(result.error);
          return;
        }
        if (result?.success) {
          if (result.codeRequired === false) {
            router.push(result.redirectTo ?? "/dashboard");
            router.refresh();
            return;
          }
          setPending(data);
          setCode("");
          setStep("code");
        }
      } catch {
        setError("Impossible de joindre le serveur. Réessayez dans un instant.");
      }
    });
  }

  // Étape « code » — vérification + création du compte.
  function onVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!pending) return;
    setError(null);
    if (!/^\d{6}$/.test(code.trim())) {
      setError("Entrez le code à 6 chiffres reçu par email.");
      return;
    }
    startTransition(async () => {
      try {
        const result = await verifySignupCode(pending, code.trim());
        if (result?.error) {
          setError(result.error);
          return;
        }
        if (result?.success) {
          router.push(result.redirectTo ?? "/dashboard");
          router.refresh();
        }
      } catch {
        setError("Impossible de joindre le serveur. Réessayez dans un instant.");
      }
    });
  }

  function resendCode() {
    if (!pending) return;
    setError(null);
    setResent(false);
    startTransition(async () => {
      const result = await requestSignupCode(pending);
      if (result?.error) setError(result.error);
      else setResent(true);
    });
  }

  // =========================================================================
  // ÉTAPE 1 — CHOIX DU RÔLE
  // =========================================================================
  if (step === "role") {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-kaza-navy sm:text-3xl">
            Créez votre compte Kaabo
          </h1>
          <p className="text-sm text-muted-foreground">
            Pour commencer, dites-nous qui vous êtes. Votre espace s&apos;adapte
            à votre profil.
          </p>
        </div>

        <div className="stagger-children grid gap-3">
          {ROLE_LIST.map((r) => {
            const Icon = r.icon;
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => chooseRole(r.value)}
                className={cn(
                  "group flex items-center gap-4 rounded-2xl border-2 border-border bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md",
                  r.hoverBorder,
                )}
              >
                <div
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-xl",
                    r.softBg,
                    r.iconText,
                  )}
                >
                  <Icon className="size-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-base font-semibold text-kaza-navy">
                    {r.label}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {r.tagline}
                  </p>
                </div>
                <ChevronRight
                  className={cn(
                    "size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5",
                    r.iconText,
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // =========================================================================
  // ÉTAPE 3 — CODE EMAIL
  // =========================================================================
  if (step === "code" && pending) {
    return (
      <form onSubmit={onVerify} className="animate-fade-in space-y-5">
        <button
          type="button"
          onClick={() => {
            setStep("form");
            setError(null);
          }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Modifier mes informations
        </button>

        <div className="flex flex-col items-center gap-3 rounded-lg border border-kaza-blue/20 bg-kaza-blue/5 p-5 text-center">
          <MailCheck className="size-9 text-kaza-blue" />
          <div className="space-y-1">
            <p className="font-medium text-kaza-navy">Vérifiez votre email</p>
            <p className="text-sm text-muted-foreground">
              Nous avons envoyé un code à 6 chiffres à{" "}
              <span className="font-medium text-kaza-navy">
                {pending.email}
              </span>
              . Saisissez-le pour activer votre compte.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {resent && !error && (
          <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Un nouveau code vient d&apos;être envoyé.
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="signup-code">Code de vérification</Label>
          <Input
            id="signup-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            className="text-center text-2xl font-bold tracking-[0.5em]"
          />
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Vérification...
            </>
          ) : (
            "Activer mon compte"
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Vous n&apos;avez rien reçu ?{" "}
          <button
            type="button"
            onClick={resendCode}
            disabled={isPending}
            className="font-medium text-kaza-blue hover:underline disabled:opacity-50"
          >
            Renvoyer le code
          </button>
        </p>
      </form>
    );
  }

  // =========================================================================
  // ÉTAPE 2 — FORMULAIRE (thématisé par rôle)
  // =========================================================================
  const Icon = theme?.icon;
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="animate-fade-in space-y-5">
      {/* Bandeau du rôle sélectionné */}
      {theme && (
        <div
          className={cn(
            "flex items-center gap-3 rounded-2xl bg-gradient-to-r p-4 text-white",
            theme.gradient,
          )}
        >
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            {Icon && <Icon className="size-6" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-white/70">
              Inscription {theme.label}
            </p>
            <p className="truncate text-sm font-semibold">{theme.intro}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setStep("role");
              setError(null);
            }}
            className="shrink-0 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur transition-colors hover:bg-white/25"
          >
            Changer
          </button>
        </div>
      )}

      {errors.role && (
        <p className="text-sm text-destructive">{errors.role.message}</p>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Prénom & Nom */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="firstName">Prénom</Label>
          <Input
            id="firstName"
            type="text"
            placeholder="Jean"
            autoComplete="given-name"
            aria-invalid={!!errors.firstName}
            {...register("firstName")}
          />
          {errors.firstName && (
            <p className="text-sm text-destructive">
              {errors.firstName.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Nom</Label>
          <Input
            id="lastName"
            type="text"
            placeholder="Dupont"
            autoComplete="family-name"
            aria-invalid={!!errors.lastName}
            {...register("lastName")}
          />
          {errors.lastName && (
            <p className="text-sm text-destructive">{errors.lastName.message}</p>
          )}
        </div>
      </div>

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

      {/* Téléphone + pays */}
      <div className="space-y-2">
        <Label htmlFor="phone">Téléphone</Label>
        <PhoneInput
          id="phone"
          country={selectedCountry}
          onCountryChange={(iso) =>
            setValue("country", iso, { shouldValidate: true })
          }
          value={phoneValue}
          onChange={(full) => setValue("phone", full, { shouldValidate: true })}
          invalid={!!errors.phone}
          placeholder="Numéro de téléphone"
        />
        {errors.phone && (
          <p className="text-sm text-destructive">{errors.phone.message}</p>
        )}
      </div>

      {/* Mot de passe */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            type="password"
            placeholder="Min. 8 caractères"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmation</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
      </div>

      {/* Code de parrainage (optionnel) */}
      <div className="space-y-2">
        <Label htmlFor="referralCode" className="flex items-center gap-1.5">
          <Gift className="size-3.5 text-kaza-green" />
          Code de parrainage{" "}
          <span className="text-xs font-normal text-muted-foreground">
            (optionnel)
          </span>
        </Label>
        <Input
          id="referralCode"
          type="text"
          placeholder="Ex : MARK1234"
          autoComplete="off"
          aria-invalid={!!errors.referralCode}
          className="uppercase"
          {...register("referralCode")}
        />
        {errors.referralCode && (
          <p className="text-sm text-destructive">
            {errors.referralCode.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Recevez 500 Kaabo Points de bienvenue en utilisant un code.
        </p>
      </div>

      {/* Submit (couleur du rôle) */}
      <Button
        type="submit"
        size="lg"
        disabled={isPending}
        className={cn("w-full text-white", theme?.solidBg)}
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Envoi du code...
          </>
        ) : (
          <>
            Créer mon compte
            <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </form>
  );
}
