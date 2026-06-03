"use client";

// =============================================================================
// KAZA - Error Boundary (segment dashboard)
//
// Capture les erreurs runtime des pages connectees (propriétaire, locataire,
// étudiant). Affiche un message FR et un bouton Réessayer qui appelle
// `reset()` pour re-rendre le segment fautif.
// =============================================================================

import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  // En dev on log dans la console pour aider au debug.
  if (process.env.NODE_ENV !== "production") {
     
    console.error("[dashboard/error]", error);
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
              Impossible de charger cette page de votre espace pour le moment.
              Veuillez réessayer dans quelques instants.
            </p>
          </div>

          <div className="mt-2 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
            <Button onClick={reset} variant="default">
              <RefreshCw className="mr-1.5 size-4" />
              Réessayer
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">
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
