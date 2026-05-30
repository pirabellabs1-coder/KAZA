"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Handshake,
  Plus,
  Loader2,
  Percent,
  Eye,
  Play,
  Pause,
  Ban,
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast-helper";

import { createMandate, setMandateStatus } from "@/actions/agency-mandates";
import type { AgencyMandate } from "@/lib/queries/agency-b2b";

interface PropertyOption {
  id: string;
  title: string;
  price: number;
}

const TYPE_LABELS: Record<string, string> = {
  GESTION: "Gestion locative",
  LOCATION: "Mise en location",
  VENTE: "Vente",
  EXCLUSIF: "Mandat exclusif",
};

const STATUS_META: Record<string, { label: string; className: string }> = {
  PENDING: { label: "En attente", className: "bg-amber-100 text-amber-800" },
  ACTIVE: { label: "Actif", className: "bg-kaza-green/15 text-kaza-green" },
  SUSPENDED: { label: "Suspendu", className: "bg-slate-200 text-slate-700" },
  TERMINATED: { label: "Résilié", className: "bg-rose-100 text-rose-700" },
  EXPIRED: { label: "Expiré", className: "bg-slate-100 text-slate-500" },
};

export function MandatesView({
  mandates,
  properties,
}: {
  mandates: AgencyMandate[];
  properties: PropertyOption[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    propertyId: "",
    mandateType: "GESTION" as "GESTION" | "LOCATION" | "VENTE" | "EXCLUSIF",
    commissionRate: "10",
    isExclusive: false,
    startDate: "",
    endDate: "",
    notes: "",
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleCreate = () => {
    if (form.ownerName.trim().length < 2) {
      toast.error("Le nom du mandant est requis.");
      return;
    }
    const rate = Number(form.commissionRate);
    if (Number.isNaN(rate) || rate < 0 || rate > 100) {
      toast.error("Taux de commission invalide (0–100).");
      return;
    }
    startTransition(async () => {
      const res = await createMandate({
        ownerName: form.ownerName,
        ownerEmail: form.ownerEmail,
        ownerPhone: form.ownerPhone,
        propertyId: form.propertyId,
        mandateType: form.mandateType,
        commissionRate: rate,
        isExclusive: form.isExclusive,
        startDate: form.startDate,
        endDate: form.endDate,
        notes: form.notes,
      });
      if (res.success) {
        toast.success("Mandat créé");
        setOpen(false);
        setForm((p) => ({
          ...p,
          ownerName: "",
          ownerEmail: "",
          ownerPhone: "",
          propertyId: "",
          notes: "",
        }));
      } else {
        toast.error(res.error ?? "Échec de la création");
      }
    });
  };

  const changeStatus = (
    id: string,
    status: "ACTIVE" | "SUSPENDED" | "TERMINATED",
  ) => {
    startTransition(async () => {
      const res = await setMandateStatus(id, status);
      if (res.success) toast.success("Statut mis à jour");
      else toast.error(res.error ?? "Échec");
    });
  };

  const activeCount = mandates.filter((m) => m.status === "ACTIVE").length;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-kaza-navy sm:text-3xl">
            Mandats propriétaires
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vos contrats de mandat avec les propriétaires mandants : type,
            commission et statut. {activeCount} actif{activeCount > 1 ? "s" : ""}.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" aria-hidden="true" />
              Nouveau mandat
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Nouveau mandat</DialogTitle>
              <DialogDescription>
                Enregistrez un contrat de mandat avec un propriétaire mandant.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="ownerName">Propriétaire mandant *</Label>
                  <Input
                    id="ownerName"
                    value={form.ownerName}
                    onChange={(e) => set("ownerName", e.target.value)}
                    placeholder="Nom complet ou raison sociale"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ownerEmail">Email</Label>
                  <Input
                    id="ownerEmail"
                    type="email"
                    value={form.ownerEmail}
                    onChange={(e) => set("ownerEmail", e.target.value)}
                    placeholder="email@exemple.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ownerPhone">Téléphone</Label>
                  <Input
                    id="ownerPhone"
                    value={form.ownerPhone}
                    onChange={(e) => set("ownerPhone", e.target.value)}
                    placeholder="+229 ..."
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Type de mandat</Label>
                  <Select
                    value={form.mandateType}
                    onValueChange={(v) =>
                      set("mandateType", v as typeof form.mandateType)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GESTION">Gestion locative</SelectItem>
                      <SelectItem value="LOCATION">Mise en location</SelectItem>
                      <SelectItem value="VENTE">Vente</SelectItem>
                      <SelectItem value="EXCLUSIF">Mandat exclusif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rate">Commission (%)</Label>
                  <div className="relative">
                    <Input
                      id="rate"
                      type="number"
                      min={0}
                      max={100}
                      step="0.5"
                      value={form.commissionRate}
                      onChange={(e) => set("commissionRate", e.target.value)}
                    />
                    <Percent className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Bien concerné (optionnel)</Label>
                <Select
                  value={form.propertyId || "none"}
                  onValueChange={(v) => set("propertyId", v === "none" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Aucun bien précis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun bien précis</SelectItem>
                    {properties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="startDate">Début</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={form.startDate}
                    onChange={(e) => set("startDate", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="endDate">Fin</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={form.endDate}
                    onChange={(e) => set("endDate", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/70 p-3">
                <div>
                  <p className="text-sm font-medium">Mandat exclusif</p>
                  <p className="text-xs text-muted-foreground">
                    Vous êtes la seule agence mandatée pour ce bien.
                  </p>
                </div>
                <Switch
                  checked={form.isExclusive}
                  onCheckedChange={(v) => set("isExclusive", v)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  placeholder="Conditions particulières, durée de préavis, etc."
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
                Créer le mandat
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {mandates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-kaza-blue/10">
              <Handshake className="size-7 text-kaza-blue" aria-hidden="true" />
            </div>
            <p className="font-heading text-lg font-semibold text-kaza-navy">
              Aucun mandat enregistré
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              Enregistrez vos contrats de mandat avec les propriétaires pour
              suivre vos commissions et vos biens gérés.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {mandates.map((m) => {
            const meta = STATUS_META[m.status] ?? STATUS_META.PENDING;
            return (
              <Card key={m.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{m.ownerName}</CardTitle>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {TYPE_LABELS[m.mandateType] ?? m.mandateType}
                        {m.propertyTitle ? ` · ${m.propertyTitle}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {m.isExclusive && (
                        <Badge variant="outline" className="text-[10px]">
                          Exclusif
                        </Badge>
                      )}
                      <Badge className={meta.className}>{meta.label}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    <span className="flex items-center gap-1 font-medium text-kaza-navy">
                      <Percent className="size-3.5" /> {m.commissionRate}% de commission
                    </span>
                    {m.ownerEmail && (
                      <span className="text-muted-foreground">{m.ownerEmail}</span>
                    )}
                    {m.startDate && (
                      <span className="text-muted-foreground">
                        Depuis le {new Date(m.startDate).toLocaleDateString("fr-FR")}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button asChild variant="outline" size="sm" className="gap-1.5">
                      <Link href={`/agency/mandates/${m.id}`}>
                        <Eye className="size-3.5" /> Détail
                      </Link>
                    </Button>
                    {m.status !== "ACTIVE" &&
                      m.status !== "TERMINATED" &&
                      m.status !== "EXPIRED" && (
                        <Button
                          size="sm"
                          className="gap-1.5"
                          disabled={isPending}
                          onClick={() => changeStatus(m.id, "ACTIVE")}
                        >
                          <Play className="size-3.5" /> Activer
                        </Button>
                      )}
                    {m.status === "ACTIVE" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        disabled={isPending}
                        onClick={() => changeStatus(m.id, "SUSPENDED")}
                      >
                        <Pause className="size-3.5" /> Suspendre
                      </Button>
                    )}
                    {m.status !== "TERMINATED" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1.5 text-rose-600 hover:text-rose-700"
                        disabled={isPending}
                        onClick={() => changeStatus(m.id, "TERMINATED")}
                      >
                        <Ban className="size-3.5" /> Résilier
                      </Button>
                    )}
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
