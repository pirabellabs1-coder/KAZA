"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { markContactMessageRead } from "@/actions/contact";
import { toast } from "@/components/ui/toast-helper";

interface MarkReadButtonProps {
  id: string;
}

/**
 * Bouton client "Marquer comme lu" — appelle l'action serveur
 * `markContactMessageRead`, rafraîchit la page et affiche un toast.
 */
export function MarkReadButton({ id }: MarkReadButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleClick = () => {
    startTransition(async () => {
      const result = await markContactMessageRead(id);
      if (result.success) {
        toast.success("Message marqué comme lu.");
        router.refresh();
      } else {
        toast.error(result.error ?? "Une erreur est survenue.");
      }
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className="gap-1.5"
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Check className="size-4" />
      )}
      Marquer comme lu
    </Button>
  );
}
