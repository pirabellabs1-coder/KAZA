"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Eye, EyeOff, Sparkles, Trash2 } from "lucide-react";

import {
  adminDeleteProperty,
  adminSetPropertyHidden,
  adminToggleFeatured,
} from "@/actions/admin";
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
// Kaabo — Actions de modération d'annonce (liste admin)
// =============================================================================
// Masquer/Réafficher · Mettre en avant · Supprimer. Les server actions
// s'exécutent avec le service_role et écrivent le journal d'audit.
// =============================================================================

interface PropertyModActionsProps {
  propertyId: string;
  title: string;
  hidden: boolean;
}

export function PropertyModActions({
  propertyId,
  title,
  hidden,
}: PropertyModActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const run = (
    fn: () => Promise<{ success: boolean; error?: string }>,
    okMsg: string,
  ) =>
    startTransition(async () => {
      const res = await fn();
      if (!res.success) {
        toast.error(res.error ?? "Action impossible.");
        return;
      }
      toast.success(okMsg);
      router.refresh();
    });

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-amber-600 hover:bg-amber-50"
        title="Mettre en avant"
        disabled={pending}
        onClick={() =>
          run(() => adminToggleFeatured(propertyId), "Mise en avant mise à jour.")
        }
      >
        <Sparkles className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-slate-600 hover:bg-slate-100"
        title={hidden ? "Réafficher" : "Masquer"}
        disabled={pending}
        onClick={() =>
          run(
            () => adminSetPropertyHidden(propertyId, !hidden),
            hidden ? "Annonce réaffichée." : "Annonce masquée.",
          )
        }
      >
        {hidden ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-red-600 hover:bg-red-50"
        title="Supprimer"
        disabled={pending}
        onClick={() => setConfirmDelete(true)}
      >
        <Trash2 className="size-4" />
      </Button>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer cette annonce ?</DialogTitle>
            <DialogDescription>
              « {title} » sera définitivement supprimée. Cette action est
              irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() => {
                setConfirmDelete(false);
                run(
                  () => adminDeleteProperty(propertyId),
                  "Annonce supprimée.",
                );
              }}
            >
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
