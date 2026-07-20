"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { approveIdentity, rejectIdentity } from "@/actions/admin";
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
// Kaabo — Actions de modération KYC (table documents admin)
// =============================================================================

interface DocImage {
  label: string;
  url: string | null;
}

interface DocumentModActionsProps {
  userId: string;
  userName: string;
  userEmail: string;
  status: string;
  images: DocImage[];
}

export function DocumentModActions({
  userId,
  userName,
  userEmail,
  status,
  images,
}: DocumentModActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [viewOpen, setViewOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");

  const alreadyReviewed = status === "APPROVED" || status === "REJECTED";
  const visibleImages = images.filter((i) => i.url);

  const approve = () =>
    startTransition(async () => {
      const res = await approveIdentity({ userId, userEmail, userName });
      if (!res.success) {
        toast.error(res.error ?? "Action impossible.");
        return;
      }
      toast.success("Identité validée." + (res.emailSent ? "" : " (email non envoyé)"));
      router.refresh();
    });

  const reject = () => {
    if (reason.trim().length < 4) {
      toast.error("Merci d'indiquer un motif de rejet.");
      return;
    }
    startTransition(async () => {
      const res = await rejectIdentity({
        userId,
        userEmail,
        userName,
        reason: reason.trim(),
      });
      if (!res.success) {
        toast.error(res.error ?? "Action impossible.");
        return;
      }
      toast.success("Pièce rejetée.");
      setRejectOpen(false);
      setReason("");
      router.refresh();
    });
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 text-xs"
        onClick={() => setViewOpen(true)}
        disabled={visibleImages.length === 0}
        title={visibleImages.length === 0 ? "Aucune pièce disponible" : "Voir les pièces"}
      >
        Voir
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 text-xs text-kaza-green hover:bg-emerald-50"
        onClick={approve}
        disabled={pending || status === "APPROVED"}
      >
        Approuver
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 text-xs text-red-600 hover:bg-red-50"
        onClick={() => setRejectOpen(true)}
        disabled={pending || status === "REJECTED"}
      >
        Rejeter
      </Button>

      {/* Voir les pièces */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pièces de {userName}</DialogTitle>
            <DialogDescription>
              Liens sécurisés temporaires (valables quelques minutes).
              {alreadyReviewed && ` — Déjà traité (${status}).`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {visibleImages.map((img, i) => (
              <a
                key={i}
                href={img.url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="group block overflow-hidden rounded-xl border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url ?? ""}
                  alt={img.label}
                  className="h-44 w-full bg-muted object-contain transition-transform group-hover:scale-105"
                />
                <p className="border-t bg-white px-2 py-1.5 text-xs font-medium text-kaza-navy">
                  {img.label}
                </p>
              </a>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Rejeter avec motif */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter la pièce de {userName} ?</DialogTitle>
            <DialogDescription>
              Le motif sera communiqué à l&apos;utilisateur par email et affiché
              dans son espace.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex : Photo floue, document expiré, selfie non conforme…"
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={reject} disabled={pending}>
              Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
