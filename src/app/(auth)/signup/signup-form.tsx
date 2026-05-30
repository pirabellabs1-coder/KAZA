"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  Home,
  GraduationCap,
  Loader2,
  Briefcase,
  Gift,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { signupSchema, type SignupFormData } from "@/validators/auth";
import { signup } from "@/actions/auth";

const roles = [
  {
    value: "OWNER" as const,
    label: "Propriétaire",
    description: "Je mets en location",
    icon: Building2,
  },
  {
    value: "TENANT" as const,
    label: "Locataire",
    description: "Je cherche un logement",
    icon: Home,
  },
  {
    value: "STUDENT" as const,
    label: "Étudiant",
    description: "Je cherche une colocation",
    icon: GraduationCap,
  },
  {
    value: "AGENCY" as const,
    label: "Agence",
    description: "Agence immobilière (B2B)",
    icon: Briefcase,
  },
];

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
      password: "",
      confirmPassword: "",
      role: undefined,
      referralCode: "",
    },
  });

  const selectedRole = watch("role");

  // Pre-remplit le code parrainage depuis ?ref=ABC123 (lien partage par
  // un ambassadeur). Normalise en majuscules.
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setValue("referralCode", ref.toUpperCase(), { shouldValidate: false });
    }
  }, [searchParams, setValue]);

  function onSubmit(data: SignupFormData) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await signup(data);
        if (result?.error) {
          setError(result.error);
          return;
        }
        if (result?.success) {
          // Compte créé → redirection immédiate vers l'espace
          router.push(result.redirectTo ?? "/dashboard");
          router.refresh();
        }
      } catch (err) {
        setError(
          err instanceof Error && err.message
            ? `Impossible de joindre le serveur d'inscription : ${err.message}`
            : "Impossible de joindre le serveur. Réessayez dans un instant.",
        );
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Error Banner */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Role Selector */}
      <div className="space-y-2">
        <Label>Je suis</Label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.value;
            return (
              <button
                key={role.value}
                type="button"
                onClick={() => setValue("role", role.value, { shouldValidate: true })}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-all",
                  isSelected
                    ? "border-kaza-blue bg-kaza-blue/5 text-kaza-blue"
                    : "border-border bg-white text-muted-foreground hover:border-kaza-blue/40 hover:bg-muted/50"
                )}
              >
                <Icon className="size-6" />
                <span className="text-xs font-medium">{role.label}</span>
              </button>
            );
          })}
        </div>
        {errors.role && (
          <p className="text-sm text-destructive">{errors.role.message}</p>
        )}
      </div>

      {/* First Name & Last Name */}
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
            <p className="text-sm text-destructive">
              {errors.lastName.message}
            </p>
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

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="phone">Téléphone</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="Votre numéro de téléphone"
          autoComplete="tel"
          aria-invalid={!!errors.phone}
          {...register("phone")}
        />
        {errors.phone && (
          <p className="text-sm text-destructive">{errors.phone.message}</p>
        )}
      </div>

      {/* Password */}
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

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="********"
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
          Recevez 500 KAZA Points de bienvenue supplementaires en
          utilisant un code.
        </p>
      </div>

      {/* Submit */}
      <Button type="submit" className="w-full" size="lg" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Creation en cours...
          </>
        ) : (
          "Creer mon compte"
        )}
      </Button>

    </form>
  );
}
