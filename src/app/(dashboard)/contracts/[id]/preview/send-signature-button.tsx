"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Send } from "lucide-react";

import { sendContractToTenant } from "@/actions/contracts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast-helper";

// =============================================================================
// Kaabo — Envoyer un contrat au locataire pour signature
// =============================================================================

export function SendSignatureButton({ contractId }: { contractId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const send = () =>
    startTransition(async () => {
      const res = await sendContractToTenant(contractId);
      if (!res.success) {
        toast.error(res.error ?? "Envoi impossible.");
        return;
      }
      toast.success("Contrat envoyé au locataire pour signature.");
      setOpen(false);
      router.refresh();
    });

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={() => setOpen(true)}
      >
        <Send className="mr-2 size-4" />
        Envoyer pour signature
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Envoyer pour signature ?</DialogTitle>
            <DialogDescription>
              Le locataire recevra une notification et pourra signer le contrat
              en ligne. Vous serez averti dès qu&apos;il aura signé.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={send} disabled={pending}>
              {pending ? "Envoi…" : "Confirmer l'envoi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
