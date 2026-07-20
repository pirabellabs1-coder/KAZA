"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { adminSetPropertyHidden } from "@/actions/admin";
import { resolveReport } from "@/actions/reports";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast-helper";

// =============================================================================
// Kaabo — Actions sur une annonce signalée (modération admin)
// =============================================================================
// Vérifier : ouvrir la fiche de revue. Bannir : masquer l'annonce + clôturer
// les signalements. Conserver : rejeter les signalements (annonce conforme).
// =============================================================================

interface ReportedListingActionsProps {
  propertyId: string;
  reportIds: string[];
}

export function ReportedListingActions({
  propertyId,
  reportIds,
}: ReportedListingActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const resolveAll = async (status: "RESOLVED" | "DISMISSED") => {
    for (const id of reportIds) {
      await resolveReport(id, status);
    }
  };

  const bannir = () =>
    startTransition(async () => {
      const res = await adminSetPropertyHidden(propertyId, true);
      if (!res.success) {
        toast.error(res.error ?? "Action impossible.");
        return;
      }
      await resolveAll("RESOLVED");
      toast.success("Annonce masquée et signalements clôturés.");
      router.refresh();
    });

  const conserver = () =>
    startTransition(async () => {
      await resolveAll("DISMISSED");
      toast.success("Signalements rejetés — annonce conservée.");
      router.refresh();
    });

  return (
    <div className="grid grid-cols-3 gap-1.5">
      <Button asChild size="sm" variant="outline" className="text-xs">
        <Link href={`/admin/properties/${propertyId}`}>Vérifier</Link>
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="border-red-200 text-xs text-red-600 hover:bg-red-50"
        onClick={bannir}
        disabled={pending}
      >
        Bannir
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="text-xs"
        onClick={conserver}
        disabled={pending}
      >
        Conserver
      </Button>
    </div>
  );
}
