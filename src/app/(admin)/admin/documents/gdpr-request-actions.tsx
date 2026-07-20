"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  resolveGdprRequest,
  type GdprResolveStatus,
} from "@/actions/gdpr";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast-helper";

// =============================================================================
// Kaabo — Actions sur une demande RGPD (admin)
// =============================================================================

interface GdprRequestActionsProps {
  request: {
    id: string;
    typeLabel: string;
    userName: string;
    requestedAt: string;
    deadline: string;
    statusLabel: string;
  };
}

export function GdprRequestActions({ request }: GdprRequestActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [processOpen, setProcessOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [note, setNote] = useState("");

  const resolve = (status: GdprResolveStatus) =>
    startTransition(async () => {
      const res = await resolveGdprRequest(request.id, status, note.trim());
      if (!res.success) {
        toast.error(res.error ?? "Action impossible.");
        return;
      }
      toast.success(
        status === "IN_PROGRESS"
          ? "Demande marquée en cours."
          : status === "COMPLETED"
            ? "Demande marquée comme traitée."
            : "Demande rejetée.",
      );
      setProcessOpen(false);
      setNote("");
      router.refresh();
    });

  const fmt = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };

  return (
    <>
      <Button
        size="sm"
        className="bg-kaza-blue text-white hover:bg-kaza-blue/90"
        onClick={() => setProcessOpen(true)}
      >
        Traiter
      </Button>
      <Button size="sm" variant="outline" onClick={() => setDetailOpen(true)}>
        Voir détails
      </Button>

      {/* Traiter */}
      <Dialog open={processOpen} onOpenChange={setProcessOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Traiter la demande RGPD</DialogTitle>
            <DialogDescription>
              {request.typeLabel} — {request.userName}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note interne (optionnelle) : action réalisée, référence…"
            rows={3}
          />
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => resolve("IN_PROGRESS")}
            >
              Marquer en cours
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() => resolve("REJECTED")}
            >
              Rejeter
            </Button>
            <Button
              className="bg-kaza-green text-white hover:bg-kaza-green/90"
              disabled={pending}
              onClick={() => resolve("COMPLETED")}
            >
              Marquer traité
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Détails */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Demande RGPD</DialogTitle>
            <DialogDescription>{request.typeLabel}</DialogDescription>
          </DialogHeader>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Demandeur</dt>
              <dd className="font-medium text-kaza-navy">{request.userName}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Statut</dt>
              <dd className="font-medium text-kaza-navy">
                {request.statusLabel}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Reçue le</dt>
              <dd className="font-medium text-kaza-navy">
                {fmt(request.requestedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                Échéance (30 j)
              </dt>
              <dd className="font-medium text-kaza-navy">
                {fmt(request.deadline)}
              </dd>
            </div>
          </dl>
        </DialogContent>
      </Dialog>
    </>
  );
}
