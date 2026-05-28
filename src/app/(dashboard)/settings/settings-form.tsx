"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * En-tête réutilisable pour les sous-pages de /settings.
 * Affiche un lien retour vers /settings, un titre et un sous-titre.
 */
export function SettingsHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-3">
      <Button asChild variant="ghost" size="sm" className="-ml-2 h-auto px-2 py-1">
        <Link href="/settings">
          <ArrowLeft className="mr-1 size-4" />
          Retour aux paramètres
        </Link>
      </Button>
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}
