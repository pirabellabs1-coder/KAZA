"use client";

// =============================================================================
// KAZA — Contrôles client du détail lead : changer stage / assigner agent / delete
// =============================================================================

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  Trash2,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast-helper";

import {
  assignLead,
  deleteLead,
  updateLeadStage,
} from "@/actions/agency-leads";
import type { LeadStage } from "@/lib/queries/agency-leads";

const STAGE_OPTIONS: Array<{ value: LeadStage; label: string }> = [
  { value: "NEW", label: "Nouveau" },
  { value: "CONTACTED", label: "Contacté" },
  { value: "QUALIFIED", label: "Qualifié" },
  { value: "VISIT_SCHEDULED", label: "Visite planifiée" },
  { value: "OFFER", label: "Offre" },
  { value: "WON", label: "Signé" },
  { value: "LOST", label: "Perdu" },
];

interface LeadControlsProps {
  leadId: string;
  currentStage: LeadStage;
  currentAssignee: string | null;
  agents: Array<{ id: string; fullName: string }>;
}

export function LeadControls({
  leadId,
  currentStage,
  currentAssignee,
  agents,
}: LeadControlsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleStageChange = (newStage: LeadStage) => {
    if (newStage === currentStage) return;
    startTransition(async () => {
      const res = await updateLeadStage(leadId, newStage);
      if (res.success) {
        toast.success("Étape mise à jour");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleAssign = (memberId: string) => {
    const next = memberId === "__none__" ? null : memberId;
    if (next === currentAssignee) return;
    startTransition(async () => {
      const res = await assignLead(leadId, next);
      if (res.success) {
        toast.success(next ? "Lead assigné" : "Assignation retirée");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleQuickStage = (stage: Extract<LeadStage, "WON" | "LOST">) => {
    startTransition(async () => {
      const res = await updateLeadStage(leadId, stage);
      if (res.success) {
        toast.success(stage === "WON" ? "Lead marqué gagné" : "Lead marqué perdu");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteLead(leadId);
      if (res.success) {
        toast.success("Lead supprimé");
        router.push("/agency/leads");
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Étape du pipeline
          </label>
          <Select
            value={currentStage}
            onValueChange={(v) => handleStageChange(v as LeadStage)}
            disabled={pending}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAGE_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Agent assigné
          </label>
          <Select
            value={currentAssignee ?? "__none__"}
            onValueChange={handleAssign}
            disabled={pending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Non assigné" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Non assigné</SelectItem>
              {agents.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button
            className="bg-kaza-green text-white hover:bg-kaza-green/90"
            disabled={pending || currentStage === "WON"}
            onClick={() => handleQuickStage("WON")}
          >
            <CheckCircle2 className="mr-2 size-4" />
            Gagné
          </Button>
          <Button
            variant="outline"
            disabled={pending || currentStage === "LOST"}
            onClick={() => handleQuickStage("LOST")}
          >
            <XCircle className="mr-2 size-4" />
            Perdu
          </Button>
        </div>

        <Button
          variant="ghost"
          className="w-full text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          onClick={() => setDeleteOpen(true)}
          disabled={pending}
        >
          <Trash2 className="mr-2 size-4" />
          Supprimer le lead
        </Button>

        {pending && (
          <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            Mise à jour…
          </p>
        )}
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce lead ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. L&apos;historique sera perdu.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteOpen(false)}
              disabled={pending}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={pending}
            >
              {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
