"use client";

// =============================================================================
// KAZA — Dialog client : créer un rendez-vous (calendrier agence)
// =============================================================================

import { useState, useTransition } from "react";
import { Loader2, Plus } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast-helper";

import { createCalendarEvent } from "@/actions/agency-calendar";
import type { CalendarEventType } from "@/lib/queries/agency-calendar";

const EVENT_TYPES = [
  { value: "VISIT", label: "Visite" },
  { value: "SIGNATURE", label: "Signature" },
  { value: "MEETING", label: "Réunion" },
  { value: "INSPECTION", label: "Inspection" },
  { value: "OTHER", label: "Autre" },
] as const satisfies ReadonlyArray<{
  value: CalendarEventType;
  label: string;
}>;

interface NewEventDialogProps {
  agents: Array<{ id: string; fullName: string }>;
  trigger?: React.ReactNode;
  defaultDate?: string; // YYYY-MM-DD
}

function defaultStart(date?: string): string {
  const d = date ? new Date(`${date}T09:00:00`) : new Date();
  if (!date) {
    d.setHours(d.getHours() + 1, 0, 0, 0);
  }
  // Format pour datetime-local : YYYY-MM-DDTHH:MM
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function plusOneHour(localInput: string): string {
  const d = new Date(localInput);
  d.setHours(d.getHours() + 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function NewEventDialog({
  agents,
  trigger,
  defaultDate,
}: NewEventDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const initialStart = defaultStart(defaultDate);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<CalendarEventType>("VISIT");
  const [startAt, setStartAt] = useState(initialStart);
  const [endAt, setEndAt] = useState(plusOneHour(initialStart));
  const [assignedTo, setAssignedTo] = useState<string>("__none__");
  const [contactName, setContactName] = useState("");
  const [notes, setNotes] = useState("");

  const reset = () => {
    const base = defaultStart(defaultDate);
    setTitle("");
    setType("VISIT");
    setStartAt(base);
    setEndAt(plusOneHour(base));
    setAssignedTo("__none__");
    setContactName("");
    setNotes("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createCalendarEvent({
        title,
        type,
        // datetime-local n'a pas de TZ -> on ajoute :00 et laisse JS interpréter en local
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        assignedTo: assignedTo === "__none__" ? undefined : assignedTo,
        contactName: contactName || undefined,
        notes: notes || undefined,
      });
      if (res.success) {
        toast.success("Rendez-vous créé");
        reset();
        setOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="bg-kaza-blue hover:bg-kaza-blue/90">
            <Plus className="mr-2 size-4" />
            Nouveau rendez-vous
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouveau rendez-vous</DialogTitle>
          <DialogDescription>
            Visite, signature ou réunion à inscrire dans l&apos;agenda de l&apos;équipe.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="evt-title">Titre</Label>
            <Input
              id="evt-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex : Visite Villa Cocotier"
              required
              minLength={2}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="evt-type">Type</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as CalendarEventType)}
              >
                <SelectTrigger id="evt-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {agents.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="evt-agent">Agent</Label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger id="evt-agent">
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
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="evt-start">Début</Label>
              <Input
                id="evt-start"
                type="datetime-local"
                value={startAt}
                onChange={(e) => {
                  setStartAt(e.target.value);
                  if (
                    new Date(e.target.value).getTime() >=
                    new Date(endAt).getTime()
                  ) {
                    setEndAt(plusOneHour(e.target.value));
                  }
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="evt-end">Fin</Label>
              <Input
                id="evt-end"
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="evt-contact">Contact</Label>
            <Input
              id="evt-contact"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Ex : Famille Adjovi"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="evt-notes">Notes</Label>
            <Textarea
              id="evt-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Précisions, adresse, instructions…"
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="bg-kaza-blue text-white hover:bg-kaza-blue/90"
            >
              {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Créer le rendez-vous
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
