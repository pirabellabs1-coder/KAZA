"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast-helper";
import { sendContractToTenant } from "@/actions/contracts";

export function SendContractButton({ contractId }: { contractId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handle = () => {
    startTransition(async () => {
      const res = await sendContractToTenant(contractId);
      if (res.success) {
        toast.success("Bail envoyé au locataire pour signature.");
        router.refresh();
      } else {
        toast.error(res.error ?? "Échec de l'envoi.");
      }
    });
  };

  return (
    <Button onClick={handle} disabled={isPending} className="w-full gap-2">
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Send className="size-4" />
      )}
      Envoyer au locataire
    </Button>
  );
}
