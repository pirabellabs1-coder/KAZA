"use client";

// =============================================================================
// KAZA — Admin / Interrupteur actif-inactif d'un code promo
// =============================================================================

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { togglePromoCode } from "@/actions/promo";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast-helper";

interface PromoToggleProps {
  id: string;
  code: string;
  isActive: boolean;
}

export function PromoToggle({ id, code, isActive }: PromoToggleProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(next: boolean) {
    startTransition(async () => {
      const result = await togglePromoCode(id, next);
      if (result.success) {
        toast.success(
          next
            ? `Code ${code} activé.`
            : `Code ${code} désactivé.`,
        );
        router.refresh();
      } else {
        toast.error(result.error ?? "Impossible de mettre à jour le code.");
      }
    });
  }

  return (
    <Switch
      checked={isActive}
      onCheckedChange={handleChange}
      disabled={isPending}
      aria-label={isActive ? `Désactiver ${code}` : `Activer ${code}`}
    />
  );
}
