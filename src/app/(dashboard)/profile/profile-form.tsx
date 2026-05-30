"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Save, X, Plus, RotateCcw } from "lucide-react";
import { z } from "zod";

import { updateProfile } from "@/actions/profile";
import { AvatarUploader } from "@/components/profile/avatar-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast-helper";
import { cn } from "@/lib/utils";
import { useAutoSave } from "@/hooks/use-autosave";
import { AutosaveIndicator } from "@/components/shared/autosave-indicator";

const STORAGE_KEY = "kaza-profile-data";
const AUTOSAVE_KEY = "kaza:user-profile";

const LANGUAGE_OPTIONS = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
  { value: "yo", label: "Yoruba" },
  { value: "fon", label: "Fon" },
  { value: "wo", label: "Wolof" },
];

const COUNTRY_OPTIONS = [
  { value: "BJ", label: "Bénin" },
  { value: "CI", label: "Côte d'Ivoire" },
  { value: "SN", label: "Sénégal" },
  { value: "TG", label: "Togo" },
  { value: "NG", label: "Nigeria" },
  { value: "GH", label: "Ghana" },
  { value: "FR", label: "France" },
];

const CURRENCY_OPTIONS = [
  { value: "XOF", label: "FCFA (XOF)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "USD", label: "Dollar US (USD)" },
];

const TIMEZONE_OPTIONS = [
  { value: "Africa/Porto-Novo", label: "Cotonou (GMT+1)" },
  { value: "Africa/Abidjan", label: "Abidjan (GMT)" },
  { value: "Africa/Lagos", label: "Lagos (GMT+1)" },
  { value: "Europe/Paris", label: "Paris (GMT+1)" },
];

const DATE_FORMAT_OPTIONS = [
  { value: "dd/MM/yyyy", label: "JJ/MM/AAAA (25/05/2026)" },
  { value: "yyyy-MM-dd", label: "AAAA-MM-JJ (2026-05-25)" },
  { value: "dd MMM yyyy", label: "JJ Mois AAAA (25 mai 2026)" },
];

const INTEREST_SUGGESTIONS = [
  "Architecture",
  "Décoration",
  "Voyages",
  "Cuisine",
  "Musique",
  "Sport",
  "Lecture",
  "Cinéma",
  "Photographie",
];

const profileSchema = z.object({
  firstName: z.string().min(2, "Prénom trop court").max(50),
  lastName: z.string().min(2, "Nom trop court").max(50),
  phone: z
    .string()
    .min(8, "Téléphone invalide")
    .regex(/^[+0-9\s-]+$/, "Caractères invalides")
    .or(z.literal("")),
  address: z.string().max(255, "Adresse trop longue").or(z.literal("")),
  birthDate: z.string().optional().or(z.literal("")),
  language: z.string(),
  country: z.string(),
  currency: z.string(),
  timezone: z.string(),
  dateFormat: z.string(),
  coverUrl: z.string().optional().or(z.literal("")),
  bio: z.string().max(500, "Maximum 500 caractères"),
  spokenLanguages: z.array(z.string()),
  interests: z.array(z.string()),
});

type ProfileData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  initialFirstName: string;
  initialLastName: string;
  initialEmail: string;
  initialPhone?: string;
  initialAddress?: string;
  initialBio?: string;
  userId: string;
  currentPhotoUrl?: string | null;
}

function readInitialData(
  base: ProfileData,
): { data: ProfileData; hadDraft: boolean } {
  if (typeof window === "undefined") return { data: base, hadDraft: false };
  // Priorité au brouillon autosave (kaza:user-profile)
  try {
    const raw = window.localStorage.getItem(AUTOSAVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ProfileData> & {
        __savedAt?: number;
      };
      delete parsed.__savedAt;
      return { data: { ...base, ...parsed }, hadDraft: true };
    }
  } catch {
    // ignore
  }
  // Fallback : ancien storage des données persistées
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ProfileData>;
      return { data: { ...base, ...parsed }, hadDraft: false };
    }
  } catch {
    // ignore corrupted state
  }
  return { data: base, hadDraft: false };
}

export function ProfileForm({
  initialFirstName,
  initialLastName,
  initialEmail,
  initialPhone = "",
  initialAddress = "",
  initialBio = "",
  userId,
  currentPhotoUrl,
}: ProfileFormProps) {
  // Lazy init : lecture localStorage au premier rendu (évite setState dans
  // un useEffect, conforme à react-hooks/set-state-in-effect).
  const [data, setData] = useState<ProfileData>(
    () =>
      readInitialData({
        firstName: initialFirstName,
        lastName: initialLastName,
        phone: initialPhone,
        address: initialAddress,
        birthDate: "",
        language: "fr",
        country: "BJ",
        currency: "XOF",
        timezone: "Africa/Porto-Novo",
        dateFormat: "dd/MM/yyyy",
        coverUrl: "",
        bio: initialBio,
        spokenLanguages: ["fr"],
        interests: [],
      }).data,
  );
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileData, string>>>(
    {}
  );
  const [newInterest, setNewInterest] = useState("");
  const [isPending, startTransition] = useTransition();

  // Auto-save (brouillon transparent dans localStorage)
  const {
    status,
    statusLabel,
    clear,
    flush,
    hasRestoredDraft,
    acknowledgeRestore,
  } = useAutoSave<ProfileData>({
    key: AUTOSAVE_KEY,
    data,
  });

  // Flush avant unmount pour ne perdre aucune modification
  useEffect(() => {
    return () => {
      flush();
    };
  }, [flush]);

  const update = <K extends keyof ProfileData>(
    key: K,
    value: ProfileData[K]
  ) => {
    setData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const toggleSpokenLanguage = (lang: string) => {
    setData((prev) => ({
      ...prev,
      spokenLanguages: prev.spokenLanguages.includes(lang)
        ? prev.spokenLanguages.filter((l) => l !== lang)
        : [...prev.spokenLanguages, lang],
    }));
  };

  const addInterest = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (data.interests.includes(trimmed)) return;
    if (data.interests.length >= 10) {
      toast.warning("Maximum 10 centres d'intérêt");
      return;
    }
    setData((prev) => ({ ...prev, interests: [...prev.interests, trimmed] }));
    setNewInterest("");
  };

  const removeInterest = (value: string) => {
    setData((prev) => ({
      ...prev,
      interests: prev.interests.filter((i) => i !== value),
    }));
  };

  const handleSave = () => {
    const result = profileSchema.safeParse(data);
    if (!result.success) {
      const nextErrors: Partial<Record<keyof ProfileData, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof ProfileData;
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      toast.error("Veuillez corriger les erreurs du formulaire");
      return;
    }

    // Persistance Supabase (champs reconnus par la table public.users)
    startTransition(async () => {
      const action = await updateProfile({
        firstName: result.data.firstName,
        lastName: result.data.lastName,
        phone: result.data.phone || undefined,
        address: result.data.address || undefined,
        bio: result.data.bio || undefined,
      });

      if (!action.success) {
        toast.error(action.error || "Erreur lors de l'enregistrement");
        return;
      }

      // Conserve les préférences locales (langue, devise, etc.) en
      // localStorage, le temps qu'on les pousse vers user_settings.
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(result.data));
      } catch {
        // ignore — non bloquant
      }
      clear();
      toast.success("Profil enregistré avec succès");
    });
  };

  const handleDiscardDraft = () => {
    clear();
    acknowledgeRestore();
    toast.info("Brouillon supprimé");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Informations du profil</CardTitle>
            <CardDescription>
              Vos données restent privées ; seul votre prénom et votre bio
              publique sont visibles par les autres utilisateurs.
            </CardDescription>
          </div>
          <AutosaveIndicator status={status} label={statusLabel} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 rounded-lg border border-border bg-muted/30 p-4">
          <AvatarUploader
            currentUrl={currentPhotoUrl}
            userId={userId}
            firstName={initialFirstName}
            lastName={initialLastName}
          />
        </div>
        {hasRestoredDraft && (
          <div className="mb-4 flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
            <span>
              <strong>Brouillon restauré</strong> — nous avons récupéré vos
              modifications non enregistrées.
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
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="w-full sm:w-fit">
            <TabsTrigger value="personal">Infos perso</TabsTrigger>
            <TabsTrigger value="preferences">Préférences</TabsTrigger>
            <TabsTrigger value="public">Bio publique</TabsTrigger>
          </TabsList>

          {/* Infos perso */}
          <TabsContent value="personal" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Prénom" error={errors.firstName} htmlFor="firstName">
                <Input
                  id="firstName"
                  value={data.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                />
              </Field>
              <Field label="Nom" error={errors.lastName} htmlFor="lastName">
                <Input
                  id="lastName"
                  value={data.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                />
              </Field>
            </div>
            <Field label="Email" htmlFor="email">
              <Input id="email" type="email" value={initialEmail} disabled />
              <p className="mt-1 text-xs text-muted-foreground">
                Pour modifier votre email, contactez le support.
              </p>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Téléphone" error={errors.phone} htmlFor="phone">
                <Input
                  id="phone"
                  type="tel"
                  value={data.phone}
                  placeholder="Votre numéro de téléphone"
                  onChange={(e) => update("phone", e.target.value)}
                />
              </Field>
              <Field label="Date de naissance" htmlFor="birthDate">
                <Input
                  id="birthDate"
                  type="date"
                  value={data.birthDate}
                  onChange={(e) => update("birthDate", e.target.value)}
                />
              </Field>
            </div>
            <Field label="Adresse" error={errors.address} htmlFor="address">
              <Input
                id="address"
                value={data.address}
                placeholder="Rue, quartier, ville"
                onChange={(e) => update("address", e.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Langue préférée" htmlFor="language">
                <Select
                  value={data.language}
                  onValueChange={(v) => update("language", v)}
                >
                  <SelectTrigger id="language" className="w-full">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Pays" htmlFor="country">
                <Select
                  value={data.country}
                  onValueChange={(v) => update("country", v)}
                >
                  <SelectTrigger id="country" className="w-full">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </TabsContent>

          {/* Préférences */}
          <TabsContent value="preferences" className="space-y-4">
            <Field label="Devise affichée" htmlFor="currency">
              <Select
                value={data.currency}
                onValueChange={(v) => update("currency", v)}
              >
                <SelectTrigger id="currency" className="w-full">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Fuseau horaire" htmlFor="timezone">
              <Select
                value={data.timezone}
                onValueChange={(v) => update("timezone", v)}
              >
                <SelectTrigger id="timezone" className="w-full">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Format de date" htmlFor="dateFormat">
              <Select
                value={data.dateFormat}
                onValueChange={(v) => update("dateFormat", v)}
              >
                <SelectTrigger id="dateFormat" className="w-full">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {DATE_FORMAT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </TabsContent>

          {/* Bio publique */}
          <TabsContent value="public" className="space-y-4">
            <Field label="Photo de couverture" htmlFor="coverUrl">
              <div className="space-y-2">
                <div
                  className={cn(
                    "relative aspect-[3/1] w-full overflow-hidden rounded-lg border border-dashed bg-gradient-to-br from-kaza-navy/10 via-kaza-blue/10 to-kaza-green/10"
                  )}
                  style={
                    data.coverUrl
                      ? {
                          backgroundImage: `url(${data.coverUrl})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                      : undefined
                  }
                />
                <Input
                  id="coverUrl"
                  placeholder="https://exemple.com/photo.jpg"
                  value={data.coverUrl}
                  onChange={(e) => update("coverUrl", e.target.value)}
                />
              </div>
            </Field>
            <Field
              label={`Bio (${data.bio.length}/500)`}
              error={errors.bio}
              htmlFor="bio"
            >
              <Textarea
                id="bio"
                rows={5}
                maxLength={500}
                value={data.bio}
                onChange={(e) => update("bio", e.target.value)}
                placeholder="Présentez-vous en quelques lignes..."
              />
            </Field>
            <Field label="Langues parlées" htmlFor="spoken">
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map((opt) => {
                  const active = data.spokenLanguages.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleSpokenLanguage(opt.value)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-sm transition-colors",
                        active
                          ? "border-kaza-navy bg-kaza-navy text-white"
                          : "border-border bg-background text-foreground hover:bg-muted"
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </Field>
            <Field label="Centres d'intérêt" htmlFor="interests">
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {data.interests.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="gap-1 bg-kaza-blue/10 text-kaza-navy hover:bg-kaza-blue/20"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeInterest(tag)}
                        aria-label={`Retirer ${tag}`}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-kaza-navy/10"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                  {data.interests.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Aucun centre d&apos;intérêt — ajoutez-en jusqu&apos;à 10.
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    id="interests"
                    placeholder="Ajouter un centre d'intérêt"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addInterest(newInterest);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addInterest(newInterest)}
                  >
                    <Plus className="mr-1 size-4" />
                    Ajouter
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_SUGGESTIONS.filter(
                    (s) => !data.interests.includes(s)
                  )
                    .slice(0, 6)
                    .map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => addInterest(s)}
                        className="rounded-full border border-dashed border-border px-3 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted"
                      >
                        + {s}
                      </button>
                    ))}
                </div>
              </div>
            </Field>
          </TabsContent>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Save className="mr-2 size-4" />
              )}
              {isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
