"use client";

import { useState } from "react";
import { Download, Loader2, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast-helper";
import { getContractPdfUrl } from "@/actions/contracts";

interface ContractDownloadActionsProps {
  contractId: string;
  contractNumber: string;
}

/**
 * Boutons de téléchargement / impression du contrat.
 * - "Télécharger PDF" : récupère une URL signée Supabase Storage (10 min) via
 *   la server action `getContractPdfUrl` puis ouvre le PDF dans un nouvel onglet.
 * - "Imprimer" : déclenche window.print() sur la page de prévisualisation.
 */
export function ContractDownloadActions({
  contractId,
  contractNumber,
}: ContractDownloadActionsProps) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const res = await getContractPdfUrl({ contractId });
      if (res.success && res.url) {
        window.open(res.url, "_blank", "noopener,noreferrer");
        toast.success(`Contrat ${contractNumber} ouvert dans un nouvel onglet.`);
      } else {
        toast.error(
          res.success ? "Lien indisponible." : res.error ?? "Téléchargement impossible.",
        );
      }
    } catch {
      toast.error("Une erreur est survenue lors du téléchargement.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        className="w-full justify-start bg-kaza-blue hover:bg-kaza-blue/90"
        onClick={handleDownload}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <Download className="mr-2 size-4" />
        )}
        Télécharger PDF
      </Button>
      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={() => window.print()}
      >
        <Printer className="mr-2 size-4" />
        Imprimer
      </Button>
    </div>
  );
}
