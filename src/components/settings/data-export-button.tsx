"use client";

import { useTransition } from "react";
import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast-helper";
import { exportMyData } from "@/actions/data-export";
import { cn } from "@/lib/utils";

// =============================================================================
// DataExportButton — déclenche l'export RGPD des données de l'utilisateur et
// télécharge un fichier JSON côté navigateur.
// =============================================================================

interface DataExportButtonProps {
  label?: string;
  className?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
}

export function DataExportButton({
  label = "Télécharger toutes vos données",
  className,
  variant = "outline",
}: DataExportButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleExport = () => {
    startTransition(async () => {
      const res = await exportMyData();
      if (!res.success || !res.data) {
        toast.error(res.error ?? "Export impossible. Réessayez.");
        return;
      }
      try {
        const blob = new Blob([JSON.stringify(res.data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = res.filename ?? "kaza-mes-donnees.json";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast.success("Vos données ont été téléchargées.");
      } catch {
        toast.error("Le téléchargement a échoué.");
      }
    });
  };

  return (
    <Button
      type="button"
      variant={variant}
      onClick={handleExport}
      disabled={isPending}
      className={cn("gap-2", className)}
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" aria-hidden="true" />
      )}
      {label}
    </Button>
  );
}
