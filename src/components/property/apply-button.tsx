"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast-helper";

import { applyToProperty } from "@/actions/applications";

interface Props {
  propertyId: string;
  propertyTitle: string;
  isAuthenticated: boolean;
}

export function ApplyButton({ propertyId, propertyTitle, isAuthenticated }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [moveInDate, setMoveInDate] = useState("");
  const [income, setIncome] = useState("");

  const handleApply = () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/properties/${propertyId}`);
      return;
    }
    startTransition(async () => {
      const res = await applyToProperty({
        propertyId,
        message,
        moveInDate,
        monthlyIncome: income ? Number(income) : undefined,
      });
      if (res.success) {
        toast.success("Candidature envoyée au propriétaire");
        setOpen(false);
        setMessage("");
        setMoveInDate("");
        setIncome("");
        router.refresh();
      } else {
        toast.error(res.error ?? "Échec de l'envoi de la candidature");
      }
    });
  };

  // Non connecté : un simple bouton qui redirige vers la connexion.
  if (!isAuthenticated) {
    return (
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={() =>
          router.push(`/login?redirect=/properties/${propertyId}`)
        }
      >
        <ClipboardCheck className="size-4" />
        Postuler à ce logement
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2">
          <ClipboardCheck className="size-4" />
          Postuler à ce logement
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Postuler — {propertyTitle}</DialogTitle>
          <DialogDescription>
            Votre candidature et vos informations seront transmises au
            propriétaire, qui pourra l&apos;accepter ou la refuser.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="apply-msg">Message de motivation</Label>
            <Textarea
              id="apply-msg"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Présentez-vous, votre situation, vos garanties…"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="apply-date">Emménagement souhaité</Label>
              <Input
                id="apply-date"
                type="date"
                value={moveInDate}
                onChange={(e) => setMoveInDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="apply-income">Revenu mensuel (FCFA)</Label>
              <Input
                id="apply-income"
                type="number"
                min={0}
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                placeholder="Optionnel"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button onClick={handleApply} disabled={isPending} className="gap-2">
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Envoyer ma candidature
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
