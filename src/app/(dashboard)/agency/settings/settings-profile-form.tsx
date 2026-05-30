"use client";

// =============================================================================
// KAZA — Formulaire profil agence (client)
// Géré côté client pour bénéficier de l'auto-save brouillon (localStorage).
// Les autres onglets (Page publique, Notifications, Sécurité, Membres)
// restent en server component dans `page.tsx`.
// =============================================================================

import { useEffect, useState } from "react";
import { Building2, ImageIcon, Mail, RotateCcw, Save, UserCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast-helper";

import { AutosaveIndicator } from "@/components/shared/autosave-indicator";
import { useAutoSave } from "@/hooks/use-autosave";

interface AgencyProfileDraft {
  commercialName: string;
  legalName: string;
  oapi: string;
  city: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  description: string;
}

interface SettingsProfileFormProps {
  initialValues: AgencyProfileDraft;
  rccm: string;
  ifu: string;
}

const AUTOSAVE_KEY = "kaza:agency-settings-profile";

function readDraft(): Partial<AgencyProfileDraft> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AgencyProfileDraft> & {
      __savedAt?: number;
    };
    delete parsed.__savedAt;
    return parsed;
  } catch {
    return null;
  }
}

export function SettingsProfileForm({
  initialValues,
  rccm,
  ifu,
}: SettingsProfileFormProps) {
  // Lazy init : on lit le brouillon localStorage au premier rendu pour éviter
  // un setState dans un useEffect (règle react-hooks/set-state-in-effect).
  const [values, setValues] = useState<AgencyProfileDraft>(() => {
    const draft = readDraft();
    return draft ? { ...initialValues, ...draft } : initialValues;
  });

  const {
    status,
    statusLabel,
    clear,
    flush,
    hasRestoredDraft,
    acknowledgeRestore,
  } = useAutoSave<AgencyProfileDraft>({
    key: AUTOSAVE_KEY,
    data: values,
  });

  // Flush au unmount pour ne pas perdre les dernières modifs
  useEffect(() => {
    return () => {
      flush();
    };
  }, [flush]);

  const update = <K extends keyof AgencyProfileDraft>(
    key: K,
    value: AgencyProfileDraft[K],
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // Pas d'appel Supabase ici — simulation
    clear();
    toast.success("Profil agence enregistré");
  };

  const handleDiscardDraft = () => {
    clear();
    setValues(initialValues);
    toast.info("Brouillon supprimé");
  };

  return (
    <div className="space-y-6">
      {hasRestoredDraft && (
        <div className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <span>
            <strong>Brouillon restauré</strong> — vos modifications non
            enregistrées ont été récupérées.
          </span>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={acknowledgeRestore}
            >
              OK
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDiscardDraft}
            >
              <RotateCcw className="mr-1.5 size-3.5" />
              Repartir de zéro
            </Button>
          </div>
        </div>
      )}

      {/* Identité légale */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-5 text-kaza-blue" />
            Identité légale
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="commercial-name">Nom commercial</Label>
            <Input
              id="commercial-name"
              value={values.commercialName}
              onChange={(e) => update("commercialName", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="legal-name">Raison sociale</Label>
            <Input
              id="legal-name"
              value={values.legalName}
              onChange={(e) => update("legalName", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rccm">
              RCCM{" "}
              <span className="text-xs text-muted-foreground">(verrouillé)</span>
            </Label>
            <Input id="rccm" defaultValue={rccm} readOnly className="bg-muted/40" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ifu">
              IFU{" "}
              <span className="text-xs text-muted-foreground">(verrouillé)</span>
            </Label>
            <Input id="ifu" defaultValue={ifu} readOnly className="bg-muted/40" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="oapi">Référence OAPI</Label>
            <Input
              id="oapi"
              value={values.oapi}
              onChange={(e) => update("oapi", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Ville</Label>
            <Input
              id="city"
              value={values.city}
              onChange={(e) => update("city", e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Adresse complète</Label>
            <Textarea
              id="address"
              rows={2}
              value={values.address}
              onChange={(e) => update("address", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact public */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="size-5 text-kaza-blue" />
            Contact public
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email professionnel</Label>
            <Input
              id="email"
              type="email"
              value={values.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              value={values.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="website">Site web</Label>
            <Input
              id="website"
              value={values.website}
              onChange={(e) => update("website", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle>Description de l&apos;agence</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="description">Présentation publique</Label>
          <Textarea
            id="description"
            rows={5}
            value={values.description}
            onChange={(e) => update("description", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Cette description apparaît sur votre page publique KAZA et dans les
            résultats de recherche.
          </p>
        </CardContent>
      </Card>

      {/* Logo (statique) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="size-5 text-kaza-blue" />
            Logo
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <div className="flex size-24 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <ImageIcon className="size-10" />
          </div>
          <div className="flex-1 space-y-3">
            <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 p-6 text-center">
              <ImageIcon className="mx-auto mb-2 size-8 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                Déposez votre logo ici
              </p>
              <p className="text-xs text-muted-foreground">
                PNG ou SVG, 256 × 256 px min — 2 MB max
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                Télécharger un fichier
              </Button>
              <Button size="sm" variant="ghost">
                Supprimer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dirigeant — empty state tant que le champ n'est pas branché */}
      <Card>
        <CardHeader>
          <CardTitle>Dirigeant</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <UserCircle2 className="size-6" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Aucun dirigeant déclaré
            </p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Renseignez ici le représentant légal de votre agence
              (nom, fonction, email professionnel) pour qu&apos;il apparaisse
              sur votre page publique.
            </p>
            <Button type="button" variant="outline" size="sm" className="mt-2">
              Renseigner le dirigeant
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sticky save bar avec indicator */}
      <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border border-border bg-white/95 p-3 shadow-md backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <AutosaveIndicator status={status} label={statusLabel} />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setValues(initialValues)}>
            Annuler
          </Button>
          <Button className="gap-2" onClick={handleSave}>
            <Save className="size-4" />
            Enregistrer les modifications
          </Button>
        </div>
      </div>
    </div>
  );
}
