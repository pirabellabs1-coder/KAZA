"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Bouton client « Imprimer / PDF » — déclenche la boîte d'impression native
 * du navigateur, depuis laquelle l'admin peut choisir « Enregistrer en PDF ».
 * Évite un bouton inerte sans embarquer de moteur PDF côté serveur.
 */
export function PrintReportButton() {
  return (
    <Button
      onClick={() => window.print()}
      className="rounded-full bg-kaza-navy shadow-lg hover:bg-kaza-navy/90"
    >
      <Printer className="mr-2 h-4 w-4" />
      Imprimer / PDF
    </Button>
  );
}
