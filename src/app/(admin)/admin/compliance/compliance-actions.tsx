"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast-helper";

/**
 * Bouton "Lancer une analyse de conformité".
 * Déclenche un `router.refresh()` qui ré-exécute le server component
 * (donc relit réellement les métriques live : KYC, RGPD, modération).
 */
export function ComplianceAnalyzeButton({ areaCount }: { areaCount: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [lastRun, setLastRun] = useState<string | null>(null);

  function handleAnalyze() {
    startTransition(() => {
      router.refresh();
      const now = new Date();
      setLastRun(
        now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      );
      toast.success(
        `Analyse terminée — ${areaCount} domaine${areaCount > 1 ? "s" : ""} de conformité vérifié${areaCount > 1 ? "s" : ""}.`,
      );
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        onClick={handleAnalyze}
        disabled={pending}
        className="bg-kaza-blue hover:bg-kaza-blue/90"
      >
        {pending ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <RefreshCcw className="mr-2 size-4" />
        )}
        {pending ? "Analyse en cours…" : "Lancer une analyse"}
      </Button>
      {lastRun && (
        <span className="text-[11px] text-muted-foreground">
          Dernière analyse à {lastRun}
        </span>
      )}
    </div>
  );
}
