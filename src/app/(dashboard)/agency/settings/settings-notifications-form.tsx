"use client";

// =============================================================================
// Kaabo — Onglet « Notifications » des paramètres agence (client)
//
// Formulaire controlé branché sur la Server Action `updateAgencySettings`
// (colonne JSONB users.agency_settings, migration 00035). Remplace l'ancien
// markup inerte (Switch/radio defaultChecked sans handler).
// =============================================================================

import { useState, useTransition } from "react";
import { Bell, Mail, MessageSquare, Save, Smartphone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast-helper";

import {
  updateAgencySettings,
  type AgencySettings,
} from "@/actions/agency-settings";

// Libellés FR des évènements (la clé technique vit dans le JSONB).
const EVENT_LABELS: Record<string, string> = {
  new_lead: "Nouveau lead",
  visit_confirmed: "Visite confirmée",
  signature: "Signature de contrat",
  payment_received: "Paiement reçu",
  client_review: "Avis client",
  weekly_report: "Rapport hebdomadaire",
  invoice_issued: "Facture émise",
};

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]; // index 0..6

const DIGEST_OPTIONS: Array<{
  id: AgencySettings["notifications"]["digest"];
  label: string;
  desc: string;
}> = [
  { id: "daily", label: "Quotidien", desc: "Tous les matins à 7h00" },
  { id: "weekly", label: "Hebdomadaire", desc: "Tous les lundis à 8h00" },
  { id: "disabled", label: "Désactivé", desc: "Aucun récapitulatif" },
];

interface SettingsNotificationsFormProps {
  initialNotifications: AgencySettings["notifications"];
  /** Sous-objet profil inchangé, renvoyé tel quel lors du save. */
  profile: AgencySettings["profile"];
  /** Sous-objet public inchangé, renvoyé tel quel lors du save. */
  publicSettings: AgencySettings["public"];
}

export function SettingsNotificationsForm({
  initialNotifications,
  profile,
  publicSettings,
}: SettingsNotificationsFormProps) {
  const [values, setValues] =
    useState<AgencySettings["notifications"]>(initialNotifications);
  const [isPending, startTransition] = useTransition();

  const eventKeys = Object.keys(values.events);

  const toggleChannel = (
    eventKey: string,
    channel: "email" | "sms" | "push",
    checked: boolean,
  ) =>
    setValues((prev) => ({
      ...prev,
      events: {
        ...prev.events,
        [eventKey]: { ...prev.events[eventKey], [channel]: checked },
      },
    }));

  const toggleDay = (dayIndex: number) =>
    setValues((prev) => {
      const has = prev.quietHours.days.includes(dayIndex);
      return {
        ...prev,
        quietHours: {
          ...prev.quietHours,
          days: has
            ? prev.quietHours.days.filter((d) => d !== dayIndex)
            : [...prev.quietHours.days, dayIndex].sort((a, b) => a - b),
        },
      };
    });

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateAgencySettings({
        profile,
        public: publicSettings,
        notifications: values,
      });
      if (res.success) {
        toast.success("Préférences de notification enregistrées");
      } else {
        toast.error(res.error ?? "Échec de l'enregistrement");
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-5 text-kaza-blue" aria-hidden="true" />
            Canaux par évènement
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type d&apos;évènement</TableHead>
                  <TableHead className="text-center">
                    <span className="inline-flex items-center gap-1">
                      <Mail className="size-3.5" aria-hidden="true" />
                      Email
                    </span>
                  </TableHead>
                  <TableHead className="text-center">
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="size-3.5" aria-hidden="true" />
                      SMS
                    </span>
                  </TableHead>
                  <TableHead className="text-center">
                    <span className="inline-flex items-center gap-1">
                      <Smartphone className="size-3.5" aria-hidden="true" />
                      Push
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventKeys.map((key) => {
                  const channels = values.events[key];
                  const label = EVENT_LABELS[key] ?? key;
                  return (
                    <TableRow key={key}>
                      <TableCell className="font-medium text-foreground">
                        {label}
                      </TableCell>
                      {(["email", "sms", "push"] as const).map((ch) => (
                        <TableCell key={ch} className="text-center">
                          <div className="flex justify-center">
                            <Switch
                              checked={channels[ch]}
                              onCheckedChange={(v) =>
                                toggleChannel(key, ch, v)
                              }
                              aria-label={`${label} — ${ch}`}
                            />
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Horaires de notification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quiet-start">Heure de début</Label>
                <Input
                  id="quiet-start"
                  type="time"
                  value={values.quietHours.start}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      quietHours: {
                        ...prev.quietHours,
                        start: e.target.value,
                      },
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quiet-end">Heure de fin</Label>
                <Input
                  id="quiet-end"
                  type="time"
                  value={values.quietHours.end}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      quietHours: {
                        ...prev.quietHours,
                        end: e.target.value,
                      },
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Jours actifs</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day, idx) => {
                  const active = values.quietHours.days.includes(idx);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(idx)}
                      aria-pressed={active}
                    >
                      <Badge
                        variant={active ? "default" : "outline"}
                        className={
                          active
                            ? "cursor-pointer bg-kaza-navy text-white hover:bg-kaza-navy/90"
                            : "cursor-pointer"
                        }
                      >
                        {day}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Aucune notification ne sera envoyée en dehors de cette plage.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email récapitulatif</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {DIGEST_OPTIONS.map((opt) => (
              <label
                key={opt.id}
                htmlFor={`freq-${opt.id}`}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/70 p-4 hover:bg-muted/30"
              >
                <input
                  type="radio"
                  name="email-freq"
                  id={`freq-${opt.id}`}
                  checked={values.digest === opt.id}
                  onChange={() =>
                    setValues((prev) => ({ ...prev, digest: opt.id }))
                  }
                  className="mt-1 size-4 accent-kaza-blue"
                />
                <div>
                  <p className="font-medium text-foreground">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </div>
              </label>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="sticky bottom-4 z-10 flex justify-end gap-2 rounded-2xl border border-border bg-white/90 p-3 shadow-md backdrop-blur">
        <Button
          variant="ghost"
          type="button"
          onClick={() => setValues(initialNotifications)}
          disabled={isPending}
        >
          Annuler
        </Button>
        <Button
          type="button"
          className="gap-2"
          onClick={handleSave}
          disabled={isPending}
        >
          <Save className="size-4" aria-hidden="true" />
          {isPending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </div>
  );
}
