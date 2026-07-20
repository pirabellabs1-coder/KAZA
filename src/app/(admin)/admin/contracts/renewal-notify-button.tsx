"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { notifyContractRenewal } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast-helper";

// =============================================================================
// Kaabo — Notifier le renouvellement d'un contrat (proprio + locataire)
// =============================================================================

export function RenewalNotifyButton({ contractId }: { contractId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const notify = () =>
    startTransition(async () => {
      const res = await notifyContractRenewal(contractId);
      if (!res.success) {
        toast.error(res.error ?? "Notification impossible.");
        return;
      }
      toast.success("Renouvellement notifié au propriétaire et au locataire.");
      router.refresh();
    });

  return (
    <Button
      size="sm"
      variant="outline"
      className="border-amber-200 text-amber-700 hover:bg-amber-50"
      onClick={notify}
      disabled={pending}
    >
      {pending ? "Envoi…" : "Notifier renouvellement"}
    </Button>
  );
}
