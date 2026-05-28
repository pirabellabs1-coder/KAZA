"use client";

import { useEffect, useState } from "react";
import { Flag, Plus, ToggleRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast-helper";
import { cn } from "@/lib/utils";

export type FlagEnvironment = "production" | "staging" | "development";

interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rollout: number; // 0-100
  environments: FlagEnvironment[];
}

const STORAGE_KEY = "kaza-feature-flags";

const DEFAULT_FLAGS: FeatureFlag[] = [
  {
    key: "new_search_ui",
    name: "new_search_ui",
    description: "Nouvelle interface de recherche avec filtres avancés et carte intégrée.",
    enabled: true,
    rollout: 100,
    environments: ["production", "staging", "development"],
  },
  {
    key: "virtual_tour_360",
    name: "virtual_tour_360",
    description: "Visites virtuelles 360° des biens immobiliers (intégration Matterport).",
    enabled: false,
    rollout: 25,
    environments: ["staging", "development"],
  },
  {
    key: "instant_messaging",
    name: "instant_messaging",
    description: "Messagerie temps réel entre locataires et propriétaires.",
    enabled: true,
    rollout: 100,
    environments: ["production", "staging", "development"],
  },
  {
    key: "escrow_v2",
    name: "escrow_v2",
    description: "Nouveau système de séquestre avec libération automatique par jalons.",
    enabled: false,
    rollout: 10,
    environments: ["staging"],
  },
  {
    key: "mobile_money_v3",
    name: "mobile_money_v3",
    description: "Refonte de l'intégration Mobile Money (MTN, Moov, Orange).",
    enabled: true,
    rollout: 75,
    environments: ["production", "staging"],
  },
  {
    key: "ai_recommendations",
    name: "ai_recommendations",
    description: "Recommandations de biens par IA basées sur l'historique de recherche.",
    enabled: false,
    rollout: 0,
    environments: ["development"],
  },
  {
    key: "advanced_analytics",
    name: "advanced_analytics",
    description: "Tableau de bord analytics avancé pour les propriétaires.",
    enabled: true,
    rollout: 50,
    environments: ["production", "staging"],
  },
  {
    key: "premium_features",
    name: "premium_features",
    description: "Fonctionnalités premium (mise en avant, badges, analytics).",
    enabled: false,
    rollout: 5,
    environments: ["staging"],
  },
  {
    key: "dark_mode",
    name: "dark_mode",
    description: "Mode sombre pour l'interface (désactivé pour le MVP).",
    enabled: false,
    rollout: 0,
    environments: ["development"],
  },
  {
    key: "multi_language",
    name: "multi_language",
    description: "Support multilingue (Fon, Yoruba, Anglais, Portugais).",
    enabled: false,
    rollout: 15,
    environments: ["staging", "development"],
  },
  {
    key: "push_notifications",
    name: "push_notifications",
    description: "Notifications push via Firebase Cloud Messaging.",
    enabled: true,
    rollout: 100,
    environments: ["production", "staging", "development"],
  },
  {
    key: "beta_program",
    name: "beta_program",
    description: "Programme bêta pour tester les nouvelles fonctionnalités.",
    enabled: true,
    rollout: 30,
    environments: ["production"],
  },
];

const envLabels: Record<FlagEnvironment, string> = {
  production: "Production",
  staging: "Staging",
  development: "Dev",
};

const envClasses: Record<FlagEnvironment, string> = {
  production: "bg-red-100 text-red-700 border-red-200",
  staging: "bg-amber-100 text-amber-700 border-amber-200",
  development: "bg-blue-100 text-blue-700 border-blue-200",
};

export function FlagsList() {
  const [flags, setFlags] = useState<FeatureFlag[]>(DEFAULT_FLAGS);
  const [hydrated, setHydrated] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newFlagName, setNewFlagName] = useState("");
  const [newFlagDesc, setNewFlagDesc] = useState("");

  // Hydratation depuis localStorage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as FeatureFlag[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFlags(parsed);
        }
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  // Persistance dans localStorage
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
    } catch {
      // ignore
    }
  }, [flags, hydrated]);

  const toggleFlag = (key: string) => {
    setFlags((prev) =>
      prev.map((f) => {
        if (f.key !== key) return f;
        const next = { ...f, enabled: !f.enabled };
        toast.success(
          `${f.name} ${next.enabled ? "activé" : "désactivé"}.`,
        );
        return next;
      }),
    );
  };

  const updateRollout = (key: string, rollout: number) => {
    setFlags((prev) =>
      prev.map((f) => (f.key === key ? { ...f, rollout } : f)),
    );
  };

  const handleCreate = () => {
    const cleanKey = newFlagName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
    if (cleanKey.length < 3) {
      toast.error("Le nom du flag doit faire au moins 3 caractères.");
      return;
    }
    if (flags.some((f) => f.key === cleanKey)) {
      toast.error("Ce flag existe déjà.");
      return;
    }
    setFlags((prev) => [
      ...prev,
      {
        key: cleanKey,
        name: cleanKey,
        description: newFlagDesc.trim() || "Nouveau flag (sans description)",
        enabled: false,
        rollout: 0,
        environments: ["development"],
      },
    ]);
    toast.success(`Flag "${cleanKey}" créé.`);
    setNewFlagName("");
    setNewFlagDesc("");
    setCreateOpen(false);
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {flags.length} flags · {flags.filter((f) => f.enabled).length} actifs
        </p>
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Créer un flag
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {flags.map((flag) => (
          <Card key={flag.key} className="overflow-hidden">
            <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-lg",
                    flag.enabled
                      ? "bg-kaza-green/10 text-kaza-green"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {flag.enabled ? (
                    <ToggleRight className="size-5" />
                  ) : (
                    <Flag className="size-5" />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm font-semibold text-kaza-navy">
                      {flag.name}
                    </code>
                    {flag.environments.map((env) => (
                      <span
                        key={env}
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                          envClasses[env],
                        )}
                      >
                        {envLabels[env]}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {flag.description}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-stretch gap-3 lg:w-[320px] lg:shrink-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">
                      Rollout
                    </span>
                    <span className="text-sm font-semibold text-kaza-navy">
                      {flag.rollout}%
                    </span>
                  </div>
                  <Switch
                    checked={flag.enabled}
                    onCheckedChange={() => toggleFlag(flag.key)}
                    aria-label={`Activer ${flag.name}`}
                  />
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={flag.rollout}
                  onChange={(e) =>
                    updateRollout(flag.key, Number(e.target.value))
                  }
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-kaza-blue"
                  aria-label={`Pourcentage de rollout pour ${flag.name}`}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un nouveau feature flag</DialogTitle>
            <DialogDescription>
              Les flags créés sont initialisés en environnement{" "}
              <strong>Dev</strong>, désactivés et à 0% de rollout.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="flag-name">Nom du flag (snake_case)</Label>
              <Input
                id="flag-name"
                value={newFlagName}
                onChange={(e) => setNewFlagName(e.target.value)}
                placeholder="my_new_feature"
                className="font-mono"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="flag-desc">Description</Label>
              <Textarea
                id="flag-desc"
                value={newFlagDesc}
                onChange={(e) => setNewFlagDesc(e.target.value)}
                placeholder="À quoi sert ce flag ?"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate}>Créer le flag</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
