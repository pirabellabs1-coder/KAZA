"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Flag, PencilLine, Plus, ToggleRight } from "lucide-react";

import {
  toggleFeatureFlag,
  upsertFeatureFlag,
} from "@/actions/feature-flags";
import type { FeatureFlag } from "@/lib/queries/feature-flags";
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

interface FlagsListProps {
  initialFlags: FeatureFlag[];
}

interface EditState {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rollout: number;
  isNew: boolean;
}

const emptyEdit: EditState = {
  key: "",
  name: "",
  description: "",
  enabled: false,
  rollout: 0,
  isNew: true,
};

export function FlagsList({ initialFlags }: FlagsListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [edit, setEdit] = useState<EditState | null>(null);

  const flags = initialFlags;
  const activeCount = flags.filter((f) => f.enabled).length;

  const handleToggle = (flag: FeatureFlag, nextEnabled: boolean) => {
    startTransition(async () => {
      const result = await toggleFeatureFlag(flag.key, nextEnabled);
      if (result.success) {
        toast.success(
          `${flag.name} ${nextEnabled ? "activé" : "désactivé"}.`,
        );
        router.refresh();
      } else {
        toast.error(result.error ?? "Action impossible.");
      }
    });
  };

  const openCreate = () => setEdit({ ...emptyEdit });

  const openEdit = (flag: FeatureFlag) =>
    setEdit({
      key: flag.key,
      name: flag.name,
      description: flag.description ?? "",
      enabled: flag.enabled,
      rollout: flag.rollout,
      isNew: false,
    });

  const handleSubmit = () => {
    if (!edit) return;

    const key = edit.isNew
      ? edit.key
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "_")
          .replace(/[^a-z0-9_]/g, "")
      : edit.key;

    if (edit.isNew) {
      if (key.length < 3) {
        toast.error("La clé du flag doit faire au moins 3 caractères.");
        return;
      }
      if (flags.some((f) => f.key === key)) {
        toast.error("Ce flag existe déjà.");
        return;
      }
    }

    const name = edit.name.trim() || key;

    startTransition(async () => {
      const result = await upsertFeatureFlag({
        key,
        name,
        description: edit.description.trim() || null,
        enabled: edit.enabled,
        rollout: edit.rollout,
      });
      if (result.success) {
        toast.success(
          edit.isNew ? `Flag "${key}" créé.` : `${name} mis à jour.`,
        );
        setEdit(null);
        router.refresh();
      } else {
        toast.error(result.error ?? "Enregistrement impossible.");
      }
    });
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {flags.length} flag{flags.length > 1 ? "s" : ""} · {activeCount}{" "}
          actif{activeCount > 1 ? "s" : ""}
        </p>
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="size-4" />
          Créer un flag
        </Button>
      </div>

      {flags.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Flag className="size-6" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Aucun feature flag défini
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              Aucun flag n&apos;est encore enregistré en base. Créez votre
              premier flag : il sera persisté dans{" "}
              <code className="font-mono">feature_flags</code> et partagé entre
              tous les administrateurs.
            </p>
          </CardContent>
        </Card>
      ) : (
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
                        {flag.key}
                      </code>
                      <span className="text-sm font-medium text-foreground">
                        {flag.name}
                      </span>
                    </div>
                    {flag.description && (
                      <p className="text-sm text-muted-foreground">
                        {flag.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 lg:shrink-0">
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-muted-foreground">
                      Rollout
                    </span>
                    <span className="text-sm font-semibold text-kaza-navy">
                      {flag.rollout}%
                    </span>
                  </div>
                  <Switch
                    checked={flag.enabled}
                    disabled={isPending}
                    onCheckedChange={(checked) => handleToggle(flag, checked)}
                    aria-label={`Activer ${flag.name}`}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => openEdit(flag)}
                  >
                    <PencilLine className="size-4" />
                    Éditer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={edit !== null}
        onOpenChange={(open) => !open && setEdit(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {edit?.isNew
                ? "Créer un nouveau feature flag"
                : `Éditer ${edit?.name ?? ""}`}
            </DialogTitle>
            <DialogDescription>
              {edit?.isNew
                ? "La clé est immuable une fois le flag créé (snake_case)."
                : "Modifiez le nom, la description, l'activation et le rollout."}
            </DialogDescription>
          </DialogHeader>

          {edit && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="flag-key">Clé (snake_case)</Label>
                <Input
                  id="flag-key"
                  value={edit.key}
                  disabled={!edit.isNew}
                  onChange={(e) =>
                    setEdit({ ...edit, key: e.target.value })
                  }
                  placeholder="my_new_feature"
                  className="font-mono"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="flag-name">Nom affiché</Label>
                <Input
                  id="flag-name"
                  value={edit.name}
                  onChange={(e) =>
                    setEdit({ ...edit, name: e.target.value })
                  }
                  placeholder="Nouvelle fonctionnalité"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="flag-desc">Description</Label>
                <Textarea
                  id="flag-desc"
                  value={edit.description}
                  onChange={(e) =>
                    setEdit({ ...edit, description: e.target.value })
                  }
                  placeholder="À quoi sert ce flag ?"
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">
                    Activé
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Bascule la disponibilité du flag.
                  </span>
                </div>
                <Switch
                  checked={edit.enabled}
                  onCheckedChange={(checked) =>
                    setEdit({ ...edit, enabled: checked })
                  }
                  aria-label="Activer le flag"
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="flag-rollout">Rollout</Label>
                  <span className="text-sm font-semibold text-kaza-navy">
                    {edit.rollout}%
                  </span>
                </div>
                <input
                  id="flag-rollout"
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={edit.rollout}
                  onChange={(e) =>
                    setEdit({ ...edit, rollout: Number(e.target.value) })
                  }
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-kaza-blue"
                  aria-label="Pourcentage de rollout"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEdit(null)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {edit?.isNew ? "Créer le flag" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
