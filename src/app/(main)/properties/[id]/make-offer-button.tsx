"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast-helper";
import { formatPrice } from "@/lib/utils";

import { submitPropertyOffer } from "@/actions/property-offers";

export function MakeOfferButton({
  propertyId,
  propertyTitle,
  askingPrice,
  isAuthenticated,
}: {
  propertyId: string;
  propertyTitle: string;
  askingPrice: number;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<string>(String(askingPrice || ""));
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  // Acompte indicatif (5 % du montant proposé).
  const numericAmount = Number(amount) || 0;
  const deposit = Math.round(numericAmount * 0.05);

  if (!isAuthenticated) {
    return (
      <Button asChild className="w-full gap-2 bg-amber-500 hover:bg-amber-600">
        <Link href={`/login?redirect=/properties/${propertyId}`}>
          <Tag className="size-4" /> Se connecter pour faire une offre
        </Link>
      </Button>
    );
  }

  const handleSubmit = () => {
    if (numericAmount <= 0) {
      toast.error("Saisissez un montant valide.");
      return;
    }
    startTransition(async () => {
      const res = await submitPropertyOffer({
        propertyId,
        amount: numericAmount,
        message: message.trim() || undefined,
      });
      if (res.success) {
        toast.success("Offre envoyée au vendeur");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error ?? "Échec de l'envoi de l'offre");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full gap-2 bg-amber-500 hover:bg-amber-600">
          <Tag className="size-4" /> Faire une offre
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Faire une offre d&apos;achat</DialogTitle>
          <DialogDescription>
            {propertyTitle} — prix affiché {formatPrice(askingPrice)}. Proposez
            votre montant ; le vendeur l&apos;accepte ou la refuse.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="offer-amount">Votre offre (FCFA)</Label>
            <Input
              id="offer-amount"
              type="number"
              min={0}
              step={50000}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Ex. 25 000 000"
            />
            {numericAmount > 0 && (
              <p className="text-xs text-muted-foreground">
                Acompte de réservation indicatif (5 %) :{" "}
                <strong>{formatPrice(deposit)}</strong>, à verser après accord du
                vendeur.
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="offer-message">Message au vendeur (optionnel)</Label>
            <Textarea
              id="offer-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Présentez votre projet, vos conditions…"
              rows={3}
              maxLength={1000}
            />
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
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="gap-2 bg-amber-500 hover:bg-amber-600"
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Envoyer l&apos;offre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
