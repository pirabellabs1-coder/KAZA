"use client";

// =============================================================================
// KAZA - Error Boundary (segment main / pages publiques)
//
// Capture les erreurs runtime sur les pages publiques (accueil, recherche,
// fiche propriete, etc.). Variante neutre pour visiteurs non connectes.
// =============================================================================

import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface MainErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MainError({ error, reset }: MainErrorProps) {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.error("[main/error]", error);
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="size-7 text-kaza-error" />
          </div>

          <div className="space-y-1.5">
            <h2 className="font-heading text-lg font-bold text-foreground">
              Une erreur est survenue
            </h2>
            <p className="text-sm text-muted-foreground">
              Nous n&apos;avons pas pu afficher cette page. Vérifiez votre
              connexion ou réessayez dans un instant.
            </p>
          </div>

          <div className="mt-2 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
            <Button onClick={reset} variant="default">
              <RefreshCw className="mr-1.5 size-4" />
              Réessayer
            </Button>
            <Button asChild variant="outline">
              <Link href="/">
                <Home className="mr-1.5 size-4" />
                Retour à l&apos;accueil
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
