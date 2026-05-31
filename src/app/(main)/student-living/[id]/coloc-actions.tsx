"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

import {
  requestColocationVisit,
  decideColocationVisit,
} from "@/actions/roommate-listings";

// --- Visiteur : demander une visite ----------------------------------------

export function RequestVisitButton({
  listingId,
  isAuthenticated,
}: {
  listingId: string;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [message, setMessage] = useState("");

  if (!isAuthenticated) {
    return (
      <Button
        className="w-full gap-2"
        onClick={() =>
          router.push(`/login?redirect=/student-living/${listingId}`)
        }
      >
        <CalendarCheck className="size-4" /> Demander une visite
      </Button>
    );
  }

  const handle = () => {
    startTransition(async () => {
      const res = await requestColocationVisit({
        listingId,
        requestedDate: date,
        requestedTime: time,
        message,
      });
      if (res.success) {
        toast.success("Demande de visite envoyée");
        setOpen(false);
        setDate("");
        setTime("");
        setMessage("");
        router.refresh();
      } else {
        toast.error(res.error ?? "Échec");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full gap-2">
          <CalendarCheck className="size-4" /> Demander une visite
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Demander une visite</DialogTitle>
          <DialogDescription>
            Proposez un créneau au créateur de l&apos;annonce. Il pourra
            confirmer ou décliner.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="v-date">Date souhaitée</Label>
              <Input
                id="v-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-time">Heure</Label>
              <Input
                id="v-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="v-msg">Message</Label>
            <Textarea
              id="v-msg"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Présentez-vous brièvement…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
            Annuler
          </Button>
          <Button onClick={handle} disabled={isPending} className="gap-2">
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Envoyer la demande
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Créateur : gérer les demandes reçues ----------------------------------

export interface VisitRequestItem {
  id: string;
  requesterName: string;
  requestedDate: string | null;
  requestedTime: string | null;
  message: string | null;
  status: string;
}

const STATUS_META: Record<string, { label: string; className: string }> = {
  PENDING: { label: "En attente", className: "bg-amber-100 text-amber-800" },
  CONFIRMED: { label: "Confirmée", className: "bg-kaza-green/15 text-kaza-green" },
  DECLINED: { label: "Déclinée", className: "bg-rose-100 text-rose-700" },
  CANCELLED: { label: "Annulée", className: "bg-slate-200 text-slate-600" },
};

export function OwnerVisitRequests({
  requests,
}: {
  requests: VisitRequestItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const decide = (id: string, status: "CONFIRMED" | "DECLINED") => {
    startTransition(async () => {
      const res = await decideColocationVisit(id, status);
      if (res.success) {
        toast.success(status === "CONFIRMED" ? "Visite confirmée" : "Visite déclinée");
        router.refresh();
      } else {
        toast.error(res.error ?? "Échec");
      }
    });
  };

  if (requests.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucune demande de visite pour le moment.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((r) => {
        const meta = STATUS_META[r.status] ?? STATUS_META.PENDING;
        return (
          <div
            key={r.id}
            className="rounded-lg border border-border/70 p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground">
                {r.requesterName}
              </p>
              <Badge className={meta.className}>{meta.label}</Badge>
            </div>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" />
              {r.requestedDate
                ? new Date(r.requestedDate).toLocaleDateString("fr-FR")
                : "Date à convenir"}
              {r.requestedTime ? ` · ${r.requestedTime}` : ""}
            </p>
            {r.message ? (
              <p className="mt-2 rounded bg-muted/40 p-2 text-sm text-muted-foreground">
                {r.message}
              </p>
            ) : null}
            {r.status === "PENDING" && (
              <div className="mt-2 flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-rose-600 hover:text-rose-700"
                  disabled={isPending}
                  onClick={() => decide(r.id, "DECLINED")}
                >
                  <XCircle className="size-3.5" /> Décliner
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5"
                  disabled={isPending}
                  onClick={() => decide(r.id, "CONFIRMED")}
                >
                  <CheckCircle2 className="size-3.5" /> Confirmer
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
