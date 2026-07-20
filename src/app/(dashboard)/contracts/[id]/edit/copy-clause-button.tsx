"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast-helper";

// =============================================================================
// Kaabo — Copier une clause standard dans le presse-papier
// =============================================================================
// La bibliothèque de clauses est rendue côté serveur ; ce bouton permet de
// copier le texte d'une clause pour le coller dans l'éditeur au centre.
// =============================================================================

export function CopyClauseButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Clause copiée — collez-la dans une section.");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copie impossible.");
    }
  };

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="mt-2 h-7 w-full text-[11px]"
      onClick={copy}
    >
      {copied ? (
        <>
          <Check className="mr-1 size-3" />
          Copiée
        </>
      ) : (
        <>
          <Copy className="mr-1 size-3" />
          Copier la clause
        </>
      )}
    </Button>
  );
}
