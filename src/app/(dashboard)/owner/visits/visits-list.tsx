"use client";

import { useMemo, useState, useTransition } from "react";
import {
  CalendarCheck,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  Loader2,
  CalendarPlus,
  Inbox,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { formatDate, getInitials } from "@/lib/utils";
import { acceptVisit, rejectVisit, rescheduleVisit } from "@/actions/visits";
import type { OwnerVisit } from "@/lib/queries/owner-activity";

type Filter = "ALL" | "PENDING" | "CONFIRMED" | "PAST";

function statusBadge(status: string) {
  switch (status) {
    case "PENDING":
      return (
        <Badge className="gap-1 border-kaza-warning bg-kaza-warning/10 text-kaza-warning">
          <Clock className="size-3" />
          En attente
        </Badge>
      );
    case "CONFIRMED":
      return (
        <Badge className="gap-1 bg-kaza-green text-white hover:bg-kaza-green/90">
          <CheckCircle className="size-3" />
          Confirmée
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="size-3" />
          Annulée
        </Badge>
      );
    case "COMPLETED":
      return (
        <Badge variant="secondary" className="gap-1">
          <CheckCircle className="size-3" />
          Effectuée
        </Badge>
      );
    case "NO_SHOW":
      return (
        <Badge variant="outline" className="gap-1">
          <XCircle className="size-3" />
          Absent
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function formatTime(time: string | null): string {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  return `${hours}h${minutes}`;
}

function initialsFromName(name: string): string {
  const parts = name.split(/\s+/);
  const first = parts[0] ?? "";
  const last = parts[1] ?? parts[0] ?? "";
  return getInitials(first, last);
}

interface OwnerVisitsViewProps {
  visits: OwnerVisit[];
}

export function OwnerVisitsView({ visits: initialVisits }: OwnerVisitsViewProps) {
  const [visits, setVisits] = useState<OwnerVisit[]>(initialVisits);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");

  const counts = useMemo(() => {
    const now = new Date();
    let pending = 0;
    let confirmed = 0;
    let past = 0;
    for (const v of visits) {
      if (v.status === "PENDING") pending += 1;
      else if (v.status === "CONFIRMED") {
        const d = v.proposedDate ? new Date(v.proposedDate) : null;
        if (d && d < now) past += 1;
        else confirmed += 1;
      } else past += 1;
    }
    return { pending, confirmed, past };
  }, [visits]);

  const filtered = useMemo(() => {
    if (filter === "ALL") return visits;
    if (filter === "PENDING")
      return visits.filter((v) => v.status === "PENDING");
    if (filter === "CONFIRMED") {
      const now = new Date();
      return visits.filter((v) => {
        if (v.status !== "CONFIRMED") return false;
        const d = v.proposedDate ? new Date(v.proposedDate) : null;
        return !d || d >= now;
      });
    }
    // PAST
    const now = new Date();
    return visits.filter((v) => {
      if (
        v.status === "COMPLETED" ||
        v.status === "CANCELLED" ||
        v.status === "NO_SHOW"
      )
        return true;
      if (v.status === "CONFIRMED" && v.proposedDate) {
        return new Date(v.proposedDate) < now;
      }
      return false;
    });
  }, [filter, visits]);

  const handleAccept = (id: string) => {
    setPendingId(id);
    startTransition(async () => {
      try {
        const res = await acceptVisit(id);
        if (res.success) {
          setVisits((prev) =>
            prev.map((v) =>
              v.id === id ? { ...v, status: "CONFIRMED" } : v,
            ),
          );
          toast.success("Visite confirmée.");
        } else {
          toast.error(res.error ?? "Impossible de confirmer la visite.");
        }
      } finally {
        setPendingId(null);
      }
    });
  };

  const handleReject = (id: string) => {
    setPendingId(id);
    startTransition(async () => {
      try {
        const res = await rejectVisit(id);
        if (res.success) {
          setVisits((prev) =>
            prev.map((v) =>
              v.id === id ? { ...v, status: "CANCELLED" } : v,
            ),
          );
          toast.info("Visite refusée.");
        } else {
          toast.error(res.error ?? "Impossible de refuser la visite.");
        }
      } finally {
        setPendingId(null);
      }
    });
  };

  const handleReschedule = (id: string) => {
    setRescheduleId(id);
    setRescheduleDate("");
  };

  const submitReschedule = () => {
    if (!rescheduleId) return;
    if (!rescheduleDate) {
      toast.error("Choisissez une nouvelle date.");
      return;
    }
    const id = rescheduleId;
    setPendingId(id);
    startTransition(async () => {
      try {
        const res = await rescheduleVisit(id, rescheduleDate);
        if (res.success) {
          setVisits((prev) =>
            prev.map((v) =>
              v.id === id
                ? { ...v, status: "CONFIRMED", proposedDate: rescheduleDate }
                : v,
            ),
          );
          toast.success("Nouvelle date proposée au locataire.");
          setRescheduleId(null);
        } else {
          toast.error(res.error ?? "Reprogrammation impossible.");
        }
      } finally {
        setPendingId(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-kaza-navy">
            Demandes de visite
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {visits.length === 0
              ? "Suivez ici toutes les demandes de visite reçues sur vos annonces."
              : `${visits.length} demande${visits.length > 1 ? "s" : ""} au total · ${counts.pending} en attente`}
          </p>
        </div>
      </div>

      {/* Filtres */}
      {visits.length > 0 && (
        <Tabs
          value={filter}
          onValueChange={(v) => setFilter(v as Filter)}
          className="w-full"
        >
          <TabsList>
            <TabsTrigger value="ALL">Toutes ({visits.length})</TabsTrigger>
            <TabsTrigger value="PENDING">
              En attente ({counts.pending})
            </TabsTrigger>
            <TabsTrigger value="CONFIRMED">
              Confirmées ({counts.confirmed})
            </TabsTrigger>
            <TabsTrigger value="PAST">Passées ({counts.past})</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Liste */}
      {filtered.length === 0 ? (
        <EmptyVisitsCard />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((visit) => (
            <Card key={visit.id} className="rounded-2xl border-0 shadow-sm">
              <CardContent className="space-y-4 p-5">
                {/* Requester */}
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-kaza-navy text-xs text-white">
                      {initialsFromName(visit.requesterName) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-kaza-navy">
                      {visit.requesterName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {visit.requesterEmail || "Email non renseigné"}
                    </p>
                  </div>
                </div>

                {/* Property */}
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="line-clamp-1 text-sm font-medium">
                    {visit.propertyTitle}
                  </p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3 shrink-0" />
                    <span className="line-clamp-1">
                      {visit.propertyAddress || "Adresse inconnue"}
                    </span>
                  </div>
                </div>

                {/* Date / heure */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-sm">
                    <CalendarCheck className="size-4 text-muted-foreground" />
                    <span>
                      {visit.proposedDate
                        ? formatDate(visit.proposedDate)
                        : "Date à définir"}
                    </span>
                  </div>
                  {visit.proposedTime && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <Clock className="size-4 text-muted-foreground" />
                      <span>{formatTime(visit.proposedTime)}</span>
                    </div>
                  )}
                </div>

                {/* Message éventuel */}
                {visit.message && (
                  <p className="rounded-lg border bg-background p-2 text-xs italic text-muted-foreground">
                    “{visit.message}”
                  </p>
                )}

                {/* Status + actions */}
                <div className="flex items-center justify-between border-t pt-3">
                  {statusBadge(visit.status)}

                  {visit.status === "PENDING" ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReschedule(visit.id)}
                        aria-label="Proposer une autre date"
                      >
                        <CalendarPlus className="size-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        className="bg-kaza-green hover:bg-kaza-green/90"
                        onClick={() => handleAccept(visit.id)}
                        disabled={pendingId === visit.id}
                      >
                        {pendingId === visit.id ? (
                          <Loader2 className="mr-1 size-3 animate-spin" />
                        ) : null}
                        Accepter
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(visit.id)}
                        disabled={pendingId === visit.id}
                      >
                        Refuser
                      </Button>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reprogrammation : proposer une nouvelle date */}
      <Dialog
        open={rescheduleId !== null}
        onOpenChange={(o) => !o && setRescheduleId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Proposer une nouvelle date</DialogTitle>
            <DialogDescription>
              Le locataire sera notifié de la date proposée pour la visite.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reschedule-date">Nouvelle date</Label>
            <Input
              id="reschedule-date"
              type="date"
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleId(null)}>
              Annuler
            </Button>
            <Button
              onClick={submitReschedule}
              disabled={pendingId === rescheduleId}
            >
              Proposer la date
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyVisitsCard() {
  return (
    <Card className="rounded-2xl border-2 border-dashed bg-gradient-to-br from-white via-muted/20 to-kaza-blue/[0.04] shadow-sm">
      <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-kaza-blue/10">
          <Inbox className="size-8 text-kaza-blue" />
        </div>
        <h2 className="mt-6 font-heading text-xl font-bold text-kaza-navy">
          Aucune demande de visite pour le moment
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Les locataires peuvent demander à visiter vos annonces depuis la page
          détail. Vous serez notifié dès qu’une demande arrive.
        </p>
      </CardContent>
    </Card>
  );
}
