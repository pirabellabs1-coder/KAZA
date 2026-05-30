"use client";

import { useState, useTransition } from "react";
import { Bell, Save, BellOff, BellRing } from "lucide-react";

import { updateNotificationPrefs } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast-helper";

type Channel = "email" | "push" | "sms";
type Category =
  | "messages"
  | "visits"
  | "payments"
  | "favorites"
  | "marketing";

const CATEGORIES: { key: Category; label: string; description: string }[] = [
  {
    key: "messages",
    label: "Messages",
    description: "Nouveaux messages reçus dans vos conversations.",
  },
  {
    key: "visits",
    label: "Demandes de visite",
    description: "Demandes et confirmations de visite des annonces.",
  },
  {
    key: "payments",
    label: "Paiements",
    description: "Rappels de loyer, confirmations et reçus de paiement.",
  },
  {
    key: "favorites",
    label: "Annonces favoris",
    description: "Mise à jour de prix ou disponibilité de vos favoris.",
  },
  {
    key: "marketing",
    label: "Marketing",
    description: "Nouveautés, conseils et offres promotionnelles KAZA.",
  },
];

const CHANNELS: { key: Channel; label: string }[] = [
  { key: "email", label: "Email" },
  { key: "push", label: "Push" },
  { key: "sms", label: "SMS" },
];

type Prefs = Record<Category, Record<Channel, boolean>>;

const defaultPrefs: Prefs = {
  messages: { email: true, push: true, sms: false },
  visits: { email: true, push: true, sms: true },
  payments: { email: true, push: true, sms: true },
  favorites: { email: true, push: false, sms: false },
  marketing: { email: false, push: false, sms: false },
};

function mergePrefs(initial: Record<string, unknown>): Prefs {
  const next: Prefs = JSON.parse(JSON.stringify(defaultPrefs));
  for (const cat of CATEGORIES) {
    const raw = initial[cat.key];
    if (raw && typeof raw === "object") {
      const r = raw as Partial<Record<Channel, unknown>>;
      for (const channel of CHANNELS) {
        if (typeof r[channel.key] === "boolean") {
          next[cat.key][channel.key] = r[channel.key] as boolean;
        }
      }
    }
  }
  return next;
}

export function NotificationsClient({
  initialPrefs = {},
}: {
  initialPrefs?: Record<string, unknown>;
}) {
  const [prefs, setPrefs] = useState<Prefs>(() => mergePrefs(initialPrefs));
  const [isPending, startTransition] = useTransition();

  const toggle = (category: Category, channel: Channel, value: boolean) => {
    setPrefs((prev) => ({
      ...prev,
      [category]: { ...prev[category], [channel]: value },
    }));
  };

  const setAll = (value: boolean) => {
    const next = { ...prefs };
    for (const cat of CATEGORIES) {
      next[cat.key] = { email: value, push: value, sms: value };
    }
    setPrefs(next);
    toast.info(value ? "Tous les canaux activés" : "Tous les canaux désactivés");
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateNotificationPrefs(prefs);
      if (result.success) {
        toast.success("Préférences de notification enregistrées");
      } else {
        toast.error(result.error ?? "Impossible d'enregistrer les préférences");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="size-5 text-kaza-navy" />
              Préférences détaillées
            </CardTitle>
            <CardDescription className="mt-1">
              Activez ou désactivez chaque combinaison catégorie / canal.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setAll(false)}>
              <BellOff className="mr-2 size-4" />
              Tout désactiver
            </Button>
            <Button variant="outline" size="sm" onClick={() => setAll(true)}>
              <BellRing className="mr-2 size-4" />
              Tout activer
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Desktop table */}
        <div className="hidden overflow-hidden rounded-lg border md:block">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  Catégorie
                </th>
                {CHANNELS.map((c) => (
                  <th
                    key={c.key}
                    className="px-4 py-3 text-center font-semibold text-foreground"
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map((cat, idx) => (
                <tr
                  key={cat.key}
                  className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{cat.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {cat.description}
                    </p>
                  </td>
                  {CHANNELS.map((channel) => (
                    <td key={channel.key} className="px-4 py-3 text-center">
                      <div className="flex justify-center">
                        <Switch
                          checked={prefs[cat.key][channel.key]}
                          onCheckedChange={(v) =>
                            toggle(cat.key, channel.key, v)
                          }
                          aria-label={`${cat.label} via ${channel.label}`}
                        />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile stacked */}
        <div className="space-y-4 md:hidden">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.key}
              className="rounded-lg border border-border p-4"
            >
              <p className="font-medium text-foreground">{cat.label}</p>
              <p className="mb-3 text-xs text-muted-foreground">
                {cat.description}
              </p>
              <div className="space-y-2">
                {CHANNELS.map((channel) => (
                  <div
                    key={channel.key}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">{channel.label}</span>
                    <Switch
                      checked={prefs[cat.key][channel.key]}
                      onCheckedChange={(v) => toggle(cat.key, channel.key, v)}
                      aria-label={`${cat.label} via ${channel.label}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Separator />
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isPending}>
            <Save className="mr-2 size-4" />
            {isPending ? "Enregistrement…" : "Enregistrer les préférences"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
