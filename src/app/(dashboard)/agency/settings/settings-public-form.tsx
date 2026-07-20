"use client";

// =============================================================================
// Kaabo — Onglet « Page publique » des paramètres agence (client)
//
// Formulaire controlé branché sur la Server Action `updateAgencySettings`
// (colonne JSONB users.agency_settings, migration 00035). Remplace l'ancien
// markup inerte (defaultValue/Switch sans handler) afin qu'aucun champ ne
// donne l'illusion de sauvegarder sans le faire.
// =============================================================================

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import {
  Check,
  ExternalLink,
  Facebook,
  Globe,
  Image as ImageIcon,
  Instagram,
  Linkedin,
  Loader2,
  Save,
  Trash2,
  Twitter,
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast-helper";

import {
  updateAgencySettings,
  uploadAgencyBanner,
  type AgencySettings,
} from "@/actions/agency-settings";

const MAX_BANNER_BYTES = 5 * 1024 * 1024; // 5 Mo

const ACCENT_COLORS = [
  { key: "navy", label: "Navy", className: "bg-kaza-navy" },
  { key: "blue", label: "Blue", className: "bg-kaza-blue" },
  { key: "green", label: "Green", className: "bg-kaza-green" },
  { key: "amber", label: "Amber", className: "bg-amber-500" },
  { key: "rose", label: "Rose", className: "bg-rose-500" },
  { key: "purple", label: "Purple", className: "bg-purple-500" },
] as const;

interface SettingsPublicFormProps {
  initialPublic: AgencySettings["public"];
  /** Sous-objet profil inchangé, renvoyé tel quel lors du save. */
  profile: AgencySettings["profile"];
  /** Sous-objet notifications inchangé, renvoyé tel quel lors du save. */
  notifications: AgencySettings["notifications"];
}

export function SettingsPublicForm({
  initialPublic,
  profile,
  notifications,
}: SettingsPublicFormProps) {
  const [values, setValues] = useState<AgencySettings["public"]>(initialPublic);
  const [isPending, startTransition] = useTransition();
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  const update = <K extends keyof AgencySettings["public"]>(
    key: K,
    value: AgencySettings["public"][K],
  ) => setValues((prev) => ({ ...prev, [key]: value }));

  // Persiste un sous-état public (utilisé pour que la bannière survive à un
  // rechargement immédiatement après l'upload, sans attendre « Enregistrer »).
  const persistPublic = (nextPublic: AgencySettings["public"], msg: string) => {
    startTransition(async () => {
      const res = await updateAgencySettings({
        profile,
        public: nextPublic,
        notifications,
      });
      if (res.success) {
        toast.success(msg);
      } else {
        toast.error(res.error ?? "Échec de l'enregistrement");
      }
    });
  };

  const handleSelectBanner = () => bannerInputRef.current?.click();

  const handleBannerChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // permet de re-sélectionner le même fichier
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez choisir une image (JPG, PNG ou WEBP).");
      return;
    }
    if (file.size > MAX_BANNER_BYTES) {
      toast.error("La bannière ne doit pas dépasser 5 Mo.");
      return;
    }

    setIsUploadingBanner(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadAgencyBanner(formData);
      if (!res.success || !res.url) {
        toast.error(res.error ?? "Échec de l'upload de la bannière.");
        return;
      }
      const next = { ...values, bannerUrl: res.url };
      setValues(next);
      persistPublic(next, "Bannière mise à jour");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inattendue.";
      toast.error(`Upload impossible : ${message}`);
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleRemoveBanner = () => {
    const next = { ...values, bannerUrl: "" };
    setValues(next);
    persistPublic(next, "Bannière supprimée");
  };

  const updateSocial = (
    key: keyof AgencySettings["public"]["social"],
    value: string,
  ) =>
    setValues((prev) => ({
      ...prev,
      social: { ...prev.social, [key]: value },
    }));

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateAgencySettings({
        profile,
        public: values,
        notifications,
      });
      if (res.success) {
        toast.success("Page publique enregistrée");
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
            <Globe className="size-5 text-kaza-blue" aria-hidden="true" />
            URL personnalisée
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label htmlFor="custom-url">URL de votre page agence</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex flex-1 items-center rounded-lg border border-input">
              <span className="border-r border-input bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
                kaabo.immo/agences/
              </span>
              <Input
                id="custom-url"
                placeholder="votre-agence"
                className="border-0 focus-visible:ring-0"
                value={values.slug}
                onChange={(e) => update("slug", e.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={!values.slug}
              asChild={Boolean(values.slug)}
            >
              {values.slug ? (
                <a
                  href={`/agences/${values.slug}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="size-4" aria-hidden="true" />
                  Visiter ma page
                </a>
              ) : (
                <span>
                  <ExternalLink className="size-4" aria-hidden="true" />
                  Visiter ma page
                </span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Apparence</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Couleur d&apos;accent</Label>
            <div className="flex flex-wrap gap-3">
              {ACCENT_COLORS.map((color) => {
                const selected = values.accentColor === color.key;
                return (
                  <button
                    key={color.key}
                    type="button"
                    onClick={() => update("accentColor", color.key)}
                    aria-label={`Couleur ${color.label}`}
                    aria-pressed={selected}
                    className={`relative flex size-12 items-center justify-center rounded-xl ring-offset-2 transition ${
                      color.className
                    } ${selected ? "ring-2 ring-kaza-navy" : "hover:ring-2 hover:ring-border"}`}
                    title={color.label}
                  >
                    {selected && (
                      <Check className="size-5 text-white" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Bannière de couverture</Label>
            {values.bannerUrl ? (
              <div className="relative h-40 overflow-hidden rounded-xl border border-border">
                <Image
                  src={values.bannerUrl}
                  alt="Bannière de couverture de l'agence"
                  fill
                  sizes="(max-width: 768px) 100vw, 768px"
                  className="object-cover"
                  unoptimized
                />
                {isUploadingBanner && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Loader2 className="size-6 animate-spin text-white" />
                  </div>
                )}
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="gap-1.5"
                    onClick={handleSelectBanner}
                    disabled={isUploadingBanner || isPending}
                  >
                    <ImageIcon className="size-4" aria-hidden="true" />
                    Remplacer
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="gap-1.5"
                    onClick={handleRemoveBanner}
                    disabled={isUploadingBanner || isPending}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    Retirer
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSelectBanner}
                disabled={isUploadingBanner || isPending}
                className="flex h-40 w-full items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 text-center transition hover:border-kaza-blue/50 hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div>
                  {isUploadingBanner ? (
                    <Loader2 className="mx-auto mb-2 size-8 animate-spin text-muted-foreground" />
                  ) : (
                    <ImageIcon
                      className="mx-auto mb-2 size-8 text-muted-foreground"
                      aria-hidden="true"
                    />
                  )}
                  <p className="text-sm font-medium text-foreground">
                    {isUploadingBanner
                      ? "Envoi en cours…"
                      : "Cliquez pour ajouter une bannière"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG ou WEBP — 5 Mo max. Format paysage recommandé (1500×400).
                  </p>
                </div>
              </button>
            )}
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleBannerChange}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Présentation publique</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="public-about">À propos</Label>
            <Textarea
              id="public-about"
              rows={5}
              placeholder="Présentez votre agence aux visiteurs..."
              value={values.about}
              onChange={(e) => update("about", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="youtube">Vidéo de présentation YouTube</Label>
            <Input
              id="youtube"
              placeholder="https://youtube.com/watch?v=..."
              value={values.youtube}
              onChange={(e) => update("youtube", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Réseaux sociaux</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="facebook" className="flex items-center gap-2">
              <Facebook className="size-4 text-blue-600" aria-hidden="true" />
              Facebook
            </Label>
            <Input
              id="facebook"
              placeholder="https://facebook.com/..."
              value={values.social.facebook}
              onChange={(e) => updateSocial("facebook", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instagram" className="flex items-center gap-2">
              <Instagram className="size-4 text-rose-500" aria-hidden="true" />
              Instagram
            </Label>
            <Input
              id="instagram"
              placeholder="https://instagram.com/..."
              value={values.social.instagram}
              onChange={(e) => updateSocial("instagram", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="linkedin" className="flex items-center gap-2">
              <Linkedin className="size-4 text-blue-700" aria-hidden="true" />
              LinkedIn
            </Label>
            <Input
              id="linkedin"
              placeholder="https://linkedin.com/company/..."
              value={values.social.linkedin}
              onChange={(e) => updateSocial("linkedin", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="twitter" className="flex items-center gap-2">
              <Twitter className="size-4 text-foreground" aria-hidden="true" />X
              (Twitter)
            </Label>
            <Input
              id="twitter"
              placeholder="https://x.com/..."
              value={values.social.twitter}
              onChange={(e) => updateSocial("twitter", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Options d&apos;affichage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border/70 p-4">
            <div>
              <p className="font-medium text-foreground">
                Afficher l&apos;équipe sur la page publique
              </p>
              <p className="text-xs text-muted-foreground">
                Vos agents apparaîtront avec photo, rôle et coordonnées.
              </p>
            </div>
            <Switch
              checked={values.showTeam}
              onCheckedChange={(v) => update("showTeam", v)}
              aria-label="Afficher l'équipe sur la page publique"
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/70 p-4">
            <div>
              <p className="font-medium text-foreground">
                Activer les avis clients
              </p>
              <p className="text-xs text-muted-foreground">
                Les locataires pourront laisser une évaluation publique.
              </p>
            </div>
            <Switch
              checked={values.enableReviews}
              onCheckedChange={(v) => update("enableReviews", v)}
              aria-label="Activer les avis clients"
            />
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-4 z-10 flex justify-end gap-2 rounded-2xl border border-border bg-white/90 p-3 shadow-md backdrop-blur">
        <Button
          variant="ghost"
          type="button"
          onClick={() => setValues(initialPublic)}
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
