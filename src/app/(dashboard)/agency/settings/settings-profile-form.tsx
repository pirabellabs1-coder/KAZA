"use client";

// =============================================================================
// Kaabo — Formulaire profil agence (client)
//
// Formulaire CONTROLÉ branché sur la Server Action `updateAgencySettings`
// (bloc `profile` du JSONB users.agency_settings, migration 00035). Le bouton
// « Enregistrer » persiste réellement en base. Un brouillon localStorage
// (auto-save) protège contre la perte de saisie avant enregistrement.
//
// Upload du logo : VRAI upload Supabase Storage via `uploadAgencyLogo`
// (bucket public `avatars`, path `agency-logos/{userId}/logo.ext`). L'URL est
// stockée dans `agency_settings.profile.logoUrl` ET dans `profile_photo_url`
// (mirroring assuré par `updateAgencySettings`).
// =============================================================================

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Building2,
  ImageIcon,
  Loader2,
  Mail,
  RotateCcw,
  Save,
  Trash2,
  UserCircle2,
} from "lucide-react";

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

import {
  updateAgencySettings,
  uploadAgencyLogo,
  type AgencySettings,
} from "@/actions/agency-settings";

type AgencyProfile = AgencySettings["profile"];

interface SettingsProfileFormProps {
  initialProfile: AgencyProfile;
  /** Sous-objet public inchangé, renvoyé tel quel lors du save. */
  publicSettings: AgencySettings["public"];
  /** Sous-objet notifications inchangé, renvoyé tel quel lors du save. */
  notifications: AgencySettings["notifications"];
}

const AUTOSAVE_KEY = "kaza:agency-settings-profile";
const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 Mo

function readDraft(): Partial<AgencyProfile> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AgencyProfile> & {
      __savedAt?: number;
    };
    delete parsed.__savedAt;
    return parsed;
  } catch {
    return null;
  }
}

export function SettingsProfileForm({
  initialProfile,
  publicSettings,
  notifications,
}: SettingsProfileFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Lazy init : on lit le brouillon localStorage au premier rendu pour éviter
  // un setState dans un useEffect (règle react-hooks/set-state-in-effect).
  const [values, setValues] = useState<AgencyProfile>(() => {
    const draft = readDraft();
    return draft ? { ...initialProfile, ...draft } : initialProfile;
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, startSaveTransition] = useTransition();

  const {
    status,
    statusLabel,
    clear,
    flush,
    hasRestoredDraft,
    acknowledgeRestore,
  } = useAutoSave<AgencyProfile>({
    key: AUTOSAVE_KEY,
    data: values,
  });

  // Flush au unmount pour ne pas perdre les dernières modifs
  useEffect(() => {
    return () => {
      flush();
    };
  }, [flush]);

  const update = <K extends keyof AgencyProfile>(
    key: K,
    value: AgencyProfile[K],
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const persist = (next: AgencyProfile, successMsg: string) => {
    startSaveTransition(async () => {
      const res = await updateAgencySettings({
        profile: next,
        public: publicSettings,
        notifications,
      });
      if (res.success) {
        clear();
        toast.success(successMsg);
        router.refresh();
      } else {
        toast.error(res.error ?? "Échec de l'enregistrement");
      }
    });
  };

  const handleSave = () => {
    persist(values, "Profil agence enregistré");
  };

  const handleDiscardDraft = () => {
    clear();
    setValues(initialProfile);
    toast.info("Brouillon supprimé");
  };

  // --- Logo upload --------------------------------------------------------

  const handleSelectLogo = () => fileInputRef.current?.click();

  const handleLogoChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // permet de re-sélectionner le même fichier
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez choisir une image (JPG, PNG, WEBP ou SVG).");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      toast.error("Le logo ne doit pas dépasser 2 Mo.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadAgencyLogo(formData);
      if (!res.success || !res.url) {
        toast.error(res.error ?? "Échec de l'upload du logo.");
        return;
      }

      // On persiste immédiatement le nouveau logo (avec le reste du profil
      // courant) pour que l'URL survive à un rechargement de page.
      const next = { ...values, logoUrl: res.url };
      setValues(next);
      persist(next, "Logo agence mis à jour");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inattendue.";
      toast.error(`Upload impossible : ${message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    const next = { ...values, logoUrl: "" };
    setValues(next);
    persist(next, "Logo supprimé");
  };

  const busy = isUploading || isSaving;

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
            <Label htmlFor="rccm">RCCM</Label>
            <Input
              id="rccm"
              placeholder="RB/COT/24 B 12345"
              value={values.rccm}
              onChange={(e) => update("rccm", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Registre du Commerce et du Crédit Mobilier.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ifu">IFU</Label>
            <Input
              id="ifu"
              placeholder="Numéro d'Identification Fiscale Unique"
              value={values.ifu}
              onChange={(e) => update("ifu", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Identifiant Fiscal Unique de l&apos;entreprise.
            </p>
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
              placeholder="https://votre-agence.com"
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
            Cette description apparaît sur votre page publique Kaabo et dans les
            résultats de recherche.
          </p>
        </CardContent>
      </Card>

      {/* Logo (upload réel) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="size-5 text-kaza-blue" />
            Logo
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted text-muted-foreground">
            {values.logoUrl ? (
              <Image
                src={values.logoUrl}
                alt="Logo de l'agence"
                fill
                sizes="96px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <ImageIcon className="size-10" />
            )}
            {busy && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Loader2 className="size-5 animate-spin text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 space-y-3">
            <button
              type="button"
              onClick={handleSelectLogo}
              disabled={busy}
              className="block w-full rounded-xl border-2 border-dashed border-border bg-muted/30 p-6 text-center transition hover:border-kaza-blue/50 hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ImageIcon className="mx-auto mb-2 size-8 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                {values.logoUrl
                  ? "Remplacer le logo"
                  : "Cliquez pour ajouter votre logo"}
              </p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG, WEBP ou SVG — 2 Mo max
              </p>
            </button>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleSelectLogo}
                disabled={busy}
                className="gap-2"
              >
                {isUploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ImageIcon className="size-4" />
                )}
                {isUploading ? "Envoi…" : "Télécharger un fichier"}
              </Button>
              {values.logoUrl && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleRemoveLogo}
                  disabled={busy}
                  className="gap-2 text-rose-600 hover:text-rose-700"
                >
                  <Trash2 className="size-4" />
                  Supprimer
                </Button>
              )}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoChange}
          />
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
          </div>
        </CardContent>
      </Card>

      {/* Sticky save bar avec indicator */}
      <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border border-border bg-white/95 p-3 shadow-md backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <AutosaveIndicator status={status} label={statusLabel} />
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setValues(initialProfile)}
            disabled={busy}
          >
            Annuler
          </Button>
          <Button
            type="button"
            className="gap-2"
            onClick={handleSave}
            disabled={busy}
          >
            <Save className="size-4" />
            {isSaving ? "Enregistrement…" : "Enregistrer les modifications"}
          </Button>
        </div>
      </div>
    </div>
  );
}
