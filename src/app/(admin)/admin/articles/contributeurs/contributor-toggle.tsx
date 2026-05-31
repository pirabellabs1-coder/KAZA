"use client";

import { useState, useTransition } from "react";

import { setContributor } from "@/actions/articles";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast-helper";

export function ContributorToggle({
  userId,
  initial,
  disabled,
}: {
  userId: string;
  initial: boolean;
  disabled?: boolean;
}) {
  const [on, setOn] = useState(initial);
  const [isPending, startTransition] = useTransition();

  function toggle(next: boolean) {
    setOn(next);
    startTransition(async () => {
      const res = await setContributor(userId, next);
      if (res.success) {
        toast.success(
          next ? "Contributeur activé." : "Contributeur désactivé.",
        );
      } else {
        setOn(!next); // rollback
        toast.error(res.error ?? "Échec.");
      }
    });
  }

  return (
    <Switch
      checked={on}
      disabled={disabled || isPending}
      onCheckedChange={toggle}
      aria-label="Activer le statut contributeur"
    />
  );
}
