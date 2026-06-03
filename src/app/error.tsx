"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
        <AlertTriangle className="size-8 text-kaza-error" />
      </div>
      <h2 className="font-heading text-xl font-bold">
        Une erreur est survenue
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Nous nous excusons pour ce désagrément. Veuillez réessayer.
      </p>
      <Button onClick={reset} className="mt-6">
        Réessayer
      </Button>
    </div>
  );
}
