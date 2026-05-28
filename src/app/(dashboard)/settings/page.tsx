import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  Bell,
  CreditCard,
  Lock,
  ChevronRight,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Paramètres",
};

const SECTIONS = [
  {
    href: "/settings/security",
    icon: ShieldCheck,
    title: "Sécurité",
    description: "Mot de passe, double authentification, sessions actives, journal de connexion.",
    color: "text-kaza-navy bg-kaza-navy/10",
  },
  {
    href: "/settings/notifications",
    icon: Bell,
    title: "Notifications",
    description: "Choisissez précisément comment vous souhaitez être prévenu (email, push, SMS).",
    color: "text-kaza-blue bg-kaza-blue/10",
  },
  {
    href: "/settings/billing",
    icon: CreditCard,
    title: "Facturation & paiements",
    description: "Méthodes de paiement, historique de facturation, adresse de facturation.",
    color: "text-kaza-green bg-kaza-green/10",
  },
  {
    href: "/settings/privacy",
    icon: Lock,
    title: "Confidentialité & données",
    description: "Téléchargez vos données, gérez la publicité et demandez la suppression de votre compte.",
    color: "text-amber-600 bg-amber-100",
  },
] as const;

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Paramètres
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gérez votre compte, vos préférences et la confidentialité de vos données.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href} className="group">
              <Card className="h-full transition-all hover:shadow-md group-hover:border-kaza-navy/30">
                <CardContent className="flex items-start gap-4 p-5">
                  <div
                    className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${section.color}`}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">
                        {section.title}
                      </h3>
                      <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {section.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
