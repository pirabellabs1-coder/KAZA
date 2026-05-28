import type { Metadata } from "next";
import Link from "next/link";
import {
  Briefcase,
  Building2,
  GraduationCap,
  Home,
  Zap,
} from "lucide-react";

import { FadeIn } from "@/components/shared/fade-in";

import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Inscription",
};

const ROLES = [
  {
    icon: Home,
    label: "Locataire",
    description: "Trouvez votre logement",
  },
  {
    icon: Building2,
    label: "Propriétaire",
    description: "Publiez vos annonces",
  },
  {
    icon: GraduationCap,
    label: "Étudiant",
    description: "Colocations & frais",
  },
  {
    icon: Briefcase,
    label: "Agence",
    description: "Espace pro B2B",
  },
];

export default function SignupPage() {
  return (
    <div className="space-y-8">
      <FadeIn delay={0}>
        <div className="space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-kaza-green/10 px-3 py-1 text-xs font-medium text-kaza-green">
            <Zap className="size-3" />
            Accès instantané — sans validation admin
          </span>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-kaza-navy sm:text-4xl">
            Créez votre compte KAZA en 30 secondes
          </h1>
          <p className="text-sm text-muted-foreground">
            Rejoignez la plus grande communauté immobilière d&apos;Afrique de
            l&apos;Ouest. Activation immédiate, redirection automatique.
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={100}>
        <div className="grid grid-cols-2 gap-2">
          {ROLES.map(({ icon: Icon, label, description }) => (
            <div
              key={label}
              className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/30 p-3 transition-colors hover:border-kaza-blue/40 hover:bg-kaza-blue/5"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-kaza-navy/5 text-kaza-navy">
                <Icon className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-kaza-navy">
                  {label}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </FadeIn>

      <FadeIn delay={200}>
        <SignupForm />
      </FadeIn>

      <FadeIn delay={300}>
        <p className="text-center text-sm text-muted-foreground">
          Déjà un compte ?{" "}
          <Link
            href="/login"
            className="font-semibold text-kaza-blue transition-colors hover:underline"
          >
            Se connecter
          </Link>
        </p>
      </FadeIn>
    </div>
  );
}
