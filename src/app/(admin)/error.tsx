"use client";

// =============================================================================
// KAZA - Error Boundary (segment admin)
//
// Variante avec plus de contexte technique (digest, message brut) — utile
// pour les operateurs internes qui pourront remonter l'incident a l'equipe
// produit/dev.
// =============================================================================

import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface AdminErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: AdminErrorProps) {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.error("[admin/error]", error);
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-lg">
        <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="size-7 text-kaza-error" />
          </div>

          <div className="space-y-1.5">
            <h2 className="font-heading text-lg font-bold text-foreground">
              Une erreur est survenue
            </h2>
            <p className="text-sm text-muted-foreground">
              La console d&apos;administration a rencontré un problème.
              Notez les informations ci-dessous avant de contacter l&apos;équipe
              technique.
            </p>
          </div>

          {/* Détails techniques (admin uniquement) */}
          <div className="w-full rounded-md border bg-muted/50 p-3 text-left">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Détails techniques
            </p>
            <p className="mt-1 break-words text-xs font-mono text-foreground">
              {error.message || "Erreur sans message"}
            </p>
            {error.digest && (
              <p className="mt-1 text-[11px] font-mono text-muted-foreground">
                Digest&nbsp;: <span className="select-all">{error.digest}</span>
              </p>
            )}
          </div>

          <div className="mt-2 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
            <Button onClick={reset} variant="default">
              <RefreshCw className="mr-1.5 size-4" />
              Réessayer
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin">
                <Home className="mr-1.5 size-4" />
                Retour à la console
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
