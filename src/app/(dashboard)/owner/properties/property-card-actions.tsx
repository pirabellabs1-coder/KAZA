"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Archive,
  EyeOff,
  Loader2,
  MoreVertical,
  Pencil,
  Rocket,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast-helper";

import {
  deleteProperty,
  setPropertyStatus,
  type OwnerPropertyStatus,
} from "@/actions/properties";

interface PropertyCardActionsProps {
  propertyId: string;
  status: string;
}

/**
 * Menu contextuel "..." sur chaque card de bien :
 *   - Modifier (lien edit)
 *   - Mettre hors marché / Republier (selon le statut courant)
 *   - Archiver
 *   - Supprimer (avec confirmation 2 étapes)
 */
export function PropertyCardActions({
  propertyId,
  status,
}: PropertyCardActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, startDeleteTransition] = useTransition();

  function changeStatus(next: OwnerPropertyStatus, label: string): void {
    startTransition(async () => {
      const res = await setPropertyStatus(propertyId, next);
      if (!res.success) {
        toast.error(res.error ?? `Impossible de ${label.toLowerCase()}.`);
        return;
      }
      toast.success(`${label} effectué(e).`);
      router.refresh();
    });
  }

  function handleDelete(): void {
    if (deleteStep === 1) {
      setDeleteStep(2);
      return;
    }
    if (confirmText.trim().toUpperCase() !== "SUPPRIMER") {
      toast.error("Veuillez saisir SUPPRIMER pour confirmer.");
      return;
    }
    startDeleteTransition(async () => {
      const res = await deleteProperty(propertyId);
      if (!res.success) {
        toast.error(res.error ?? "Impossible de supprimer l'annonce.");
        return;
      }
      toast.success("Annonce supprimée.");
      setDeleteOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
            aria-label="Actions sur l'annonce"
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <MoreVertical className="size-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem asChild>
            <Link href={`/owner/properties/${propertyId}/edit`}>
              <Pencil className="mr-2 size-4" />
              Modifier
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/owner/promotion?propertyId=${propertyId}`}>
              <Rocket className="mr-2 size-4" />
              Booster
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {status === "AVAILABLE" && (
            <DropdownMenuItem
              onClick={() => changeStatus("UNAVAILABLE", "Mise hors marché")}
            >
              <EyeOff className="mr-2 size-4" />
              Mettre hors marché
            </DropdownMenuItem>
          )}
          {status === "UNAVAILABLE" && (
            <DropdownMenuItem
              onClick={() => changeStatus("AVAILABLE", "Republication")}
            >
              <Rocket className="mr-2 size-4" />
              Republier
            </DropdownMenuItem>
          )}
          {status !== "ARCHIVED" && (
            <DropdownMenuItem onClick={() => changeStatus("ARCHIVED", "Archivage")}>
              <Archive className="mr-2 size-4" />
              Archiver
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
            onClick={() => {
              setDeleteStep(1);
              setConfirmText("");
              setDeleteOpen(true);
            }}
          >
            <Trash2 className="mr-2 size-4" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              {deleteStep === 1
                ? "Supprimer cette annonce ?"
                : "Confirmation finale"}
            </DialogTitle>
            <DialogDescription>
              {deleteStep === 1
                ? "Cette action est irréversible. L'annonce et toutes ses photos seront définitivement supprimées."
                : "Saisissez SUPPRIMER ci-dessous pour confirmer la suppression définitive."}
            </DialogDescription>
          </DialogHeader>

          {deleteStep === 2 && (
            <div className="space-y-2">
              <Label htmlFor={`confirm-delete-${propertyId}`}>Confirmation</Label>
              <Input
                id={`confirm-delete-${propertyId}`}
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Tapez SUPPRIMER"
                autoFocus
              />
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              type="button"
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              type="button"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              {deleteStep === 1 ? "Continuer" : "Supprimer définitivement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
