"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast-helper";
import { resolveReport } from "@/actions/reports";

interface ResolveReportButtonProps {
  reportId: string;
  /** Si déjà clôturé, le bouton est masqué côté page : ce flag n'est qu'une garde. */
  disabled?: boolean;
}

/**
 * Bouton admin "Marquer traité" : passe le signalement au statut RESOLVED
 * via la server action `resolveReport`, puis rafraîchit la liste.
 */
export function ResolveReportButton({
  reportId,
  disabled = false,
}: ResolveReportButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleResolve(): void {
    startTransition(async () => {
      const result = await resolveReport(reportId, "RESOLVED");
      if (result.success) {
        toast.success("Signalement marqué comme traité.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={handleResolve}
      disabled={isPending || disabled}
      className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
    >
      {isPending ? (
        <Loader2 className="mr-2 size-4 animate-spin" />
      ) : (
        <Check className="mr-2 size-4" />
      )}
      Marquer traité
    </Button>
  );
}
