"use client";

// =============================================================================
// Kaabo — Dialog client : créer un nouveau lead
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

import { createLead } from "@/actions/agency-leads";

const SOURCES = [
  { value: "SITE_KAZA", label: "Site Kaabo" },
  { value: "SOCIAL", label: "Réseaux sociaux" },
  { value: "WORD_OF_MOUTH", label: "Bouche-à-oreille" },
  { value: "GOOGLE_ADS", label: "Pub Google" },
  { value: "EVENT", label: "Évènement" },
  { value: "OTHER", label: "Autre" },
] as const;

type SourceValue = (typeof SOURCES)[number]["value"];

interface NewLeadDialogProps {
  agents: Array<{ id: string; fullName: string }>;
  trigger?: React.ReactNode;
}

export function NewLeadDialog({ agents, trigger }: NewLeadDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState<SourceValue>("SITE_KAZA");
  const [budget, setBudget] = useState("");
  const [assignedTo, setAssignedTo] = useState<string>("__none__");
  const [notes, setNotes] = useState("");

  const reset = () => {
    setFullName("");
    setEmail("");
    setPhone("");
    setSource("SITE_KAZA");
    setBudget("");
    setAssignedTo("__none__");
    setNotes("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createLead({
        fullName,
        email: email || undefined,
        phone: phone || undefined,
        source,
        budgetFcfa: budget ? Number(budget) : undefined,
        assignedTo: assignedTo === "__none__" ? undefined : assignedTo,
        notes: notes || undefined,
      });
      if (res.success) {
        toast.success("Lead créé");
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
          <Button className="bg-kaza-navy text-white hover:bg-kaza-navy/90">
            <Plus className="mr-2 size-4" />
            Nouveau lead
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouveau lead</DialogTitle>
          <DialogDescription>
            Ajoutez un prospect à votre pipeline commercial.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lead-fullname">Nom complet</Label>
            <Input
              id="lead-fullname"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ex : Komla Adjovi"
              required
              minLength={2}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lead-email">Email</Label>
              <Input
                id="lead-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="komla@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-phone">Téléphone</Label>
              <Input
                id="lead-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+229 ..."
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lead-source">Source</Label>
              <Select
                value={source}
                onValueChange={(v) => setSource(v as SourceValue)}
              >
                <SelectTrigger id="lead-source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-budget">Budget mensuel (FCFA)</Label>
              <Input
                id="lead-budget"
                type="number"
                min="0"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="500000"
              />
            </div>
          </div>

          {agents.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="lead-assignee">Agent assigné</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger id="lead-assignee">
                  <SelectValue placeholder="Aucun" />
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

          <div className="space-y-2">
            <Label htmlFor="lead-notes">Notes</Label>
            <Textarea
              id="lead-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contexte, besoin, points clés…"
              rows={3}
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
              className="bg-kaza-navy text-white hover:bg-kaza-navy/90"
            >
              {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Créer le lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
