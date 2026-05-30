"use client";

// =============================================================================
// KAZA — Wizard de création/publication d'un bien (8 étapes)
//
// Étapes :
//   1. Type de bien (+ louer/vendre)
//   2. Localisation (pays → ville → quartier + adresse + repère)
//   3. Caractéristiques (titre, description, surface, pièces, étages, année)
//   4. Équipements (16 amenities + 2 règles)
//   5. Médias (photos, vidéo, vue 360°, plan)
//   6. Prix (loyer, charges, dépôt, agence, négo)
//   7. Disponibilité + cibles
//   8. Publication (DRAFT / PUBLISHED / SCHEDULED) + récap
//
// Auto-save : `useAutoSave({ key: "kaza:property-draft-v2", excludeKeys: ["photos"] })`
// Restoration : toast au montage avec bouton "Repartir de zéro"
// Submission : alert + toast + clear() + router.push("/owner/properties")
// =============================================================================

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { toast } from "@/components/ui/toast-helper";
import {
  AirVent,
  ArrowLeft,
  ArrowRight,
  Bath,
  BedDouble,
  Building2,
  CalendarClock,
  Camera,
  Car,
  Check,
  CheckCircle2,
  ChevronRight,
  Cigarette,
  Cloud,
  Cog,
  Compass,
  Crown,
  Dog,
  DollarSign,
  Droplet,
  Eye,
  FileText,
  Flame,
  Globe,
  Home,
  Image as ImageIcon,
  LandPlot,
  Layers,
  Loader2,
  MapPin,
  Maximize2,
  Navigation,
  Save,
  Shield,
  Sofa,
  Sparkles,
  Store,
  TreePalm,
  TreePine,
  Trees,
  Trophy,
  Users,
  Video,
  Warehouse,
  Waves,
  Wifi,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAutoSave } from "@/hooks/use-autosave";
import {
  getCityBySlug,
  getCountryByCode,
  COUNTRIES,
} from "@/lib/geo/locations";
import { cn } from "@/lib/utils";
import { Panorama360Viewer } from "@/components/property/panorama-360-viewer";
import { PhotoUploader } from "@/components/property/photo-uploader";
import { CountryFlag } from "@/components/shared/country-flag";
import {
  PROPERTY_TYPES,
  TARGET_AUDIENCES,
  propertyFormSchema,
  propertyStepFieldKeys,
  type PropertyFormData,
} from "@/validators/property";

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const AUTOSAVE_KEY = "kaza:property-draft-v2";

const STEP_DEFS: {
  number: number;
  label: string;
  icon: LucideIcon;
  shortLabel: string;
}[] = [
  { number: 1, label: "Type de bien", shortLabel: "Type", icon: Home },
  { number: 2, label: "Localisation", shortLabel: "Lieu", icon: MapPin },
  {
    number: 3,
    label: "Caractéristiques",
    shortLabel: "Caractéristiques",
    icon: Layers,
  },
  {
    number: 4,
    label: "Équipements",
    shortLabel: "Équipements",
    icon: Sparkles,
  },
  { number: 5, label: "Médias", shortLabel: "Médias", icon: Camera },
  { number: 6, label: "Prix", shortLabel: "Prix", icon: DollarSign },
  {
    number: 7,
    label: "Disponibilité",
    shortLabel: "Dispo",
    icon: CalendarClock,
  },
  { number: 8, label: "Publication", shortLabel: "Publier", icon: Eye },
];

const TOTAL_STEPS = STEP_DEFS.length;

const PROPERTY_TYPE_CARDS: {
  value: (typeof PROPERTY_TYPES)[number];
  label: string;
  icon: LucideIcon;
  description: string;
  popular?: boolean;
}[] = [
  {
    value: "APARTMENT",
    label: "Appartement",
    icon: Building2,
    description: "Lot dans un immeuble",
    popular: true,
  },
  {
    value: "HOUSE",
    label: "Maison",
    icon: Home,
    description: "Maison individuelle",
  },
  {
    value: "VILLA",
    label: "Villa",
    icon: TreePalm,
    description: "Villa haut de gamme",
  },
  {
    value: "STUDIO",
    label: "Studio",
    icon: BedDouble,
    description: "Pièce unique",
  },
  {
    value: "OFFICE",
    label: "Bureau",
    icon: Warehouse,
    description: "Espace professionnel",
  },
  {
    value: "LAND",
    label: "Terrain",
    icon: LandPlot,
    description: "Parcelle nue",
  },
  {
    value: "COMMERCIAL",
    label: "Commercial",
    icon: Store,
    description: "Boutique, local",
  },
];

const AMENITIES: {
  key: keyof PropertyFormData;
  label: string;
  icon: LucideIcon;
}[] = [
  { key: "furnished", label: "Meublé", icon: Sofa },
  { key: "airConditioning", label: "Climatisation", icon: AirVent },
  { key: "heating", label: "Chauffage", icon: Flame },
  { key: "internet", label: "Internet / Wifi", icon: Wifi },
  { key: "parking", label: "Parking", icon: Car },
  { key: "garage", label: "Garage", icon: Warehouse },
  { key: "pool", label: "Piscine", icon: Waves },
  { key: "garden", label: "Jardin", icon: TreePine },
  { key: "terrace", label: "Terrasse", icon: Trees },
  { key: "balcony", label: "Balcon", icon: Cloud },
  { key: "elevator", label: "Ascenseur", icon: ChevronRight },
  { key: "security", label: "Sécurité 24h", icon: Shield },
  { key: "generator", label: "Groupe électrogène", icon: Zap },
  { key: "waterTank", label: "Citerne d'eau", icon: Droplet },
];

const RULES: {
  key: keyof PropertyFormData;
  label: string;
  icon: LucideIcon;
}[] = [
  { key: "petsAllowed", label: "Animaux acceptés", icon: Dog },
  { key: "smokingAllowed", label: "Fumeurs acceptés", icon: Cigarette },
];

const TARGET_LABELS: Record<(typeof TARGET_AUDIENCES)[number], { label: string; icon: LucideIcon }> = {
  STUDENT: { label: "Étudiant", icon: BedDouble },
  FAMILY: { label: "Famille", icon: Users },
  PROFESSIONAL: { label: "Professionnel", icon: Wrench },
  EXPAT: { label: "Expatrié", icon: Globe },
  SHORT_TERM: { label: "Court terme", icon: CalendarClock },
  LONG_TERM: { label: "Long terme", icon: CalendarClock },
};


// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULTS: PropertyFormData = {
  type: "APARTMENT",
  listingPurpose: "RENT",
  countryCode: "",
  citySlug: "",
  neighborhoodSlug: "",
  addressLine: "",
  lat: undefined,
  lng: undefined,
  landmark: "",
  title: "",
  description: "",
  surface: 0,
  rooms: 0,
  bedrooms: 0,
  bathrooms: 0,
  floor: undefined,
  totalFloors: undefined,
  yearBuilt: undefined,
  furnished: false,
  airConditioning: false,
  heating: false,
  parking: false,
  garage: false,
  pool: false,
  garden: false,
  terrace: false,
  balcony: false,
  elevator: false,
  internet: false,
  security: false,
  generator: false,
  waterTank: false,
  petsAllowed: false,
  smokingAllowed: false,
  photos: [],
  videoUrl: "",
  panorama360Url: "",
  floorPlanUrl: "",
  priceMonthly: 0,
  charges: 0,
  depositMonths: 2,
  agencyFees: 0,
  negotiable: false,
  availableFrom: "",
  minStayMonths: 12,
  targetAudiences: [],
  publishStatus: "DRAFT",
  scheduledAt: "",
  premium: false,
};

const formatFCFA = (n: number): string => {
  if (!n || Number.isNaN(n)) return "0 FCFA";
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)} M FCFA`;
  }
  if (n >= 1_000) return `${(n / 1000).toFixed(0)}k FCFA`;
  return `${n.toLocaleString("fr-FR")} FCFA`;
};

const formatFCFAFull = (n: number): string =>
  `${(n ?? 0).toLocaleString("fr-FR")} FCFA`;

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------

export function PropertyCreateWizard({ userId }: { userId: string }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [maxReached, setMaxReached] = useState(1);
  const [isSubmitting, startSubmit] = useTransition();
  const [didAckRestore, setDidAckRestore] = useState(false);
  const [showRestoreCta, setShowRestoreCta] = useState(false);

  // NOTE: les `.default()` dans le schéma rendent l'entrée optionnelle alors
  // que la sortie est complète. On cast le resolver pour réconcilier les
  // types — RHF reçoit toujours nos DEFAULTS complets en pratique.
  const form = useForm<PropertyFormData>({
    resolver: zodResolver(
      propertyFormSchema,
    ) as unknown as import("react-hook-form").Resolver<PropertyFormData>,
    defaultValues: DEFAULTS,
    mode: "onTouched",
  });

  const watched = form.watch();

  const autoSave = useAutoSave<PropertyFormData>({
    key: AUTOSAVE_KEY,
    data: watched,
    excludeKeys: ["photos"],
  });

  // Restauration au montage
  useEffect(() => {
    if (didAckRestore) return;
    const draft = autoSave.restore();
    if (draft) {
      Object.entries(draft).forEach(([k, v]) => {
        if (k === "photos") return;
        if (v === undefined || v === null) return;
        form.setValue(k as keyof PropertyFormData, v as never, {
          shouldDirty: false,
          shouldValidate: false,
        });
      });
      toast.info(
        "Brouillon restauré — reprenez là où vous vous étiez arrêté",
        { duration: 6000 },
      );
      setShowRestoreCta(true);
    }
    autoSave.acknowledgeRestore();
    setDidAckRestore(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goNext = async () => {
    const keys = propertyStepFieldKeys[
      currentStep as keyof typeof propertyStepFieldKeys
    ] as (keyof PropertyFormData)[];
    const ok = await form.trigger(keys, { shouldFocus: true });
    if (!ok) {
      toast.error("Veuillez corriger les erreurs avant de continuer");
      return;
    }
    const next = Math.min(currentStep + 1, TOTAL_STEPS);
    setCurrentStep(next);
    setMaxReached((p) => Math.max(p, next));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goPrev = () => {
    setCurrentStep((s) => Math.max(1, s - 1));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const jumpTo = (step: number) => {
    if (step <= maxReached) {
      setCurrentStep(step);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const exitAndSave = () => {
    toast.success(
      "Brouillon sauvegardé — vous pourrez le retrouver à votre prochaine visite",
    );
    router.push("/owner/properties");
  };

  const resetDraft = () => {
    autoSave.clear();
    form.reset(DEFAULTS);
    setCurrentStep(1);
    setMaxReached(1);
    setShowRestoreCta(false);
    toast.success("Brouillon effacé — repartons de zéro");
  };

  const submitFinal = async () => {
    const ok = await form.trigger(undefined, { shouldFocus: true });
    if (!ok) {
      toast.error(
        "Certains champs sont incomplets. Vérifiez chaque étape avant de publier.",
      );
      return;
    }
    startSubmit(async () => {
      const values = form.getValues();
      try {
        // Mapping wizard schema → server action schema (DB shape)
        const { createProperty } = await import("@/actions/properties");
        const typeMap: Record<string, string> = {
          APARTMENT: "APARTMENT",
          HOUSE: "HOUSE",
          VILLA: "VILLA",
          STUDIO: "STUDIO",
          OFFICE: "COMMERCIAL",
          LAND: "LAND",
          COMMERCIAL: "COMMERCIAL",
        };
        const fullAddress = [
          values.addressLine,
          values.neighborhoodSlug,
          values.citySlug,
          values.countryCode,
        ]
          .filter(Boolean)
          .join(", ");
        const amenities: string[] = [];
        if (values.furnished) amenities.push("Meublé");
        if (values.airConditioning) amenities.push("Climatisation");
        if (values.parking) amenities.push("Parking");
        if (values.garage) amenities.push("Garage");
        if (values.pool) amenities.push("Piscine");
        if (values.garden) amenities.push("Jardin");
        if (values.terrace) amenities.push("Terrasse");
        if (values.balcony) amenities.push("Balcon");
        if (values.elevator) amenities.push("Ascenseur");
        if (values.internet) amenities.push("Internet");
        if (values.security) amenities.push("Sécurité 24/7");
        if (values.generator) amenities.push("Groupe électrogène");
        if (values.waterTank) amenities.push("Forage / Citerne");
        if (values.petsAllowed) amenities.push("Animaux acceptés");

        const result = await createProperty({
          title: values.title,
          description: values.description,
          price: values.priceMonthly,
          bedrooms: values.bedrooms,
          bathrooms: values.bathrooms,
          squareMeters: values.surface,
          propertyType: (typeMap[values.type] ?? "APARTMENT") as
            | "APARTMENT"
            | "HOUSE"
            | "VILLA"
            | "STUDIO"
            | "COMMERCIAL"
            | "LAND"
            | "ROOM",
          address: fullAddress,
          amenities,
          locationLatitude: values.lat,
          locationLongitude: values.lng,
          photos: [],
        } as unknown as Parameters<typeof createProperty>[0]);

        if (!result.success) {
          toast.error(
            "Échec de la création : " + (result.error ?? "Erreur inconnue"),
          );
          return;
        }

        // Persiste les URLs des photos uploadées dans property_photos
        const photoUrls = (values.photos ?? []) as string[];
        if (result.data?.id && photoUrls.length > 0) {
          try {
            const { saveUploadedPhotoUrls } = await import(
              "@/actions/property-photos"
            );
            const photoResult = await saveUploadedPhotoUrls(
              result.data.id,
              photoUrls,
            );
            if (!photoResult.success) {
              toast.warning(
                `Annonce créée mais les photos n'ont pas pu être enregistrées : ${photoResult.error ?? "erreur inconnue"}`,
              );
            }
          } catch (photoErr) {
            console.error(
              "[PropertyCreateWizard] saveUploadedPhotoUrls error:",
              photoErr,
            );
            toast.warning(
              "Annonce créée, mais l'enregistrement des photos a échoué. Vous pourrez les ajouter plus tard.",
            );
          }
        }

        autoSave.clear();
        const status = values.publishStatus;
        toast.success(
          status === "PUBLISHED"
            ? "Annonce créée ! Elle sera visible après modération (ou immédiatement si vous êtes vérifié)."
            : status === "SCHEDULED"
              ? "Brouillon enregistré. Publication programmée à venir."
              : "Brouillon enregistré. Vous pourrez le finaliser plus tard.",
          { duration: 6000 },
        );
        router.push("/owner/properties");
        router.refresh();
      } catch (err) {
        console.error("[PropertyCreateWizard] submit error:", err);
        toast.error(
          "Une erreur est survenue. Vérifiez votre connexion et réessayez.",
        );
      }
    });
  };

  const currentDef = STEP_DEFS[currentStep - 1];
  const progressPct = (currentStep / TOTAL_STEPS) * 100;
  const StepIcon = currentDef.icon;

  return (
    <FormProvider {...form}>
      {/* TOP BAR STICKY */}
      <div className="sticky top-0 z-30 -mx-2 mb-6 border-b bg-background/95 px-2 py-3 backdrop-blur sm:-mx-4 sm:px-4">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-kaza-navy text-white">
              <StepIcon className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Étape {currentStep} / {TOTAL_STEPS}
              </p>
              <h2 className="font-heading text-base font-bold leading-tight text-foreground sm:text-lg">
                {currentDef.label}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showRestoreCta && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetDraft}
                className="hidden gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive md:inline-flex"
              >
                <X className="size-3.5" />
                Repartir de zéro
              </Button>
            )}
            <AutosaveBadge status={autoSave.status} label={autoSave.statusLabel} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={exitAndSave}
              className="gap-1.5"
            >
              <Save className="size-3.5" />
              <span className="hidden sm:inline">Quitter & sauvegarder</span>
              <span className="sm:hidden">Sortir</span>
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-3 max-w-[1100px]">
          <Progress value={progressPct} className="h-1.5" />
        </div>
      </div>

      {/* STEPPER VISUEL */}
      <div className="mb-6 hidden sm:block">
        <ol className="flex items-center gap-1">
          {STEP_DEFS.map((s, i) => {
            const Icon = s.icon;
            const status =
              s.number < currentStep
                ? "done"
                : s.number === currentStep
                  ? "current"
                  : "todo";
            const reachable = s.number <= maxReached;
            return (
              <li key={s.number} className="flex flex-1 items-center">
                <button
                  type="button"
                  onClick={() => jumpTo(s.number)}
                  disabled={!reachable}
                  className={cn(
                    "group flex flex-col items-center gap-1.5 px-1",
                    reachable
                      ? "cursor-pointer"
                      : "cursor-not-allowed opacity-60",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-full border-2 transition-all",
                      status === "done" &&
                        "border-kaza-green bg-kaza-green text-white",
                      status === "current" &&
                        "border-kaza-navy bg-kaza-navy text-white ring-4 ring-kaza-navy/15",
                      status === "todo" &&
                        "border-border bg-background text-muted-foreground",
                    )}
                  >
                    {status === "done" ? (
                      <Check className="size-4" />
                    ) : (
                      <Icon className="size-4" />
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-medium uppercase tracking-wide",
                      status === "current"
                        ? "text-kaza-navy"
                        : status === "done"
                          ? "text-kaza-green"
                          : "text-muted-foreground",
                    )}
                  >
                    {s.shortLabel}
                  </span>
                </button>
                {i < STEP_DEFS.length - 1 && (
                  <div
                    className={cn(
                      "mx-1 h-0.5 flex-1 transition-colors",
                      s.number < currentStep ? "bg-kaza-green" : "bg-border",
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* CARD CONTAINER */}
      <Card className="overflow-hidden border-border/60 shadow-sm">
        <div className="p-5 sm:p-8">
          {currentStep === 1 && <Step1Type />}
          {currentStep === 2 && <Step2Location />}
          {currentStep === 3 && <Step3Characteristics />}
          {currentStep === 4 && <Step4Amenities />}
          {currentStep === 5 && <Step5Media userId={userId} />}
          {currentStep === 6 && <Step6Price />}
          {currentStep === 7 && <Step7Availability />}
          {currentStep === 8 && <Step8Publish />}
        </div>

        {/* NAVIGATION */}
        <div className="flex flex-col-reverse gap-3 border-t bg-muted/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Button
            type="button"
            variant="ghost"
            onClick={goPrev}
            disabled={currentStep === 1 || isSubmitting}
            className="gap-1.5"
          >
            <ArrowLeft className="size-4" />
            Précédent
          </Button>

          <div className="flex items-center gap-2">
            {currentStep < TOTAL_STEPS ? (
              <Button
                type="button"
                onClick={goNext}
                className="gap-1.5 bg-kaza-blue text-white hover:bg-kaza-blue/90"
              >
                Suivant
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={submitFinal}
                disabled={isSubmitting}
                size="lg"
                className="gap-2 bg-kaza-green px-6 text-base text-white hover:bg-kaza-green/90"
              >
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : watched.publishStatus === "PUBLISHED" ? (
                  <Sparkles className="size-4" />
                ) : (
                  <Save className="size-4" />
                )}
                {isSubmitting
                  ? "Envoi…"
                  : watched.publishStatus === "PUBLISHED"
                    ? "Publier mon annonce"
                    : watched.publishStatus === "SCHEDULED"
                      ? "Programmer la publication"
                      : "Enregistrer le brouillon"}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </FormProvider>
  );
}

// ---------------------------------------------------------------------------
// Sous-composants utilitaires
// ---------------------------------------------------------------------------

function AutosaveBadge({
  status,
  label,
}: {
  status: "idle" | "saving" | "saved" | "error";
  label: string;
}) {
  return (
    <div
      className={cn(
        "hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium md:inline-flex",
        status === "saved" &&
          "border-kaza-green/30 bg-kaza-green/10 text-kaza-green",
        status === "saving" &&
          "border-kaza-blue/30 bg-kaza-blue/10 text-kaza-blue",
        status === "idle" && "border-border bg-muted text-muted-foreground",
        status === "error" &&
          "border-destructive/40 bg-destructive/10 text-destructive",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "saved" && "bg-kaza-green",
          status === "saving" && "animate-pulse bg-kaza-blue",
          status === "idle" && "bg-muted-foreground",
          status === "error" && "bg-destructive",
        )}
      />
      {label}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-destructive">{message}</p>;
}

function StepHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <header className="mb-6">
      <h3 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
        {title}
      </h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
    </header>
  );
}

function Counter({
  current,
  min,
  max,
}: {
  current: number;
  min: number;
  max: number;
}) {
  const ok = current >= min && current <= max;
  return (
    <span
      className={cn(
        "ml-2 text-[11px] font-medium tabular-nums",
        ok ? "text-muted-foreground" : "text-destructive",
      )}
    >
      {current} / {max}
      {current < min && ` (min ${min})`}
    </span>
  );
}

// ---------------------------------------------------------------------------
// ÉTAPE 1 — TYPE DE BIEN
// ---------------------------------------------------------------------------

function Step1Type() {
  const { watch, setValue, formState } = useFormContext<PropertyFormData>();
  const type = watch("type");
  const purpose = watch("listingPurpose");

  return (
    <div>
      <StepHeader
        title="Quel type de bien souhaitez-vous publier ?"
        subtitle="Cela nous aide à mieux structurer votre annonce."
      />

      {/* Toggle RENT / SALE */}
      <div className="mb-6 inline-flex rounded-xl border bg-muted/40 p-1">
        {(["RENT", "SALE"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setValue("listingPurpose", p, { shouldDirty: true })}
            className={cn(
              "rounded-lg px-5 py-2 text-sm font-medium transition-all",
              purpose === p
                ? "bg-white text-kaza-navy shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {p === "RENT" ? "Louer" : "Vendre"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {PROPERTY_TYPE_CARDS.map((card) => {
          const Icon = card.icon;
          const active = type === card.value;
          return (
            <button
              key={card.value}
              type="button"
              onClick={() =>
                setValue("type", card.value, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              className={cn(
                "group relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all sm:p-6",
                active
                  ? "border-kaza-blue bg-kaza-blue/5 shadow-md"
                  : "border-border hover:border-kaza-blue/40 hover:bg-muted/40",
              )}
            >
              {card.popular && (
                <Badge className="absolute -top-2 right-2 bg-kaza-green text-white">
                  + populaire
                </Badge>
              )}
              <span
                className={cn(
                  "flex size-14 items-center justify-center rounded-2xl transition-colors",
                  active
                    ? "bg-kaza-blue text-white"
                    : "bg-muted text-muted-foreground group-hover:bg-kaza-blue/10 group-hover:text-kaza-blue",
                )}
              >
                <Icon className="size-7" />
              </span>
              <span className="text-sm font-semibold text-foreground">
                {card.label}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {card.description}
              </span>
              {active && (
                <CheckCircle2 className="absolute right-2 top-2 size-5 text-kaza-blue" />
              )}
            </button>
          );
        })}
      </div>

      <FieldError message={formState.errors.type?.message} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// ÉTAPE 2 — LOCALISATION
// ---------------------------------------------------------------------------

function Step2Location() {
  const { watch, setValue, register, formState } =
    useFormContext<PropertyFormData>();

  const countryCode = watch("countryCode");
  const citySlug = watch("citySlug");
  const neighborhoodSlug = watch("neighborhoodSlug");
  const lat = watch("lat");
  const lng = watch("lng");

  // Tous les pays africains sont sélectionnables (pas de restriction "bientôt").
  const countries = useMemo(
    () => [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name, "fr")),
    [],
  );

  const country = countryCode ? getCountryByCode(countryCode) : undefined;
  const city =
    countryCode && citySlug ? getCityBySlug(countryCode, citySlug) : undefined;
  const neighborhood = city?.neighborhoods.find(
    (n) => n.slug === neighborhoodSlug,
  );

  // Quand on change de pays, on reset ville+quartier
  const handleCountryChange = (code: string) => {
    setValue("countryCode", code, { shouldValidate: true, shouldDirty: true });
    setValue("citySlug", "", { shouldValidate: false });
    setValue("neighborhoodSlug", "", { shouldValidate: false });
    setValue("lat", undefined);
    setValue("lng", undefined);
  };

  const handleCityChange = (slug: string) => {
    setValue("citySlug", slug, { shouldValidate: true, shouldDirty: true });
    setValue("neighborhoodSlug", "", { shouldValidate: false });
    const c = getCityBySlug(countryCode, slug);
    if (c) {
      setValue("lat", c.lat);
      setValue("lng", c.lng);
    }
  };

  const handleGeolocate = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Géolocalisation non disponible sur votre appareil");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue("lat", pos.coords.latitude);
        setValue("lng", pos.coords.longitude);
        toast.success("Position détectée");
      },
      () => {
        toast.error("Impossible de récupérer votre position");
      },
    );
  };

  return (
    <div>
      <StepHeader
        title="Où se trouve votre bien ?"
        subtitle="Une localisation précise permet d'obtenir plus de visites de qualité."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* PAYS */}
        <div className="lg:col-span-2">
          <Label className="text-sm font-semibold">
            Pays <span className="text-destructive">*</span>
          </Label>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {countries.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => handleCountryChange(c.code)}
                className={cn(
                  "flex items-center gap-2 rounded-xl border-2 p-3 text-sm transition-all",
                  countryCode === c.code
                    ? "border-kaza-blue bg-kaza-blue/5"
                    : "border-border hover:border-kaza-blue/40",
                )}
              >
                <CountryFlag code={c.code} className="h-4 w-6" />
                <span className="font-medium text-foreground">{c.name}</span>
              </button>
            ))}
          </div>
          <FieldError message={formState.errors.countryCode?.message} />
        </div>

        {/* VILLE */}
        <div>
          <Label htmlFor="city" className="text-sm font-semibold">
            Ville <span className="text-destructive">*</span>
          </Label>
          <Select
            value={citySlug}
            onValueChange={handleCityChange}
            disabled={!country}
          >
            <SelectTrigger id="city" className="mt-1.5 w-full">
              <SelectValue
                placeholder={
                  country ? "Choisir une ville" : "Sélectionnez d'abord un pays"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {country?.cities.map((c) => (
                <SelectItem key={c.slug} value={c.slug}>
                  {c.name}
                  {c.isCapital && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      Capitale
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={formState.errors.citySlug?.message} />
        </div>

        {/* QUARTIER */}
        <div>
          <Label htmlFor="neighborhood" className="text-sm font-semibold">
            Quartier <span className="text-destructive">*</span>
          </Label>
          <Select
            value={neighborhoodSlug}
            onValueChange={(v) =>
              setValue("neighborhoodSlug", v, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
            disabled={!city}
          >
            <SelectTrigger id="neighborhood" className="mt-1.5 w-full">
              <SelectValue
                placeholder={
                  city ? "Choisir un quartier" : "Sélectionnez d'abord une ville"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {city?.neighborhoods.map((n) => (
                <SelectItem key={n.slug} value={n.slug}>
                  <div className="flex w-full items-center justify-between gap-3">
                    <span>{n.name}</span>
                    <span className="text-xs font-bold text-kaza-blue">
                      {"€".repeat(n.priceTier)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {neighborhood && (
            <div className="mt-2 flex flex-wrap gap-1">
              {neighborhood.tags.map((t) => (
                <Badge key={t} variant="outline" className="text-[10px]">
                  {t}
                </Badge>
              ))}
            </div>
          )}
          <FieldError message={formState.errors.neighborhoodSlug?.message} />
        </div>

        {/* ADRESSE */}
        <div className="lg:col-span-2">
          <Label htmlFor="addressLine" className="text-sm font-semibold">
            Adresse précise <span className="text-destructive">*</span>
          </Label>
          <Input
            id="addressLine"
            placeholder="Rue 12.345, Lot 6 — ou indications détaillées"
            className="mt-1.5"
            {...register("addressLine")}
          />
          <FieldError message={formState.errors.addressLine?.message} />
        </div>

        {/* REPÈRE */}
        <div className="lg:col-span-2">
          <Label htmlFor="landmark" className="text-sm font-semibold">
            Repère{" "}
            <span className="text-xs font-normal text-muted-foreground">
              (optionnel)
            </span>
          </Label>
          <Input
            id="landmark"
            placeholder="Près de l'école Notre-Dame, en face de la station Total"
            className="mt-1.5"
            {...register("landmark")}
          />
        </div>

        {/* MINI CARTE */}
        <div className="lg:col-span-2">
          <Label className="text-sm font-semibold">Localisation GPS</Label>
          <div className="mt-1.5 overflow-hidden rounded-xl border bg-gradient-to-br from-kaza-blue/5 via-muted to-kaza-green/5">
            <div className="relative h-44 w-full">
              {/* Grille décorative */}
              <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(0,0,0,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.06)_1px,transparent_1px)] [background-size:24px_24px]" />
              <div className="absolute inset-0 flex items-center justify-center">
                {lat && lng ? (
                  <div className="text-center">
                    <div className="relative inline-flex">
                      <span className="absolute -inset-3 animate-ping rounded-full bg-kaza-blue/30" />
                      <MapPin className="relative size-8 text-kaza-blue drop-shadow" />
                    </div>
                    <p className="mt-3 text-sm font-medium text-foreground">
                      {lat.toFixed(4)}, {lng.toFixed(4)}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Sélectionnez une ville pour pré-remplir la localisation
                  </p>
                )}
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleGeolocate}
                className="absolute bottom-3 right-3 gap-1.5 bg-white"
              >
                <Navigation className="size-3.5" />
                Centrer sur ma position
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ÉTAPE 3 — CARACTÉRISTIQUES
// ---------------------------------------------------------------------------

function Step3Characteristics() {
  const { register, watch, formState } = useFormContext<PropertyFormData>();
  const title = watch("title") ?? "";
  const description = watch("description") ?? "";

  return (
    <div>
      <StepHeader
        title="Décrivez votre bien"
        subtitle="Un bon titre et une description claire augmentent vos chances de location."
      />

      <div className="space-y-5">
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="title" className="text-sm font-semibold">
              Titre <span className="text-destructive">*</span>
            </Label>
            <Counter current={title.length} min={10} max={120} />
          </div>
          <Input
            id="title"
            placeholder="Ex : Bel appartement meublé 3 pièces à Cadjèhoun avec piscine"
            className="mt-1.5"
            {...register("title")}
          />
          <FieldError message={formState.errors.title?.message} />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="description" className="text-sm font-semibold">
              Description <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-3">
              <Counter current={description.length} min={50} max={3000} />
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md bg-kaza-blue/10 px-2 py-0.5 text-[11px] font-medium text-kaza-blue hover:bg-kaza-blue/20"
                title="Aide à la rédaction (bientôt)"
                onClick={() =>
                  toast.info(
                    "Bientôt : assistant IA — décrivez en 1 phrase, on rédige tout.",
                  )
                }
              >
                <Sparkles className="size-3" />
                Aide à la rédaction
              </button>
            </div>
          </div>
          <Textarea
            id="description"
            placeholder="État du bien, voisinage, commodités, transports, points forts..."
            className="mt-1.5 min-h-[160px]"
            {...register("description")}
          />
          <FieldError message={formState.errors.description?.message} />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <NumberField
            name="surface"
            label="Surface"
            suffix="m²"
            icon={Maximize2}
            error={formState.errors.surface?.message}
          />
          <NumberField
            name="rooms"
            label="Pièces"
            icon={Home}
            error={formState.errors.rooms?.message}
          />
          <NumberField
            name="bedrooms"
            label="Chambres"
            icon={BedDouble}
            error={formState.errors.bedrooms?.message}
          />
          <NumberField
            name="bathrooms"
            label="Salles de bain"
            icon={Bath}
            error={formState.errors.bathrooms?.message}
          />
          <NumberField
            name="floor"
            label="Étage"
            optional
            icon={Layers}
            error={formState.errors.floor?.message}
          />
          <NumberField
            name="yearBuilt"
            label="Année construction"
            optional
            placeholder="2018"
            icon={Cog}
            error={formState.errors.yearBuilt?.message}
          />
        </div>
      </div>
    </div>
  );
}

function NumberField({
  name,
  label,
  suffix,
  optional,
  placeholder,
  icon: Icon,
  error,
}: {
  name: keyof PropertyFormData;
  label: string;
  suffix?: string;
  optional?: boolean;
  placeholder?: string;
  icon?: LucideIcon;
  error?: string;
}) {
  const { register } = useFormContext<PropertyFormData>();
  return (
    <div>
      <Label htmlFor={name as string} className="text-xs font-semibold">
        {Icon && <Icon className="mr-1 inline size-3.5 text-muted-foreground" />}
        {label}
        {!optional && <span className="text-destructive"> *</span>}
        {optional && (
          <span className="ml-1 text-[10px] font-normal text-muted-foreground">
            optionnel
          </span>
        )}
      </Label>
      <div className="relative mt-1">
        <Input
          id={name as string}
          type="number"
          inputMode="numeric"
          placeholder={placeholder ?? "0"}
          {...register(name as never, { valueAsNumber: true })}
          className={cn(suffix && "pr-10")}
        />
        {suffix && (
          <span className="absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
      <FieldError message={error} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// ÉTAPE 4 — ÉQUIPEMENTS
// ---------------------------------------------------------------------------

function Step4Amenities() {
  const { watch, setValue } = useFormContext<PropertyFormData>();

  const toggle = (key: keyof PropertyFormData) => {
    const current = watch(key) as boolean;
    setValue(key, !current as never, { shouldDirty: true });
  };

  const Tile = ({
    item,
  }: {
    item: { key: keyof PropertyFormData; label: string; icon: LucideIcon };
  }) => {
    const active = watch(item.key) as boolean;
    const Icon = item.icon;
    return (
      <button
        type="button"
        onClick={() => toggle(item.key)}
        className={cn(
          "group flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all",
          active
            ? "border-kaza-green bg-kaza-green/10"
            : "border-border hover:border-kaza-green/40 hover:bg-muted/40",
        )}
      >
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-lg transition-colors",
            active
              ? "bg-kaza-green text-white"
              : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="size-4" />
        </span>
        <span className="flex-1 text-sm font-medium text-foreground">
          {item.label}
        </span>
        <span
          className={cn(
            "flex size-5 items-center justify-center rounded-md border-2",
            active
              ? "border-kaza-green bg-kaza-green text-white"
              : "border-border bg-background",
          )}
        >
          {active && <Check className="size-3" strokeWidth={3} />}
        </span>
      </button>
    );
  };

  return (
    <div>
      <StepHeader
        title="Quels sont les équipements de votre bien ?"
        subtitle="Cochez tous les équipements et services disponibles."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {AMENITIES.map((a) => (
          <Tile key={a.key as string} item={a} />
        ))}
      </div>

      <div className="mt-8">
        <h4 className="mb-3 text-sm font-semibold text-foreground">Règles</h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {RULES.map((r) => (
            <Tile key={r.key as string} item={r} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ÉTAPE 5 — MÉDIAS
// ---------------------------------------------------------------------------

function Step5Media({ userId }: { userId: string }) {
  const { watch, setValue, register, formState } =
    useFormContext<PropertyFormData>();
  const photos = (watch("photos") ?? []) as string[];
  const panoramaUrl = watch("panorama360Url");
  const videoUrl = watch("videoUrl");
  const floorPlanUrl = watch("floorPlanUrl");

  return (
    <div>
      <StepHeader
        title="Ajoutez vos médias"
        subtitle="Min 3 photos requises. Une vue 360° augmente vos demandes de visite de 3x."
      />

      {/* PHOTOS */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">
            Photos{" "}
            <span className="text-destructive">*</span>{" "}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              ({photos.length} / 30 — min 3)
            </span>
          </h4>
        </div>

        <PhotoUploader
          userId={userId}
          initialPhotos={photos}
          maxPhotos={30}
          onChange={(urls) =>
            setValue("photos", urls, {
              shouldValidate: true,
              shouldDirty: true,
            })
          }
        />

        <FieldError message={formState.errors.photos?.message as string} />
      </section>

      {/* VIDÉO */}
      <section className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <Video className="size-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold text-foreground">
            Vidéo de visite{" "}
            <span className="text-xs font-normal text-muted-foreground">
              (optionnel)
            </span>
          </h4>
        </div>
        <Input
          placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
          {...register("videoUrl")}
        />
        {videoUrl && (
          <p className="mt-2 text-xs text-kaza-green">Vidéo enregistrée</p>
        )}
        <FieldError message={formState.errors.videoUrl?.message} />
      </section>

      {/* VUE 360° */}
      <section className="mb-8 rounded-2xl border-2 border-kaza-blue/30 bg-gradient-to-br from-kaza-blue/5 to-kaza-green/5 p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Compass className="size-5 text-kaza-blue" />
            <h4 className="text-sm font-semibold text-foreground">
              Vue 360°{" "}
              <Badge className="ml-1 bg-kaza-blue text-white">+3x visites</Badge>
            </h4>
          </div>
        </div>
        <Input
          placeholder="URL d'une image équirectangulaire (ratio 2:1)"
          {...register("panorama360Url")}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Importez l&apos;URL d&apos;une image panoramique équirectangulaire
          (ratio 2:1) de votre bien.
        </p>
        {panoramaUrl && (
          <div className="mt-4">
            <Panorama360Viewer src={panoramaUrl} height={300} />
          </div>
        )}
        <FieldError message={formState.errors.panorama360Url?.message} />
      </section>

      {/* PLAN */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <FileText className="size-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold text-foreground">
            Plan du bien{" "}
            <span className="text-xs font-normal text-muted-foreground">
              (optionnel)
            </span>
          </h4>
        </div>
        <Input
          placeholder="URL de l'image du plan"
          {...register("floorPlanUrl")}
        />
        {floorPlanUrl && (
          <div className="mt-3 overflow-hidden rounded-xl border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={floorPlanUrl}
              alt="Plan"
              className="max-h-60 w-full object-contain"
            />
          </div>
        )}
        <FieldError message={formState.errors.floorPlanUrl?.message} />
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ÉTAPE 6 — PRIX
// ---------------------------------------------------------------------------

function Step6Price() {
  const { register, watch, setValue, formState } =
    useFormContext<PropertyFormData>();

  const price = Number(watch("priceMonthly") ?? 0);
  const charges = Number(watch("charges") ?? 0);
  const deposit = Number(watch("depositMonths") ?? 0);
  const agency = Number(watch("agencyFees") ?? 0);
  const negotiable = watch("negotiable");
  const purpose = watch("listingPurpose");

  const totalEntry = price * deposit + agency + (price + charges);

  return (
    <div>
      <StepHeader
        title={purpose === "SALE" ? "Prix de vente" : "Prix et conditions"}
        subtitle={
          purpose === "SALE"
            ? "Indiquez le prix de vente et les frais éventuels."
            : "Loyer mensuel, charges et conditions financières."
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <Label htmlFor="priceMonthly" className="text-sm font-semibold">
            {purpose === "SALE" ? "Prix de vente" : "Loyer mensuel"}{" "}
            <span className="text-destructive">*</span>
          </Label>
          <div className="relative mt-1.5">
            <Input
              id="priceMonthly"
              type="number"
              inputMode="numeric"
              placeholder="150000"
              className="pr-16 text-lg font-semibold"
              {...register("priceMonthly", { valueAsNumber: true })}
            />
            <span className="absolute inset-y-0 right-3 flex items-center text-xs font-medium text-muted-foreground">
              FCFA
            </span>
          </div>
          {price > 0 && (
            <p className="mt-1.5 text-xs font-medium text-kaza-blue">
              ≈ {formatFCFA(price)}
              {purpose === "RENT" && " / mois"}
            </p>
          )}
          <FieldError message={formState.errors.priceMonthly?.message} />
        </div>

        <div>
          <Label htmlFor="charges" className="text-sm font-semibold">
            Charges mensuelles{" "}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              (eau, sécurité, ordures…)
            </span>
          </Label>
          <div className="relative mt-1.5">
            <Input
              id="charges"
              type="number"
              inputMode="numeric"
              placeholder="0"
              className="pr-16"
              {...register("charges", { valueAsNumber: true })}
            />
            <span className="absolute inset-y-0 right-3 flex items-center text-xs font-medium text-muted-foreground">
              FCFA
            </span>
          </div>
        </div>

        {purpose === "RENT" && (
          <>
            <div>
              <Label htmlFor="depositMonths" className="text-sm font-semibold">
                Dépôt de garantie{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  ({deposit} mois)
                </span>
              </Label>
              <input
                id="depositMonths"
                type="range"
                min={0}
                max={12}
                step={1}
                value={deposit}
                onChange={(e) =>
                  setValue("depositMonths", Number(e.target.value), {
                    shouldDirty: true,
                  })
                }
                className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-kaza-blue [&::-webkit-slider-thumb]:shadow"
              />
              <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                <span>0</span>
                <span>6</span>
                <span>12 mois</span>
              </div>
            </div>

            <div>
              <Label htmlFor="agencyFees" className="text-sm font-semibold">
                Frais d&apos;agence{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  (one-shot)
                </span>
              </Label>
              <div className="relative mt-1.5">
                <Input
                  id="agencyFees"
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  className="pr-16"
                  {...register("agencyFees", { valueAsNumber: true })}
                />
                <span className="absolute inset-y-0 right-3 flex items-center text-xs font-medium text-muted-foreground">
                  FCFA
                </span>
              </div>
            </div>
          </>
        )}

        <div className="lg:col-span-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-border p-4 hover:bg-muted/40">
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-md border-2 transition-colors",
                negotiable
                  ? "border-kaza-green bg-kaza-green text-white"
                  : "border-border",
              )}
            >
              {negotiable && <Check className="size-3" strokeWidth={3} />}
            </span>
            <input
              type="checkbox"
              className="sr-only"
              checked={!!negotiable}
              onChange={(e) =>
                setValue("negotiable", e.target.checked, { shouldDirty: true })
              }
            />
            <span className="flex-1">
              <span className="block text-sm font-semibold text-foreground">
                Prix négociable
              </span>
              <span className="block text-xs text-muted-foreground">
                Affiche un badge &quot;négociable&quot; sur l&apos;annonce.
              </span>
            </span>
          </label>
        </div>
      </div>

      {/* RÉCAP COÛT D'ENTRÉE */}
      {purpose === "RENT" && price > 0 && (
        <Card className="mt-6 border-kaza-blue/30 bg-kaza-blue/5 p-5">
          <h4 className="mb-3 text-sm font-semibold text-foreground">
            Coût total à l&apos;entrée du locataire
          </h4>
          <ul className="space-y-1.5 text-sm">
            <li className="flex justify-between text-muted-foreground">
              <span>Premier loyer + charges</span>
              <span className="font-medium text-foreground">
                {formatFCFAFull(price + charges)}
              </span>
            </li>
            <li className="flex justify-between text-muted-foreground">
              <span>
                Dépôt de garantie ({deposit} mois × {formatFCFA(price)})
              </span>
              <span className="font-medium text-foreground">
                {formatFCFAFull(price * deposit)}
              </span>
            </li>
            {agency > 0 && (
              <li className="flex justify-between text-muted-foreground">
                <span>Frais d&apos;agence</span>
                <span className="font-medium text-foreground">
                  {formatFCFAFull(agency)}
                </span>
              </li>
            )}
            <li className="mt-2 flex justify-between border-t pt-2 text-base font-bold text-kaza-navy">
              <span>Total</span>
              <span>{formatFCFAFull(totalEntry)}</span>
            </li>
          </ul>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ÉTAPE 7 — DISPONIBILITÉ + CIBLES
// ---------------------------------------------------------------------------

function Step7Availability() {
  const { register, watch, setValue, formState } =
    useFormContext<PropertyFormData>();

  const minStay = Number(watch("minStayMonths") ?? 12);
  const audiences = (watch("targetAudiences") ?? []) as string[];

  const toggleAudience = (key: (typeof TARGET_AUDIENCES)[number]) => {
    const next = audiences.includes(key)
      ? audiences.filter((a) => a !== key)
      : [...audiences, key];
    setValue("targetAudiences", next as never, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const todayISO = new Date().toISOString().split("T")[0];

  return (
    <div>
      <StepHeader
        title="Disponibilité et cibles"
        subtitle="Indiquez quand le bien sera disponible et qui vous souhaitez accueillir."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <Label htmlFor="availableFrom" className="text-sm font-semibold">
            Disponible à partir du{" "}
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="availableFrom"
            type="date"
            min={todayISO}
            className="mt-1.5"
            {...register("availableFrom")}
          />
          <FieldError message={formState.errors.availableFrom?.message} />
        </div>

        <div>
          <Label htmlFor="minStayMonths" className="text-sm font-semibold">
            Durée minimale de séjour{" "}
            <span className="text-xs font-normal text-muted-foreground">
              ({minStay} mois)
            </span>
          </Label>
          <input
            id="minStayMonths"
            type="range"
            min={1}
            max={120}
            step={1}
            value={minStay}
            onChange={(e) =>
              setValue("minStayMonths", Number(e.target.value), {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-kaza-blue [&::-webkit-slider-thumb]:shadow"
          />
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>1 mois</span>
            <span>12 mois</span>
            <span>10 ans</span>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Label className="text-sm font-semibold">
          Cibles{" "}
          <span className="text-xs font-normal text-muted-foreground">
            (choisissez au moins une)
          </span>{" "}
          <span className="text-destructive">*</span>
        </Label>
        <div className="mt-3 flex flex-wrap gap-2">
          {TARGET_AUDIENCES.map((key) => {
            const active = audiences.includes(key);
            const { label, icon: Icon } = TARGET_LABELS[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleAudience(key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border-2 px-4 py-2 text-sm font-medium transition-all",
                  active
                    ? "border-kaza-green bg-kaza-green text-white"
                    : "border-border bg-background hover:border-kaza-green/40",
                )}
              >
                <Icon className="size-4" />
                {label}
                {active && <Check className="size-3.5" strokeWidth={3} />}
              </button>
            );
          })}
        </div>
        <FieldError message={formState.errors.targetAudiences?.message as string} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ÉTAPE 8 — PUBLICATION + RÉCAP
// ---------------------------------------------------------------------------

function Step8Publish() {
  const { watch, setValue, register, formState } =
    useFormContext<PropertyFormData>();
  const v = watch();

  const statusOptions = [
    {
      value: "DRAFT" as const,
      title: "Brouillon",
      desc: "Vous pouvez continuer plus tard depuis votre tableau de bord.",
      icon: Save,
      colorClasses: "border-border bg-muted/30",
      activeClasses: "border-muted-foreground bg-muted",
      iconBg: "bg-muted-foreground/15 text-muted-foreground",
    },
    {
      value: "PUBLISHED" as const,
      title: "Publier maintenant",
      desc: "Votre annonce est visible immédiatement par tous les locataires.",
      icon: Sparkles,
      colorClasses: "border-kaza-green/40 bg-kaza-green/5",
      activeClasses: "border-kaza-green bg-kaza-green/10",
      iconBg: "bg-kaza-green text-white",
    },
    {
      value: "SCHEDULED" as const,
      title: "Programmer",
      desc: "Choisissez une date et heure de publication automatique.",
      icon: CalendarClock,
      colorClasses: "border-kaza-blue/40 bg-kaza-blue/5",
      activeClasses: "border-kaza-blue bg-kaza-blue/10",
      iconBg: "bg-kaza-blue text-white",
    },
  ];

  const country = v.countryCode ? getCountryByCode(v.countryCode) : undefined;
  const city =
    v.countryCode && v.citySlug
      ? getCityBySlug(v.countryCode, v.citySlug)
      : undefined;
  const neighborhood = city?.neighborhoods.find(
    (n) => n.slug === v.neighborhoodSlug,
  );
  const mainPhoto = v.photos?.[0];
  const propertyTypeLabel =
    PROPERTY_TYPE_CARDS.find((p) => p.value === v.type)?.label ?? v.type;

  const amenitiesCount = AMENITIES.filter((a) => v[a.key]).length;

  return (
    <div>
      <StepHeader
        title="Prêt à publier ?"
        subtitle="Choisissez votre mode de publication et vérifiez votre annonce avant validation."
      />

      {/* RADIO CARDS */}
      <div className="grid gap-3 sm:grid-cols-3">
        {statusOptions.map((opt) => {
          const Icon = opt.icon;
          const active = v.publishStatus === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() =>
                setValue("publishStatus", opt.value, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              className={cn(
                "group flex flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition-all",
                active ? opt.activeClasses : opt.colorClasses,
                active && "shadow-md",
              )}
            >
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl",
                  opt.iconBg,
                )}
              >
                <Icon className="size-5" />
              </span>
              <span className="text-base font-bold text-foreground">
                {opt.title}
              </span>
              <span className="text-xs text-muted-foreground">{opt.desc}</span>
              {active && (
                <CheckCircle2 className="ml-auto mt-1 size-5 text-foreground" />
              )}
            </button>
          );
        })}
      </div>

      {v.publishStatus === "SCHEDULED" && (
        <div className="mt-4 rounded-xl border bg-muted/30 p-4">
          <Label htmlFor="scheduledAt" className="text-sm font-semibold">
            Date et heure de publication automatique
          </Label>
          <Input
            id="scheduledAt"
            type="datetime-local"
            min={new Date().toISOString().slice(0, 16)}
            className="mt-1.5 max-w-sm"
            {...register("scheduledAt")}
          />
          <FieldError message={formState.errors.scheduledAt?.message} />
        </div>
      )}

      {/* PREMIUM */}
      <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-kaza-blue/40 bg-gradient-to-br from-kaza-blue/5 to-kaza-green/5 p-4 hover:border-kaza-blue">
        <span
          className={cn(
            "mt-0.5 flex size-5 items-center justify-center rounded-md border-2 transition-colors",
            v.premium
              ? "border-kaza-blue bg-kaza-blue text-white"
              : "border-border",
          )}
        >
          {v.premium && <Check className="size-3" strokeWidth={3} />}
        </span>
        <input
          type="checkbox"
          className="sr-only"
          checked={!!v.premium}
          onChange={(e) =>
            setValue("premium", e.target.checked, { shouldDirty: true })
          }
        />
        <span className="flex-1">
          <span className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Crown className="size-4 text-kaza-blue" />
            Booster mon annonce
            <Badge className="bg-kaza-blue text-white">+15 000 FCFA</Badge>
          </span>
          <span className="mt-1 block text-xs text-muted-foreground">
            7 jours en haut des résultats de recherche, badge &quot;Premium&quot;,
            et 3x plus de vues en moyenne.
          </span>
        </span>
      </label>

      {/* RÉCAP COMPLET */}
      <div className="mt-8 rounded-2xl border bg-card p-5">
        <h4 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          <Trophy className="size-4 text-kaza-blue" />
          Récapitulatif de votre annonce
        </h4>

        <div className="grid gap-5 md:grid-cols-[260px_1fr]">
          {/* PHOTO PRINCIPALE */}
          <div className="overflow-hidden rounded-xl border bg-muted">
            {mainPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mainPhoto}
                alt="Aperçu"
                className="aspect-[4/3] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[4/3] w-full items-center justify-center text-muted-foreground">
                <ImageIcon className="size-10" />
              </div>
            )}
            {v.photos?.length > 1 && (
              <div className="border-t px-3 py-1.5 text-center text-[11px] text-muted-foreground">
                +{v.photos.length - 1} autres photos
              </div>
            )}
          </div>

          {/* INFOS */}
          <div className="space-y-3 text-sm">
            <div>
              <h5 className="font-heading text-lg font-bold leading-tight text-foreground">
                {v.title || "(sans titre)"}
              </h5>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="size-3.5" />
                {neighborhood?.name && `${neighborhood.name}, `}
                {city?.name}
                {country && (
                  <>
                    {" "}— <CountryFlag code={country.code} className="h-2.5 w-3.5" />{" "}
                    {country.name}
                  </>
                )}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <RecapRow label="Type" value={propertyTypeLabel} />
              <RecapRow
                label="Usage"
                value={v.listingPurpose === "RENT" ? "Location" : "Vente"}
              />
              <RecapRow label="Surface" value={`${v.surface || 0} m²`} />
              <RecapRow
                label="Pièces"
                value={`${v.rooms || 0} pièces, ${v.bedrooms || 0} ch, ${v.bathrooms || 0} sdb`}
              />
              <RecapRow
                label="Loyer"
                value={
                  v.priceMonthly > 0
                    ? formatFCFAFull(v.priceMonthly) +
                      (v.listingPurpose === "RENT" ? " / mois" : "")
                    : "—"
                }
              />
              <RecapRow
                label="Charges"
                value={v.charges > 0 ? formatFCFAFull(v.charges) : "Aucune"}
              />
              <RecapRow
                label="Dépôt"
                value={`${v.depositMonths || 0} mois`}
              />
              <RecapRow
                label="Dispo"
                value={
                  v.availableFrom
                    ? new Date(v.availableFrom).toLocaleDateString("fr-FR")
                    : "—"
                }
              />
              <RecapRow
                label="Équipements"
                value={`${amenitiesCount} sélectionné${amenitiesCount > 1 ? "s" : ""}`}
              />
              <RecapRow
                label="Cibles"
                value={
                  v.targetAudiences?.length
                    ? v.targetAudiences
                        .map((a) => TARGET_LABELS[a].label)
                        .join(", ")
                    : "—"
                }
              />
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2">
              {v.panorama360Url && (
                <Badge className="gap-1 bg-kaza-blue text-white">
                  <Compass className="size-3" />
                  Vue 360°
                </Badge>
              )}
              {v.videoUrl && (
                <Badge variant="outline">
                  <Video className="mr-1 size-3" />
                  Vidéo
                </Badge>
              )}
              {v.floorPlanUrl && (
                <Badge variant="outline">
                  <FileText className="mr-1 size-3" />
                  Plan
                </Badge>
              )}
              {v.negotiable && <Badge variant="outline">Négociable</Badge>}
              {v.premium && (
                <Badge className="bg-kaza-blue text-white">
                  <Crown className="mr-1 size-3" />
                  Premium
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecapRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-dashed py-1.5 last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}
