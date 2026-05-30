"use client";

import { useState, useTransition } from "react";
import {
  AlertOctagon,
  Plus,
  Loader2,
  CheckCircle2,
  PlayCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast-helper";
import { formatFcfa } from "@/lib/utils";

import { createDispute, updateDisputeStatus } from "@/actions/agency-disputes";
import type { AgencyDispute, TenantOption } from "@/lib/queries/agency-b2b";

const TYPE_LABELS: Record<string, string> = {
  UNPAID_RENT: "Loyer impayé",
  DAMAGE: "Dégâts",
  COMPLAINT: "Plainte",
  NOISE: "Nuisances",
  BREACH: "Manquement au bail",
  OTHER: "Autre",
};

const PRIORITY_META: Record<string, { label: string; className: string }> = {
  LOW: { label: "Basse", className: "bg-slate-100 text-slate-600" },
  MEDIUM: { label: "Moyenne", className: "bg-amber-100 text-amber-800" },
  HIGH: { label: "Haute", className: "bg-orange-100 text-orange-800" },
  URGENT: { label: "Urgente", className: "bg-rose-100 text-rose-700" },
};

const STATUS_META: Record<string, { label: string; className: string }> = {
  OPEN: { label: "Ouvert", className: "bg-rose-100 text-rose-700" },
  IN_PROGRESS: { label: "En cours", className: "bg-amber-100 text-amber-800" },
  RESOLVED: { label: "Résolu", className: "bg-kaza-green/15 text-kaza-green" },
  CLOSED: { label: "Clôturé", className: "bg-slate-200 text-slate-600" },
};

export function DisputesView({
  disputes,
  tenants,
}: {
  disputes: AgencyDispute[];
  tenants: TenantOption[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    title: "",
    description: "",
    disputeType: "UNPAID_RENT" as
      | "UNPAID_RENT"
      | "DAMAGE"
      | "COMPLAINT"
      | "NOISE"
      | "BREACH"
      | "OTHER",
    priority: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
    tenantKey: "", // `${tenantId}|${rentalId}|${propertyId}`
    amount: "",
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleCreate = () => {
    if (form.title.trim().length < 3) {
      toast.error("Le titre est requis.");
      return;
    }
    const [tenantId, rentalId, propertyId] = form.tenantKey
      ? form.tenantKey.split("|")
      : ["", "", ""];
    const amount = form.amount ? Number(form.amount) : undefined;
    if (amount !== undefined && (Number.isNaN(amount) || amount < 0)) {
      toast.error("Montant invalide.");
      return;
    }
    startTransition(async () => {
      const res = await createDispute({
        title: form.title,
        description: form.description,
        disputeType: form.disputeType,
        priority: form.priority,
        tenantId: tenantId || "",
        rentalId: rentalId || "",
        propertyId: propertyId || "",
        amountFcfa: amount,
      });
      if (res.success) {
        toast.success("Litige enregistré");
        setOpen(false);
        setForm((p) => ({ ...p, title: "", description: "", amount: "", tenantKey: "" }));
      } else {
        toast.error(res.error ?? "Échec");
      }
    });
  };

  const changeStatus = (
    id: string,
    status: "IN_PROGRESS" | "RESOLVED" | "CLOSED",
  ) => {
    startTransition(async () => {
      const res = await updateDisputeStatus(id, status);
      if (res.success) toast.success("Statut mis à jour");
      else toast.error(res.error ?? "Échec");
    });
  };

  const openCount = disputes.filter(
    (d) => d.status === "OPEN" || d.status === "IN_PROGRESS",
  ).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-kaza-navy sm:text-3xl">
            Litiges &amp; signalements
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Impayés, dégâts, plaintes : suivez la résolution. {openCount} en cours.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" aria-hidden="true" />
              Nouveau signalement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Nouveau signalement</DialogTitle>
              <DialogDescription>
                Ouvrez un litige lié à un locataire ou un bail.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="title">Objet *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Ex : Loyer de mai impayé"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select
                    value={form.disputeType}
                    onValueChange={(v) =>
                      set("disputeType", v as typeof form.disputeType)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TYPE_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Priorité</Label>
                  <Select
                    value={form.priority}
                    onValueChange={(v) =>
                      set("priority", v as typeof form.priority)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Basse</SelectItem>
                      <SelectItem value="MEDIUM">Moyenne</SelectItem>
                      <SelectItem value="HIGH">Haute</SelectItem>
                      <SelectItem value="URGENT">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Locataire concerné (optionnel)</Label>
                <Select
                  value={form.tenantKey || "none"}
                  onValueChange={(v) => set("tenantKey", v === "none" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Aucun" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    {tenants.map((t) => (
                      <SelectItem
                        key={t.rentalId}
                        value={`${t.tenantId}|${t.rentalId}|${t.propertyId ?? ""}`}
                      >
                        {t.tenantName} — {t.propertyTitle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="amount">Montant en jeu (FCFA, optionnel)</Label>
                <Input
                  id="amount"
                  type="number"
                  min={0}
                  value={form.amount}
                  onChange={(e) => set("amount", e.target.value)}
                  placeholder="Ex : 150000"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Détaillez le problème..."
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
              <Button onClick={handleCreate} disabled={isPending} className="gap-2">
                {isPending && <Loader2 className="size-4 animate-spin" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {disputes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-kaza-green/10">
              <CheckCircle2 className="size-7 text-kaza-green" aria-hidden="true" />
            </div>
            <p className="font-heading text-lg font-semibold text-kaza-navy">
              Aucun litige en cours
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              Tout est en ordre. Signalez un impayé, un dégât ou une plainte dès
              qu&apos;un problème survient pour en garder la trace.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {disputes.map((d) => {
            const pr = PRIORITY_META[d.priority] ?? PRIORITY_META.MEDIUM;
            const st = STATUS_META[d.status] ?? STATUS_META.OPEN;
            return (
              <Card key={d.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <AlertOctagon className="size-4 text-rose-500" />
                        {d.title}
                      </CardTitle>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {TYPE_LABELS[d.disputeType] ?? d.disputeType}
                        {d.tenantName ? ` · ${d.tenantName}` : ""}
                        {d.propertyTitle ? ` · ${d.propertyTitle}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={pr.className}>{pr.label}</Badge>
                      <Badge className={st.className}>{st.label}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {d.description && (
                    <p className="text-sm text-muted-foreground">{d.description}</p>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      {d.amountFcfa != null && (
                        <span className="font-medium text-kaza-navy">
                          {formatFcfa(d.amountFcfa)}
                        </span>
                      )}
                      <span className="text-muted-foreground">
                        Ouvert le {new Date(d.createdAt).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {d.status === "OPEN" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          disabled={isPending}
                          onClick={() => changeStatus(d.id, "IN_PROGRESS")}
                        >
                          <PlayCircle className="size-3.5" /> Prendre en charge
                        </Button>
                      )}
                      {(d.status === "OPEN" || d.status === "IN_PROGRESS") && (
                        <Button
                          size="sm"
                          className="gap-1.5"
                          disabled={isPending}
                          onClick={() => changeStatus(d.id, "RESOLVED")}
                        >
                          <CheckCircle2 className="size-3.5" /> Marquer résolu
                        </Button>
                      )}
                      {d.status === "RESOLVED" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isPending}
                          onClick={() => changeStatus(d.id, "CLOSED")}
                        >
                          Clôturer
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
